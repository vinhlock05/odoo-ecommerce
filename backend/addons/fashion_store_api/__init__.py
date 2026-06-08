from . import controllers
from . import models


def post_init_hook(env):
    """Auto-generate JWT secret key on first install if not already set."""
    import secrets as _secrets
    ICP = env['ir.config_parameter'].sudo()
    if not ICP.get_param('fashionos.jwt.secret_key'):
        ICP.set_param('fashionos.jwt.secret_key', _secrets.token_hex(32))
