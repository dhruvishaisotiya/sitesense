from rest_framework.permissions import BasePermission, SAFE_METHODS
from users.models import User

class CanManageDailyLogsPermission(BasePermission):
    """
    Role-based permissions for Project Daily Progress (Module 7):
    - Admin: View every record, search, filter, analytics. Read-Only for entries.
    - Project Manager: View records for assigned projects. Cannot edit.
    - Site Engineer: Create & Edit today's entry (highest day_number entry). Past entries are Read-Only.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.role == User.Role.ADMIN:
            return True

        if request.user.role == User.Role.PROJECT_MANAGER:
            return request.method in SAFE_METHODS

        if request.user.role == User.Role.SITE_ENGINEER:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == User.Role.ADMIN:
            return True

        if request.user.role == User.Role.PROJECT_MANAGER:
            return obj.project.assigned_manager_id == request.user.id

        if request.user.role == User.Role.SITE_ENGINEER:
            # Site Engineer can edit ONLY today's latest entry
            if request.method not in SAFE_METHODS:
                max_day = obj.project.daily_progress.order_by('-day_number').values_list('day_number', flat=True).first() or 0
                if obj.day_number < max_day:
                    return False
            return True

        return False
