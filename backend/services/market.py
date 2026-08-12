"""
services/market.py — Dynamic market prices via Groq + data.gov.in Mandi API
"""
import os
import json
import time
import httpx
from groq import AsyncGroq

_cache: dict = {}
CACHE_TTL_S = 60 * 60 * 24  # 24 hours

COMMON_CROPS = [
    "carrot", "tomato", "wheat", "rice", "potato", "maize", "cotton", "sugarcane",
    "chickpea", "kidneybeans", "pigeonpeas", "mothbeans", "mungbean", "blackgram",
    "lentil", "pomegranate", "banana", "mango", "grapes", "watermelon", "muskmelon",
    "apple", "orange", "papaya", "coconut", "jute", "coffee", "soybean", "millet", "mustard",
]

DEFAULT_FALLBACK = {
    "default": {
        "pricePerTon": 15000, "costPerHectare": 35000, "yieldPerHectareTons": 10,
        "minRainfall": 50, "maxRainfall": 150,
        "preferredSoil": ["alluvial", "black", "red", "laterite"],
    }
}

STATIC_FALLBACK = {
    "wheat": {"pricePerTon": 22000, "costPerHectare": 30000, "yieldPerHectareTons": 4, "minRainfall": 30, "maxRainfall": 100, "preferredSoil": ["alluvial", "black"]},
    "rice": {"pricePerTon": 20000, "costPerHectare": 45000, "yieldPerHectareTons": 5, "minRainfall": 150, "maxRainfall": 300, "preferredSoil": ["alluvial", "laterite"]},
    **DEFAULT_FALLBACK,
}


async def _fetch_mandi_prices(state: str = None, district: str = None) -> dict | None:
    api_key = os.getenv("DATA_GOV_IN_API_KEY", "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b")
    if not api_key:
        return None
    try:
        url = f"https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key={api_key}&format=json&limit=1000"
        if state:
            url += f"&filters[state]={state}"
        if district:
            url += f"&filters[district]={district}"
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(url)
            res.raise_for_status()
            records = res.json().get("records", [])

        price_map = {}
        for record in records:
            commodity = (record.get("commodity") or "").lower()
            price = record.get("modal_price")
            if not commodity or price is None:
                continue
            try:
                price = float(price)
            except (ValueError, TypeError):
                continue
            matched = next((c for c in COMMON_CROPS if commodity in c or c in commodity), None)
            if not matched:
                if "bengal gram" in commodity:
                    matched = "chickpea"
                elif "paddy" in commodity:
                    matched = "rice"
            if not matched:
                continue
            if matched not in price_map:
                price_map[matched] = {"sum": 0, "count": 0, "markets": set()}
            price_map[matched]["sum"] += price
            price_map[matched]["count"] += 1
            if record.get("market"):
                price_map[matched]["markets"].add(record["market"])

        return {
            crop: {"price": (d["sum"] / d["count"]) * 10, "markets": list(d["markets"])}
            for crop, d in price_map.items()
        } or None
    except Exception as exc:
        print(f"[Mandi] Error: {exc}")
        return None


async def fetch_raw_mandi_records(state=None, district=None, commodity=None, limit=50, offset=0) -> dict:
    api_key = os.getenv("DATA_GOV_IN_API_KEY", "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b")
    if not api_key:
        return {"records": [], "total": 0, "error": "Missing API Key"}
    try:
        url = f"https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key={api_key}&format=json&limit={limit}&offset={offset}"
        if state:
            url += f"&filters[state]={state}"
        if district:
            url += f"&filters[district]={district}"
        if commodity:
            url += f"&filters[commodity]={commodity}"
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(url)
            res.raise_for_status()
            data = res.json()
        return {"records": data.get("records", []), "total": data.get("total", 0), "count": data.get("count", 0)}
    except Exception as exc:
        return {"records": [], "total": 0, "error": str(exc)}


async def get_dynamic_market_prices(state: str = None, district: str = None) -> dict:
    cache_key = "all"
    if state:
        cache_key = state.lower()
    if district:
        cache_key += f"-{district.lower()}"

    cached = _cache.get(cache_key)
    if cached and (time.time() - cached["ts"]) < CACHE_TTL_S:
        return cached["value"]

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return STATIC_FALLBACK

    try:
        client = AsyncGroq(api_key=api_key)
        prompt = f"""You are a real-time agricultural economics AI. Provide estimated current market prices in INR, cultivation costs, and typical yields for crops in India. 
Generate a comprehensive JSON object for these specific crops: {', '.join(COMMON_CROPS)}.

IMPORTANT: 
- Respond ONLY with a valid JSON object. Do not include markdown formatting, backticks, or intro/outro text.
- The root of the JSON should just be the object, where keys are the lowercase crop names.
- Always include a "default" key as a fallback.

Format each crop exactly like this example:
{{
  "wheat": {{ "pricePerTon": 22000, "costPerHectare": 30000, "yieldPerHectareTons": 4, "minRainfall": 30, "maxRainfall": 100, "preferredSoil": ["alluvial", "black"] }},
  "default": {{ "pricePerTon": 15000, "costPerHectare": 35000, "yieldPerHectareTons": 10, "minRainfall": 50, "maxRainfall": 150, "preferredSoil": ["alluvial", "black", "red", "laterite"] }}
}}"""

        import asyncio
        groq_task = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        mandi_task = _fetch_mandi_prices(state, district)
        groq_response, live_prices = await asyncio.gather(groq_task, mandi_task)

        parsed = json.loads(groq_response.choices[0].message.content or "{}")
        if not parsed:
            raise ValueError("Empty response from Groq")

        # Merge live mandi prices
        if live_prices:
            for crop, live in live_prices.items():
                if crop in parsed:
                    parsed[crop]["pricePerTon"] = round(live["price"])
                    parsed[crop]["isRealTimePrice"] = True
                    parsed[crop]["mandiNames"] = live["markets"]
                else:
                    parsed[crop] = {**DEFAULT_FALLBACK["default"], "pricePerTon": round(live["price"]), "isRealTimePrice": True, "mandiNames": live["markets"]}

        if "default" not in parsed:
            parsed["default"] = DEFAULT_FALLBACK["default"]

        _cache[cache_key] = {"ts": time.time(), "value": parsed}
        return parsed

    except Exception as exc:
        print(f"[Market] Error: {exc}")
        if cache_key in _cache:
            return _cache[cache_key]["value"]
        return STATIC_FALLBACK
