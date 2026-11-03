import json
import math
import heapq
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("Building Master OpenStreetMap Railway Graph for Bangladesh...")
with open("bd_osm_railways_raw.json", "r", encoding="utf-8") as f:
    raw_ways = json.load(f)

def haversine(p1, p2):
    R = 6371.0 # km
    dlat = math.radians(p2[0] - p1[0])
    dlon = math.radians(p2[1] - p1[1])
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(p1[0])) * math.cos(math.radians(p2[0])) * math.sin(dlon / 2)**2
    return 2 * R * math.asin(math.sqrt(a))

graph = {}

def add_edge(u, v):
    d = haversine(u, v)
    if u not in graph: graph[u] = []
    if v not in graph: graph[v] = []
    graph[u].append((v, d))
    graph[v].append((u, d))

for way in raw_ways:
    geom = way.get("geometry", [])
    if len(geom) < 2: continue
    for i in range(len(geom) - 1):
        u = (geom[i]["lat"], geom[i]["lon"])
        v = (geom[i+1]["lat"], geom[i+1]["lon"])
        add_edge(u, v)

print(f"Graph vertices: {len(graph)}")

def find_closest_vertex(lat, lon, max_dist_km=5.0):
    target = (lat, lon)
    best_v = None
    min_d = 999999.0
    for v in graph.keys():
        d = haversine(target, v)
        if d < min_d:
            min_d = d
            best_v = v
    if min_d <= max_dist_km:
        return best_v, min_d
    return None, min_d

def find_rail_path(start_coord, end_coord):
    start_v, _ = find_closest_vertex(start_coord[0], start_coord[1])
    end_v, _ = find_closest_vertex(end_coord[0], end_coord[1])
    if not start_v or not end_v:
        return None

    open_set = [(0.0, 0.0, start_v, [start_v])]
    visited = {}
    
    while open_set:
        f, g, cur, path = heapq.heappop(open_set)
        if cur in visited and visited[cur] <= g:
            continue
        visited[cur] = g
        
        if haversine(cur, end_v) < 0.08: # within 80m
            return path
            
        for neighbor, edge_d in graph.get(cur, []):
            new_g = g + edge_d
            if neighbor not in visited or new_g < visited[neighbor]:
                h = haversine(neighbor, end_v)
                heapq.heappush(open_set, (new_g + h, new_g, neighbor, path + [neighbor]))
                
    return None

from train_data import STATIONS_DICT

def build_corridor_polyline(station_keys):
    full_poly = []
    for i in range(len(station_keys) - 1):
        s1 = station_keys[i]
        s2 = station_keys[i + 1]
        c1 = (STATIONS_DICT[s1]["lat"], STATIONS_DICT[s1]["lng"])
        c2 = (STATIONS_DICT[s2]["lat"], STATIONS_DICT[s2]["lng"])
        leg_path = find_rail_path(c1, c2)
        if leg_path:
            # avoid duplicating connecting node
            if full_poly and len(leg_path) > 1:
                full_poly.extend(leg_path[1:])
            else:
                full_poly.extend(leg_path)
            print(f"Leg {s1} ➔ {s2}: {len(leg_path)} physical track points (haversine dist: {haversine(c1, c2):.1f}km)")
        else:
            print(f"WARNING: Could not find path {s1} ➔ {s2}, fallback direct chord")
            full_poly.append(c1)
            full_poly.append(c2)
    return full_poly

# Corridor Sequences for Bangladesh Railway
corridors_to_build = {
    "NORTHERN_MAINLINE": [
        "Chilahati", "Domar", "Nilphamari", "Saidpur", "Parbatipur",
        "Phulbari", "Birampur", "Hili", "Panchbibi", "Joypurhat",
        "Akkelpur", "Tilakpur", "Santahar", "Natore", "Abdulpur",
        "Ishwardi Bypass", "Ullapara", "Shahid M Monsur Ali",
        "BB Setu West", "BB Setu East", "Tangail", "Mirzapur",
        "Joydebpur", "Dhaka Airport", "Dhaka"
    ],
    "PANCHAGARH_BRANCH": [
        "Panchagarh", "Thakurgaon Road", "Pirganj", "Setabganj",
        "Dinajpur", "Chirirbandar", "Parbatipur"
    ],
    "KHULNA_PARBATIPUR": [
        "Khulna", "Daulatpur", "Noapara", "Jessore", "Kotchandpur",
        "Chuadanga", "Poradah", "Ishwardi", "Abdulpur", "Natore",
        "Santahar", "Joypurhat", "Parbatipur"
    ],
    "DHAKA_CHITTAGONG_COXS": [
        "Dhaka", "Dhaka Airport", "Tongi", "Narsingdi", "Methikanda",
        "Bhairab Bazar", "Brahmanbaria", "Akhaura", "Cumilla",
        "Laksam", "Feni", "Sitakunda", "Chittagong", "Dohazari", "Cox's Bazar"
    ],
    "AKHAURA_SYLHET": [
        "Akhaura", "Shaistaganj", "Sreemangal", "Bhanugach",
        "Shamshernagar", "Kulaura", "Maijgaon", "Sylhet"
    ]
}

all_built_tracks = {}

for name, seq in corridors_to_build.items():
    print(f"\n==========================================")
    print(f"Generating physical track for {name} ({seq[0]} ➔ {seq[-1]})...")
    poly = build_corridor_polyline(seq)
    print(f"SUCCESS {name}: {len(poly)} physical track nodes!")
    all_built_tracks[name] = [{"lat": round(p[0], 6), "lng": round(p[1], 6)} for p in poly]

# Save to json file for instant high-speed lookups
with open("bd_rail_physical_tracks.json", "w", encoding="utf-8") as f:
    json.dump(all_built_tracks, f)
print("\n==========================================")
print("Saved all authentic corridors to bd_rail_physical_tracks.json!")
