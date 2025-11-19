from rest_framework.routers import DefaultRouter
from .views import BrandViewSet, CategoryViewSet, ProductViewSet, ProductSpecViewSet

router = DefaultRouter()
router.register(r'', ProductViewSet, basename='product')
router.register(r'brands', BrandViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'specs', ProductSpecViewSet)

urlpatterns = router.urls