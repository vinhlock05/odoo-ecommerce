"""Feature flag helpers for FashionOS.

Usage anywhere in Odoo Python code::

    from odoo.addons.fashion_store_config.utils.feature_flags import is_enabled

    if is_enabled(self.env, 'fashionos.ff.coolcash'):
        # award CoolCash points
        ...
"""

_FLAG_PREFIX = 'fashionos.ff.'

# Canonical flag keys — keeps callers from typo-ing raw strings
FF_COOLCASH = 'fashionos.ff.coolcash'
FF_COOLCLUB = 'fashionos.ff.coolclub'
FF_REFERRAL = 'fashionos.ff.referral'
FF_COMBO = 'fashionos.ff.combo'
FF_SMART_ROUTING = 'fashionos.ff.smart_routing'
FF_ALTERNATE_RECEIVER = 'fashionos.ff.alternate_receiver'
FF_RETURN_REQUEST = 'fashionos.ff.return_request'
FF_ZALO_NOTIFICATION = 'fashionos.ff.zalo_notification'
FF_JWT_AUTH = 'fashionos.ff.jwt_auth'
FF_FREE_SHIPPING = 'fashionos.ff.free_shipping'
FF_PRODUCT_REVIEWS = 'fashionos.ff.product_reviews'
FF_WISHLIST = 'fashionos.ff.wishlist'
FF_FLASH_SALE = 'fashionos.ff.flash_sale'
FF_BUNDLE_PRICE = 'fashionos.ff.bundle_price'
FF_ORDER_SPLIT = 'fashionos.ff.order_split'
FF_MULTI_WAREHOUSE = 'fashionos.ff.multi_warehouse'
FF_NEWSLETTER = 'fashionos.ff.newsletter'
FF_LIVE_CHAT = 'fashionos.ff.live_chat'
FF_ANALYTICS = 'fashionos.ff.analytics'
FF_HEADLESS_MODE = 'fashionos.ff.headless_mode'


def is_enabled(env, flag_key: str) -> bool:
    """Return True if the given feature flag is enabled.

    Reads from ir.config_parameter (sudo) so it works in any context.
    Missing keys default to False.

    Odoo's res.config.settings stores Boolean config_parameter values as
    '1' / '0'. The XML defaults and any legacy data may use 'True' / 'False'.
    This function accepts both formats defensively.

    Args:
        env: Odoo environment (self.env).
        flag_key: One of the FF_* constants or a raw 'fashionos.ff.*' string.

    Returns:
        bool — True if the flag is stored as '1', 'True', or 'true'.
    """
    value = env['ir.config_parameter'].sudo().get_param(flag_key, '0')
    return value in ('1', 'True', 'true')


def get_param(env, key: str, default: str = '') -> str:
    """Convenience wrapper for reading any fashionos.* config parameter.

    Args:
        env: Odoo environment.
        key: Full ir.config_parameter key (e.g. 'fashionos.coolcash.earn_rate').
        default: Value returned when the key is absent.

    Returns:
        str — the stored value, or default.
    """
    return env['ir.config_parameter'].sudo().get_param(key, default)


def get_float_param(env, key: str, default: float = 0.0) -> float:
    """Read a config parameter as float. Returns default on parse error."""
    raw = get_param(env, key, str(default))
    try:
        return float(raw)
    except (ValueError, TypeError):
        return default
