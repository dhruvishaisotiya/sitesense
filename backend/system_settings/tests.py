from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from system_settings.models import OrganizationSetting, UserPreference

User = get_user_model()


class SettingsTestBase(TestCase):
    """Builds its own users so no test depends on seeded database rows."""

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            email='settings-admin@sitesense.test',
            password='AdminPass!2026',
            first_name='Ada',
            last_name='Admin',
            role=User.Role.ADMIN,
        )
        cls.manager = User.objects.create_user(
            email='settings-pm@sitesense.test',
            password='ManagerPass!2026',
            first_name='Priya',
            last_name='Manager',
            role=User.Role.PROJECT_MANAGER,
        )
        cls.engineer = User.objects.create_user(
            email='settings-engineer@sitesense.test',
            password='EngineerPass!2026',
            first_name='Eli',
            last_name='Engineer',
            role=User.Role.SITE_ENGINEER,
        )

    def setUp(self):
        self.client = APIClient()

    def auth(self, user):
        self.client.force_authenticate(user=user)
        return self.client


class UserPreferenceApiTests(SettingsTestBase):
    url = '/api/settings/preferences/'

    def test_requires_authentication(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_creates_defaults_on_first_access(self):
        self.assertFalse(UserPreference.objects.filter(user=self.engineer).exists())

        response = self.auth(self.engineer).get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(UserPreference.objects.filter(user=self.engineer).exists())
        self.assertEqual(response.data['theme'], UserPreference.Theme.DARK)
        self.assertEqual(response.data['items_per_page'], 10)
        self.assertTrue(response.data['notify_task_assigned'])

    def test_patch_updates_only_the_requesting_user(self):
        response = self.auth(self.engineer).patch(
            self.url,
            {'theme': 'LIGHT', 'items_per_page': 25, 'notify_ai_risk_alert': False},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['theme'], 'LIGHT')
        self.assertEqual(response.data['items_per_page'], 25)
        self.assertFalse(response.data['notify_ai_risk_alert'])

        # The manager's preferences are untouched by the engineer's PATCH.
        manager_response = self.auth(self.manager).get(self.url)
        self.assertEqual(manager_response.data['theme'], UserPreference.Theme.DARK)

    def test_rejects_items_per_page_out_of_range(self):
        response = self.auth(self.engineer).patch(
            self.url, {'items_per_page': 500}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('items_per_page', response.data)

    def test_rejects_unknown_theme(self):
        response = self.auth(self.engineer).patch(
            self.url, {'theme': 'NEON'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SettingsProfileApiTests(SettingsTestBase):
    url = '/api/settings/profile/'

    def test_user_can_update_own_profile_fields(self):
        response = self.auth(self.manager).patch(
            self.url,
            {
                'first_name': 'Priyanka',
                'phone_number': '+91 90000 11111',
                'department': 'Operations',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.manager.refresh_from_db()
        self.assertEqual(self.manager.first_name, 'Priyanka')
        self.assertEqual(self.manager.department, 'Operations')

    def test_role_and_email_are_read_only(self):
        response = self.auth(self.engineer).patch(
            self.url,
            {'role': User.Role.ADMIN, 'email': 'promoted@sitesense.test'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.engineer.refresh_from_db()
        self.assertEqual(self.engineer.role, User.Role.SITE_ENGINEER)
        self.assertEqual(self.engineer.email, 'settings-engineer@sitesense.test')

    def test_blank_first_name_is_rejected(self):
        response = self.auth(self.engineer).patch(
            self.url, {'first_name': '   '}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_avatar_url_must_be_absolute(self):
        response = self.auth(self.engineer).patch(
            self.url, {'avatar_url': 'images/me.png'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('avatar_url', response.data)


class ChangePasswordApiTests(SettingsTestBase):
    url = '/api/settings/change-password/'

    def test_successful_password_change(self):
        response = self.auth(self.engineer).post(
            self.url,
            {
                'current_password': 'EngineerPass!2026',
                'new_password': 'BrandNewPass!2026',
                'confirm_password': 'BrandNewPass!2026',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.engineer.refresh_from_db()
        self.assertTrue(self.engineer.check_password('BrandNewPass!2026'))

    def test_wrong_current_password_is_rejected(self):
        response = self.auth(self.engineer).post(
            self.url,
            {
                'current_password': 'NotMyPassword',
                'new_password': 'BrandNewPass!2026',
                'confirm_password': 'BrandNewPass!2026',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('current_password', response.data)
        self.engineer.refresh_from_db()
        self.assertTrue(self.engineer.check_password('EngineerPass!2026'))

    def test_mismatched_confirmation_is_rejected(self):
        response = self.auth(self.engineer).post(
            self.url,
            {
                'current_password': 'EngineerPass!2026',
                'new_password': 'BrandNewPass!2026',
                'confirm_password': 'DifferentPass!2026',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirm_password', response.data)

    def test_weak_password_is_rejected_by_django_validators(self):
        response = self.auth(self.engineer).post(
            self.url,
            {
                'current_password': 'EngineerPass!2026',
                'new_password': '12345678',
                'confirm_password': '12345678',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_password', response.data)

    def test_reusing_current_password_is_rejected(self):
        response = self.auth(self.engineer).post(
            self.url,
            {
                'current_password': 'EngineerPass!2026',
                'new_password': 'EngineerPass!2026',
                'confirm_password': 'EngineerPass!2026',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_password', response.data)


class OrganizationSettingApiTests(SettingsTestBase):
    url = '/api/settings/organization/'

    def test_every_role_can_read(self):
        for user in (self.admin, self.manager, self.engineer):
            with self.subTest(role=user.role):
                response = self.auth(user).get(self.url)
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data['organization_name'], 'SiteSense')

    def test_admin_can_update_and_is_recorded_as_editor(self):
        response = self.auth(self.admin).patch(
            self.url,
            {'organization_name': 'SiteSense Constructions', 'budget_alert_threshold': 90.0},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        organization = OrganizationSetting.load()
        self.assertEqual(organization.organization_name, 'SiteSense Constructions')
        self.assertEqual(organization.budget_alert_threshold, 90.0)
        self.assertEqual(organization.updated_by, self.admin)

    def test_manager_cannot_update(self):
        response = self.auth(self.manager).patch(
            self.url, {'organization_name': 'Unauthorized Rename'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(OrganizationSetting.load().organization_name, 'SiteSense')

    def test_engineer_cannot_update(self):
        response = self.auth(self.engineer).patch(
            self.url, {'organization_name': 'Unauthorized Rename'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_threshold_out_of_range_is_rejected(self):
        response = self.auth(self.admin).patch(
            self.url, {'budget_alert_threshold': 140.0}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('budget_alert_threshold', response.data)

    def test_working_days_out_of_range_is_rejected(self):
        response = self.auth(self.admin).patch(
            self.url, {'working_days_per_week': 9}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_settings_row_stays_a_singleton(self):
        self.auth(self.admin).patch(
            self.url, {'organization_name': 'First Rename'}, format='json'
        )
        OrganizationSetting(organization_name='Second Row').save()

        self.assertEqual(OrganizationSetting.objects.count(), 1)
        self.assertEqual(OrganizationSetting.load().organization_name, 'Second Row')


class SettingsOverviewApiTests(SettingsTestBase):
    url = '/api/settings/overview/'

    def test_overview_bundles_every_settings_section(self):
        response = self.auth(self.admin).get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for key in ('profile', 'preferences', 'organization', 'choices', 'can_edit_organization'):
            self.assertIn(key, response.data)
        self.assertTrue(response.data['can_edit_organization'])
        self.assertEqual(response.data['profile']['email'], self.admin.email)

    def test_non_admin_is_flagged_as_read_only_for_organization(self):
        response = self.auth(self.engineer).get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['can_edit_organization'])

    def test_choice_lists_are_populated(self):
        response = self.auth(self.manager).get(self.url)

        choices = response.data['choices']
        self.assertEqual(len(choices['theme']), len(UserPreference.Theme.choices))
        self.assertEqual(
            len(choices['default_landing_page']),
            len(UserPreference.LandingPage.choices),
        )
