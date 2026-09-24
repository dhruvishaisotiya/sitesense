from rest_framework.permissions import BasePermission
from users.models import User

class IsAdminRole(BasePermission):
    """Allows access only to Admin users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.ADMIN
        )

class IsProjectManagerRole(BasePermission):
    """Allows access to Project Managers and Admins."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in [User.Role.ADMIN, User.Role.PROJECT_MANAGER]
        )

class IsSiteEngineerRole(BasePermission):
    """Allows access to Site Engineers, Project Managers, and Admins."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in [User.Role.ADMIN, User.Role.PROJECT_MANAGER, User.Role.SITE_ENGINEER]
        )
