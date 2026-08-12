import requests

api_key = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"
url = f"https://api.data.gov.in/catalog/v1?api-key={api_key}&title=Current+Daily+Price&format=json&limit=5"
try:
    res = requests.get(url, timeout=10)
    print(res.json())
except Exception as e:
    print("Catalog search error:", e)
