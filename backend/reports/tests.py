"""Module 9 (Reports & Analytics) API contract tests.

These replace the former `test_reports_module.py` / `test_reports_module_full.py`
scripts at the backend root. Those ran their assertions at import time against
the live development database, which meant `manage.py test` fired real API
calls during test discovery while reporting "Found 0 test(s)". Everything here
builds its own fixtures inside the throwaway test database instead.
"""

from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import resolve, reverse
from rest_framework import status
from rest_framework.test import APIClient

from projects.models import Project

User = get_user_model()

REPORT_ENDPOINTS = [
    '/api/reports/dashboard-summary/',
    '/api/reports/projects/',
    '/api/reports/workers/',
    '/api/reports/attendance/',
    '/api/reports/tasks/',
    '/api/reports/budget/',
    '/api/reports/daily-progress/',
    '/api/reports/ai-prediction/',
]

REPORT_TYPES = [
    'projects', 'workers', 'attendance', 'tasks', 'budget', 'dailylogs', 'ai-prediction',
]

EXPORT_FORMATS = ['csv', 'excel', 'pdf']


class ReportsTestBase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            email='reports-admin@sitesense.test',
            password='AdminPass!2026',
            first_name='Alexander',
            last_name='Vance',
            role=User.Role.ADMIN,
        )
        cls.manager = User.objects.create_user(
            email='reports-pm@sitesense.test',
            password='ManagerPass!2026',
            first_name='Maya',
            last_name='Rao',
            role=User.Role.PROJECT_MANAGER,
        )
        cls.engineer = User.objects.create_user(
            email='reports-engineer@sitesense.test',
            password='EngineerPass!2026',
            first_name='Marcus',
            last_name='Chen',
            role=User.Role.SITE_ENGINEER,
        )

        today = date.today()
        cls.project = Project.objects.create(
            project_name='Harbour View Towers',
            building_type=Project.BuildingType.RESIDENTIAL,
            blocks=2,
            floors=12,
            area_sqft=85000,
            total_budget=125000000,
            start_date=today - timedelta(days=60),
            planned_end_date=today + timedelta(days=300),
            current_progress=35.0,
            status=Project.Status.ACTIVE,
            assigned_manager=cls.manager,
            created_by=cls.admin,
        )
        cls.project.assigned_engineers.add(cls.engineer)

    def setUp(self):
        self.client = APIClient()

    def auth(self, user):
        self.client.force_authenticate(user=user)
        return self.client


class ReportEndpointAccessTests(ReportsTestBase):
    def test_all_report_endpoints_return_200_for_admin(self):
        client = self.auth(self.admin)
        for endpoint in REPORT_ENDPOINTS:
            with self.subTest(endpoint=endpoint):
                response = client.get(endpoint)
                self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_report_endpoints_require_authentication(self):
        for endpoint in REPORT_ENDPOINTS:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_manager_can_read_project_reports(self):
        response = self.auth(self.manager).get('/api/reports/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_engineer_can_read_project_reports(self):
        response = self.auth(self.engineer).get('/api/reports/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_dashboard_summary_returns_a_payload(self):
        response = self.auth(self.admin).get('/api/reports/dashboard-summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data)


class ReportExportTests(ReportsTestBase):
    def test_export_url_resolves(self):
        match = resolve('/api/reports/export/')
        self.assertEqual(match.url_name, 'reports-export')

    def test_export_url_is_reversible(self):
        self.assertEqual(reverse('reports-export'), '/api/reports/export/')

    def test_admin_can_export_every_type_in_every_format(self):
        client = self.auth(self.admin)
        for report_type in REPORT_TYPES:
            for export_format in EXPORT_FORMATS:
                with self.subTest(report_type=report_type, format=export_format):
                    response = client.get(
                        '/api/reports/export/',
                        {'export_format': export_format, 'report_type': report_type},
                    )
                    self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_export_sets_a_file_content_type(self):
        client = self.auth(self.admin)
        expected = {
            'csv': 'text/csv',
            'excel': 'spreadsheet',
            'pdf': 'application/pdf',
        }
        for export_format, marker in expected.items():
            with self.subTest(format=export_format):
                response = client.get(
                    '/api/reports/export/',
                    {'export_format': export_format, 'report_type': 'projects'},
                )
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertIn(marker, response.headers.get('Content-Type', ''))

    def test_manager_can_export_budget_reports(self):
        response = self.auth(self.manager).get(
            '/api/reports/export/',
            {'export_format': 'csv', 'report_type': 'budget'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class SiteEngineerFinancialRestrictionTests(ReportsTestBase):
    def test_engineer_cannot_export_financial_report_types(self):
        client = self.auth(self.engineer)
        for report_type in ('budget', 'financial', 'materials'):
            with self.subTest(report_type=report_type):
                response = client.get(
                    '/api/reports/export/',
                    {'export_format': 'csv', 'report_type': report_type},
                )
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_engineer_can_still_export_non_financial_reports(self):
        response = self.auth(self.engineer).get(
            '/api/reports/export/',
            {'export_format': 'csv', 'report_type': 'tasks'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
