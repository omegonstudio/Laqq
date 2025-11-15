from rest_framework.routers import DefaultRouter
from .views import AttachmentViewSet

router = DefaultRouter()
router.register(r'attachments', AttachmentViewSet)

urlpatterns = router.urls