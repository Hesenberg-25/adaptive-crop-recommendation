import requests
api_key = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"
id1 = "9ef84268-d588-465a-a308-a864a43d0070"
url1 = f"https://api.data.gov.in/resource/{id1}?api-key={api_key}&format=json&limit=1"
try:
    print("ID1:", requests.get(url1, timeout=5).json())
except Exception as e:
    print("ID1 error:", e)

id2 = "9ef84268-d588-465a-a308-a864a43d0070"
url2 = f"https://api.data.gov.in/resource/3b01bcb80b144abfb6f2c1bfd384ba69?api-key={api_key}&format=json&limit=1"
try:
    print("ID2:", requests.get(url2, timeout=5).json())
except Exception as e:
    print("ID2 error:", e)
