from django.db import models
from django.conf import settings
from datetime import datetime
from django.utils import timezone
from projects.models import Project

class Worker(models.Model):
    class Gender(models.TextChoices):
        MALE = 'Male', 'Male'
        FEMALE = 'Female', 'Female'
        OTHER = 'Other', 'Other'

    class SkillCategory(models.TextChoices):
        MASONRY = 'Masonry', 'Masonry'
        CARPENTRY = 'Carpentry', 'Carpentry'
        ELECTRICAL = 'Electrical', 'Electrical'
        PLUMBING = 'Plumbing', 'Plumbing'
        STEEL_FIXING = 'Steel Fixing', 'Steel Fixing'
        WELDING = 'Welding', 'Welding'
        SCAFFOLDING = 'Scaffolding', 'Scaffolding'
        HEAVY_EQUIPMENT = 'Heavy Equipment Operator', 'Heavy Equipment Operator'
        GENERAL_LABOR = 'General Labor', 'General Labor'
        SAFETY_INSPECTOR = 'Safety Inspector', 'Safety Inspector'

    class EmploymentType(models.TextChoices):
        PERMANENT = 'Permanent', 'Permanent'
        CONTRACT = 'Contract', 'Contract'
        DAILY_WAGE = 'Daily Wage', 'Daily Wage'

    class Status(models.TextChoices):
        ACTIVE = 'Active', 'Active'
        INACTIVE = 'Inactive', 'Inactive'

    worker_id = models.CharField(max_length=50, unique=True, blank=True)
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=30)
    email = models.EmailField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.MALE)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, default='')
    emergency_contact_name = models.CharField(max_length=255)
    emergency_contact_number = models.CharField(max_length=30)
    skill_category = models.CharField(
        max_length=50,
        choices=SkillCategory.choices,
        default=SkillCategory.GENERAL_LABOR
    )
    designation = models.CharField(max_length=100)
    daily_wage = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    employment_type = models.CharField(
        max_length=30,
        choices=EmploymentType.choices,
        default=EmploymentType.CONTRACT
    )
    join_date = models.DateField(default=timezone.localdate)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    profile_photo = models.CharField(max_length=500, blank=True, null=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.worker_id:
            current_year = datetime.now().year
            last_worker = Worker.objects.order_by('-id').first()
            next_num = 1
            if last_worker and last_worker.id:
                next_num = last_worker.id + 1
            self.worker_id = f"WRK-{current_year}-{next_num:03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.worker_id} - {self.full_name} ({self.skill_category})"


class ProjectWorker(models.Model):
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='project_assignments')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='worker_assignments')
    assigned_date = models.DateField(default=timezone.localdate)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_workers'
    )
    active_status = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        status_str = "Active" if self.active_status else "Inactive"
        return f"{self.worker.full_name} -> {self.project.project_name} ({status_str})"
