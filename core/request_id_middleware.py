import uuid
import logging
from contextvars import ContextVar
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

# Context variable to hold the request ID for the duration of the request
request_id_var: ContextVar[str] = ContextVar("request_id", default="-")

class RequestIDFilter(logging.Filter):
    """Logging filter to inject request_id into the log record from ContextVar."""
    def filter(self, record):
        record.request_id = request_id_var.get()
        return True

class RequestIDMiddleware(BaseHTTPMiddleware):
    """ASGI Middleware to stamp each request with a unique X-Request-ID."""
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())
        
        # Set the context variable for log filter access
        token = request_id_var.set(request_id)
        
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            # Reset the context variable to keep context clean
            request_id_var.reset(token)
