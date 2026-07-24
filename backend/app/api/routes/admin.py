"""
Admin-only endpoints for user management.
Requires authentication with admin role.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional

from backend.app.schemas.auth import (
    UserDetailResponse,
    UsersListResponse,
    RoleUpdateRequest,
    MessageResponse,
    AdminUpdateUserRequest,
)
from backend.app.core.auth import create_access_token, get_current_user
from backend.app.core.database import (
    get_all_users,
    get_user_by_username,
    update_user_role,
    disable_user,
    enable_user,
    create_user,
    update_user,
)
from backend.app.core.logging import logger

router = APIRouter(prefix="/admin", tags=["Admin"])


def _get_token_from_header(authorization: Optional[str] = Header(None)) -> str:
    """Extract Bearer token from Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return token


def _require_admin(token: str = Depends(_get_token_from_header)) -> dict:
    """Dependency to require admin role."""
    user = get_current_user(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/users", response_model=UsersListResponse)
async def list_users(admin: dict = Depends(_require_admin)):
    """List all users (admin only)."""
    users = get_all_users()
    user_details = [
        UserDetailResponse(
            username=u["username"],
            email=u["email"],
            role=u["role"],
            created_at=u["created_at"],
            disabled=u.get("disabled", False),
        )
        for u in users
    ]
    return UsersListResponse(total=len(user_details), users=user_details)


@router.get("/users/{username}", response_model=UserDetailResponse)
async def get_user_detail(username: str, admin: dict = Depends(_require_admin)):
    """Get details for a specific user (admin only)."""
    user = get_user_by_username(username)
    if user is None:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")

    return UserDetailResponse(
        username=user["username"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
        disabled=user.get("disabled", False),
    )


@router.put("/users/{username}/role", response_model=MessageResponse)
async def change_user_role(
    username: str,
    request: RoleUpdateRequest,
    admin: dict = Depends(_require_admin),
):
    """Change a user's role (admin only)."""
    if request.role not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'user'")

    if username == admin["username"]:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    success = update_user_role(username, request.role)
    if not success:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")

    logger.info(f"Admin '{admin['username']}' changed {username}'s role to {request.role}")
    return {"message": f"User '{username}' role updated to '{request.role}'"}


@router.post("/users/{username}/disable", response_model=MessageResponse)
async def disable_user_account(username: str, admin: dict = Depends(_require_admin)):
    """Disable a user account (admin only)."""
    if username == admin["username"]:
        raise HTTPException(status_code=400, detail="Cannot disable your own account")

    success = disable_user(username)
    if not success:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")

    logger.info(f"Admin '{admin['username']}' disabled user '{username}'")
    return {"message": f"User '{username}' disabled"}


@router.post("/users/{username}/enable", response_model=MessageResponse)
async def enable_user_account(username: str, admin: dict = Depends(_require_admin)):
    """Enable a user account (admin only)."""
    success = enable_user(username)
    if not success:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")

    logger.info(f"Admin '{admin['username']}' enabled user '{username}'")
    return {"message": f"User '{username}' enabled"}


@router.post("/users/create", response_model=MessageResponse)
async def admin_create_user(
    username: str,
    email: str,
    password: str,
    role: str = "user",
    admin: dict = Depends(_require_admin),
):
    """Create a new user (admin only)."""
    if role not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'user'")

    user = create_user(
        username=username,
        email=email,
        password=password,
        role=role,
    )
    if user is None:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    logger.info(f"Admin '{admin['username']}' created user '{username}' with role '{role}'")
    return {"message": f"User '{username}' created with role '{role}'"}


@router.put("/users/{username}", response_model=MessageResponse)
async def admin_update_user(
    username: str,
    request: AdminUpdateUserRequest,
    admin: dict = Depends(_require_admin),
):
    """Update user details (email, password, role, disabled) - admin only."""
    user = get_user_by_username(username)
    if user is None:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")

    # Check for email uniqueness if updating email
    if request.email is not None and request.email != user.get("email"):
        existing = get_user_by_email(request.email)
        if existing and existing["username"] != username:
            raise HTTPException(status_code=400, detail="Email already in use")

    success = update_user(
        username=username,
        email=request.email,
        password=request.password,
        role=request.role,
        disabled=request.disabled,
    )
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update user")

    updated_fields = []
    if request.email is not None:
        updated_fields.append("email")
    if request.password is not None:
        updated_fields.append("password")
    if request.role is not None:
        updated_fields.append("role")
    if request.disabled is not None:
        updated_fields.append("status")

    logger.info(f"Admin '{admin['username']}' updated user '{username}': {', '.join(updated_fields)}")
    return {"message": f"User '{username}' updated: {', '.join(updated_fields)}"}

