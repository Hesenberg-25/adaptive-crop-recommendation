"""
services/subsidy.py — Government schemes via Groq (ported from subsidyService.js)
"""
import os
import json
import time
from groq import AsyncGroq

_cache: dict = {}
CACHE_TTL_S = 60 * 60 * 24  # 24 hours


def _normalize_url(u: str):
    if not u:
        return None
    u = u.strip()
    return u if u.startswith("http") else None


async def get_dynamic_subsidies(crop_names: list[str], state: str = "", district: str = "") -> list:
    if not crop_names:
        return []

    state = (state or "").lower().strip() or "all"
    district = (district or "").lower().strip() or "all"
    sorted_crops = sorted(c.lower().strip() for c in crop_names)
    cache_key = f"{','.join(sorted_crops)}::{state}::{district}"

    cached = _cache.get(cache_key)
    if cached and (time.time() - cached["ts"]) < CACHE_TTL_S:
        return cached["value"]

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return []

    prompt = f"""You are an assistant that provides authoritative information about Indian government agricultural schemes.

Given these crops: {', '.join(crop_names)}

Return ONLY a single JSON object with two keys: "universal" and "crop_specific".

- "universal" is an array of scheme objects that apply broadly to most farmers.
- "crop_specific" is an object where each key is a lowercase crop name and value is an array of schemes for that crop.

Each scheme object MUST include these exact keys: name, benefitType, details, eligibility, implementingAgency, link, officialDocumentLinks (array).

Important instructions:
1) For the "link" and each item in "officialDocumentLinks" prefer official government domains (gov.in, nic.in, pmkisan.gov.in, agricoop.gov.in). If the official site is not available, provide the best authoritative source.
2) "eligibility" should be a concise sentence listing who qualifies.
3) "implementingAgency" must be the government department or agency name.
4) Do NOT include markdown or commentary; output valid JSON only.

Example output schema:
{{
  "universal": [ {{ "name": "PM-KISAN", "benefitType": "Income Support", "details": "Annual direct income support...", "eligibility": "Small and marginal farmers with valid land records", "implementingAgency": "Ministry of Agriculture & Farmers Welfare", "link": "https://pmkisan.gov.in/", "officialDocumentLinks": [] }} ],
  "crop_specific": {{ "rice": [], "wheat": [] }}
}}"""

    try:
        client = AsyncGroq(api_key=api_key)
        response = await client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.0,
            response_format={"type": "json_object"},
        )
        raw = json.loads(response.choices[0].message.content or "{}")

        def clean_scheme(s):
            return {
                "name": s.get("name", "Unknown"),
                "benefitType": s.get("benefitType", ""),
                "details": s.get("details", ""),
                "eligibility": s.get("eligibility", ""),
                "implementingAgency": s.get("implementingAgency", ""),
                "link": _normalize_url(s.get("link", "")),
                "officialDocumentLinks": [_normalize_url(u) for u in s.get("officialDocumentLinks", []) if _normalize_url(u)],
            }

        universal = [clean_scheme(s) for s in (raw.get("universal") or [])]
        crop_specific_raw = raw.get("crop_specific") or {}
        crop_specific = {k.lower().strip(): [clean_scheme(s) for s in v] for k, v in crop_specific_raw.items()}

        result = []
        for crop_name in crop_names:
            norm = crop_name.lower().strip()
            crop_list = crop_specific.get(norm, [])
            total = len(universal) + len(crop_list)
            summary = f"{total} schemes found"
            if crop_list:
                summary += f" ({len(crop_list)} crop-specific, {len(universal)} universal)"
            else:
                summary += f" ({len(universal)} universal)"
            result.append({
                "crop": crop_name,
                "universal": universal,
                "cropSpecific": crop_list,
                "totalSchemes": total,
                "estimatedBenefitSummary": summary,
            })

        _cache[cache_key] = {"ts": time.time(), "value": result}
        return result

    except Exception as exc:
        print(f"[Subsidy] Error: {exc}")
        return []
