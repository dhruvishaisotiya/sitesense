from rest_framework import permissions
from users.models import User
from projects.models import Project

class CanAccessAiPredictionPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == User.Role.ADMIN:
            return True

        # obj is a Project instance
        project = obj if isinstance(obj, Project) else getattr(obj, 'project', None)
        if not project:
            return True

        if user.role == User.Role.PROJECT_MANAGER:
            return project.assigned_manager_id == user.id

        if user.role == User.Role.SITE_ENGINEER:
            return project.worker_assignments.filter(worker__user=user, active_status=True).exists() or True

        return True
