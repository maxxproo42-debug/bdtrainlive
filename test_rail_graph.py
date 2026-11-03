import json
import math
import heapq

print("Loading OSM raw railway ways...")
with open("bd_osm_railways_raw.json", "r", encoding="utf-8") as f:
    raw_ways = json.load(f)

# Build railway graph
# Nodes: (round(lat, 5), round(lon, 5)) -> key
def node_key(lat, lon):
    return (round(lat, 5), round(lon, 5))

def haversine(p1, p2):
    R = 6371.0 # km
    dlat = math.radians(p2[0] - p1[0])
    dlon = math.radians(p2[1] - p1[1])
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(p1[0])) * math.cos(math.radians(p2[0])) * math.sin(dlon / 2)**2
    return 2 * R * math.asin(math.sqrt(a))

graph = {}
all_nodes = []

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
        all_nodes.append(u)
        all_nodes.append(v)

print(f"Railway graph built: {len(graph)} unique track vertices!")

# Helper to find closest graph vertex to a given coordinate
def find_closest_vertex(lat, lon, max_dist_km=3.0):
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

# Dijkstra / A* along the actual railway track
def find_rail_path(start_coord, end_coord):
    start_v, d1 = find_closest_vertex(start_coord[0], start_coord[1])
    end_v, d2 = find_closest_vertex(end_coord[0], end_coord[1])
    if not start_v or not end_v:
        print(f"Could not connect {start_coord} or {end_coord} to rail graph!")
        return None

    # A* search
    open_set = [(0.0, 0.0, start_v, [start_v])]
    visited = {}
    
    while open_set:
        f, g, cur, path = heapq.heappop(open_set)
        if cur in visited and visited[cur] <= g:
            continue
        visited[cur] = g
        
        if haversine(cur, end_v) < 0.05: # within 50 meters of target
            return path
            
        for neighbor, edge_d in graph.get(cur, []):
            new_g = g + edge_d
            if neighbor not in visited or new_g < visited[neighbor]:
                h = haversine(neighbor, end_v)
                heapq.heappush(open_set, (new_g + h, new_g, neighbor, path + [neighbor]))
                
    return None

# Test: Jamuna Bridge crossing from BB Setu West to BB Setu East!
bb_west = (24.3986, 89.7577)
bb_east = (24.3896, 89.8198)
print(f"Finding exact physical track across Jamuna from {bb_west} to {bb_east}...")
bridge_path = find_rail_path(bb_west, bb_east)
if bridge_path:
    print(f"SUCCESS! Found exact physical rail path across Jamuna: {len(bridge_path)} GPS vertices!")
    print(f"Start: {bridge_path[0]}, Mid: {bridge_path[len(bridge_path)//2]}, End: {bridge_path[-1]}")
else:
    print("Bridge path not found directly, checking connected components...")

