from rest_framework.routers import DefaultRouter
from .views import ContactStateViewSet, ContactViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'list', ContactViewSet, basename='contact')
router.register(r'states', ContactStateViewSet)
router.register(r'messages', MessageViewSet)

urlpatterns = router.urls