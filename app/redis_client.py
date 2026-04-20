import logging
import redis as redis_lib
import os
from redis import ConnectionPool

logger = logging.getLogger(__name__)

_pool: ConnectionPool | None = None


def _build_pool() -> ConnectionPool:
    url = os.getenv("REDIS_URL")

    if url:
        logger.info("redis_client: connecting via REDIS_URL")
        return redis_lib.ConnectionPool.from_url(
            url,
            decode_responses=True,
            max_connections=int(os.getenv("REDIS_MAX_CONNECTIONS", "10")),
            socket_timeout=float(os.getenv("REDIS_SOCKET_TIMEOUT", "2.0")),
            socket_connect_timeout=float(os.getenv("REDIS_CONNECT_TIMEOUT", "2.0")),
            socket_keepalive=True,
            health_check_interval=30,
        )

    logger.info("redis_client: connecting via individual env vars")
    return redis_lib.ConnectionPool(
        host=str(os.getenv("REDIS_HOST", "localhost")),
        port=int(os.getenv("REDIS_PORT", 6379)),
        username=os.getenv("REDIS_USERNAME", "default"),
        password=os.getenv("REDIS_PASSWORD") or None,
        db=int(os.getenv("REDIS_DB", 0)),
        decode_responses=True,
        max_connections=int(os.getenv("REDIS_MAX_CONNECTIONS", "10")),
        socket_timeout=float(os.getenv("REDIS_SOCKET_TIMEOUT", "2.0")),
        socket_connect_timeout=float(os.getenv("REDIS_CONNECT_TIMEOUT", "2.0")),
        socket_keepalive=True,
        health_check_interval=30,
    )


def get_pool() -> ConnectionPool:
    """Lazy singleton - pool is created on first request, not at import time."""
    global _pool
    if _pool is None:
        _pool = _build_pool()
    return _pool


def get_redis() -> redis_lib.Redis:
    return redis_lib.Redis(connection_pool=get_pool())


def get_pool_stats() -> dict:
    """
    Return connection pool statistics using only the public API.
    Falls back gracefully if the internals aren't accessible.
    """
    try:
        pool = get_pool()
        max_conn = pool.max_connections
        return {"pool_max": max_conn}
    except Exception:
        return {"pool_stats": "unavailable"}