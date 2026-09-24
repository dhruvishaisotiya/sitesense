from rest_framework.permissions import BasePermission, SAFE_METHODS
from users.models import User

class CanManageTasksPermission(BasePermission):
    """
    Role-Based Permission Rules for Tasks:
    - Admin: Full Access.
    - Project Manager: Full task management for managed projects.
    - Site Engineer: View assigned tasks + update progress & mark complete. Cannot create, edit, or approve.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.role == User.Role.ADMIN:
            return True

        if request.user.role == User.Role.PROJECT_MANAGER:
            return True

        if request.user.role == User.Role.SITE_ENGINEER:
            # Site Engineers can view, update progress, and mark complete
            if view.action in ['create', 'destroy', 'approve', 'reject'] and request.method not in SAFE_METHODS:
                return False
            return True

        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == User.Role.ADMIN:
            return True

        if request.user.role == User.Role.PROJECT_MANAGER:
            # PM can manage tasks for projects they manage
            return obj.project.assigned_manager_id == request.user.id

        if request.user.role == User.Role.SITE_ENGINEER:
            # Engineer can only interact with tasks assigned to them
            if obj.assigned_engineer_id != request.user.id:
                return False
            # Engineer cannot approve or reject
            if view.action in ['approve', 'reject']:
                return False
            return True

        return False
