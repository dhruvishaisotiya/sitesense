from django.urls import path
from reports.views import (
    dashboard_summary_api,
    project_reports_api,
    worker_reports_api,
    attendance_reports_api,
    task_reports_api,
    budget_reports_api,
    daily_progress_reports_api,
    ai_reports_api,
    export_reports_api,
)

urlpatterns = [
    path('export/', export_reports_api, name='reports-export'),
    path('export', export_reports_api, name='reports-export-noslash'),
    path('dashboard-summary/', dashboard_summary_api, name='reports-dashboard-summary'),
    path('projects/', project_reports_api, name='reports-projects'),
    path('workers/', worker_reports_api, name='reports-workers'),
    path('attendance/', attendance_reports_api, name='reports-attendance'),
    path('tasks/', task_reports_api, name='reports-tasks'),
    path('budget/', budget_reports_api, name='reports-budget'),
    path('daily-progress/', daily_progress_reports_api, name='reports-daily-progress'),
    path('ai-prediction/', ai_reports_api, name='reports-ai-prediction'),
]
