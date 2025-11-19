from rest_framework.routers import DefaultRouter
from .views import AccessoryViewSet, ProductAccessoryViewSet

router = DefaultRouter()
router.register(r'', AccessoryViewSet, basename='accessory')
router.register(r'product-accessories', ProductAccessoryViewSet)

urlpatterns = router.urls