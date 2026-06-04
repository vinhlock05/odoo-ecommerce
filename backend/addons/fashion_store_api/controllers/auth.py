"""Auth endpoints: register, login, me, refresh, logout."""
import logging

from odoo import http
from odoo.exceptions import AccessDenied, ValidationError
from odoo.http import request

from ..utils.jwt_auth import JWTError, decode_jwt, encode_jwt, get_partner_from_request
from ..utils.rate_limit import rate_limit
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
    @rate_limit(max_calls=10, window_seconds=60)
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
        su = env(user=1)  # auth='none' routes: sudo() sets su=True but leaves uid=0;
                          # env(user=1) sets uid=1 so env.user is the admin singleton,
                          # which prevents crashes when Odoo internals call sudo(False).
        existing = su['res.partner'].search([('email', '=', email)], limit=1)
        if existing:
            return error('Email already registered', 409, 'EMAIL_TAKEN')

        try:
            with env.cr.savepoint():
                # savepoint() auto-rollbacks on ANY exception inside the block,
                # so no partial partner/user records will be committed.
                partner = su['res.partner'].create({
                    'name': name,
                    'email': email,
                    'phone': phone or False,
                    'x_gender_title': gender_title if gender_title in ('anh', 'chi') else False,
                    'customer_rank': 1,
                })
                main_company_id = su.ref('base.main_company').id
                user = su['res.users'].with_context(no_reset_password=True).create({
                    'name': name,
                    'login': email,
                    'email': email,
                    'partner_id': partner.id,
                    'password': password,
                    # Odoo 19: company_id (NOT NULL) and company_ids must both be set.
                    'company_id': main_company_id,
                    'company_ids': [(6, 0, [main_company_id])],
                })
                # Odoo 19: res.users.create() auto-assigns base.group_user (internal user).
                # group_user and group_portal are mutually exclusive — must remove first.
                group_user = su.ref('base.group_user')
                group_portal = su.ref('base.group_portal')
                group_user.write({'user_ids': [(3, user.id)]})   # (3) = remove
                group_portal.write({'user_ids': [(4, user.id)]}) # (4) = add
        except (ValidationError, Exception) as exc:
            _logger.exception('register failed')
            return error(str(exc), 400, 'REGISTRATION_FAILED')

        # Auto-create referral code for the new customer (best-effort)
        try:
            su['referral.code'].get_or_create(partner)
        except Exception:
            _logger.warning('Could not create referral code for partner %s', partner.id, exc_info=True)

        token = encode_jwt(env, partner.id)
        return ok({'token': token, 'partner_id': partner.id, 'name': name, 'email': email}, 201)

    # ------------------------------------------------------------------
    # POST /auth/login
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/login', type='http', auth='none', methods=['POST'], csrf=False)
    @rate_limit(max_calls=10, window_seconds=60)
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
            # Odoo 19: authenticate(credential_dict, user_agent_env)
            credential = {'type': 'password', 'login': email, 'password': password}
            auth_info = env['res.users'].sudo().authenticate(credential, {'interactive': False})
            uid = auth_info.get('uid') if isinstance(auth_info, dict) else auth_info
            if not uid:
                raise AccessDenied()
        except AccessDenied:
            return error('Invalid email or password', 401, 'INVALID_CREDENTIALS')
        except Exception:
            _logger.exception('login failed for %s', email)
            return error('Login failed', 500, 'SERVER_ERROR')

        user = env['res.users'].sudo().browse(uid)
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
