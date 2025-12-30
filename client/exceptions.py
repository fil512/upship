"""Custom exceptions for the UP SHIP! client library."""


class UpshipError(Exception):
    """Base exception for all UP SHIP! client errors."""
    pass


class AuthenticationError(UpshipError):
    """Raised when authentication fails (login, register, or invalid session)."""
    pass


class SessionNotFoundError(UpshipError):
    """Raised when a session file is not found for a username."""
    pass


class APIError(UpshipError):
    """Raised when the API returns an error response."""

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


class GameNotFoundError(UpshipError):
    """Raised when a game is not found."""
    pass


class InvalidActionError(UpshipError):
    """Raised when an action is invalid or cannot be performed."""
    pass
