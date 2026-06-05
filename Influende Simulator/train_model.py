"""
train_model.py
==============

Reads  : data/processed_features.csv
Outputs:
    - model/revival_model.pkl
    - model/scaler.pkl
    - model/model_report.txt

Fixes applied:
✔ Time-based split (no leakage)
✔ Feature sanity checks
✔ Proper scaling
✔ Probability diagnostics
✔ Feature importance (correct ranking)
✔ Overfitting detection
"""

import pandas as pd
import numpy as np
import os
import pickle

from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, f1_score,
    classification_report, confusion_matrix
)

# ------------------------------------------------------------------
# PATHS
# ------------------------------------------------------------------
base_dir   = os.path.dirname(__file__)
data_path  = os.path.join(base_dir, "data", "processed_features.csv")
model_dir  = os.path.join(base_dir, "model")
os.makedirs(model_dir, exist_ok=True)

model_path  = os.path.join(model_dir, "revival_model.pkl")
scaler_path = os.path.join(model_dir, "scaler.pkl")
report_path = os.path.join(model_dir, "model_report.txt")

# ------------------------------------------------------------------
# 1. LOAD DATA
# ------------------------------------------------------------------
df = pd.read_csv(data_path, parse_dates=["date"])
df = df.sort_values("date").reset_index(drop=True)

print(f"Loaded {len(df)} rows\n")

# ------------------------------------------------------------------
# 2. FEATURES + TARGET
# ------------------------------------------------------------------
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

TARGET_COL = "revival_label"

X = df[FEATURE_COLS]
y = df[TARGET_COL]

print("Features:", FEATURE_COLS)
print("Target  :", TARGET_COL)

print("\nClass distribution:")
print(y.value_counts())

# ------------------------------------------------------------------
# 🔍 FEATURE SANITY CHECK
# ------------------------------------------------------------------
print("\n── Feature Statistics ─────────────────────────")

print(X.describe())

print("\nFeature ranges:")
for col in FEATURE_COLS:
    print(f"{col}: min={X[col].min():.3f}, max={X[col].max():.3f}")

# ------------------------------------------------------------------
# 3. TIME-BASED SPLIT (FIXED)
# ------------------------------------------------------------------
split_index = int(len(df) * 0.8)

X_train = X.iloc[:split_index]
X_test  = X.iloc[split_index:]

y_train = y.iloc[:split_index]
y_test  = y.iloc[split_index:]

print(f"\nTrain size : {len(X_train)} rows (past)")
print(f"Test  size : {len(X_test)} rows (future)")

# ------------------------------------------------------------------
# 4. SCALE FEATURES
# ------------------------------------------------------------------
scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

# ------------------------------------------------------------------
# 5. TRAIN MODEL
# ------------------------------------------------------------------
model = LogisticRegression(
    class_weight="balanced",
    max_iter=1000,
    random_state=42
)

model.fit(X_train_scaled, y_train)

print("\nModel trained.")

# ------------------------------------------------------------------
# 6. EVALUATE
# ------------------------------------------------------------------
y_pred       = model.predict(X_test_scaled)
y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
f1       = f1_score(y_test, y_pred)
cm       = confusion_matrix(y_test, y_pred)
report   = classification_report(y_test, y_pred)

print("\n── Evaluation Results ─────────────────────────")
print(f"Accuracy : {accuracy:.3f}")
print(f"F1 Score : {f1:.3f}")

print("\nConfusion Matrix:")
print(cm)

print("\nClassification Report:")
print(report)

# ------------------------------------------------------------------
# 🔍 OVERFITTING CHECK
# ------------------------------------------------------------------
train_pred = model.predict(X_train_scaled)
train_acc  = accuracy_score(y_train, train_pred)

print("\n── Overfitting Check ─────────────────────────")
print(f"Train Accuracy : {train_acc:.3f}")
print(f"Test  Accuracy : {accuracy:.3f}")

# ------------------------------------------------------------------
# 🔍 PROBABILITY CHECK
# ------------------------------------------------------------------
print("\n── Probability Distribution ───────────────────")
print(pd.Series(y_pred_proba).describe())

# ------------------------------------------------------------------
# 7. FEATURE IMPORTANCE (FIXED)
# ------------------------------------------------------------------
coefficients = pd.DataFrame({
    "feature": FEATURE_COLS,
    "coefficient": model.coef_[0]
})

coefficients["abs"] = coefficients["coefficient"].abs()
coefficients = coefficients.sort_values("abs", ascending=False)

print("\n── Feature Importance ─────────────────────────")
print(coefficients[["feature", "coefficient"]].to_string(index=False))

# ------------------------------------------------------------------
# 8. SAVE MODEL + SCALER
# ------------------------------------------------------------------
with open(model_path, "wb") as f:
    pickle.dump(model, f)

with open(scaler_path, "wb") as f:
    pickle.dump(scaler, f)

print(f"\nModel saved → {model_path}")
print(f"Scaler saved → {scaler_path}")

# ------------------------------------------------------------------
# 9. SAVE REPORT
# ------------------------------------------------------------------
report_text = f"""
Influence Simulator — Model Report
=================================

Train size : {len(X_train)}
Test  size : {len(X_test)}

Accuracy   : {accuracy:.3f}
F1 Score   : {f1:.3f}

Train Accuracy : {train_acc:.3f}

Confusion Matrix:
{cm}

Classification Report:
{report}

Feature Importance:
{coefficients.to_string(index=False)}
"""

with open(report_path, "w") as f:
    f.write(report_text)

print(f"Report saved → {report_path}")

print("\n✅ Phase 3 complete. Ready for prediction.")