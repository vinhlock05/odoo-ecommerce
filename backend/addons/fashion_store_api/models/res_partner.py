from odoo import fields, models


class ResPartner(models.Model):
    """Extend res.partner with FashionOS customer profile fields."""

    _inherit = 'res.partner'

    x_gender_title = fields.Selection(
        selection=[('anh', 'Anh'), ('chi', 'Chị')],
        string='Xưng hô',
        default=False,
    )
    x_zalo_id = fields.Char(
        string='Zalo ID',
        index=True,
        copy=False,
    )
    x_phone_verified = fields.Boolean(
        string='Phone Verified',
        default=False,
        copy=False,
    )
