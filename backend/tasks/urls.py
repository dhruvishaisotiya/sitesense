from django.urls import path, include
from rest_framework.routers import DefaultRouter
from tasks.views import TaskViewSet, AvailableEngineersView

router = DefaultRouter()
router.register(r'', TaskViewSet, basename='task')

urlpatterns = [
    path('available-engineers/', AvailableEngineersView.as_view(), name='available_site_engineers'),
    path('', include(router.urls)),
]
