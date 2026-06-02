"""KF-2: Auto-route sale orders to warehouses on confirm."""
import logging

from odoo import models

_logger = logging.getLogger(__name__)


class SaleOrderRouting(models.Model):
    _inherit = 'sale.order'

    def action_confirm(self):
        result = super().action_confirm()
        for order in self:
            if not order.x_is_cart:
                order._auto_route_warehouse()
        return result

    def _auto_route_warehouse(self) -> None:
        """Assign the best matching warehouse based on delivery city.

        Looks up fashion.warehouse.rule records ordered by priority.
        Sets x_routed_warehouse_id on self.
        Falls back to the default rule if no city match found.
        """
        city = (
            self.partner_shipping_id.city
            or self.partner_id.city
            or ''
        )

        rules = self.env['fashion.warehouse.rule'].search([('active', '=', True)])
        matched = None
        default = None

        for rule in rules:
            if rule.is_default and not default:
                default = rule
            if rule.matches_city(city):
                matched = rule
                break

        chosen = matched or default
        if chosen:
            self.write({'x_routed_warehouse_id': chosen.warehouse_id.id})
            _logger.info(
                'Routing order %s → warehouse %s (city=%s rule=%s)',
                self.name, chosen.warehouse_id.name, city, chosen.name,
            )
        else:
            _logger.info('No routing rule matched for order %s city=%s', self.name, city)
