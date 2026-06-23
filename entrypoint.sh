#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Applying database migrations..."
if ! alembic upgrade head; then
    echo "FATAL: Database migrations failed to apply. Exiting container startup." >&2
    exit 1
fi

echo "Database migrations applied successfully."
echo "Starting FastAPI production server..."
exec gunicorn -w 1 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
