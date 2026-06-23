import logging
from google import genai
from google.genai import types
from google.genai.errors import APIError
from core.config import settings

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """Custom exception class for AI Service errors."""
    pass


# Instantiate the GenAI Client
client = None
if settings.GEMINI_API_KEY:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY is not set. AI services will fail when called.")


async def generate_content(system_prompt: str, user_input: str) -> str:
    """
    Generates content using Gemini 2.5 Flash.

    Args:
        system_prompt: The developer instruction for the model.
        user_input: The user query or context.

    Returns:
        The raw generated text.

    Raises:
        AIServiceError: If anything goes wrong with the API call.
    """
    if not settings.GEMINI_API_KEY or not client:
        raise AIServiceError("GEMINI_API_KEY is not configured. Please set the API key in your environment.")

    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_input,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt
            )
        )

        if not response or not response.text:
            raise AIServiceError("The AI model returned an empty or invalid response.")

        return response.text
    except APIError as e:
        status_str = getattr(e, "status", None)
        status_upper = status_str.upper() if isinstance(status_str, str) else ""

        if e.code == 400 or status_upper == "INVALID_ARGUMENT":
            logger.error(f"Gemini API invalid argument / invalid key error: {e}", exc_info=True)
            raise AIServiceError("Invalid API key or input parameters provided to the AI Service.") from e
        elif e.code == 429 or status_upper == "RESOURCE_EXHAUSTED":
            logger.error(f"Gemini API rate limit or quota exceeded: {e}", exc_info=True)
            raise AIServiceError("AI Service rate limit exceeded. Please try again later.") from e
        elif e.code == 504 or status_upper == "DEADLINE_EXCEEDED":
            logger.error(f"Gemini API call timed out: {e}", exc_info=True)
            raise AIServiceError("AI Service request timed out. Please try again.") from e
        else:
            logger.error(f"Gemini API call error: {e}", exc_info=True)
            raise AIServiceError(f"AI Service call failed: {e.message}") from e
    except Exception as e:
        logger.error(f"Unexpected error in AI service: {e}", exc_info=True)
        raise AIServiceError(f"An unexpected error occurred in AI Service: {str(e)}") from e
