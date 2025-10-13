"""
Decodo Web Scraping API session manager.
"""
import os
import time
from typing import Optional, Dict, Any
import requests
from requests.auth import HTTPBasicAuth


class DecodoUnauthorizedError(Exception):
    """Raised when the Decodo API rejects supplied credentials."""


class ScraperAPISession:
    """
    Session manager for Decodo Web Scraping API.

    Much simpler than proxy-based scraping - just make API calls
    and get structured data back!
    """

    def __init__(
        self,
        username: Optional[str] = None,
        password: Optional[str] = None,
        rps: float = 1.0,
        api_endpoint: str = "https://scraper-api.decodo.com/v2/scrape",
    ):
        """
        Initialize Scraper API session.

        Args:
            username: Decodo scraper API username (defaults to DECODO_USERNAME env var)
            password: Decodo scraper API password (defaults to DECODO_PASSWORD env var)
            rps: Requests per second rate limit
            api_endpoint: Scraper API endpoint
        """
        self.username = username or os.getenv("DECODO_USERNAME")
        self.password = password or os.getenv("DECODO_PASSWORD")

        if not self.username or not self.password:
            raise ValueError(
                "Decodo credentials required. Set DECODO_USERNAME and DECODO_PASSWORD env vars "
                "or pass username and password parameters. "
                "Get credentials from: Decodo Dashboard → Scraper tab"
            )

        self.rps = rps
        self.api_endpoint = api_endpoint
        self.last_request_time = 0
        self.auth = HTTPBasicAuth(self.username, self.password)

    def _rate_limit(self):
        """Enforce rate limiting based on rps setting."""
        if self.rps > 0:
            min_interval = 1.0 / self.rps
            elapsed = time.time() - self.last_request_time
            if elapsed < min_interval:
                time.sleep(min_interval - elapsed)
        self.last_request_time = time.time()

    def scrape(
        self,
        target: str,
        query: Optional[str] = None,
        geo: Optional[str] = None,
        parse: Optional[bool] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Make a scraping request using Decodo Scraper API.

        Args:
            target: Target template (e.g., 'google_maps', 'google_search')
            query: Search query
            geo: Geographic location (city name, country, or coordinates)
            parse: Return parsed JSON data (True) or raw HTML (False); omit parameter when None
            **kwargs: Additional parameters for the target

        Returns:
            Dictionary with scraping results

        Raises:
            requests.exceptions.RequestException: If request fails
        """
        self._rate_limit()

        # Build request payload
        payload = {
            "target": target,
            **kwargs
        }

        if query:
            payload["query"] = query

        if geo:
            payload["geo"] = geo

        if parse is not None:
            payload["parse"] = parse

        try:
            response = requests.post(
                self.api_endpoint,
                json=payload,
                auth=self.auth,
                headers={"Content-Type": "application/json"},
                timeout=(10, 60)  # Longer timeout for rendering
            )

            if response.status_code == 401:
                detail = ""
                try:
                    detail_json = response.json()
                    detail = (
                        detail_json.get("message")
                        or detail_json.get("error")
                        or detail_json.get("detail")
                        or ""
                    )
                except ValueError:
                    detail = response.text.strip()

                message = (
                    "Decodo API rejected the supplied credentials (HTTP 401 Unauthorized). "
                    "Please update your username and password."
                )
                if detail:
                    truncated = detail if len(detail) <= 200 else f"{detail[:197]}..."
                    message = f"{message} Details: {truncated}"

                raise DecodoUnauthorizedError(message)

            response.raise_for_status()
            return response.json()

        except DecodoUnauthorizedError:
            raise
        except requests.exceptions.RequestException as e:
            print(f"Scraper API request failed: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text[:200]}")
            raise

    def google_maps_search(
        self,
        query: str,
        geo: Optional[str] = None,
        limit: int = 20,
        locale: Optional[str] = "en-US",
        domain: Optional[str] = "com",
        page_from: str = "1",
        device_type: Optional[str] = "desktop",
        google_results_language: Optional[str] = "en",
        google_nfpr: bool = True,
    ) -> Dict[str, Any]:
        """
        Search Google Maps for businesses.

        Args:
            query: Search query (e.g., "dentist", "pizza restaurant")
            geo: Location (e.g., "Toronto", "New York, NY", "Canada")
            limit: Maximum number of results

        Returns:
            Parsed Google Maps data
        """
        return self.scrape(
            target="google_maps",
            query=query,
            geo=geo,
            limit=limit,
            locale=locale,
            domain=domain,
            page_from=page_from,
            device_type=device_type,
            google_results_language=google_results_language,
            google_nfpr=google_nfpr,
        )

    def google_maps_place_details(
        self,
        cid: str,
        domain: str = "com",
        locale: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Fetch a Google Maps place details page using the business CID.

        Args:
            cid: Google Maps CID identifier
            domain: Google top-level domain (com, ca, co.uk, etc.)
            locale: Optional locale string (e.g., en-US) used to set hl/gl params

        Returns:
            Raw HTML payload of the place details page
        """
        tld = domain or "com"
        url = f"https://www.google.{tld}/maps?cid={cid}"

        params = []
        if locale:
            params.append(f"hl={locale}")
            parts = locale.split("-")
            if len(parts) > 1:
                params.append(f"gl={parts[-1]}")

        if params:
            url = f"{url}&{'&'.join(params)}"

        return self.scrape(
            target="google",
            url=url,
        )

    def google_search(
        self,
        query: str,
        geo: Optional[str] = None,
        domain: str = "com"
    ) -> Dict[str, Any]:
        """
        Perform a Google search.

        Args:
            query: Search query
            geo: Geographic location
            domain: Google domain (com, co.uk, fr, etc.)

        Returns:
            Parsed Google search results
        """
        return self.scrape(
            target="google_search",
            query=query,
            geo=geo,
            domain=domain,
            parse=True
        )

    def custom_scrape(
        self,
        url: str,
        geo: Optional[str] = None,
        headless: bool = False,
        parse: bool = False
    ) -> Dict[str, Any]:
        """
        Scrape a custom URL.

        Args:
            url: Target URL to scrape
            geo: Geographic location
            headless: Enable JavaScript rendering
            parse: Enable parsing

        Returns:
            Scraping results
        """
        return self.scrape(
            target="universal",
            url=url,
            geo=geo,
            headless=headless,
            parse=parse
        )
