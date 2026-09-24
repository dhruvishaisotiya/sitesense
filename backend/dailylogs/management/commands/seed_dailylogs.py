from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from dailylogs.models import ProjectDailyProgress
from projects.models import Project

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds sequential ProjectDailyProgress entries aligned with AI training dataset schema for all projects.'

    def handle(self, *args, **options):
        engineer_user = User.objects.filter(email='engineer@sitesense.ai').first() or User.objects.filter(role=User.Role.ADMIN).first()
        projects = Project.objects.all()

        if not projects.exists():
            self.stdout.write(self.style.WARNING("No projects found. Skipping daily progress seed."))
            return

        total_seeded = 0

        for proj in projects:
            # Seed 5 progress records per project
            progress_configs = [
                {
                    'day_number': 1,
                    'building_type': proj.building_type,
                    'blocks': proj.blocks,
                    'floors': proj.floors,
                    'area_sqft': proj.area_sqft,
                    'total_budget': proj.total_budget,
                    'expected_workers': 12,
                    'current_workers': 10,
                    'attendance_percentage': Decimal('90.00'),
                    'rainfall_mm': Decimal('0.00'),
                    'rain_affected_work': False,
                    'construction_stage': 'Excavation & Substructure',
                    'progress_percentage': Decimal('5.00'),
                    'budget_used': Decimal('25000.00'),
                    'created_by': engineer_user,
                },
                {
                    'day_number': 2,
                    'building_type': proj.building_type,
                    'blocks': proj.blocks,
                    'floors': proj.floors,
                    'area_sqft': proj.area_sqft,
                    'total_budget': proj.total_budget,
                    'expected_workers': 15,
                    'current_workers': 14,
                    'attendance_percentage': Decimal('93.30'),
                    'rainfall_mm': Decimal('0.00'),
                    'rain_affected_work': False,
                    'construction_stage': 'Foundation & Slab Pouring',
                    'progress_percentage': Decimal('12.00'),
                    'budget_used': Decimal('60000.00'),
                    'created_by': engineer_user,
                },
                {
                    'day_number': 3,
                    'building_type': proj.building_type,
                    'blocks': proj.blocks,
                    'floors': proj.floors,
                    'area_sqft': proj.area_sqft,
                    'total_budget': proj.total_budget,
                    'expected_workers': 18,
                    'current_workers': 12,
                    'attendance_percentage': Decimal('66.70'),
                    'rainfall_mm': Decimal('28.50'),
                    'rain_affected_work': True,
                    'construction_stage': 'Foundation & Slab Pouring',
                    'progress_percentage': Decimal('15.00'),
                    'budget_used': Decimal('95000.00'),
                    'created_by': engineer_user,
                },
                {
                    'day_number': 4,
                    'building_type': proj.building_type,
                    'blocks': proj.blocks,
                    'floors': proj.floors,
                    'area_sqft': proj.area_sqft,
                    'total_budget': proj.total_budget,
                    'expected_workers': 20,
                    'current_workers': 18,
                    'attendance_percentage': Decimal('90.00'),
                    'rainfall_mm': Decimal('2.00'),
                    'rain_affected_work': False,
                    'construction_stage': 'Structural Steel & Superstructure',
                    'progress_percentage': Decimal('25.00'),
                    'budget_used': Decimal('140000.00'),
                    'created_by': engineer_user,
                },
                {
                    'day_number': 5,
                    'building_type': proj.building_type,
                    'blocks': proj.blocks,
                    'floors': proj.floors,
                    'area_sqft': proj.area_sqft,
                    'total_budget': proj.total_budget,
                    'expected_workers': 22,
                    'current_workers': 20,
                    'attendance_percentage': Decimal('90.90'),
                    'rainfall_mm': Decimal('0.00'),
                    'rain_affected_work': False,
                    'construction_stage': 'Structural Steel & Superstructure',
                    'progress_percentage': Decimal('32.00'),
                    'budget_used': Decimal('185000.00'),
                    'created_by': engineer_user,
                },
            ]

            for pdata in progress_configs:
                day_num = pdata['day_number']
                rec, created = ProjectDailyProgress.objects.get_or_create(
                    project=proj,
                    day_number=day_num,
                    defaults=pdata
                )
                if created:
                    total_seeded += 1
                    self.stdout.write(self.style.SUCCESS(f"[CREATED] Project '{proj.project_code}' Day {day_num} Progress '{rec.progress_id}'"))

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully seeded {total_seeded} AI training daily progress records across all projects!"))
