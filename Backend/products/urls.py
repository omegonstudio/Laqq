from rest_framework.routers import DefaultRouter
from .views import (
    BrandViewSet,
    CategoryViewSet,
    ProductViewSet,
    ProductVariantViewSet,
    TechnicalSpecViewSet,
    ProductsBulkUploadAPIView,
    BulkUploadErrorsAPIView,
)
from django.urls import path, include

router = DefaultRouter()
router.register(r'list', ProductViewSet, basename='product')
router.register(r'brands', BrandViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'variants', ProductVariantViewSet, basename='product-variant')
router.register(r'technical-specs', TechnicalSpecViewSet, basename='technical-spec')

urlpatterns = [
    path('bulk-upload/errors/', BulkUploadErrorsAPIView.as_view(), name='bulk-upload-errors'),
    path('bulk-upload/', ProductsBulkUploadAPIView.as_view(), name='products-bulk-upload'),
    path('', include(router.urls)),
]
