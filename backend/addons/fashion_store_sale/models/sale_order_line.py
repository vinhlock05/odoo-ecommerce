"""Fashion-specific extensions to sale.order.line (combo support)."""

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class SaleOrderLine(models.Model):
    """Extends sale.order.line with combo product structure fields."""

    _inherit = 'sale.order.line'

    # -------------------------------------------------------------------------
    # Combo / Bundle Line Flags — FF-04
    # -------------------------------------------------------------------------

    x_is_combo_header = fields.Boolean(
        string='Dòng combo (header)',
        default=False,
        help='True for the parent line that represents the combo product itself.',
    )

    x_is_combo_component = fields.Boolean(
        string='Dòng thành phần combo',
        default=False,
        help='True for component lines that belong to a combo header.',
    )

    x_parent_combo_line_id = fields.Many2one(
        comodel_name='sale.order.line',
        string='Dòng combo cha',
        ondelete='cascade',
        help='Points back to the combo header line for component lines.',
        domain="[('order_id', '=', order_id), ('x_is_combo_header', '=', True)]",
    )

    x_combo_component_line_ids = fields.One2many(
        comodel_name='sale.order.line',
        inverse_name='x_parent_combo_line_id',
        string='Dòng thành phần',
        help='Component lines belonging to this combo header.',
    )

    # -------------------------------------------------------------------------
    # Constraints
    # -------------------------------------------------------------------------

    @api.constrains('x_parent_combo_line_id', 'order_id')
    def _check_combo_parent_same_order(self):
        """Ensure a combo component always belongs to the same order as its header.

        The Many2one domain on x_parent_combo_line_id is a client-side hint only;
        this constraint enforces the rule at the ORM / database level.
        """
        for line in self:
            parent = line.x_parent_combo_line_id
            if parent and parent.order_id != line.order_id:
                raise ValidationError(_(
                    "Combo component line (%(comp)s) must belong to the same "
                    "sale order as its parent combo header (%(header)s — order %(order)s).",
                    comp=line.product_id.display_name,
                    header=parent.product_id.display_name,
                    order=parent.order_id.name,
                ))
