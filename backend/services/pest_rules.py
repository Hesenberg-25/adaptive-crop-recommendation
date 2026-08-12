"""
services/pest_rules.py — Predictive pest & disease alert rules engine
"""
from typing import Optional

RULES = [
    {
        "name": "Fungal Blight",
        "severity": "high",
        "condition": lambda d: d["temp"] > 30 and d["humidity"] > 80,
        "recommendation": "Prepare fungicides",
    },
    {
        "name": "Powdery Mildew",
        "severity": "medium",
        "condition": lambda d: 20 <= d["temp"] <= 27 and d["humidity"] > 70 and d["rainfall"] < 10,
        "recommendation": "Ensure good airflow and consider preventative sulfur sprays",
    },
    {
        "name": "Aphid/Pest Outbreak",
        "severity": "medium",
        "condition": lambda d: d["temp"] > 25 and 50 <= d["humidity"] <= 70 and d.get("wind_speed", 15) < 10,
        "recommendation": "Monitor crops closely for aphids, consider releasing ladybugs or using neem oil",
    },
    {
        "name": "Root Rot",
        "severity": "high",
        "condition": lambda d: d["rainfall"] > 150,
        "recommendation": "Improve soil drainage and avoid over-irrigation",
    },
]


def evaluate_risk(temp: float, humidity: float, rainfall: float, wind_speed: Optional[float] = 15) -> list:
    data = {"temp": temp, "humidity": humidity, "rainfall": rainfall, "wind_speed": wind_speed or 15}
    risks = []
    for rule in RULES:
        try:
            if rule["condition"](data):
                risks.append({
                    "risk": rule["name"],
                    "severity": rule["severity"],
                    "recommendation": rule["recommendation"],
                })
        except Exception as exc:
            print(f"[PestRules] Error evaluating {rule['name']}: {exc}")
    return risks
