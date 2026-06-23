# ADR-005: Google Gemini API vs. OpenAI for AI Features

## Status
Accepted

## Context
Nexus PM integrates generative AI features to help users break down project specs into structured task cards. We needed an LLM API that supports:
1. High-speed, structured JSON outputs.
2. Low API cost per call.
3. Modern, type-safe Python SDK integration.

We evaluated:
1. **OpenAI GPT API (e.g., `gpt-4o-mini`):** Fast and widely used, but charges on a strict pay-as-you-go credit base from day one.
2. **Google Gemini API (e.g., `gemini-2.5-flash`):** Fast, supports strict JSON schema validation, and offers a generous free tier of up to 15 RPM (Requests Per Minute) and 1,500 RPD (Requests Per Day).

## Decision
We decided to adopt **Google Gemini API (`gemini-2.5-flash`)** using the new, unified `google-genai` Python library.

### Key Factors:
* **Cost Efficiency:** Gemini's free tier allows full developer showcase testing and moderate production usage without incurring recurring costs.
* **Structured Outputs:** The Gemini model natively supports `response_mime_type="application/json"` and allows passing a Pydantic schema class directly in the configuration, guaranteeing that the model output matches our database task insertion format.
* **Modern SDK Migration:** Migrating from the deprecated `google-generativeai` package to the modern `google-genai` client standard ensures long-term API support.

## Consequences
* **Client Architecture:** Installed the new `google-genai` library and configured `Client` instantiation in `services/ai_service.py`:
  ```python
  from google import genai
  client = genai.Client(api_key=settings.GEMINI_API_KEY)
  ```
* **Robust Failures:** Created custom `AIServiceError` classes to handle rate-limiting (e.g., HTTP 429) or invalid token exceptions, preventing AI failures from crashing the core FastAPI server thread.
