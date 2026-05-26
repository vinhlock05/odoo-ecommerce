import json
import logging
import re

from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)

CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}


def json_response(data, status=200):
    return request.make_response(
        json.dumps(data, ensure_ascii=False, default=str),
        status=status,
        headers=list(CORS_HEADERS.items()),
    )


def slugify(text):
    """Basic ASCII slug. Used as fallback when fashion_store_product is absent."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text


def _product_slug(product_template):
    """Return the best available slug for a product.template record.

    Prefers x_slug (computed with Vietnamese diacritic stripping) from
    fashion_store_product when installed; falls back to the basic slugify.
    """
    fields_map = product_template._fields
    if 'x_slug' in fields_map and product_template.x_slug:
        return product_template.x_slug
    return slugify(product_template.name or '')


class FashionOSProductAPI(http.Controller):

    # ------------------------------------------------------------------
    # OPTIONS — preflight CORS
    # ------------------------------------------------------------------
    @http.route('/fashionos/api/v1/<path:subpath>', type='http',
                auth='none', methods=['OPTIONS'], csrf=False)
    def options_handler(self, subpath, **kwargs):
        return request.make_response(
            '', status=204, headers=list(CORS_HEADERS.items())
        )

    # ------------------------------------------------------------------
    # GET /fashionos/api/v1/health
    # ------------------------------------------------------------------
    @http.route('/fashionos/api/v1/health', type='http',
                auth='none', methods=['GET'], csrf=False)
    def health(self, **kwargs):
        return json_response({
            'status': 'ok',
            'service': 'FashionOS API',
            'version': '1.0.0',
        })

    # ------------------------------------------------------------------
    # GET /fashionos/api/v1/products
    # Query params: limit (default 20), offset (default 0), category_id
    # ------------------------------------------------------------------
    @http.route('/fashionos/api/v1/products', type='http',
                auth='public', methods=['GET'], csrf=False)
    def get_products(self, limit=20, offset=0, category_id=None, **kwargs):
        try:
            limit = max(1, min(int(limit), 100))
            offset = max(0, int(offset))
        except (ValueError, TypeError):
            limit, offset = 20, 0

        domain = [('sale_ok', '=', True), ('active', '=', True)]
        if category_id:
            try:
                domain.append(('categ_id', '=', int(category_id)))
            except (ValueError, TypeError):
                pass

        ProductTemplate = request.env['product.template'].sudo()
        total = ProductTemplate.search_count(domain)
        products = ProductTemplate.search(domain, limit=limit, offset=offset,
                                          order='id desc')

        items = []
        for p in products:
            # Collect variant attribute values (size, color, etc.)
            variants = []
            for variant in p.product_variant_ids:
                attr_values = []
                for av in variant.product_template_attribute_value_ids:
                    attr_values.append({
                        'attribute': av.attribute_id.name,
                        'value': av.name,
                    })
                variants.append({
                    'id': variant.id,
                    'name': variant.name,
                    'attributes': attr_values,
                    'price': variant.lst_price,
                    'default_code': variant.default_code or '',
                })

            # Optional fields from fashion_store_product (present when installed)
            _pf = p._fields
            extra = {
                'gender': p.x_gender_type if 'x_gender_type' in _pf else None,
                'material': p.x_material if 'x_material' in _pf else None,
                'technology': p.x_technology if 'x_technology' in _pf else None,
                'is_combo': p.x_is_combo if 'x_is_combo' in _pf else False,
            }

            items.append({
                'id': p.id,
                'name': p.name,
                'slug': _product_slug(p),
                'price': p.list_price,
                'currency': 'VND',
                'category': p.categ_id.name if p.categ_id else None,
                'description': p.description_sale or '',
                'variant_count': p.product_variant_count,
                'variants': variants,
                'image_url': f'/web/image/product.template/{p.id}/image_512',
                **extra,
            })

        return json_response({
            'success': True,
            'data': items,
            'pagination': {
                'total': total,
                'limit': limit,
                'offset': offset,
                'has_next': (offset + limit) < total,
            },
        })

    # ------------------------------------------------------------------
    # GET /fashionos/api/v1/products/<int:product_id>
    # ------------------------------------------------------------------
    @http.route('/fashionos/api/v1/products/<int:product_id>', type='http',
                auth='public', methods=['GET'], csrf=False)
    def get_product(self, product_id, **kwargs):
        product = request.env['product.template'].sudo().browse(product_id)

        if not product.exists() or not product.sale_ok:
            return json_response({'success': False, 'error': 'Product not found'}, status=404)

        variants = []
        for variant in product.product_variant_ids:
            attr_values = []
            for av in variant.product_template_attribute_value_ids:
                attr_values.append({
                    'attribute': av.attribute_id.name,
                    'value': av.name,
                    'color_index': av.html_color or None,
                })
            variants.append({
                'id': variant.id,
                'name': variant.name,
                'default_code': variant.default_code or '',
                'price': variant.lst_price,
                'attributes': attr_values,
                'active': variant.active,
            })

        # Product attributes summary (for picker UI)
        attributes = []
        for attr_line in product.attribute_line_ids:
            attributes.append({
                'id': attr_line.attribute_id.id,
                'name': attr_line.attribute_id.name,
                'display_type': attr_line.attribute_id.display_type,
                'values': [
                    {
                        'id': v.id,
                        'name': v.name,
                        'html_color': v.html_color or None,
                    }
                    for v in attr_line.value_ids
                ],
            })

        # Optional fields from fashion_store_product (present when installed)
        _pf = product._fields
        extra_detail = {
            'gender': product.x_gender_type if 'x_gender_type' in _pf else None,
            'material': product.x_material if 'x_material' in _pf else None,
            'technology': product.x_technology if 'x_technology' in _pf else None,
            'care_instruction': product.x_care_instruction if 'x_care_instruction' in _pf else None,
            'size_guide_url': product.x_size_guide_url if 'x_size_guide_url' in _pf else None,
            'is_combo': product.x_is_combo if 'x_is_combo' in _pf else False,
        }

        return json_response({
            'success': True,
            'data': {
                'id': product.id,
                'name': product.name,
                'slug': _product_slug(product),
                'price': product.list_price,
                'currency': 'VND',
                'category': product.categ_id.name if product.categ_id else None,
                'description': product.description_sale or '',
                'description_full': product.description or '',
                'variant_count': product.product_variant_count,
                'variants': variants,
                'attributes': attributes,
                'image_url': f'/web/image/product.template/{product.id}/image_512',
                'images': [
                    f'/web/image/product.template/{product.id}/image_512',
                ],
                **extra_detail,
            },
        })
