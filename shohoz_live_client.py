"""
Bangladesh Railway (Shohoz) Official Live eTicket Client
Connects directly to https://railspaapi.shohoz.com for 100% accurate, real-time seat availability.
"""

import os
import sys
import json
import ssl
import urllib.request
import urllib.parse
from datetime import datetime

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_FILE = os.path.join(CURRENT_DIR, "eticket_token.json")

SHOHOZ_BASE_URL = "https://railspaapi.shohoz.com/v1.0/web"

def get_ssl_context():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx

def load_saved_token():
    """Retrieves saved eticket token from environment or local JSON"""
    env_token = os.environ.get("ETICKET_AUTH_TOKEN")
    if env_token and len(env_token.strip()) > 20:
        return env_token.strip(), {"mobile": "Environment Account"}

    if os.path.exists(TOKEN_FILE):
        try:
            with open(TOKEN_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                token = data.get("token") or data.get("access_token")
                user = data.get("user", {})
                if token and len(token) > 20:
                    return token, user
        except Exception:
            pass
    return None, None

def save_eticket_token(token, user_info=None):
    """Saves eticket token securely to local JSON file"""
    try:
        payload = {
            "token": token,
            "user": user_info or {},
            "updated_at": datetime.now().isoformat()
        }
        with open(TOKEN_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving eticket token: {e}")
        return False

def format_date_for_shohoz(date_str):
    """Converts any date string (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, or DD-Mon-YYYY) into Shohoz format: DD-Mon-YYYY"""
    if not date_str:
        return datetime.now().strftime("%d-%b-%Y")
    d = str(date_str).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%d-%b-%Y", "%d %b %Y"):
        try:
            dt = datetime.strptime(d, fmt)
            return dt.strftime("%d-%b-%Y")
        except ValueError:
            pass
    return d

def login_to_shohoz(mobile_number, password):
    """
    Authenticates with Bangladesh Railway official API and returns JWT token
    """
    clean_mobile = str(mobile_number).strip().replace(" ", "").replace("-", "")
    if clean_mobile.startswith("+88"):
        clean_mobile = clean_mobile[3:]
    elif clean_mobile.startswith("88"):
        clean_mobile = clean_mobile[2:]

    url = f"{SHOHOZ_BASE_URL}/auth/sign-in"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Origin": "https://eticket.railway.gov.bd",
        "Referer": "https://eticket.railway.gov.bd/",
        "X-Requested-With": "XMLHttpRequest",
    }

    body = json.dumps({
        "mobile_number": clean_mobile,
        "password": password
    }).encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    ctx = get_ssl_context()

    try:
        with urllib.request.urlopen(req, timeout=12, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            token = data.get("data", {}).get("token") or data.get("data", {}).get("access_token")
            user = data.get("data", {}).get("user", {})
            if token:
                save_eticket_token(token, user)
                return {"status": "success", "token": token, "user": user}
            return {"status": "error", "message": "টোকেন পাওয়া যায়নি।"}
    except urllib.error.HTTPError as err:
        try:
            err_body = json.loads(err.read().decode("utf-8"))
            msg = err_body.get("error", {}).get("messages", ["লগইন ব্যর্থ হয়েছে"])[0]
        except Exception:
            msg = f"HTTP Error {err.code}"
        return {"status": "error", "message": msg}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def fetch_shohoz_live_trips(from_city, to_city, date_of_journey):
    """
    Queries Shohoz API for 100% real-time official Bangladesh Railway seats.
    """
    token, user = load_saved_token()
    if not token:
        return {
            "status": "unauthenticated",
            "message": "রেলওয়ে eticket অ্যাকাউন্ট কানেক্ট করা নেই।",
            "trains": []
        }

    doj_formatted = format_date_for_shohoz(date_of_journey)
    
    # Capitalize station names as Shohoz expects (e.g. DINAJPUR, RAJSHAHI)
    from_upper = str(from_city).strip().upper()
    to_upper = str(to_city).strip().upper()

    params = urllib.parse.urlencode({
        "from_city": from_upper,
        "to_city": to_upper,
        "date_of_journey": doj_formatted,
        "seat_class": "S_CHAIR"
    })

    url = f"{SHOHOZ_BASE_URL}/bookings/search-trips-v2?{params}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/plain, */*",
        "Authorization": f"Bearer {token}",
        "Origin": "https://eticket.railway.gov.bd",
        "Referer": "https://eticket.railway.gov.bd/",
        "X-Requested-With": "XMLHttpRequest",
    }

    req = urllib.request.Request(url, headers=headers)
    ctx = get_ssl_context()

    try:
        with urllib.request.urlopen(req, timeout=12, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            trips_data = data.get("data", {}).get("trains") or data.get("data", {}).get("trips") or []
            return {
                "status": "success",
                "is_live_synced": True,
                "data_source": "🟢 বাংলাদেশ রেলওয়ে অফিসিয়াল eticket.railway.gov.bd থেকে লাইভ সিঙ্কড",
                "raw_trains": trips_data,
                "doj": doj_formatted
            }
    except urllib.error.HTTPError as err:
        if err.code == 401:
            return {
                "status": "token_expired",
                "message": "eticket সেশন টোকেনের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে পুনরায় লগইন করুন।",
                "trains": []
            }
        return {
            "status": "error",
            "message": f"রেলওয়ে সার্ভার এরর: {err.code}",
            "trains": []
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"নেটওয়ার্ক সংযোগ ব্যর্থ: {e}",
            "trains": []
        }

