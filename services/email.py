import os
import boto3
from botocore.exceptions import BotoCoreError, ClientError
import logging

logger = logging.getLogger(__name__)

async def send_otp_email(email: str, otp: str):
    """
    Sends a 6-digit OTP code to the specified email using AWS SES.
    """
    aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    aws_region = os.getenv("AWS_REGION", "us-east-1")
    sender_email = os.getenv("SES_SENDER_EMAIL")

    if not aws_access_key or not aws_secret_key or not sender_email:
        logger.warning("AWS SES credentials or sender email are not configured. Email will be printed to terminal instead.")
        print(f"\n==================================================")
        print(f"📧 [AWS SES SIMULATOR] Sending email to: {email}")
        print(f"🔑 Your Nexus PM security verification code is: {otp}")
        print(f"⏳ This code expires in 5 minutes.")
        print(f"==================================================\n")
        return

    try:
        # Initialize boto3 client
        client = boto3.client(
            "ses",
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=aws_region
        )

        subject = "Nexus PM Security Verification"
        body_text = f"Your Nexus PM security verification code is: {otp}. This code expires in 5 minutes."
        
        body_html = f"""
        <html>
        <head></head>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9fb; padding: 20px; color: #1e1b4b;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <h2 style="color: #6d28d9; margin-top: 0;">Nexus PM Verification</h2>
                <p style="font-size: 14px; color: #4b5563;">Thank you for registering! Please verify your email address to activate your active developer session.</p>
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

        client.send_email(
            Source=sender_email,
            Destination={"ToAddresses": [email]},
            Message={
                "Subject": {"Data": subject},
                "Body": {
                    "Text": {"Data": body_text},
                    "Html": {"Data": body_html}
                }
            }
        )
        logger.info(f"OTP email successfully sent to {email} via AWS SES.")
    except (BotoCoreError, ClientError) as e:
        logger.error(f"Failed to send email via AWS SES: {e}")
        # Return fallback simulator so the developer can still proceed in local environments if AWS SES credentials are temporarily invalid
        print(f"\n==================================================")
        print(f"📧 [AWS SES FALLBACK] Failed to send via AWS: {e}")
        print(f"🔑 Your security verification code is: {otp}")
        print(f"==================================================\n")
