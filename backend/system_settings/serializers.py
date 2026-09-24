from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from system_settings.models import OrganizationSetting, UserPreference

User = get_user_model()


class UserPreferenceSerializer(serializers.ModelSerializer):
    theme_display = serializers.CharField(source='get_theme_display', read_only=True)

    class Meta:
        model = UserPreference
        fields = (
            'id',
            'theme',
            'theme_display',
            'date_format',
            'default_landing_page',
            'items_per_page',
            'compact_tables',
            'email_notifications',
            'in_app_notifications',
            'notify_task_assigned',
            'notify_task_status_change',
            'notify_attendance_summary',
            'notify_material_purchase',
            'notify_budget_overspend',
            'notify_ai_risk_alert',
            'notify_daily_log_reminder',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_items_per_page(self, value):
        if value < 5 or value > 100:
            raise serializers.ValidationError('Items per page must be between 5 and 100.')
        return value


class SettingsProfileSerializer(serializers.ModelSerializer):
    """Self-service profile editing.

    Email and role stay read-only: email is the login identifier and role is
    an Admin-controlled authorization decision, not a user preference.
    """

    role_display = serializers.CharField(source='get_role_display', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'role_display',
            'phone_number',
            'employee_id',
            'department',
            'avatar_url',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id', 'email', 'role', 'role_display', 'employee_id',
            'created_at', 'updated_at',
        )

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email

    def validate_first_name(self, value):
        if not value.strip():
            raise serializers.ValidationError('First name cannot be blank.')
        return value.strip()

    def validate_avatar_url(self, value):
        if value and not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError('Avatar URL must start with http:// or https://')
        return value


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate(self, attrs):
        new_password = attrs['new_password']

        if new_password != attrs['confirm_password']:
            raise serializers.ValidationError(
                {'confirm_password': 'New password and confirmation do not match.'}
            )

        if new_password == attrs['current_password']:
            raise serializers.ValidationError(
                {'new_password': 'New password must be different from the current password.'}
            )

        try:
            validate_password(new_password, user=self.context['request'].user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'new_password': list(exc.messages)})

        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user


class OrganizationSettingSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationSetting
        fields = (
            'id',
            'organization_name',
            'contact_email',
            'contact_phone',
            'address',
            'currency_code',
            'currency_symbol',
            'timezone',
            'working_days_per_week',
            'standard_shift_hours',
            'budget_alert_threshold',
            'attendance_alert_threshold',
            'ai_high_risk_threshold',
            'updated_by',
            'updated_by_name',
            'updated_at',
        )
        read_only_fields = ('id', 'updated_by', 'updated_by_name', 'updated_at')

    def get_updated_by_name(self, obj):
        if not obj.updated_by:
            return None
        return obj.updated_by.get_full_name() or obj.updated_by.email

    def validate_organization_name(self, value):
        if not value.strip():
            raise serializers.ValidationError('Organization name cannot be blank.')
        return value.strip()

    def validate_working_days_per_week(self, value):
        if value < 1 or value > 7:
            raise serializers.ValidationError('Working days per week must be between 1 and 7.')
        return value

    def validate_standard_shift_hours(self, value):
        if value <= 0 or value > 24:
            raise serializers.ValidationError('Standard shift hours must be between 1 and 24.')
        return value

    def _validate_percentage(self, value, label):
        if value < 0 or value > 100:
            raise serializers.ValidationError(f'{label} must be between 0 and 100.')
        return value

    def validate_budget_alert_threshold(self, value):
        return self._validate_percentage(value, 'Budget alert threshold')

    def validate_attendance_alert_threshold(self, value):
        return self._validate_percentage(value, 'Attendance alert threshold')

    def validate_ai_high_risk_threshold(self, value):
        return self._validate_percentage(value, 'AI high risk threshold')
