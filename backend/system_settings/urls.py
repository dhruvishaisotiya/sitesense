from django.urls import path

from system_settings.views import (
    ChangePasswordView,
    OrganizationSettingView,
    SettingsOverviewView,
    SettingsProfileView,
    UserPreferenceView,
)

urlpatterns = [
    path('overview/', SettingsOverviewView.as_view(), name='settings_overview'),
    path('profile/', SettingsProfileView.as_view(), name='settings_profile'),
    path('preferences/', UserPreferenceView.as_view(), name='settings_preferences'),
    path('change-password/', ChangePasswordView.as_view(), name='settings_change_password'),
    path('organization/', OrganizationSettingView.as_view(), name='settings_organization'),
]
