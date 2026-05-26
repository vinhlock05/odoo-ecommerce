"""JWT HS256 implementation using Python stdlib only — no PyJWT dependency.

Public API
----------
encode_jwt(env, partner_id)  -> str (token)
decode_jwt(env, token)       -> dict (payload) or raises JWTError
get_partner_from_request()   -> res.partner record or None
"""
import base64
import hashlib
import hmac
import json
import time

from odoo.http import request

_SECRET_KEY_PARAM = 'fashionos.jwt.secret_key'
_EXPIRY_HOURS_PARAM = 'fashionos.jwt.expiry_hours'
_DEFAULT_EXPIRY_HOURS = 24


class JWTError(Exception):
    """Raised when a JWT is missing, malformed, or invalid."""


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')


def _b64url_decode(s: str) -> bytes:
    # Restore padding
    padding = 4 - len(s) % 4
    if padding != 4:
        s += '=' * padding
    return base64.urlsafe_b64decode(s)


def _get_secret(env) -> bytes:
    ICP = env['ir.config_parameter'].sudo()
    secret = ICP.get_param(_SECRET_KEY_PARAM, '')
    if not secret:
        raise JWTError('fashionos.jwt.secret_key is not configured')
    return secret.encode('utf-8')


def encode_jwt(env, partner_id: int) -> str:
    """Create a signed JWT for the given partner."""
    ICP = env['ir.config_parameter'].sudo()
    secret = _get_secret(env)
    try:
        expiry_hours = int(ICP.get_param(_EXPIRY_HOURS_PARAM, str(_DEFAULT_EXPIRY_HOURS)) or _DEFAULT_EXPIRY_HOURS)
    except (ValueError, TypeError):
        expiry_hours = _DEFAULT_EXPIRY_HOURS

    now = int(time.time())
    header_b64 = _b64url_encode(
        json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode()
    )
    payload_b64 = _b64url_encode(
        json.dumps(
            {'partner_id': partner_id, 'iat': now, 'exp': now + expiry_hours * 3600},
            separators=(',', ':'),
        ).encode()
    )
    signing_input = f'{header_b64}.{payload_b64}'
    sig = hmac.new(secret, signing_input.encode('utf-8'), hashlib.sha256).digest()
    return f'{signing_input}.{_b64url_encode(sig)}'


def decode_jwt(env, token: str) -> dict:
    """Verify and decode a JWT; raises JWTError on any failure."""
    parts = token.split('.')
    if len(parts) != 3:
        raise JWTError('Malformed token')

    header_b64, payload_b64, sig_b64 = parts
    secret = _get_secret(env)
    signing_input = f'{header_b64}.{payload_b64}'
    expected_sig = hmac.new(
        secret, signing_input.encode('utf-8'), hashlib.sha256
    ).digest()

    try:
        actual_sig = _b64url_decode(sig_b64)
    except Exception:
        raise JWTError('Malformed signature')

    if not hmac.compare_digest(expected_sig, actual_sig):
        raise JWTError('Invalid signature')

    try:
        payload = json.loads(_b64url_decode(payload_b64))
    except (ValueError, UnicodeDecodeError):
        raise JWTError('Malformed payload')

    if int(time.time()) > payload.get('exp', 0):
        raise JWTError('Token expired')

    return payload


def get_partner_from_request():
    """Extract Bearer token from Authorization header and return the partner.

    Returns the res.partner record on success, or None if missing/invalid.
    """
    auth_header = request.httprequest.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header[7:].strip()
    if not token:
        return None
    try:
        env = request.env
        payload = decode_jwt(env, token)
        partner_id = payload.get('partner_id')
        if not partner_id:
            return None
        partner = env['res.partner'].sudo().browse(partner_id)
        if not partner.exists():
            return None
        return partner
    except JWTError:
        return None
