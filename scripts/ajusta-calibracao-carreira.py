"""Reproduz o ajuste offline da versão 1. Uso: python scripts/ajusta-calibracao-carreira.py amostra-calibracao.json
Requer NumPy só na bancada; não faz parte do jogo nem altera os coeficientes publicados.
"""
import json
import sys
import numpy as np
from pathlib import Path

rows = json.loads(Path(sys.argv[1]).read_text())
train = [r for r in rows if r['training']]
test = [r for r in rows if not r['training']]
x = np.array([v for r in train for v in r['x']])
y = np.array([g for r in train for g in r['goals']])
b = np.zeros(x.shape[1])
b[0] = np.log(max(.05, y.mean()))
ridge = np.eye(x.shape[1]) * .5
ridge[0, 0] = 0
for _ in range(70):
    mu = np.exp(np.clip(x @ b, -6, 4))
    step = np.linalg.solve(x.T @ (mu[:, None] * x) + ridge, x.T @ (y-mu) - ridge @ b)
    b += step
    if max(abs(step)) < 1e-8:
        break
report = {'coefficients': b.tolist(), 'train_matches': len(train), 'validation_matches': len(test)}
for name, sample in [('train', train), ('validation', test)]:
    actual = np.array([sum(r['goals']) for r in sample])
    predicted = np.array([sum(np.exp(np.clip(np.array(r['x']) @ b, -6, 4))) for r in sample])
    report[name] = {'actual_goals_per_match': float(actual.mean()), 'predicted_goals_per_match': float(predicted.mean())}
print(json.dumps(report, indent=2))
