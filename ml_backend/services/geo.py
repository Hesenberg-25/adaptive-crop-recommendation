"""
services/geo.py — Reverse-geocode lat/lon → state + language (Nominatim)
"""
import httpx

STATE_LANGUAGE_MAP = {
    "maharashtra": "mr",
    "uttar pradesh": "hi", "madhya pradesh": "hi", "bihar": "hi",
    "rajasthan": "hi", "haryana": "hi", "chhattisgarh": "hi",
    "jharkhand": "hi", "uttarakhand": "hi", "himachal pradesh": "hi",
    "delhi": "hi",
    "tamil nadu": "ta",
    "karnataka": "kn",
    "andhra pradesh": "te", "telangana": "te",
    "gujarat": "gu",
    "west bengal": "bn",
    "punjab": "pa",
    "kerala": "ml",
    "odisha": "or",
}


async def reverse_geocode(lat: float, lon: float) -> dict:
    """Return { language, region, district } for a lat/lon pair."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"lat": lat, "lon": lon, "format": "json", "zoom": 10},
                headers={"User-Agent": "AdaptiveCropRecommendation/2.0"},
            )
            res.raise_for_status()
            data = res.json()

        address = data.get("address", {})
        state = (address.get("state") or "").lower()
        district = address.get("state_district") or address.get("county")
        language = STATE_LANGUAGE_MAP.get(state, "en")
        return {"language": language, "region": address.get("state"), "district": district}
    except Exception as exc:
        print(f"[Geo] Reverse geocode failed: {exc}")
        return {"language": "en", "region": None, "district": None}
