from rest_framework.routers import DefaultRouter
from .views import QuoteTypeViewSet, QuoteStateViewSet, QuoteViewSet, QuoteItemViewSet

router = DefaultRouter()
router.register(r'list', QuoteViewSet, basename='quote')
router.register(r'types', QuoteTypeViewSet)
router.register(r'states', QuoteStateViewSet)
router.register(r'items', QuoteItemViewSet)

urlpatterns = router.urls