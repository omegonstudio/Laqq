from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserTypeViewSet, UserStateViewSet, UserViewSet, CustomTokenObtainPairView

router = DefaultRouter()
router.register(r'list', UserViewSet, basename='user')
router.register(r'types', UserTypeViewSet)
router.register(r'states', UserStateViewSet)

urlpatterns = [
    # JWT Token endpoints (usamos la view custom para token/)
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] + router.urls