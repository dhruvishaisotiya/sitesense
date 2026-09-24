import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.models import User
from reports.permissions import CanAccessReportsPermission, CanExportFinancialReportsPermission
from reports.services import ReportAggregationService
from reports.exporters import ReportExporterService

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessReportsPermission])
def dashboard_summary_api(request):
    project_id = request.query_params.get('project_id')
    manager_id = request.query_params.get('manager_id')
    data = ReportAggregationService.get_dashboard_summary(request.user, project_id, manager_id)
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessReportsPermission])
def project_reports_api(request):
    project_id = request.query_params.get('project_id')
    manager_id = request.query_params.get('manager_id')
    data = ReportAggregationService.get_project_reports(request.user, project_id, manager_id)
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessReportsPermission])
def worker_reports_api(request):
    project_id = request.query_params.get('project_id')
    data = ReportAggregationService.get_worker_reports(request.user, project_id)
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessReportsPermission])
def attendance_reports_api(request):
    project_id = request.query_params.get('project_id')
    data = ReportAggregationService.get_attendance_reports(request.user, project_id)
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessReportsPermission])
def task_reports_api(request):
    project_id = request.query_params.get('project_id')
    manager_id = request.query_params.get('manager_id')
    data = ReportAggregationService.get_task_reports(request.user, project_id, manager_id)
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessReportsPermission])
def budget_reports_api(request):
    project_id = request.query_params.get('project_id')
    data = ReportAggregationService.get_budget_reports(request.user, project_id)
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessReportsPermission])
def daily_progress_reports_api(request):
    project_id = request.query_params.get('project_id')
    data = ReportAggregationService.get_daily_progress_reports(request.user, project_id)
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessReportsPermission])
def ai_reports_api(request):
    project_id = request.query_params.get('project_id')
    data = ReportAggregationService.get_ai_reports(request.user, project_id)
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessReportsPermission])
def export_reports_api(request):
    try:
        fmt = (request.query_params.get('export_format') or request.query_params.get('format') or 'csv').lower()
        report_type = request.query_params.get('report_type', 'projects').lower()
        project_id = request.query_params.get('project_id')
        logger.debug(
            'Report export requested: user_id=%s, role=%s, format=%s, report_type=%s',
            request.user.id, request.user.role, fmt, report_type
        )

        if request.user.role == User.Role.SITE_ENGINEER and report_type in ['budget', 'financial', 'materials']:
            return Response({'error': 'Site Engineers cannot export financial reports.'}, status=status.HTTP_403_FORBIDDEN)

        if report_type == 'projects':
            data = ReportAggregationService.get_project_reports(request.user, project_id)
        elif report_type == 'workers':
            data = ReportAggregationService.get_worker_reports(request.user, project_id)
        elif report_type == 'attendance':
            data = ReportAggregationService.get_attendance_reports(request.user, project_id)
        elif report_type == 'tasks':
            data = ReportAggregationService.get_task_reports(request.user, project_id)
        elif report_type == 'budget':
            data = ReportAggregationService.get_budget_reports(request.user, project_id)
        elif report_type == 'dailylogs':
            data = ReportAggregationService.get_daily_progress_reports(request.user, project_id)
        else:
            data = ReportAggregationService.get_ai_reports(request.user, project_id)

        if fmt == 'pdf':
            return ReportExporterService.export_pdf(report_type, data)
        elif fmt in ['excel', 'xlsx']:
            return ReportExporterService.export_excel(report_type, data)
        else:
            return ReportExporterService.export_csv(report_type, data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
