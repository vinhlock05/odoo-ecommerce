"""Safe email sending helper for FashionOS controllers."""
import logging

from odoo.http import request

_logger = logging.getLogger(__name__)


def send_mail_safe(template_xmlid: str, record_id: int) -> bool:
    """Send a mail.template by XML ID without crashing the caller.

    Returns True if sent, False if SMTP is not configured or any error occurred.
    Errors are logged as warnings — callers must not depend on this returning True.
    """
    try:
        env = request.env(user=1)
        template = env.ref(template_xmlid, raise_if_not_found=False)
        if not template:
            _logger.warning('Mail template not found: %s', template_xmlid)
            return False
        template.send_mail(record_id, force_send=True, raise_exception=False)
        return True
    except Exception:
        _logger.warning(
            'Email notification failed (template=%s, id=%s) — '
            'check Odoo SMTP configuration in Settings → Technical → Email',
            template_xmlid, record_id, exc_info=True,
        )
        return False
