from rest_framework.routers import DefaultRouter
from .views import ContactStateViewSet, ContactViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'contactstates', ContactStateViewSet)
router.register(r'contacts', ContactViewSet)
router.register(r'messages', MessageViewSet)

urlpatterns = router.urls