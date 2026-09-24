import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

def train_and_save_models():
    possible_paths = [
        os.path.join(os.path.dirname(__file__), 'ai_engine', 'dataset', 'constructiq_dataset.csv'),
        os.path.join(os.path.dirname(__file__), '..', 'constructiq_dataset.csv'),
        'constructiq_dataset.csv'
    ]
    
    csv_path = None
    for path in possible_paths:
        if os.path.exists(path):
            csv_path = path
            break

    if not csv_path:
        raise FileNotFoundError("Could not find constructiq_dataset.csv in dataset directory or project root.")

    possible_summary_paths = [
        os.path.join(os.path.dirname(__file__), 'ai_engine', 'dataset', 'project_summary.csv'),
        os.path.join(os.path.dirname(__file__), '..', 'project_summary.csv'),
        'project_summary.csv'
    ]
    
    summary_path = None
    for path in possible_summary_paths:
        if os.path.exists(path):
            summary_path = path
            break

    if not summary_path:
        raise FileNotFoundError("Could not find project_summary.csv in dataset directory or project root.")

    print(f"[TRAINING] Reading datasets from: {csv_path} and {summary_path}...")
    df_construct = pd.read_csv(csv_path, nrows=400000)
    df_summary = pd.read_csv(summary_path)

    # Combine datasets by merging on Project_ID
    df = pd.merge(df_construct, df_summary, on='Project_ID', suffixes=('', '_summary'))

    # Convert Rain_Affected_Work and Project_ID to match prediction input format
    df['Rain_Affected_Work'] = df['Rain_Affected_Work'].astype(str)
    df['Project_ID'] = df['Project_ID'].astype(float)

    # EXACT 16 FEATURE COLUMNS IN EXACT ORDER (Planned_Duration added from project_summary)
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

    X = df[feature_cols]

    # Preprocessing
    cat_cols = ['Building_Type', 'Rain_Affected_Work', 'Construction_Stage']
    num_cols = [c for c in feature_cols if c not in cat_cols]

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', 'passthrough', num_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols)
        ]
    )

    print("[TRAINING] Fitting Model 1: Delay Probability Regressor...")
    y_delay = df['Delay_Probability'].astype(float)
    pipeline_delay = Pipeline([
        ('prep', preprocessor),
        ('model', RandomForestRegressor(n_estimators=60, max_depth=16, random_state=42, n_jobs=-1))
    ])
    pipeline_delay.fit(X, y_delay)

    print("[TRAINING] Fitting Model 2: Completion Days Remaining Regressor...")
    y_days = df['Completion_Days_Remaining'].astype(float)
    pipeline_days = Pipeline([
        ('prep', preprocessor),
        ('model', RandomForestRegressor(n_estimators=60, max_depth=16, random_state=42, n_jobs=-1))
    ])
    pipeline_days.fit(X, y_days)

    print("[TRAINING] Fitting Model 3: Project Risk Classifier...")
    y_risk = df['Project_Risk'].astype(str)
    pipeline_risk = Pipeline([
        ('prep', preprocessor),
        ('model', RandomForestClassifier(n_estimators=60, max_depth=16, random_state=42, n_jobs=-1))
    ])
    pipeline_risk.fit(X, y_risk)

    print("[TRAINING] Fitting Model 4 & 5: AI Suggestion Classifier & Label Encoder...")
    y_suggestion_raw = df['AI_Suggestion'].astype(str)
    encoder_ai_suggestion = LabelEncoder()
    y_suggestion = encoder_ai_suggestion.fit_transform(y_suggestion_raw)

    pipeline_suggestion = Pipeline([
        ('prep', preprocessor),
        ('model', RandomForestClassifier(n_estimators=60, max_depth=16, random_state=42, n_jobs=-1))
    ])
    pipeline_suggestion.fit(X, y_suggestion)

    # Save models
    models_dir = os.path.join(os.path.dirname(__file__), 'ai_engine', 'models')
    os.makedirs(models_dir, exist_ok=True)

    print(f"[TRAINING] Exporting 5 .pkl model files to {models_dir}...")
    joblib.dump(pipeline_delay, os.path.join(models_dir, 'model_delay_prob.pkl'))
    joblib.dump(pipeline_days, os.path.join(models_dir, 'model_days_remaining.pkl'))
    joblib.dump(pipeline_risk, os.path.join(models_dir, 'model_project_risk.pkl'))
    joblib.dump(pipeline_suggestion, os.path.join(models_dir, 'model_ai_suggestion.pkl'))
    joblib.dump(encoder_ai_suggestion, os.path.join(models_dir, 'encoder_ai_suggestion.pkl'))

    print("[TRAINING SUCCESS] All 5 ML model .pkl files successfully trained and exported!")

if __name__ == '__main__':
    train_and_save_models()
