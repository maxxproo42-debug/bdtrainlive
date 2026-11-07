"""
1-Click Automated Bangladesh Railway eticket Sync Engine
Opens a real Chrome window via undetected_chromedriver to https://eticket.railway.gov.bd/login.
Allows the human user to sign in naturally (handling Turnstile captcha).
Once signed in, automatically captures localStorage('token') & ('user') and saves to eticket_token.json.
Also syncs directly with the running BD Rail Assistant server!
"""

import os
import sys
import time
import json
import urllib.request

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_FILE = os.path.join(CURRENT_DIR, "eticket_token.json")

def sync_with_local_server(token, user):
    """Pushes the new token to local BD Rail Assistant server if running"""
    try:
        url = "http://localhost:5055/api/eticket_token"
        payload = json.dumps({"token": token, "user": user}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print("  ✅ লোকাল সার্ভার (localhost:5055)-এ টোকেন সফলভাবে সিঙ্ক হয়েছে!")
    except Exception:
        print("  ℹ️ লোকাল সার্ভার অফলাইন আছে, টোকেন ফাইল eticket_token.json এ সংরক্ষিত রয়েছে।")

def run_auto_sync():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    print("=" * 70)
    print("   🚆 বাংলাদেশ রেলওয়ে eticket অটো-সিঙ্ক সহকারী (Auto-Sync Tool)")
    print("   100% Official Live Ticket Scanner Token Sync")
    print("=" * 70)
    print("\n[১/৩] ক্রোম ব্রাউজার চালু হচ্ছে...")

    try:
        import undetected_chromedriver as uc
    except ImportError:
        print("❌ undetected_chromedriver পাওয়া যায়নি। দয়া করে requirements ইনস্টল করুন।")
        return False

    options = uc.ChromeOptions()
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--start-maximized")

    try:
        driver = uc.Chrome(options=options)
    except Exception as e:
        try:
            # Fallback with explicit version if auto-detection misses
            driver = uc.Chrome(options=options, version_main=155)
        except Exception:
            try:
                driver = uc.Chrome(options=options, version_main=154)
            except Exception as e2:
                print(f"❌ ক্রোম চালু করতে ত্রুটি: {e2}")
                return False

    print("  ✅ ক্রোম সফলভাবে চালু হয়েছে।")
    print("\n[২/৩] eticket.railway.gov.bd/login ওপেন করা হচ্ছে...")
    driver.get("https://eticket.railway.gov.bd/login")

    print("\n" + "*" * 70)
    print("👉 ব্রাউজার উইন্ডোটিতে আপনার মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে লগইন সম্পন্ন করুন।")
    print("   (লগইন সফল হওয়ামাত্রই সফটওয়্যারটি স্বয়ংক্রিয়ভাবে লাইভ সেশন ক্যাপচার করে নিবে)")
    print("*" * 70 + "\n")

    token = None
    user_data = {}
    wait_cycles = 0
    max_wait_seconds = 300  # 5 minutes

    while wait_cycles < (max_wait_seconds / 2):
        time.sleep(2)
        wait_cycles += 1
        try:
            # Check for token in localStorage
            t = driver.execute_script("return localStorage.getItem('token');")
            if t and len(t.strip()) > 30 and t.startswith("eyJ"):
                token = t.strip()
                try:
                    u_str = driver.execute_script("return localStorage.getItem('user');")
                    if u_str:
                        user_data = json.loads(u_str)
                except Exception:
                    pass
                break
        except Exception:
            pass

    if token:
        print("\n" + "=" * 70)
        print("🎉 অভিনন্দন! বাংলাদেশ রেলওয়ে লাইভ অথেনটিকেশন টোকেন ক্যাপচার হয়েছে!")
        print("=" * 70)
        
        mobile = user_data.get("mobile_number") or user_data.get("phone_number") or "Unknown"
        name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
        print(f"  👤 ব্যবহারকারী : {name or 'রেলওয়ে ইউজার'}")
        print(f"  📱 মোবাইল     : {mobile}")
        print(f"  🔑 টোকেন সাইজ : {len(token)} characters (JWT)")

        # Save to local file
        saved_payload = {
            "token": token,
            "user": user_data,
            "updated_at": time.strftime("%Y-%m-%d %I:%M:%S %p")
        }
        with open(TOKEN_FILE, "w", encoding="utf-8") as f:
            json.dump(saved_payload, f, indent=2, ensure_ascii=False)
        print(f"  💾 ফাইল সংরক্ষিত: eticket_token.json")

        # Sync with running local server
        sync_with_local_server(token, user_data)

        # Print instructions for Render
        print("\n[রেন্ডার ক্লাউডের জন্য টিপস]")
        print("আপনার লাইভ সাইট https://bdtrainlive.onrender.com-এ ২৪/৭ এই সেশন চালু রাখতে:")
        print(f"Render Dashboard -> Environment Variables -> ETICKET_AUTH_TOKEN = {token[:25]}... (পুরো টোকেনটি)")

        # Close browser safely
        print("\n[৩/৩] ব্রাউজার নিরাপদে বন্ধ করা হচ্ছে...")
        try:
            driver.quit()
        except Exception:
            pass

        print("\n✅ সমস্ত প্রক্রিয়া সফলভাবে সম্পন্ন হয়েছে! এখন স্টেশনভিত্তিক লাইভ টিকিট স্ক্যানার")
        print("   বাংলাদেশ রেলওয়ের নিজস্ব ডেটাবেজ থেকে প্রতিটি স্টেশনের আসল লাইভ সিট দেখাবে।\n")
        return True
    else:
        print("\n⚠️ নির্ধারিত সময়ের মধ্যে লগইন সনাক্ত করা যায়নি বা ব্রাউজার বন্ধ করা হয়েছে।")
        try:
            driver.quit()
        except Exception:
            pass
        return False

if __name__ == "__main__":
    run_auto_sync()

