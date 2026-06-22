import logging
import google.generativeai as genai
from core.config import settings
from google.api_core.exceptions import (
    GoogleAPICallError,
    InvalidArgument,
    ResourceExhausted,
    DeadlineExceeded,
)

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """Custom exception class for AI Service errors."""
    pass


# Configure the Gemini SDK
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY is not set. AI services will fail when called.")


async def generate_content(system_prompt: str, user_input: str) -> str:
    """
    Generates content using Gemini 1.5 Flash.

    Args:
        system_prompt: The developer instruction for the model.
        user_input: The user query or context.

    Returns:
        The raw generated text.

    Raises:
        AIServiceError: If anything goes wrong with the API call.
    """
    if not settings.GEMINI_API_KEY:
        raise AIServiceError("GEMINI_API_KEY is not configured. Please set the API key in your environment.")

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_prompt
        )
        response = await model.generate_content_async(user_input)

        if not response or not response.text:
            raise AIServiceError("The AI model returned an empty or invalid response.")

        return response.text
    except InvalidArgument as e:
        logger.error(f"Gemini API invalid argument / invalid key error: {e}", exc_info=True)
        raise AIServiceError("Invalid API key or input parameters provided to the AI Service.") from e
    except ResourceExhausted as e:
        logger.error(f"Gemini API rate limit or quota exceeded: {e}", exc_info=True)
        raise AIServiceError("AI Service rate limit exceeded. Please try again later.") from e
    except DeadlineExceeded as e:
        logger.error(f"Gemini API call timed out: {e}", exc_info=True)
        raise AIServiceError("AI Service request timed out. Please try again.") from e
    except GoogleAPICallError as e:
        logger.error(f"Gemini API call error: {e}", exc_info=True)
        raise AIServiceError(f"AI Service call failed: {e.message}") from e
    except Exception as e:
        logger.error(f"Unexpected error in AI service: {e}", exc_info=True)
        raise AIServiceError(f"An unexpected error occurred in AI Service: {str(e)}") from e
