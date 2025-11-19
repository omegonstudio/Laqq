from rest_framework.routers import DefaultRouter
from .views import NoteTypeViewSet, NoteStateViewSet, NoteViewSet

router = DefaultRouter()
router.register(r'', NoteViewSet, basename='note')
router.register(r'types', NoteTypeViewSet)
router.register(r'states', NoteStateViewSet)

urlpatterns = router.urls