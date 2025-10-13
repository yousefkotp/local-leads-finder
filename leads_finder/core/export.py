"""
Export functionality for business leads.
"""
import csv
from typing import List, Dict, Any
from pathlib import Path


# Define standard CSV columns as per PRD
CSV_COLUMNS = [
    "name",
    "category",
    "phone",
    "website",
    "rating",
    "reviews_count",
    "address",
    "city",
    "country",
    "lat",
    "lon",
    "source",
    "scraped_at",
]


def export_to_csv(businesses: List[Dict[str, Any]], output_path: str) -> None:
    """
    Export businesses to CSV file.

    Args:
        businesses: List of business dictionaries
        output_path: Path to output CSV file
    """
    if not businesses:
        print("No businesses to export")
        return

    # Ensure directory exists
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # Write CSV
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction="ignore")
        writer.writeheader()

        for business in businesses:
            # Ensure all columns are present (use None for missing)
            row = {col: business.get(col) for col in CSV_COLUMNS}
            writer.writerow(row)

    print(f"✓ Exported {len(businesses)} businesses to {output_path}")


def export_to_json(businesses: List[Dict[str, Any]], output_path: str) -> None:
    """
    Export businesses to JSON file.

    Args:
        businesses: List of business dictionaries
        output_path: Path to output JSON file
    """
    import json

    if not businesses:
        print("No businesses to export")
        return

    # Ensure directory exists
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # Write JSON
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(businesses, f, indent=2, ensure_ascii=False)

    print(f"✓ Exported {len(businesses)} businesses to {output_path}")
