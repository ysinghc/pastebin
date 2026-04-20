import secrets
import logging
import redis.exceptions

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator

from .redis_client import get_redis, get_pool_stats
from .rate_limiter import (
    check_post_rate_limit,
    check_get_rate_limit,
    get_client_ip,
)
from .exceptions import (
    redis_connection_error_handler,
    redis_timeout_error_handler,
    redis_error_handler,
)

logging.basicConfig(
    level=logging.WARNING,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)

TTL_OPTIONS = {
    "10m": 60 * 10,
    "1h": 60 * 60,
}

HEALTH_CHECK_KEY = "health:probe"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initialise the Redis connection pool on startup rather than at import time.
    This ensures /health can respond even if Redis is down at boot.
    """
    try:
        r = get_redis()
        r.ping()
    except redis.exceptions.ConnectionError:
        logger.warning("startup: Redis unreachable — service will degrade gracefully")
    yield


app = FastAPI(
    title="Pastebin API",
    description="A simple pastebin service with rate limiting.",
    version="0.1.3",
    lifespan=lifespan,
)

app.add_exception_handler(
    redis.exceptions.ConnectionError, redis_connection_error_handler
)
app.add_exception_handler(redis.exceptions.TimeoutError, redis_timeout_error_handler)
app.add_exception_handler(redis.exceptions.RedisError, redis_error_handler)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, str):
        detail = {"error": "http_error", "message": detail}
    headers = getattr(exc, "headers", None) or {}
    return JSONResponse(status_code=exc.status_code, content=detail, headers=headers)


class PasteRequest(BaseModel):
    content: str
    ttl: str = "10m"

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("content cannot be empty")
        return v

    @field_validator("ttl")
    @classmethod
    def ttl_valid(cls, v):
        if v not in TTL_OPTIONS:
            raise ValueError(f"ttl must be one of {list(TTL_OPTIONS.keys())}")
        return v


@app.get("/")
def welcome():
    return {
        "message": (
            "Welcome to the Pastebin API! "
            "POST /paste to create, GET /paste/{id} to retrieve, "
            "GET /health for status."
        )
    }


@app.get("/health")
def health():
    r = get_redis()
    try:
        r.ping()

        probe_value = secrets.token_hex(4)
        r.set(HEALTH_CHECK_KEY, probe_value, ex=30)
        retrieved = r.get(HEALTH_CHECK_KEY)
        if retrieved != probe_value:
            raise ValueError("Health probe read-back mismatch")

        return {"status": "ok", "redis": "connected", **get_pool_stats()}

    except redis.exceptions.ConnectionError:
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded",
                "redis": "unreachable",
                "possible_cause": (
                    "Connection refused — check Redis Cloud dashboard "
                    "for network quota status."
                ),
                **get_pool_stats(),
            },
        )
    except redis.exceptions.RedisError as e:
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "redis": str(e), **get_pool_stats()},
        )
    except ValueError as e:
        logger.warning("health: probe failed — %s", e)
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "redis": str(e), **get_pool_stats()},
        )


@app.post("/paste", status_code=201)
def create_paste(req: PasteRequest, request: Request, response: Response):
    r = get_redis()
    ip = get_client_ip(request)
    content_bytes = len(req.content.encode("utf-8"))

    rl_headers = check_post_rate_limit(r, ip, content_bytes)
    for header, value in rl_headers.items():
        response.headers[header] = value

    paste_id = secrets.token_urlsafe(8)
    key = f"paste:{paste_id}"
    r.set(key, req.content, ex=TTL_OPTIONS[req.ttl], nx=True)
    return {"id": paste_id, "expires_in": req.ttl, "size_bytes": content_bytes}


@app.get("/paste/{paste_id}")
def get_paste(paste_id: str, request: Request, response: Response):
    r = get_redis()
    ip = get_client_ip(request)

    rl_headers = check_get_rate_limit(r, ip)
    for header, value in rl_headers.items():
        response.headers[header] = value

    key = f"paste:{paste_id}"
    
    pipe = r.pipeline()
    pipe.get(key)
    pipe.ttl(key)
    content, ttl_remaining = pipe.execute()

    if content is None:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": "Paste not found or has expired."},
        )

    return {"content": content, "ttl_remaining_seconds": ttl_remaining}