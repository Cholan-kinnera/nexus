import os
import resend
import logging

logger = logging.getLogger(__name__)


async def send_otp_email(email: str, otp: str) -> bool:
    """
    Sends a 6-digit OTP code to the specified email using Resend.
    """
    api_key = os.getenv("RESEND_API_KEY")
    sender_email = os.getenv("RESEND_SENDER_EMAIL", "noreply@nexuspm.online")

    if not api_key:
        logger.warning("RESEND_API_KEY not configured. Printing OTP to terminal.")
        print("\n==================================================")
        print(f"📧 [RESEND SIMULATOR] Sending email to: {email}")
        print(f"🔑 Your Nexus PM security verification code is: {otp}")
        print("⏳ This code expires in 5 minutes.")
        print("==================================================\n")
        return False

    resend.api_key = api_key

    body_html = f"""
    <html>
    <head></head>
    <body style="font-family: Arial, sans-serif; background-color: #f9f9fb; padding: 20px; color: #1e1b4b;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <h2 style="color: #6d28d9; margin-top: 0;">Nexus PM Verification</h2>
            <p style="font-size: 14px; color: #4b5563;">Thank you for registering! Please verify your email address to activate your account.</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #6d28d9; background-color: #f3e8ff; padding: 12px 24px; border-radius: 8px; font-family: monospace;">{otp}</span>
            </div>
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">This code expires in 5 minutes.</p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 11px; color: #9ca3af; margin-bottom: 0;">If you did not request this verification, please ignore this email.</p>
        </div>
    </body>
    </html>
    """

    try:
        resend.Emails.send({
            "from": f"Nexus PM <{sender_email}>",
            "to": [email],
            "subject": "Nexus PM Security Verification",
            "html": body_html,
        })
        logger.info(f"OTP email successfully sent to {email} via Resend.")
        return True
    except Exception as e:
        logger.error(f"Failed to send email via Resend: {e}")
        print(f"🔑 [RESEND FALLBACK] Your verification code is: {otp}")
        return False


async def send_password_reset_email(email: str, otp: str) -> bool:
    """
    Sends a 6-digit password reset OTP code to the specified email using Resend.
    """
    api_key = os.getenv("RESEND_API_KEY")
    sender_email = os.getenv("RESEND_SENDER_EMAIL", "noreply@nexuspm.online")

    if not api_key:
        logger.warning("RESEND_API_KEY not configured. Printing OTP to terminal.")
        print("\n==================================================")
        print(f"📧 [RESEND SIMULATOR] Sending password reset email to: {email}")
        print(f"🔑 Your Nexus PM password reset code is: {otp}")
        print("⏳ This code expires in 5 minutes.")
        print("==================================================\n")
        return False

    resend.api_key = api_key

    body_html = f"""
    <html>
    <head></head>
    <body style="font-family: Arial, sans-serif; background-color: #f9f9fb; padding: 20px; color: #1e1b4b;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <h2 style="color: #6d28d9; margin-top: 0;">Nexus PM Password Reset</h2>
            <p style="font-size: 14px; color: #4b5563;">You requested a password reset. Use the code below to complete the process:</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #6d28d9; background-color: #f3e8ff; padding: 12px 24px; border-radius: 8px; font-family: monospace;">{otp}</span>
            </div>
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">This code expires in 5 minutes.</p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 11px; color: #b91c1c; font-weight: bold; margin-bottom: 5px;">Security Notice:</p>
            <p style="font-size: 11px; color: #9ca3af; margin-top: 0;">If you did not request a password reset, please ignore this email.</p>
        </div>
    </body>
    </html>
    """

    try:
        resend.Emails.send({
            "from": f"Nexus PM <{sender_email}>",
            "to": [email],
            "subject": "Nexus PM Password Reset Request",
            "html": body_html,
        })
        logger.info(f"Password reset email successfully sent to {email} via Resend.")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email via Resend: {e}")
        print(f"🔑 [RESEND FALLBACK] Your password reset code is: {otp}")
        return False