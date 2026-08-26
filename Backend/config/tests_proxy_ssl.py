"""
Tests R4.1 — SECURE_PROXY_SSL_HEADER y build_absolute_uri detrás de Nginx.
"""
from django.test import RequestFactory, SimpleTestCase, override_settings


@override_settings(SECURE_PROXY_SSL_HEADER=('HTTP_X_FORWARDED_PROTO', 'https'))
class SecureProxySslHeaderTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_without_forwarded_proto_is_insecure_http_uri(self):
        request = self.factory.get('/media/file.png', HTTP_HOST='laqq.com.ar')
        self.assertFalse(request.is_secure())
        uri = request.build_absolute_uri('/media/file.png')
        self.assertTrue(uri.startswith('http://'), uri)
        self.assertFalse(uri.startswith('https://'), uri)

    def test_forwarded_proto_https_is_secure_https_uri(self):
        request = self.factory.get(
            '/media/file.png',
            HTTP_HOST='laqq.com.ar',
            HTTP_X_FORWARDED_PROTO='https',
        )
        self.assertTrue(request.is_secure())
        uri = request.build_absolute_uri('/media/file.png')
        self.assertTrue(uri.startswith('https://'), uri)
        self.assertEqual(uri, 'https://laqq.com.ar/media/file.png')

    def test_forwarded_proto_http_remains_insecure(self):
        """Caso DEV: Nginx envía X-Forwarded-Proto: http."""
        request = self.factory.get(
            '/media/file.png',
            HTTP_HOST='laqq.com.ar',
            HTTP_X_FORWARDED_PROTO='http',
        )
        self.assertFalse(request.is_secure())
        uri = request.build_absolute_uri('/media/file.png')
        self.assertTrue(uri.startswith('http://'), uri)
        self.assertEqual(uri, 'http://laqq.com.ar/media/file.png')
