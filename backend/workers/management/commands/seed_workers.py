from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from workers.models import Worker, ProjectWorker
from projects.models import Project
from datetime import date

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds sample construction workers and assigns them to sample projects.'

    def handle(self, *args, **options):
        pm_user = User.objects.filter(email='manager@sitesense.ai').first()
        proj1 = Project.objects.filter(project_code='PRJ-2026-001').first()
        proj2 = Project.objects.filter(project_code='PRJ-2026-002').first()

        sample_workers = [
            {
                'full_name': 'Robert Kowalski',
                'phone_number': '+1 (555) 234-8901',
                'email': 'r.kowalski@sitesense.ai',
                'gender': Worker.Gender.MALE,
                'date_of_birth': date(1985, 4, 12),
                'address': '412 Structural Ave, Chicago, IL',
                'emergency_contact_name': 'Elena Kowalski',
                'emergency_contact_number': '+1 (555) 234-8909',
                'skill_category': Worker.SkillCategory.MASONRY,
                'designation': 'Master Mason',
                'daily_wage': 185.00,
                'employment_type': Worker.EmploymentType.PERMANENT,
                'join_date': date(2024, 1, 15),
                'status': Worker.Status.ACTIVE,
                'profile_photo': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
                'notes': 'Specialist in reinforced concrete brickwork and facade masonry.',
                'target_project': proj1,
            },
            {
                'full_name': 'David Martinez',
                'phone_number': '+1 (555) 345-9012',
                'email': 'd.martinez@sitesense.ai',
                'gender': Worker.Gender.MALE,
                'date_of_birth': date(1990, 8, 24),
                'address': '789 Highrise Blvd, Chicago, IL',
                'emergency_contact_name': 'Maria Martinez',
                'emergency_contact_number': '+1 (555) 345-9099',
                'skill_category': Worker.SkillCategory.ELECTRICAL,
                'designation': 'Lead High-Voltage Electrician',
                'daily_wage': 210.00,
                'employment_type': Worker.EmploymentType.PERMANENT,
                'join_date': date(2024, 3, 10),
                'status': Worker.Status.ACTIVE,
                'profile_photo': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
                'notes': 'Certified master electrician for commercial power sub-distribution.',
                'target_project': proj1,
            },
            {
                'full_name': 'Aisha Al-Mansoor',
                'phone_number': '+1 (555) 456-0123',
                'email': 'aisha.m@sitesense.ai',
                'gender': Worker.Gender.FEMALE,
                'date_of_birth': date(1992, 11, 5),
                'address': '104 Safety Lane, Evanston, IL',
                'emergency_contact_name': 'Tariq Al-Mansoor',
                'emergency_contact_number': '+1 (555) 456-0199',
                'skill_category': Worker.SkillCategory.SAFETY_INSPECTOR,
                'designation': 'OSHA Certified Safety Inspector',
                'daily_wage': 240.00,
                'employment_type': Worker.EmploymentType.PERMANENT,
                'join_date': date(2024, 2, 1),
                'status': Worker.Status.ACTIVE,
                'profile_photo': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
                'notes': 'Monitors site hazard compliance, rigging safety, and fall protection gear.',
                'target_project': proj1,
            },
            {
                'full_name': 'Carlos Rossi',
                'phone_number': '+1 (555) 567-1234',
                'email': 'c.rossi@sitesense.ai',
                'gender': Worker.Gender.MALE,
                'date_of_birth': date(1988, 6, 18),
                'address': '55 Steelworks Rd, Naperville, IL',
                'emergency_contact_name': 'Sofia Rossi',
                'emergency_contact_number': '+1 (555) 567-1299',
                'skill_category': Worker.SkillCategory.STEEL_FIXING,
                'designation': 'Senior Rebar & Steel Specialist',
                'daily_wage': 195.00,
                'employment_type': Worker.EmploymentType.CONTRACT,
                'join_date': date(2025, 1, 10),
                'status': Worker.Status.ACTIVE,
                'profile_photo': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250',
                'notes': 'Expert in heavy foundation rebar cage assembly and post-tension cabling.',
                'target_project': proj2,
            },
            {
                'full_name': 'Vikram Singh',
                'phone_number': '+1 (555) 678-2345',
                'email': 'v.singh@sitesense.ai',
                'gender': Worker.Gender.MALE,
                'date_of_birth': date(1994, 2, 14),
                'address': '220 Industrial Pkwy, Skokie, IL',
                'emergency_contact_name': 'Priya Singh',
                'emergency_contact_number': '+1 (555) 678-2399',
                'skill_category': Worker.SkillCategory.HEAVY_EQUIPMENT,
                'designation': 'Tower Crane Operator',
                'daily_wage': 250.00,
                'employment_type': Worker.EmploymentType.CONTRACT,
                'join_date': date(2025, 2, 1),
                'status': Worker.Status.ACTIVE,
                'profile_photo': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
                'notes': 'Class-A certified heavy machinery and 50-ton tower crane operator.',
                'target_project': proj2,
            },
            {
                'full_name': 'Elena Rostova',
                'phone_number': '+1 (555) 789-3456',
                'email': 'e.rostova@sitesense.ai',
                'gender': Worker.Gender.FEMALE,
                'date_of_birth': date(1996, 9, 30),
                'address': '890 Carpenter St, Aurora, IL',
                'emergency_contact_name': 'Dmitri Rostov',
                'emergency_contact_number': '+1 (555) 789-3499',
                'skill_category': Worker.SkillCategory.CARPENTRY,
                'designation': 'Formwork & Framing Specialist',
                'daily_wage': 175.00,
                'employment_type': Worker.EmploymentType.DAILY_WAGE,
                'join_date': date(2025, 4, 1),
                'status': Worker.Status.ACTIVE,
                'profile_photo': 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=250',
                'notes': 'Specializes in timber shoring and precision concrete formwork.',
                'target_project': None,
            }
        ]

        created_count = 0
        assigned_count = 0

        for wdata in sample_workers:
            target_proj = wdata.pop('target_project')
            fname = wdata['full_name']
            
            worker, created = Worker.objects.get_or_create(
                full_name=fname,
                defaults=wdata
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"[CREATED] Worker '{fname}' ({worker.worker_id})"))
            else:
                self.stdout.write(self.style.WARNING(f"[EXISTS] Worker '{fname}' ({worker.worker_id})"))

            if target_proj:
                pw, pw_created = ProjectWorker.objects.get_or_create(
                    worker=worker,
                    project=target_proj,
                    defaults={
                        'assigned_by': pm_user,
                        'active_status': True,
                        'assigned_date': date(2026, 6, 1)
                    }
                )
                if pw_created:
                    assigned_count += 1
                    self.stdout.write(self.style.SUCCESS(f"  -> Assigned to '{target_proj.project_name}'"))

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully seeded {created_count} workers and {assigned_count} assignments!"))
