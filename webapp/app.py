#!/usr/bin/env python3
"""
Flask web application for Local Leads Finder.
Provides a modern web interface for the lead generation tool.
"""
import os
import json
import time
import threading
from datetime import datetime
from flask import Flask, render_template, request, jsonify, Response, send_file, url_for
from flask_cors import CORS
from dotenv import load_dotenv
from pathlib import Path
import csv
import io

# Import core functionality
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from leads_finder.core.scraper_api_session import ScraperAPISession, DecodoUnauthorizedError
from leads_finder.core.dedupe import deduplicate_businesses
from leads_finder.providers.google_maps import GoogleMapsProvider

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Store active searches
active_searches = {}


# Error handlers to ensure all errors return JSON
@app.errorhandler(400)
def bad_request(error):
    """Handle 400 Bad Request errors."""
    return jsonify({'error': 'Bad Request', 'message': str(error)}), 400


@app.errorhandler(404)
def not_found(error):
    """Handle 404 Not Found errors."""
    return jsonify({'error': 'Not Found', 'message': str(error)}), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 Method Not Allowed errors."""
    return jsonify({'error': 'Method Not Allowed', 'message': str(error)}), 405


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 Internal Server errors."""
    return jsonify({'error': 'Internal Server Error', 'message': 'An unexpected error occurred'}), 500


@app.errorhandler(Exception)
def handle_exception(error):
    """Handle all uncaught exceptions."""
    # Log the error for debugging
    app.logger.error(f"Unhandled exception: {error}", exc_info=True)

    # Return JSON error response
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred. Please try again.'
    }), 500


class SearchProgress:
    """Track progress of a search operation."""
    def __init__(self, search_id: str):
        self.search_id = search_id
        self.status = "initializing"
        self.progress = 0
        self.message = "Starting search..."
        self.results = []
        self.error = None
        self.total_found = 0
        self.unique_count = 0
        self.completed = False

    def update(self, status: str = None, progress: int = None, message: str = None):
        """Update progress information."""
        if status:
            self.status = status
        if progress is not None:
            self.progress = max(0, min(100, progress))
        if message:
            self.message = message

    def set_results(self, results: list):
        """Set final results."""
        self.results = results
        self.unique_count = len(results)
        self.completed = True
        self.progress = 100
        self.status = "completed"
        self.message = f"Found {self.unique_count} unique businesses"

    def set_error(self, error: str):
        """Set error state."""
        self.error = error
        self.status = "error"
        self.completed = True


def perform_search(search_id: str, query: str, city: str, limit: int, country: str = None, enrich: bool = True,
                   latitude: float = None, longitude: float = None, radius_km: float = None,
                   username: str = None, password: str = None):
    """
    Perform the actual search in a background thread.
    """
    progress = active_searches[search_id]

    try:
        # Initialize session
        progress.update("connecting", 10, "Connecting to Decodo API...")
        time.sleep(0.5)  # Brief pause for UX

        session = ScraperAPISession(
            username=username,
            password=password,
            rps=1.0
        )

        # Initialize provider
        provider = GoogleMapsProvider(session)

        def report_collection_progress(collected: int, expected_total: int):
            """Update progress bar as results stream in."""
            if progress.completed:
                return

            target = expected_total or limit or 1
            # Prevent division by zero and keep ratio within [0, 1]
            ratio = min(max(collected / max(target, 1), 0.0), 1.0)

            base_progress = 30
            span = 40  # Allow dynamic updates up to ~70%
            dynamic_progress = base_progress + int(ratio * span)

            if collected > 0:
                dynamic_progress = max(dynamic_progress, base_progress + 1)

            # Keep room for processing / finalization stages
            dynamic_progress = min(dynamic_progress, 69)

            # Ensure we never move backwards
            if dynamic_progress < progress.progress:
                dynamic_progress = progress.progress

            message = f"Collecting results... {collected} found"
            progress.update(status="searching", progress=dynamic_progress, message=message)
            progress.total_found = collected

        # Determine search type and message
        if latitude is not None and longitude is not None:
            location_str = f"({latitude:.4f}, {longitude:.4f})"
            if radius_km:
                location_str += f" within {radius_km}km"
            progress.update("searching", 30, f"Searching for '{query}' near {location_str}...")
        else:
            progress.update("searching", 30, f"Searching Google Maps for '{query}' in {city}...")

        # Perform search
        enrich_msg = " with enrichment" if enrich else ""
        businesses = provider.search(
            query, city, limit,
            country=country,
            enrich=enrich,
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            progress_callback=report_collection_progress
        )
        progress.total_found = len(businesses)

        # Deduplicate
        progress.update("processing", 85, f"Processing {len(businesses)} results...")
        unique_businesses = deduplicate_businesses(businesses)

        # Complete
        progress.update("completed", 100, f"Found {len(unique_businesses)} unique businesses")
        progress.set_results(unique_businesses)

    except DecodoUnauthorizedError as e:
        progress.update(status="error", progress=100, message=str(e))
        progress.set_error(f"AUTH_REQUIRED::{str(e)}")
    except Exception as e:
        progress.update(status="error", progress=100, message=str(e))
        progress.set_error(str(e))


@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')


@app.route('/api/search', methods=['POST'])
def start_search():
    """Start a new search operation."""
    # Check if request has JSON data
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400

    # Get credentials from headers
    username = request.headers.get('X-Decodo-Username')
    password = request.headers.get('X-Decodo-Password')

    if not username or not password:
        return jsonify({'error': 'Missing API credentials. Please configure your Decodo credentials.'}), 401

    try:
        data = request.get_json()
    except Exception as e:
        return jsonify({'error': f'Invalid JSON: {str(e)}'}), 400

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Validate input
    try:
        query = (data.get('query') or '').strip()
        city = (data.get('city') or '').strip()
        limit = int(data.get('limit', 100))
        country = (data.get('country') or '').strip() or None
        enrich = data.get('enrich', True)  # Default to True (enrichment enabled)

        # Location-based search parameters
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        radius_km = data.get('radius_km')

        # Convert to proper types if provided
        if latitude is not None:
            latitude = float(latitude)
        if longitude is not None:
            longitude = float(longitude)
        if radius_km is not None:
            radius_km = float(radius_km)

    except (ValueError, TypeError, AttributeError) as e:
        return jsonify({'error': f'Invalid input data: {str(e)}'}), 400

    # Validate required fields based on search mode
    use_location = latitude is not None and longitude is not None

    if not query:
        return jsonify({'error': 'Business type (query) is required'}), 400

    if use_location:
        # Location-based search
        if radius_km is None or radius_km <= 0:
            return jsonify({'error': 'Radius must be specified for location-based search'}), 400
        if not (-90 <= latitude <= 90):
            return jsonify({'error': 'Latitude must be between -90 and 90'}), 400
        if not (-180 <= longitude <= 180):
            return jsonify({'error': 'Longitude must be between -180 and 180'}), 400
    else:
        # City-based search
        if not city:
            return jsonify({'error': 'City is required for city-based search'}), 400

    if limit < 1 or limit > 1000:
        return jsonify({'error': 'Limit must be between 1 and 1000'}), 400

    # Generate search ID
    search_id = f"{int(time.time())}_{query}_{city}".replace(' ', '_')

    # Create progress tracker
    progress = SearchProgress(search_id)
    active_searches[search_id] = progress

    # Start search in background thread
    thread = threading.Thread(
        target=perform_search,
        args=(search_id, query, city, limit, country, enrich, latitude, longitude, radius_km, username, password)
    )
    thread.daemon = True
    thread.start()

    return jsonify({
        'search_id': search_id,
        'status': 'started'
    })


@app.route('/api/search/<search_id>/progress')
def get_progress(search_id):
    """Get progress of a search operation."""
    progress = active_searches.get(search_id)

    if not progress:
        return jsonify({'error': 'Search not found'}), 404

    return jsonify({
        'search_id': search_id,
        'status': progress.status,
        'progress': progress.progress,
        'message': progress.message,
        'total_found': progress.total_found,
        'unique_count': progress.unique_count,
        'completed': progress.completed,
        'error': progress.error
    })


@app.route('/api/search/<search_id>/results')
def get_results(search_id):
    """Get results of a completed search."""
    progress = active_searches.get(search_id)

    if not progress:
        return jsonify({'error': 'Search not found'}), 404

    if not progress.completed:
        return jsonify({'error': 'Search not completed yet'}), 400

    return jsonify({
        'search_id': search_id,
        'results': progress.results,
        'count': len(progress.results)
    })


@app.route('/api/search/<search_id>/export/<format>')
def export_results(search_id, format):
    """Export results in CSV or JSON format."""
    progress = active_searches.get(search_id)

    if not progress:
        return jsonify({'error': 'Search not found'}), 404

    if not progress.completed:
        return jsonify({'error': 'Search not completed yet'}), 400

    results = progress.results

    if format == 'csv':
        # Generate CSV
        output = io.StringIO()

        if results:
            fieldnames = [
                'name', 'category', 'phone', 'email', 'website',
                'google_maps_url', 'rating', 'reviews_count',
                'address', 'city', 'country', 'lat', 'lon',
                'source', 'scraped_at'
            ]

            writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()

            for result in results:
                row = {field: result.get(field) for field in fieldnames}
                writer.writerow(row)

        # Create response
        output.seek(0)
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename=leads_{search_id}.csv'
            }
        )

    elif format == 'json':
        # Generate JSON
        output = json.dumps(results, indent=2)

        return Response(
            output,
            mimetype='application/json',
            headers={
                'Content-Disposition': f'attachment; filename=leads_{search_id}.json'
            }
        )

    else:
        return jsonify({'error': 'Invalid format. Use csv or json'}), 400


@app.route('/api/health')
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/robots.txt')
def robots_txt():
    """Serve robots.txt with sitemap reference."""
    sitemap_url = url_for('sitemap_xml', _external=True)
    content = "\n".join([
        "User-agent: *",
        "Allow: /",
        f"Sitemap: {sitemap_url}"
    ]) + "\n"
    return Response(content, mimetype='text/plain')


@app.route('/sitemap.xml')
def sitemap_xml():
    """Serve a simple XML sitemap for search engines."""
    base_urls = [
        {
            'loc': url_for('index', _external=True),
            'changefreq': 'weekly',
            'priority': '1.0'
        }
    ]

    generated = datetime.utcnow().date().isoformat()
    xml_parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]

    for entry in base_urls:
        xml_parts.extend([
            '  <url>',
            f"    <loc>{entry['loc']}</loc>",
            f"    <lastmod>{generated}</lastmod>",
            f"    <changefreq>{entry['changefreq']}</changefreq>",
            f"    <priority>{entry['priority']}</priority>",
            '  </url>'
        ])

    xml_parts.append('</urlset>')

    return Response("\n".join(xml_parts), mimetype='application/xml')


def find_free_port(start_port=5000, max_attempts=10):
    """Find an available port starting from start_port."""
    import socket

    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue

    raise OSError(f"No free ports found between {start_port} and {start_port + max_attempts}")


if __name__ == '__main__':
    # Use environment variable to preserve port across Flask reloader restarts
    port = os.environ.get('FLASK_RUN_PORT')

    if port:
        # Reloader restart - use existing port
        port = int(port)
    else:
        # First run - find available port
        print("=" * 60)
        print("Local Leads Finder - Web Interface")
        print("=" * 60)
        print("\nStarting server...")

        try:
            port = find_free_port(5000)
            os.environ['FLASK_RUN_PORT'] = str(port)
            print(f"Open your browser to: http://localhost:{port}")
            print("\nPress Ctrl+C to stop the server\n")
        except OSError as e:
            print(f"\n❌ Error: {e}")
            print("\nTip: Try closing other applications or use a different port.")
            sys.exit(1)

    app.run(
        host='0.0.0.0',
        port=port,
        debug=True,
        threaded=True
    )
