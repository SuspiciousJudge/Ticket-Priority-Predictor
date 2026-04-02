import numpy as np
from sklearn.ensemble import RandomForestClassifier
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import os

np.random.seed(42)
N = 1000

# Features: sentiment_score, is_enterprise, has_critical, desc_len
sentiment_scores = np.random.choice([1.0, 0.0, -1.0], size=N, p=[0.4, 0.4, 0.2])
is_enterprise = np.random.choice([1.0, 0.0], size=N)
has_critical = np.random.choice([1.0, 0.0], size=N, p=[0.2, 0.8])
desc_len = np.random.randint(10, 500, size=N).astype(float)

X = np.stack([sentiment_scores, is_enterprise, has_critical, desc_len], axis=1)

y = np.zeros(N, dtype=np.int64)
for i in range(N):
    score = sentiment_scores[i] * 2 + is_enterprise[i] * 3 + has_critical[i] * 5 + (desc_len[i]/100)
    if score >= 7:
        y[i] = 0 # Critical
    elif score >= 5:
        y[i] = 1 # High
    elif score >= 2:
        y[i] = 2 # Medium
    else:
        y[i] = 3 # Low

model = RandomForestClassifier(n_estimators=10, max_depth=5, random_state=42)
model.fit(X, y)

initial_type = [('float_input', FloatTensorType([None, 4]))]
onnx_model = convert_sklearn(model, initial_types=initial_type)

out_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, 'priority_model.onnx')
print("Saving ONNX model to", out_path)
with open(out_path, "wb") as f:
    f.write(onnx_model.SerializeToString())
