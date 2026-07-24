"""
Authentication and user management endpoints.
POST /auth/register - Create a new user account
POST /auth/login    - Login and get JWT token
GET /auth/me        - Get current user info (protected)

OTP Flow:
  Registration: send-register-otp -> verify-register-otp (creates user)
  Login:        login (password check) -> send-login-otp -> verify-login-otp (returns JWT)
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional

from backend.app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    MessageResponse,
    OTPSendRequest,
    OTPVerifyRequest,
    OTPVerifyLoginRequest,
    LoginOTPResponse,
)
from backend.app.core.auth import create_access_token, get_current_user
from backend.app.core.database import (
    create_user,
    authenticate_user,
    get_user_by_username,
    get_user_by_email,
)
from backend.app.core.otp import otp_store
from backend.app.core.email import send_otp_email
from backend.app.core.logging import logger

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _get_token_from_header(authorization: Optional[str] = Header(None)) -> str:
    """Extract Bearer token from Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return token


def _require_user(token: str = Depends(_get_token_from_header)) -> dict:
    """Dependency to require an authenticated user."""
    user = get_current_user(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


def _require_admin(user: dict = Depends(_require_user)) -> dict:
    """Dependency to require admin role."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------------------------------------------------------------------------
# OTP-BASED REGISTRATION
# ---------------------------------------------------------------------------


@router.post("/send-register-otp", response_model=MessageResponse)
async def send_register_otp(request: OTPSendRequest):
    """Step 1: Send OTP to email for registration verification."""
    # Check if email already registered
    if get_user_by_email(request.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Generate and send OTP
    otp = otp_store.generate_otp(email=request.email, purpose="registration")
    sent = send_otp_email(to_email=request.email, otp_code=otp, purpose="registration")

    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP email")

    logger.info(f"Registration OTP sent to {request.email}")
    return {"message": "OTP sent to your email. Please verify to complete registration."}


@router.post("/verify-register-otp", response_model=MessageResponse)
async def verify_register_otp(request: OTPVerifyRequest):
    """Step 2: Verify OTP and create user account."""
    # Check if username already exists
    if get_user_by_username(request.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    # Check if email already registered
    if get_user_by_email(request.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Verify OTP
    valid = otp_store.verify_otp(
        email=request.email,
        otp=request.otp,
        purpose="registration",
    )
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Create user
    user = create_user(
        username=request.username,
        email=request.email,
        password=request.password,
        role="user",
    )
    if user is None:
        raise HTTPException(status_code=400, detail="Registration failed")

    logger.info(f"New user registered with OTP: {request.username}")
    return {"message": f"User '{request.username}' created successfully"}


# ---------------------------------------------------------------------------
# OTP-BASED LOGIN
# ---------------------------------------------------------------------------


@router.post("/login", response_model=LoginOTPResponse)
async def login(request: LoginRequest):
    """Step 1: Check credentials and send OTP to email."""
    user = authenticate_user(request.username, request.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    user_email = user.get("email", "")
    if not user_email:
        raise HTTPException(status_code=400, detail="User has no email configured")

    # Generate and send OTP
    otp = otp_store.generate_otp(email=user_email, purpose="login")
    sent = send_otp_email(to_email=user_email, otp_code=otp, purpose="login")

    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP email")

    logger.info(f"Login OTP sent to {user_email} for user {request.username}")
    return {
        "message": f"OTP sent to {user_email}. Please verify to complete login.",
        "email": user_email,
    }


@router.post("/verify-login-otp", response_model=TokenResponse)
async def verify_login_otp(request: OTPVerifyLoginRequest):
    """Step 2: Verify OTP and issue JWT token."""
    # Re-authenticate to ensure credentials are still valid
    user = authenticate_user(request.username, request.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Verify OTP
    valid = otp_store.verify_otp(
        email=request.email,
        otp=request.otp,
        purpose="login",
    )
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]}
    )

    logger.info(f"User logged in with OTP: {request.username}")
    return TokenResponse(
        access_token=access_token,
        username=user["username"],
        role=user["role"],
    )


# ---------------------------------------------------------------------------
# DIRECT REGISTRATION (for admin-created users, no OTP needed)
# ---------------------------------------------------------------------------


@router.post("/register", response_model=MessageResponse)
async def register(request: RegisterRequest):
    """Register a new user account (direct, no OTP - kept for backward compatibility)."""
    if get_user_by_username(request.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    user = create_user(
        username=request.username,
        email=request.email,
        password=request.password,
        role="user",
    )
    if user is None:
        raise HTTPException(status_code=400, detail="Registration failed")

    logger.info(f"New user registered (direct): {request.username}")
    return {"message": f"User '{request.username}' created successfully"}


# ---------------------------------------------------------------------------
# PROFILE
# ---------------------------------------------------------------------------


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(_require_user)):
    """Get current user's profile (requires authentication)."""
    user = get_user_by_username(current_user["username"])
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        username=user["username"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
        disabled=user.get("disabled", False),
    )

