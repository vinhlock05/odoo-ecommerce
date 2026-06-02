"""KF-4: AI Financial Dashboard + KF-5: AI Catalog recommendations.

GET  /fashionos/api/v1/dashboard/ai/query        — AI financial analysis (KF-4)
GET  /fashionos/api/v1/catalog/recommendations   — Personalised recommendations (KF-5)
"""
import json
import logging
from collections import Counter

from odoo import http
from odoo.http import request

from ..utils.jwt_auth import get_partner_from_request
from ..utils.response import error, ok, parse_body

_logger = logging.getLogger(__name__)

_DASHBOARD_BASE = '/fashionos/api/v1/dashboard'
_CATALOG_REC    = '/fashionos/api/v1/catalog/recommendations'


class DashboardController(http.Controller):

    # ------------------------------------------------------------------
    # OPTIONS
    # ------------------------------------------------------------------

    @http.route(
        [
            f'{_DASHBOARD_BASE}/ai/query',
            _CATALOG_REC,
        ],
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

    # ==================================================================
    # KF-4: AI Financial Dashboard
    # ==================================================================

    @http.route(f'{_DASHBOARD_BASE}/ai/query', type='http', auth='none', methods=['POST'], csrf=False)
    def ai_query(self, **_kw):
        """Answer a CEO's financial question using Odoo ERP data + LLM.

        Body:
            question  (str, required): Natural language question in Vietnamese.
            date_from (str, optional): ISO date e.g. '2025-01-01'. Defaults to 30 days ago.
            date_to   (str, optional): ISO date e.g. '2025-01-31'. Defaults to today.

        Returns:
            { insight: str, data: {...} }
        """
        # Auth check — admin only for financial data
        partner = get_partner_from_request()
        if not partner:
            return error('Unauthorized', 401, 'UNAUTHORIZED')

        try:
            body = parse_body()
        except ValueError:
            return error('Invalid JSON', 400, 'MALFORMED_JSON')

        question = (body.get('question') or '').strip()
        if not question:
            return error('question is required', 400, 'VALIDATION_ERROR')

        date_from = body.get('date_from') or _days_ago(30)
        date_to   = body.get('date_to')   or _today()

        su = request.env(user=1)
        financial_data = _collect_financial_data(su, date_from, date_to)

        # Try to generate AI insight; fall back to raw data if LLM fails
        insight = _generate_insight(su, question, financial_data, date_from, date_to)

        return ok({'insight': insight, 'data': financial_data})

    # ==================================================================
    # KF-5: AI Catalog Recommendations
    # ==================================================================

    @http.route(_CATALOG_REC, type='http', auth='none', methods=['GET'], csrf=False)
    def recommendations(self, limit='10', **_kw):
        """Return personalised product recommendations.

        If the customer has order history: collaborative filtering.
        Otherwise: cold-start → trending products.

        Query params:
            limit (int, default 10, max 20)
        """
        try:
            limit_n = min(20, max(1, int(limit)))
        except (TypeError, ValueError):
            limit_n = 10

        su = request.env(user=1)
        partner = get_partner_from_request()

        if partner:
            su_partner = su['res.partner'].browse(partner.id)
            products = _recommend_for_partner(su, su_partner, limit_n)
        else:
            products = _trending_products(su, limit_n)

        data = [_product_summary(p) for p in products]
        return ok(data)


# ---------------------------------------------------------------------------
# KF-4 helpers
# ---------------------------------------------------------------------------

def _collect_financial_data(env, date_from: str, date_to: str) -> dict:
    """Query Odoo ORM for key financial metrics in the given period."""
    domain_orders = [
        ('state', 'in', ['sale', 'done']),
        ('x_is_cart', '=', False),
        ('date_order', '>=', date_from),
        ('date_order', '<=', date_to),
    ]
    orders = env['sale.order'].search(domain_orders)
    order_lines = orders.mapped('order_line').filtered(lambda l: not l.display_type)

    gross_revenue   = sum(l.price_subtotal for l in order_lines)
    total_cogs      = sum(l.product_id.standard_price * l.product_uom_qty for l in order_lines)
    gross_profit    = gross_revenue - total_cogs
    margin_pct      = round(gross_profit / gross_revenue * 100, 2) if gross_revenue else 0.0

    # Top 5 products by revenue
    rev_by_product: dict[str, float] = {}
    for l in order_lines:
        name = l.product_id.product_tmpl_id.name
        rev_by_product[name] = rev_by_product.get(name, 0) + l.price_subtotal
    top_products = sorted(rev_by_product.items(), key=lambda x: -x[1])[:5]

    # CoolCash issued (earn transactions in period)
    coolcash_issued = sum(
        t.amount
        for t in env['loyalty.transaction'].search([
            ('transaction_type', '=', 'earn'),
            ('date', '>=', date_from),
            ('date', '<=', date_to),
        ])
    )

    return {
        'period': {'from': date_from, 'to': date_to},
        'order_count': len(orders),
        'gross_revenue': round(gross_revenue, 0),
        'total_cogs': round(total_cogs, 0),
        'gross_profit': round(gross_profit, 0),
        'gross_margin_pct': margin_pct,
        'avg_order_value': round(gross_revenue / len(orders), 0) if orders else 0,
        'top_products_by_revenue': [{'name': n, 'revenue': round(r, 0)} for n, r in top_products],
        'coolcash_issued': round(coolcash_issued, 0),
    }


def _generate_insight(env, question: str, data: dict, date_from: str, date_to: str) -> str:
    """Call Claude API to generate Vietnamese narrative insight from financial data."""
    ICP = env['ir.config_parameter']
    api_key = ICP.get_param('fashionos.ai.anthropic_key', '')

    if not api_key:
        return _fallback_insight(question, data)

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        system_prompt = (
            'Bạn là CFO ảo cho một thương hiệu thời trang Việt Nam. '
            'Nhận dữ liệu ERP thực và câu hỏi của CEO, hãy trả lời bằng tiếng Việt. '
            'Phân tích ngắn gọn, tập trung vào insight quan trọng nhất (3-4 câu). '
            'Nếu dữ liệu không đủ để trả lời chính xác, hãy nói rõ điều đó.'
        )

        user_content = (
            f'Câu hỏi CEO: {question}\n\n'
            f'Dữ liệu ERP từ {date_from} đến {date_to}:\n'
            f'{json.dumps(data, ensure_ascii=False, indent=2)}'
        )

        message = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=500,
            system=system_prompt,
            messages=[{'role': 'user', 'content': user_content}],
        )
        return message.content[0].text
    except ImportError:
        _logger.warning('anthropic package not installed — using fallback insight')
        return _fallback_insight(question, data)
    except Exception:
        _logger.exception('LLM call failed')
        return _fallback_insight(question, data)


def _fallback_insight(question: str, data: dict) -> str:
    """Generate a basic Vietnamese summary without LLM."""
    return (
        f'Trong kỳ {data["period"]["from"]} — {data["period"]["to"]}: '
        f'Tổng {data["order_count"]} đơn hàng, '
        f'doanh thu {data["gross_revenue"]:,.0f} VND, '
        f'biên lợi nhuận {data["gross_margin_pct"]}%. '
        f'(Câu hỏi: "{question}" — Cần cấu hình fashionos.ai.anthropic_key để nhận phân tích AI chi tiết.)'
    )


# ---------------------------------------------------------------------------
# KF-5 helpers
# ---------------------------------------------------------------------------

def _recommend_for_partner(env, partner, limit: int):
    """Collaborative filtering: find products bought by similar customers."""
    purchased = env['sale.order.line'].search([
        ('order_id.partner_id', '=', partner.id),
        ('order_id.state', 'in', ['sale', 'done']),
        ('order_id.x_is_cart', '=', False),
    ])
    purchased_tmpl_ids = list({l.product_id.product_tmpl_id.id for l in purchased})

    if not purchased_tmpl_ids:
        return _trending_products(env, limit)

    similar_partner_ids = list({
        l.order_id.partner_id.id
        for l in env['sale.order.line'].search([
            ('product_id.product_tmpl_id', 'in', purchased_tmpl_ids),
            ('order_id.partner_id', '!=', partner.id),
            ('order_id.state', 'in', ['sale', 'done']),
        ])
    })

    if not similar_partner_ids:
        return _trending_products(env, limit)

    candidate_lines = env['sale.order.line'].search([
        ('order_id.partner_id', 'in', similar_partner_ids),
        ('product_id.product_tmpl_id', 'not in', purchased_tmpl_ids),
        ('order_id.state', 'in', ['sale', 'done']),
    ])

    freq = Counter(l.product_id.product_tmpl_id.id for l in candidate_lines)
    top_ids = [tmpl_id for tmpl_id, _ in freq.most_common(limit)]

    products = env['product.template'].browse(top_ids).filtered(
        lambda p: p.active and p.sale_ok
    )
    if len(products) < limit:
        trending = _trending_products(env, limit - len(products))
        seen = {p.id for p in products}
        products |= trending.filtered(lambda p: p.id not in seen)

    return products[:limit]


def _trending_products(env, limit: int):
    """Return top-selling products (cold-start fallback)."""
    lines = env['sale.order.line'].search([
        ('order_id.state', 'in', ['sale', 'done']),
        ('order_id.x_is_cart', '=', False),
    ])
    freq = Counter(l.product_id.product_tmpl_id.id for l in lines)
    top_ids = [tmpl_id for tmpl_id, _ in freq.most_common(limit * 2)]
    products = env['product.template'].browse(top_ids).filtered(
        lambda p: p.active and p.sale_ok
    )
    return products[:limit]


def _product_summary(tmpl) -> dict:
    return {
        'id': tmpl.id,
        'name': tmpl.name,
        'price': tmpl.list_price,
        'image_url': f'/web/image/product.template/{tmpl.id}/image_128',
        'slug': tmpl.x_slug if hasattr(tmpl, 'x_slug') else '',
    }


# ---------------------------------------------------------------------------
# Date utilities
# ---------------------------------------------------------------------------

def _today() -> str:
    from datetime import date
    return date.today().isoformat()


def _days_ago(n: int) -> str:
    from datetime import date, timedelta
    return (date.today() - timedelta(days=n)).isoformat()
