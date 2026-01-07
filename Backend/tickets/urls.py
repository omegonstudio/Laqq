from rest_framework.routers import DefaultRouter
from .views import ServiceTicketViewSet, TicketStateViewSet, TicketPriorityViewSet

router = DefaultRouter()
# Registrar primero las rutas más específicas antes de la ruta base vacía
router.register(r'states', TicketStateViewSet, basename='ticket-state')
router.register(r'priorities', TicketPriorityViewSet, basename='ticket-priority')
router.register(r'', ServiceTicketViewSet, basename='ticket')

urlpatterns = router.urls