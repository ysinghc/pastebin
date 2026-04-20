import time
import secrets
import logging
import redis as redis_lib
from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)

# Rate limits
MAX_PASTES_PER_WINDOW = 20
MAX_PASTE_BYTES_PER_WINDOW = 500 * 1024
MAX_PASTE_SIZE_BYTES = 50 * 1024
MAX_GETS_PER_WINDOW = 500
WINDOW_SECONDS = 3600


def _now_ms() -> int:
    """Current time in milliseconds."""
    return int(time.time() * 1000)


def _window_start_ms() -> int:
    return _now_ms() - (WINDOW_SECONDS * 1000)


def sliding_window_check(
    r: redis_lib.Redis, key: str, limit: int, cost: int = 1
) -> tuple[bool, int]:
    """
    Check and conditionally increment a sliding window counter.
    """
    now = _now_ms()
    window = _window_start_ms()

    pipe = r.pipeline()
    pipe.zremrangebyscore(key, "-inf", window)
    pipe.zcard(key)
    pipe.expire(key, WINDOW_SECONDS + 60)
    results = pipe.execute()

    current_count = results[1]
    allowed = (current_count + cost) <= limit

    if allowed:
        member = f"{now}-{secrets.token_hex(8)}"
        r.zadd(key, {member: now})

    return allowed, current_count


def sliding_window_bytes_check(
    r: redis_lib.Redis, key: str, limit_bytes: int, content_bytes: int
) -> tuple[bool, int]:
    """
    Check and conditionally record bandwidth usage in a sliding window.
    """
    now = _now_ms()
    window = _window_start_ms()

    pipe = r.pipeline()
    pipe.zremrangebyscore(key, "-inf", window)
    pipe.zrangebyscore(key, window, "+inf")
    pipe.expire(key, WINDOW_SECONDS + 60)
    results = pipe.execute()

    members_in_window = results[1]
    used_bytes = sum(
        int(m.split(b":")[1].split(b"-")[0]) if isinstance(m, bytes) else int(m.split(":")[1].split("-")[0])
        for m in members_in_window
    )

    allowed = (used_bytes + content_bytes) <= limit_bytes

    if allowed:
        member = f"{now}:{content_bytes}-{secrets.token_hex(8)}"
        r.zadd(key, {member: now})

    return allowed, used_bytes


def get_client_ip(req: Request) -> str:
    forwarded_for = req.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return req.client.host


def check_post_rate_limit(r: redis_lib.Redis, ip: str, content_bytes: int) -> dict:
    """
    Enforce all POST rate limits. Returns rate limit metadata for response headers.
    Raises HTTPException on violation.
    """
    if content_bytes > MAX_PASTE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail={
                "error": "payload_too_large",
                "message": f"Individual paste cannot exceed {MAX_PASTE_SIZE_BYTES // 1024}KB.",
                "limit_kb": MAX_PASTE_SIZE_BYTES // 1024,
            },
        )

    count_key = f"rate:post:count:{ip}"
    allowed_count, current = sliding_window_check(r, count_key, MAX_PASTES_PER_WINDOW)
    if not allowed_count:
        logger.warning(
            "rate_limit_exceeded type=paste_count ip=%s current=%d", ip, current
        )
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "limit_type": "paste_count",
                "message": f"Maximum {MAX_PASTES_PER_WINDOW} pastes per hour.",
                "current": current,
                "limit": MAX_PASTES_PER_WINDOW,
                "retry_after_seconds": WINDOW_SECONDS,
            },
            headers={
                "Retry-After": str(WINDOW_SECONDS),
                "X-RateLimit-Limit": str(MAX_PASTES_PER_WINDOW),
                "X-RateLimit-Remaining": "0",
            },
        )

    bytes_key = f"rate:post:bytes:{ip}"
    allowed_bytes, used = sliding_window_bytes_check(
        r, bytes_key, MAX_PASTE_BYTES_PER_WINDOW, content_bytes
    )
    if not allowed_bytes:
        logger.warning(
            "rate_limit_exceeded type=bandwidth ip=%s used_bytes=%d", ip, used
        )
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "limit_type": "bandwidth",
                "message": f"Maximum {MAX_PASTE_BYTES_PER_WINDOW // 1024}KB upload per hour.",
                "used_bytes": used,
                "limit_bytes": MAX_PASTE_BYTES_PER_WINDOW,
                "retry_after_seconds": WINDOW_SECONDS,
            },
            headers={
                "Retry-After": str(WINDOW_SECONDS),
                "X-RateLimit-Limit": str(MAX_PASTE_BYTES_PER_WINDOW),
                "X-RateLimit-Remaining": str(max(0, MAX_PASTE_BYTES_PER_WINDOW - used)),
            },
        )

    return {
        "X-RateLimit-Limit": str(MAX_PASTES_PER_WINDOW),
        "X-RateLimit-Remaining": str(max(0, MAX_PASTES_PER_WINDOW - current - 1)),
    }


def check_get_rate_limit(r: redis_lib.Redis, ip: str) -> dict:
    """
    Enforce GET rate limit. Returns rate limit metadata for response headers.
    Raises HTTPException on violation.
    """
    key = f"rate:get:{ip}"
    allowed, current = sliding_window_check(r, key, MAX_GETS_PER_WINDOW)
    if not allowed:
        logger.warning(
            "rate_limit_exceeded type=get_count ip=%s current=%d", ip, current
        )
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "limit_type": "get_count",
                "message": f"Maximum {MAX_GETS_PER_WINDOW} reads per hour.",
                "current": current,
                "limit": MAX_GETS_PER_WINDOW,
                "retry_after_seconds": WINDOW_SECONDS,
            },
            headers={
                "Retry-After": str(WINDOW_SECONDS),
                "X-RateLimit-Limit": str(MAX_GETS_PER_WINDOW),
                "X-RateLimit-Remaining": "0",
            },
        )

    return {
        "X-RateLimit-Limit": str(MAX_GETS_PER_WINDOW),
        "X-RateLimit-Remaining": str(max(0, MAX_GETS_PER_WINDOW - current - 1)),
    }
