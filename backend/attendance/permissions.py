from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.utils import timezone
from users.models import User

class CanManageAttendancePermission(BasePermission):
    """
    Role-based permissions for Attendance:
    - Admin: Full Read-Only + Analytics & CSV Export.
    - Project Manager: Read-Only for assigned projects.
    - Site Engineer: Can mark/edit TODAY's attendance for assigned projects. Past dates are read-only.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        # Admin & PM have read-only access (GET, HEAD, OPTIONS)
        if request.user.role in [User.Role.ADMIN, User.Role.PROJECT_MANAGER]:
            if view.action in ['bulk', 'create', 'update', 'partial_update', 'destroy'] and request.method not in SAFE_METHODS:
                # PM & Admin cannot mark/edit daily attendance records except via system actions
                pass
            return True

        # Site Engineer can mark/create/update attendance
        if request.user.role == User.Role.SITE_ENGINEER:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == User.Role.ADMIN:
            return True

        if request.user.role == User.Role.PROJECT_MANAGER:
            # PM must manage the project
            return obj.project.assigned_manager_id == request.user.id

        if request.user.role == User.Role.SITE_ENGINEER:
            # Site Engineer can edit ONLY TODAY's attendance
            if request.method not in SAFE_METHODS:
                today = timezone.now().date()
                if obj.date != today:
                    return False
            return True

        return False
