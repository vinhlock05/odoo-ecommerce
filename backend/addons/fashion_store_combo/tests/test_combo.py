"""Tests for Combo Engine (KF-3)."""
from odoo.tests import TransactionCase, tagged


@tagged('fashion', 'combo')
class TestComboEngine(TransactionCase):

    def setUp(self):
        super().setUp()
        self.partner = self.env['res.partner'].create({
            'name': 'Combo Test Customer', 'email': 'combo@test.com', 'customer_rank': 1,
        })
        # Create individual component products
        self.shirt = self.env['product.product'].create({
            'name': 'Áo thun A', 'list_price': 150_000,
        })
        self.short = self.env['product.product'].create({
            'name': 'Quần short B', 'list_price': 200_000,
        })
        # Create combo product template
        self.combo_tmpl = self.env['product.template'].create({
            'name': 'Summer Set Combo',
            'list_price': 300_000,
            'x_is_combo': True,
            'x_combo_component_ids': [(6, 0, [self.shirt.product_tmpl_id.id, self.short.product_tmpl_id.id])],
        })
        self.combo_product = self.combo_tmpl.product_variant_ids[0]

    def test_combo_expand_on_confirm(self):
        """Confirming an order with a combo product creates component lines."""
        order = self.env['sale.order'].create({
            'partner_id': self.partner.id,
            'order_line': [(0, 0, {
                'product_id': self.combo_product.id,
                'product_uom_qty': 2,
                'price_unit': 300_000,
            })],
        })
        order.action_confirm()

        component_lines = order.order_line.filtered(lambda l: l.x_is_combo_component)
        self.assertEqual(len(component_lines), 2, 'Expected 2 component lines')

    def test_combo_component_price_zero(self):
        """Component lines have price_unit = 0."""
        order = self.env['sale.order'].create({
            'partner_id': self.partner.id,
            'order_line': [(0, 0, {
                'product_id': self.combo_product.id,
                'product_uom_qty': 1,
                'price_unit': 300_000,
            })],
        })
        order.action_confirm()
        component_lines = order.order_line.filtered(lambda l: l.x_is_combo_component)
        for line in component_lines:
            self.assertEqual(line.price_unit, 0.0, f'Component {line.product_id.name} price should be 0')

    def test_combo_header_marked(self):
        """The original combo line is marked as x_is_combo_header=True."""
        order = self.env['sale.order'].create({
            'partner_id': self.partner.id,
            'order_line': [(0, 0, {
                'product_id': self.combo_product.id,
                'product_uom_qty': 1,
                'price_unit': 300_000,
            })],
        })
        order.action_confirm()
        header_lines = order.order_line.filtered(lambda l: l.x_is_combo_header)
        self.assertEqual(len(header_lines), 1)

    def test_combo_qty_propagated(self):
        """Component lines inherit the qty from the combo header."""
        order = self.env['sale.order'].create({
            'partner_id': self.partner.id,
            'order_line': [(0, 0, {
                'product_id': self.combo_product.id,
                'product_uom_qty': 3,
                'price_unit': 300_000,
            })],
        })
        order.action_confirm()
        component_lines = order.order_line.filtered(lambda l: l.x_is_combo_component)
        for line in component_lines:
            self.assertEqual(line.product_uom_qty, 3.0)
