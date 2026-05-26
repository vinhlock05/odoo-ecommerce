"""Auth endpoints: register, login, me, refresh, logout."""
import logging

from odoo import http
from odoo.exceptions import AccessDenied, ValidationError
from odoo.http import request

from ..utils.jwt_auth import JWTError, decode_jwt, encode_jwt, get_partner_from_request
from ..utils.response import error, ok, parse_body

_logger = logging.getLogger(__name__)

_BASE = '/fashionos/api/v1/auth'


class AuthController(http.Controller):

    # ------------------------------------------------------------------
    # OPTIONS pre-flight (CORS)
    # ------------------------------------------------------------------

    @http.route(
        [f'{_BASE}/register', f'{_BASE}/login', f'{_BASE}/refresh',
         f'{_BASE}/logout', f'{_BASE}/me'],
        type='http', auth='none', methods=['OPTIONS'], csrf=False,
    )
    def options(self, **_kw):
        return request.make_response(
            '',
            headers=[
                ('Access-Control-Allow-Origin', '*'),
                ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
                ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
                ('Access-Control-Max-Age', '86400'),
            ],
        )

    # ------------------------------------------------------------------
    # POST /auth/register
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/register', type='http', auth='none', methods=['POST'], csrf=False)
    def register(self, **_kw):
        try:
            body = parse_body()
        except ValueError:
            return error('Invalid JSON in request body', 400, 'MALFORMED_JSON')
        name = (body.get('name') or '').strip()
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''
        phone = (body.get('phone') or '').strip()
        gender_title = body.get('gender_title') or False

        if not name:
            return error('name is required', 400, 'VALIDATION_ERROR')
        if not email:
            return error('email is required', 400, 'VALIDATION_ERROR')
        if len(password) < 8:
            return error('password must be at least 8 characters', 400, 'VALIDATION_ERROR')

        env = request.env
        existing = env['res.partner'].sudo().search([('email', '=', email)], limit=1)
        if existing:
            return error('Email already registered', 409, 'EMAIL_TAKEN')

        try:
            partner = env['res.partner'].sudo().create({
                'name': name,
                'email': email,
                'phone': phone or False,
                'x_gender_title': gender_title if gender_title in ('anh', 'chi') else False,
                'customer_rank': 1,
            })
            user = env['res.users'].sudo().with_context(no_reset_password=True).create({
                'name': name,
                'login': email,
                'email': email,
                'partner_id': partner.id,
                'groups_id': [(6, 0, [env.ref('base.group_portal').id])],
                'password': password,
            })
        except (ValidationError, Exception) as exc:
            _logger.exception('register failed')
            return error(str(exc), 400, 'REGISTRATION_FAILED')

        token = encode_jwt(env, partner.id)
        return ok({'token': token, 'partner_id': partner.id, 'name': name, 'email': email}, 201)

    # ------------------------------------------------------------------
    # POST /auth/login
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/login', type='http', auth='none', methods=['POST'], csrf=False)
    def login(self, **_kw):
        try:
            body = parse_body()
        except ValueError:
            return error('Invalid JSON in request body', 400, 'MALFORMED_JSON')
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''

        if not email or not password:
            return error('email and password are required', 400, 'VALIDATION_ERROR')

        env = request.env
        try:
            # Verify credentials via Odoo's auth mechanism
            uid = env['res.users'].sudo().search([('login', '=', email)], limit=1).id
            if not uid:
                raise AccessDenied()
            user = env['res.users'].sudo().browse(uid)
            user._check_credentials(password, {'interactive': False})
        except AccessDenied:
            return error('Invalid email or password', 401, 'INVALID_CREDENTIALS')
        except Exception:
            _logger.exception('login failed for %s', email)
            return error('Login failed', 500, 'SERVER_ERROR')

        partner = user.partner_id
        token = encode_jwt(env, partner.id)
        return ok({'token': token, 'partner_id': partner.id, 'name': partner.name, 'email': email})

    # ------------------------------------------------------------------
    # GET /auth/me
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/me', type='http', auth='none', methods=['GET'], csrf=False)
    def me(self, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')
        return ok(_partner_dict(partner))

    # ------------------------------------------------------------------
    # POST /auth/refresh
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/refresh', type='http', auth='none', methods=['POST'], csrf=False)
    def refresh(self, **_kw):
        auth_header = request.httprequest.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return error('Unauthorized', 401, 'UNAUTHORIZED')
        token = auth_header[7:].strip()
        env = request.env
        try:
            payload = decode_jwt(env, token)
        except JWTError as exc:
            return error(str(exc), 401, 'INVALID_TOKEN')

        partner_id = payload.get('partner_id')
        if not partner_id:
            return error('Invalid token payload', 401, 'INVALID_TOKEN')

        new_token = encode_jwt(env, partner_id)
        return ok({'token': new_token})

    # ------------------------------------------------------------------
    # POST /auth/logout
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/logout', type='http', auth='none', methods=['POST'], csrf=False)
    def logout(self, **_kw):
        # Stateless JWT — just confirm the client should discard its token
        return ok({'message': 'Logged out'})


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _partner_dict(partner) -> dict:
    return {
        'id': partner.id,
        'name': partner.name,
        'email': partner.email or '',
        'phone': partner.phone or '',
        'gender_title': partner.x_gender_title or '',
        'phone_verified': partner.x_phone_verified,
        'zalo_id': partner.x_zalo_id or '',
    }
