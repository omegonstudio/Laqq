from rest_framework.routers import DefaultRouter
from .views import (
    BrandViewSet,
    CategoryViewSet,
    ProductViewSet,
    ProductSpecViewSet,
    ProductSpecificationViewSet,
    ProductsBulkUploadAPIView,
)
from django.urls import path, include

router = DefaultRouter()
router.register(r'list', ProductViewSet, basename='product')
router.register(r'brands', BrandViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'specs', ProductSpecViewSet)
router.register(r'specifications', ProductSpecificationViewSet, basename='product-specification')

urlpatterns = [
    path('bulk-upload/', ProductsBulkUploadAPIView.as_view(), name='products-bulk-upload'),
    path('', include(router.urls)),
]