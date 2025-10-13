"""Google Maps provider using Decodo Scraper API."""
from datetime import datetime
import json
import re
from html import unescape
from typing import Dict, Any, List, Optional, Set

from bs4 import BeautifulSoup

from ..core.scraper_api_session import ScraperAPISession

COUNTRY_SETTINGS = {
    "US": {"name": "United States", "locale": "en-US", "domain": "com"},
    "CA": {"name": "Canada", "locale": "en-CA", "domain": "ca"},
    "GB": {"name": "United Kingdom", "locale": "en-GB", "domain": "co.uk"},
    "UK": {"name": "United Kingdom", "locale": "en-GB", "domain": "co.uk"},
    "AU": {"name": "Australia", "locale": "en-AU", "domain": "com.au"},
    "NZ": {"name": "New Zealand", "locale": "en-NZ", "domain": "co.nz"},
    "IE": {"name": "Ireland", "locale": "en-IE", "domain": "ie"},
}


class GoogleMapsProvider:
    """
    Scrape business data from Google Maps using Decodo Scraper API.

    This is much simpler than manual scraping - Decodo handles everything!
    """

    def __init__(self, session: ScraperAPISession):
        """
        Initialize Google Maps provider.

        Args:
            session: ScraperAPISession instance
        """
        self.session = session

    def search(self, query: str, city: str, limit: int = 100, country: str = None, enrich: bool = True) -> List[Dict[str, Any]]:
        """
        Search for businesses on Google Maps.

        Args:
            query: Search keyword (e.g., "dentist", "pizza")
            city: City name
            limit: Maximum number of results
            country: Optional country code (e.g., "US", "CA")
            enrich: If True, fetch additional contact details (phone, email, website) for each business

        Returns:
            List of business dictionaries
        """
        if limit <= 0:
            return []

        businesses: List[Dict[str, Any]] = []
        seen_ids: Set[Any] = set()
        page = 1
        detail_cache: Dict[str, Dict[str, Optional[str]]] = {}

        try:
            # Make API call
            print(f"Google Maps: Searching for '{query}' in {city}...")

            geo = self._build_geo(city, country)
            locale = self._derive_locale(country)
            domain = self._derive_domain(country)

            while len(businesses) < limit:
                response = self.session.google_maps_search(
                    query=f"{query} {city}",
                    geo=geo,
                    limit=limit,
                    locale=locale,
                    domain=domain,
                    google_results_language="en",
                    page_from=str(page),
                )

                results = response.get("results", [])
                if not results:
                    break

                page_count = 0

                for item in results:
                    html = item.get("content")
                    if not html:
                        continue

                    remaining = max(limit - len(businesses), 0)
                    if remaining == 0:
                        break

                    parsed = self._parse_results_html(html, city, remaining, seen_ids)
                    if enrich:
                        for business in parsed:
                            self._enrich_business_details(
                                business,
                                domain=domain,
                                locale=locale,
                                cache=detail_cache,
                            )
                    if parsed:
                        page_count += len(parsed)
                        businesses.extend(parsed)

                if page_count == 0:
                    break

                page += 1

            print(f"Google Maps: Found {len(businesses)} businesses")

        except Exception as e:
            print(f"Google Maps search error: {e}")

        return businesses

    def _match_country_code(self, country: Optional[str]) -> Optional[str]:
        if not country:
            return None

        candidate = country.strip()
        if not candidate:
            return None

        upper = candidate.upper()
        if upper in COUNTRY_SETTINGS:
            return upper

        lower = candidate.lower()
        for code, data in COUNTRY_SETTINGS.items():
            if lower == data["name"].lower():
                return code

        return None

    def _build_geo(self, city: str, country: Optional[str]) -> str:
        code = self._match_country_code(country)
        if code and code in COUNTRY_SETTINGS:
            country_name = COUNTRY_SETTINGS[code]["name"]
            return f"{city}, {country_name}"
        return city

    def _derive_locale(self, country: Optional[str]) -> str:
        code = self._match_country_code(country)
        if code and code in COUNTRY_SETTINGS:
            return COUNTRY_SETTINGS[code].get("locale", "en-US")
        return "en-US"

    def _derive_domain(self, country: Optional[str]) -> str:
        code = self._match_country_code(country)
        if code and code in COUNTRY_SETTINGS:
            return COUNTRY_SETTINGS[code].get("domain", "com")
        return "com"

    def _parse_results_html(self, html: str, city: str, limit: int, seen_ids: Set[Any]) -> List[Dict[str, Any]]:
        """Parse HTML returned from Decodo into business dictionaries."""
        soup = BeautifulSoup(html, "lxml")
        listings = []

        for block in soup.select("div.VkpGBb"):
            business = self._parse_listing_block(block, city)
            if business:
                identifier = business.get("google_cid")
                if not identifier:
                    identifier = (business["name"].lower(), business.get("address") or "")
                if identifier in seen_ids:
                    continue
                seen_ids.add(identifier)
                listings.append(business)

            if limit and len(listings) >= limit:
                break

        return listings

    def _parse_listing_block(self, block, city: str) -> Dict[str, Any]:
        """Convert a single Google local listing block into a business dict."""
        details = block.select_one("div.rllt__details")
        if not details:
            return None

        divs = details.find_all("div")
        if not divs:
            return None

        name = divs[0].get_text(" ", strip=True)
        if not name:
            return None

        lines = [div.get_text(" ", strip=True) for div in divs[1:]]

        rating = None
        reviews_count = None
        category = None

        if lines:
            rating_line = lines[0]
            rating_match = re.search(r"([0-9]+(?:[\.,][0-9]+)?)", rating_line)
            if rating_match:
                try:
                    rating = float(rating_match.group(1).replace(",", "."))
                except ValueError:
                    rating = None

            reviews_match = re.search(r"\(([^)]+)\)", rating_line)
            if reviews_match:
                reviews_digits = re.sub(r"\D", "", reviews_match.group(1))
                if reviews_digits:
                    try:
                        reviews_count = int(reviews_digits)
                    except ValueError:
                        reviews_count = None

            if "·" in rating_line:
                category = rating_line.split("·")[-1].strip()

        distance = None
        address = None
        status = None
        review_snippet = None

        status_tokens = [
            "open",
            "closed",
            "closes",
            "opens",
            "hours",
            "aberto",
            "fechado",
        ]

        for line in lines[1:]:
            if not line:
                continue

            if line.startswith("\"") and not review_snippet:
                review_snippet = line.strip('"')
                continue

            lowered = line.lower()

            if "·" in line and not address:
                parts = [part.strip() for part in line.split("·") if part.strip()]
                if parts:
                    first = parts[0]
                    if any(unit in first for unit in ["km", "m", "mi", "ft"]):
                        distance = first
                        if len(parts) > 1:
                            address = " · ".join(parts[1:])
                            continue
                    address = " · ".join(parts)
                continue

            if not address and not any(token in lowered for token in status_tokens):
                address = line
                continue

            if any(token in lowered for token in status_tokens):
                status = line

        cid = None
        maps_url = None
        link = block.select_one("a[data-cid]")
        if link and link.has_attr("data-cid"):
            cid = link["data-cid"]
            maps_url = f"https://www.google.com/maps?cid={cid}"

        return {
            "name": name,
            "category": category,
            "phone": None,
            "email": None,
            "website": maps_url,
            "rating": rating,
            "reviews_count": reviews_count,
            "address": address,
            "city": city,
            "country": None,
            "lat": None,
            "lon": None,
            "source": "Google Maps",
            "scraped_at": datetime.utcnow().isoformat(),
            "distance": distance,
            "status": status,
            "review_snippet": review_snippet,
            "google_cid": cid,
            "google_maps_url": maps_url,
        }

    def _enrich_business_details(
        self,
        business: Dict[str, Any],
        domain: str,
        locale: str,
        cache: Dict[str, Dict[str, Optional[str]]],
    ) -> None:
        """Fetch additional contact details (phone/email/website) for a business."""
        cid = business.get("google_cid")
        if not cid:
            return

        cached = cache.get(cid)
        if cached is None:
            try:
                response = self.session.google_maps_place_details(
                    cid=cid,
                    domain=domain,
                    locale=locale,
                )
                html = None
                for result in response.get("results", []):
                    content = result.get("content")
                    if content:
                        html = content
                        break
                cached = self._extract_contact_details(html)
            except Exception as exc:
                print(f"Google Maps: Failed to enrich CID {cid}: {exc}")
                cached = {}
            cache[cid] = cached

        if not cached:
            return

        phone = cached.get("phone")
        if phone:
            business["phone"] = phone

        website = cached.get("website")
        if website:
            business["website"] = website

        email = cached.get("email")
        if email:
            business["email"] = email

    def _extract_contact_details(self, html: Optional[str]) -> Dict[str, Optional[str]]:
        """Parse phone, email, and website from a Google Maps place HTML page."""
        details: Dict[str, Optional[str]] = {
            "phone": None,
            "email": None,
            "website": None,
        }

        if not html:
            return details

        try:
            init_match = re.search(
                r"APP_INITIALIZATION_STATE=(.*?);window\.APP_FLAGS", html
            )
            if init_match:
                state = json.loads(init_match.group(1))
                blob = None
                if isinstance(state, list) and len(state) > 3:
                    section = state[3]
                    if isinstance(section, list) and len(section) > 6:
                        blob = section[6]
                if isinstance(blob, str) and blob.startswith(")]}'"):
                    place_data = json.loads(blob[4:])
                    if (
                        isinstance(place_data, list)
                        and len(place_data) > 6
                        and isinstance(place_data[6], list)
                    ):
                        for entry in place_data[6]:
                            if not isinstance(entry, list):
                                continue

                            if len(entry) > 5 and isinstance(entry[5], list):
                                tel_meta = entry[5][0] if entry[5] else None
                                if (
                                    isinstance(tel_meta, str)
                                    and tel_meta.startswith("tel:")
                                ):
                                    pretty = (
                                        entry[0]
                                        if entry and isinstance(entry[0], str)
                                        else tel_meta.split(":", 1)[-1]
                                    )
                                    details["phone"] = (
                                        pretty.replace("\u202a", "")
                                        .replace("\u202c", "")
                                        .strip()
                                    )

                            if entry and isinstance(entry[0], str):
                                candidate = unescape(entry[0])
                                if candidate.startswith("http"):
                                    lowered = candidate.lower()
                                    if "google.com/maps" in lowered:
                                        continue
                                    if lowered.startswith("https://maps.app.goo.gl"):
                                        continue
                                    if not details["website"]:
                                        details["website"] = candidate
        except Exception:
            pass

        if not details["phone"]:
            tel_match = re.search(r"tel:\+?[0-9][0-9\s().-]{6,}", html)
            if tel_match:
                details["phone"] = tel_match.group(0).split(":", 1)[-1].strip()

        email_match = re.search(
            r"mailto:([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})",
            html,
            re.IGNORECASE,
        )
        if email_match:
            details["email"] = email_match.group(1)

        return details
