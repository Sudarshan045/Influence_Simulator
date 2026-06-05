import random

def predict_revival():
    return round(random.uniform(0.3, 0.9), 2)

def predict_peak():
    return str(2030 + random.randint(0, 10))
