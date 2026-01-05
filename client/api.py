"""Low-level HTTP client for the UP SHIP! API."""

import os
import re
from typing import Any

import requests

from .exceptions import APIError, AuthenticationError


DEFAULT_BASE_URL = 'https://upship-production.up.railway.app'


class APIClient:
    """Low-level HTTP client for communicating with the UP SHIP! server."""

    def __init__(self, base_url: str | None = None):
        """Initialize the API client.

        Args:
            base_url: The base URL of the UP SHIP! server.
                     Defaults to UPSHIP_URL env var or production URL.
        """
        self.base_url = base_url or os.environ.get('UPSHIP_URL', DEFAULT_BASE_URL)
        # Remove trailing slash if present
        self.base_url = self.base_url.rstrip('/')

    def request(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
        cookie: str | None = None,
    ) -> tuple[dict[str, Any], str | None]:
        """Make an HTTP request to the API.

        Args:
            method: HTTP method (GET, POST, etc.)
            path: API path (e.g., '/api/auth/login')
            body: JSON body for POST/PUT requests
            cookie: Session cookie to include in the request

        Returns:
            Tuple of (response_data, new_cookie_if_any)

        Raises:
            APIError: If the request fails
            AuthenticationError: If authentication fails
        """
        url = f'{self.base_url}{path}'

        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }

        if cookie:
            headers['Cookie'] = cookie

        try:
            response = requests.request(
                method=method.upper(),
                url=url,
                json=body,
                headers=headers,
                timeout=30,
            )
        except requests.RequestException as e:
            raise APIError(f"Request failed: {e}")

        # Extract session cookie from response if present
        new_cookie = None
        set_cookie = response.headers.get('Set-Cookie', '')
        if set_cookie:
            # Extract connect.sid cookie
            match = re.search(r'connect\.sid=[^;]+', set_cookie)
            if match:
                new_cookie = match.group(0)

        # Handle error responses
        if response.status_code == 401:
            try:
                data = response.json()
                message = data.get('error', 'Authentication failed')
            except ValueError:
                message = 'Authentication failed'
            raise AuthenticationError(message)

        if response.status_code >= 400:
            try:
                data = response.json()
                message = data.get('error', f'API error: {response.status_code}')
            except ValueError:
                message = f'API error: {response.status_code}'
            raise APIError(message, status_code=response.status_code)

        # Parse JSON response
        try:
            data = response.json()
        except ValueError:
            data = {}

        return data, new_cookie

    def get(
        self,
        path: str,
        cookie: str | None = None,
    ) -> tuple[dict[str, Any], str | None]:
        """Make a GET request."""
        return self.request('GET', path, cookie=cookie)

    def post(
        self,
        path: str,
        body: dict[str, Any] | None = None,
        cookie: str | None = None,
    ) -> tuple[dict[str, Any], str | None]:
        """Make a POST request."""
        return self.request('POST', path, body=body, cookie=cookie)

    def delete(
        self,
        path: str,
        cookie: str | None = None,
    ) -> tuple[dict[str, Any], str | None]:
        """Make a DELETE request."""
        return self.request('DELETE', path, cookie=cookie)
