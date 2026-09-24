from django.db import models
from django.conf import settings
from datetime import datetime
from projects.models import Project

class Task(models.Model):
    class Priority(models.TextChoices):
        LOW = 'Low', 'Low'
        MEDIUM = 'Medium', 'Medium'
        HIGH = 'High', 'High'
        CRITICAL = 'Critical', 'Critical'

    class Status(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        IN_PROGRESS = 'In Progress', 'In Progress'
        COMPLETED = 'Completed', 'Completed'
        APPROVED = 'Approved', 'Approved'
        REJECTED = 'Rejected', 'Rejected'

    task_id = models.CharField(max_length=50, unique=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    assigned_engineer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    due_date = models.DateField()
    estimated_hours = models.DecimalField(max_digits=7, decimal_places=2, default=0.00)
    actual_hours = models.DecimalField(max_digits=7, decimal_places=2, default=0.00)
    completion_percentage = models.FloatField(default=0.0)
    manager_review_comments = models.TextField(blank=True, default='')
    engineer_notes = models.TextField(blank=True, default='')
    completion_photo = models.CharField(max_length=500, blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_tasks'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.task_id:
            current_year = datetime.now().year
            last_task = Task.objects.order_by('-id').first()
            next_num = 1
            if last_task and last_task.id:
                next_num = last_task.id + 1
            self.task_id = f"TSK-{current_year}-{next_num:03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.task_id} - {self.title} ({self.status}) @ {self.project.project_code}"
