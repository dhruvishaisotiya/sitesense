# SiteSense

[![CI](https://github.com/dhruvishaisotiya/sitesense/actions/workflows/ci.yml/badge.svg)](https://github.com/dhruvishaisotiya/sitesense/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/python-3.11%20%7C%203.12-blue)](https://www.python.org/)
[![Django](https://img.shields.io/badge/django-5.2-092E20)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/react-19-61DAFB)](https://react.dev/)

A construction project management platform with an AI prediction engine. Django REST Framework backend, React + Vite frontend, three-tier role-based access control.

Ten modules: authentication, projects, workers, attendance, tasks, materials & expenses, daily progress logs, AI predictions, reports, and settings.

**36 tests**, zero lint warnings, and `manage.py check --deploy` clean — all enforced in CI on every push.

## What it does

Site engineers record daily reality from the field — attendance, material purchases, task progress, rainfall and site conditions. That data feeds a scikit-learn model that predicts, per project, the **probability of delay**, **days remaining to completion**, and a **risk rating**, with a suggested corrective action.

The interesting engineering problem is that the trained model alone produced unusable numbers on partially-complete projects, so predictions are cross-checked against a velocity-based calculation derived from actual progress per day. When the two disagree beyond a threshold, the velocity figure wins. The same fallback keeps the AI endpoints working when the model files are absent.

---

## Requirements

- **Python 3.11+**
- **Node.js 20+**
- macOS, Linux, or WSL

---

## Setup

Clone the repo, then open **two terminals** — one for the backend, one for the frontend. Both must be running at the same time.

### Terminal 1 — backend (port 8000)

```bash
cd sitesense/backend

python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt
python manage.py migrate
```

Seed the demo data. Run these **in this order** — projects must exist before workers, tasks and materials can reference them:

```bash
python manage.py seed_users
python manage.py seed_projects
python manage.py seed_workers
python manage.py seed_attendance
python manage.py seed_tasks
python manage.py seed_materials
python manage.py seed_dailylogs
```

Start the server:

```bash
python manage.py runserver
```

Backend runs at **http://127.0.0.1:8000**.

### Terminal 2 — frontend (port 5173)

```bash
cd sitesense/frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

No API URL configuration is needed — Vite proxies `/api` to `127.0.0.1:8000`. To point at a different backend, set `VITE_API_URL`.

---

## Demo accounts

Password for every account is `password123`.

| Email | Role |
|---|---|
| `admin@sitesense.ai` | Admin |
| `manager@sitesense.ai` | Project Manager |
| `manager2@sitesense.ai` | Project Manager |
| `engineer@sitesense.ai` | Site Engineer |
| `site_eng1@sitesense.ai` | Site Engineer |
| `site_eng2@sitesense.ai` | Site Engineer |

---

## AI prediction engine

The trained models are **not in this repository**. `model_days_remaining.pkl` is 492 MB and `constructiq_dataset.csv` is 104 MB — both exceed GitHub's 100 MB per-file limit, so `.gitignore` excludes `backend/ai_engine/models/*.pkl` and `backend/ai_engine/dataset/*.csv`.

Everything else runs without them. Only the AI endpoints (`/api/ai/predict/<id>/`, the AI section of Reports) need the models.

To enable AI predictions, either restore the two directories from a backup, or re-train:

```bash
cd backend
python train_ai_models.py    # requires dataset/constructiq_dataset.csv
```

The bundled models were trained with **scikit-learn 1.8.0**, which is why `requirements.txt` pins that version. Loading them under a different version prints an `InconsistentVersionWarning` and the predictions are not guaranteed to be valid.

---

## Roles and permissions

| Module | Admin | Project Manager | Site Engineer |
|---|---|---|---|
| Projects | Full CRUD | Read-only (assigned) | Restricted |
| Workers | View all | Full CRUD + assign/remove | Read-only |
| Attendance | View all + CSV export | Read-only (managed projects) | Mark/edit today only |
| Tasks | View all + analytics | Full CRUD, approve/reject | Update assigned, mark complete |
| Materials | Full access | Full access | Read-only |
| Reports | All exports | All exports | Blocked from financial exports (403) |
| Settings | Edits org defaults | Own settings only | Own settings only |

---

## Project structure

```
sitesense/
├── backend/
│   ├── sitesense_backend/   settings, root URLconf
│   ├── users/               custom User model, JWT auth
│   ├── projects/            Project model, manager assignment
│   ├── workers/             Worker + ProjectWorker assignment history
│   ├── attendance/          daily attendance records
│   ├── tasks/               task lifecycle and approvals
│   ├── materials/           catalog, purchases, auto-expense + budget
│   ├── dailylogs/           16-column AI feature pipeline
│   ├── ai_engine/           prediction service (.pkl models, gitignored)
│   ├── reports/             read-only aggregation + PDF/Excel/CSV export
│   ├── system_settings/     user preferences + org defaults
│   ├── .env.example         every environment variable, documented
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api/             axios instance, JWT interceptors
        ├── context/         AuthProvider, useAuth hook
        ├── components/      modals and shared UI
        └── pages/           one page per module
```

---

## API

All routes are under `/api/`. JWT bearer token, obtained from `/api/auth/login/`.

| Prefix | Purpose |
|---|---|
| `/api/auth/` | `login`, `refresh`, `me`, `logout`, `capabilities`, `create` |
| `/api/projects/` | CRUD, `archive`, `restore`, `available-managers` |
| `/api/workers/` | CRUD, `assign`, `remove`, `available` |
| `/api/attendance/` | CRUD, `bulk`, `summary`, `export-csv` |
| `/api/tasks/` | CRUD, `update-progress`, `mark-complete`, `approve`, `reject`, `analytics` |
| `/api/materials/` | catalog, purchases, expenses |
| `/api/dailylogs/` | CRUD, `auto-fetch` |
| `/api/ai/` | `predict/<project_id>/`, `projects` |
| `/api/reports/` | 8 read-only report endpoints + `export` (PDF/Excel/CSV) |
| `/api/settings/` | `overview`, `profile`, `preferences`, `change-password`, `organization` |

---

## Configuration

Every environment-specific setting is read from the environment, with development-safe
defaults — so local development needs no configuration at all. See
[`backend/.env.example`](backend/.env.example) for the full list.

| Variable | Default | Purpose |
|---|---|---|
| `DJANGO_DEBUG` | `True` | Set `False` in production |
| `DJANGO_SECRET_KEY` | dev-only fallback | **Required** when `DEBUG=False` |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1,[::1]` | Comma-separated hostnames |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Allowed frontend origins |
| `SITESENSE_LOG_LEVEL` | `INFO` | `DEBUG` shows AI prediction dumps |

With `DEBUG=False` the app refuses to start on the development secret key, and enables
HSTS, secure cookies, SSL redirect and `X-Frame-Options: DENY`. `manage.py check --deploy`
passes with zero warnings, and CI enforces that on every push.

---

## Tests

```bash
cd backend
python manage.py test          # 36 tests
```

```bash
cd frontend
npx oxlint src                 # 0 warnings
npm run build
```

The suite runs without the ML model files, so a fresh clone passes immediately.

---

## Notes

- `db.sqlite3` is gitignored. The seed commands above rebuild it from scratch.
- SQLite is used for simplicity. Swap `DATABASES` in settings for Postgres in production.
