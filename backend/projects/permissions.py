from rest_framework.permissions import BasePermission, SAFE_METHODS
from users.models import User

class IsAdminOrProjectManagerReadOnly(BasePermission):
    """
    Custom permission for Projects:
    - Admin has full CRUD permissions.
    - Project Manager has read-only access to assigned projects.
    - Site Engineer is forbidden.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.role == User.Role.ADMIN:
            return True

        if request.user.role in [User.Role.PROJECT_MANAGER, User.Role.SITE_ENGINEER]:
            # Read-only safe methods only (GET, HEAD, OPTIONS)
            return request.method in SAFE_METHODS

        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == User.Role.ADMIN:
            return True

        if request.user.role == User.Role.PROJECT_MANAGER:
            # Read-only check: PM must be assigned to this project
            return request.method in SAFE_METHODS and obj.assigned_manager_id == request.user.id

        if request.user.role == User.Role.SITE_ENGINEER:
            return request.method in SAFE_METHODS

        return False
