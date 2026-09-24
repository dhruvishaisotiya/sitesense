from rest_framework.permissions import BasePermission, SAFE_METHODS
from users.models import User

class CanManageWorkersPermission(BasePermission):
    """
    Role-Based Access Control for Worker Management:
    - Admin: Full Access.
    - Project Manager: Full Worker CRUD + Assign/Remove to managed projects.
    - Site Engineer: Read-Only Access.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        # Admin & PM have full access to worker actions
        if request.user.role in [User.Role.ADMIN, User.Role.PROJECT_MANAGER]:
            return True

        # Site Engineer is read-only
        if request.user.role == User.Role.SITE_ENGINEER:
            return request.method in SAFE_METHODS

        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == User.Role.ADMIN:
            return True

        if request.user.role == User.Role.PROJECT_MANAGER:
            # PM can read/write worker details
            return True

        if request.user.role == User.Role.SITE_ENGINEER:
            return request.method in SAFE_METHODS

        return False
