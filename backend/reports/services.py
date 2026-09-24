from datetime import date, datetime, timedelta
from decimal import Decimal
from django.db.models import Sum, Count, Q, Avg
from django.contrib.auth import get_user_model

from projects.models import Project
from workers.models import Worker, ProjectWorker
from attendance.models import Attendance
from tasks.models import Task
from materials.models import Expense, MaterialPurchase, MaterialCatalog
from dailylogs.models import ProjectDailyProgress
from ai_engine.services import AiPredictionService
from users.models import User

class ReportAggregationService:

    @classmethod
    def filter_projects_by_user(cls, user, project_id=None, manager_id=None):
        qs = Project.objects.all()
        if user.role == User.Role.PROJECT_MANAGER:
            qs = qs.filter(assigned_manager=user)
        elif user.role == User.Role.SITE_ENGINEER:
            qs = qs.filter(assigned_engineers=user)

        if project_id:
            qs = qs.filter(id=project_id)
        if manager_id and user.role == User.Role.ADMIN:
            qs = qs.filter(assigned_manager_id=manager_id)
        return qs

    @classmethod
    def get_dashboard_summary(cls, user, project_id=None, manager_id=None):
        projects = cls.filter_projects_by_user(user, project_id, manager_id)
        project_ids = list(projects.values_list('id', flat=True))

        total_projects = projects.count()
        completed_projects = projects.filter(status=Project.Status.COMPLETED).count()
        active_projects = projects.filter(status=Project.Status.ACTIVE).count()

        # Workers
        active_workers_qs = ProjectWorker.objects.filter(project_id__in=project_ids, active_status=True, worker__status=Worker.Status.ACTIVE)
        total_workers = active_workers_qs.count()

        # Attendance %
        att_qs = Attendance.objects.filter(project_id__in=project_ids)
        if att_qs.exists():
            present_cnt = att_qs.filter(status__in=['Present', 'Half Day', 'PRESENT', 'HALF_DAY']).count()
            total_att = att_qs.count()
            avg_attendance_pct = round((present_cnt / total_att) * 100.0, 1) if total_att > 0 else 90.0
        else:
            avg_attendance_pct = 90.0

        # Tasks
        tasks_qs = Task.objects.filter(project_id__in=project_ids)
        completed_tasks = tasks_qs.filter(status__in=[Task.Status.COMPLETED, Task.Status.APPROVED]).count()
        pending_tasks = tasks_qs.filter(status__in=[Task.Status.PENDING, Task.Status.IN_PROGRESS]).count()

        # Budget
        total_budget = float(projects.aggregate(total=Sum('total_budget'))['total'] or 0.0)
        exp_sum = float(Expense.objects.filter(project_id__in=project_ids).aggregate(total=Sum('amount'))['total'] or 0.0)
        mat_unlinked_sum = float(MaterialPurchase.objects.filter(project_id__in=project_ids, linked_expense__isnull=True).aggregate(total=Sum('total_cost'))['total'] or 0.0)
        budget_used = exp_sum + mat_unlinked_sum

        if budget_used == 0.0 and project_ids:
            for pid in project_ids:
                ld = ProjectDailyProgress.objects.filter(project_id=pid).order_by('-day_number').first()
                if ld:
                    budget_used += float(ld.budget_used)

        remaining_budget = max(0.0, total_budget - budget_used)

        # AI Prediction aggregates
        delay_probs = []
        high_risk_count = 0
        risk_levels = []
        for p in projects:
            try:
                pred = AiPredictionService.predict_project(p.id)
                delay_probs.append(pred['delay_probability'])
                risk_levels.append(pred['project_risk'])
                if pred['project_risk'] == 'High':
                    high_risk_count += 1
            except Exception:
                pass

        avg_delay_prob = round(sum(delay_probs) / len(delay_probs), 1) if delay_probs else 0.0
        avg_risk_level = "High" if high_risk_count > 0 else ("Medium" if "Medium" in risk_levels else "Low")

        return {
            "total_projects": total_projects,
            "completed_projects": completed_projects,
            "active_projects": active_projects,
            "workers": total_workers,
            "total_workers": total_workers,
            "attendance_pct": avg_attendance_pct,
            "average_attendance_pct": avg_attendance_pct,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "total_budget": total_budget,
            "budget_used": budget_used,
            "remaining_budget": remaining_budget,
            "average_delay_probability": avg_delay_prob,
            "average_delay_prob": avg_delay_prob,
            "average_risk_level": avg_risk_level,
            "high_risk_projects_count": high_risk_count
        }

    @classmethod
    def get_project_reports(cls, user, project_id=None, manager_id=None):
        projects = cls.filter_projects_by_user(user, project_id, manager_id)
        reports = []

        for p in projects:
            latest_daily = ProjectDailyProgress.objects.filter(project=p).order_by('-day_number', '-created_at').first()
            
            # Assigned Workers Count
            assigned_workers = ProjectWorker.objects.filter(project=p, active_status=True, worker__status=Worker.Status.ACTIVE).count()
            if assigned_workers == 0 and latest_daily:
                assigned_workers = latest_daily.current_workers

            # Attendance %
            att_qs = Attendance.objects.filter(project=p)
            if att_qs.exists():
                present_cnt = att_qs.filter(status__in=['Present', 'Half Day', 'PRESENT', 'HALF_DAY']).count()
                total_cnt = att_qs.count()
                att_pct = round((present_cnt / total_cnt) * 100.0, 1) if total_cnt > 0 else 90.0
            elif latest_daily:
                att_pct = float(latest_daily.attendance_percentage)
            else:
                att_pct = 90.0

            # Tasks completed
            tasks_qs = Task.objects.filter(project=p)
            tasks_completed = tasks_qs.filter(status__in=[Task.Status.COMPLETED, Task.Status.APPROVED]).count()
            total_tasks = tasks_qs.count()

            # Expenses / Budget
            exp_sum = float(Expense.objects.filter(project=p).aggregate(total=Sum('amount'))['total'] or 0.0)
            mat_sum = float(MaterialPurchase.objects.filter(project=p, linked_expense__isnull=True).aggregate(total=Sum('total_cost'))['total'] or 0.0)
            budget_used = exp_sum + mat_sum
            if budget_used == 0.0 and latest_daily:
                budget_used = float(latest_daily.budget_used)

            # Stage & Progress
            stage = latest_daily.construction_stage if latest_daily else 'Foundation & Slab Pouring'
            progress_pct = float(latest_daily.progress_percentage if latest_daily else p.current_progress)

            # AI Prediction
            ai_pred = {}
            try:
                ai_pred = AiPredictionService.predict_project(p.id)
            except Exception:
                ai_pred = {"delay_probability": 0.0, "completion_days_remaining": 0, "project_risk": "Low", "ai_suggestion": "Project progressing as planned"}

            pm_name = f"{p.assigned_manager.first_name} {p.assigned_manager.last_name}" if p.assigned_manager else "Unassigned"

            reports.append({
                "project_id": p.id,
                "project_code": p.project_code,
                "project_name": p.project_name,
                "project_info": {
                    "project_code": p.project_code,
                    "project_name": p.project_name,
                    "building_type": p.building_type,
                    "blocks": p.blocks,
                    "floors": p.floors,
                    "area_sqft": float(p.area_sqft),
                },
                "timeline": {
                    "start_date": p.start_date.strftime("%Y-%m-%d"),
                    "planned_end_date": p.planned_end_date.strftime("%Y-%m-%d")
                },
                "building_type": p.building_type,
                "blocks": p.blocks,
                "floors": p.floors,
                "area_sqft": float(p.area_sqft),
                "total_budget": float(p.total_budget),
                "budget_used": budget_used,
                "remaining_budget": max(0.0, float(p.total_budget) - budget_used),
                "budget": {
                    "total_budget": float(p.total_budget),
                    "budget_used": budget_used,
                    "remaining_budget": max(0.0, float(p.total_budget) - budget_used)
                },
                "start_date": p.start_date.strftime("%Y-%m-%d"),
                "planned_end_date": p.planned_end_date.strftime("%Y-%m-%d"),
                "manager": pm_name,
                "status": p.status,
                "current_stage": stage,
                "current_progress": progress_pct,
                "workers_assigned": assigned_workers,
                "attendance_pct": att_pct,
                "tasks_completed": tasks_completed,
                "total_tasks": total_tasks,
                "material_cost": budget_used,
                "delay_probability": ai_pred.get("delay_probability", 0.0),
                "completion_days_remaining": ai_pred.get("completion_days_remaining", 0),
                "delay": {
                    "delay_probability": ai_pred.get("delay_probability", 0.0),
                    "completion_days_remaining": ai_pred.get("completion_days_remaining", 0)
                },
                "project_risk": ai_pred.get("project_risk", "Low"),
                "ai_prediction": ai_pred,
                "recommendation": ai_pred.get("ai_suggestion", "Project progressing as planned")
            })

        return reports

    @classmethod
    def get_worker_reports(cls, user, project_id=None):
        projects = cls.filter_projects_by_user(user, project_id)
        project_ids = list(projects.values_list('id', flat=True))

        assigned_workers_qs = Worker.objects.filter(project_assignments__project_id__in=project_ids, project_assignments__active_status=True).distinct()
        if not assigned_workers_qs.exists():
            assigned_workers_qs = Worker.objects.all()

        total_workers = assigned_workers_qs.count()
        permanent_count = assigned_workers_qs.filter(employment_type=Worker.EmploymentType.PERMANENT).count()
        contract_count = assigned_workers_qs.filter(employment_type=Worker.EmploymentType.CONTRACT).count()
        daily_wage_count = assigned_workers_qs.filter(employment_type=Worker.EmploymentType.DAILY_WAGE).count()

        active_count = assigned_workers_qs.filter(status=Worker.Status.ACTIVE).count()
        inactive_count = assigned_workers_qs.filter(status=Worker.Status.INACTIVE).count()

        workers_per_project = []
        for p in projects:
            cnt = ProjectWorker.objects.filter(project=p, active_status=True, worker__status=Worker.Status.ACTIVE).count()
            workers_per_project.append({
                "project_code": p.project_code,
                "project_name": p.project_name,
                "active_workers": cnt
            })

        return {
            "total_workers": total_workers,
            "permanent": permanent_count,
            "permanent_count": permanent_count,
            "contract": contract_count,
            "contract_count": contract_count,
            "daily_wage": daily_wage_count,
            "daily_wage_count": daily_wage_count,
            "active": active_count,
            "active_count": active_count,
            "inactive": inactive_count,
            "inactive_count": inactive_count,
            "workers_per_project": workers_per_project
        }

    @classmethod
    def get_attendance_reports(cls, user, project_id=None):
        projects = cls.filter_projects_by_user(user, project_id)
        project_ids = list(projects.values_list('id', flat=True))

        att_qs = Attendance.objects.filter(project_id__in=project_ids)

        present_cnt = att_qs.filter(status__in=['Present', 'PRESENT']).count()
        half_day_cnt = att_qs.filter(status__in=['Half Day', 'HALF_DAY']).count()
        absent_cnt = att_qs.filter(status__in=['Absent', 'ABSENT']).count()
        leave_cnt = att_qs.filter(status__in=['Leave', 'LEAVE']).count()
        total_records = att_qs.count()

        attendance_pct = round(((present_cnt + (half_day_cnt * 0.5)) / total_records) * 100.0, 1) if total_records > 0 else 90.9

        # Trend over last 7 recorded dates
        dates = att_qs.values_list('date', flat=True).distinct().order_by('-date')[:7]
        attendance_trend = []
        for d in reversed(list(dates)):
            day_records = att_qs.filter(date=d)
            d_total = day_records.count()
            d_present = day_records.filter(status__in=['Present', 'Half Day', 'PRESENT', 'HALF_DAY']).count()
            d_pct = round((d_present / d_total) * 100.0, 1) if d_total > 0 else 90.0
            attendance_trend.append({
                "date": d.strftime("%Y-%m-%d"),
                "attendance_percentage": d_pct,
                "present": d_present,
                "absent": d_total - d_present
            })

        return {
            "daily_attendance": present_cnt,
            "weekly_attendance": present_cnt * 6,
            "monthly_attendance": total_records,
            "total_records": total_records,
            "attendance_pct": attendance_pct,
            "present": present_cnt,
            "present_count": present_cnt,
            "half_day": half_day_cnt,
            "half_day_count": half_day_cnt,
            "absent": absent_cnt,
            "absent_count": absent_cnt,
            "leave": leave_cnt,
            "leave_count": leave_cnt,
            "attendance_trend": attendance_trend
        }

    @classmethod
    def get_task_reports(cls, user, project_id=None, manager_id=None):
        projects = cls.filter_projects_by_user(user, project_id, manager_id)
        project_ids = list(projects.values_list('id', flat=True))

        tasks_qs = Task.objects.filter(project_id__in=project_ids)

        pending = tasks_qs.filter(status=Task.Status.PENDING).count()
        in_progress = tasks_qs.filter(status=Task.Status.IN_PROGRESS).count()
        completed = tasks_qs.filter(status=Task.Status.COMPLETED).count()
        approved = tasks_qs.filter(status=Task.Status.APPROVED).count()
        rejected = tasks_qs.filter(status=Task.Status.REJECTED).count()

        today = date.today()
        overdue = tasks_qs.filter(due_date__lt=today).exclude(status__in=[Task.Status.COMPLETED, Task.Status.APPROVED]).count()

        by_priority = [
            {"priority": "Critical", "count": tasks_qs.filter(priority=Task.Priority.CRITICAL).count()},
            {"priority": "High", "count": tasks_qs.filter(priority=Task.Priority.HIGH).count()},
            {"priority": "Medium", "count": tasks_qs.filter(priority=Task.Priority.MEDIUM).count()},
            {"priority": "Low", "count": tasks_qs.filter(priority=Task.Priority.LOW).count()},
        ]

        return {
            "total_tasks": tasks_qs.count(),
            "pending": pending,
            "in_progress": in_progress,
            "completed": completed,
            "approved": approved,
            "rejected": rejected,
            "overdue": overdue,
            "by_priority": by_priority
        }

    @classmethod
    def get_budget_reports(cls, user, project_id=None):
        projects = cls.filter_projects_by_user(user, project_id)
        project_ids = list(projects.values_list('id', flat=True))

        total_budget = float(projects.aggregate(total=Sum('total_budget'))['total'] or 0.0)

        exp_qs = Expense.objects.filter(project_id__in=project_ids)
        expenses_total = float(exp_qs.aggregate(total=Sum('amount'))['total'] or 0.0)

        mat_qs = MaterialPurchase.objects.filter(project_id__in=project_ids, linked_expense__isnull=True)
        materials_total = float(mat_qs.aggregate(total=Sum('total_cost'))['total'] or 0.0)

        budget_used = expenses_total + materials_total

        if budget_used == 0.0 and project_ids:
            for pid in project_ids:
                ld = ProjectDailyProgress.objects.filter(project_id=pid).order_by('-day_number').first()
                if ld:
                    budget_used += float(ld.budget_used)

        remaining_budget = max(0.0, total_budget - budget_used)
        utilization_pct = round((budget_used / total_budget) * 100.0, 1) if total_budget > 0 else 0.0

        categories_agg = exp_qs.values('expense_category').annotate(total=Sum('amount')).order_by('-total')
        expense_breakdown = []
        for cat in categories_agg:
            expense_breakdown.append({
                "category": cat['expense_category'],
                "amount": float(cat['total'])
            })
        if materials_total > 0:
            expense_breakdown.append({
                "category": "Material Purchases",
                "amount": materials_total
            })

        return {
            "project_budget": total_budget,
            "total_budget": total_budget,
            "budget_used": budget_used,
            "remaining_budget": remaining_budget,
            "material_expenses": materials_total,
            "budget_utilization_pct": utilization_pct,
            "utilization_pct": utilization_pct,
            "expense_breakdown": expense_breakdown
        }

    @classmethod
    def get_daily_progress_reports(cls, user, project_id=None):
        projects = cls.filter_projects_by_user(user, project_id)
        project_ids = list(projects.values_list('id', flat=True))

        daily_logs = ProjectDailyProgress.objects.filter(project_id__in=project_ids).order_by('day_number')

        progress_trend = []
        stage_history = []
        rainfall_history = []
        att_trend = []
        daily_progress_list = []

        for log in daily_logs:
            item = {
                "day_number": log.day_number,
                "project_code": log.project.project_code,
                "progress_percentage": float(log.progress_percentage),
                "rainfall_mm": float(log.rainfall_mm),
                "attendance_percentage": float(log.attendance_percentage),
                "construction_stage": log.construction_stage
            }
            progress_trend.append(item)
            stage_history.append({"day": log.day_number, "stage": log.construction_stage})
            rainfall_history.append({"day": log.day_number, "rainfall_mm": float(log.rainfall_mm)})
            att_trend.append({"day": log.day_number, "attendance_pct": float(log.attendance_percentage)})
            daily_progress_list.append(float(log.progress_percentage))

        avg_daily_progress_pct = round(sum(daily_progress_list) / len(daily_progress_list), 1) if daily_progress_list else 0.0

        return {
            "total_logs": daily_logs.count(),
            "progress_trend": progress_trend,
            "construction_stage_history": stage_history,
            "rainfall_history": rainfall_history,
            "attendance_trend": att_trend,
            "daily_progress_pct": avg_daily_progress_pct
        }

    @classmethod
    def get_ai_reports(cls, user, project_id=None):
        projects = cls.filter_projects_by_user(user, project_id)
        ai_reports = []

        for p in projects:
            try:
                pred = AiPredictionService.predict_project(p.id)
                pred["latest_prediction"] = pred.copy()
                pred["risk"] = pred.get("project_risk", "Low")
                pred["prediction_timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                ai_reports.append(pred)
            except Exception:
                pass

        return ai_reports
