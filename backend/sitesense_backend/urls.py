from django.contrib import admin
from django.urls import include, path, re_path

from sitesense_backend.views import FrontendAppView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/workers/', include('workers.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/materials/', include('materials.urls')),
    path('api/dailylogs/', include('dailylogs.urls')),
    path('api/ai/', include('ai_engine.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/settings/', include('system_settings.urls')),

    # Everything else is a React Router route. Must stay last, and must not
    # swallow the API, admin or static prefixes above.
    re_path(r'^(?!api/|admin/|static/|media/).*$', FrontendAppView.as_view(), name='frontend'),
]
