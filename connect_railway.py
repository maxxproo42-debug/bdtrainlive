"""
Bangladesh Railway Official Account Sync Tool
Saves access token to eticket_token.json so BD Rail Assistant can fetch 100% official live data
"""
import os
import sys
import json
import getpass

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from shohoz_live_client import login_to_shohoz, load_saved_token

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    print("=" * 65)
    print("🚆 বাংলাদেশ রেলওয়ে eticket অ্যাকাউন্ট কানেকশন টুল")
    print("=" * 65)
    
    current_token, current_user = load_saved_token()
    if current_token:
        print(f"🟢 ইতিমধ্যে একটি অ্যাকাউন্ট সংযুক্ত রয়েছে:")
        print(f"   মোবাইল: {current_user.get('mobile_number', 'সংরক্ষিত')}")
        print(f"   নাম: {current_user.get('first_name', '')} {current_user.get('last_name', '')}")
        print("-" * 65)
        ans = input("আপনি কি নতুন অ্যাকাউন্টে লগইন করতে চান? (y/n): ").strip().lower()
        if ans != 'y':
            print("সংযোগ অপরিবর্তিত রাখা হয়েছে।")
            return

    print("আপনার বাংলাদেশ রেলওয়ে (eticket.railway.gov.bd) অ্যাকাউন্টের")
    print("মোবাইল নম্বর এবং পাসওয়ার্ড লিখুন:")
    print("(এটি শুধুমাত্র আপনার স্থানীয় পিসিতে টোকেন সংরক্ষণের জন্য ব্যবহৃত হবে)\n")

    mobile = input("মোবাইল নম্বর (যেমন 017xxxxxxxx): ").strip()
    if not mobile:
        print("❌ মোবাইল নম্বর দেওয়া হয়নি।")
        return

    password = getpass.getpass("পাসওয়ার্ড: ").strip()
    if not password:
        print("❌ পাসওয়ার্ড দেওয়া হয়নি।")
        return

    print("\n🔍 বাংলাদেশ রেলওয়ে অফিসিয়াল সার্ভার (railspaapi.shohoz.com)-এ লগইন হচ্ছে...")
    res = login_to_shohoz(mobile, password)

    if res.get("status") == "success":
        user = res.get("user", {})
        print("=" * 65)
        print("🎉 অভিনন্দন! লগইন সফলভাবে সম্পন্ন হয়েছে!")
        print(f"ব্যবহারকারী: {user.get('first_name', '')} {user.get('last_name', '')}")
        print(f"মোবাইল: {user.get('mobile_number', mobile)}")
        print("অফিসিয়াল JWT অ্যাক্সেস টোকেন eticket_token.json এ সংরক্ষিত হয়েছে।")
        print("এখন BD Rail Assistant সার্ভার প্রতিটি ট্রেনের ১০০% লাইভ আসল সিট ডেটা পাবে।")
        print("=" * 65)
    else:
        print("=" * 65)
        print(f"❌ লগইন ব্যর্থ হয়েছে: {res.get('message', 'অজানা ত্রুটি')}")
        print("অনুগ্রহ করে মোবাইল নম্বর এবং পাসওয়ার্ড সঠিকভাবে যাচাই করুন।")
        print("=" * 65)

if __name__ == "__main__":
    main()

