from rest_framework.routers import DefaultRouter
from .views import UserTypeViewSet, UserStateViewSet, UserViewSet

router = DefaultRouter()
router.register(r'list', UserViewSet, basename='user')
router.register(r'types', UserTypeViewSet)
router.register(r'states', UserStateViewSet)

urlpatterns = router.urls