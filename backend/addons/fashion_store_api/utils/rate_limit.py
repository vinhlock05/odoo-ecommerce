"""Simple in-process rate limiter for Odoo HTTP controllers.

This is a defense-in-depth layer — nginx is the primary rate limiter.
This guard runs inside Odoo and catches abuse when Odoo is accessed
directly (e.g., internal network, misconfigured proxy, dev environment).

Implementation: sliding-window counter per (key, window).
Works for a single Odoo worker process. For multi-worker setups nginx
is the authoritative limiter; this layer still protects individual workers.
"""
import time
import threading
from collections import defaultdict
from functools import wraps

from odoo.http import request

from .response import error

_lock = threading.Lock()
# {bucket_key: [(timestamp, count), ...]}
_counters: dict[str, list[tuple[float, int]]] = defaultdict(list)


def _check(key: str, max_calls: int, window_seconds: int) -> bool:
    """Return True if the request is allowed, False if it should be blocked."""
    now = time.monotonic()
    cutoff = now - window_seconds

    with _lock:
        # Evict expired entries
        _counters[key] = [(ts, n) for ts, n in _counters[key] if ts > cutoff]
        total = sum(n for _, n in _counters[key])
        if total >= max_calls:
            return False
        _counters[key].append((now, 1))
        return True


def rate_limit(max_calls: int, window_seconds: int, key_fn=None):
    """Decorator: reject with 429 if the rate is exceeded.

    Args:
        max_calls:       Maximum number of calls allowed in the window.
        window_seconds:  Sliding window duration in seconds.
        key_fn:          Callable(request) → str bucket key.
                         Defaults to remote IP.

    Usage::

        @rate_limit(max_calls=10, window_seconds=60)
        def my_endpoint(self, **kwargs):
            ...
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if key_fn is not None:
                key = key_fn(request)
            else:
                # Use X-Forwarded-For when behind nginx, fallback to remote_addr
                forwarded = request.httprequest.environ.get('HTTP_X_FORWARDED_FOR', '')
                ip = forwarded.split(',')[0].strip() if forwarded else request.httprequest.remote_addr
                key = f'{fn.__qualname__}:{ip}'

            if not _check(key, max_calls, window_seconds):
                return error(
                    f'Too many requests. Limit: {max_calls} per {window_seconds}s.',
                    429,
                    'RATE_LIMITED',
                )
            return fn(*args, **kwargs)
        return wrapper
    return decorator
