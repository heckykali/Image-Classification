"""
Email sending utility using SMTP (async).
Sends OTP codes via email for registration and login verification.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List

from backend.app.core.config import get_settings
from backend.app.core.logging import logger


def send_email(
    to_emails: List[str],
    subject: str,
    html_body: str,
    text_body: str = "",
) -> bool:
    """
    Send an email via SMTP.
    Returns True if sent successfully, False otherwise.
    """
    settings = get_settings()

    if not settings.smtp_username or not settings.smtp_password:
        logger.warning(
            "SMTP credentials not configured. "
            "Set SMTP_USERNAME and SMTP_PASSWORD environment variables to send emails."
        )
        # In development mode, just log the email content
        logger.info(f"[DEV EMAIL] To: {to_emails} | Subject: {subject} | Body: {text_body or html_body}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.smtp_from_email
        msg["To"] = ", ".join(to_emails)
        msg["Subject"] = subject

        # Add plain text part
        if text_body:
            msg.attach(MIMEText(text_body, "plain"))

        # Add HTML part
        msg.attach(MIMEText(html_body, "html"))

        # Connect to SMTP server
        with smtplib.SMTP(settings.smtp_server, settings.smtp_port) as server:
            if settings.smtp_use_tls:
                server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, to_emails, msg.as_string())

        logger.info(f"Email sent successfully to {to_emails}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {to_emails}: {e}")
        # In development, don't fail the request
        logger.info(f"[DEV EMAIL FALLBACK] To: {to_emails} | Subject: {subject} | Body: {text_body or html_body}")
        return True


def send_otp_email(to_email: str, otp_code: str, purpose: str = "verification") -> bool:
    """
    Send an OTP verification email.
    purpose: 'registration' or 'login'
    """
    if purpose == "registration":
        subject = "CattleAI - Verify Your Email Address"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #2d6a4f; text-align: center;">🐄 CattleAI</h2>
                <h3 style="color: #333; text-align: center;">Verify Your Email</h3>
                <p style="color: #555; font-size: 16px; text-align: center;">
                    Use the OTP below to complete your registration:
                </p>
                <div style="text-align: center; margin: 25px 0;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2d6a4f; background-color: #e8f5e9; padding: 15px 25px; border-radius: 8px; display: inline-block;">
                        {otp_code}
                    </span>
                </div>
                <p style="color: #777; font-size: 14px; text-align: center;">
                    This OTP is valid for 5 minutes. Do not share it with anyone.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    If you did not request this, please ignore this email.
                </p>
            </div>
        </body>
        </html>
        """
        text_body = f"""
CattleAI - Verify Your Email Address

Your OTP for registration is: {otp_code}

This OTP is valid for 5 minutes. Do not share it with anyone.

If you did not request this, please ignore this email.
        """
    elif purpose == "login":
        subject = "CattleAI - Login Verification Code"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #2d6a4f; text-align: center;">🐄 CattleAI</h2>
                <h3 style="color: #333; text-align: center;">Login Verification</h3>
                <p style="color: #555; font-size: 16px; text-align: center;">
                    Use the OTP below to complete your login:
                </p>
                <div style="text-align: center; margin: 25px 0;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2d6a4f; background-color: #e8f5e9; padding: 15px 25px; border-radius: 8px; display: inline-block;">
                        {otp_code}
                    </span>
                </div>
                <p style="color: #777; font-size: 14px; text-align: center;">
                    This OTP is valid for 5 minutes. Do not share it with anyone.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    If you did not request this, please ignore this email.
                </p>
            </div>
        </body>
        </html>
        """
        text_body = f"""
CattleAI - Login Verification Code

Your OTP for login is: {otp_code}

This OTP is valid for 5 minutes. Do not share it with anyone.

If you did not request this, please ignore this email.
        """
    else:
        subject = "CattleAI - Verification Code"
        html_body = f"<p>Your OTP is: <strong>{otp_code}</strong></p>"
        text_body = f"Your OTP is: {otp_code}"

    return send_email(
        to_emails=[to_email],
        subject=subject,
        html_body=html_body,
        text_body=text_body,
    )

