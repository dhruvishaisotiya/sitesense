# SiteSense - Project Task Tracker

## Master Prompt & Architecture Rules
- [x] Master Prompt rules established & locked as single source of truth.
- [x] Strict Module-by-Module execution model enforced.
- [x] White + Teal color system (`#003135`, `#024950`, `#0FA4AF`, `#AFDDE5`, `#FFFFFF`) applied.
- [x] High-end SaaS aesthetic (Linear / Jira / Monday.com / Vercel vibe) with Framer Motion animations.

---

## Module 1: Authentication & User Management System (COMPLETED)
- [x] **Custom User Model**: `User` model inheriting from `AbstractUser` with choices for 3 roles (`ADMIN`, `PROJECT_MANAGER`, `SITE_ENGINEER`), phone number, employee ID, department, and avatar URL.
- [x] **3-Tier Roles & Permissions Matrix**: Admin, Project Manager, Site Engineer.
- [x] **JWT Authentication System**: `/api/auth/login/`, `/api/auth/refresh/`, `/api/auth/me/`, `/api/auth/logout/`, `/api/auth/capabilities/`.
- [x] **Database & Seeding**: `python manage.py seed_users` populated demo accounts for all 3 roles.
- [x] **Frontend Architecture**: AuthContext, ProtectedRoute, Premium Login Page (`LoginPage.jsx`), Profile Dashboard (`ProfileDashboard.jsx`).

---

## Module 2: Projects & Project Assignment Module (COMPLETED)
- [x] **Project Data Model**: `Project` model in `projects/models.py` with auto-generated code `PRJ-2026-001`, building type, specs, total budget, dates, status, assigned PM, and description.
- [x] **Role Permissions**: Admin (Full CRUD), PM (Assigned Read-Only), Site Engineer (Restricted Notice).
- [x] **Backend REST APIs**: CRUD endpoints, `archive`, `restore`, `available-managers`.
- [x] **Frontend Projects UI (`ProjectsPage.jsx`)**: Metrics row, search/filters, Grid/Table views, `ProjectModal.jsx`, `ProjectDetailsModal.jsx`, `ArchiveConfirmModal.jsx`.

---

## Module 3: Workers Management System (COMPLETED)
- [x] **Worker Data Model**: `Worker` model in `workers/models.py` (`WRK-2026-001`), skill categories, daily wage, emergency contacts, status.
- [x] **ProjectWorker Model**: Worker project assignment history & duplicate active assignment prevention.
- [x] **Role Permissions**: Admin (View all), PM (Full CRUD & Assign/Remove for managed projects), Site Engineer (Read-Only).
- [x] **Backend REST APIs & Seeding**: `python manage.py seed_workers`.
- [x] **Frontend Workers UI (`WorkersPage.jsx`)**: Metrics, search/filters, Grid/Table views, `WorkerModal.jsx`, `WorkerDetailsModal.jsx`, `AssignWorkerModal.jsx`, `RemoveWorkerConfirmModal.jsx`.

---

## Module 4: Attendance Management System (COMPLETED)
- [x] **Attendance Data Model**: `Attendance` model in `attendance/models.py` (`Present`, `Absent`, `Half Day`, `Leave`), unique constraint `['worker', 'date']`, future date prevention.
- [x] **Role Permissions**: Admin (View all, CSV Export), PM (Read-Only managed projects), Site Engineer (Mark/Edit TODAY's attendance).
- [x] **Backend REST APIs & Seeding**: CRUD, `bulk`, `summary`, `export-csv`, `seed_attendance`.
- [x] **Frontend Attendance UI (`AttendancePage.jsx`)**: Recharts Status Pie Chart + Progress Ring, Project/Date selectors, Bulk actions, Daily sheet table.

---

## Module 5: Tasks Management System (COMPLETED)
- [x] **Task Data Model**: `Task` model in `tasks/models.py` (`TSK-2026-001`), status choices (`Pending`, `In Progress`, `Completed`, `Approved`, `Rejected`), priority choices, project immutability check.
- [x] **Role Permissions**: Admin (View all, analytics), PM (Full CRUD, assign engineer, approve/reject), Site Engineer (View assigned, update progress, mark complete).
- [x] **Backend REST APIs & Seeding**: CRUD, `update-progress`, `mark-complete`, `approve`, `reject`, `analytics`, `available-engineers`, `seed_tasks`.
- [x] **Frontend Tasks UI (`TasksPage.jsx`)**: View mode switcher (Kanban Board vs List Table), Recharts Status Pie & Priority Bar Charts, `TaskModal.jsx`, `TaskDetailsModal.jsx`, `TaskReviewModal.jsx`.

---

## Module 6: Materials & Expenses Management System (COMPLETED)
- [x] **Data Models**: `MaterialCatalog`, `MaterialPurchase`, `Expense`.
- [x] **Automatic Backend Workflow**: Material Purchase -> Auto Expense Creation -> Budget Deduction & Overspend Prevention (`400 Bad Request`).
- [x] **Predefined Material Catalog**: 15 standard materials + custom material entry ("Other").
- [x] **Frontend UI & Recharts**: Executive ERP metric cards, Recharts Budget Progress Ring & Material Spending Distribution Pie Chart, `PurchaseMaterialModal.jsx`, `CatalogItemModal.jsx`, `MaterialsPage.jsx`.

---

## Module 7: Project Daily Progress Data (Automated AI Dataset Pipeline) (COMPLETED)
- [x] **Data Model (`dailylogs/models.py`)**:
  - [x] `ProjectDailyProgress` model containing exact 16 AI feature columns.
  - [x] Unique constraint `unique_together = ['project', 'day_number']`.
- [x] **Automated Data Pipeline (`GET /api/dailylogs/auto-fetch/`)**:
  - [x] `building_type`, `blocks`, `floors`, `area_sqft`, `total_budget`, `progress_percentage` -> Auto-fetched from **Projects Module**.
  - [x] `expected_workers`, `current_workers` -> Auto-calculated from **Workers Module**.
  - [x] `attendance_percentage` -> Auto-calculated from **Attendance Module**.
  - [x] `budget_used` -> Auto-summed from **Materials & Expenses Module**.
  - [x] `day_number` -> Auto-calculated as `(today - project.start_date).days + 1`.
  - [x] `todays_completed_tasks` -> Auto-summarized read-only task list from **Tasks Module**.

---

## Module 8: AI Prediction Engine (REALISTIC PREDICTION CALIBRATION FIXED) (COMPLETED)
- [x] **Realistic Prediction Engine Calibration**:
  - [x] Calibrated `Delay_Probability`, `Completion_Days_Remaining`, `Project_Risk`, and `AI_Suggestion` against `constructiq_dataset.csv` and `project_summary.csv`.
  - [x] For Project 1 (Day 159, 15% progress, 60% attendance): Delay Probability = **83.4%**, Days Remaining = **901 Days**, Project Risk = **High**, AI Suggestion = **"Revise project schedule"**.
  - [x] For Project 4 (Day 5, 32% progress, 90.9% attendance): Delay Probability = **0.0%**, Days Remaining = **11 Days**, Project Risk = **Low**, AI Suggestion = **"Deploy additional crew to resolve worker shortage"**.
- [x] **Zero Side-Effects**:
  - [x] Zero changes to UI, CSS, layout, navigation, database schema, or other modules.
  - [x] Production build verified cleanly in 1.05s.

---

## Module 9: Reports & Analytics (COMPLETED)
- [x] **Strict Read-Only Data Engine**: Aggregates live system data across Projects, Workers, Attendance, Tasks, Materials & Expenses, Daily Logs, and AI Predictions with zero side-effects or mutations.
- [x] **8 Dedicated REST APIs**: `dashboard-summary`, `projects`, `workers`, `attendance`, `tasks`, `budget`, `daily-progress`, `ai-prediction`.
- [x] **Multi-Format Exporters**: Automated PDF (`reportlab`), Excel (`openpyxl`), and CSV exports with role-based restriction enforcing 403 Forbidden for Site Engineer financial export.
- [x] **White Enterprise Frontend Dashboard (`ReportsPage.jsx`)**:
  - [x] `#003135`, `#024950`, `#0FA4AF`, `#AFDDE5`, `#FFFFFF` theme with white primary content cards and soft shadows.
  - [x] 6 Structured Analytics Sections: Overview Cards, Project Analytics, Budget Analytics, Attendance Analytics, Task Analytics, AI Analytics.
  - [x] 7 Interactive Recharts: Project Progress, Budget Utilization, Attendance Trend, Task Status, Delay Probability, Risk Distribution, Stage Distribution.
  - [x] Multi-criteria filters: Project, Date Range, Manager, Stage.
  - [x] Interactive Table with live search, header sorting (ASC/DESC), pagination, and export buttons.
  - [x] Framer Motion animations for page transitions, card hovers, and chart loading.

---

## Module 10: Settings (COMPLETED)
- [x] **Backend App (`system_settings`)**:
  - [x] `UserPreference` model (one row per user, created on first access): theme, date format, default landing page, rows per page, compact tables, in-app/email channels, and 7 per-event notification toggles.
  - [x] `OrganizationSetting` singleton model (always `pk=1`, delete blocked): org profile, currency, timezone, working days, shift hours, and budget / attendance / AI-risk alert thresholds.
- [x] **5 REST APIs**: `overview` (whole page in one request), `profile`, `preferences`, `change-password`, `organization`.
- [x] **Role Permissions**: every role reads organization settings; only Admin writes them (`IsAdminOrReadOnly` → 403). Email, role and employee ID are read-only on self-service profile edits.
- [x] **Password Security**: current-password verification, confirmation match, no-reuse check, and Django's password validators.
- [x] **Frontend (`SettingsPage.jsx`)**: 4-tab layout (Profile / Security / Preferences / Organization) on the `#003135`/`#0FA4AF` theme, with Framer Motion transitions, toggle switches, success/error banner, and a read-only Organization tab for non-Admins. Reachable from the navbar gear icon at `/settings`.
- [x] **Tests**: 24 `TestCase` tests in `system_settings/tests.py` covering defaults, per-user isolation, validation bounds, read-only fields, password rules, and role permissions.

---

## Maintenance (COMPLETED)
- [x] **Real Test Suite**: replaced the root `test_reports_module*.py` scripts (which ran assertions at import time against the live dev database, so `manage.py test` reported "Found 0 test(s)") with 12 `TestCase` tests in `reports/tests.py`. `manage.py test` now finds and runs **36 tests**.
- [x] **Logging**: replaced all 28 `print()` calls in `ai_engine/` and `reports/` with the `logging` module, removing usernames/roles from stdout. Verbosity is configured in `settings.py`; set `SITESENSE_LOG_LEVEL=DEBUG` for the AI feature/prediction dumps.
- [x] **Lint**: frontend is clean — `oxlint` went from ~150 warnings to **0**. Removed dead imports/state, fixed `useEffect` dependency arrays via `useCallback`, and split `useAuth` into `context/useAuth.js` so fast refresh works.

---

## Future Modules (PENDING USER APPROVAL)
- [ ] **Module 11**: Notifications, Equipment Management, or Future Enhancements

### Known Gaps (found during Module 10 review, not yet addressed)
- [ ] **Reports — Date Range filter**: `dateRange` state exists in `ReportsPage.jsx` but has no UI control and is never sent to the API, so the filter does nothing.
- [ ] **Reports — Manager filter**: `selectedManagerId` is sent to the API but no UI control sets it.
- [ ] **Reports — Stage Distribution chart**: listed as one of the 7 charts in Module 9, but the chart was never rendered (its data builder was dead code and has been removed).

