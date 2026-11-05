"""
24/7 Render Keep-Alive & Pre-Warmer Sentinel
Pings https://bdtrainlive.onrender.com every 5 minutes to prevent Render free-tier sleep (15 min inactivity timeout).
Guarantees 100% warm instant response with ZERO Render cold starts.
"""

import sys
import time
import datetime
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding='utf-8')

RENDER_URLS = [
    "https://bdtrainlive.onrender.com/api/health",
    "https://bdtrainlive.onrender.com/",
    "https://bdtrainlive.onrender.com/api/all_live_trains"
]

PING_INTERVAL_SECONDS = 300  # 5 minutes (Render sleep timeout is 15 minutes)

def ping_endpoint(url, timeout=45):
    ts = datetime.datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")
    start_t = time.time()
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "BD-Rail-KeepAlive-Sentinel/2.0 (Windows; Anti-Sleep Daemon)"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            elapsed = round(time.time() - start_t, 2)
            code = resp.getcode()
            return True, code, elapsed, ""
    except urllib.error.HTTPError as e:
        elapsed = round(time.time() - start_t, 2)
        return False, e.code, elapsed, str(e)
    except Exception as e:
        elapsed = round(time.time() - start_t, 2)
        return False, 0, elapsed, str(e)

def run_sentinel():
    print("=" * 65)
    print("   🚆 BD RAIL ASSISTANT - 24/7 RENDER KEEP-ALIVE SENTINEL")
    print("   Pings bdtrainlive.onrender.com every 5 minutes (Zero Cold Starts)")
    print("=" * 65)

    cycle = 0
    while True:
        cycle += 1
        ts = datetime.datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")
        print(f"\n[Cycle #{cycle}] {ts} Pinging Render Web Service...")

        for url in RENDER_URLS:
            ok, code, elapsed, err = ping_endpoint(url)
            endpoint_name = url.replace("https://bdtrainlive.onrender.com", "") or "/"
            if ok:
                print(f"  ✅ [SUCCESS] {endpoint_name:<22} | Status: {code} | Latency: {elapsed}s (Render Awake)")
            else:
                print(f"  ⚠️ [NOTICE]  {endpoint_name:<22} | Status: {code} | Latency: {elapsed}s | Error: {err}")

        # Sleep for next interval
        time.sleep(PING_INTERVAL_SECONDS)

if __name__ == "__main__":
    run_sentinel()
