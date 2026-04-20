import redis.exceptions
from fastapi import Request
from fastapi.responses import JSONResponse


async def redis_connection_error_handler(
    request: Request,
    exc: redis.exceptions.ConnectionError,
):
    return JSONResponse(
        status_code=503,
        content={
            "error": "service_unavailable",
            "message": (
                "Storage backend is unreachable. "
                "If this persists, the service may have exhausted "
                "its monthly network quota — check the Redis Cloud dashboard."
            ),
            "action": "retry_later",
        },
        headers={"Retry-After": "3600"},
    )


async def redis_timeout_error_handler(
    request: Request,
    exc: redis.exceptions.TimeoutError,
):
    return JSONResponse(
        status_code=504,
        content={
            "error": "gateway_timeout",
            "message": "Storage backend did not respond in time.",
            "action": "retry_later",
        },
        headers={"Retry-After": "30"},
    )


async def redis_error_handler(
    request: Request,
    exc: redis.exceptions.RedisError,
):
    return JSONResponse(
        status_code=503,
        content={
            "error": "storage_error",
            "message": "A storage error occurred. Please try again later.",
            "action": "retry_later",
        },
        headers={"Retry-After": "60"},
    )
