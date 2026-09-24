from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from projects.models import Project
from datetime import date

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds sample construction projects assigned to test Project Managers.'

    def handle(self, *args, **options):
        admin_user = User.objects.filter(role=User.Role.ADMIN).first()
        pm_user = User.objects.filter(email='manager@sitesense.ai').first()

        sample_projects = [
            {
                'project_name': 'Apex Horizon Commercial Towers',
                'building_type': Project.BuildingType.COMMERCIAL,
                'blocks': 3,
                'floors': 24,
                'area_sqft': 450000.00,
                'total_budget': 18500000.00,
                'start_date': date(2026, 3, 1),
                'planned_end_date': date(2027, 9, 30),
                'current_progress': 0.0,
                'status': Project.Status.ACTIVE,
                'assigned_manager': pm_user,
                'description': 'High-rise premium commercial complex featuring smart glass facades and LEED Gold energy standard design.',
                'created_by': admin_user,
            },
            {
                'project_name': 'Skyline Grand Luxury Residences',
                'building_type': Project.BuildingType.RESIDENTIAL,
                'blocks': 2,
                'floors': 18,
                'area_sqft': 280000.00,
                'total_budget': 12200000.00,
                'start_date': date(2026, 5, 15),
                'planned_end_date': date(2027, 12, 20),
                'current_progress': 0.0,
                'status': Project.Status.PLANNING,
                'assigned_manager': pm_user,
                'description': 'Luxury residential towers incorporating underground dual-level parking, structural post-tensioning, and rooftop solar arrays.',
                'created_by': admin_user,
            },
            {
                'project_name': 'Nexus Industrial Logistics Hub',
                'building_type': Project.BuildingType.INDUSTRIAL,
                'blocks': 4,
                'floors': 3,
                'area_sqft': 650000.00,
                'total_budget': 24000000.00,
                'start_date': date(2026, 8, 1),
                'planned_end_date': date(2028, 4, 15),
                'current_progress': 0.0,
                'status': Project.Status.PLANNING,
                'assigned_manager': None,
                'description': 'Automated distribution terminal with heavy-duty reinforced slab foundations and specialized crane runways.',
                'created_by': admin_user,
            },
            {
                'project_name': 'Metro Viaduct Overpass Infrastructure',
                'building_type': Project.BuildingType.INFRASTRUCTURE,
                'blocks': 1,
                'floors': 2,
                'area_sqft': 150000.00,
                'total_budget': 8700000.00,
                'start_date': date(2026, 1, 10),
                'planned_end_date': date(2026, 11, 30),
                'current_progress': 0.0,
                'status': Project.Status.ON_HOLD,
                'assigned_manager': pm_user,
                'description': 'Municipal elevated roadway project utilizing precast girder segment technology.',
                'created_by': admin_user,
            }
        ]

        created_count = 0
        for pdata in sample_projects:
            pname = pdata['project_name']
            proj, created = Project.objects.get_or_create(
                project_name=pname,
                defaults=pdata
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"[CREATED] Project '{pname}' ({proj.project_code})"))
            else:
                self.stdout.write(self.style.WARNING(f"[EXISTS] Project '{pname}' ({proj.project_code})"))

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully seeded {created_count} projects!"))
