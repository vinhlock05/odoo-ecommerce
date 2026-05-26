"""Account endpoints: customer profile and delivery addresses."""
import logging

from odoo import http
from odoo.http import request

from ..utils.jwt_auth import get_partner_from_request
from ..utils.response import error, ok, parse_body

_logger = logging.getLogger(__name__)

_BASE = '/fashionos/api/v1/account'


class AccountController(http.Controller):

    # ------------------------------------------------------------------
    # OPTIONS pre-flight
    # ------------------------------------------------------------------

    @http.route(
        [f'{_BASE}/profile', f'{_BASE}/addresses', f'{_BASE}/addresses/<int:addr_id>'],
        type='http', auth='none', methods=['OPTIONS'], csrf=False,
    )
    def options(self, **_kw):
        return request.make_response(
            '',
            headers=[
                ('Access-Control-Allow-Origin', '*'),
                ('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'),
                ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
                ('Access-Control-Max-Age', '86400'),
            ],
        )

    # ------------------------------------------------------------------
    # GET /account/profile
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/profile', type='http', auth='none', methods=['GET'], csrf=False)
    def get_profile(self, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')
        return ok(_profile_dict(partner))

    # ------------------------------------------------------------------
    # PUT /account/profile
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/profile', type='http', auth='none', methods=['PUT'], csrf=False)
    def update_profile(self, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        try:
            body = parse_body()
        except ValueError:
            return error('Invalid JSON in request body', 400, 'MALFORMED_JSON')
        writeable = {}

        if 'name' in body:
            name = (body['name'] or '').strip()
            if not name:
                return error('name cannot be empty', 400, 'VALIDATION_ERROR')
            writeable['name'] = name

        if 'phone' in body:
            writeable['phone'] = (body['phone'] or '').strip() or False

        if 'gender_title' in body:
            val = body['gender_title']
            if val not in ('anh', 'chi', False, None, ''):
                return error("gender_title must be 'anh', 'chi', or empty", 400, 'VALIDATION_ERROR')
            writeable['x_gender_title'] = val if val in ('anh', 'chi') else False

        if 'zalo_id' in body:
            writeable['x_zalo_id'] = (body['zalo_id'] or '').strip() or False

        if not writeable:
            return error('No updatable fields provided', 400, 'VALIDATION_ERROR')

        partner.sudo().write(writeable)
        return ok(_profile_dict(partner))

    # ------------------------------------------------------------------
    # GET /account/addresses
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/addresses', type='http', auth='none', methods=['GET'], csrf=False)
    def list_addresses(self, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        addresses = request.env['res.partner'].sudo().search([
            ('parent_id', '=', partner.id),
            ('type', 'in', ['delivery', 'invoice', 'other']),
        ])
        return ok([_address_dict(a) for a in addresses])

    # ------------------------------------------------------------------
    # POST /account/addresses
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/addresses', type='http', auth='none', methods=['POST'], csrf=False)
    def create_address(self, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        try:
            body = parse_body()
        except ValueError:
            return error('Invalid JSON in request body', 400, 'MALFORMED_JSON')
        addr_type = body.get('type', 'delivery')
        if addr_type not in ('delivery', 'invoice', 'other'):
            return error("type must be 'delivery', 'invoice', or 'other'", 400, 'VALIDATION_ERROR')

        name = (body.get('name') or '').strip()
        if not name:
            return error('name is required', 400, 'VALIDATION_ERROR')

        env = request.env
        country_id = False
        if body.get('country_code'):
            country = env['res.country'].sudo().search(
                [('code', '=', body['country_code'].upper())], limit=1
            )
            country_id = country.id if country else False

        new_addr = env['res.partner'].sudo().create({
            'parent_id': partner.id,
            'type': addr_type,
            'name': name,
            'street': (body.get('street') or '').strip() or False,
            'street2': (body.get('street2') or '').strip() or False,
            'city': (body.get('city') or '').strip() or False,
            'zip': (body.get('zip') or '').strip() or False,
            'country_id': country_id,
            'phone': (body.get('phone') or '').strip() or False,
        })
        return ok(_address_dict(new_addr), 201)

    # ------------------------------------------------------------------
    # PUT /account/addresses/<addr_id>
    # ------------------------------------------------------------------

    @http.route(
        f'{_BASE}/addresses/<int:addr_id>',
        type='http', auth='none', methods=['PUT'], csrf=False,
    )
    def update_address(self, addr_id: int, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        env = request.env
        addr = env['res.partner'].sudo().browse(addr_id)
        if not addr.exists() or addr.parent_id.id != partner.id:
            return error('Address not found', 404, 'NOT_FOUND')

        try:
            body = parse_body()
        except ValueError:
            return error('Invalid JSON in request body', 400, 'MALFORMED_JSON')
        writeable = {}
        for field in ('name', 'street', 'street2', 'city', 'zip', 'phone'):
            if field in body:
                writeable[field] = (body[field] or '').strip() or False

        if 'country_code' in body:
            country = env['res.country'].sudo().search(
                [('code', '=', (body['country_code'] or '').upper())], limit=1
            )
            writeable['country_id'] = country.id if country else False

        if writeable:
            addr.write(writeable)

        return ok(_address_dict(addr))

    # ------------------------------------------------------------------
    # DELETE /account/addresses/<addr_id>
    # ------------------------------------------------------------------

    @http.route(
        f'{_BASE}/addresses/<int:addr_id>',
        type='http', auth='none', methods=['DELETE'], csrf=False,
    )
    def delete_address(self, addr_id: int, **_kw):
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        env = request.env
        addr = env['res.partner'].sudo().browse(addr_id)
        if not addr.exists() or addr.parent_id.id != partner.id:
            return error('Address not found', 404, 'NOT_FOUND')

        addr.unlink()
        return ok({'message': 'Address deleted'})


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _profile_dict(partner) -> dict:
    return {
        'id': partner.id,
        'name': partner.name,
        'email': partner.email or '',
        'phone': partner.phone or '',
        'gender_title': partner.x_gender_title or '',
        'phone_verified': partner.x_phone_verified,
        'zalo_id': partner.x_zalo_id or '',
    }


def _address_dict(addr) -> dict:
    return {
        'id': addr.id,
        'type': addr.type,
        'name': addr.name or '',
        'street': addr.street or '',
        'street2': addr.street2 or '',
        'city': addr.city or '',
        'zip': addr.zip or '',
        'country_code': addr.country_id.code if addr.country_id else '',
        'country_name': addr.country_id.name if addr.country_id else '',
        'phone': addr.phone or '',
    }
