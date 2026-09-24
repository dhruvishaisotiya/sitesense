from decimal import Decimal
from datetime import date as datetime_date
from django.db.models import Q, Sum, Avg, Count, Max
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from dailylogs.models import ProjectDailyProgress
from projects.models import Project
from workers.models import ProjectWorker
from attendance.models import Attendance
from materials.models import Expense
from tasks.models import Task

from dailylogs.serializers import (
    ProjectDailyProgressSerializer,
    ProjectDailyProgressCreateSerializer,
)
from dailylogs.permissions import CanManageDailyLogsPermission
from users.models import User


class DailyLogViewSet(viewsets.ModelViewSet):
    permission_classes = [CanManageDailyLogsPermission]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProjectDailyProgressCreateSerializer
        return ProjectDailyProgressSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = ProjectDailyProgress.objects.all()

        if user.role == User.Role.PROJECT_MANAGER:
            queryset = queryset.filter(project__assigned_manager=user)
        elif user.role == User.Role.SITE_ENGINEER:
            queryset = queryset.filter(project__assigned_engineers=user)

        project_id = self.request.query_params.get('project_id', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        day_num = self.request.query_params.get('day_number', None)
        if day_num:
            queryset = queryset.filter(day_number=day_num)

        stage_param = self.request.query_params.get('construction_stage', None)
        if stage_param:
            queryset = queryset.filter(construction_stage=stage_param)

        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(progress_id__icontains=search_query) |
                Q(construction_stage__icontains=search_query) |
                Q(project__project_name__icontains=search_query)
            )

        return queryset.order_by('-day_number', '-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        project_id = request.data.get('project')
        day_number = request.data.get('day_number')
        if project_id and day_number:
            existing = ProjectDailyProgress.objects.filter(project_id=project_id, day_number=day_number).first()
            if existing:
                serializer = self.get_serializer(existing, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                instance = serializer.save()
                return Response(ProjectDailyProgressSerializer(instance).data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='auto-fetch')
    def auto_fetch_project_data(self, request):
        project_id = request.query_params.get('project_id', None)
        if not project_id:
            return Response({"error": "project_id query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        today = datetime_date.today()
        # Day Number = (today - project.start_date).days + 1
        delta_days = (today - project.start_date).days + 1
        day_number = max(1, delta_days)

        # Workers & Attendance calculations
        assigned_worker_ids = ProjectWorker.objects.filter(project=project, active_status=True).values_list('worker_id', flat=True)
        expected_workers = len(assigned_worker_ids)
        current_workers = expected_workers

        att_qs = Attendance.objects.filter(project=project)
        if not att_qs.exists() and expected_workers > 0:
            att_qs = Attendance.objects.filter(worker_id__in=assigned_worker_ids)

        if att_qs.exists():
            latest_att_date = att_qs.filter(date=today).values_list('date', flat=True).first()
            if not latest_att_date:
                latest_att_date = att_qs.order_by('-date').values_list('date', flat=True).first()

            day_att = att_qs.filter(date=latest_att_date)
            total_logged = day_att.count()
            present_logged = day_att.filter(status__in=['Present', 'Half Day', 'PRESENT', 'HALF_DAY']).count()

            if total_logged > 0:
                attendance_percentage = round(float((present_logged / total_logged) * 100), 1)
            elif expected_workers > 0:
                attendance_percentage = round(float((present_logged / expected_workers) * 100), 1)
            else:
                attendance_percentage = 95.0
        else:
            attendance_percentage = 95.0

        # Expenses / Budget Used sum
        budget_used = Expense.objects.filter(project=project).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Today's Completed Tasks Summary
        completed_tasks = list(Task.objects.filter(
            project=project,
            status__in=['COMPLETED', 'APPROVED']
        ).values('id', 'task_id', 'title'))

        return Response({
            "project_id": project.id,
            "project_name": project.project_name,
            "project_code": project.project_code,
            "day_number": day_number,
            "building_type": project.building_type,
            "blocks": project.blocks,
            "floors": project.floors,
            "area_sqft": float(project.area_sqft),
            "total_budget": float(project.total_budget),
            "expected_workers": expected_workers,
            "current_workers": current_workers,
            "attendance_percentage": attendance_percentage,
            "progress_percentage": float(project.current_progress),
            "budget_used": float(budget_used),
            "todays_completed_tasks": completed_tasks
        })

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        queryset = self.get_queryset()

        max_day = queryset.aggregate(max_d=Max('day_number'))['max_d'] or 0
        avg_attendance = queryset.aggregate(avg=Avg('attendance_percentage'))['avg'] or Decimal('0.00')
        total_rainfall = queryset.aggregate(total=Sum('rainfall_mm'))['total'] or Decimal('0.00')
        latest_record = queryset.order_by('-day_number').first()
        latest_progress = latest_record.progress_percentage if latest_record else Decimal('0.00')
        total_budget_used = queryset.aggregate(total=Sum('budget_used'))['total'] or Decimal('0.00')

        # Recharts Trends
        trend_qs = queryset.order_by('day_number')[:30]
        attendance_trend = []
        rainfall_trend = []
        progress_trend = []
        budget_trend = []

        for item in trend_qs:
            day_label = f"Day {item.day_number}"
            attendance_trend.append({
                "day_number": day_label,
                "attendance_percentage": float(item.attendance_percentage)
            })
            rainfall_trend.append({
                "day_number": day_label,
                "rainfall_mm": float(item.rainfall_mm)
            })
            progress_trend.append({
                "day_number": day_label,
                "progress_percentage": float(item.progress_percentage)
            })
            budget_trend.append({
                "day_number": day_label,
                "budget_used": float(item.budget_used)
            })

        # Construction Stage Distribution
        stage_counts = queryset.values('construction_stage').annotate(count=Count('id'))
        stage_distribution = [
            {"stage": item['construction_stage'], "count": item['count']}
            for item in stage_counts
        ]

        return Response({
            "latest_day_number": max_day,
            "average_attendance_percentage": round(float(avg_attendance), 1),
            "total_rainfall_mm": float(total_rainfall),
            "latest_progress_percentage": float(latest_progress),
            "total_budget_used": float(total_budget_used),
            "attendance_trend": attendance_trend,
            "rainfall_trend": rainfall_trend,
            "progress_trend": progress_trend,
            "budget_trend": budget_trend,
            "stage_distribution": stage_distribution,
        })
