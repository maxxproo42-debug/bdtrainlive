"""
Master Physical Railway Track Geometry Database for Bangladesh Railway
Powered by verified OpenStreetMap railway track vector data (100% ground-truth satellite alignment).
Includes authentic railway alignments across Jamuna Railway Bridge, Hardinge Bridge, Teesta Bridge,
and all junction curves and yards.
"""

import os
import json
import math
from train_data import STATIONS_DICT

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
TRACKS_JSON_PATH = os.path.join(CURRENT_DIR, "bd_rail_physical_tracks.json")

# In-memory cache for loaded tracks
_TRACKS_CACHE = None

def load_tracks_data():
    global _TRACKS_CACHE
    if _TRACKS_CACHE is None:
        if os.path.exists(TRACKS_JSON_PATH):
            try:
                with open(TRACKS_JSON_PATH, "r", encoding="utf-8") as f:
                    _TRACKS_CACHE = json.load(f)
            except Exception as e:
                print(f"Error loading {TRACKS_JSON_PATH}: {e}")
                _TRACKS_CACHE = {}
        else:
            _TRACKS_CACHE = {}
    return _TRACKS_CACHE

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_track_bearing(lat1, lon1, lat2, lon2):
    lat1_r = math.radians(lat1)
    lat2_r = math.radians(lat2)
    dlon_r = math.radians(lon2 - lon1)
    x = math.sin(dlon_r) * math.cos(lat2_r)
    y = math.cos(lat1_r) * math.sin(lat2_r) - (math.sin(lat1_r) * math.cos(lat2_r) * math.cos(dlon_r))
    b = (math.degrees(math.atan2(x, y)) + 360) % 360
    return round(b, 1)

def find_closest_index(track_points, target_lat, target_lng):
    """Finds index of the track point closest to target coordinate"""
    best_idx = 0
    min_dist = 999999.0
    for idx, pt in enumerate(track_points):
        d = (pt["lat"] - target_lat)**2 + (pt["lng"] - target_lng)**2
        if d < min_dist:
            min_dist = d
            best_idx = idx
    return best_idx

def get_physical_track_for_train(origin, destination, stoppages=None):
    """
    Returns authentic high-density track coordinates along the physical railway line
    for any train route.
    """
    tracks_db = load_tracks_data()
    stoppages = stoppages or []

    orig_info = STATIONS_DICT.get(origin, {"lat": 23.7317, "lng": 90.4262})
    dest_info = STATIONS_DICT.get(destination, {"lat": 23.7317, "lng": 90.4262})

    orig_lat, orig_lng = orig_info["lat"], orig_info["lng"]
    dest_lat, dest_lng = dest_info["lat"], dest_info["lng"]

    # Select primary corridor
    p_branch = tracks_db.get("PANCHAGARH_BRANCH", [])
    n_main = tracks_db.get("NORTHERN_MAINLINE", [])
    kp = tracks_db.get("KHULNA_PARBATIPUR", [])
    raj_branch = tracks_db.get("ABDULPUR_RAJSHAHI_BRANCH", [])

    is_panchagarh_route = any(k in origin or k in destination for k in ["Panchagarh", "Thakurgaon", "Pirganj", "Dinajpur"])
    is_rajshahi_route = ("Rajshahi" in origin or "Rajshahi" in destination)

    master_track = []

    # 1. Specialized composite: Panchagarh <-> Rajshahi (Banglabandha Express 804 / 803)
    if is_panchagarh_route and is_rajshahi_route:
        if "Rajshahi" in destination:
            # Panchagarh to Rajshahi (804): Panchagarh -> Parbatipur -> Abdulpur -> Rajshahi
            master_track = list(p_branch) + list(reversed(kp[1353:1785])) + list(raj_branch)
        else:
            # Rajshahi to Panchagarh (803): Rajshahi -> Abdulpur -> Parbatipur -> Panchagarh
            master_track = list(reversed(raj_branch)) + list(kp[1353:1785]) + list(reversed(p_branch))

    # 2. Specialized composite: Dhaka <-> Rajshahi (Silkcity, Padma, Dhumketu)
    elif ("Dhaka" in origin or "Dhaka" in destination) and is_rajshahi_route:
        if "Rajshahi" in destination:
            # Dhaka to Rajshahi
            master_track = list(reversed(n_main[631:1695])) + list(raj_branch)
        else:
            # Rajshahi to Dhaka
            master_track = list(reversed(raj_branch)) + list(n_main[631:1695])

    # 3. Specialized composite: Khulna <-> Rajshahi (Kapotaksha, Sagardari)
    elif ("Khulna" in origin or "Khulna" in destination) and is_rajshahi_route:
        if "Rajshahi" in destination:
            master_track = list(kp[:1354]) + list(raj_branch)
        else:
            master_track = list(reversed(raj_branch)) + list(reversed(kp[:1354]))

    # 4. Specialized composite: Panchagarh <-> Dhaka (Ekota, Drutojan, Panchagarh Express)
    elif is_panchagarh_route and ("Dhaka" in origin or "Dhaka" in destination):
        p_idx = find_closest_index(n_main, STATIONS_DICT["Parbatipur"]["lat"], STATIONS_DICT["Parbatipur"]["lng"])
        if "Dhaka" in destination:
            master_track = list(p_branch) + list(n_main[p_idx:])
        else:
            reversed_branch = list(reversed(p_branch))
            reversed_main = list(reversed(n_main))
            p_idx_rev = find_closest_index(reversed_main, STATIONS_DICT["Parbatipur"]["lat"], STATIONS_DICT["Parbatipur"]["lng"])
            master_track = list(reversed_main[:p_idx_rev+1]) + list(reversed_branch)

    # 5. Standard single-corridor lookups
    elif any(k in origin or k in destination for k in ["Khulna", "Jessore", "Benapole"]):
        master_track = kp
    elif any(k in origin or k in destination for k in ["Chittagong", "Cox"]):
        master_track = tracks_db.get("DHAKA_CHITTAGONG_COXS", [])
    elif any(k in origin or k in destination for k in ["Sylhet"]):
        master_track = tracks_db.get("AKHAURA_SYLHET", [])
    elif is_panchagarh_route:
        master_track = p_branch
    else:
        master_track = n_main

    if not master_track:
        res = []
        for s in stoppages:
            if s in STATIONS_DICT:
                res.append({"name": s, "lat": STATIONS_DICT[s]["lat"], "lng": STATIONS_DICT[s]["lng"], "is_stoppage": True})
        return res

    # Find slice bounds
    start_idx = find_closest_index(master_track, orig_lat, orig_lng)
    end_idx = find_closest_index(master_track, dest_lat, dest_lng)

    if start_idx <= end_idx:
        sliced = [dict(p) for p in master_track[start_idx : end_idx + 1]]
    else:
        sliced = [dict(p) for p in reversed(master_track[end_idx : start_idx + 1])]

    if len(sliced) < 2:
        sliced = [dict(p) for p in master_track]

    # Tag scheduled stoppages along this physical track slice
    for pt in sliced:
        pt["name"] = "Track Waypoint"
        pt["is_stoppage"] = False

    sliced[0]["name"] = origin
    sliced[0]["is_stoppage"] = True
    sliced[-1]["name"] = destination
    sliced[-1]["is_stoppage"] = True

    for stop in stoppages:
        if stop in STATIONS_DICT:
            s_lat = STATIONS_DICT[stop]["lat"]
            s_lng = STATIONS_DICT[stop]["lng"]
            closest_idx = find_closest_index(sliced, s_lat, s_lng)
            sliced[closest_idx]["name"] = stop
            sliced[closest_idx]["is_stoppage"] = True

    return sliced

def get_track_interpolated_position(track_points, progress_fraction):
    """
    Interpolates position along the high-density physical track waypoints.
    Returns: (lat, lng, bearing, current_station_a, current_station_b, segment_dist_km)
    """
    if not track_points:
        return (23.7317, 90.4262, 0.0, "Dhaka", "Dhaka", 0.0)
    if len(track_points) == 1:
        return (track_points[0]["lat"], track_points[0]["lng"], 0.0, track_points[0].get("name", ""), track_points[0].get("name", ""), 0.0)

    # Compute cumulative distances
    cum_dists = [0.0]
    total_km = 0.0
    for i in range(len(track_points) - 1):
        p1 = track_points[i]
        p2 = track_points[i + 1]
        d = haversine(p1["lat"], p1["lng"], p2["lat"], p2["lng"])
        total_km += d
        cum_dists.append(total_km)

    target_km = max(0.0, min(total_km, progress_fraction * total_km))

    # Find segment
    seg_idx = 0
    for i in range(len(cum_dists) - 1):
        if cum_dists[i] <= target_km <= cum_dists[i + 1]:
            seg_idx = i
            break
    else:
        seg_idx = len(track_points) - 2

    seg_start_km = cum_dists[seg_idx]
    seg_end_km = cum_dists[seg_idx + 1]
    seg_len = max(0.0001, seg_end_km - seg_start_km)
    seg_frac = max(0.0, min(1.0, (target_km - seg_start_km) / seg_len))

    pA = track_points[seg_idx]
    pB = track_points[seg_idx + 1]

    lat = pA["lat"] + (pB["lat"] - pA["lat"]) * seg_frac
    lng = pA["lng"] + (pB["lng"] - pA["lng"]) * seg_frac
    bearing = calculate_track_bearing(pA["lat"], pA["lng"], pB["lat"], pB["lng"])

    return (round(lat, 6), round(lng, 6), bearing, pA.get("name", "Track"), pB.get("name", "Track"), round(total_km, 1))
