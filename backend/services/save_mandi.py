import requests
import json
try:
    res = requests.get("https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&limit=5", timeout=30)
    with open("mandi.json", "w") as f:
        json.dump(res.json(), f)
    print("SAVED", len(res.content), "bytes")
except Exception as e:
    print("ERROR:", e)
