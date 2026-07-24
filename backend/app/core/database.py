"""
Simple JSON file-based user database.
Stores users in a JSON file for persistence without a full database.
"""

import json
import os
from pathlib import Path
from typing import Optional

from backend.app.core.auth import hash_password, verify_password
from backend.app.core.logging import logger

# Default admin credentials
DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "admin123"
DEFAULT_ADMIN_EMAIL = "admin@cattleai.com"

# Path to users JSON file
DATA_DIR = Path(__file__).resolve().parents[2] / "data"
USERS_FILE = DATA_DIR / "users.json"


def _ensure_data_dir():
    """Ensure the data directory exists."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _load_users() -> dict:
    """Load all users from the JSON file."""
    _ensure_data_dir()
    if not USERS_FILE.exists():
        # Create file with default admin user
        default_users = {
            "users": [
                {
                    "username": DEFAULT_ADMIN_USERNAME,
                    "email": DEFAULT_ADMIN_EMAIL,
                    "hashed_password": hash_password(DEFAULT_ADMIN_PASSWORD),
                    "role": "admin",
                    "created_at": "2024-01-01T00:00:00",
                    "disabled": False,
                }
            ]
        }
        with open(USERS_FILE, "w") as f:
            json.dump(default_users, f, indent=2)
        logger.info(f"Created default users file with admin user (username: {DEFAULT_ADMIN_USERNAME}, password: {DEFAULT_ADMIN_PASSWORD})")
        return default_users

    with open(USERS_FILE, "r") as f:
        return json.load(f)


def _save_users(data: dict):
    """Save all users to the JSON file."""
    _ensure_data_dir()
    with open(USERS_FILE, "w") as f:
        json.dump(data, f, indent=2)


def get_user_by_username(username: str) -> Optional[dict]:
    """Get a user by username."""
    data = _load_users()
    for user in data["users"]:
        if user["username"] == username:
            return user
    return None


def get_user_by_email(email: str) -> Optional[dict]:
    """Get a user by email."""
    data = _load_users()
    for user in data["users"]:
        if user["email"] == email:
            return user
    return None


def authenticate_user(username: str, password: str) -> Optional[dict]:
    """Authenticate a user by username and password."""
    user = get_user_by_username(username)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    if user.get("disabled", False):
        return None
    return user


def create_user(username: str, email: str, password: str, role: str = "user") -> Optional[dict]:
    """Create a new user. Returns the user dict or None if exists."""
    # Check if user already exists
    if get_user_by_username(username):
        return None
    if get_user_by_email(email):
        return None

    data = _load_users()
    from datetime import datetime, timezone
    new_user = {
        "username": username,
        "email": email,
        "hashed_password": hash_password(password),
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "disabled": False,
    }
    data["users"].append(new_user)
    _save_users(data)
    logger.info(f"Created user: {username} with role: {role}")
    return new_user


def get_all_users() -> list[dict]:
    """Get all users (without password hashes)."""
    data = _load_users()
    safe_users = []
    for user in data["users"]:
        safe_users.append({
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "created_at": user["created_at"],
            "disabled": user.get("disabled", False),
        })
    return safe_users


def update_user_role(username: str, new_role: str) -> bool:
    """Update a user's role. Returns True if successful."""
    data = _load_users()
    for user in data["users"]:
        if user["username"] == username:
            user["role"] = new_role
            _save_users(data)
            logger.info(f"Updated role for {username} to {new_role}")
            return True
    return False


def disable_user(username: str) -> bool:
    """Disable a user account. Returns True if successful."""
    data = _load_users()
    for user in data["users"]:
        if user["username"] == username:
            user["disabled"] = True
            _save_users(data)
            logger.info(f"Disabled user: {username}")
            return True
    return False


def enable_user(username: str) -> bool:
    """Enable a user account. Returns True if successful."""
    data = _load_users()
    for user in data["users"]:
        if user["username"] == username:
            user["disabled"] = False
            _save_users(data)
            logger.info(f"Enabled user: {username}")
            return True
    return False


def update_user(
    username: str,
    email: Optional[str] = None,
    password: Optional[str] = None,
    role: Optional[str] = None,
    disabled: Optional[bool] = None,
) -> bool:
    """
    Update a user's details.
    Only updates fields that are not None.
    Returns True if successful, False if user not found.
    """
    data = _load_users()
    for user in data["users"]:
        if user["username"] == username:
            if email is not None:
                # Check if new email is already taken by another user
                for other in data["users"]:
                    if other["username"] != username and other["email"] == email:
                        logger.warning(f"Email '{email}' already taken by another user")
                        return False
                user["email"] = email
            if password is not None:
                user["hashed_password"] = hash_password(password)
            if role is not None:
                user["role"] = role
            if disabled is not None:
                user["disabled"] = disabled
            _save_users(data)
            logger.info(f"Updated user: {username} (email={email is not None}, password={password is not None}, role={role}, disabled={disabled})")
            return True
    return False

