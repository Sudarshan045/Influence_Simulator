"""
train_model.py
==============
Trains the revival prediction model on processed_features.csv.
Uses RandomForestClassifier with class balancing and cross-validation.

Run:
    python train_model.py

Outputs:
    model/revival_model.pkl
    model/scaler.pkl
    model/model_report.txt
"""

import pandas as pd
import numpy as np
import pickle
import os
import json
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score

#  paths 
base_dir   = os.path.dirname(__file__)
data_path  = os.path.join(base_dir, "data",  "processed_features.csv")
model_path = os.path.join(base_dir, "model", "revival_model.pkl")
scaler_path= os.path.join(base_dir, "model", "scaler.pkl")
report_path= os.path.join(base_dir, "model", "model_report.txt")
pred_path  = os.path.join(base_dir, "model", "predictions.json")

FEATURE_COLS = [
    "trend_score",
    "momentum",
    "growth_rate",
    "rolling_avg_3",
    "rolling_avg_6",
    "engagement_rate",
    "sentiment",
    "dormancy_flag",
    "revival_signal",
]

#  load data 
print("Loading processed features...")
df = pd.read_csv(data_path, parse_dates=["date"])
df = df.dropna(subset=FEATURE_COLS + ["revival_label"])
print(f"  Rows loaded: {len(df)}")
print(f"  Ideas: {sorted(df['idea'].unique().tolist())}")
print(f"  Label distribution:\n{df['revival_label'].value_counts()}\n")

X = df[FEATURE_COLS].values
y = df["revival_label"].astype(int).values

#  scale 
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

#  train model 
print("Training RandomForest model...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    min_samples_split=5,
    min_samples_leaf=2,
    class_weight="balanced",   # handles label imbalance
    random_state=42,
    n_jobs=-1,
)
model.fit(X_scaled, y)
print("  Training complete.\n")

#  cross-validation 
print("Running 5-fold cross-validation...")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(model, X_scaled, y, cv=cv, scoring="roc_auc")
print(f"  CV ROC-AUC: {cv_scores.mean():.4f}  {cv_scores.std():.4f}\n")

#  evaluation on full training set 
y_pred     = model.predict(X_scaled)
y_proba    = model.predict_proba(X_scaled)[:, 1]
train_acc  = accuracy_score(y, y_pred)
train_auc  = roc_auc_score(y, y_proba)

print("Training set performance (informational  use CV for true performance):")
print(f"  Accuracy : {train_acc:.4f}")
print(f"  ROC-AUC  : {train_auc:.4f}")
print()
print(classification_report(y, y_pred, target_names=["No Revival", "Revival"]))

#  feature importance 
importances = dict(zip(FEATURE_COLS, model.feature_importances_.round(4)))
print("Feature importances:")
for feat, imp in sorted(importances.items(), key=lambda x: -x[1]):
    bar = "" * int(imp * 40)
    print(f"  {feat:<20} {imp:.4f}  {bar}")
print()

#  save artifacts 
os.makedirs(os.path.join(base_dir, "model"), exist_ok=True)

with open(model_path, "wb") as f:
    pickle.dump(model, f)

with open(scaler_path, "wb") as f:
    pickle.dump(scaler, f)

print(f" Model  saved  {model_path}")
print(f" Scaler saved  {scaler_path}")

#  write report 
report = (
    f"=== Influence Simulator Revival Model Report ===\n\n"
    f"Training rows    : {len(df)}\n"
    f"Unique ideas     : {df['idea'].nunique()}\n"
    f"Features         : {len(FEATURE_COLS)}\n"
    f"Model            : RandomForestClassifier (n_estimators=200)\n\n"
    f"CV ROC-AUC       : {cv_scores.mean():.4f}  {cv_scores.std():.4f}\n"
    f"Train Accuracy   : {train_acc:.4f}\n"
    f"Train ROC-AUC    : {train_auc:.4f}\n\n"
    f"Feature Importances:\n"
)
for feat, imp in sorted(importances.items(), key=lambda x: -x[1]):
    report += f"  {feat:<20} {imp:.4f}\n"

with open(report_path, "w") as f:
    f.write(report)

print(f" Report saved  {report_path}")

#  sample predictions JSON (for quick sanity check) 
sample_ideas = df.groupby("idea").last().reset_index()
sample_preds = []
for _, row in sample_ideas.iterrows():
    feats = scaler.transform([row[FEATURE_COLS].values])
    prob  = round(float(model.predict_proba(feats)[0][1]), 4)
    sample_preds.append({"idea": row["idea"], "revival_probability": prob})

sample_preds.sort(key=lambda x: -x["revival_probability"])

with open(pred_path, "w") as f:
    json.dump(sample_preds, f, indent=2)

print(f" Sample predictions  {pred_path}")
print()
print("Top 10 predicted ideas by revival probability:")
for p in sample_preds[:10]:
    bar = "" * int(p["revival_probability"] * 30)
    print(f"  {p['idea']:<30} {p['revival_probability']:.4f}  {bar}")

