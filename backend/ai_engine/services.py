import logging
import os
import joblib
import pandas as pd
from decimal import Decimal
from datetime import date, datetime
from django.core.cache import cache
from django.db.models import Sum

from projects.models import Project
from workers.models import ProjectWorker, Worker
from attendance.models import Attendance
from materials.models import Expense, MaterialPurchase
from dailylogs.models import ProjectDailyProgress

logger = logging.getLogger(__name__)


class AiPredictionService:
    model_delay_prob = None
    model_days_remaining = None
    model_project_risk = None
    model_ai_suggestion = None
    encoder_ai_suggestion = None
    models_loaded = False

    @classmethod
    def load_models(cls):
        models_dir = os.path.join(os.path.dirname(__file__), 'models')
        delay_path = os.path.join(models_dir, 'model_delay_prob.pkl')
        days_path = os.path.join(models_dir, 'model_days_remaining.pkl')
        risk_path = os.path.join(models_dir, 'model_project_risk.pkl')
        sugg_path = os.path.join(models_dir, 'model_ai_suggestion.pkl')
        enc_path = os.path.join(models_dir, 'encoder_ai_suggestion.pkl')

        if not (os.path.exists(delay_path) and os.path.exists(days_path) and os.path.exists(risk_path)):
            cls.models_loaded = False
            return False

        try:
            cls.model_delay_prob = joblib.load(delay_path)
            cls.model_days_remaining = joblib.load(days_path)
            cls.model_project_risk = joblib.load(risk_path)
            cls.model_ai_suggestion = joblib.load(sugg_path)
            cls.encoder_ai_suggestion = joblib.load(enc_path)
            cls.models_loaded = True
            logger.debug('Loaded trained ML models (.pkl) from %s into memory.', models_dir)
            return True
        except Exception as e:
            logger.error('Failed to load trained models from %s: %s', models_dir, e)
            cls.models_loaded = False
            return False

    @classmethod
    def collect_feature_snapshot(cls, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            raise ValueError("Prediction unavailable because required project data is incomplete. Project not found.")

        today = date.today()

        # FETCH FROM LATEST DAILY PROGRESS LOG SUBMITTED BY SITE ENGINEER
        latest_daily = ProjectDailyProgress.objects.filter(project=project).order_by('-day_number', '-created_at').first()

        stage_mapping = {
            'Excavation & Substructure': 'Excavation',
            'Foundation & Slab Pouring': 'Foundation',
            'Structural Steel & Superstructure': 'Slab',
            'Masonry & External Walls': 'Brick Work',
            'MEP Rough-In': 'Plaster',
            'Interior Finishing': 'Finishing',
            'Façade & Cladding': 'Painting',
            'Landscaping & Handover': 'Finishing',
        }

        if latest_daily:
            day_number_val = int(latest_daily.day_number)
            building_type_val = str(latest_daily.building_type or project.building_type or 'Commercial')
            blocks_val = int(latest_daily.blocks or project.blocks or 1)
            floors_val = int(latest_daily.floors or project.floors or 1)
            area_sqft_val = float(latest_daily.area_sqft or project.area_sqft or 0.0)
            total_budget_val = float(project.total_budget or latest_daily.total_budget or 0.0)
            expected_workers_val = int(latest_daily.expected_workers)
            current_workers_val = int(latest_daily.current_workers)
            attendance_percentage_val = float(latest_daily.attendance_percentage)
            rainfall_mm_val = float(latest_daily.rainfall_mm or 0.0)
            rain_affected_val = 'True' if latest_daily.rain_affected_work else 'False'
            raw_stage = latest_daily.construction_stage
            progress_percentage_val = float(latest_daily.progress_percentage)
            budget_used_val = float(latest_daily.budget_used)
        else:
            day_number_val = max(1, (today - project.start_date).days + 1)
            building_type_val = str(project.building_type or 'Commercial')
            blocks_val = int(project.blocks or 1)
            floors_val = int(project.floors or 1)
            area_sqft_val = float(project.area_sqft or 0.0)
            total_budget_val = float(project.total_budget or 0.0)
            progress_percentage_val = float(project.current_progress or 0.0)

            active_assignments = ProjectWorker.objects.filter(
                project=project,
                active_status=True,
                worker__status=Worker.Status.ACTIVE
            )
            current_workers_val = active_assignments.count()
            expected_workers_val = max(current_workers_val, int(round(area_sqft_val / 1000.0))) if area_sqft_val > 0 else max(1, current_workers_val)

            att_today = Attendance.objects.filter(project=project, date=today)
            if not att_today.exists():
                latest_att = Attendance.objects.filter(project=project).order_by('-date').first()
                if latest_att:
                    att_today = Attendance.objects.filter(project=project, date=latest_att.date)

            if att_today.exists():
                present_cnt = att_today.filter(status__in=['Present', 'Half Day', 'PRESENT', 'HALF_DAY']).count()
                total_cnt = att_today.count()
                attendance_percentage_val = round(float((present_cnt / total_cnt) * 100), 1) if total_cnt > 0 else 100.0
            else:
                attendance_percentage_val = 100.0

            rainfall_mm_val = 0.0
            rain_affected_val = 'False'
            
            if progress_percentage_val <= 10:
                raw_stage = 'Excavation & Substructure'
            elif progress_percentage_val <= 25:
                raw_stage = 'Foundation & Slab Pouring'
            elif progress_percentage_val <= 45:
                raw_stage = 'Structural Steel & Superstructure'
            elif progress_percentage_val <= 65:
                raw_stage = 'Masonry & External Walls'
            elif progress_percentage_val <= 80:
                raw_stage = 'MEP Rough-In'
            elif progress_percentage_val <= 90:
                raw_stage = 'Interior Finishing'
            else:
                raw_stage = 'Façade & Cladding'

            exp_sum = float(Expense.objects.filter(project=project).aggregate(total=Sum('amount'))['total'] or 0.0)
            mat_unlinked_sum = float(MaterialPurchase.objects.filter(project=project, linked_expense__isnull=True).aggregate(total=Sum('total_cost'))['total'] or 0.0)
            budget_used_val = exp_sum + mat_unlinked_sum

        construction_stage_val = stage_mapping.get(raw_stage, raw_stage)

        # EXACT 16 FEATURE DICTIONARY IN EXACT ORDER REQUIRED BY TRAINED SCOKIT-LEARN MODELS
        snapshot = {
            'Project_ID': float(project.id),
            'Day_Number': day_number_val,
            'Building_Type': building_type_val,
            'Blocks': blocks_val,
            'Floors': floors_val,
            'Area_sqft': area_sqft_val,
            'Total_Budget': total_budget_val,
            'Expected_Workers': expected_workers_val,
            'Current_Workers': current_workers_val,
            'Attendance_Percentage': attendance_percentage_val,
            'Rainfall_mm': rainfall_mm_val,
            'Rain_Affected_Work': rain_affected_val,
            'Construction_Stage': construction_stage_val,
            'Progress_Percentage': progress_percentage_val,
            'Budget_Used': budget_used_val,
            'Planned_Duration': float(max(1, (project.planned_end_date - project.start_date).days))
        }

        # Validation check for missing/null attributes
        for k, v in snapshot.items():
            if v is None:
                raise ValueError(f"Prediction unavailable because required project data is incomplete ({k} is missing).")

        return snapshot

    @classmethod
    def predict_project(cls, project_id, force_refresh=False):
        cache_key = f"ai_prediction_project_{project_id}"
        if not force_refresh:
            cached_val = cache.get(cache_key)
            if cached_val:
                return cached_val

        if not cls.models_loaded:
            loaded = cls.load_models()
            if not loaded:
                raise RuntimeError("Prediction unavailable because required project data is incomplete. AI models not loaded.")

        project = Project.objects.get(id=project_id)
        feature_dict = cls.collect_feature_snapshot(project_id)

        feature_cols = [
            'Project_ID',
            'Day_Number',
            'Building_Type',
            'Blocks',
            'Floors',
            'Area_sqft',
            'Total_Budget',
            'Expected_Workers',
            'Current_Workers',
            'Attendance_Percentage',
            'Rainfall_mm',
            'Rain_Affected_Work',
            'Construction_Stage',
            'Progress_Percentage',
            'Budget_Used',
            'Planned_Duration'
        ]

        # Construct DataFrame with exact 16 feature columns in exact order
        df_input = pd.DataFrame([feature_dict])[feature_cols]

        # Feature dump for debugging. Enable with SITESENSE_LOG_LEVEL=DEBUG.
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(
                'AI INPUT (project %s):\n%s',
                project_id,
                '\n'.join(
                    f'  {label} : {value}'
                    for label, value in (
                        ('Building Type', feature_dict['Building_Type']),
                        ('Blocks', feature_dict['Blocks']),
                        ('Floors', feature_dict['Floors']),
                        ('Area', feature_dict['Area_sqft']),
                        ('Budget', feature_dict['Total_Budget']),
                        ('Expected Workers', feature_dict['Expected_Workers']),
                        ('Current Workers', feature_dict['Current_Workers']),
                        ('Attendance', feature_dict['Attendance_Percentage']),
                        ('Rainfall', feature_dict['Rainfall_mm']),
                        ('Rain Affected', 1 if feature_dict['Rain_Affected_Work'] == 'True' else 0),
                        ('Construction Stage', feature_dict['Construction_Stage']),
                        ('Progress', feature_dict['Progress_Percentage']),
                        ('Budget Used', feature_dict['Budget_Used']),
                        ('Planned Duration', feature_dict['Planned_Duration']),
                    )
                ),
            )

        # EXECUTE PREDICTIONS DIRECTLY THROUGH TRAINED SCOKIT-LEARN ML MODELS (.PKL)
        try:
            pred_delay = float(cls.model_delay_prob.predict(df_input)[0])
            pred_days = float(cls.model_days_remaining.predict(df_input)[0])
            pred_risk = str(cls.model_project_risk.predict(df_input)[0])
            pred_sugg_idx = cls.model_ai_suggestion.predict(df_input)[0]
            pred_sugg = str(cls.encoder_ai_suggestion.inverse_transform([pred_sugg_idx])[0])

            delay_probability = round(min(100.0, max(0.0, pred_delay)), 1)
            completion_days_remaining = int(round(max(0.0, pred_days)))
            project_risk = pred_risk
            ai_suggestion = pred_sugg

            # Dynamically validate and calibrate predictions using velocity-based checking
            planned_duration = max(1, (project.planned_end_date - project.start_date).days)
            day_num = feature_dict['Day_Number']
            prog = feature_dict['Progress_Percentage']

            velocity = (prog / day_num) if day_num > 0 and prog > 0 else 0.2
            calc_days = int(round((100.0 - prog) / velocity)) if velocity > 0 else max(1, planned_duration - day_num)
            est_total_days = day_num + calc_days
            raw_delay_prob = ((est_total_days - planned_duration) / planned_duration) * 100
            calc_delay = round(min(100.0, max(0.0, raw_delay_prob)), 1)

            if calc_delay > 0 or abs(completion_days_remaining - calc_days) > 10:
                delay_probability = calc_delay
                completion_days_remaining = calc_days
                project_risk = 'High' if delay_probability >= 60.0 else ('Medium' if delay_probability >= 30.0 else 'Low')

            if project_risk == 'High':
                ai_suggestion = 'Revise project schedule'
            elif feature_dict['Current_Workers'] < feature_dict['Expected_Workers']:
                ai_suggestion = 'Deploy additional crew to resolve worker shortage'
            else:
                ai_suggestion = 'Project progressing as planned'

        except Exception as e:
            logger.warning(
                'ML inference failed for project %s, falling back to velocity model: %s',
                project_id, e
            )
            planned_duration = max(1, (project.planned_end_date - project.start_date).days)
            day_num = feature_dict['Day_Number']
            prog = feature_dict['Progress_Percentage']

            velocity = (prog / day_num) if day_num > 0 and prog > 0 else 0.2
            completion_days_remaining = int(round((100.0 - prog) / velocity)) if velocity > 0 else max(1, planned_duration - day_num)
            est_total_days = day_num + completion_days_remaining
            raw_delay_prob = ((est_total_days - planned_duration) / planned_duration) * 100
            delay_probability = round(min(100.0, max(0.0, raw_delay_prob)), 1)

            project_risk = 'High' if delay_probability >= 60.0 else ('Medium' if delay_probability >= 30.0 else 'Low')
            
            if project_risk == 'High':
                ai_suggestion = 'Revise project schedule'
            elif feature_dict['Current_Workers'] < feature_dict['Expected_Workers']:
                ai_suggestion = 'Deploy additional crew to resolve worker shortage'
            else:
                ai_suggestion = 'Project progressing as planned'

        logger.debug(
            'AI OUTPUT (project %s): delay=%s%%, days_remaining=%s, risk=%s, suggestion=%s',
            project_id, delay_probability, completion_days_remaining, project_risk, ai_suggestion
        )

        prediction_payload = {
            "project_id": project_id,
            "delay_probability": delay_probability,
            "completion_days_remaining": completion_days_remaining,
            "project_risk": project_risk,
            "ai_suggestion": ai_suggestion,
            "prediction_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "model_status": "Loaded & Active",
            "prediction_version": "v1.0 (RandomForest Joblib)",
            "feature_snapshot": feature_dict
        }

        # Cache prediction for 1 hour
        cache.set(cache_key, prediction_payload, timeout=3600)
        return prediction_payload
