"""HTTP response helpers for FashionOS REST controllers.

All public functions return an Odoo Response object (via request.make_response)
with Content-Type: application/json and appropriate CORS headers.
"""
import json
import math

from odoo.http import request


_CORS_HEADERS = [
    ('Content-Type', 'application/json'),
    ('Access-Control-Allow-Origin', '*'),
    ('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'),
    ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
]


def _make(body: dict, status: int):
    payload = json.dumps(body, ensure_ascii=False, default=str)
    return request.make_response(
        payload.encode('utf-8'),
        headers=_CORS_HEADERS,
        status=status,
    )


def ok(data, status: int = 200):
    """Return a successful JSON response."""
    return _make({'success': True, 'data': data}, status)


def error(message: str, status: int = 400, code: str = 'BAD_REQUEST'):
    """Return an error JSON response."""
    return _make(
        {'success': False, 'error': {'code': code, 'message': message}},
        status,
    )


def paginated(items: list, total: int, page: int, limit: int):
    """Return a paginated JSON response."""
    total_pages = math.ceil(total / limit) if limit else 1
    return _make(
        {
            'success': True,
            'data': items,
            'meta': {
                'total': total,
                'page': page,
                'limit': limit,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1,
            },
        },
        200,
    )


def parse_body() -> dict:
    """Parse the request JSON body.

    Returns an empty dict when no body is present.
    Raises ValueError with a descriptive message when the body is not valid JSON,
    so callers can return a 400 response instead of silently ignoring malformed input.
    """
    raw = request.httprequest.data
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except (ValueError, UnicodeDecodeError) as exc:
        raise ValueError('Malformed JSON in request body') from exc
