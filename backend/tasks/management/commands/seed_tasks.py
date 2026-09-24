from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from tasks.models import Task
from projects.models import Project

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds sample construction tasks assigned to Site Engineers.'

    def handle(self, *args, **options):
        pm_user = User.objects.filter(email='manager@sitesense.ai').first()
        engineer_user = User.objects.filter(email='engineer@sitesense.ai').first()
        admin_user = User.objects.filter(email='admin@sitesense.ai').first()
        
        proj1 = Project.objects.filter(project_code='PRJ-2026-001').first()
        proj2 = Project.objects.filter(project_code='PRJ-2026-002').first()

        if not proj1:
            self.stdout.write(self.style.WARNING("Sample project PRJ-2026-001 not found. Skipping tasks seed."))
            return

        today = date.today()

        sample_tasks = [
            {
                'title': 'Foundation Concrete Pouring & Curing Inspection',
                'project': proj1,
                'assigned_engineer': engineer_user,
                'priority': Task.Priority.CRITICAL,
                'status': Task.Status.IN_PROGRESS,
                'due_date': today + timedelta(days=3),
                'estimated_hours': 40.0,
                'actual_hours': 18.5,
                'completion_percentage': 45.0,
                'description': 'Supervise high-grade 50MPa ready-mix concrete pouring for Block A foundation raft slab. Verify curing moisture levels.',
                'engineer_notes': 'Sub-base compaction verified. Ready-mix trucks arriving every 20 minutes.',
                'created_by': pm_user,
            },
            {
                'title': 'Structural Steel Column Alignment Check',
                'project': proj1,
                'assigned_engineer': engineer_user,
                'priority': Task.Priority.HIGH,
                'status': Task.Status.PENDING,
                'due_date': today + timedelta(days=7),
                'estimated_hours': 24.0,
                'actual_hours': 0.0,
                'completion_percentage': 0.0,
                'description': 'Conduct total station laser alignment audit on vertical steel columns from Floor 4 to 8.',
                'engineer_notes': '',
                'created_by': pm_user,
            },
            {
                'title': 'HVAC Main Ducting & Pressure Testing',
                'project': proj1,
                'assigned_engineer': engineer_user,
                'priority': Task.Priority.MEDIUM,
                'status': Task.Status.COMPLETED,
                'due_date': today - timedelta(days=1),
                'estimated_hours': 32.0,
                'actual_hours': 30.0,
                'completion_percentage': 100.0,
                'description': 'Install galvanized steel main supply ducts on Basement 1 & 2. Perform 50Pa pressure leak test.',
                'engineer_notes': 'Leakage rate within 0.2% tolerance. All damper valves calibrated.',
                'manager_review_comments': 'Pending PM formal approval inspection.',
                'created_by': pm_user,
            },
            {
                'title': 'Underground Electrical Feeder Cable Layout',
                'project': proj1,
                'assigned_engineer': engineer_user,
                'priority': Task.Priority.HIGH,
                'status': Task.Status.APPROVED,
                'due_date': today - timedelta(days=4),
                'estimated_hours': 28.0,
                'actual_hours': 26.5,
                'completion_percentage': 100.0,
                'description': 'Lay 11kV armored copper feeder cables in trench conduit from utility transformer to main switchgear room.',
                'engineer_notes': 'Insulation resistance Megger test passed with >200M ohm result.',
                'manager_review_comments': 'Approved by Sarah Jenkins (PM). Excellent documentation.',
                'created_by': pm_user,
            },
            {
                'title': 'Post-Tension Slab Cable Anchor Tensioning',
                'project': proj2,
                'assigned_engineer': engineer_user,
                'priority': Task.Priority.CRITICAL,
                'status': Task.Status.IN_PROGRESS,
                'due_date': today + timedelta(days=5),
                'estimated_hours': 36.0,
                'actual_hours': 12.0,
                'completion_percentage': 35.0,
                'description': 'Execute hydraulic jack tensioning on 7-wire unbonded strand tendons for Floor 2 slab.',
                'engineer_notes': 'Tendons 1 through 14 tensioned to 148kN. Elongation logs recorded.',
                'created_by': pm_user,
            }
        ]

        created_count = 0
        for tdata in sample_tasks:
            title = tdata['title']
            task, created = Task.objects.get_or_create(
                title=title,
                project=tdata['project'],
                defaults=tdata
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"[CREATED] Task '{title}' ({task.task_id})"))
            else:
                self.stdout.write(self.style.WARNING(f"[EXISTS] Task '{title}' ({task.task_id})"))

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully seeded {created_count} tasks!"))
