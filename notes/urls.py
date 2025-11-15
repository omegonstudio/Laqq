from rest_framework.routers import DefaultRouter
from .views import NoteTypeViewSet, NoteStateViewSet, NoteViewSet

router = DefaultRouter()
router.register(r'notetypes', NoteTypeViewSet)
router.register(r'notestates', NoteStateViewSet)
router.register(r'notes', NoteViewSet)

urlpatterns = router.urls