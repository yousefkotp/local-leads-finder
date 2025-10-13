"""
HTML and JSON parsing utilities for extracting business data.
"""
from typing import Optional
from bs4 import BeautifulSoup
import re


def normalize_phone(phone: Optional[str]) -> Optional[str]:
    """
    Normalize phone number by removing non-digit characters.

    Args:
        phone: Raw phone number string

    Returns:
        Normalized phone number or None
    """
    if not phone:
        return None

    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)

    # Return None if too short
    if len(digits) < 10:
        return None

    return digits


def normalize_url(url: Optional[str]) -> Optional[str]:
    """
    Normalize URL by ensuring it has a scheme.

    Args:
        url: Raw URL string

    Returns:
        Normalized URL or None
    """
    if not url:
        return None

    url = url.strip()

    # Add https if no scheme
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    return url


def normalize_business_name(name: Optional[str]) -> str:
    """
    Normalize business name for comparison.

    Args:
        name: Raw business name

    Returns:
        Normalized name (lowercase, stripped, no extra spaces)
    """
    if not name:
        return ""

    # Convert to lowercase, strip, and collapse multiple spaces
    normalized = re.sub(r'\s+', ' ', name.strip().lower())
    return normalized


def extract_text(soup: BeautifulSoup, selector: str) -> Optional[str]:
    """
    Extract text from HTML using CSS selector.

    Args:
        soup: BeautifulSoup object
        selector: CSS selector

    Returns:
        Extracted text or None
    """
    element = soup.select_one(selector)
    if element:
        return element.get_text(strip=True)
    return None


def extract_attr(soup: BeautifulSoup, selector: str, attr: str) -> Optional[str]:
    """
    Extract attribute value from HTML using CSS selector.

    Args:
        soup: BeautifulSoup object
        selector: CSS selector
        attr: Attribute name

    Returns:
        Attribute value or None
    """
    element = soup.select_one(selector)
    if element:
        return element.get(attr)
    return None


def clean_text(text: Optional[str]) -> Optional[str]:
    """
    Clean text by removing extra whitespace and special characters.

    Args:
        text: Raw text

    Returns:
        Cleaned text or None
    """
    if not text:
        return None

    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text.strip())

    # Remove zero-width characters
    text = re.sub(r'[\u200b-\u200d\ufeff]', '', text)

    return text if text else None
