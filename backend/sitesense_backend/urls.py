from django.contrib import admin
from django.urls import path, include

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
]
