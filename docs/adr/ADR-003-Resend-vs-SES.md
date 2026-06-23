# ADR-003: Resend API vs. AWS SES for Transactional Emails

## Status
Accepted

## Context
Nexus PM uses transactional emails to send 6-digit registration OTP codes and password reset verification links. We evaluated:
1. **AWS SES (Simple Email Service):** Highly reliable and cheap at scale, but has a complex domain verification process and starts in a strict "sandbox mode" that blocks emails to unverified recipients.
2. **Resend API:** A modern developer-centric email platform built on top of AWS SES infrastructure. Offers immediate setup, clean REST APIs, and a generous free tier (3,000 emails/month).

## Decision
We decided to adopt **Resend API** as the primary transactional email gateway, with an automated fallback that prints emails to stdout logs if keys are unconfigured.

### Key Factors:
* **Immediate Onboarding:** Bypasses AWS sandbox limits, allowing immediate OTP validation testing for developers during initial setup.
* **REST Interface:** Integrates using a simple HTTP POST request rather than loading the heavy Boto3 SES client library.
* **Developer Ergonomics:** Provides dashboard logs showing email delivery statuses, open rates, and click tracking.
* **Local Fallback:** If the `RESEND_API_KEY` is not present, the application automatically prints the OTP code to backend stdout logs, allowing full sign-up testing offline.

## Consequences
* **Service Decoupling:** Implemented in `services/email.py`. If we need to migrate to AWS SES or SendGrid in the future, we only need to modify this service file; all other routers calling email dispatch remain untouched.
* **Domain Configuration:** Production delivery requires setting up SPF, DKIM, and DMARC records on the domain DNS (`nexuspm.online`) pointing to Resend to ensure high deliverability and avoid spam folders.
