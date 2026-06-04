"""Sentry error monitoring — initialised once at module load time.

Reads SENTRY_DSN from the environment. If the variable is unset or
sentry-sdk is not installed the module loads silently with no effect.

To enable: set SENTRY_DSN in .env (or docker-compose environment).
To disable: leave SENTRY_DSN unset or set to an empty string.
"""
import logging
import os

_logger = logging.getLogger(__name__)


def _init():
    dsn = os.environ.get('SENTRY_DSN', '').strip()
    if not dsn:
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.logging import LoggingIntegration
    except ImportError:
        _logger.warning(
            'SENTRY_DSN is set but sentry-sdk is not installed. '
            'Add sentry-sdk to backend/requirements.txt and rebuild the image.'
        )
        return

    environment = os.environ.get('SENTRY_ENVIRONMENT', 'production')
    release = os.environ.get('SENTRY_RELEASE', '')

    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        release=release or None,
        integrations=[
            LoggingIntegration(
                level=logging.WARNING,     # breadcrumbs from WARNING+
                event_level=logging.ERROR, # create Sentry events for ERROR+
            ),
        ],
        traces_sample_rate=float(os.environ.get('SENTRY_TRACES_SAMPLE_RATE', '0.05')),
        send_default_pii=False,
    )
    _logger.info('Sentry initialised — environment=%s', environment)


_init()
