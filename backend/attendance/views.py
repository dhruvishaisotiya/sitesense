import csv
from django.http import HttpResponse
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from django.contrib.auth import get_user_model

from attendance.models import Attendance
from workers.models import Worker, ProjectWorker
from projects.models import Project
from attendance.serializers import (
    AttendanceSerializer,
    BulkAttendanceSerializer,
)
from attendance.permissions import CanManageAttendancePermission
from users.models import User

User = get_user_model()


class AttendanceViewSet(viewsets.ModelViewSet):
    permission_classes = [CanManageAttendancePermission]
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Attendance.objects.all()

        # Role-based visibility filtering
        if user.role == User.Role.PROJECT_MANAGER:
            queryset = queryset.filter(project__assigned_manager=user)
        elif user.role == User.Role.SITE_ENGINEER:
            queryset = queryset.filter(project__assigned_engineers=user)

        # Filters
        project_id = self.request.query_params.get('project_id', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        target_date = self.request.query_params.get('date', None)
        if target_date:
            queryset = queryset.filter(date=target_date)

        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date and end_date:
            queryset = queryset.filter(date__gte=start_date, date__lte=end_date)

        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)

        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(worker__full_name__icontains=search_query) |
                Q(worker__worker_id__icontains=search_query) |
                Q(project__project_name__icontains=search_query) |
                Q(remarks__icontains=search_query)
            )

        return queryset.order_by('-date', 'worker__full_name')

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)

    @action(detail=False, methods=['post'])
    def bulk(self, request):
        # Role check: PM & Admin cannot mark daily attendance
        if request.user.role == User.Role.PROJECT_MANAGER:
            return Response(
                {"error": "Project Managers are not permitted to mark daily worker attendance."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BulkAttendanceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        project_id = serializer.validated_data['project_id']
        target_date = serializer.validated_data['date']
        items = serializer.validated_data['items']

        today = timezone.now().date()
        if target_date > today:
            return Response({"error": "Future attendance dates are not allowed."}, status=status.HTTP_400_BAD_REQUEST)

        # Site Engineer edit restriction: Only TODAY's attendance can be edited
        if request.user.role == User.Role.SITE_ENGINEER and target_date != today:
            return Response({"error": "Site Engineers can edit attendance ONLY for today's date."}, status=status.HTTP_403_FORBIDDEN)

        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        saved_records = []
        for item in items:
            worker_id = item['worker_id']
            try:
                worker = Worker.objects.get(id=worker_id)
            except Worker.DoesNotExist:
                continue

            # Verify active project assignment
            is_assigned = ProjectWorker.objects.filter(worker=worker, project=project, active_status=True).exists()
            if not is_assigned:
                continue

            attendance, created = Attendance.objects.update_or_create(
                worker=worker,
                date=target_date,
                defaults={
                    'project': project,
                    'status': item['status'],
                    'check_in_time': item.get('check_in_time'),
                    'check_out_time': item.get('check_out_time'),
                    'overtime_hours': item.get('overtime_hours', 0.00),
                    'remarks': item.get('remarks', ''),
                    'recorded_by': request.user,
                }
            )
            saved_records.append(attendance)

        return Response({
            "message": f"Successfully recorded attendance for {len(saved_records)} workers on {target_date}.",
            "count": len(saved_records)
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        project_id = request.query_params.get('project_id', None)
        target_date = request.query_params.get('date', str(timezone.now().date()))

        queryset = Attendance.objects.filter(date=target_date)
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        if request.user.role == User.Role.PROJECT_MANAGER:
            queryset = queryset.filter(project__assigned_manager=request.user)
        elif request.user.role == User.Role.SITE_ENGINEER:
            queryset = queryset.filter(project__assigned_engineers=request.user)

        # Get total assigned workers for target project
        assigned_workers_count = 0
        if project_id:
            assigned_workers_count = ProjectWorker.objects.filter(project_id=project_id, active_status=True).count()
        else:
            assigned_workers_count = ProjectWorker.objects.filter(active_status=True).count()

        present_count = queryset.filter(status=Attendance.Status.PRESENT).count()
        absent_count = queryset.filter(status=Attendance.Status.ABSENT).count()
        half_day_count = queryset.filter(status=Attendance.Status.HALF_DAY).count()
        leave_count = queryset.filter(status=Attendance.Status.LEAVE).count()

        total_recorded = present_count + absent_count + half_day_count + leave_count
        effective_present = present_count + (half_day_count * 0.5)

        base_total = assigned_workers_count if assigned_workers_count > 0 else (total_recorded if total_recorded > 0 else 1)
        attendance_percentage = round((effective_present / base_total) * 100, 1)

        return Response({
            "date": target_date,
            "total_assigned_workers": assigned_workers_count,
            "total_recorded": total_recorded,
            "present_count": present_count,
            "absent_count": absent_count,
            "half_day_count": half_day_count,
            "leave_count": leave_count,
            "attendance_percentage": min(attendance_percentage, 100.0),
        })

    @action(detail=False, methods=['get'], url_path='export-csv')
    def export_csv(self, request):
        """Generates downloadable CSV export of attendance records."""
        queryset = self.get_queryset()

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="SiteSense_Attendance_Export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Worker ID',
            'Worker Name',
            'Skill Category',
            'Project Code',
            'Project Name',
            'Date',
            'Status',
            'Check In',
            'Check Out',
            'Overtime Hours',
            'Remarks',
            'Recorded By'
        ])

        for att in queryset:
            writer.writerow([
                att.worker.worker_id,
                att.worker.full_name,
                att.worker.skill_category,
                att.project.project_code,
                att.project.project_name,
                att.date,
                att.status,
                att.check_in_time or '',
                att.check_out_time or '',
                att.overtime_hours,
                att.remarks,
                att.recorded_by.get_full_name() if att.recorded_by else 'System'
            ])

        return response
