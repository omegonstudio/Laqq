from django.urls import path

from .views import CertificateSearchAPIView

urlpatterns = [
    path("search/", CertificateSearchAPIView.as_view(), name="certificates-search"),
]
