from django.db import models
from django.conf import settings
from datetime import datetime
from projects.models import Project

class ProjectDailyProgress(models.Model):
    class Stage(models.TextChoices):
        EXCAVATION = 'Excavation & Substructure', 'Excavation & Substructure'
        FOUNDATION = 'Foundation & Slab Pouring', 'Foundation & Slab Pouring'
        STRUCTURAL = 'Structural Steel & Superstructure', 'Structural Steel & Superstructure'
        MASONRY = 'Masonry & External Walls', 'Masonry & External Walls'
        MEP = 'MEP Rough-In', 'MEP Rough-In'
        FINISHING = 'Interior Finishing', 'Interior Finishing'
        FACADE = 'Façade & Cladding', 'Façade & Cladding'
        LANDSCAPING = 'Landscaping & Handover', 'Landscaping & Handover'

    progress_id = models.CharField(max_length=50, unique=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='daily_progress')
    day_number = models.PositiveIntegerField()
    building_type = models.CharField(max_length=100, default='Residential')
    blocks = models.PositiveIntegerField(default=1)
    floors = models.PositiveIntegerField(default=1)
    area_sqft = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_budget = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    expected_workers = models.IntegerField(default=0)
    current_workers = models.IntegerField(default=0)
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    rainfall_mm = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    rain_affected_work = models.BooleanField(default=False)
    construction_stage = models.CharField(
        max_length=100,
        choices=Stage.choices,
        default=Stage.STRUCTURAL
    )
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    budget_used = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_daily_progress'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['project', 'day_number']
        ordering = ['-day_number', '-created_at']

    def save(self, *args, **kwargs):
        if not self.progress_id:
            current_year = datetime.now().year
            last_rec = ProjectDailyProgress.objects.order_by('-id').first()
            next_num = 1
            if last_rec and last_rec.id:
                next_num = last_rec.id + 1
            self.progress_id = f"PRG-{current_year}-{next_num:03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.progress_id} - {self.project.project_code} (Day {self.day_number}) [{self.construction_stage}]"
