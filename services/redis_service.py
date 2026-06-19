import logging
import asyncio
from typing import Optional, Any
import redis.asyncio as aioredis
from core.config import settings

logger = logging.getLogger(__name__)


class RedisService:
    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self.client: Optional[aioredis.Redis] = None
        self.is_connected = False

    async def connect(self) -> None:
        """Establish connection to Redis with automatic retries."""
        logger.info(f"Initializing Redis client connecting to {self.redis_url}...")
        try:
            self.client = aioredis.Redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_timeout=5.0,
                socket_connect_timeout=5.0,
            )
            # Send initial ping to check connectivity
            await self.client.ping()
            self.is_connected = True
            logger.info("✅ Redis connection established successfully.")
        except Exception as exc:
            self.is_connected = False
            logger.error(f"❌ Failed to connect to Redis during startup: {exc}")
            # Try to reconnect in the background without blocking main thread
            asyncio.create_task(self._reconnect_loop())

    async def _reconnect_loop(self) -> None:
        """Background loop to periodically attempt connection recovery."""
        retry_delay = 5
        while not self.is_connected:
            logger.info(f"Attempting Redis reconnection in {retry_delay} seconds...")
            await asyncio.sleep(retry_delay)
            try:
                if self.client:
                    await self.client.close()
                self.client = aioredis.Redis.from_url(
                    self.redis_url,
                    decode_responses=True,
                    socket_timeout=5.0,
                    socket_connect_timeout=5.0,
                )
                await self.client.ping()
                self.is_connected = True
                logger.info("✅ Redis connection recovered successfully.")
                break
            except Exception as e:
                logger.warning(f"Redis reconnection attempt failed: {e}")
                # Exponential backoff up to 60s
                retry_delay = min(retry_delay * 2, 60)

    async def disconnect(self) -> None:
        """Gracefully close the Redis client connection."""
        if self.client:
            logger.info("Disconnecting Redis client...")
            await self.client.close()
            self.is_connected = False

    async def ping(self) -> bool:
        """Check connection health."""
        if not self.is_connected or not self.client:
            return False
        try:
            return await self.client.ping()
        except Exception as exc:
            logger.error(f"Redis ping failed: {exc}")
            self.is_connected = False
            asyncio.create_task(self._reconnect_loop())
            return False

    async def set_cache(
        self, key: str, value: str, expire_seconds: Optional[int] = None
    ) -> bool:
        """Write key to Redis with an optional expiry window."""
        if not self.is_connected or not self.client:
            logger.warning(f"Redis not connected. Skipped caching key: {key}")
            return False
        try:
            if expire_seconds:
                await self.client.setex(key, expire_seconds, value)
            else:
                await self.client.set(key, value)
            return True
        except Exception as exc:
            logger.error(f"Failed to set key '{key}' in Redis: {exc}")
            return False

    async def get_cache(self, key: str) -> Optional[str]:
        """Fetch key from Redis."""
        if not self.is_connected or not self.client:
            logger.warning(f"Redis not connected. Skipped fetching key: {key}")
            return None
        try:
            return await self.client.get(key)
        except Exception as exc:
            logger.error(f"Failed to get key '{key}' from Redis: {exc}")
            return None

    async def delete_cache(self, key: str) -> bool:
        """Delete key from Redis."""
        if not self.is_connected or not self.client:
            logger.warning(f"Redis not connected. Skipped deleting key: {key}")
            return False
        try:
            await self.client.delete(key)
            return True
        except Exception as exc:
            logger.error(f"Failed to delete key '{key}' from Redis: {exc}")
            return False

    async def exists_cache(self, key: str) -> bool:
        """Check if key exists in Redis."""
        if not self.is_connected or not self.client:
            return False
        try:
            return await self.client.exists(key) > 0
        except Exception as exc:
            logger.error(f"Failed to verify existence of key '{key}': {exc}")
            return False


# Singleton instance of the Redis Service
redis_service = RedisService()
