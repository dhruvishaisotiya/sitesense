from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.contrib.auth import get_user_model

from projects.models import Project
from projects.serializers import (
    ProjectSerializer,
    ProjectCreateUpdateSerializer,
    ProjectManagerUserSerializer,
)
from projects.permissions import IsAdminOrProjectManagerReadOnly
from users.permissions import IsAdminRole

User = get_user_model()


class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrProjectManagerReadOnly]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateUpdateSerializer
        return ProjectSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Project.objects.all()

        # Role-based visibility
        if user.role == User.Role.PROJECT_MANAGER:
            queryset = queryset.filter(assigned_manager=user)
        elif user.role == User.Role.SITE_ENGINEER:
            queryset = queryset.filter(assigned_engineers=user)
        elif user.role != User.Role.ADMIN:
            return Project.objects.none()

        # Archive filter logic
        is_archived = self.request.query_params.get('is_archived', 'false').lower() == 'true'
        status_param = self.request.query_params.get('status', None)

        if status_param:
            queryset = queryset.filter(status=status_param)
        elif is_archived:
            queryset = queryset.filter(status=Project.Status.ARCHIVED)
        else:
            queryset = queryset.exclude(status=Project.Status.ARCHIVED)

        # Building type filter
        building_type = self.request.query_params.get('building_type', None)
        if building_type:
            queryset = queryset.filter(building_type=building_type)

        # Assigned manager filter
        assigned_manager = self.request.query_params.get('assigned_manager', None)
        if assigned_manager:
            queryset = queryset.filter(assigned_manager_id=assigned_manager)

        # Search query
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(project_name__icontains=search_query) |
                Q(project_code__icontains=search_query) |
                Q(building_type__icontains=search_query) |
                Q(description__icontains=search_query)
            )

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole])
    def archive(self, request, pk=None):
        project = self.get_object()
        project.status = Project.Status.ARCHIVED
        project.save()
        serializer = ProjectSerializer(project)
        return Response({
            "message": f"Project '{project.project_name}' archived successfully.",
            "project": serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole])
    def restore(self, request, pk=None):
        project = self.get_object()
        if project.status != Project.Status.ARCHIVED:
            return Response({"error": "Project is not archived."}, status=status.HTTP_400_BAD_REQUEST)

        # Restore to PLANNING by default
        project.status = Project.Status.PLANNING
        project.save()
        serializer = ProjectSerializer(project)
        return Response({
            "message": f"Project '{project.project_name}' restored successfully.",
            "project": serializer.data
        }, status=status.HTTP_200_OK)


class AvailableProjectManagersView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = ProjectManagerUserSerializer

    def get_queryset(self):
        return User.objects.filter(role=User.Role.PROJECT_MANAGER, is_active=True).order_by('first_name')


class AvailableSiteEngineersView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = ProjectManagerUserSerializer

    def get_queryset(self):
        return User.objects.filter(role=User.Role.SITE_ENGINEER, is_active=True).order_by('first_name')

