from django.db import models
from django.conf import settings
from datetime import datetime

class Project(models.Model):
    class BuildingType(models.TextChoices):
        RESIDENTIAL = 'Residential', 'Residential'
        COMMERCIAL = 'Commercial', 'Commercial'
        INDUSTRIAL = 'Industrial', 'Industrial'
        INFRASTRUCTURE = 'Infrastructure', 'Infrastructure'
        MIXED_USE = 'Mixed-Use', 'Mixed-Use'

    class Status(models.TextChoices):
        PLANNING = 'PLANNING', 'Planning'
        ACTIVE = 'ACTIVE', 'Active'
        ON_HOLD = 'ON_HOLD', 'On Hold'
        COMPLETED = 'COMPLETED', 'Completed'
        ARCHIVED = 'ARCHIVED', 'Archived'

    project_name = models.CharField(max_length=255)
    project_code = models.CharField(max_length=50, unique=True, blank=True)
    building_type = models.CharField(
        max_length=50,
        choices=BuildingType.choices,
        default=BuildingType.COMMERCIAL
    )
    blocks = models.PositiveIntegerField(default=1)
    floors = models.PositiveIntegerField(default=1)
    area_sqft = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_budget = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    start_date = models.DateField()
    planned_end_date = models.DateField()
    current_progress = models.FloatField(default=0.0)  # Default 0%, manual update in future modules
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PLANNING
    )
    assigned_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_projects'
    )
    assigned_engineers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='assigned_site_projects',
        blank=True
    )
    description = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_projects'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.project_code:
            current_year = datetime.now().year
            last_project = Project.objects.order_by('-id').first()
            next_num = 1
            if last_project and last_project.id:
                next_num = last_project.id + 1
            self.project_code = f"PRJ-{current_year}-{next_num:03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.project_code} - {self.project_name} ({self.get_status_display()})"
