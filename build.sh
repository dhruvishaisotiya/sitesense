#!/usr/bin/env bash
# Production build, run by the host on every deploy.
#
#   Render: set this file as the Build Command  ->  ./build.sh
#
# It builds the React app, installs Python dependencies, collects static files
# and applies migrations. Demo data is seeded only once, on an empty database.
set -o errexit   # stop on first failure
set -o pipefail
set -o nounset

echo "==> Building frontend"
if command -v npm > /dev/null 2>&1; then
  cd frontend
  npm ci
  npm run build
  cd ..
elif [ -f frontend/dist/index.html ]; then
  # No Node on this host, but a build is already present (committed or cached).
  echo "    npm not found; using the existing frontend/dist build"
else
  echo "ERROR: npm is not available on this host and frontend/dist is missing."
  echo "       Either deploy the frontend as a separate static site, or run"
  echo "       'npm run build' locally and commit frontend/dist."
  exit 1
fi

echo "==> Installing Python dependencies"
cd backend
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Collecting static files"
python manage.py collectstatic --no-input

echo "==> Applying database migrations"
python manage.py migrate --no-input

echo "==> Seeding demo data if the database is empty"
# Order matters: projects must exist before workers, tasks and materials can
# reference them. Skipped entirely on redeploys so live data is never wiped.
if [ "$(python manage.py shell -c 'from users.models import User; print(User.objects.count())' 2>/dev/null | tail -1)" = "0" ]; then
  python manage.py seed_users
  python manage.py seed_projects
  python manage.py seed_workers
  python manage.py seed_attendance
  python manage.py seed_tasks
  python manage.py seed_materials
  python manage.py seed_dailylogs
  echo "==> Demo data seeded"
else
  echo "==> Database already has users, skipping seed"
fi

echo "==> Build complete"
