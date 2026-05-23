from fastapi import FastAPI
from api.routes.auth import router as auth_router
from db.database import engine, Base
from models.user import User


app = FastAPI(
    title="Nexus PM",
    description="A project management tool built with FastAPI and React .",
    version="0.1.0"
)
app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"]
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)





@app.get("/")
async def root():
    return {"message": "Welcome to Nexus PM API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)