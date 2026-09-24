from django.db import models
from django.conf import settings
from django.utils import timezone
from workers.models import Worker
from projects.models import Project

class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = 'Present', 'Present'
        ABSENT = 'Absent', 'Absent'
        HALF_DAY = 'Half Day', 'Half Day'
        LEAVE = 'Leave', 'Leave'

    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='attendance_records')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(default=timezone.localdate)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PRESENT)
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    remarks = models.TextField(blank=True, default='')
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recorded_attendances'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['worker', 'date']
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.date} - {self.worker.full_name} ({self.status}) @ {self.project.project_code}"
