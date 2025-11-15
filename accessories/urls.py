from rest_framework.routers import DefaultRouter
from .views import AccessoryViewSet, ProductAccessoryViewSet

router = DefaultRouter()
router.register(r'accessories', AccessoryViewSet)
router.register(r'productaccessories', ProductAccessoryViewSet)

urlpatterns = router.urls