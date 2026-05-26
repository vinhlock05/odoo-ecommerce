from odoo import fields, models


class SaleOrder(models.Model):
    """Extend sale.order to support headless cart sessions."""

    _inherit = 'sale.order'

    x_is_cart = fields.Boolean(
        string='Is Headless Cart',
        default=False,
        index=True,
        copy=False,
        help='True while this draft order is being used as a headless shopping cart.',
    )
