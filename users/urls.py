from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView, TokenRefreshView, TokenVerifyView
)
from rest_framework.routers import DefaultRouter
from .views import UserTypeViewSet, UserStateViewSet, UserViewSet

router = DefaultRouter()
router.register(r'usertypes', UserTypeViewSet)
router.register(r'userstates', UserStateViewSet)
router.register(r'users', UserViewSet)

urlpatterns = router.urls + [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]