from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, time
from attendance.models import Attendance
from workers.models import ProjectWorker
from projects.models import Project

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds sample daily worker attendance records.'

    def handle(self, *args, **options):
        engineer_user = User.objects.filter(email='engineer@sitesense.ai').first() or User.objects.filter(role=User.Role.ADMIN).first()
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)

        active_assignments = ProjectWorker.objects.filter(active_status=True)

        if not active_assignments.exists():
            self.stdout.write(self.style.WARNING("No active project assignments found. Skipping attendance seed."))
            return

        created_count = 0

        # Seed for Yesterday (historical) and Today
        dates_to_seed = [
            (yesterday, Attendance.Status.PRESENT, time(8, 0), time(17, 0), 2.0, 'Completed foundation rebar inspection.'),
            (today, Attendance.Status.PRESENT, time(7, 45), time(16, 30), 1.5, 'Site safety briefing attended.'),
        ]

        for target_date, status_val, check_in, check_out, ot, remark in dates_to_seed:
            for assignment in active_assignments:
                att, created = Attendance.objects.get_or_create(
                    worker=assignment.worker,
                    date=target_date,
                    defaults={
                        'project': assignment.project,
                        'status': status_val,
                        'check_in_time': check_in,
                        'check_out_time': check_out,
                        'overtime_hours': ot,
                        'remarks': remark,
                        'recorded_by': engineer_user,
                    }
                )
                if created:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f"[CREATED] Attendance for {assignment.worker.full_name} on {target_date} ({status_val})"))

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully seeded {created_count} attendance records!"))
