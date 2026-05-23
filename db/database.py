from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession
)

from sqlalchemy.orm import declarative_base


DATABASE_URL = "postgresql+asyncpg://postgres:Cholan%2301@localhost:5432/nexus_pm"


engine = create_async_engine(
    DATABASE_URL,
    echo=True
)


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)


Base = declarative_base()



async def get_db():
    async with AsyncSessionLocal() as session:
        yield session