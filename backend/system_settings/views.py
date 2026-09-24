import logging

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from system_settings.models import OrganizationSetting, UserPreference
from system_settings.permissions import IsAdminOrReadOnly
from system_settings.serializers import (
    ChangePasswordSerializer,
    OrganizationSettingSerializer,
    SettingsProfileSerializer,
    UserPreferenceSerializer,
)
from users.models import User

logger = logging.getLogger(__name__)


class UserPreferenceView(generics.RetrieveUpdateAPIView):
    """GET / PATCH the signed-in user's own preferences."""

    permission_classes = [IsAuthenticated]
    serializer_class = UserPreferenceSerializer

    def get_object(self):
        preference, created = UserPreference.objects.get_or_create(user=self.request.user)
        if created:
            logger.info('Created default preferences for user id=%s', self.request.user.id)
        return preference


class SettingsProfileView(generics.RetrieveUpdateAPIView):
    """GET / PATCH the signed-in user's own profile fields."""

    permission_classes = [IsAuthenticated]
    serializer_class = SettingsProfileSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """POST a current + new password pair to rotate the user's password."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        logger.info('Password changed for user id=%s', request.user.id)
        return Response(
            {'message': 'Password updated successfully. Please sign in again with your new password.'},
            status=status.HTTP_200_OK
        )


class OrganizationSettingView(generics.RetrieveUpdateAPIView):
    """GET for every authenticated user, PATCH for Admins only."""

    permission_classes = [IsAdminOrReadOnly]
    serializer_class = OrganizationSettingSerializer

    def get_object(self):
        return OrganizationSetting.load()

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
        logger.info('Organization settings updated by user id=%s', self.request.user.id)


class SettingsOverviewView(APIView):
    """Everything the Settings page needs, in one request.

    Bundles the profile, preferences, organization settings and the choice
    lists so the frontend can render every tab without a request waterfall.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        preference, _ = UserPreference.objects.get_or_create(user=request.user)
        organization = OrganizationSetting.load()

        return Response({
            'profile': SettingsProfileSerializer(request.user).data,
            'preferences': UserPreferenceSerializer(preference).data,
            'organization': OrganizationSettingSerializer(organization).data,
            'can_edit_organization': request.user.role == User.Role.ADMIN,
            'choices': {
                'theme': [
                    {'value': v, 'label': l} for v, l in UserPreference.Theme.choices
                ],
                'date_format': [
                    {'value': v, 'label': l} for v, l in UserPreference.DateFormat.choices
                ],
                'default_landing_page': [
                    {'value': v, 'label': l} for v, l in UserPreference.LandingPage.choices
                ],
            },
        }, status=status.HTTP_200_OK)
