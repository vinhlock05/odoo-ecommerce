"""Tests for Smart Order Routing (KF-2)."""
from odoo.tests import TransactionCase, tagged


@tagged('fashion', 'routing')
class TestSmartRouting(TransactionCase):

    def setUp(self):
        super().setUp()
        self.hn_city = 'Hà Nội'
        self.hcm_city = 'Hồ Chí Minh'

        # Warehouses
        self.wh_hcm = self.env['stock.warehouse'].search([], limit=1)
        self.wh_hn = self.env['stock.warehouse'].create({
            'name': 'Kho Hà Nội', 'code': 'HN',
        })

        # Routing rules
        self.env['fashion.warehouse.rule'].create({
            'name': 'HN Rule',
            'warehouse_id': self.wh_hn.id,
            'priority': 10,
            'coverage_cities': 'Hà Nội\nHanoi',
        })
        self.env['fashion.warehouse.rule'].create({
            'name': 'HCM Default',
            'warehouse_id': self.wh_hcm.id,
            'priority': 99,
            'coverage_cities': 'Hồ Chí Minh\nHo Chi Minh',
            'is_default': True,
        })

        self.partner_hcm = self.env['res.partner'].create({
            'name': 'HCM Customer', 'email': 'hcm@test.com',
            'city': self.hcm_city, 'customer_rank': 1,
        })
        self.partner_hn = self.env['res.partner'].create({
            'name': 'HN Customer', 'email': 'hn@test.com',
            'city': self.hn_city, 'customer_rank': 1,
        })

        self.product = self.env['product.product'].create({
            'name': 'Routing Test Product', 'list_price': 100_000,
        })

    def _make_order(self, partner):
        return self.env['sale.order'].create({
            'partner_id': partner.id,
            'partner_shipping_id': partner.id,
            'order_line': [(0, 0, {
                'product_id': self.product.id,
                'product_uom_qty': 1,
                'price_unit': 100_000,
            })],
        })

    def test_hn_address_routes_to_hn_warehouse(self):
        """Order from Hà Nội partner → routed to HN warehouse."""
        order = self._make_order(self.partner_hn)
        order.action_confirm()
        self.assertEqual(
            order.x_routed_warehouse_id.id,
            self.wh_hn.id,
            f'Expected HN warehouse, got {order.x_routed_warehouse_id.name}',
        )

    def test_hcm_address_routes_to_hcm_warehouse(self):
        """Order from HCM partner → routed to HCM (default) warehouse."""
        order = self._make_order(self.partner_hcm)
        order.action_confirm()
        self.assertEqual(order.x_routed_warehouse_id.id, self.wh_hcm.id)

    def test_warehouse_rule_city_match(self):
        """FashionWarehouseRule.matches_city() works case-insensitively."""
        rule = self.env['fashion.warehouse.rule'].search([('name', '=', 'HN Rule')], limit=1)
        self.assertTrue(rule.matches_city('Hà Nội'))
        self.assertTrue(rule.matches_city('hà nội'))
        self.assertFalse(rule.matches_city('Hồ Chí Minh'))
