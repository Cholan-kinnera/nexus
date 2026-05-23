from fastapi import FastAPI, Depends
from api.routes.auth import router as auth_router
from db.database import engine, Base
from models.user import User
from dependencies.auth import get_current_user
from models.project import Project
from api.routes import projects




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

app.include_router(
    projects.router,
    prefix="/api/projects",
    tags=["Projects"]
)



@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)




# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to Nexus PM API"}


# Protected endpoint to get current user info
@app.get("/users/me")
async def get_me(
    current_user = Depends(get_current_user)
):
    return {
        "email": current_user.email
    }



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)