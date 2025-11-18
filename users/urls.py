from rest_framework.routers import DefaultRouter
from .views import UserTypeViewSet, UserStateViewSet, UserViewSet

router = DefaultRouter()
router.register(r'usertypes', UserTypeViewSet)
router.register(r'userstates', UserStateViewSet)
router.register(r'users', UserViewSet)

urlpatterns = router.urls