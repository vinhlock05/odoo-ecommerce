"""Fashion-specific extensions to product.template."""

import logging
import re
import unicodedata

from odoo import api, fields, models

_logger = logging.getLogger(__name__)


def _slugify(text: str) -> str:
    """Convert a Vietnamese product name into a URL-safe slug.

    Steps:
    1. NFKD-normalise and drop combining diacritics (handles ă, ê, ơ, etc.)
    2. Lower-case
    3. Replace non-alphanumeric runs with a single hyphen
    4. Strip leading/trailing hyphens
    5. Return 'product' as fallback if the result is empty (e.g. all-special-char name)
    """
    normalised = unicodedata.normalize('NFKD', text)
    ascii_text = normalised.encode('ascii', 'ignore').decode('ascii')
    lower = ascii_text.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', lower).strip('-')
    return slug or 'product'


class ProductTemplate(models.Model):
    """Extends product.template with fashion-specific fields."""

    _inherit = 'product.template'

    # -------------------------------------------------------------------------
    # Fashion Classification
    # -------------------------------------------------------------------------

    x_gender_type = fields.Selection(
        selection=[
            ('male', 'Nam'),
            ('female', 'Nữ'),
            ('unisex', 'Unisex'),
        ],
        string='Giới tính',
        default='unisex',
        index=True,
    )

    x_material = fields.Char(
        string='Chất liệu',
        help='e.g. Cotton 100%, Cotton/Polyester 65/35',
    )

    x_technology = fields.Char(
        string='Công nghệ',
        help='e.g. CoolMax®, DryFit, 4-Way Stretch',
    )

    x_care_instruction = fields.Text(
        string='Hướng dẫn giặt ủi',
    )

    x_size_guide_url = fields.Char(
        string='URL Bảng size',
        help='Link to size guide image or page',
    )

    # -------------------------------------------------------------------------
    # CoolCash Override
    # -------------------------------------------------------------------------

    x_coolcash_earn_override = fields.Float(
        string='CoolCash Rate Override (%)',
        default=0.0,
        help='If > 0, overrides the global CoolCash earn rate for this product. '
             'Leave 0 to use global config.',
    )

    # -------------------------------------------------------------------------
    # Combo / Bundle
    # -------------------------------------------------------------------------

    x_is_combo = fields.Boolean(
        string='Là sản phẩm Combo',
        default=False,
        help='Mark this product as a combo — it bundles multiple component products.',
    )

    x_combo_component_ids = fields.Many2many(
        comodel_name='product.product',
        relation='fashion_product_template_combo_component_rel',
        column1='combo_tmpl_id',
        column2='component_product_id',
        string='Sản phẩm thành phần',
        help='Individual variants that make up this combo.',
    )

    x_combo_cogs = fields.Float(
        string='Combo COGS (tính toán)',
        compute='_compute_combo_cogs',
        store=True,
        help='Sum of standard prices of all component variants.',
    )

    @api.depends('x_combo_component_ids', 'x_combo_component_ids.standard_price')
    def _compute_combo_cogs(self):
        for tmpl in self:
            if not (tmpl.x_is_combo and tmpl.x_combo_component_ids):
                tmpl.x_combo_cogs = 0.0
                continue
            total = 0.0
            for comp in tmpl.x_combo_component_ids:
                price = comp.standard_price
                if price is False or price is None:
                    _logger.warning(
                        'Combo COGS: component %s (id=%s) has no standard_price; '
                        'skipping in combo "%s"',
                        comp.display_name, comp.id, tmpl.name,
                    )
                    continue
                total += price
            tmpl.x_combo_cogs = total

    # -------------------------------------------------------------------------
    # SEO Slug
    # -------------------------------------------------------------------------

    x_slug = fields.Char(
        string='SEO Slug',
        compute='_compute_slug',
        store=True,
        copy=False,
        help='URL-safe slug auto-generated from product name. '
             'Must be unique — edit manually to resolve collisions.',
    )

    _sql_constraints = [
        ('unique_x_slug', 'UNIQUE(x_slug)',
         'SEO slug must be unique across all products.'),
    ]

    @api.depends('name')
    def _compute_slug(self):
        """Compute a unique URL slug from the product name.

        If two products would produce the same base slug, a numeric suffix
        (-2, -3, …) is appended until the value is unique.
        """
        for tmpl in self:
            base = _slugify(tmpl.name or '')
            candidate = base
            counter = 1
            while True:
                domain = [('x_slug', '=', candidate)]
                if tmpl.id:
                    domain.append(('id', '!=', tmpl.id))
                if not self.env['product.template'].sudo().search(domain, limit=1):
                    break
                counter += 1
                candidate = f'{base}-{counter}'
            tmpl.x_slug = candidate
