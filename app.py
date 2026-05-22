from fastapi import FastAPI
from api.routes import auth as auth_router





app = FastAPI(
    title="Nexus PM",
    description="A project management tool built with FastAPI and React .",
    version="0.1.0"
)


app.include_router(
    auth_router, prefix="/api/auth", tags=["Authentication"]
    )

@app.get("/")
async def root():
    return {"message": "Welcome to Nexus PM!"}




