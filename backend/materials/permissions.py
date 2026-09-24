from rest_framework.permissions import BasePermission, SAFE_METHODS
from users.models import User

class CanManageMaterialsPermission(BasePermission):
    """
    Role-based permissions for Materials & Expenses:
    - Admin: Full CRUD access across catalog, purchases, expenses.
    - Project Manager: Read-Only access for managed projects.
    - Site Engineer: Can purchase materials and view purchase history. Cannot edit catalog.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.role == User.Role.ADMIN:
            return True

        if request.user.role == User.Role.PROJECT_MANAGER:
            # PM has read-only access (GET, HEAD, OPTIONS)
            return request.method in SAFE_METHODS

        if request.user.role == User.Role.SITE_ENGINEER:
            # Site Engineer can view and purchase materials
            if view.basename == 'material-catalog' and request.method not in SAFE_METHODS:
                return False
            return True

        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == User.Role.ADMIN:
            return True

        if request.user.role == User.Role.PROJECT_MANAGER:
            # PM check for managed project
            if hasattr(obj, 'project'):
                return obj.project.assigned_manager_id == request.user.id
            return True

        if request.user.role == User.Role.SITE_ENGINEER:
            if view.basename == 'material-catalog' and request.method not in SAFE_METHODS:
                return False
            return True

        return False
