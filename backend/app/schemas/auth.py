"""
Pydantic schemas for authentication endpoints.
"""

from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class RegisterRequest(BaseModel):
    """Request body for user registration."""
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    email: str = Field(..., description="Email address")
    password: str = Field(..., min_length=6, description="Password")


class LoginRequest(BaseModel):
    """Request body for user login."""
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")


class TokenResponse(BaseModel):
    """Response with access token."""
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str


class UserResponse(BaseModel):
    """Public user info (no password)."""
    username: str
    email: str
    role: str
    created_at: str
    disabled: bool = False


class UserDetailResponse(BaseModel):
    """Detailed user info."""
    username: str
    email: str
    role: str
    created_at: str
    disabled: bool = False


class UsersListResponse(BaseModel):
    """Response for listing all users."""
    total: int
    users: list[UserDetailResponse]


class RoleUpdateRequest(BaseModel):
    """Request to update user role."""
    role: str = Field(..., description="New role (admin/user)")


class MessageResponse(BaseModel):
    """Simple message response."""
    message: str


class OTPSendRequest(BaseModel):
    """Request to send OTP to email."""
    email: str = Field(..., description="Email address to send OTP to")


class OTPVerifyRequest(BaseModel):
    """Request to verify OTP."""
    email: str = Field(..., description="Email address")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")
    username: str = Field(..., description="Username for registration context")
    password: str = Field(..., min_length=6, description="Password for registration")


class OTPVerifyLoginRequest(BaseModel):
    """Request to verify OTP for login."""
    email: str = Field(..., description="Email address")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")
    username: str = Field(..., description="Username")
    password: str = Field(..., min_length=6, description="Password")


class AdminUpdateUserRequest(BaseModel):
    """Request to update user details by admin."""
    email: Optional[str] = Field(None, description="New email address")
    password: Optional[str] = Field(None, min_length=6, description="New password")
    role: Optional[str] = Field(None, description="New role (admin/user)")
    disabled: Optional[bool] = Field(None, description="Enable/disable user")


class LoginOTPResponse(BaseModel):
    """Response after sending login OTP."""
    message: str
    email: str

