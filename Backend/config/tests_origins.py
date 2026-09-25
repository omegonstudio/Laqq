"""
Tests mínimos de origins CSRF/CORS (R1).

No dependen del .env del host: validan el helper de parseo y los defaults
históricos de PROD embebidos en settings.
"""
from django.conf import settings
from django.test import SimpleTestCase

from config import settings as app_settings


def _split_origins(raw: str) -> list[str]:
    return [o.strip() for o in raw.split(',') if o.strip()]


class OriginsSettingsTests(SimpleTestCase):
    def test_split_origins_trims_and_skips_empty(self):
        self.assertEqual(
            _split_origins(' http://a.com , ,https://b.com '),
            ['http://a.com', 'https://b.com'],
        )

    def test_csrf_default_constant_matches_historical_prod(self):
        expected = [
            'http://laqq.com.ar',
            'http://www.laqq.com.ar',
            'http://laqq.com',
            'https://laqq.com.ar',
            'https://www.laqq.com.ar',
            'https://laqq.com',
            'http://www.laqq.com',
            'https://www.laqq.com',
        ]
        self.assertEqual(
            _split_origins(app_settings._CSRF_TRUSTED_ORIGINS_DEFAULT),
            expected,
        )

    def test_cors_default_constant_includes_prod_https(self):
        origins = _split_origins(app_settings._CORS_ALLOWED_ORIGINS_DEFAULT)
        self.assertIn('https://laqq.com.ar', origins)
        self.assertIn('https://laqq.com', origins)
        self.assertIn('http://localhost:8080', origins)
        self.assertNotIn('*', origins)
        self.assertNotIn('http://laqq.omegon.com.ar', origins)

    def test_loaded_csrf_is_nonempty_http_origins(self):
        self.assertTrue(settings.CSRF_TRUSTED_ORIGINS)
        for origin in settings.CSRF_TRUSTED_ORIGINS:
            self.assertTrue(
                origin.startswith('http://') or origin.startswith('https://'),
                msg=f'origin inválido: {origin!r}',
            )

    def test_loaded_cors_has_no_wildcard(self):
        self.assertNotIn('*', settings.CORS_ALLOWED_ORIGINS)
        self.assertFalse(getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False))
        self.assertTrue(settings.CORS_ALLOW_CREDENTIALS)

    def test_dev_origin_shape_is_valid_when_configured(self):
        """Documenta el valor esperado en .env DEV (parseo CSV)."""
        dev = _split_origins('http://laqq.omegon.com.ar')
        self.assertEqual(dev, ['http://laqq.omegon.com.ar'])
        self.assertNotIn('https://evil.example', dev)
