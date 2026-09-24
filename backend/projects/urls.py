from django.urls import path, include
from rest_framework.routers import DefaultRouter
from projects.views import ProjectViewSet, AvailableProjectManagersView, AvailableSiteEngineersView

router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='project')

urlpatterns = [
    path('available-managers/', AvailableProjectManagersView.as_view(), name='available_project_managers'),
    path('available-engineers/', AvailableSiteEngineersView.as_view(), name='available_site_engineers'),
    path('', include(router.urls)),
]
