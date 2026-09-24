from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds default users for Admin, Project Manager, and Site Engineer roles.'

    def handle(self, *args, **options):
        seed_data = [
            {
                'email': 'admin@sitesense.ai',
                'first_name': 'Alexander',
                'last_name': 'Vance',
                'role': User.Role.ADMIN,
                'phone_number': '+1 (555) 019-2831',
                'employee_id': 'EMP-ADM-001',
                'department': 'Executive Construction Management',
                'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'manager@sitesense.ai',
                'first_name': 'Sarah',
                'last_name': 'Jenkins',
                'role': User.Role.PROJECT_MANAGER,
                'phone_number': '+1 (555) 014-9842',
                'employee_id': 'EMP-PM-042',
                'department': 'Civil Engineering Operations',
                'avatar_url': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'email': 'engineer@sitesense.ai',
                'first_name': 'Marcus',
                'last_name': 'Chen',
                'role': User.Role.SITE_ENGINEER,
                'phone_number': '+1 (555) 018-7320',
                'employee_id': 'EMP-ENG-108',
                'department': 'Structural & Field Logistics',
                'avatar_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'email': 'site_eng1@sitesense.ai',
                'first_name': 'Alex',
                'last_name': 'Engineer',
                'role': User.Role.SITE_ENGINEER,
                'phone_number': '+1 (555) 018-7321',
                'employee_id': 'EMP-ENG-109',
                'department': 'Site Supervision',
                'avatar_url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'email': 'site_eng2@sitesense.ai',
                'first_name': 'David',
                'last_name': 'Miller',
                'role': User.Role.SITE_ENGINEER,
                'phone_number': '+1 (555) 018-7322',
                'employee_id': 'EMP-ENG-110',
                'department': 'Site Supervision',
                'avatar_url': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'email': 'manager2@sitesense.ai',
                'first_name': 'Robert',
                'last_name': 'Taylor',
                'role': User.Role.PROJECT_MANAGER,
                'phone_number': '+1 (555) 014-9843',
                'employee_id': 'EMP-PM-043',
                'department': 'Project Execution',
                'avatar_url': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250',
                'is_staff': False,
                'is_superuser': False,
            }
        ]

        created_count = 0
        updated_count = 0

        for data in seed_data:
            email = data['email']
            data['username'] = email
            password = 'password123'
            
            user, created = User.objects.get_or_create(email=email, defaults=data)
            if created:
                user.set_password(password)
                user.save()
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"[CREATED] User {email} ({user.role})"))
            else:
                for key, val in data.items():
                    setattr(user, key, val)
                user.set_password(password)
                user.save()
                updated_count += 1
                self.stdout.write(self.style.WARNING(f"[UPDATED] User {email} ({user.role})"))

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully seeded users! Created: {created_count}, Updated: {updated_count}"))
        self.stdout.write("Default password for all test accounts: password123")
