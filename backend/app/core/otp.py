"""
OTP (One-Time Password) generation and verification.
Stores OTPs in memory with expiration.
"""

import random
import time
import threading
from typing import Optional, Dict, Tuple

from backend.app.core.config import get_settings
from backend.app.core.logging import logger


class OTPStore:
    """
    Thread-safe in-memory OTP store.
    Maps email -> (otp_code, expiry_timestamp, purpose)
    """

    def __init__(self):
        self._store: Dict[str, Tuple[str, float, str]] = {}
        self._lock = threading.Lock()
        self._cleanup_interval = 60  # Cleanup every 60 seconds
        self._last_cleanup = time.time()

    def _cleanup_expired(self):
        """Remove expired OTPs."""
        now = time.time()
        if now - self._last_cleanup < self._cleanup_interval:
            return
        with self._lock:
            expired_keys = [
                key for key, (_, expiry, _) in self._store.items()
                if now > expiry
            ]
            for key in expired_keys:
                del self._store[key]
            if expired_keys:
                logger.debug(f"Cleaned up {len(expired_keys)} expired OTP(s)")
        self._last_cleanup = now

    def generate_otp(self, email: str, purpose: str = "verification") -> str:
        """
        Generate a 6-digit OTP for the given email and purpose.
        Returns the OTP code.
        """
        settings = get_settings()
        self._cleanup_expired()

        otp = f"{random.randint(100000, 999999)}"
        expiry = time.time() + settings.otp_expire_seconds

        with self._lock:
            self._store[email] = (otp, expiry, purpose)

        logger.info(f"OTP generated for {email} (purpose: {purpose})")
        return otp

    def verify_otp(self, email: str, otp: str, purpose: str) -> bool:
        """
        Verify an OTP for the given email and purpose.
        Returns True if valid, False otherwise.
        Consumes the OTP on success (one-time use).
        """
        self._cleanup_expired()
        now = time.time()

        with self._lock:
            stored = self._store.get(email)
            if stored is None:
                logger.warning(f"OTP verification failed: no OTP found for {email}")
                return False

            stored_otp, expiry, stored_purpose = stored

            # Check purpose mismatch
            if stored_purpose != purpose:
                logger.warning(f"OTP verification failed: purpose mismatch for {email}")
                return False

            # Check expiry
            if now > expiry:
                del self._store[email]
                logger.warning(f"OTP verification failed: expired for {email}")
                return False

            # Check OTP match
            if stored_otp != otp:
                logger.warning(f"OTP verification failed: code mismatch for {email}")
                return False

            # Success — consume the OTP
            del self._store[email]
            logger.info(f"OTP verified successfully for {email}")
            return True

    def clear_otp(self, email: str):
        """Clear any existing OTP for the given email."""
        with self._lock:
            self._store.pop(email, None)

    @property
    def active_count(self) -> int:
        """Get the number of active OTPs."""
        self._cleanup_expired()
        with self._lock:
            return len(self._store)


# Global OTP store instance
otp_store = OTPStore()

