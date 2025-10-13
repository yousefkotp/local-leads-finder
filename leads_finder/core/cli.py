#!/usr/bin/env python3
"""
Command-line interface for Local Leads Finder using Decodo Scraper API.
"""
import sys
import click
from dotenv import load_dotenv

from .scraper_api_session import ScraperAPISession
from .dedupe import deduplicate_businesses
from .export import export_to_csv, export_to_json
from ..providers.google_maps import GoogleMapsProvider


# Load environment variables
load_dotenv()


# Provider mapping
PROVIDERS = {
    "google": GoogleMapsProvider,
    "googlemaps": GoogleMapsProvider,
    "gmaps": GoogleMapsProvider,
}


@click.command()
@click.option(
    "--query",
    required=True,
    help="Search keyword (e.g., 'dentist', 'pizza restaurant')",
)
@click.option(
    "--city",
    required=True,
    help="Target city name (e.g., 'Toronto', 'Vancouver')",
)
@click.option(
    "--providers",
    default="google",
    help="Comma-separated list of providers (google, googlemaps, gmaps)",
)
@click.option(
    "--limit",
    default=100,
    type=int,
    help="Maximum number of businesses per provider",
)
@click.option(
    "--out",
    default="leads.csv",
    help="Output file path (CSV or JSON)",
)
@click.option(
    "--rps",
    default=1.0,
    type=float,
    help="Requests per second rate limit",
)
@click.option(
    "--country",
    default=None,
    help="ISO-2 country code for geo-targeting (e.g., 'US', 'CA')",
)
@click.option(
    "--username",
    default=None,
    help="Decodo username (or set DECODO_USERNAME env var)",
)
@click.option(
    "--password",
    default=None,
    help="Decodo password (or set DECODO_PASSWORD env var)",
)
def main(query: str, city: str, providers: str, limit: int, out: str, rps: float, country: str, username: str, password: str):
    """
    Local Leads Finder - Collect local business leads using Decodo Scraper API.

    Example:
        leads-finder --query "dentist" --city "Toronto" --out leads.csv
    """
    print(f"🔍 Searching for '{query}' in {city}...")
    print(f"📍 Providers: {providers}")
    print(f"🎯 Limit: {limit} per provider")

    # Parse providers
    provider_list = [p.strip().lower() for p in providers.split(",")]

    # Validate providers
    invalid_providers = [p for p in provider_list if p not in PROVIDERS]
    if invalid_providers:
        print(f"❌ Invalid providers: {', '.join(invalid_providers)}")
        print(f"   Available: {', '.join(PROVIDERS.keys())}")
        sys.exit(1)

    # Initialize Scraper API session
    try:
        session = ScraperAPISession(
            username=username,
            password=password,
            rps=rps,
        )
        print("✓ Decodo Scraper API session initialized")
    except ValueError as e:
        print(f"❌ {e}")
        sys.exit(1)

    # Collect businesses from all providers
    all_businesses = []

    for provider_name in provider_list:
        print(f"\n📡 Fetching from {provider_name.upper()}...")

        try:
            provider_class = PROVIDERS[provider_name]
            provider = provider_class(session)
            businesses = provider.search(query, city, limit, country=country)
            all_businesses.extend(businesses)
        except Exception as e:
            print(f"❌ Error with {provider_name}: {e}")
            continue

    # Deduplicate
    print(f"\n🔄 Deduplicating {len(all_businesses)} businesses...")
    unique_businesses = deduplicate_businesses(all_businesses)
    print(f"✓ {len(unique_businesses)} unique businesses found")

    # Export
    if not unique_businesses:
        print("❌ No businesses found")
        sys.exit(0)

    print(f"\n💾 Exporting to {out}...")

    if out.endswith(".json"):
        export_to_json(unique_businesses, out)
    else:
        export_to_csv(unique_businesses, out)

    print(f"\n✅ Done! Found {len(unique_businesses)} leads")


if __name__ == "__main__":
    main()
