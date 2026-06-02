"""KF-2: Warehouse routing rules by province/city."""
from odoo import fields, models


class FashionWarehouseRule(models.Model):
    _name = 'fashion.warehouse.rule'
    _description = 'Warehouse Routing Rule'
    _order = 'priority asc, id asc'

    name = fields.Char(required=True, string='Rule Name')
    warehouse_id = fields.Many2one(
        'stock.warehouse', required=True, ondelete='cascade',
        string='Warehouse',
    )
    priority = fields.Integer(default=10, string='Priority', help='Lower = higher priority')
    coverage_cities = fields.Text(
        string='Coverage Cities (one per line)',
        help='City/province names this warehouse serves. One name per line. Case-insensitive.',
    )
    is_default = fields.Boolean(
        default=False,
        string='Default Warehouse',
        help='Used when no city matches any rule.',
    )
    active = fields.Boolean(default=True)

    def matches_city(self, city: str) -> bool:
        """Return True if this rule covers the given city string."""
        self.ensure_one()
        if not city or not self.coverage_cities:
            return False
        city_lower = city.strip().lower()
        for line in self.coverage_cities.splitlines():
            if line.strip().lower() in city_lower or city_lower in line.strip().lower():
                return True
        return False
