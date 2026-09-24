from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils import timezone

from workers.models import Worker, ProjectWorker
from projects.models import Project
from workers.serializers import (
    WorkerSerializer,
    WorkerCreateUpdateSerializer,
    ProjectWorkerSerializer,
    AssignWorkerSerializer,
)
from workers.permissions import CanManageWorkersPermission
from users.models import User

User = get_user_model()


class WorkerViewSet(viewsets.ModelViewSet):
    permission_classes = [CanManageWorkersPermission]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WorkerCreateUpdateSerializer
        return WorkerSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Worker.objects.all()

        # Role-based visibility
        if user.role == User.Role.PROJECT_MANAGER:
            # A manager sees the shared worker pool (unassigned workers included,
            # so newly created workers can be assigned) minus workers currently
            # held by another manager's project.
            workers_on_other_projects = ProjectWorker.objects.filter(
                active_status=True
            ).exclude(
                project__assigned_manager=user
            ).values_list('worker_id', flat=True)

            queryset = queryset.exclude(id__in=workers_on_other_projects)
        elif user.role == User.Role.SITE_ENGINEER:
            queryset = queryset.filter(
                project_assignments__project__assigned_engineers=user,
                project_assignments__active_status=True
            )

        # Skill category filter
        skill = self.request.query_params.get('skill', None)
        if skill:
            queryset = queryset.filter(skill_category=skill)

        # Status filter
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Employment type filter
        emp_type = self.request.query_params.get('employment_type', None)
        if emp_type:
            queryset = queryset.filter(employment_type=emp_type)

        # Filter by project ID
        project_id = self.request.query_params.get('project_id', None)
        if project_id:
            queryset = queryset.filter(
                project_assignments__project_id=project_id,
                project_assignments__active_status=True
            )

        # Search query
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(full_name__icontains=search_query) |
                Q(worker_id__icontains=search_query) |
                Q(skill_category__icontains=search_query) |
                Q(designation__icontains=search_query) |
                Q(phone_number__icontains=search_query)
            )

        return queryset.distinct().order_by('-created_at')

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        worker = self.get_object()
        serializer = AssignWorkerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        project_id = serializer.validated_data['project_id']
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        # Role restriction: PM & SE can only assign to projects they are assigned to
        if request.user.role == User.Role.PROJECT_MANAGER and project.assigned_manager_id != request.user.id:
            return Response(
                {"error": "Project Managers can only assign workers to projects they manage."},
                status=status.HTTP_403_FORBIDDEN
            )
        elif request.user.role == User.Role.SITE_ENGINEER and not project.assigned_engineers.filter(id=request.user.id).exists():
            return Response(
                {"error": "Site Engineers can only assign workers to projects assigned to them."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check duplicate active assignment on same project
        existing = ProjectWorker.objects.filter(worker=worker, project=project, active_status=True).first()
        if existing:
            return Response(
                {"error": f"Worker '{worker.full_name}' is already actively assigned to '{project.project_name}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Deactivate any active assignments on other projects
        ProjectWorker.objects.filter(worker=worker, active_status=True).update(active_status=False)

        # Create new active assignment
        assignment = ProjectWorker.objects.create(
            worker=worker,
            project=project,
            assigned_by=request.user,
            active_status=True,
            assigned_date=timezone.now().date()
        )

        return Response({
            "message": f"Worker '{worker.full_name}' successfully assigned to '{project.project_name}'.",
            "assignment": ProjectWorkerSerializer(assignment).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def remove(self, request, pk=None):
        worker = self.get_object()
        active_assignments = ProjectWorker.objects.filter(worker=worker, active_status=True)

        if not active_assignments.exists():
            return Response({"error": "Worker does not have an active project assignment."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify permission
        if request.user.role == User.Role.PROJECT_MANAGER:
            for assignment in active_assignments:
                if assignment.project.assigned_manager_id != request.user.id:
                    return Response(
                        {"error": "You can only remove workers from projects you manage."},
                        status=status.HTTP_403_FORBIDDEN
                    )
        elif request.user.role == User.Role.SITE_ENGINEER:
            for assignment in active_assignments:
                if not assignment.project.assigned_engineers.filter(id=request.user.id).exists():
                    return Response(
                        {"error": "You can only remove workers from projects assigned to you."},
                        status=status.HTTP_403_FORBIDDEN
                    )

        active_assignments.update(active_status=False)

        return Response({
            "message": f"Worker '{worker.full_name}' successfully removed from project."
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Lists active workers who currently have no active project assignment."""
        assigned_worker_ids = ProjectWorker.objects.filter(active_status=True).values_list('worker_id', flat=True)
        available_workers = Worker.objects.filter(status=Worker.Status.ACTIVE).exclude(id__in=assigned_worker_ids)
        serializer = WorkerSerializer(available_workers, many=True)
        return Response(serializer.data)
