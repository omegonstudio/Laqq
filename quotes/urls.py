from rest_framework.routers import DefaultRouter
from .views import QuoteTypeViewSet, QuoteStateViewSet, QuoteViewSet, QuoteItemViewSet

router = DefaultRouter()
router.register(r'quotetypes', QuoteTypeViewSet)
router.register(r'quotestates', QuoteStateViewSet)
router.register(r'quotes', QuoteViewSet)
router.register(r'quoteitems', QuoteItemViewSet)

urlpatterns = router.urls