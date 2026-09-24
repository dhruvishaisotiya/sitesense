from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from django.contrib.auth import get_user_model

from tasks.models import Task
from projects.models import Project
from tasks.serializers import (
    TaskSerializer,
    TaskCreateUpdateSerializer,
    TaskProgressUpdateSerializer,
    TaskReviewSerializer,
    SimpleUserSerializer,
)
from tasks.permissions import CanManageTasksPermission
from users.permissions import IsProjectManagerRole
from users.models import User

User = get_user_model()


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [CanManageTasksPermission]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TaskCreateUpdateSerializer
        return TaskSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Task.objects.all()

        # Role-based visibility
        if user.role == User.Role.PROJECT_MANAGER:
            queryset = queryset.filter(project__assigned_manager=user)
        elif user.role == User.Role.SITE_ENGINEER:
            queryset = queryset.filter(Q(project__assigned_engineers=user) | Q(assigned_engineer=user))
        elif user.role != User.Role.ADMIN:
            return Task.objects.none()

        # Filters
        project_id = self.request.query_params.get('project_id', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        assigned_engineer = self.request.query_params.get('assigned_engineer', None)
        if assigned_engineer:
            queryset = queryset.filter(assigned_engineer_id=assigned_engineer)

        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)

        priority_param = self.request.query_params.get('priority', None)
        if priority_param:
            queryset = queryset.filter(priority=priority_param)

        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(task_id__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(project__project_name__icontains=search_query)
            )

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        project = serializer.validated_data.get('project')
        if self.request.user.role == User.Role.PROJECT_MANAGER and project.assigned_manager_id != self.request.user.id:
            raise PermissionError("Project Managers can only create tasks for projects they manage.")
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='update-progress')
    def update_progress(self, request, pk=None):
        task = self.get_object()
        serializer = TaskProgressUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        pct = serializer.validated_data['completion_percentage']
        actual_hrs = serializer.validated_data.get('actual_hours')
        notes = serializer.validated_data.get('engineer_notes', '')
        photo = serializer.validated_data.get('completion_photo')

        task.completion_percentage = pct
        if actual_hrs is not None:
            task.actual_hours = actual_hrs
        if notes:
            task.engineer_notes = notes
        if photo:
            task.completion_photo = photo

        # Auto transition status based on percentage
        if pct == 100.0:
            task.status = Task.Status.COMPLETED
        elif pct > 0.0 and task.status == Task.Status.PENDING:
            task.status = Task.Status.IN_PROGRESS

        task.save()

        return Response({
            "message": f"Progress for task '{task.task_id}' updated to {pct}%.",
            "task": TaskSerializer(task).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='mark-complete')
    def mark_complete(self, request, pk=None):
        task = self.get_object()
        task.completion_percentage = 100.0
        task.status = Task.Status.COMPLETED
        task.save()

        return Response({
            "message": f"Task '{task.task_id}' marked as Completed and submitted for manager review.",
            "task": TaskSerializer(task).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role == User.Role.SITE_ENGINEER:
            return Response({"error": "Site Engineers cannot approve tasks."}, status=status.HTTP_403_FORBIDDEN)

        task = self.get_object()
        serializer = TaskReviewSerializer(data=request.data)
        comments = request.data.get('manager_review_comments', '')

        task.status = Task.Status.APPROVED
        task.completion_percentage = 100.0
        task.manager_review_comments = comments
        task.save()

        return Response({
            "message": f"Task '{task.task_id}' approved successfully.",
            "task": TaskSerializer(task).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if request.user.role == User.Role.SITE_ENGINEER:
            return Response({"error": "Site Engineers cannot reject tasks."}, status=status.HTTP_403_FORBIDDEN)

        task = self.get_object()
        comments = request.data.get('manager_review_comments', '')

        task.status = Task.Status.REJECTED
        task.manager_review_comments = comments
        task.save()

        return Response({
            "message": f"Task '{task.task_id}' rejected with comments.",
            "task": TaskSerializer(task).data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        queryset = self.get_queryset()
        today = timezone.now().date()

        total_tasks = queryset.count()
        pending_count = queryset.filter(status=Task.Status.PENDING).count()
        in_progress_count = queryset.filter(status=Task.Status.IN_PROGRESS).count()
        completed_count = queryset.filter(status=Task.Status.COMPLETED).count()
        approved_count = queryset.filter(status=Task.Status.APPROVED).count()
        rejected_count = queryset.filter(status=Task.Status.REJECTED).count()

        overdue_count = queryset.filter(
            due_date__lt=today
        ).exclude(status__in=[Task.Status.COMPLETED, Task.Status.APPROVED]).count()

        # Priority distribution
        priority_low = queryset.filter(priority=Task.Priority.LOW).count()
        priority_medium = queryset.filter(priority=Task.Priority.MEDIUM).count()
        priority_high = queryset.filter(priority=Task.Priority.HIGH).count()
        priority_critical = queryset.filter(priority=Task.Priority.CRITICAL).count()

        return Response({
            "total_tasks": total_tasks,
            "pending_count": pending_count,
            "in_progress_count": in_progress_count,
            "completed_count": completed_count,
            "approved_count": approved_count,
            "rejected_count": rejected_count,
            "overdue_count": overdue_count,
            "priorities": {
                "Low": priority_low,
                "Medium": priority_medium,
                "High": priority_high,
                "Critical": priority_critical,
            }
        })


class AvailableEngineersView(generics.ListAPIView):
    permission_classes = [IsProjectManagerRole]
    serializer_class = SimpleUserSerializer

    def get_queryset(self):
        return User.objects.filter(role=User.Role.SITE_ENGINEER, is_active=True).order_by('first_name')
