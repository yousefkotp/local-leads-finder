"""
Deduplication logic for business leads across multiple data sources.
"""
from typing import List, Dict, Any, Optional
import Levenshtein
from .parser import normalize_business_name, normalize_phone


def generate_business_key(business: Dict[str, Any]) -> str:
    """
    Generate a unique key for a business based on name, city, and phone.

    Args:
        business: Business data dictionary

    Returns:
        Unique key string
    """
    name = normalize_business_name(business.get("name", ""))
    city = (business.get("city") or "").lower().strip()
    phone = normalize_phone(business.get("phone"))

    # Use phone if available, otherwise just name + city
    if phone:
        return f"{name}|{city}|{phone}"
    else:
        return f"{name}|{city}"


def are_similar(text1: str, text2: str, threshold: float = 0.85) -> bool:
    """
    Check if two text strings are similar using Levenshtein distance.

    Args:
        text1: First text
        text2: Second text
        threshold: Similarity threshold (0-1)

    Returns:
        True if similar, False otherwise
    """
    if not text1 or not text2:
        return False

    # Normalize
    text1 = text1.lower().strip()
    text2 = text2.lower().strip()

    # Exact match
    if text1 == text2:
        return True

    # Calculate similarity ratio
    ratio = Levenshtein.ratio(text1, text2)
    return ratio >= threshold


def is_duplicate(business: Dict[str, Any], existing: List[Dict[str, Any]]) -> bool:
    """
    Check if a business is a duplicate of any existing business.

    Uses exact matching on key (name|city|phone) and fuzzy matching
    on business name as fallback.

    Args:
        business: Business to check
        existing: List of existing businesses

    Returns:
        True if duplicate, False otherwise
    """
    business_key = generate_business_key(business)
    business_name = normalize_business_name(business.get("name", ""))

    for existing_business in existing:
        existing_key = generate_business_key(existing_business)
        existing_name = normalize_business_name(existing_business.get("name", ""))

        # Exact key match
        if business_key == existing_key:
            return True

        # Fuzzy name match in same city
        if business.get("city") == existing_business.get("city"):
            if are_similar(business_name, existing_name, threshold=0.90):
                return True

    return False


def deduplicate_businesses(businesses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Remove duplicate businesses from a list.

    Args:
        businesses: List of business dictionaries

    Returns:
        Deduplicated list of businesses
    """
    unique_businesses = []
    seen_keys = set()

    for business in businesses:
        # Generate key
        key = generate_business_key(business)

        # Check if we've seen this exact key
        if key in seen_keys:
            continue

        # Check for fuzzy duplicates
        if not is_duplicate(business, unique_businesses):
            unique_businesses.append(business)
            seen_keys.add(key)

    return unique_businesses


def merge_businesses(
    business1: Dict[str, Any],
    business2: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Merge two business records, preferring non-null values.

    Args:
        business1: First business record
        business2: Second business record

    Returns:
        Merged business record
    """
    merged = {}

    # Get all keys from both businesses
    all_keys = set(business1.keys()) | set(business2.keys())

    for key in all_keys:
        val1 = business1.get(key)
        val2 = business2.get(key)

        # Prefer non-null, non-empty values
        if val1 and not val2:
            merged[key] = val1
        elif val2 and not val1:
            merged[key] = val2
        elif val1 and val2:
            # Both have values - prefer the longer/more complete one
            if len(str(val1)) >= len(str(val2)):
                merged[key] = val1
            else:
                merged[key] = val2

    return merged
