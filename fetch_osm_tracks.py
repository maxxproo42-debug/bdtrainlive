import urllib.request
import urllib.parse
import json
import time

print("Querying Overpass API for authentic Bangladesh railway track geometries...")

# Query for main railways in Bangladesh covering Northern Corridor, Jamuna Bridge, and Dhaka
query = """
[out:json][timeout:60];
area["ISO3166-1"="BD"][admin_level=2]->.bd;
(
  way["railway"="rail"]["usage"="main"](area.bd);
  way["railway"="rail"]["service"!~".*"](area.bd);
  relation["railway"="rail"](area.bd);
);
out geom;
"""

url = "https://overpass-api.de/api/interpreter"
req = urllib.request.Request(
    url,
    data=urllib.parse.urlencode({"data": query}).encode("utf-8"),
    headers={"User-Agent": "BDRailAssistant-TrackAligner/1.0"}
)

try:
    with urllib.request.urlopen(req, timeout=45) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        elements = data.get("elements", [])
        print(f"Successfully retrieved {len(elements)} railway track elements from OpenStreetMap!")
        with open("bd_osm_railways_raw.json", "w", encoding="utf-8") as f:
            json.dump(elements, f)
        print("Saved raw track elements to bd_osm_railways_raw.json")
except Exception as e:
    print(f"Error querying Overpass API: {e}")

