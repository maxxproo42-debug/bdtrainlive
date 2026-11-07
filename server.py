"""
BD Rail Assistant - Lightweight High Performance Web Server & API Gateway
Built with Python standard library (http.server) - Zero external dependencies required.
"""

import sys
import os
import json
import urllib.parse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

# Ensure current directory is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# Import our train database and ticket engine
from train_data import STATIONS, TRAINS, STATIONS_DICT, search_trains, get_train_by_number
from ticket_watcher import check_seat_availability, scan_all_stations_ticket_availability
from shohoz_live_client import login_to_shohoz, save_eticket_token, load_saved_token
from live_tracker_engine import (
    calculate_train_live_position, get_all_live_trains, get_current_bd_time,
    parse_and_submit_sms, submit_passenger_checkin, submit_passenger_gps, get_station_board,
    detect_live_rail_crossings, get_station_yard_layout,
    sync_with_gatishil_report, GATISHIL_CORRIDOR_CALIBRATIONS, VERIFIED_REPORTS
)
from rail_track_geometry import get_physical_track_for_train

STATIC_DIR = os.path.join(CURRENT_DIR, "static")

class BDRailAPIHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            payload = json.loads(post_data.decode('utf-8'))
        except Exception:
            payload = {}

        # API: Parse & Submit 16318 SMS Ground-Truth
        if path == "/api/submit_sms":
            sms_text = payload.get("sms", "")
            if not sms_text:
                self.send_json_response({"status": "error", "message": "এসএমএস টেক্সট ফাঁকা হতে পারবে না।"}, status=400)
                return
            result = parse_and_submit_sms(sms_text)
            self.send_json_response(result)
            return

        # API: Passenger Live Check-in
        elif path == "/api/passenger_checkin":
            train_num = payload.get("train", "")
            station = payload.get("station", "")
            delay = payload.get("delay", 0)
            note = payload.get("note", "")
            if not train_num or not station:
                self.send_json_response({"status": "error", "message": "ট্রেন নম্বর এবং স্টেশন আবশ্যক।"}, status=400)
                return
            result = submit_passenger_checkin(train_num, station, delay, note)
            self.send_json_response(result)
            return

        # API: Passenger Real-Time Phone GPS Broadcast (Gatishil / Where is my train style)
        elif path == "/api/passenger_gps":
            train_num = payload.get("train", "")
            lat = payload.get("lat")
            lng = payload.get("lng")
            note = payload.get("note", "")
            if not train_num or lat is None or lng is None:
                self.send_json_response({"status": "error", "message": "ট্রেন নম্বর এবং জিপিএস স্থানাঙ্ক আবশ্যক।"}, status=400)
                return
            result = submit_passenger_gps(train_num, float(lat), float(lng), note)
            self.send_json_response(result)
            return

        # API: Sync with Gatishil BD Train Guide Live Report
        elif path == "/api/sync_gatishil":
            train_num = payload.get("train", "766")
            station = payload.get("station", None)
            next_stn = payload.get("next_station", None)
            delay = payload.get("delay", None)
            speed = payload.get("speed", None)
            note = payload.get("note", None)
            result = sync_with_gatishil_report(train_num, station=station, next_station=next_stn, delay_minutes=delay, speed=speed, note=note)
            self.send_json_response(result)
            return

        # API: Official Bangladesh Railway (Shohoz) Login & Token Sync
        elif path == "/api/eticket_login":
            mobile = payload.get("mobile_number", "")
            password = payload.get("password", "")
            if not mobile or not password:
                self.send_json_response({"status": "error", "message": "মোবাইল নম্বর এবং পাসওয়ার্ড আবশ্যক।"}, status=400)
                return
            result = login_to_shohoz(mobile, password)
            self.send_json_response(result)
            return

        # API: Directly Save or Update Official eticket Bearer Token
        elif path == "/api/eticket_token":
            token = payload.get("token", "")
            user = payload.get("user", {})
            if not token or len(str(token).strip()) < 20:
                self.send_json_response({"status": "error", "message": "সঠিক অথরাইজেশন টোকেন প্রদান করুন।"}, status=400)
                return
            success = save_eticket_token(str(token).strip(), user)
            if success:
                try:
                    from ticket_watcher import clear_shohoz_cache
                    clear_shohoz_cache()
                except Exception:
                    pass
                self.send_json_response({"status": "success", "message": "বাংলাদেশ রেলওয়ে eticket টোকেন সফলভাবে সিঙ্ক হয়েছে!"})
            else:
                self.send_json_response({"status": "error", "message": "টোকেন সংরক্ষণ ব্যর্থ হয়েছে।"}, status=500)
            return

        self.send_json_response({"status": "error", "message": "Endpoint not found"}, status=404)

    def do_HEAD(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        if path in ["/api/health", "/health", "/api/all_live_trains", "/api/stations"]:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
        else:
            super().do_HEAD()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        # API: Health Check (Render 24/7 Keep-Alive & Monitoring)
        if path == "/api/health" or path == "/health":
            self.send_json_response({
                "status": "healthy",
                "service": "BD Rail Assistant",
                "uptime": "online",
                "server_time": get_current_bd_time().strftime("%Y-%m-%d %I:%M:%S %p")
            })
            return

        # API: Official eticket Session Status
        elif path == "/api/eticket_session":
            token, user = load_saved_token()
            if token:
                masked = token[:6] + "..." + token[-4:] if len(token) > 10 else "***"
                self.send_json_response({
                    "status": "success",
                    "is_authenticated": True,
                    "masked_token": masked
                })
            else:
                self.send_json_response({
                    "status": "unauthenticated",
                    "is_authenticated": False,
                    "message": "রেলওয়ে ডেটা মোড সক্রিয়।"
                })
            return

        # API: Get Station List
        elif path == "/api/stations":
            self.send_json_response(STATIONS)
            return

        # API: Get Stations Dictionary with GPS coordinates
        elif path == "/api/stations_geo":
            self.send_json_response({"status": "success", "stations": STATIONS_DICT})
            return

        # API: Live Tracking for Single Train
        elif path == "/api/live_location":
            num = query.get("train", ["705"])[0]
            train = get_train_by_number(num)
            if train:
                live_info = calculate_train_live_position(train)
                # Attach authentic physical railway track coordinates (strict satellite alignment)
                physical_track = get_physical_track_for_train(train["origin"], train["destination"], train["stoppages"])
                stoppage_set = set(train["stoppages"])
                route_coords = []
                for pt in physical_track:
                    route_coords.append({
                        "name": pt["name"],
                        "lat": pt["lat"],
                        "lng": pt["lng"],
                        "is_stoppage": pt["name"] in stoppage_set
                    })
                live_info["route_coords"] = route_coords
                self.send_json_response({"status": "success", "data": live_info})
            else:
                self.send_json_response({"status": "error", "message": "Train not found"}, status=404)
            return

        # API: Live Station Board (All trains arriving/departing from a station)
        elif path == "/api/station_board":
            station = query.get("station", ["Dinajpur"])[0]
            board = get_station_board(station)
            self.send_json_response({
                "status": "success",
                "station": station,
                "count": len(board),
                "trains": board
            })
            return

        # API: All Live Running Trains in Bangladesh
        elif path == "/api/all_live_trains":
            all_trains_live = get_all_live_trains()
            self.send_json_response({
                "status": "success",
                "count": len(all_trains_live),
                "server_time": get_current_bd_time().strftime("%I:%M:%S %p"),
                "trains": all_trains_live
            })
            return

        # API: Search Trains / Seats
        elif path == "/api/search":
            origin = query.get("from", ["Dhaka"])[0]
            destination = query.get("to", ["Dinajpur"])[0]
            date = query.get("date", [""])[0]
            results = check_seat_availability(origin, destination, date)
            self.send_json_response({
                "status": "success",
                "count": len(results),
                "from": origin,
                "to": destination,
                "date": date,
                "trains": results
            })
            return

        # API: Station-by-Station Live Ticket Scanner
        elif path == "/api/station_tickets":
            num = query.get("train", ["766"])[0]
            date = query.get("date", [""])[0]
            if not date:
                date = get_current_bd_time().strftime("%d-%b-%Y")
            dest = query.get("dest", [None])[0]
            from_stn = query.get("from", [None])[0]
            result = scan_all_stations_ticket_availability(num, date, dest, from_stn)
            self.send_json_response(result)
            return

        # API: Live Train Crossings & Signal Alert
        elif path == "/api/live_crossings":
            train_num = query.get("train", ["766"])[0]
            stn = query.get("station", [None])[0]
            result = detect_live_rail_crossings(train_num, requested_station=stn)
            self.send_json_response(result)
            return

        # API: Station Yard & Track Layout
        elif path == "/api/station_yard":
            station = query.get("station", ["Saidpur"])[0]
            train_num = query.get("train", ["766"])[0]
            result = get_station_yard_layout(station, train_num)
            self.send_json_response(result)
            return

        # API: Gatishil Calibration Status & Presets
        elif path == "/api/gatishil_status":
            num = query.get("train", ["766"])[0]
            calib = GATISHIL_CORRIDOR_CALIBRATIONS.get(num, None)
            verified = VERIFIED_REPORTS.get(num, None)
            self.send_json_response({
                "status": "success",
                "train": num,
                "calibrated_profile": calib,
                "verified_report": {
                    "station": verified["station"],
                    "delay": verified["delay"],
                    "source": verified["source"],
                    "time": verified["timestamp"].strftime("%I:%M:%S %p")
                } if verified else None,
                "all_calibrated_trains": list(GATISHIL_CORRIDOR_CALIBRATIONS.keys())
            })
            return

        # API: Official Bangladesh Railway Sync Status
        elif path == "/api/eticket_status":
            token, user = load_saved_token()
            is_active = bool(token and len(token) > 20)
            self.send_json_response({
                "status": "success",
                "connected": is_active,
                "user": user or {},
                "source": "🟢 বাংলাদেশ রেলওয়ে অফিসিয়াল eticket.railway.gov.bd লাইভ সিঙ্ক" if is_active else "🟡 ক্যালিব্রেটেড অফিসিয়াল রেলওয়ে কোটা ইঞ্জিন (৫০+ আসন মডেল)"
            })
            return

        # API: Get All Trains List
        elif path == "/api/trains":
            self.send_json_response({
                "status": "success",
                "count": len(TRAINS),
                "trains": TRAINS
            })
            return

        # API: Community & Verified Reports Feed
        elif path == "/api/verified_feed":
            feed = []
            for num, rep in VERIFIED_REPORTS.items():
                train = get_train_by_number(num)
                feed.append({
                    "train_number": num,
                    "train_name": train["name_bn"] if train else num,
                    "station": rep.get("station", "—"),
                    "source": rep.get("source", "PASSENGER"),
                    "delay": rep.get("delay", 0),
                    "note": rep.get("note", ""),
                    "time": rep.get("timestamp").strftime("%I:%M:%S %p") if rep.get("timestamp") else "এখনই"
                })
            self.send_json_response({"status": "success", "count": len(feed), "feed": feed})
            return

        # API: Train Details (Timeline & Stoppages)
        elif path == "/api/train_details":
            num = query.get("number", ["705"])[0]
            train = get_train_by_number(num)
            if train:
                self.send_json_response({"status": "success", "train": train})
            else:
                self.send_json_response({"status": "error", "message": "Train not found"}, status=404)
            return

        # API: 16318 SMS Tracking Helper
        elif path == "/api/track_sms":
            num = query.get("number", ["705"])[0]
            train = get_train_by_number(num)
            code = train["ttms_code"] if train else num
            self.send_json_response({
                "status": "success",
                "train_number": num,
                "sms_number": "16318",
                "sms_body": f"TR {code}",
                "sms_url": f"sms:16318?body=TR%20{code}",
                "instruction": f"মোবাইলের মেসেজ অপশনে গিয়ে 'TR {code}' লিখে 16318 নম্বরে পাঠিয়ে দিন (চার্জ প্রায় ৪-৫ টাকা)।"
            })
            return

        # Default static file handler (index.html, app.js, etc.)
        if path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_json_response(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

class ThreadingServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True

def run_server(port=5055):
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    # Candidate ports in priority order (Render sets PORT environment variable)
    env_port = os.environ.get("PORT")
    if env_port:
        try:
            candidate_ports = [int(env_port)]
        except ValueError:
            candidate_ports = [port]
    else:
        candidate_ports = [port]
        for alt in [5055, 5051, 8080, 5500]:
            if alt not in candidate_ports:
                candidate_ports.append(alt)

    httpd = None
    actual_port = candidate_ports[0]
    for p in candidate_ports:
        try:
            server_address = ("0.0.0.0", p)
            httpd = ThreadingServer(server_address, BDRailAPIHandler)
            actual_port = p
            break
        except Exception as err:
            print(f"[Port Warning] Could not bind to port {p}: {err}. Trying next...")

    if not httpd:
        print("[Fatal Error] Could not bind to any candidate ports.")
        return

    print("=====================================================")
    print(f"   [BD Rail Assistant] Bangladesh Railway Live Portal")
    print(f"   Web Dashboard: http://localhost:{actual_port}      ")
    print(f"   Alternative:   http://127.0.0.1:{actual_port}      ")
    print("=====================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer shutting down gracefully.")
        httpd.server_close()

if __name__ == "__main__":
    env_port = os.environ.get("PORT")
    if env_port:
        try:
            port = int(env_port)
        except ValueError:
            port = 5055
    elif len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            port = 5055
    else:
        port = 5055
    run_server(port)
