from django.contrib import admin

from system_settings.models import OrganizationSetting, UserPreference


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'theme', 'default_landing_page', 'email_notifications', 'updated_at')
    list_filter = ('theme', 'email_notifications', 'in_app_notifications')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    raw_id_fields = ('user',)


@admin.register(OrganizationSetting)
class OrganizationSettingAdmin(admin.ModelAdmin):
    list_display = ('organization_name', 'currency_code', 'timezone', 'updated_by', 'updated_at')

    def has_add_permission(self, request):
        # Singleton: the row is created on first access via load().
        return not OrganizationSetting.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
