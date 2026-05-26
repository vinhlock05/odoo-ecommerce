"""Catalog endpoints: categories, products, slug lookup."""
import logging

from odoo import http
from odoo.http import request

from ..utils.response import error, ok, paginated, parse_body

_logger = logging.getLogger(__name__)

_BASE = '/fashionos/api/v1/catalog'


class CatalogController(http.Controller):

    # ------------------------------------------------------------------
    # OPTIONS pre-flight
    # ------------------------------------------------------------------

    @http.route(
        [f'{_BASE}/categories', f'{_BASE}/products',
         f'{_BASE}/products/<int:product_id>', f'{_BASE}/products/slug/<string:slug>'],
        type='http', auth='none', methods=['OPTIONS'], csrf=False,
    )
    def options(self, **_kw):
        return request.make_response(
            '',
            headers=[
                ('Access-Control-Allow-Origin', '*'),
                ('Access-Control-Allow-Methods', 'GET, OPTIONS'),
                ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
                ('Access-Control-Max-Age', '86400'),
            ],
        )

    # ------------------------------------------------------------------
    # GET /catalog/categories
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/categories', type='http', auth='none', methods=['GET'], csrf=False)
    def categories(self, **_kw):
        env = request.env
        cats = env['product.category'].sudo().search_read(
            [],
            fields=['id', 'name', 'parent_id', 'complete_name'],
            order='complete_name asc',
        )
        result = [
            {
                'id': c['id'],
                'name': c['name'],
                'complete_name': c['complete_name'],
                'parent_id': c['parent_id'][0] if c['parent_id'] else None,
                'parent_name': c['parent_id'][1] if c['parent_id'] else None,
            }
            for c in cats
        ]
        return ok(result)

    # ------------------------------------------------------------------
    # GET /catalog/products
    # ------------------------------------------------------------------

    @http.route(f'{_BASE}/products', type='http', auth='none', methods=['GET'], csrf=False)
    def products(self, **_kw):
        params = request.httprequest.args

        try:
            page = max(1, int(params.get('page', 1) or 1))
            limit = min(100, max(1, int(params.get('limit', 20) or 20)))
        except (ValueError, TypeError):
            return error('page and limit must be valid integers', 400, 'VALIDATION_ERROR')

        category_id = params.get('category_id')
        search_term = (params.get('search') or '').strip()
        min_price = params.get('min_price')
        max_price = params.get('max_price')
        sort_by = params.get('sort_by', 'name')  # name | price_asc | price_desc | newest

        domain = [('sale_ok', '=', True), ('active', '=', True)]

        if category_id:
            try:
                domain.append(('categ_id', '=', int(category_id)))
            except (ValueError, TypeError):
                return error('category_id must be a valid integer', 400, 'VALIDATION_ERROR')

        if search_term:
            domain.append(('name', 'ilike', search_term))

        # Price filters go into the domain so pagination totals are accurate
        if min_price is not None:
            try:
                domain.append(('list_price', '>=', float(min_price)))
            except (ValueError, TypeError):
                return error('min_price must be a valid number', 400, 'VALIDATION_ERROR')
        if max_price is not None:
            try:
                domain.append(('list_price', '<=', float(max_price)))
            except (ValueError, TypeError):
                return error('max_price must be a valid number', 400, 'VALIDATION_ERROR')

        order_map = {
            'name': 'name asc',
            'price_asc': 'list_price asc',
            'price_desc': 'list_price desc',
            'newest': 'create_date desc',
        }
        order = order_map.get(sort_by, 'name asc')

        env = request.env
        Product = env['product.template'].sudo()

        total = Product.search_count(domain)
        templates = Product.search(domain, offset=(page - 1) * limit, limit=limit, order=order)

        items = [_product_summary(t) for t in templates]
        return paginated(items, total, page, limit)

    # ------------------------------------------------------------------
    # GET /catalog/products/<id>
    # ------------------------------------------------------------------

    @http.route(
        f'{_BASE}/products/<int:product_id>',
        type='http', auth='none', methods=['GET'], csrf=False,
    )
    def product_by_id(self, product_id: int, **_kw):
        env = request.env
        tmpl = env['product.template'].sudo().browse(product_id)
        if not tmpl.exists() or not tmpl.sale_ok:
            return error('Product not found', 404, 'NOT_FOUND')
        return ok(_product_detail(tmpl))

    # ------------------------------------------------------------------
    # GET /catalog/products/slug/<slug>
    # ------------------------------------------------------------------

    @http.route(
        f'{_BASE}/products/slug/<string:slug>',
        type='http', auth='none', methods=['GET'], csrf=False,
    )
    def product_by_slug(self, slug: str, **_kw):
        env = request.env
        tmpl = env['product.template'].sudo().search(
            [('x_slug', '=', slug), ('sale_ok', '=', True)], limit=1
        )
        if not tmpl:
            return error('Product not found', 404, 'NOT_FOUND')
        return ok(_product_detail(tmpl))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _product_summary(tmpl) -> dict:
    return {
        'id': tmpl.id,
        'name': tmpl.name,
        'slug': tmpl.x_slug or '',
        'list_price': tmpl.list_price,
        'currency_id': tmpl.currency_id.name if tmpl.currency_id else 'VND',
        'categ_id': tmpl.categ_id.id if tmpl.categ_id else None,
        'categ_name': tmpl.categ_id.name if tmpl.categ_id else '',
        'image_url': f'/web/image/product.template/{tmpl.id}/image_128',
        'variant_count': len(tmpl.product_variant_ids),
    }


def _product_detail(tmpl) -> dict:
    variants = []
    for variant in tmpl.product_variant_ids:
        attr_values = []
        for av in variant.product_template_attribute_value_ids:
            attr_values.append({
                'attribute': av.attribute_id.name,
                'value': av.product_attribute_value_id.name,
            })
        variants.append({
            'id': variant.id,
            'name': variant.name,
            'default_code': variant.default_code or '',
            'lst_price': variant.lst_price,
            'attribute_values': attr_values,
            'image_url': f'/web/image/product.product/{variant.id}/image_128',
        })

    detail = _product_summary(tmpl)
    detail.update({
        'description': tmpl.description_sale or '',
        'x_fabric': getattr(tmpl, 'x_fabric', '') or '',
        'x_care_instructions': getattr(tmpl, 'x_care_instructions', '') or '',
        'x_season': getattr(tmpl, 'x_season', '') or '',
        'x_gender': getattr(tmpl, 'x_gender', '') or '',
        'x_style_tags': getattr(tmpl, 'x_style_tags', '') or '',
        'image_url': f'/web/image/product.template/{tmpl.id}/image_1920',
        'variants': variants,
    })
    return detail
