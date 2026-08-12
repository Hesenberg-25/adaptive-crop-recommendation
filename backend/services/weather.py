"""
services/weather.py — Open-Meteo weather & climate helpers
"""
from datetime import date, timedelta
import httpx

OPEN_METEO_FORECAST = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_ARCHIVE  = "https://archive-api.open-meteo.com/v1/archive"


async def get_weather(lat: float, lon: float) -> dict:
    """Current weather + 16-day daily forecast via Open-Meteo."""
    try:
        params = {
            "latitude": lat, "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
            "timezone": "auto", "forecast_days": 16,
        }
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(OPEN_METEO_FORECAST, params=params)
            res.raise_for_status()
            data = res.json()

        current = data["current"]
        daily   = data["daily"]
        rainfall_7d = sum(v or 0 for v in daily["precipitation_sum"][:7])
        daily_forecast = [
            {
                "date": daily["time"][i],
                "weatherCode": daily["weather_code"][i],
                "maxTemp": daily["temperature_2m_max"][i],
                "minTemp": daily["temperature_2m_min"][i],
                "precipitation": daily["precipitation_sum"][i],
            }
            for i in range(len(daily["time"]))
        ]
        return {
            "temperature": current["temperature_2m"],
            "humidity": current["relative_humidity_2m"],
            "rainfall": rainfall_7d,
            "windSpeed": current["wind_speed_10m"],
            "dailyForecast": daily_forecast,
        }
    except Exception as exc:
        print(f"[Weather] Error: {exc}")
        return {"temperature": 25, "humidity": 60, "rainfall": 120, "windSpeed": 15, "dailyForecast": []}


async def get_climate_forecast(lat: float, lon: float, cycle_days: int = 120, target_month: int = None) -> dict:
    """Average historical climate over past 3 years for a planting-cycle duration."""
    years_to_avg = 3
    today = date.today()
    tasks = []

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            total_rainfall, total_temp, total_wind = 0.0, 0.0, 0.0

            for i in range(1, years_to_avg + 1):
                start = today.replace(year=today.year - i)
                if target_month is not None:
                    start = start.replace(month=target_month + 1, day=1)
                end = start + timedelta(days=cycle_days)

                params = {
                    "latitude": lat, "longitude": lon,
                    "start_date": start.isoformat(), "end_date": end.isoformat(),
                    "daily": "temperature_2m_mean,precipitation_sum,wind_speed_10m_max",
                    "timezone": "auto",
                }
                res = await client.get(OPEN_METEO_ARCHIVE, params=params)
                res.raise_for_status()
                daily = res.json()["daily"]

                total_rainfall += sum(v or 0 for v in daily["precipitation_sum"])
                valid_temps = [v for v in daily["temperature_2m_mean"] if v is not None]
                total_temp += (sum(valid_temps) / len(valid_temps)) if valid_temps else 25
                valid_wind = [v for v in (daily.get("wind_speed_10m_max") or []) if v is not None]
                total_wind += (sum(valid_wind) / len(valid_wind)) if valid_wind else 15

            current = await get_weather(lat, lon)
            return {
                "temperature": round(total_temp / years_to_avg, 2),
                "humidity": current["humidity"],
                "rainfall": round(total_rainfall / years_to_avg, 2),
                "windSpeed": round(total_wind / years_to_avg, 2),
            }
    except Exception as exc:
        print(f"[ClimateForecast] Error: {exc}")
        return await get_weather(lat, lon)
