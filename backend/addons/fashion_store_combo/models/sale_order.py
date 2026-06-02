"""KF-3: Combo Engine — expand combo order lines on confirm."""
import logging

from odoo import models

_logger = logging.getLogger(__name__)


class SaleOrderCombo(models.Model):
    _inherit = 'sale.order'

    def action_confirm(self):
        result = super().action_confirm()
        for order in self:
            order._expand_combo_lines()
        return result

    def _expand_combo_lines(self) -> None:
        """Replace combo product lines with their component sub-lines.

        For each order line whose product template has x_is_combo=True:
        1. Mark the line as combo header (x_is_combo_header=True).
        2. Create one sub-line per component (price_unit=0, x_is_combo_component=True).
        """
        combo_lines = self.order_line.filtered(
            lambda l: not l.display_type and l.product_id.product_tmpl_id.x_is_combo
        )
        for line in combo_lines:
            tmpl = line.product_id.product_tmpl_id
            line.write({'x_is_combo_header': True})
            for component_product in tmpl.x_combo_component_ids:
                try:
                    self.env['sale.order.line'].create({
                        'order_id': self.id,
                        'product_id': component_product.id,
                        'product_uom_qty': line.product_uom_qty,
                        'price_unit': 0.0,
                        'x_is_combo_component': True,
                        'x_combo_parent_id': line.id,
                        'name': f'[Combo] {component_product.product_tmpl_id.name}',
                    })
                except Exception:
                    _logger.exception(
                        'Combo expand failed: order=%s product=%s',
                        self.name, component_product.id,
                    )
            _logger.info(
                'Combo expanded: order=%s combo=%s components=%d',
                self.name, tmpl.name, len(tmpl.x_combo_component_ids),
            )
