import requests
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
try:
    res = requests.get("https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&limit=5", headers=headers, timeout=10)
    print("STATUS:", res.status_code)
    print("DATA LENGTH:", len(res.content))
except Exception as e:
    print("ERROR:", e)
