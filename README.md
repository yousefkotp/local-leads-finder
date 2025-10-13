# Local Leads Finder

**Fast, scalable local business lead generation powered by [Decodo](https://decodo.io) Web Scraping API.**

Turn a simple keyword and city into a ready-to-use dataset of local businesses from Google Maps. Perfect for freelancers, agencies, and SMBs who need quality leads at scale.

## Features

- **Simple CLI**: One command to collect hundreds of local business leads
- **Google Maps**: Native Google Maps support with automatic parsing
- **Clean output**: Deduplicated CSV with name, phone, website, rating, address
- **Rate limiting**: Built-in request throttling
- **Geo-targeting**: Target specific cities and countries
- **Docker ready**: Run anywhere with Docker

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/local-leads-finder.git
cd local-leads-finder

# Install dependencies
pip install -r requirements.txt

# Or install as a package
pip install -e .
```

### 2. Get Decodo Credentials

Get your Scraper API credentials from [Decodo Dashboard](https://decodo.io/dashboard):

1. Navigate to **"Scraper"** tab
2. Find your **username** and **password**

### 3. Configure Environment

```bash
# Create .env file
cp .env.example .env

# Add your credentials
echo "DECODO_USERNAME=your_username" >> .env
echo "DECODO_PASSWORD=your_password" >> .env
echo "DECODO_KEY=your_key" >> .env
```

### 4. Test Connection

```bash
python test_connection.py
```

Expected output:
```
SUCCESS!
Found 5 businesses:

1. Toronto Dental Office
   Address: 123 Main St, Toronto, ON
   Rating: 4.5
   Phone: (416) 555-0123

Google Maps Scraper API is working!
```

### 5. Start Collecting Leads

```bash
leads-finder --query "dentist" --city "Toronto" --out leads.csv
```

## Usage

### Basic Examples

```bash
# Find dentists in Toronto
leads-finder --query "dentist" --city "Toronto" --out toronto_dentists.csv

# Find pizza places in New York (200 results)
leads-finder --query "pizza" --city "New York" --limit 200 --out nyc_pizza.csv

# Find plumbers in Montreal
leads-finder --query "plumber" --city "Montreal" --out montreal_plumbers.csv
```

### CLI Options

```bash
leads-finder --help
```

| Option | Description | Default |
|--------|-------------|---------|
| `--query` | Search keyword (e.g., "dentist", "pizza") | Required |
| `--city` | Target city name | Required |
| `--limit` | Max results to collect | `100` |
| `--out` | Output file (CSV or JSON) | `leads.csv` |
| `--rps` | Requests per second rate limit | `1.0` |
| `--username` | Decodo username | `DECODO_USERNAME` env var |
| `--password` | Decodo password | `DECODO_PASSWORD` env var |

### Batch Processing

```bash
# Process multiple cities
for city in "Toronto" "Montreal" "Vancouver"; do
  leads-finder --query "dentist" --city "$city" --out "dentists_$city.csv"
done
```

### Export to JSON

```bash
leads-finder --query "gym" --city "Los Angeles" --out gyms.json
```

## Output Format

CSV file with the following columns:

| Field | Description |
|-------|-------------|
| `name` | Business name |
| `category` | Primary category or type |
| `phone` | Contact number |
| `website` | Business website |
| `rating` | Google Maps rating (1-5) |
| `reviews_count` | Number of reviews |
| `address` | Full address |
| `city` | City name |
| `country` | Country code (US, CA, etc.) |
| `lat` | Latitude |
| `lon` | Longitude |
| `source` | Data source (Google Maps) |
| `scraped_at` | ISO timestamp |

## How It Works

1. **API Call**: Makes requests to Decodo's Web Scraping API with Google Maps target
2. **Geo-Targeting**: Routes requests through the specified city for accurate local results
3. **Parsing**: Decodo automatically parses Google Maps data into structured JSON
4. **Deduplication**: Removes duplicate businesses using fuzzy matching
5. **Export**: Saves clean CSV/JSON with standardized business information

## Docker Usage

### Build the image

```bash
docker build -t leads-finder .
```

### Run with Docker

```bash
docker run --rm \
  -e DECODO_USERNAME=your_username \
  -e DECODO_PASSWORD=your_password \
  -e DECODO_KEY=your_key \
  -v $(pwd)/output:/out \
  leads-finder \
  --query "dentist" --city "Toronto" --out /out/leads.csv
```

## Decodo Integration

This tool uses **Decodo's Web Scraping API** for:

- **Google Maps Support**: Native API integration with automatic parsing
- **Geo-targeting**: Get results specific to target cities
- **Anti-bot Protection**: Decodo handles CAPTCHAs and blocks
- **Reliability**: Built-in retries and error handling
- **Scale**: Handle hundreds of requests with ease

### API Request Example

```python
from leads_finder.core.scraper_api_session import ScraperAPISession

session = ScraperAPISession(username="user", password="pass")
results = session.google_maps_search(
    query="dentist",
    geo="Toronto",
    limit=100
)
businesses = results.get("results", [])
```

## Project Structure

```
local-leads-finder/
├── leads_finder/
│   ├── core/
│   │   ├── cli.py                    # Command-line interface
│   │   ├── scraper_api_session.py    # Decodo API wrapper
│   │   ├── dedupe.py                 # Deduplication logic
│   │   ├── export.py                 # CSV/JSON export
│   │   └── parser.py                 # Data parsing utilities
│   └── providers/
│       └── google_maps.py            # Google Maps provider
├── test_connection.py                # Connection test script
├── requirements.txt                  # Python dependencies
├── setup.py                          # Package installer
├── Dockerfile                        # Docker container
├── SETUP.md                          # Detailed setup guide
└── README.md                         # This file
```

## Roadmap

### Phase 2: Enrichment
- [ ] Email finding from websites
- [ ] Social media profiles
- [ ] Business hours and amenities

### Phase 3: UI & Automation
- [ ] Web dashboard
- [ ] Scheduled scraping
- [ ] API endpoint for integrations

## Contributing

Contributions welcome! Please open an issue or PR.

## Author

[Yousef Kotp](https://github.com/yousefkotp/)
