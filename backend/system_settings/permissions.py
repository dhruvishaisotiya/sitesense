from rest_framework.permissions import SAFE_METHODS, BasePermission

from users.models import User


class IsAdminOrReadOnly(BasePermission):
    """Any authenticated user may read; only Admins may write.

    Organization settings drive currency symbols and alert thresholds across
    every module, so all roles need read access, but changing them is an
    administrative action.
    """

    message = 'Only an Admin can change organization settings.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == User.Role.ADMIN
