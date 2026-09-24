from django.urls import path
from ai_engine.views import predict_project_api, ai_projects_list

urlpatterns = [
    path('predict/<int:project_id>/', predict_project_api, name='ai-predict'),
    path('projects/', ai_projects_list, name='ai-projects'),
]
