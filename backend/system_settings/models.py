from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class UserPreference(models.Model):
    """Per-user display and notification preferences.

    One row per user, created on demand the first time the user opens
    Settings. Every field carries a sensible default so a freshly created
    row already represents the platform defaults.
    """

    class Theme(models.TextChoices):
        DARK = 'DARK', 'Dark'
        LIGHT = 'LIGHT', 'Light'

    class DateFormat(models.TextChoices):
        DMY = 'DD/MM/YYYY', 'DD/MM/YYYY'
        MDY = 'MM/DD/YYYY', 'MM/DD/YYYY'
        ISO = 'YYYY-MM-DD', 'YYYY-MM-DD'

    class LandingPage(models.TextChoices):
        PROJECTS = 'projects', 'Projects'
        WORKERS = 'workers', 'Workers'
        ATTENDANCE = 'attendance', 'Attendance'
        TASKS = 'tasks', 'Tasks'
        MATERIALS = 'materials', 'Materials & Expenses'
        DAILYLOGS = 'dailylogs', 'Daily Logs'
        AI = 'ai', 'AI Engine'
        REPORTS = 'reports', 'Reports'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='preferences'
    )

    # Display preferences
    theme = models.CharField(max_length=10, choices=Theme.choices, default=Theme.DARK)
    date_format = models.CharField(
        max_length=20,
        choices=DateFormat.choices,
        default=DateFormat.DMY
    )
    default_landing_page = models.CharField(
        max_length=20,
        choices=LandingPage.choices,
        default=LandingPage.PROJECTS
    )
    items_per_page = models.PositiveIntegerField(
        default=10,
        validators=[MinValueValidator(5), MaxValueValidator(100)]
    )
    compact_tables = models.BooleanField(default=False)

    # Notification channels
    email_notifications = models.BooleanField(default=True)
    in_app_notifications = models.BooleanField(default=True)

    # Per-event notification toggles, one per existing module
    notify_task_assigned = models.BooleanField(default=True)
    notify_task_status_change = models.BooleanField(default=True)
    notify_attendance_summary = models.BooleanField(default=False)
    notify_material_purchase = models.BooleanField(default=True)
    notify_budget_overspend = models.BooleanField(default=True)
    notify_ai_risk_alert = models.BooleanField(default=True)
    notify_daily_log_reminder = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'User Preference'
        verbose_name_plural = 'User Preferences'
        ordering = ['user_id']

    def __str__(self):
        return f"Preferences for {self.user}"


class OrganizationSetting(models.Model):
    """Organization-wide defaults. Single row, always pk=1.

    Readable by every authenticated user (the frontend needs the currency
    symbol and thresholds to render), writable by Admins only.
    """

    SINGLETON_PK = 1

    organization_name = models.CharField(max_length=255, default='SiteSense')
    contact_email = models.EmailField(blank=True, default='')
    contact_phone = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField(blank=True, default='')

    # Regional defaults
    currency_code = models.CharField(max_length=10, default='INR')
    currency_symbol = models.CharField(max_length=5, default='₹')
    timezone = models.CharField(max_length=64, default='Asia/Kolkata')

    # Operational defaults
    working_days_per_week = models.PositiveIntegerField(
        default=6,
        validators=[MinValueValidator(1), MaxValueValidator(7)]
    )
    standard_shift_hours = models.FloatField(
        default=8.0,
        validators=[MinValueValidator(1.0), MaxValueValidator(24.0)]
    )

    # Alert thresholds, expressed as percentages
    budget_alert_threshold = models.FloatField(
        default=85.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text='Flag a project once this share of its budget is consumed.'
    )
    attendance_alert_threshold = models.FloatField(
        default=70.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text='Flag a project when attendance falls below this percentage.'
    )
    ai_high_risk_threshold = models.FloatField(
        default=60.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text='Delay probability at or above this counts as High risk.'
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_organization_settings'
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Organization Setting'
        verbose_name_plural = 'Organization Settings'

    def save(self, *args, **kwargs):
        # Pin to a single row so the table can never hold a second config.
        self.pk = self.SINGLETON_PK
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # The singleton is part of the platform contract; never remove it.
        raise NotImplementedError('Organization settings cannot be deleted.')

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=cls.SINGLETON_PK)
        return obj

    def __str__(self):
        return f"{self.organization_name} (Organization Settings)"
