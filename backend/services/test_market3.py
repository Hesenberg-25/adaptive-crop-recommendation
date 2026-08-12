import requests

api_key = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"
url = f"https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key={api_key}&format=json&limit=5"
try:
    res = requests.get(url, timeout=30)
    print("STATUS:", res.status_code)
    print("DATA:", res.text[:500])
except Exception as e:
    print("ERROR:", e)
