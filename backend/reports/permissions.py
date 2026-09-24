from rest_framework import permissions
from users.models import User

class CanAccessReportsPermission(permissions.BasePermission):
    """
    Role-based permissions for Reports & Analytics module.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in [User.Role.ADMIN, User.Role.PROJECT_MANAGER, User.Role.SITE_ENGINEER]


class CanExportFinancialReportsPermission(permissions.BasePermission):
    """
    Site Engineers cannot export financial/budget reports.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == User.Role.SITE_ENGINEER:
            report_type = request.query_params.get('report_type', '')
            if report_type in ['budget', 'financial', 'materials']:
                return False
        return True
