from rest_framework.routers import DefaultRouter
from .views import ServiceTicketViewSet

router = DefaultRouter()
router.register(r'', ServiceTicketViewSet, basename='ticket')

urlpatterns = router.urls