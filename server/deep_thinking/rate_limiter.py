"""
Per-user sliding-window rate limiter (in-memory).

Limits:
  - /api/analyze : ANALYZE_LIMIT per user per day
  - /api/metrics and /api/chart-data : METRICS_LIMIT per user per day

Uses the Firebase UID passed via the X-User-ID header.
No external dependencies — pure Python with threading.Lock.
"""

import time
import threading
from collections import defaultdict, deque

# ── Configurable limits ──────────────────────────────────────
ANALYZE_LIMIT  = 5   # heavy AI analysis calls per user per day
METRICS_LIMIT  = 50  # lightweight data calls per user per day
WINDOW_SECONDS = 86_400  # 24-hour rolling window
# ─────────────────────────────────────────────────────────────

_lock = threading.Lock()

# Separate deques per user per bucket
# Structure: { bucket: { uid: deque([timestamp, ...]) } }
_usage: dict[str, dict[str, deque]] = defaultdict(lambda: defaultdict(deque))


def _prune(dq: deque, now: float) -> None:
    """Remove timestamps older than the rolling window."""
    cutoff = now - WINDOW_SECONDS
    while dq and dq[0] < cutoff:
        dq.popleft()


def check_and_record(uid: str, bucket: str) -> dict:
    """
    Check whether `uid` is within the rate limit for `bucket`.
    Records the call if allowed.

    Returns:
        {
            "allowed": bool,
            "limit": int,
            "used": int,
            "remaining": int,
            "reset_in": int   # seconds until the oldest call ages out
        }
    """
    limit = ANALYZE_LIMIT if bucket == "analyze" else METRICS_LIMIT
    now = time.time()

    with _lock:
        dq = _usage[bucket][uid]
        _prune(dq, now)

        used = len(dq)
        allowed = used < limit

        if allowed:
            dq.append(now)
            used += 1

        remaining = max(0, limit - used)
        reset_in = int(dq[0] + WINDOW_SECONDS - now) if dq else WINDOW_SECONDS

    return {
        "allowed": allowed,
        "limit": limit,
        "used": used,
        "remaining": remaining,
        "reset_in": reset_in,
    }


def get_status(uid: str, bucket: str) -> dict:
    """
    Return current usage stats for a user+bucket without recording a new call.
    """
    limit = ANALYZE_LIMIT if bucket == "analyze" else METRICS_LIMIT
    now = time.time()

    with _lock:
        dq = _usage[bucket][uid]
        _prune(dq, now)
        used = len(dq)
        remaining = max(0, limit - used)
        reset_in = int(dq[0] + WINDOW_SECONDS - now) if dq else WINDOW_SECONDS

    return {
        "limit": limit,
        "used": used,
        "remaining": remaining,
        "reset_in": reset_in,
    }


def get_all_status(uid: str) -> dict:
    """Return usage status for all buckets for a given user."""
    return {
        "analyze": get_status(uid, "analyze"),
        "metrics": get_status(uid, "metrics"),
    }
