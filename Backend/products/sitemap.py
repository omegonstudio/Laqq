"""Sitemap XML público: rutas estáticas del sitio + páginas /marcas/<slug>."""
from django.conf import settings
from django.http import HttpResponse
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from .models import Brand

# Mismas rutas/prioridades que Frontend/src/config/siteOrigin.ts SITEMAP_ROUTES
STATIC_SITEMAP_ROUTES = [
    ('/', 'weekly', '1.0'),
    ('/products', 'daily', '0.9'),
    ('/furniture', 'monthly', '0.8'),
    ('/company', 'monthly', '0.7'),
    ('/contact', 'monthly', '0.7'),
    ('/quote', 'monthly', '0.8'),
    ('/support', 'monthly', '0.6'),
    ('/certificates', 'monthly', '0.5'),
]


def _site_origin():
    return getattr(settings, 'FRONTEND_BASE_URL', 'https://laqq.com.ar').rstrip('/')


def _url_entry(loc, changefreq, priority):
    return (
        '  <url>\n'
        f'    <loc>{loc}</loc>\n'
        f'    <changefreq>{changefreq}</changefreq>\n'
        f'    <priority>{priority}</priority>\n'
        '  </url>'
    )


def build_sitemap_xml():
    origin = _site_origin()
    entries = []
    for path, changefreq, priority in STATIC_SITEMAP_ROUTES:
        loc = f'{origin}/' if path == '/' else f'{origin}{path}'
        entries.append(_url_entry(loc, changefreq, priority))

    for slug in (
        Brand.objects.exclude(slug='')
        .order_by('name')
        .values_list('slug', flat=True)
    ):
        entries.append(_url_entry(f'{origin}/marcas/{slug}', 'weekly', '0.8'))

    body = '\n'.join(entries)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f'{body}\n'
        '</urlset>\n'
    )


class SiteSitemapView(APIView):
    """GET /products/sitemap.xml — indexable por Googlebot sin auth."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        xml = build_sitemap_xml()
        return HttpResponse(xml, content_type='application/xml; charset=utf-8')
