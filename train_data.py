"""
Comprehensive Bangladesh Railway Master Database
Includes:
1. Complete Master Stations list (East & West Zone) with verified GPS Coordinates.
2. Complete Intercity & Mail Trains fleet across all divisions.
3. Realistic fare structure, stoppage routes, and off-days.
"""

# Master Railway Stations of Bangladesh (Latitude, Longitude)
STATIONS_DICT = {
    # --- Dhaka Division ---
    "Dhaka": {"name_en": "Dhaka (Kamalapur)", "name_bn": "ঢাকা (কমলাপুর)", "division": "Dhaka", "lat": 23.7317, "lng": 90.4262},
    "Dhaka Airport": {"name_en": "Dhaka Airport (Biman Bandar)", "name_bn": "ঢাকা বিমানবন্দর", "division": "Dhaka", "lat": 23.8518, "lng": 90.4082},
    "Dhaka Cantonment": {"name_en": "Dhaka Cantonment", "name_bn": "ঢাকা ক্যান্টনমেন্ট", "division": "Dhaka", "lat": 23.8180, "lng": 90.4000},
    "Tejgaon": {"name_en": "Tejgaon", "name_bn": "তেজগাঁও", "division": "Dhaka", "lat": 23.7600, "lng": 90.3950},
    "Tongi": {"name_en": "Tongi Junction", "name_bn": "টঙ্গী জংশন", "division": "Dhaka", "lat": 23.8967, "lng": 90.4050},
    "Joydebpur": {"name_en": "Joydebpur Junction", "name_bn": "জয়দেবপুর জংশন (গাজীপুর)", "division": "Dhaka", "lat": 23.9981, "lng": 90.4201},
    "Mirzapur": {"name_en": "Mirzapur", "name_bn": "মির্জাপুর", "division": "Dhaka", "lat": 24.1030, "lng": 90.0980},
    "Tangail": {"name_en": "Tangail", "name_bn": "টাঙ্গাইল", "division": "Dhaka", "lat": 24.2513, "lng": 89.9167},
    "BB Setu East": {"name_en": "BB Setu East (Bangabandhu Bridge)", "name_bn": "বঙ্গবন্ধু সেতু পূর্ব", "division": "Dhaka", "lat": 24.3896, "lng": 89.8198},
    "Bhairab Bazar": {"name_en": "Bhairab Bazar Junction", "name_bn": "ভৈরব বাজার জংশন", "division": "Dhaka", "lat": 24.0489, "lng": 90.9856},
    "Kishoreganj": {"name_en": "Kishoreganj", "name_bn": "কিশোরগঞ্জ", "division": "Dhaka", "lat": 24.4333, "lng": 90.7833},
    "Narsingdi": {"name_en": "Narsingdi", "name_bn": "নরসিংদী", "division": "Dhaka", "lat": 23.9230, "lng": 90.7180},
    "Methikanda": {"name_en": "Methikanda (Bhairab)", "name_bn": "মেথীকান্দা (রায়পুরা)", "division": "Dhaka", "lat": 24.0020, "lng": 90.8750},

    # --- Rangpur Division (North Bengal) ---
    "Parbatipur": {"name_en": "Parbatipur Junction", "name_bn": "পার্বতীপুর জংশন (প্রধান হাব)", "division": "Rangpur", "lat": 25.6536, "lng": 88.9155},
    "Chirirbandar": {"name_en": "Chirirbandar", "name_bn": "চিরিরবন্দর", "division": "Rangpur", "lat": 25.6558, "lng": 88.7758},
    "Dinajpur": {"name_en": "Dinajpur", "name_bn": "দিনাজপুর", "division": "Rangpur", "lat": 25.6279, "lng": 88.6332},
    "Setabganj": {"name_en": "Setabganj", "name_bn": "সেতাবগঞ্জ (বোচাগঞ্জ)", "division": "Rangpur", "lat": 25.8667, "lng": 88.4667},
    "Pirganj": {"name_en": "Pirganj", "name_bn": "পীরগঞ্জ (ঠাকুরগাঁও)", "division": "Rangpur", "lat": 25.8500, "lng": 88.3667},
    "Shibganj": {"name_en": "Shibganj", "name_bn": "শিবগঞ্জ (ঠাকুরগাঁও)", "division": "Rangpur", "lat": 25.9320, "lng": 88.4110},
    "Thakurgaon Road": {"name_en": "Thakurgaon Road", "name_bn": "ঠাকুরগাঁও রোড", "division": "Rangpur", "lat": 26.0333, "lng": 88.4667},
    "Ruhia": {"name_en": "Ruhia", "name_bn": "রুহিয়া", "division": "Rangpur", "lat": 26.1385, "lng": 88.4815},
    "Kismat": {"name_en": "Kismat", "name_bn": "কিসমত", "division": "Rangpur", "lat": 26.2210, "lng": 88.5140},
    "Panchagarh": {"name_en": "Bir Muktijoddha Sirajul Islam (Panchagarh)", "name_bn": "বীর মুক্তিযোদ্ধা সিরাজুল ইসলাম (পঞ্চগড়)", "division": "Rangpur", "lat": 26.3333, "lng": 88.5500},
    "Saidpur": {"name_en": "Saidpur", "name_bn": "সৈয়দপুর (রেলওয়ে কারখানা)", "division": "Rangpur", "lat": 25.7910, "lng": 88.8880},
    "Nilphamari": {"name_en": "Nilphamari", "name_bn": "নীলফামারী", "division": "Rangpur", "lat": 25.9527, "lng": 88.8352},
    "Domar": {"name_en": "Domar", "name_bn": "ডোমার", "division": "Rangpur", "lat": 26.1018, "lng": 88.8198},
    "Chilahati": {"name_en": "Chilahati Junction", "name_bn": "চিলাহাটি জংশন (সীমান্ত হাব)", "division": "Rangpur", "lat": 26.2431, "lng": 88.7963},
    "Rangpur": {"name_en": "Rangpur", "name_bn": "রংপুর", "division": "Rangpur", "lat": 25.7439, "lng": 89.2752},
    "Pirgachha": {"name_en": "Pirgachha", "name_bn": "পীরগাছা", "division": "Rangpur", "lat": 25.5800, "lng": 89.4000},
    "Kurigram": {"name_en": "Kurigram", "name_bn": "কুড়িগ্রাম", "division": "Rangpur", "lat": 25.8103, "lng": 89.6500},
    "Lalmonirhat": {"name_en": "Lalmonirhat Junction", "name_bn": "লালমনিরহাট জংশন", "division": "Rangpur", "lat": 25.9167, "lng": 89.4500},
    "Burimari": {"name_en": "Burimari Land Port", "name_bn": "বুড়িমারী স্থলবন্দর", "division": "Rangpur", "lat": 26.3167, "lng": 88.9833},
    "Gaibandha": {"name_en": "Gaibandha", "name_bn": "গাইবান্ধা", "division": "Rangpur", "lat": 25.3288, "lng": 89.5406},
    "Bonarpara": {"name_en": "Bonarpara Junction", "name_bn": "বোনারপাড়া জংশন", "division": "Rangpur", "lat": 25.1333, "lng": 89.4833},
    "Phulbari": {"name_en": "Phulbari", "name_bn": "ফুলবাড়ী (দিনাজপুর)", "division": "Rangpur", "lat": 25.4947, "lng": 88.9689},
    "Fulbari": {"name_en": "Fulbari", "name_bn": "ফুলবাড়ী (দিনাজপুর)", "division": "Rangpur", "lat": 25.4947, "lng": 88.9689},
    "Birampur": {"name_en": "Birampur", "name_bn": "বিরামপুর", "division": "Rangpur", "lat": 25.3979, "lng": 88.9940},
    "Hili": {"name_en": "Hili", "name_bn": "হিলি (সীমান্ত জংশন)", "division": "Rangpur", "lat": 25.2776, "lng": 89.0068},
    "Panchbibi": {"name_en": "Panchbibi", "name_bn": "পাঁচবিবি", "division": "Rajshahi", "lat": 25.1891, "lng": 89.0213},
    "Akkelpur": {"name_en": "Akkelpur", "name_bn": "আক্কেলপুর", "division": "Rajshahi", "lat": 24.9650, "lng": 89.0158},
    "Tilakpur": {"name_en": "Tilakpur", "name_bn": "তিলকপুর", "division": "Rajshahi", "lat": 24.8833, "lng": 88.9800},

    # --- Rajshahi Division ---
    "Santahar": {"name_en": "Santahar Junction", "name_bn": "সান্তাহার জংশন (বগুড়া-নওগাঁ)", "division": "Rajshahi", "lat": 24.8071, "lng": 88.9861},
    "Ahsanganj": {"name_en": "Ahsanganj", "name_bn": "আহসানগঞ্জ (আত্রাই)", "division": "Rajshahi", "lat": 24.6225, "lng": 88.9792},
    "Madhnagar": {"name_en": "Madhnagar", "name_bn": "মাধনগর (নাটোর)", "division": "Rajshahi", "lat": 24.5218, "lng": 88.9735},
    "Joypurhat": {"name_en": "Joypurhat", "name_bn": "জয়পুরহাট", "division": "Rajshahi", "lat": 25.0990, "lng": 89.0260},
    "Bogura": {"name_en": "Bogura", "name_bn": "বগুড়া", "division": "Rajshahi", "lat": 24.8465, "lng": 89.3730},
    "Rajshahi": {"name_en": "Rajshahi", "name_bn": "রাজশাহী", "division": "Rajshahi", "lat": 24.3745, "lng": 88.6042},
    "Rajshahi Court": {"name_en": "Rajshahi Court", "name_bn": "রাজশাহী কোর্ট", "division": "Rajshahi", "lat": 24.3600, "lng": 88.5700},
    "Natore": {"name_en": "Natore", "name_bn": "নাটোর", "division": "Rajshahi", "lat": 24.4108, "lng": 88.9666},
    "Abdulpur": {"name_en": "Abdulpur Junction", "name_bn": "আব্দুলপুর জংশন", "division": "Rajshahi", "lat": 24.3333, "lng": 88.9833},
    "Ishwardi": {"name_en": "Ishwardi Junction", "name_bn": "ঈশ্বরদী জংশন (পাকশী হাব)", "division": "Rajshahi", "lat": 24.1283, "lng": 89.0683},
    "Ishwardi Bypass": {"name_en": "Ishwardi Bypass", "name_bn": "ঈশ্বরদী বাইপাস", "division": "Rajshahi", "lat": 24.1551, "lng": 89.0575},
    "Shahid M Monsur Ali": {"name_en": "Shahid M Monsur Ali", "name_bn": "শহীদ এম মনসুর আলী (সিরাজগঞ্জ)", "division": "Rajshahi", "lat": 24.3973, "lng": 89.6901},
    "BB Setu West": {"name_en": "BB Setu West", "name_bn": "বঙ্গবন্ধু সেতু পশ্চিম", "division": "Rajshahi", "lat": 24.3986, "lng": 89.7577},
    "Ullapara": {"name_en": "Ullapara", "name_bn": "উল্লাপাড়া", "division": "Rajshahi", "lat": 24.2903, "lng": 89.5708},
    "Boroigram": {"name_en": "Boroigram", "name_bn": "বড়াইগ্রাম", "division": "Rajshahi", "lat": 24.3000, "lng": 89.1667},
    "Sirajganj": {"name_en": "Sirajganj Bazar", "name_bn": "সিরাজগঞ্জ বাজার", "division": "Rajshahi", "lat": 24.4534, "lng": 89.7081},
    "Chapainawabganj": {"name_en": "Chapainawabganj", "name_bn": "চাঁপাইনবাবগঞ্জ", "division": "Rajshahi", "lat": 24.5900, "lng": 88.2700},

    # --- Chittagong Division ---
    "Chittagong": {"name_en": "Chittagong (Battali)", "name_bn": "চট্টগ্রাম (বটতলী)", "division": "Chittagong", "lat": 22.3353, "lng": 91.8214},
    "Feni": {"name_en": "Feni Junction", "name_bn": "ফেনী জংশন", "division": "Chittagong", "lat": 23.0159, "lng": 91.3976},
    "Cumilla": {"name_en": "Cumilla", "name_bn": "কুমিল্লা", "division": "Chittagong", "lat": 23.4607, "lng": 91.1809},
    "Laksam": {"name_en": "Laksam Junction", "name_bn": "লাকসাম জংশন", "division": "Chittagong", "lat": 23.2389, "lng": 91.1250},
    "Brahmanbaria": {"name_en": "Brahmanbaria", "name_bn": "ব্রাহ্মণবাড়িয়া", "division": "Chittagong", "lat": 23.9608, "lng": 91.1115},
    "Akhaura": {"name_en": "Akhaura Junction", "name_bn": "আখাউড়া জংশন", "division": "Chittagong", "lat": 23.8690, "lng": 91.2139},
    "Chandpur": {"name_en": "Chandpur", "name_bn": "চাঁদপুর", "division": "Chittagong", "lat": 23.2300, "lng": 90.6500},
    "Noakhali": {"name_en": "Noakhali (Maijdee)", "name_bn": "নোয়াখালী (মাইজদী)", "division": "Chittagong", "lat": 22.8700, "lng": 91.1000},
    "Sitakunda": {"name_en": "Sitakunda", "name_bn": "সীতাকুণ্ড", "division": "Chittagong", "lat": 22.6167, "lng": 91.6667},
    "Cox's Bazar": {"name_en": "Cox's Bazar Iconic Station", "name_bn": "কক্সবাজার আইকনিক স্টেশন", "division": "Chittagong", "lat": 21.4368, "lng": 91.9782},
    "Dohazari": {"name_en": "Dohazari", "name_bn": "দোহাজারী", "division": "Chittagong", "lat": 22.1600, "lng": 92.0700},

    # --- Sylhet Division ---
    "Sylhet": {"name_en": "Sylhet", "name_bn": "সিলেট", "division": "Sylhet", "lat": 24.8864, "lng": 91.8695},
    "Maijgaon": {"name_en": "Maijgaon", "name_bn": "মাইজগাঁও", "division": "Sylhet", "lat": 24.7500, "lng": 91.9300},
    "Kulaura": {"name_en": "Kulaura Junction", "name_bn": "কুলাউড়া জংশন", "division": "Sylhet", "lat": 24.5167, "lng": 92.0333},
    "Bhanugach": {"name_en": "Bhanugach", "name_bn": "ভানুগাছ (কমলগঞ্জ)", "division": "Sylhet", "lat": 24.3600, "lng": 91.8500},
    "Sreemangal": {"name_en": "Sreemangal", "name_bn": "শ্রীমঙ্গল (চায়ের দেশ)", "division": "Sylhet", "lat": 24.3065, "lng": 91.7296},
    "Shaistaganj": {"name_en": "Shaistaganj Junction", "name_bn": "শায়েস্তাগঞ্জ জংশন (হবিগঞ্জ)", "division": "Sylhet", "lat": 24.2667, "lng": 91.4833},
    "Shamshernagar": {"name_en": "Shamshernagar", "name_bn": "শমশেরনগর", "division": "Sylhet", "lat": 24.4000, "lng": 91.9167},
    "Azampur": {"name_en": "Azampur", "name_bn": "আজমপুর", "division": "Sylhet", "lat": 23.9500, "lng": 91.1800},

    # --- Khulna Division ---
    "Khulna": {"name_en": "Khulna", "name_bn": "খুলনা", "division": "Khulna", "lat": 22.8157, "lng": 89.5644},
    "Daulatpur": {"name_en": "Daulatpur", "name_bn": "দৌলতপুর", "division": "Khulna", "lat": 22.8800, "lng": 89.5200},
    "Noapara": {"name_en": "Noapara", "name_bn": "নওয়াপাড়া (অভয়নগর)", "division": "Khulna", "lat": 23.0100, "lng": 89.4300},
    "Jessore": {"name_en": "Jessore Junction", "name_bn": "যশোর জংশন", "division": "Khulna", "lat": 23.1667, "lng": 89.2167},
    "Jhikargachha": {"name_en": "Jhikargachha", "name_bn": "ঝিকরগাছা", "division": "Khulna", "lat": 23.1000, "lng": 89.0800},
    "Benapole": {"name_en": "Benapole Land Port", "name_bn": "বেনাপোল স্থলবন্দর", "division": "Khulna", "lat": 23.0333, "lng": 88.8950},
    "Kotchandpur": {"name_en": "Kotchandpur", "name_bn": "কোটচাঁদপুর", "division": "Khulna", "lat": 23.4000, "lng": 89.0100},
    "Chuadanga": {"name_en": "Chuadanga", "name_bn": "চুয়াডাঙ্গা", "division": "Khulna", "lat": 23.6400, "lng": 88.8500},
    "Poradah": {"name_en": "Poradah Junction", "name_bn": "পোড়াদহ জংশন", "division": "Khulna", "lat": 23.8500, "lng": 89.0500},
    "Kushtia": {"name_en": "Kushtia Court", "name_bn": "কুষ্টিয়া কোর্ট", "division": "Khulna", "lat": 23.9000, "lng": 89.1200},

    # --- Padma Bridge & South-Central Corridor ---
    "Bhanga": {"name_en": "Bhanga Junction (Padma Bridge)", "name_bn": "ভাঙ্গা জংশন (পদ্মা সেতু হাব)", "division": "Dhaka", "lat": 23.3850, "lng": 89.9800},
    "Faridpur": {"name_en": "Faridpur", "name_bn": "ফরিদপুর", "division": "Dhaka", "lat": 23.6071, "lng": 89.8429},
    "Gopalganj": {"name_en": "Gopalganj", "name_bn": "গোপালগঞ্জ", "division": "Dhaka", "lat": 23.0050, "lng": 89.8260},
    "Gobra": {"name_en": "Gobra", "name_bn": "গোবরা (গোপালগঞ্জ)", "division": "Dhaka", "lat": 23.0045, "lng": 89.8240},
    "Kashiani": {"name_en": "Kashiani Junction", "name_bn": "কাশিয়ানী জংশন", "division": "Dhaka", "lat": 23.2100, "lng": 89.7500},
    "Narail": {"name_en": "Narail", "name_bn": "নড়াইল", "division": "Khulna", "lat": 23.1700, "lng": 89.5000},

    # --- Mymensingh Division ---
    "Mymensingh": {"name_en": "Mymensingh Junction", "name_bn": "ময়মনসিংহ জংশন", "division": "Mymensingh", "lat": 24.7564, "lng": 90.4065},
    "Gafargaon": {"name_en": "Gafargaon", "name_bn": "গফরগাঁও", "division": "Mymensingh", "lat": 24.4333, "lng": 90.5500},
    "Jamalpur": {"name_en": "Jamalpur Town", "name_bn": "জামালপুর টাউন", "division": "Mymensingh", "lat": 24.9196, "lng": 89.9481},
    "Dewanganj": {"name_en": "Dewanganj Bazar", "name_bn": "দেওয়ানগঞ্জ বাজার", "division": "Mymensingh", "lat": 25.1430, "lng": 89.7710},
    "Piyarpur": {"name_en": "Piyarpur", "name_bn": "পিয়ারপুর", "division": "Mymensingh", "lat": 24.8000, "lng": 90.2500},
    "Netrokona": {"name_en": "Netrokona", "name_bn": "নেত্রকোণা", "division": "Mymensingh", "lat": 24.8833, "lng": 90.7333},
    "Mohanganj": {"name_en": "Mohanganj (Haor)", "name_bn": "মোহনগঞ্জ (হাওর হাব)", "division": "Mymensingh", "lat": 24.8600, "lng": 90.9600},
    "Tarakandi": {"name_en": "Tarakandi", "name_bn": "তারাকান্দি", "division": "Mymensingh", "lat": 24.7800, "lng": 89.8700},
}

# Stations list sorted by Division and Name for fast searching
STATIONS = [
    {
        "code": k.replace(" ", "_").upper()[:6],
        "name_en": k,
        "name_bn": v["name_bn"],
        "division": v.get("division", "General")
    }
    for k, v in sorted(STATIONS_DICT.items(), key=lambda x: (x[1].get("division", ""), x[0]))
]

# Complete Fleet of Intercity Trains (Up and Down Pairs)
TRAINS = [
    # -------------------------------------------------------------
    # Corridor 1: Dhaka <-> Panchagarh / Dinajpur (North Bengal)
    # -------------------------------------------------------------
    {
        "number": 705,
        "name_en": "Ekota Express",
        "name_bn": "একতা এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Panchagarh",
        "departure": "10:15 AM",
        "arrival": "08:10 PM",
        "dep_time_24": "10:15",
        "arr_time_24": "20:10",
        "duration": "9h 55m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 485, "SNIGDHA": 932, "AC_S": 1116, "AC_B": 1668},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Tangail", "BB Setu East", "Shahid M Monsur Ali", "Santahar", "Joypurhat", "Parbatipur", "Chirirbandar", "Dinajpur", "Setabganj", "Pirganj", "Thakurgaon Road", "Panchagarh"],
        "station_timings": {
            "Dhaka": {"arr": "-", "dep": "10:15 AM"},
            "Dhaka Airport": {"arr": "10:38 AM", "dep": "10:43 AM"},
            "Joydebpur": {"arr": "11:08 AM", "dep": "11:11 AM"},
            "Tangail": {"arr": "12:12 PM", "dep": "12:15 PM"},
            "BB Setu East": {"arr": "12:38 PM", "dep": "12:41 PM"},
            "Shahid M Monsur Ali": {"arr": "01:02 PM", "dep": "01:05 PM"},
            "Santahar": {"arr": "03:40 PM", "dep": "03:50 PM"},
            "Joypurhat": {"arr": "04:25 PM", "dep": "04:28 PM"},
            "Parbatipur": {"arr": "05:35 PM", "dep": "05:45 PM"},
            "Chirirbandar": {"arr": "06:02 PM", "dep": "06:05 PM"},
            "Dinajpur": {"arr": "06:22 PM", "dep": "06:30 PM"},
            "Setabganj": {"arr": "06:55 PM", "dep": "06:58 PM"},
            "Pirganj": {"arr": "07:12 PM", "dep": "07:15 PM"},
            "Thakurgaon Road": {"arr": "07:35 PM", "dep": "07:40 PM"},
            "Panchagarh": {"arr": "08:10 PM", "dep": "-"}
        },
        "ttms_code": "705"
    },
    {
        "number": 706,
        "name_en": "Ekota Express",
        "name_bn": "একতা এক্সপ্রেস",
        "origin": "Panchagarh",
        "destination": "Dhaka",
        "departure": "09:00 PM",
        "arrival": "06:50 AM",
        "dep_time_24": "21:00",
        "arr_time_24": "06:50",
        "duration": "9h 50m",
        "off_day": "Monday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 485, "SNIGDHA": 932, "AC_S": 1116, "AC_B": 1668},
        "stoppages": ["Panchagarh", "Thakurgaon Road", "Pirganj", "Setabganj", "Dinajpur", "Chirirbandar", "Parbatipur", "Joypurhat", "Santahar", "Shahid M Monsur Ali", "Tangail", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "station_timings": {
            "Panchagarh": {"arr": "-", "dep": "09:00 PM"},
            "Thakurgaon Road": {"arr": "09:30 PM", "dep": "09:35 PM"},
            "Pirganj": {"arr": "09:55 PM", "dep": "09:58 PM"},
            "Setabganj": {"arr": "10:12 PM", "dep": "10:15 PM"},
            "Dinajpur": {"arr": "10:40 PM", "dep": "10:48 PM"},
            "Chirirbandar": {"arr": "11:05 PM", "dep": "11:08 PM"},
            "Parbatipur": {"arr": "11:25 PM", "dep": "11:35 PM"},
            "Joypurhat": {"arr": "12:35 AM", "dep": "12:38 AM"},
            "Santahar": {"arr": "01:15 AM", "dep": "01:25 AM"},
            "Shahid M Monsur Ali": {"arr": "03:55 AM", "dep": "03:58 AM"},
            "Tangail": {"arr": "04:40 AM", "dep": "04:43 AM"},
            "Joydebpur": {"arr": "05:40 AM", "dep": "05:43 AM"},
            "Dhaka Airport": {"arr": "06:15 AM", "dep": "06:20 AM"},
            "Dhaka": {"arr": "06:50 AM", "dep": "-"}
        },
        "ttms_code": "706"
    },
    {
        "number": 757,
        "name_en": "Drutojan Express",
        "name_bn": "দ্রুতযান এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Panchagarh",
        "departure": "08:00 PM",
        "arrival": "06:10 AM",
        "dep_time_24": "20:00",
        "arr_time_24": "06:10",
        "duration": "10h 10m",
        "off_day": "Wednesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 485, "SNIGDHA": 932, "AC_S": 1116, "AC_B": 1668},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Tangail", "BB Setu East", "Santahar", "Joypurhat", "Parbatipur", "Chirirbandar", "Dinajpur", "Setabganj", "Pirganj", "Thakurgaon Road", "Panchagarh"],
        "station_timings": {
            "Dhaka": {"arr": "-", "dep": "08:00 PM"},
            "Dhaka Airport": {"arr": "08:25 PM", "dep": "08:30 PM"},
            "Joydebpur": {"arr": "08:58 PM", "dep": "09:01 PM"},
            "Tangail": {"arr": "10:02 PM", "dep": "10:05 PM"},
            "BB Setu East": {"arr": "10:30 PM", "dep": "10:33 PM"},
            "Santahar": {"arr": "01:30 AM", "dep": "01:40 AM"},
            "Joypurhat": {"arr": "02:18 AM", "dep": "02:21 AM"},
            "Parbatipur": {"arr": "03:30 AM", "dep": "03:40 AM"},
            "Chirirbandar": {"arr": "03:58 AM", "dep": "04:01 AM"},
            "Dinajpur": {"arr": "04:18 AM", "dep": "04:26 AM"},
            "Setabganj": {"arr": "04:52 AM", "dep": "04:55 AM"},
            "Pirganj": {"arr": "05:10 AM", "dep": "05:13 AM"},
            "Thakurgaon Road": {"arr": "05:35 AM", "dep": "05:40 AM"},
            "Panchagarh": {"arr": "06:10 AM", "dep": "-"}
        },
        "ttms_code": "757"
    },
    {
        "number": 758,
        "name_en": "Drutojan Express",
        "name_bn": "দ্রুতযান এক্সপ্রেস",
        "origin": "Panchagarh",
        "destination": "Dhaka",
        "departure": "08:10 AM",
        "arrival": "06:30 PM",
        "dep_time_24": "08:10",
        "arr_time_24": "18:30",
        "duration": "10h 20m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 485, "SNIGDHA": 932, "AC_S": 1116, "AC_B": 1668},
        "stoppages": ["Panchagarh", "Thakurgaon Road", "Pirganj", "Setabganj", "Dinajpur", "Chirirbandar", "Parbatipur", "Joypurhat", "Santahar", "Tangail", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "station_timings": {
            "Panchagarh": {"arr": "-", "dep": "08:10 AM"},
            "Thakurgaon Road": {"arr": "08:42 AM", "dep": "08:47 AM"},
            "Pirganj": {"arr": "09:08 AM", "dep": "09:11 AM"},
            "Setabganj": {"arr": "09:25 AM", "dep": "09:28 AM"},
            "Dinajpur": {"arr": "09:55 AM", "dep": "10:05 AM"},
            "Chirirbandar": {"arr": "10:22 AM", "dep": "10:25 AM"},
            "Parbatipur": {"arr": "10:45 AM", "dep": "10:55 AM"},
            "Joypurhat": {"arr": "11:58 AM", "dep": "12:01 PM"},
            "Santahar": {"arr": "12:40 PM", "dep": "12:50 PM"},
            "Tangail": {"arr": "04:15 PM", "dep": "04:18 PM"},
            "Joydebpur": {"arr": "05:15 PM", "dep": "05:18 PM"},
            "Dhaka Airport": {"arr": "05:52 PM", "dep": "05:57 PM"},
            "Dhaka": {"arr": "06:30 PM", "dep": "-"}
        },
        "ttms_code": "758"
    },
    {
        "number": 793,
        "name_en": "Panchagarh Express",
        "name_bn": "পঞ্চগড় এক্সপ্রেস (সেমি-ননস্টপ)",
        "origin": "Dhaka",
        "destination": "Panchagarh",
        "departure": "11:30 PM",
        "arrival": "09:30 AM",
        "dep_time_24": "23:30",
        "arr_time_24": "09:30",
        "duration": "10h 00m",
        "off_day": "None",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 550, "SNIGDHA": 1055, "AC_S": 1265, "AC_B": 1890},
        "stoppages": ["Dhaka", "Dhaka Airport", "Santahar", "Parbatipur", "Dinajpur", "Thakurgaon Road", "Panchagarh"],
        "station_timings": {
            "Dhaka": {"arr": "-", "dep": "11:30 PM"},
            "Dhaka Airport": {"arr": "11:55 PM", "dep": "12:00 AM"},
            "Santahar": {"arr": "04:30 AM", "dep": "04:40 AM"},
            "Parbatipur": {"arr": "06:20 AM", "dep": "06:30 AM"},
            "Dinajpur": {"arr": "07:05 AM", "dep": "07:15 AM"},
            "Thakurgaon Road": {"arr": "08:35 AM", "dep": "08:40 AM"},
            "Panchagarh": {"arr": "09:30 AM", "dep": "-"}
        },
        "ttms_code": "793"
    },
    {
        "number": 794,
        "name_en": "Panchagarh Express",
        "name_bn": "পঞ্চগড় এক্সপ্রেস (সেমি-ননস্টপ)",
        "origin": "Panchagarh",
        "destination": "Dhaka",
        "departure": "12:30 PM",
        "arrival": "10:35 PM",
        "dep_time_24": "12:30",
        "arr_time_24": "22:35",
        "duration": "10h 05m",
        "off_day": "None",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 550, "SNIGDHA": 1055, "AC_S": 1265, "AC_B": 1890},
        "stoppages": ["Panchagarh", "Thakurgaon Road", "Dinajpur", "Parbatipur", "Santahar", "Dhaka Airport", "Dhaka"],
        "station_timings": {
            "Panchagarh": {"arr": "-", "dep": "12:30 PM"},
            "Thakurgaon Road": {"arr": "01:20 PM", "dep": "01:25 PM"},
            "Dinajpur": {"arr": "02:45 PM", "dep": "02:55 PM"},
            "Parbatipur": {"arr": "03:30 PM", "dep": "03:40 PM"},
            "Santahar": {"arr": "05:25 PM", "dep": "05:35 PM"},
            "Dhaka Airport": {"arr": "09:55 PM", "dep": "10:00 PM"},
            "Dhaka": {"arr": "10:35 PM", "dep": "-"}
        },
        "ttms_code": "794"
    },

    # -------------------------------------------------------------
    # Corridor 2: Dhaka <-> Chilahati / Nilphamari
    # -------------------------------------------------------------
    {
        "number": 765,
        "name_en": "Nilsagor Express",
        "name_bn": "নীলসাগর এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Chilahati",
        "departure": "06:45 AM",
        "arrival": "04:30 PM",
        "dep_time_24": "06:45",
        "arr_time_24": "16:30",
        "duration": "9h 45m",
        "off_day": "Sunday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 490, "SNIGDHA": 940, "AC_S": 1130, "AC_B": 1690},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Tangail", "BB Setu East", "Santahar", "Akkelpur", "Joypurhat", "Panchbibi", "Birampur", "Phulbari", "Parbatipur", "Saidpur", "Nilphamari", "Domar", "Chilahati"],
        "station_timings": {
            "Dhaka": {"arr": "-", "dep": "06:45 AM"},
            "Dhaka Airport": {"arr": "07:10 AM", "dep": "07:15 AM"},
            "Joydebpur": {"arr": "07:45 AM", "dep": "07:48 AM"},
            "Tangail": {"arr": "08:45 AM", "dep": "08:48 AM"},
            "BB Setu East": {"arr": "09:12 AM", "dep": "09:15 AM"},
            "Santahar": {"arr": "12:35 PM", "dep": "12:45 PM"},
            "Akkelpur": {"arr": "01:08 PM", "dep": "01:11 PM"},
            "Joypurhat": {"arr": "01:25 PM", "dep": "01:28 PM"},
            "Panchbibi": {"arr": "01:38 PM", "dep": "01:40 PM"},
            "Birampur": {"arr": "02:00 PM", "dep": "02:03 PM"},
            "Phulbari": {"arr": "02:14 PM", "dep": "02:17 PM"},
            "Parbatipur": {"arr": "02:40 PM", "dep": "02:50 PM"},
            "Saidpur": {"arr": "03:05 PM", "dep": "03:10 PM"},
            "Nilphamari": {"arr": "03:28 PM", "dep": "03:31 PM"},
            "Domar": {"arr": "03:45 PM", "dep": "03:48 PM"},
            "Chilahati": {"arr": "04:30 PM", "dep": "-"}
        },
        "ttms_code": "765"
    },
    {
        "number": 766,
        "name_en": "Nilsagor Express",
        "name_bn": "নীলসাগর এক্সপ্রেস",
        "origin": "Chilahati",
        "destination": "Dhaka",
        "departure": "08:00 PM",
        "arrival": "05:30 AM",
        "dep_time_24": "20:00",
        "arr_time_24": "05:30",
        "duration": "9h 30m",
        "off_day": "Sunday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 490, "SNIGDHA": 940, "AC_S": 1130, "AC_B": 1690},
        "stoppages": ["Chilahati", "Domar", "Nilphamari", "Saidpur", "Parbatipur", "Phulbari", "Birampur", "Panchbibi", "Joypurhat", "Akkelpur", "Santahar", "Tangail", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "station_timings": {
            "Chilahati": {"arr": "-", "dep": "08:00 PM"},
            "Domar": {"arr": "08:14 PM", "dep": "08:17 PM"},
            "Nilphamari": {"arr": "08:32 PM", "dep": "08:35 PM"},
            "Saidpur": {"arr": "08:53 PM", "dep": "08:58 PM"},
            "Parbatipur": {"arr": "09:15 PM", "dep": "09:25 PM"},
            "Phulbari": {"arr": "09:42 PM", "dep": "09:45 PM"},
            "Birampur": {"arr": "09:56 PM", "dep": "09:59 PM"},
            "Panchbibi": {"arr": "10:18 PM", "dep": "10:21 PM"},
            "Joypurhat": {"arr": "10:30 PM", "dep": "10:33 PM"},
            "Akkelpur": {"arr": "10:48 PM", "dep": "10:51 PM"},
            "Santahar": {"arr": "11:20 PM", "dep": "11:30 PM"},
            "Tangail": {"arr": "03:20 AM", "dep": "03:23 AM"},
            "Joydebpur": {"arr": "04:20 AM", "dep": "04:23 AM"},
            "Dhaka Airport": {"arr": "04:55 AM", "dep": "05:00 AM"},
            "Dhaka": {"arr": "05:30 AM", "dep": "-"}
        },
        "ttms_code": "766"
    },
    {
        "number": 799,
        "name_en": "Chilahati Express",
        "name_bn": "চিলাহাটি এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Chilahati",
        "departure": "05:00 PM",
        "arrival": "02:45 AM",
        "dep_time_24": "17:00",
        "arr_time_24": "02:45",
        "duration": "9h 45m",
        "off_day": "Saturday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 490, "SNIGDHA": 940, "AC_S": 1130, "AC_B": 1690},
        "stoppages": [
            "Dhaka", "Dhaka Airport", "Joydebpur", "Tangail", "BB Setu East", 
            "Ullapara", "Chatmohar", "Ishwardi Bypass", "Natore", "Ahsanganj", "Raninagar", 
            "Santahar", "Joypurhat", "Parbatipur", "Saidpur", "Nilphamari", "Domar", "Chilahati"
        ],
        "station_timings": {
            "Dhaka": {"arr": "-", "dep": "05:00 PM"},
            "Dhaka Airport": {"arr": "05:25 PM", "dep": "05:30 PM"},
            "Joydebpur": {"arr": "05:55 PM", "dep": "05:58 PM"},
            "Tangail": {"arr": "06:48 PM", "dep": "06:51 PM"},
            "BB Setu East": {"arr": "07:15 PM", "dep": "07:20 PM"},
            "Ullapara": {"arr": "08:02 PM", "dep": "08:05 PM"},
            "Chatmohar": {"arr": "08:30 PM", "dep": "08:33 PM"},
            "Ishwardi Bypass": {"arr": "09:00 PM", "dep": "09:05 PM"},
            "Natore": {"arr": "09:47 PM", "dep": "09:50 PM"},
            "Ahsanganj": {"arr": "10:20 PM", "dep": "10:23 PM"},
            "Raninagar": {"arr": "10:35 PM", "dep": "10:37 PM"},
            "Santahar": {"arr": "10:50 PM", "dep": "11:00 PM"},
            "Joypurhat": {"arr": "11:42 PM", "dep": "11:47 PM"},
            "Parbatipur": {"arr": "12:45 AM", "dep": "12:55 AM"},
            "Saidpur": {"arr": "01:18 AM", "dep": "01:23 AM"},
            "Nilphamari": {"arr": "01:45 AM", "dep": "01:48 AM"},
            "Domar": {"arr": "02:05 AM", "dep": "02:08 AM"},
            "Chilahati": {"arr": "02:45 AM", "dep": "-"}
        },
        "ttms_code": "799"
    },
    {
        "number": 800,
        "name_en": "Chilahati Express",
        "name_bn": "চিলাহাটি এক্সপ্রেস",
        "origin": "Chilahati",
        "destination": "Dhaka",
        "departure": "06:00 AM",
        "arrival": "03:10 PM",
        "dep_time_24": "06:00",
        "arr_time_24": "15:10",
        "duration": "9h 10m",
        "off_day": "Saturday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 490, "SNIGDHA": 940, "AC_S": 1130, "AC_B": 1690},
        "stoppages": [
            "Chilahati", "Domar", "Nilphamari", "Saidpur", "Parbatipur", "Joypurhat", 
            "Santahar", "Raninagar", "Ahsanganj", "Natore", "Ishwardi Bypass", 
            "Chatmohar", "Ullapara", "BB Setu East", "Tangail", "Joydebpur", "Dhaka Airport", "Dhaka"
        ],
        "station_timings": {
            "Chilahati": {"arr": "-", "dep": "06:00 AM"},
            "Domar": {"arr": "06:17 AM", "dep": "06:20 AM"},
            "Nilphamari": {"arr": "06:37 AM", "dep": "06:40 AM"},
            "Saidpur": {"arr": "07:02 AM", "dep": "07:07 AM"},
            "Parbatipur": {"arr": "07:30 AM", "dep": "07:40 AM"},
            "Joypurhat": {"arr": "08:38 AM", "dep": "08:43 AM"},
            "Santahar": {"arr": "09:25 AM", "dep": "09:35 AM"},
            "Raninagar": {"arr": "09:47 AM", "dep": "09:49 AM"},
            "Ahsanganj": {"arr": "10:02 AM", "dep": "10:05 AM"},
            "Natore": {"arr": "10:35 AM", "dep": "10:38 AM"},
            "Ishwardi Bypass": {"arr": "11:20 AM", "dep": "11:25 AM"},
            "Chatmohar": {"arr": "11:52 AM", "dep": "11:55 AM"},
            "Ullapara": {"arr": "12:20 PM", "dep": "12:23 PM"},
            "BB Setu East": {"arr": "01:05 PM", "dep": "01:10 PM"},
            "Tangail": {"arr": "01:33 PM", "dep": "01:36 PM"},
            "Joydebpur": {"arr": "02:22 PM", "dep": "02:25 PM"},
            "Dhaka Airport": {"arr": "02:47 PM", "dep": "02:50 PM"},
            "Dhaka": {"arr": "03:10 PM", "dep": "-"}
        },
        "ttms_code": "800"
    },

    # -------------------------------------------------------------
    # Corridor 3: Dhaka <-> Rangpur / Kurigram / Burimari
    # -------------------------------------------------------------
    {
        "number": 771,
        "name_en": "Rangpur Express",
        "name_bn": "রংপুর এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Rangpur",
        "departure": "09:10 AM",
        "arrival": "07:05 PM",
        "dep_time_24": "09:10",
        "arr_time_24": "19:05",
        "duration": "9h 55m",
        "off_day": "Sunday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 485, "SNIGDHA": 932, "AC_S": 1116, "AC_B": 1668},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Tangail", "BB Setu East", "Santahar", "Bogura", "Bonarpara", "Gaibandha", "Pirgachha", "Rangpur"],
        "ttms_code": "771"
    },
    {
        "number": 772,
        "name_en": "Rangpur Express",
        "name_bn": "রংপুর এক্সপ্রেস",
        "origin": "Rangpur",
        "destination": "Dhaka",
        "departure": "08:10 PM",
        "arrival": "06:10 AM",
        "dep_time_24": "20:10",
        "arr_time_24": "06:10",
        "duration": "10h 00m",
        "off_day": "Monday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 485, "SNIGDHA": 932, "AC_S": 1116, "AC_B": 1668},
        "stoppages": ["Rangpur", "Pirgachha", "Gaibandha", "Bonarpara", "Bogura", "Santahar", "BB Setu East", "Tangail", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "ttms_code": "772"
    },
    {
        "number": 797,
        "name_en": "Kurigram Express",
        "name_bn": "কুড়িগ্রাম এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Kurigram",
        "departure": "08:45 PM",
        "arrival": "06:20 AM",
        "dep_time_24": "20:45",
        "arr_time_24": "06:20",
        "duration": "9h 35m",
        "off_day": "Wednesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 510, "SNIGDHA": 978, "AC_S": 1173, "AC_B": 1750},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "BB Setu East", "Santahar", "Bogura", "Gaibandha", "Rangpur", "Kurigram"],
        "ttms_code": "797"
    },
    {
        "number": 798,
        "name_en": "Kurigram Express",
        "name_bn": "কুড়িগ্রাম এক্সপ্রেস",
        "origin": "Kurigram",
        "destination": "Dhaka",
        "departure": "07:15 AM",
        "arrival": "05:15 PM",
        "dep_time_24": "07:15",
        "arr_time_24": "17:15",
        "duration": "10h 00m",
        "off_day": "Wednesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 510, "SNIGDHA": 978, "AC_S": 1173, "AC_B": 1750},
        "stoppages": ["Kurigram", "Rangpur", "Gaibandha", "Bogura", "Santahar", "BB Setu East", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "ttms_code": "798"
    },
    {
        "number": 809,
        "name_en": "Burimari Express",
        "name_bn": "বুড়িমারী এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Burimari",
        "departure": "08:30 AM",
        "arrival": "06:40 PM",
        "dep_time_24": "08:30",
        "arr_time_24": "18:40",
        "duration": "10h 10m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 525, "SNIGDHA": 1010, "AC_S": 1210, "AC_B": 1810},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Tangail", "Santahar", "Bogura", "Gaibandha", "Lalmonirhat", "Burimari"],
        "ttms_code": "809"
    },
    {
        "number": 810,
        "name_en": "Burimari Express",
        "name_bn": "বুড়িমারী এক্সপ্রেস",
        "origin": "Burimari",
        "destination": "Dhaka",
        "departure": "08:00 PM",
        "arrival": "06:30 AM",
        "dep_time_24": "20:00",
        "arr_time_24": "06:30",
        "duration": "10h 30m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 525, "SNIGDHA": 1010, "AC_S": 1210, "AC_B": 1810},
        "stoppages": ["Burimari", "Lalmonirhat", "Gaibandha", "Bogura", "Santahar", "Tangail", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "ttms_code": "810"
    },

    # -------------------------------------------------------------
    # Corridor 4: Dhaka <-> Chittagong & Cox's Bazar
    # -------------------------------------------------------------
    {
        "number": 701,
        "name_en": "Suborno Express",
        "name_bn": "সুবর্ণ এক্সপ্রেস (নন-স্টপ)",
        "origin": "Chittagong",
        "destination": "Dhaka",
        "departure": "07:00 AM",
        "arrival": "12:15 PM",
        "dep_time_24": "07:00",
        "arr_time_24": "12:15",
        "duration": "5h 15m",
        "off_day": "Monday",
        "classes": ["SNIGDHA", "AC_S"],
        "fares": {"SNIGDHA": 780, "AC_S": 935},
        "stoppages": ["Chittagong", "Dhaka Airport", "Dhaka"],
        "ttms_code": "701"
    },
    {
        "number": 702,
        "name_en": "Suborno Express",
        "name_bn": "সুবর্ণ এক্সপ্রেস (নন-স্টপ)",
        "origin": "Dhaka",
        "destination": "Chittagong",
        "departure": "04:30 PM",
        "arrival": "09:50 PM",
        "dep_time_24": "16:30",
        "arr_time_24": "21:50",
        "duration": "5h 20m",
        "off_day": "Monday",
        "classes": ["SNIGDHA", "AC_S"],
        "fares": {"SNIGDHA": 780, "AC_S": 935},
        "stoppages": ["Dhaka", "Dhaka Airport", "Chittagong"],
        "ttms_code": "702"
    },
    {
        "number": 787,
        "name_en": "Sonar Bangla Express",
        "name_bn": "সোনার বাংলা এক্সপ্রেস (নন-স্টপ)",
        "origin": "Chittagong",
        "destination": "Dhaka",
        "departure": "05:00 PM",
        "arrival": "10:10 PM",
        "dep_time_24": "17:00",
        "arr_time_24": "22:10",
        "duration": "5h 10m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 405, "SNIGDHA": 777, "AC_S": 932, "AC_B": 1398},
        "stoppages": ["Chittagong", "Dhaka Airport", "Dhaka"],
        "ttms_code": "787"
    },
    {
        "number": 788,
        "name_en": "Sonar Bangla Express",
        "name_bn": "সোনার বাংলা এক্সপ্রেস (নন-স্টপ)",
        "origin": "Dhaka",
        "destination": "Chittagong",
        "departure": "07:00 AM",
        "arrival": "12:15 PM",
        "dep_time_24": "07:00",
        "arr_time_24": "12:15",
        "duration": "5h 15m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 405, "SNIGDHA": 777, "AC_S": 932, "AC_B": 1398},
        "stoppages": ["Dhaka", "Dhaka Airport", "Chittagong"],
        "ttms_code": "788"
    },
    {
        "number": 741,
        "name_en": "Turna Express",
        "name_bn": "তূর্ণা এক্সপ্রেস (নাইট এক্সপ্রেস)",
        "origin": "Chittagong",
        "destination": "Dhaka",
        "departure": "11:00 PM",
        "arrival": "05:15 AM",
        "dep_time_24": "23:00",
        "arr_time_24": "05:15",
        "duration": "6h 15m",
        "off_day": "None",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 345, "SNIGDHA": 656, "AC_S": 788, "AC_B": 1179},
        "stoppages": ["Chittagong", "Feni", "Cumilla", "Brahmanbaria", "Dhaka Airport", "Dhaka"],
        "ttms_code": "741"
    },
    {
        "number": 742,
        "name_en": "Turna Express",
        "name_bn": "তূর্ণা এক্সপ্রেস (নাইট এক্সপ্রেস)",
        "origin": "Dhaka",
        "destination": "Chittagong",
        "departure": "11:30 PM",
        "arrival": "06:00 AM",
        "dep_time_24": "23:30",
        "arr_time_24": "06:00",
        "duration": "6h 30m",
        "off_day": "None",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 345, "SNIGDHA": 656, "AC_S": 788, "AC_B": 1179},
        "stoppages": ["Dhaka", "Dhaka Airport", "Brahmanbaria", "Cumilla", "Feni", "Chittagong"],
        "ttms_code": "742"
    },
    {
        "number": 721,
        "name_en": "Mohanagar Express",
        "name_bn": "মহানগর এক্সপ্রেস",
        "origin": "Chittagong",
        "destination": "Dhaka",
        "departure": "12:30 PM",
        "arrival": "07:10 PM",
        "dep_time_24": "12:30",
        "arr_time_24": "19:10",
        "duration": "6h 40m",
        "off_day": "Sunday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 345, "SNIGDHA": 656, "AC_S": 788},
        "stoppages": ["Chittagong", "Feni", "Cumilla", "Laksam", "Akhaura", "Brahmanbaria", "Bhairab Bazar", "Dhaka Airport", "Dhaka"],
        "ttms_code": "721"
    },
    {
        "number": 722,
        "name_en": "Mohanagar Express",
        "name_bn": "মহানগর এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Chittagong",
        "departure": "09:20 PM",
        "arrival": "04:30 AM",
        "dep_time_24": "21:20",
        "arr_time_24": "04:30",
        "duration": "7h 10m",
        "off_day": "Sunday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 345, "SNIGDHA": 656, "AC_S": 788},
        "stoppages": ["Dhaka", "Dhaka Airport", "Bhairab Bazar", "Brahmanbaria", "Akhaura", "Cumilla", "Feni", "Chittagong"],
        "ttms_code": "722"
    },
    {
        "number": 819,
        "name_en": "Cox's Bazar Express",
        "name_bn": "কক্সবাজার এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Cox's Bazar",
        "departure": "10:30 PM",
        "arrival": "07:20 AM",
        "dep_time_24": "22:30",
        "arr_time_24": "07:20",
        "duration": "8h 50m",
        "off_day": "Monday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 695, "SNIGDHA": 1325, "AC_S": 1590, "AC_B": 2380},
        "stoppages": ["Dhaka", "Dhaka Airport", "Chittagong", "Cox's Bazar"],
        "ttms_code": "819"
    },
    {
        "number": 820,
        "name_en": "Cox's Bazar Express",
        "name_bn": "কক্সবাজার এক্সপ্রেস",
        "origin": "Cox's Bazar",
        "destination": "Dhaka",
        "departure": "12:30 PM",
        "arrival": "09:10 PM",
        "dep_time_24": "12:30",
        "arr_time_24": "21:10",
        "duration": "8h 40m",
        "off_day": "Monday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 695, "SNIGDHA": 1325, "AC_S": 1590, "AC_B": 2380},
        "stoppages": ["Cox's Bazar", "Chittagong", "Dhaka Airport", "Dhaka"],
        "ttms_code": "820"
    },
    {
        "number": 829,
        "name_en": "Parjatak Express",
        "name_bn": "পর্যটক এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Cox's Bazar",
        "departure": "06:15 AM",
        "arrival": "03:00 PM",
        "dep_time_24": "06:15",
        "arr_time_24": "15:00",
        "duration": "8h 45m",
        "off_day": "Sunday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 695, "SNIGDHA": 1325, "AC_S": 1590, "AC_B": 2380},
        "stoppages": ["Dhaka", "Dhaka Airport", "Chittagong", "Cox's Bazar"],
        "ttms_code": "829"
    },
    {
        "number": 830,
        "name_en": "Parjatak Express",
        "name_bn": "পর্যটক এক্সপ্রেস",
        "origin": "Cox's Bazar",
        "destination": "Dhaka",
        "departure": "08:00 PM",
        "arrival": "04:30 AM",
        "dep_time_24": "20:00",
        "arr_time_24": "04:30",
        "duration": "8h 30m",
        "off_day": "Sunday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 695, "SNIGDHA": 1325, "AC_S": 1590, "AC_B": 2380},
        "stoppages": ["Cox's Bazar", "Chittagong", "Dhaka Airport", "Dhaka"],
        "ttms_code": "830"
    },

    # -------------------------------------------------------------
    # Corridor 5: Dhaka <-> Sylhet
    # -------------------------------------------------------------
    {
        "number": 709,
        "name_en": "Parabat Express",
        "name_bn": "পারাবত এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Sylhet",
        "departure": "06:20 AM",
        "arrival": "01:00 PM",
        "dep_time_24": "06:20",
        "arr_time_24": "13:00",
        "duration": "6h 40m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 320, "SNIGDHA": 610, "AC_S": 736, "AC_B": 1104},
        "stoppages": ["Dhaka", "Dhaka Airport", "Bhairab Bazar", "Brahmanbaria", "Azampur", "Shaistaganj", "Sreemangal", "Bhanugach", "Kulaura", "Maijgaon", "Sylhet"],
        "ttms_code": "709"
    },
    {
        "number": 710,
        "name_en": "Parabat Express",
        "name_bn": "পারাবত এক্সপ্রেস",
        "origin": "Sylhet",
        "destination": "Dhaka",
        "departure": "03:45 PM",
        "arrival": "10:30 PM",
        "dep_time_24": "15:45",
        "arr_time_24": "22:30",
        "duration": "6h 45m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 320, "SNIGDHA": 610, "AC_S": 736, "AC_B": 1104},
        "stoppages": ["Sylhet", "Maijgaon", "Kulaura", "Bhanugach", "Sreemangal", "Shaistaganj", "Azampur", "Brahmanbaria", "Bhairab Bazar", "Dhaka Airport", "Dhaka"],
        "ttms_code": "710"
    },
    {
        "number": 773,
        "name_en": "Kalni Express",
        "name_bn": "কালনী এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Sylhet",
        "departure": "03:00 PM",
        "arrival": "09:30 PM",
        "dep_time_24": "15:00",
        "arr_time_24": "21:30",
        "duration": "6h 30m",
        "off_day": "Friday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 320, "SNIGDHA": 610, "AC_S": 736},
        "stoppages": ["Dhaka", "Dhaka Airport", "Brahmanbaria", "Shaistaganj", "Sreemangal", "Shamshernagar", "Kulaura", "Sylhet"],
        "ttms_code": "773"
    },
    {
        "number": 774,
        "name_en": "Kalni Express",
        "name_bn": "কালনী এক্সপ্রেস",
        "origin": "Sylhet",
        "destination": "Dhaka",
        "departure": "06:45 AM",
        "arrival": "01:00 PM",
        "dep_time_24": "06:45",
        "arr_time_24": "13:00",
        "duration": "6h 15m",
        "off_day": "Friday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 320, "SNIGDHA": 610, "AC_S": 736},
        "stoppages": ["Sylhet", "Kulaura", "Shamshernagar", "Sreemangal", "Shaistaganj", "Brahmanbaria", "Dhaka Airport", "Dhaka"],
        "ttms_code": "774"
    },
    {
        "number": 739,
        "name_en": "Upaban Express",
        "name_bn": "উপবন এক্সপ্রেস (নাইট এক্সপ্রেস)",
        "origin": "Dhaka",
        "destination": "Sylhet",
        "departure": "08:30 PM",
        "arrival": "05:00 AM",
        "dep_time_24": "20:30",
        "arr_time_24": "05:00",
        "duration": "8h 30m",
        "off_day": "Wednesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 320, "SNIGDHA": 610, "AC_S": 736, "AC_B": 1104},
        "stoppages": ["Dhaka", "Dhaka Airport", "Bhairab Bazar", "Brahmanbaria", "Shaistaganj", "Sreemangal", "Bhanugach", "Kulaura", "Maijgaon", "Sylhet"],
        "ttms_code": "739"
    },
    {
        "number": 740,
        "name_en": "Upaban Express",
        "name_bn": "উপবন এক্সপ্রেস (নাইট এক্সপ্রেস)",
        "origin": "Sylhet",
        "destination": "Dhaka",
        "departure": "11:30 PM",
        "arrival": "06:45 AM",
        "dep_time_24": "23:30",
        "arr_time_24": "06:45",
        "duration": "7h 15m",
        "off_day": "Wednesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 320, "SNIGDHA": 610, "AC_S": 736, "AC_B": 1104},
        "stoppages": ["Sylhet", "Maijgaon", "Kulaura", "Bhanugach", "Sreemangal", "Shaistaganj", "Brahmanbaria", "Bhairab Bazar", "Dhaka Airport", "Dhaka"],
        "ttms_code": "740"
    },

    # -------------------------------------------------------------
    # Corridor 6: Dhaka <-> Rajshahi
    # -------------------------------------------------------------
    {
        "number": 791,
        "name_en": "Banalata Express",
        "name_bn": "বনলতা এক্সপ্রেস (নন-স্টপ)",
        "origin": "Rajshahi",
        "destination": "Dhaka",
        "departure": "07:00 AM",
        "arrival": "11:40 AM",
        "dep_time_24": "07:00",
        "arr_time_24": "11:40",
        "duration": "4h 40m",
        "off_day": "Friday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 375, "SNIGDHA": 719, "AC_S": 863},
        "stoppages": ["Rajshahi", "Dhaka Airport", "Dhaka"],
        "ttms_code": "791"
    },
    {
        "number": 792,
        "name_en": "Banalata Express",
        "name_bn": "বনলতা এক্সপ্রেস (নন-স্টপ)",
        "origin": "Dhaka",
        "destination": "Rajshahi",
        "departure": "01:30 PM",
        "arrival": "06:00 PM",
        "dep_time_24": "13:30",
        "arr_time_24": "18:00",
        "duration": "4h 30m",
        "off_day": "Friday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 375, "SNIGDHA": 719, "AC_S": 863},
        "stoppages": ["Dhaka", "Dhaka Airport", "Rajshahi"],
        "ttms_code": "792"
    },
    {
        "number": 753,
        "name_en": "Silk City Express",
        "name_bn": "সিল্কসিটি এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Rajshahi",
        "departure": "02:40 PM",
        "arrival": "08:35 PM",
        "dep_time_24": "14:40",
        "arr_time_24": "20:35",
        "duration": "5h 55m",
        "off_day": "Sunday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 340, "SNIGDHA": 656, "AC_S": 782, "AC_B": 1173},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Tangail", "BB Setu East", "Shahid M Monsur Ali", "Ullapara", "Boroigram", "Abdulpur", "Natore", "Rajshahi"],
        "ttms_code": "753"
    },
    {
        "number": 754,
        "name_en": "Silk City Express",
        "name_bn": "সিল্কসিটি এক্সপ্রেস",
        "origin": "Rajshahi",
        "destination": "Dhaka",
        "departure": "07:40 AM",
        "arrival": "01:30 PM",
        "dep_time_24": "07:40",
        "arr_time_24": "13:30",
        "duration": "5h 50m",
        "off_day": "Sunday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 340, "SNIGDHA": 656, "AC_S": 782, "AC_B": 1173},
        "stoppages": ["Rajshahi", "Natore", "Abdulpur", "Boroigram", "Ullapara", "Shahid M Monsur Ali", "BB Setu East", "Tangail", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "ttms_code": "754"
    },
    {
        "number": 759,
        "name_en": "Padma Express",
        "name_bn": "পদ্মা এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Rajshahi",
        "departure": "11:00 PM",
        "arrival": "04:30 AM",
        "dep_time_24": "23:00",
        "arr_time_24": "04:30",
        "duration": "5h 30m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 340, "SNIGDHA": 656, "AC_S": 782, "AC_B": 1173},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Tangail", "Shahid M Monsur Ali", "Ullapara", "Ishwardi Bypass", "Natore", "Rajshahi"],
        "ttms_code": "759"
    },
    {
        "number": 760,
        "name_en": "Padma Express",
        "name_bn": "পদ্মা এক্সপ্রেস",
        "origin": "Rajshahi",
        "destination": "Dhaka",
        "departure": "04:00 PM",
        "arrival": "09:40 PM",
        "dep_time_24": "16:00",
        "arr_time_24": "21:40",
        "duration": "5h 40m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 340, "SNIGDHA": 656, "AC_S": 782, "AC_B": 1173},
        "stoppages": ["Rajshahi", "Natore", "Ishwardi Bypass", "Ullapara", "Shahid M Monsur Ali", "Tangail", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "ttms_code": "760"
    },

    # -------------------------------------------------------------
    # Corridor 7: Dhaka <-> Khulna & Benapole (Padma Bridge)
    # -------------------------------------------------------------
    {
        "number": 725,
        "name_en": "Sundarban Express",
        "name_bn": "সুন্দরবন এক্সপ্রেস (পদ্মা সেতু)",
        "origin": "Dhaka",
        "destination": "Khulna",
        "departure": "08:15 AM",
        "arrival": "03:50 PM",
        "dep_time_24": "08:15",
        "arr_time_24": "15:50",
        "duration": "7h 35m",
        "off_day": "Wednesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 505, "SNIGDHA": 966, "AC_S": 1162, "AC_B": 1740},
        "stoppages": ["Dhaka", "Bhanga", "Kashiani", "Gopalganj", "Jessore", "Noapara", "Daulatpur", "Khulna"],
        "ttms_code": "725"
    },
    {
        "number": 726,
        "name_en": "Sundarban Express",
        "name_bn": "সুন্দরবন এক্সপ্রেস (পদ্মা সেতু)",
        "origin": "Khulna",
        "destination": "Dhaka",
        "departure": "09:45 PM",
        "arrival": "05:10 AM",
        "dep_time_24": "21:45",
        "arr_time_24": "05:10",
        "duration": "7h 25m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 505, "SNIGDHA": 966, "AC_S": 1162, "AC_B": 1740},
        "stoppages": ["Khulna", "Daulatpur", "Noapara", "Jessore", "Gopalganj", "Kashiani", "Bhanga", "Dhaka"],
        "ttms_code": "726"
    },
    {
        "number": 795,
        "name_en": "Benapole Express",
        "name_bn": "বেনাপোল এক্সপ্রেস (পদ্মা সেতু)",
        "origin": "Dhaka",
        "destination": "Benapole",
        "departure": "11:45 PM",
        "arrival": "07:20 AM",
        "dep_time_24": "23:45",
        "arr_time_24": "07:20",
        "duration": "7h 35m",
        "off_day": "Wednesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 490, "SNIGDHA": 935, "AC_S": 1125, "AC_B": 1690},
        "stoppages": ["Dhaka", "Bhanga", "Kashiani", "Narail", "Jessore", "Jhikargachha", "Benapole"],
        "ttms_code": "795"
    },
    {
        "number": 796,
        "name_en": "Benapole Express",
        "name_bn": "বেনাপোল এক্সপ্রেস (পদ্মা সেতু)",
        "origin": "Benapole",
        "destination": "Dhaka",
        "departure": "01:00 PM",
        "arrival": "08:45 PM",
        "dep_time_24": "13:00",
        "arr_time_24": "20:45",
        "duration": "7h 45m",
        "off_day": "Wednesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 490, "SNIGDHA": 935, "AC_S": 1125, "AC_B": 1690},
        "stoppages": ["Benapole", "Jhikargachha", "Jessore", "Narail", "Kashiani", "Bhanga", "Dhaka"],
        "ttms_code": "796"
    },

    # -------------------------------------------------------------
    # Corridor 8: Dhaka <-> Mymensingh, Jamalpur, Dewanganj
    # -------------------------------------------------------------
    {
        "number": 735,
        "name_en": "Agnibeena Express",
        "name_bn": "অগ্নিবীণা এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Jamalpur",
        "departure": "11:30 AM",
        "arrival": "04:30 PM",
        "dep_time_24": "11:30",
        "arr_time_24": "16:30",
        "duration": "5h 00m",
        "off_day": "None",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 165, "SNIGDHA": 315, "AC_S": 380},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Gafargaon", "Mymensingh", "Piyarpur", "Jamalpur"],
        "ttms_code": "735"
    },
    {
        "number": 736,
        "name_en": "Agnibeena Express",
        "name_bn": "অগ্নিবীণা এক্সপ্রেস",
        "origin": "Jamalpur",
        "destination": "Dhaka",
        "departure": "05:30 PM",
        "arrival": "10:30 PM",
        "dep_time_24": "17:30",
        "arr_time_24": "22:30",
        "duration": "5h 00m",
        "off_day": "None",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 165, "SNIGDHA": 315, "AC_S": 380},
        "stoppages": ["Jamalpur", "Piyarpur", "Mymensingh", "Gafargaon", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "ttms_code": "736"
    },
    {
        "number": 743,
        "name_en": "Brahmaputra Express",
        "name_bn": "ব্রহ্মপুত্র এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Dewanganj",
        "departure": "06:15 PM",
        "arrival": "11:45 PM",
        "dep_time_24": "18:15",
        "arr_time_24": "23:45",
        "duration": "5h 30m",
        "off_day": "None",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 210, "SNIGDHA": 405, "AC_S": 485},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Gafargaon", "Mymensingh", "Piyarpur", "Jamalpur", "Dewanganj"],
        "ttms_code": "743"
    },
    {
        "number": 744,
        "name_en": "Brahmaputra Express",
        "name_bn": "ব্রহ্মপুত্র এক্সপ্রেস",
        "origin": "Dewanganj",
        "destination": "Dhaka",
        "departure": "06:40 AM",
        "arrival": "12:15 PM",
        "dep_time_24": "06:40",
        "arr_time_24": "12:15",
        "duration": "5h 35m",
        "off_day": "None",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 210, "SNIGDHA": 405, "AC_S": 485},
        "stoppages": ["Dewanganj", "Jamalpur", "Piyarpur", "Mymensingh", "Gafargaon", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "ttms_code": "744"
    },

    # -------------------------------------------------------------
    # Corridor 10: Complete National Fleet Intercity Additions
    # -------------------------------------------------------------
    # Dhaka <-> Chittagong: Mohanagar Provati / Godhuli (703 / 704)
    {
        "number": 703,
        "name_en": "Mohanagar Godhuli",
        "name_bn": "মহানগর গোধূলী",
        "origin": "Chittagong",
        "destination": "Dhaka",
        "departure": "03:00 PM",
        "arrival": "08:45 PM",
        "dep_time_24": "15:00",
        "arr_time_24": "20:45",
        "duration": "5h 45m",
        "off_day": "None",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 345, "SNIGDHA": 656, "AC_S": 788, "AC_B": 1179},
        "stoppages": ["Chittagong", "Feni", "Cumilla", "Brahmanbaria", "Bhairab Bazar", "Dhaka Airport", "Dhaka"],
        "ttms_code": "703"
    },
    {
        "number": 704,
        "name_en": "Mohanagar Provati",
        "name_bn": "মহানগর প্রভাতী",
        "origin": "Dhaka",
        "destination": "Chittagong",
        "departure": "07:45 AM",
        "arrival": "01:40 PM",
        "dep_time_24": "07:45",
        "arr_time_24": "13:40",
        "duration": "5h 55m",
        "off_day": "None",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 345, "SNIGDHA": 656, "AC_S": 788, "AC_B": 1179},
        "stoppages": ["Dhaka", "Dhaka Airport", "Bhairab Bazar", "Brahmanbaria", "Cumilla", "Feni", "Chittagong"],
        "ttms_code": "704"
    },
    # Dhaka <-> Chittagong: Chattala Express (801 / 802)
    {
        "number": 801,
        "name_en": "Chattala Express",
        "name_bn": "চট্টলা এক্সপ্রেস",
        "origin": "Chittagong",
        "destination": "Dhaka",
        "departure": "06:00 AM",
        "arrival": "12:40 PM",
        "dep_time_24": "06:00",
        "arr_time_24": "12:40",
        "duration": "6h 40m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA"],
        "fares": {"SHOVAN": 345, "SNIGDHA": 656},
        "stoppages": ["Chittagong", "Sitakunda", "Feni", "Cumilla", "Laksam", "Akhaura", "Brahmanbaria", "Bhairab Bazar", "Narsingdi", "Dhaka Airport", "Dhaka"],
        "ttms_code": "801"
    },
    {
        "number": 802,
        "name_en": "Chattala Express",
        "name_bn": "চট্টলা এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Chittagong",
        "departure": "01:45 PM",
        "arrival": "08:30 PM",
        "dep_time_24": "13:45",
        "arr_time_24": "20:30",
        "duration": "6h 45m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA"],
        "fares": {"SHOVAN": 345, "SNIGDHA": 656},
        "stoppages": ["Dhaka", "Dhaka Airport", "Narsingdi", "Bhairab Bazar", "Brahmanbaria", "Akhaura", "Laksam", "Cumilla", "Feni", "Sitakunda", "Chittagong"],
        "ttms_code": "802"
    },
    # Dhaka <-> Dewanganj: Tista Express (707 / 708)
    {
        "number": 707,
        "name_en": "Tista Express",
        "name_bn": "তিস্তা এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Dewanganj",
        "departure": "07:30 AM",
        "arrival": "12:50 PM",
        "dep_time_24": "07:30",
        "arr_time_24": "12:50",
        "duration": "5h 20m",
        "off_day": "Monday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 210, "SNIGDHA": 405, "AC_S": 485},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Gafargaon", "Mymensingh", "Piyarpur", "Jamalpur", "Dewanganj"],
        "ttms_code": "707"
    },
    {
        "number": 708,
        "name_en": "Tista Express",
        "name_bn": "তিস্তা এক্সপ্রেস",
        "origin": "Dewanganj",
        "destination": "Dhaka",
        "departure": "03:00 PM",
        "arrival": "08:35 PM",
        "dep_time_24": "15:00",
        "arr_time_24": "20:35",
        "duration": "5h 35m",
        "off_day": "Monday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 210, "SNIGDHA": 405, "AC_S": 485},
        "stoppages": ["Dewanganj", "Jamalpur", "Piyarpur", "Mymensingh", "Gafargaon", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "ttms_code": "708"
    },
    # Dhaka <-> Sylhet: Jayantika Express (717 / 718)
    {
        "number": 717,
        "name_en": "Jayantika Express",
        "name_bn": "জয়ন্তিকা এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Sylhet",
        "departure": "11:15 AM",
        "arrival": "06:30 PM",
        "dep_time_24": "11:15",
        "arr_time_24": "18:30",
        "duration": "7h 15m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 320, "SNIGDHA": 610, "AC_S": 736, "AC_B": 1104},
        "stoppages": ["Dhaka", "Dhaka Airport", "Bhairab Bazar", "Brahmanbaria", "Azampur", "Shaistaganj", "Sreemangal", "Bhanugach", "Kulaura", "Maijgaon", "Sylhet"],
        "ttms_code": "717"
    },
    {
        "number": 718,
        "name_en": "Jayantika Express",
        "name_bn": "জয়ন্তিকা এক্সপ্রেস",
        "origin": "Sylhet",
        "destination": "Dhaka",
        "departure": "11:30 AM",
        "arrival": "06:40 PM",
        "dep_time_24": "11:30",
        "arr_time_24": "18:40",
        "duration": "7h 10m",
        "off_day": "Thursday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 320, "SNIGDHA": 610, "AC_S": 736, "AC_B": 1104},
        "stoppages": ["Sylhet", "Maijgaon", "Kulaura", "Bhanugach", "Sreemangal", "Shaistaganj", "Azampur", "Brahmanbaria", "Bhairab Bazar", "Dhaka Airport", "Dhaka"],
        "ttms_code": "718"
    },
    # Chittagong <-> Sylhet: Paharika Express (719 / 720)
    {
        "number": 719,
        "name_en": "Paharika Express",
        "name_bn": "পাহাড়িকা এক্সপ্রেস",
        "origin": "Chittagong",
        "destination": "Sylhet",
        "departure": "07:50 AM",
        "arrival": "04:30 PM",
        "dep_time_24": "07:50",
        "arr_time_24": "16:30",
        "duration": "8h 40m",
        "off_day": "Monday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 375, "SNIGDHA": 719, "AC_S": 863, "AC_B": 1295},
        "stoppages": ["Chittagong", "Feni", "Cumilla", "Laksam", "Akhaura", "Shaistaganj", "Sreemangal", "Bhanugach", "Kulaura", "Maijgaon", "Sylhet"],
        "ttms_code": "719"
    },
    {
        "number": 720,
        "name_en": "Paharika Express",
        "name_bn": "পাহাড়িকা এক্সপ্রেস",
        "origin": "Sylhet",
        "destination": "Chittagong",
        "departure": "10:15 AM",
        "arrival": "07:35 PM",
        "dep_time_24": "10:15",
        "arr_time_24": "19:35",
        "duration": "9h 20m",
        "off_day": "Saturday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 375, "SNIGDHA": 719, "AC_S": 863, "AC_B": 1295},
        "stoppages": ["Sylhet", "Maijgaon", "Kulaura", "Bhanugach", "Sreemangal", "Shaistaganj", "Akhaura", "Cumilla", "Laksam", "Feni", "Chittagong"],
        "ttms_code": "720"
    },
    # Chittagong <-> Sylhet: Udayan Express (723 / 724)
    {
        "number": 723,
        "name_en": "Udayan Express",
        "name_bn": "উদয়ন এক্সপ্রেস (নাইট এক্সপ্রেস)",
        "origin": "Chittagong",
        "destination": "Sylhet",
        "departure": "09:45 PM",
        "arrival": "06:00 AM",
        "dep_time_24": "21:45",
        "arr_time_24": "06:00",
        "duration": "8h 15m",
        "off_day": "Sunday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 375, "SNIGDHA": 719, "AC_S": 863, "AC_B": 1295},
        "stoppages": ["Chittagong", "Feni", "Cumilla", "Laksam", "Akhaura", "Shaistaganj", "Sreemangal", "Kulaura", "Maijgaon", "Sylhet"],
        "ttms_code": "723"
    },
    {
        "number": 724,
        "name_en": "Udayan Express",
        "name_bn": "উদয়ন এক্সপ্রেস (নাইট এক্সপ্রেস)",
        "origin": "Sylhet",
        "destination": "Chittagong",
        "departure": "09:20 PM",
        "arrival": "05:30 AM",
        "dep_time_24": "21:20",
        "arr_time_24": "05:30",
        "duration": "8h 10m",
        "off_day": "Sunday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 375, "SNIGDHA": 719, "AC_S": 863, "AC_B": 1295},
        "stoppages": ["Sylhet", "Maijgaon", "Kulaura", "Sreemangal", "Shaistaganj", "Akhaura", "Cumilla", "Laksam", "Feni", "Chittagong"],
        "ttms_code": "724"
    },
    # Khulna <-> Rajshahi: Kapotaksha Express (715 / 716)
    {
        "number": 715,
        "name_en": "Kapotaksha Express",
        "name_bn": "কপোতাক্ষ এক্সপ্রেস",
        "origin": "Khulna",
        "destination": "Rajshahi",
        "departure": "06:15 AM",
        "arrival": "12:00 PM",
        "dep_time_24": "06:15",
        "arr_time_24": "12:00",
        "duration": "5h 45m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 260, "SNIGDHA": 495, "AC_S": 595},
        "stoppages": ["Khulna", "Daulatpur", "Noapara", "Jessore", "Kotchandpur", "Chuadanga", "Poradah", "Ishwardi", "Abdulpur", "Rajshahi"],
        "ttms_code": "715"
    },
    {
        "number": 716,
        "name_en": "Kapotaksha Express",
        "name_bn": "কপোতাক্ষ এক্সপ্রেস",
        "origin": "Rajshahi",
        "destination": "Khulna",
        "departure": "02:15 PM",
        "arrival": "08:10 PM",
        "dep_time_24": "14:15",
        "arr_time_24": "20:10",
        "duration": "5h 55m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 260, "SNIGDHA": 495, "AC_S": 595},
        "stoppages": ["Rajshahi", "Abdulpur", "Ishwardi", "Poradah", "Chuadanga", "Kotchandpur", "Jessore", "Noapara", "Daulatpur", "Khulna"],
        "ttms_code": "716"
    },
    # Khulna <-> Rajshahi: Sagardari Express (761 / 762)
    {
        "number": 761,
        "name_en": "Sagardari Express",
        "name_bn": "সাগরদাঁড়ী এক্সপ্রেস",
        "origin": "Khulna",
        "destination": "Rajshahi",
        "departure": "04:00 PM",
        "arrival": "10:00 PM",
        "dep_time_24": "16:00",
        "arr_time_24": "22:00",
        "duration": "6h 00m",
        "off_day": "Monday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 260, "SNIGDHA": 495, "AC_S": 595},
        "stoppages": ["Khulna", "Daulatpur", "Noapara", "Jessore", "Kotchandpur", "Chuadanga", "Poradah", "Ishwardi", "Abdulpur", "Rajshahi"],
        "ttms_code": "761"
    },
    {
        "number": 762,
        "name_en": "Sagardari Express",
        "name_bn": "সাগরদাঁড়ী এক্সপ্রেস",
        "origin": "Rajshahi",
        "destination": "Khulna",
        "departure": "06:40 AM",
        "arrival": "12:45 PM",
        "dep_time_24": "06:40",
        "arr_time_24": "12:45",
        "duration": "6h 05m",
        "off_day": "Monday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 260, "SNIGDHA": 495, "AC_S": 595},
        "stoppages": ["Rajshahi", "Abdulpur", "Ishwardi", "Poradah", "Chuadanga", "Kotchandpur", "Jessore", "Noapara", "Daulatpur", "Khulna"],
        "ttms_code": "762"
    },
    # Chittagong <-> Mymensingh: Bijoy Express (737 / 738)
    {
        "number": 737,
        "name_en": "Bijoy Express",
        "name_bn": "বিজয় এক্সপ্রেস",
        "origin": "Chittagong",
        "destination": "Mymensingh",
        "departure": "07:20 AM",
        "arrival": "02:10 PM",
        "dep_time_24": "07:20",
        "arr_time_24": "14:10",
        "duration": "6h 50m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 360, "SNIGDHA": 685, "AC_S": 820},
        "stoppages": ["Chittagong", "Feni", "Cumilla", "Akhaura", "Brahmanbaria", "Bhairab Bazar", "Kishoreganj", "Gafargaon", "Mymensingh"],
        "ttms_code": "737"
    },
    {
        "number": 738,
        "name_en": "Bijoy Express",
        "name_bn": "বিজয় এক্সপ্রেস",
        "origin": "Mymensingh",
        "destination": "Chittagong",
        "departure": "08:30 PM",
        "arrival": "03:45 AM",
        "dep_time_24": "20:30",
        "arr_time_24": "03:45",
        "duration": "7h 15m",
        "off_day": "Wednesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 360, "SNIGDHA": 685, "AC_S": 820},
        "stoppages": ["Mymensingh", "Gafargaon", "Kishoreganj", "Bhairab Bazar", "Brahmanbaria", "Akhaura", "Cumilla", "Feni", "Chittagong"],
        "ttms_code": "738"
    },
    # Dhaka <-> Tarakandi: Jamuna Express (745 / 746)
    {
        "number": 745,
        "name_en": "Jamuna Express",
        "name_bn": "যমুনা এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Tarakandi",
        "departure": "04:45 PM",
        "arrival": "10:30 PM",
        "dep_time_24": "16:45",
        "arr_time_24": "22:30",
        "duration": "5h 45m",
        "off_day": "None",
        "classes": ["SHOVAN", "SNIGDHA"],
        "fares": {"SHOVAN": 180, "SNIGDHA": 345},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Gafargaon", "Mymensingh", "Jamalpur", "Tarakandi"],
        "ttms_code": "745"
    },
    {
        "number": 746,
        "name_en": "Jamuna Express",
        "name_bn": "যমুনা এক্সপ্রেস",
        "origin": "Tarakandi",
        "destination": "Dhaka",
        "departure": "02:00 AM",
        "arrival": "08:10 AM",
        "dep_time_24": "02:00",
        "arr_time_24": "08:10",
        "duration": "6h 10m",
        "off_day": "None",
        "classes": ["SHOVAN", "SNIGDHA"],
        "fares": {"SHOVAN": 180, "SNIGDHA": 345},
        "stoppages": ["Tarakandi", "Jamalpur", "Mymensingh", "Gafargaon", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "ttms_code": "746"
    },
    # Dhaka <-> Lalmonirhat: Lalmoni Express (751 / 752)
    {
        "number": 751,
        "name_en": "Lalmoni Express",
        "name_bn": "লালমনি এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Lalmonirhat",
        "departure": "09:45 PM",
        "arrival": "07:20 AM",
        "dep_time_24": "21:45",
        "arr_time_24": "07:20",
        "duration": "9h 35m",
        "off_day": "Friday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 505, "SNIGDHA": 966, "AC_S": 1162, "AC_B": 1740},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Tangail", "BB Setu East", "Santahar", "Bogura", "Gaibandha", "Lalmonirhat"],
        "ttms_code": "751"
    },
    {
        "number": 752,
        "name_en": "Lalmoni Express",
        "name_bn": "লালমনি এক্সপ্রেস",
        "origin": "Lalmonirhat",
        "destination": "Dhaka",
        "departure": "10:00 AM",
        "arrival": "08:20 PM",
        "dep_time_24": "10:00",
        "arr_time_24": "20:20",
        "duration": "10h 20m",
        "off_day": "Friday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 505, "SNIGDHA": 966, "AC_S": 1162, "AC_B": 1740},
        "stoppages": ["Lalmonirhat", "Gaibandha", "Bogura", "Santahar", "BB Setu East", "Tangail", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "ttms_code": "752"
    },
    # Dhaka <-> Rajshahi / Benapole via Padma Bridge: Modhumati Express (755 / 756)
    {
        "number": 755,
        "name_en": "Modhumati Express",
        "name_bn": "মধুমতী এক্সপ্রেস (পদ্মা সেতু)",
        "origin": "Dhaka",
        "destination": "Rajshahi",
        "departure": "03:00 PM",
        "arrival": "10:40 PM",
        "dep_time_24": "15:00",
        "arr_time_24": "22:40",
        "duration": "7h 40m",
        "off_day": "Thursday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 420, "SNIGDHA": 805, "AC_S": 965},
        "stoppages": ["Dhaka", "Bhanga", "Faridpur", "Kashiani", "Kushtia", "Poradah", "Ishwardi", "Abdulpur", "Rajshahi"],
        "ttms_code": "755"
    },
    {
        "number": 756,
        "name_en": "Modhumati Express",
        "name_bn": "মধুমতী এক্সপ্রেস (পদ্মা সেতু)",
        "origin": "Rajshahi",
        "destination": "Dhaka",
        "departure": "06:40 AM",
        "arrival": "02:00 PM",
        "dep_time_24": "06:40",
        "arr_time_24": "14:00",
        "duration": "7h 20m",
        "off_day": "Thursday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S"],
        "fares": {"SHOVAN": 420, "SNIGDHA": 805, "AC_S": 965},
        "stoppages": ["Rajshahi", "Abdulpur", "Ishwardi", "Poradah", "Kushtia", "Kashiani", "Faridpur", "Bhanga", "Dhaka"],
        "ttms_code": "756"
    },
    # Dhaka <-> Khulna via Jamuna Bridge: Chitra Express (763 / 764)
    {
        "number": 763,
        "name_en": "Chitra Express",
        "name_bn": "চিত্রা এক্সপ্রেস (যমুনা সেতু রুট)",
        "origin": "Dhaka",
        "destination": "Khulna",
        "departure": "07:00 PM",
        "arrival": "03:50 AM",
        "dep_time_24": "19:00",
        "arr_time_24": "03:50",
        "duration": "8h 50m",
        "off_day": "Monday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 505, "SNIGDHA": 966, "AC_S": 1162, "AC_B": 1740},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Tangail", "BB Setu East", "Ullapara", "Ishwardi", "Poradah", "Chuadanga", "Kotchandpur", "Jessore", "Khulna"],
        "ttms_code": "763"
    },
    {
        "number": 764,
        "name_en": "Chitra Express",
        "name_bn": "চিত্রা এক্সপ্রেস (যমুনা সেতু রুট)",
        "origin": "Khulna",
        "destination": "Dhaka",
        "departure": "09:00 AM",
        "arrival": "05:55 PM",
        "dep_time_24": "09:00",
        "arr_time_24": "17:55",
        "duration": "8h 55m",
        "off_day": "Monday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 505, "SNIGDHA": 966, "AC_S": 1162, "AC_B": 1740},
        "stoppages": ["Khulna", "Jessore", "Kotchandpur", "Chuadanga", "Poradah", "Ishwardi", "Ullapara", "BB Setu East", "Tangail", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "ttms_code": "764"
    },
    # Dhaka <-> Rajshahi: Dhumketu Express (769 / 770)
    {
        "number": 769,
        "name_en": "Dhumketu Express",
        "name_bn": "ধূমকেতু এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Rajshahi",
        "departure": "06:00 AM",
        "arrival": "11:40 AM",
        "dep_time_24": "06:00",
        "arr_time_24": "11:40",
        "duration": "5h 40m",
        "off_day": "Thursday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 340, "SNIGDHA": 656, "AC_S": 782, "AC_B": 1173},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Tangail", "Shahid M Monsur Ali", "Ullapara", "Boroigram", "Abdulpur", "Natore", "Rajshahi"],
        "ttms_code": "769"
    },
    {
        "number": 770,
        "name_en": "Dhumketu Express",
        "name_bn": "ধূমকেতু এক্সপ্রেস",
        "origin": "Rajshahi",
        "destination": "Dhaka",
        "departure": "11:20 PM",
        "arrival": "04:50 AM",
        "dep_time_24": "23:20",
        "arr_time_24": "04:50",
        "duration": "5h 30m",
        "off_day": "Wednesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 340, "SNIGDHA": 656, "AC_S": 782, "AC_B": 1173},
        "stoppages": ["Rajshahi", "Natore", "Abdulpur", "Boroigram", "Ullapara", "Shahid M Monsur Ali", "Tangail", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "ttms_code": "770"
    },
    # Dhaka <-> Sirajganj: Sirajganj Express (775 / 776)
    {
        "number": 775,
        "name_en": "Sirajganj Express",
        "name_bn": "সিরাজগঞ্জ এক্সপ্রেস",
        "origin": "Sirajganj",
        "destination": "Dhaka",
        "departure": "06:00 AM",
        "arrival": "10:00 AM",
        "dep_time_24": "06:00",
        "arr_time_24": "10:00",
        "duration": "4h 00m",
        "off_day": "Saturday",
        "classes": ["SHOVAN", "SNIGDHA"],
        "fares": {"SHOVAN": 150, "SNIGDHA": 290},
        "stoppages": ["Sirajganj", "Shahid M Monsur Ali", "BB Setu East", "Tangail", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "ttms_code": "775"
    },
    {
        "number": 776,
        "name_en": "Sirajganj Express",
        "name_bn": "সিরাজগঞ্জ এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Sirajganj",
        "departure": "05:00 PM",
        "arrival": "09:30 PM",
        "dep_time_24": "17:00",
        "arr_time_24": "21:30",
        "duration": "4h 30m",
        "off_day": "Saturday",
        "classes": ["SHOVAN", "SNIGDHA"],
        "fares": {"SHOVAN": 150, "SNIGDHA": 290},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Tangail", "BB Setu East", "Shahid M Monsur Ali", "Sirajganj"],
        "ttms_code": "776"
    },
    # Dhaka <-> Mohanganj: Haor Express (777 / 778)
    {
        "number": 777,
        "name_en": "Haor Express",
        "name_bn": "হাওর এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Mohanganj",
        "departure": "10:15 PM",
        "arrival": "05:15 AM",
        "dep_time_24": "22:15",
        "arr_time_24": "05:15",
        "duration": "7h 00m",
        "off_day": "Wednesday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 220, "SNIGDHA": 420, "AC_S": 505, "AC_B": 755},
        "stoppages": ["Dhaka", "Dhaka Airport", "Joydebpur", "Gafargaon", "Mymensingh", "Netrokona", "Mohanganj"],
        "ttms_code": "777"
    },
    {
        "number": 778,
        "name_en": "Haor Express",
        "name_bn": "হাওর এক্সপ্রেস",
        "origin": "Mohanganj",
        "destination": "Dhaka",
        "departure": "08:00 AM",
        "arrival": "03:10 PM",
        "dep_time_24": "08:00",
        "arr_time_24": "15:10",
        "duration": "7h 10m",
        "off_day": "Thursday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 220, "SNIGDHA": 420, "AC_S": 505, "AC_B": 755},
        "stoppages": ["Mohanganj", "Netrokona", "Mymensingh", "Gafargaon", "Joydebpur", "Dhaka Airport", "Dhaka"],
        "ttms_code": "778"
    },
    # Dhaka <-> Kishoreganj: Kishoreganj Express (781 / 782)
    {
        "number": 781,
        "name_en": "Kishoreganj Express",
        "name_bn": "কিশোরগঞ্জ এক্সপ্রেস",
        "origin": "Dhaka",
        "destination": "Kishoreganj",
        "departure": "10:45 AM",
        "arrival": "02:30 PM",
        "dep_time_24": "10:45",
        "arr_time_24": "14:30",
        "duration": "3h 45m",
        "off_day": "Friday",
        "classes": ["SHOVAN", "SNIGDHA"],
        "fares": {"SHOVAN": 150, "SNIGDHA": 290},
        "stoppages": ["Dhaka", "Dhaka Airport", "Tongi", "Narsingdi", "Bhairab Bazar", "Kishoreganj"],
        "ttms_code": "781"
    },
    {
        "number": 782,
        "name_en": "Kishoreganj Express",
        "name_bn": "কিশোরগঞ্জ এক্সপ্রেস",
        "origin": "Kishoreganj",
        "destination": "Dhaka",
        "departure": "04:00 PM",
        "arrival": "08:10 PM",
        "dep_time_24": "16:00",
        "arr_time_24": "20:10",
        "duration": "4h 10m",
        "off_day": "Friday",
        "classes": ["SHOVAN", "SNIGDHA"],
        "fares": {"SHOVAN": 150, "SNIGDHA": 290},
        "stoppages": ["Kishoreganj", "Bhairab Bazar", "Narsingdi", "Tongi", "Dhaka Airport", "Dhaka"],
        "ttms_code": "782"
    },
    {
        "number": 804,
        "name_en": "Banglabandha Express",
        "name_bn": "বাংলাবান্ধা এক্সপ্রেস (দিনাজপুর-রাজশাহী সরাসরি)",
        "origin": "Panchagarh",
        "destination": "Rajshahi",
        "departure": "09:00 AM",
        "arrival": "05:15 PM",
        "dep_time_24": "09:00",
        "arr_time_24": "17:15",
        "duration": "8h 15m",
        "off_day": "Saturday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 255, "SNIGDHA": 490, "AC_S": 585, "AC_B": 880},
        "stoppages": [
            "Panchagarh", "Kismat", "Ruhia", "Thakurgaon Road", "Shibganj", "Pirganj", "Setabganj",
            "Dinajpur", "Chirirbandar", "Parbatipur", "Fulbari", "Birampur", "Panchbibi", "Joypurhat",
            "Akkelpur", "Santahar", "Ahsanganj", "Madhnagar", "Natore", "Abdulpur", "Rajshahi"
        ],
        "station_timings": {
            "Panchagarh": {"dep": "09:00 AM", "arr": "—"},
            "Thakurgaon Road": {"arr": "09:47 AM", "dep": "09:50 AM"},
            "Pirganj": {"arr": "10:15 AM", "dep": "10:17 AM"},
            "Setabganj": {"arr": "10:34 AM", "dep": "10:36 AM"},
            "Dinajpur": {"arr": "11:07 AM", "dep": "11:15 AM"},
            "Chirirbandar": {"arr": "11:34 AM", "dep": "11:36 AM"},
            "Parbatipur": {"arr": "12:00 PM", "dep": "12:20 PM"},
            "Fulbari": {"arr": "12:38 PM", "dep": "12:41 PM"},
            "Birampur": {"arr": "12:52 PM", "dep": "12:55 PM"},
            "Joypurhat": {"arr": "01:43 PM", "dep": "01:46 PM"},
            "Santahar": {"arr": "02:40 PM", "dep": "02:45 PM"},
            "Natore": {"arr": "03:35 PM", "dep": "03:37 PM"},
            "Abdulpur": {"arr": "03:55 PM", "dep": "04:15 PM"},
            "Rajshahi": {"arr": "05:15 PM", "dep": "—"}
        },
        "ttms_code": "804"
    },
    {
        "number": 803,
        "name_en": "Banglabandha Express",
        "name_bn": "বাংলাবান্ধা এক্সপ্রেস (রাজশাহী-দিনাজপুর সরাসরি)",
        "origin": "Rajshahi",
        "destination": "Panchagarh",
        "departure": "09:00 PM",
        "arrival": "04:40 AM",
        "dep_time_24": "21:00",
        "arr_time_24": "04:40",
        "duration": "7h 40m",
        "off_day": "Friday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 255, "SNIGDHA": 490, "AC_S": 585, "AC_B": 880},
        "stoppages": [
            "Rajshahi", "Abdulpur", "Natore", "Madhnagar", "Ahsanganj", "Santahar", "Akkelpur",
            "Joypurhat", "Panchbibi", "Birampur", "Fulbari", "Parbatipur", "Chirirbandar",
            "Dinajpur", "Setabganj", "Pirganj", "Shibganj", "Thakurgaon Road", "Ruhia", "Kismat", "Panchagarh"
        ],
        "station_timings": {
            "Rajshahi": {"dep": "09:00 PM", "arr": "—"},
            "Abdulpur": {"arr": "09:40 PM", "dep": "10:00 PM"},
            "Natore": {"arr": "10:17 PM", "dep": "10:20 PM"},
            "Santahar": {"arr": "11:21 PM", "dep": "11:25 PM"},
            "Joypurhat": {"arr": "12:02 AM", "dep": "12:04 AM"},
            "Birampur": {"arr": "12:37 AM", "dep": "12:40 AM"},
            "Fulbari": {"arr": "12:58 AM", "dep": "01:01 AM"},
            "Parbatipur": {"arr": "01:30 AM", "dep": "01:50 AM"},
            "Chirirbandar": {"arr": "02:05 AM", "dep": "02:07 AM"},
            "Dinajpur": {"arr": "02:25 AM", "dep": "02:30 AM"},
            "Setabganj": {"arr": "03:01 AM", "dep": "03:03 AM"},
            "Pirganj": {"arr": "03:17 AM", "dep": "03:19 AM"},
            "Thakurgaon Road": {"arr": "03:43 AM", "dep": "03:47 AM"},
            "Panchagarh": {"arr": "04:40 AM", "dep": "—"}
        },
        "ttms_code": "803"
    },
    {
        "number": 733,
        "name_en": "Titumir Express",
        "name_bn": "তিতুমীর এক্সপ্রেস",
        "origin": "Rajshahi",
        "destination": "Chilahati",
        "departure": "06:20 AM",
        "arrival": "01:00 PM",
        "dep_time_24": "06:20",
        "arr_time_24": "13:00",
        "duration": "6h 40m",
        "off_day": "Wednesday",
        "classes": ["SHOVAN", "SNIGDHA"],
        "fares": {"SHOVAN": 255, "SNIGDHA": 490},
        "stoppages": ["Rajshahi", "Abdulpur", "Natore", "Santahar", "Joypurhat", "Parbatipur", "Saidpur", "Nilphamari", "Domar", "Chilahati"],
        "ttms_code": "733"
    },
    {
        "number": 734,
        "name_en": "Titumir Express",
        "name_bn": "তিতুমীর এক্সপ্রেস",
        "origin": "Chilahati",
        "destination": "Rajshahi",
        "departure": "03:00 PM",
        "arrival": "09:30 PM",
        "dep_time_24": "15:00",
        "arr_time_24": "21:30",
        "duration": "6h 30m",
        "off_day": "Wednesday",
        "classes": ["SHOVAN", "SNIGDHA"],
        "fares": {"SHOVAN": 255, "SNIGDHA": 490},
        "stoppages": ["Chilahati", "Domar", "Nilphamari", "Saidpur", "Parbatipur", "Joypurhat", "Santahar", "Natore", "Abdulpur", "Rajshahi"],
        "ttms_code": "734"
    },
    {
        "number": 731,
        "name_en": "Barendra Express",
        "name_bn": "বরেন্দ্র এক্সপ্রেস",
        "origin": "Rajshahi",
        "destination": "Chilahati",
        "departure": "03:00 PM",
        "arrival": "09:30 PM",
        "dep_time_24": "15:00",
        "arr_time_24": "21:30",
        "duration": "6h 30m",
        "off_day": "Sunday",
        "classes": ["SHOVAN", "SNIGDHA"],
        "fares": {"SHOVAN": 255, "SNIGDHA": 490},
        "stoppages": ["Rajshahi", "Abdulpur", "Santahar", "Joypurhat", "Parbatipur", "Saidpur", "Nilphamari", "Domar", "Chilahati"],
        "ttms_code": "731"
    },
    {
        "number": 732,
        "name_en": "Barendra Express",
        "name_bn": "বরেন্দ্র এক্সপ্রেস",
        "origin": "Chilahati",
        "destination": "Rajshahi",
        "departure": "05:45 AM",
        "arrival": "12:10 PM",
        "dep_time_24": "05:45",
        "arr_time_24": "12:10",
        "duration": "6h 25m",
        "off_day": "Sunday",
        "classes": ["SHOVAN", "SNIGDHA"],
        "fares": {"SHOVAN": 255, "SNIGDHA": 490},
        "stoppages": ["Chilahati", "Domar", "Nilphamari", "Saidpur", "Parbatipur", "Joypurhat", "Santahar", "Abdulpur", "Rajshahi"],
        "ttms_code": "732"
    },
    {
        "number": 747,
        "name_en": "Simanta Express",
        "name_bn": "সীমান্ত এক্সপ্রেস",
        "origin": "Khulna",
        "destination": "Chilahati",
        "departure": "09:15 PM",
        "arrival": "06:45 AM",
        "dep_time_24": "21:15",
        "arr_time_24": "06:45",
        "duration": "9h 30m",
        "off_day": "Monday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 365, "SNIGDHA": 700, "AC_S": 840, "AC_B": 1260},
        "stoppages": ["Khulna", "Daulatpur", "Jessore", "Kotchandpur", "Chuadanga", "Poradah", "Ishwardi", "Santahar", "Joypurhat", "Parbatipur", "Saidpur", "Nilphamari", "Domar", "Chilahati"],
        "station_timings": {
            "Khulna": {"arr": "-", "dep": "09:15 PM"},
            "Daulatpur": {"arr": "09:30 PM", "dep": "09:33 PM"},
            "Jessore": {"arr": "10:15 PM", "dep": "10:20 PM"},
            "Kotchandpur": {"arr": "11:00 PM", "dep": "11:03 PM"},
            "Chuadanga": {"arr": "11:42 PM", "dep": "11:45 PM"},
            "Poradah": {"arr": "12:20 AM", "dep": "12:25 AM"},
            "Ishwardi": {"arr": "01:05 AM", "dep": "01:15 AM"},
            "Santahar": {"arr": "02:45 AM", "dep": "02:55 AM"},
            "Joypurhat": {"arr": "03:38 AM", "dep": "03:41 AM"},
            "Parbatipur": {"arr": "04:50 AM", "dep": "05:00 AM"},
            "Saidpur": {"arr": "05:22 AM", "dep": "05:27 AM"},
            "Nilphamari": {"arr": "05:46 AM", "dep": "05:49 AM"},
            "Domar": {"arr": "06:05 AM", "dep": "06:08 AM"},
            "Chilahati": {"arr": "06:45 AM", "dep": "-"}
        },
        "ttms_code": "747"
    },
    {
        "number": 748,
        "name_en": "Simanta Express",
        "name_bn": "সীমান্ত এক্সপ্রেস",
        "origin": "Chilahati",
        "destination": "Khulna",
        "departure": "06:30 PM",
        "arrival": "04:30 AM",
        "dep_time_24": "18:30",
        "arr_time_24": "04:30",
        "duration": "10h 00m",
        "off_day": "Monday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 365, "SNIGDHA": 700, "AC_S": 840, "AC_B": 1260},
        "stoppages": ["Chilahati", "Domar", "Nilphamari", "Saidpur", "Parbatipur", "Joypurhat", "Santahar", "Ishwardi", "Poradah", "Chuadanga", "Kotchandpur", "Jessore", "Daulatpur", "Khulna"],
        "station_timings": {
            "Chilahati": {"arr": "-", "dep": "06:30 PM"},
            "Domar": {"arr": "06:44 PM", "dep": "06:47 PM"},
            "Nilphamari": {"arr": "07:02 PM", "dep": "07:05 PM"},
            "Saidpur": {"arr": "07:23 PM", "dep": "07:28 PM"},
            "Parbatipur": {"arr": "07:45 PM", "dep": "07:55 PM"},
            "Joypurhat": {"arr": "09:00 PM", "dep": "09:03 PM"},
            "Santahar": {"arr": "09:45 PM", "dep": "09:55 PM"},
            "Ishwardi": {"arr": "11:30 PM", "dep": "11:40 PM"},
            "Poradah": {"arr": "12:25 AM", "dep": "12:30 AM"},
            "Chuadanga": {"arr": "01:05 AM", "dep": "01:10 AM"},
            "Kotchandpur": {"arr": "01:50 AM", "dep": "01:53 AM"},
            "Jessore": {"arr": "02:35 AM", "dep": "02:40 AM"},
            "Daulatpur": {"arr": "03:50 AM", "dep": "03:53 AM"},
            "Khulna": {"arr": "04:30 AM", "dep": "-"}
        },
        "ttms_code": "748"
    },
    {
        "number": 727,
        "name_en": "Rupsha Express",
        "name_bn": "রূপসা এক্সপ্রেস",
        "origin": "Khulna",
        "destination": "Chilahati",
        "departure": "07:15 AM",
        "arrival": "05:05 PM",
        "dep_time_24": "07:15",
        "arr_time_24": "17:05",
        "duration": "9h 50m",
        "off_day": "Thursday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 365, "SNIGDHA": 700, "AC_S": 840, "AC_B": 1260},
        "stoppages": ["Khulna", "Daulatpur", "Noapara", "Jessore", "Kotchandpur", "Chuadanga", "Poradah", "Ishwardi", "Natore", "Santahar", "Akkelpur", "Joypurhat", "Birampur", "Phulbari", "Parbatipur", "Saidpur", "Nilphamari", "Domar", "Chilahati"],
        "station_timings": {
            "Khulna": {"arr": "-", "dep": "07:15 AM"},
            "Daulatpur": {"arr": "07:30 AM", "dep": "07:33 AM"},
            "Noapara": {"arr": "07:52 AM", "dep": "07:55 AM"},
            "Jessore": {"arr": "08:22 AM", "dep": "08:27 AM"},
            "Kotchandpur": {"arr": "09:08 AM", "dep": "09:11 AM"},
            "Chuadanga": {"arr": "09:50 AM", "dep": "09:55 AM"},
            "Poradah": {"arr": "10:30 AM", "dep": "10:35 AM"},
            "Ishwardi": {"arr": "11:15 AM", "dep": "11:25 AM"},
            "Natore": {"arr": "12:10 PM", "dep": "12:13 PM"},
            "Santahar": {"arr": "01:05 PM", "dep": "01:15 PM"},
            "Akkelpur": {"arr": "01:38 PM", "dep": "01:41 PM"},
            "Joypurhat": {"arr": "01:55 PM", "dep": "01:58 PM"},
            "Birampur": {"arr": "02:30 PM", "dep": "02:33 PM"},
            "Phulbari": {"arr": "02:45 PM", "dep": "02:48 PM"},
            "Parbatipur": {"arr": "03:15 PM", "dep": "03:25 PM"},
            "Saidpur": {"arr": "03:45 PM", "dep": "03:50 PM"},
            "Nilphamari": {"arr": "04:08 PM", "dep": "04:11 PM"},
            "Domar": {"arr": "04:26 PM", "dep": "04:29 PM"},
            "Chilahati": {"arr": "05:05 PM", "dep": "-"}
        },
        "ttms_code": "727"
    },
    {
        "number": 728,
        "name_en": "Rupsha Express",
        "name_bn": "রূপসা এক্সপ্রেস",
        "origin": "Chilahati",
        "destination": "Khulna",
        "departure": "08:30 AM",
        "arrival": "06:20 PM",
        "dep_time_24": "08:30",
        "arr_time_24": "18:20",
        "duration": "9h 50m",
        "off_day": "Thursday",
        "classes": ["SHOVAN", "SNIGDHA", "AC_S", "AC_B"],
        "fares": {"SHOVAN": 365, "SNIGDHA": 700, "AC_S": 840, "AC_B": 1260},
        "stoppages": ["Chilahati", "Domar", "Nilphamari", "Saidpur", "Parbatipur", "Phulbari", "Birampur", "Joypurhat", "Akkelpur", "Santahar", "Natore", "Ishwardi", "Poradah", "Chuadanga", "Kotchandpur", "Jessore", "Noapara", "Daulatpur", "Khulna"],
        "station_timings": {
            "Chilahati": {"arr": "-", "dep": "08:30 AM"},
            "Domar": {"arr": "08:44 AM", "dep": "08:47 AM"},
            "Nilphamari": {"arr": "09:02 AM", "dep": "09:05 AM"},
            "Saidpur": {"arr": "09:23 AM", "dep": "09:28 AM"},
            "Parbatipur": {"arr": "09:45 AM", "dep": "09:55 AM"},
            "Phulbari": {"arr": "10:15 AM", "dep": "10:18 AM"},
            "Birampur": {"arr": "10:30 AM", "dep": "10:33 AM"},
            "Joypurhat": {"arr": "11:05 AM", "dep": "11:08 AM"},
            "Akkelpur": {"arr": "11:25 AM", "dep": "11:28 AM"},
            "Santahar": {"arr": "12:05 PM", "dep": "12:15 PM"},
            "Natore": {"arr": "01:00 PM", "dep": "01:03 PM"},
            "Ishwardi": {"arr": "01:55 PM", "dep": "02:05 PM"},
            "Poradah": {"arr": "02:50 PM", "dep": "02:55 PM"},
            "Chuadanga": {"arr": "03:30 PM", "dep": "03:35 PM"},
            "Kotchandpur": {"arr": "04:15 PM", "dep": "04:18 PM"},
            "Jessore": {"arr": "05:00 PM", "dep": "05:05 PM"},
            "Noapara": {"arr": "05:32 PM", "dep": "05:35 PM"},
            "Daulatpur": {"arr": "05:58 PM", "dep": "06:01 PM"},
            "Khulna": {"arr": "06:20 PM", "dep": "-"}
        },
        "ttms_code": "728"
    },
    {
        "number": 783,
        "name_en": "Tungipara Express",
        "name_bn": "টুঙ্গিপাড়া এক্সপ্রেস",
        "origin": "Gobra",
        "destination": "Rajshahi",
        "departure": "06:30 AM",
        "arrival": "01:15 PM",
        "dep_time_24": "06:30",
        "arr_time_24": "13:15",
        "duration": "6h 45m",
        "off_day": "Tuesday",
        "classes": ["SHOVAN", "SNIGDHA"],
        "fares": {"SHOVAN": 240, "SNIGDHA": 460},
        "stoppages": ["Gobra", "Gopalganj", "Kashiani", "Kushtia", "Poradah", "Ishwardi", "Rajshahi"],
        "ttms_code": "783"
    },
    {
        "number": 784,
        "name_en": "Tungipara Express",
        "name_bn": "টুঙ্গিপাড়া এক্সপ্রেস",
        "origin": "Rajshahi",
        "destination": "Gobra",
        "departure": "03:30 PM",
        "arrival": "10:10 PM",
        "dep_time_24": "15:30",
        "arr_time_24": "22:10",
        "duration": "6h 40m",
        "off_day": "Monday",
        "classes": ["SHOVAN", "SNIGDHA"],
        "fares": {"SHOVAN": 240, "SNIGDHA": 460},
        "stoppages": ["Rajshahi", "Ishwardi", "Poradah", "Kushtia", "Kashiani", "Gopalganj", "Gobra"],
        "ttms_code": "784"
    },
    {
        "number": 767,
        "name_en": "Dolonchapa Express",
        "name_bn": "দোলনচাঁপা এক্সপ্রেস",
        "origin": "Santahar",
        "destination": "Panchagarh",
        "departure": "11:00 AM",
        "arrival": "07:45 PM",
        "dep_time_24": "11:00",
        "arr_time_24": "19:45",
        "duration": "8h 45m",
        "off_day": "None",
        "classes": ["SHOVAN"],
        "fares": {"SHOVAN": 220},
        "stoppages": ["Santahar", "Joypurhat", "Parbatipur", "Chirirbandar", "Dinajpur", "Setabganj", "Pirganj", "Thakurgaon Road", "Panchagarh"],
        "ttms_code": "767"
    },
    {
        "number": 768,
        "name_en": "Dolonchapa Express",
        "name_bn": "দোলনচাঁপা এক্সপ্রেস",
        "origin": "Panchagarh",
        "destination": "Santahar",
        "departure": "06:00 AM",
        "arrival": "03:10 PM",
        "dep_time_24": "06:00",
        "arr_time_24": "15:10",
        "duration": "9h 10m",
        "off_day": "None",
        "classes": ["SHOVAN"],
        "fares": {"SHOVAN": 220},
        "stoppages": ["Panchagarh", "Thakurgaon Road", "Pirganj", "Setabganj", "Dinajpur", "Chirirbandar", "Parbatipur", "Joypurhat", "Santahar"],
        "ttms_code": "768"
    }
]

def normalize_station_name(query_str):
    """
    Normalizes any station input (English canonical, English with description, or Bengali)
    to the master station key in STATIONS_DICT.
    """
    if not query_str:
        return ""
    q = str(query_str).strip()
    q_lower = q.lower()

    # 1. Exact match in STATIONS_DICT
    for key in STATIONS_DICT:
        if key.lower() == q_lower:
            return key

    # 2. Match in STATIONS_DICT name_en or name_bn
    for key, data in STATIONS_DICT.items():
        name_en = data.get("name_en", "").lower()
        name_bn = data.get("name_bn", "")
        if q_lower == name_en:
            return key
        if q in name_bn or (len(q) >= 3 and q in name_bn):
            return key

    # 3. Substring match
    for key, data in STATIONS_DICT.items():
        name_en = data.get("name_en", "").lower()
        if key.lower() in q_lower or (len(q_lower) >= 4 and q_lower in name_en):
            return key

    # 4. Clean parenthesis and common suffixes
    cleaned = q_lower.split("(")[0].strip()
    for key in STATIONS_DICT:
        if key.lower() == cleaned:
            return key

    return q

def search_trains(origin_station, dest_station):
    """Finds trains running between two stations (direct or via route stops)"""
    results = []
    norm_origin = normalize_station_name(origin_station)
    norm_dest = normalize_station_name(dest_station)

    o_lower = norm_origin.lower()
    d_lower = norm_dest.lower()

    for train in TRAINS:
        stops_lower = [s.lower() for s in train["stoppages"]]
        
        has_origin = any(o_lower in s or s in o_lower for s in stops_lower) or (o_lower in train["origin"].lower() or train["origin"].lower() in o_lower)
        has_dest = any(d_lower in s or s in d_lower for s in stops_lower) or (d_lower in train["destination"].lower() or train["destination"].lower() in d_lower)

        if has_origin and has_dest:
            try:
                o_idx = next(i for i, s in enumerate(stops_lower) if o_lower in s or s in o_lower)
                d_idx = next(i for i, s in enumerate(stops_lower) if d_lower in s or s in d_lower)
                if o_idx < d_idx:
                    results.append(train)
            except StopIteration:
                if (o_lower in train["origin"].lower() or train["origin"].lower() in o_lower) and \
                   (d_lower in train["destination"].lower() or train["destination"].lower() in d_lower):
                    results.append(train)

    return results

def get_train_by_number(number):
    """Finds a train by its number"""
    for train in TRAINS:
        if str(train["number"]) == str(number).strip():
            return train
    return None

def get_train_rake_composition(train_number, force_reverse=None):
    """
    Returns authentic Bangladesh Railway coach layout (ইঞ্জিন থেকে লেজ পর্যন্ত ১৪টি বগি বিন্যাস).
    
    বাংলাদেশ রেলওয়ের অফিসিয়াল ইঞ্জিনিয়ারিং নিয়ম:
    ১. ঢাকা থেকে প্রান্তিকগামী যাত্রা (UP Trains: যেমন ৭০৫ একতা, ৭৫৭ দ্রুতযান, ৭৬৫ নীলসাগর):
       - লোকোমোটিভ ইঞ্জিন বগি 'ক' প্রান্তে জোড়া হয়।
       - ক্রম: [ইঞ্জিন] ➔ [বগি 'ক'] ➔ [বগি 'খ'] ... ➔ [বগি 'ড'] (লেজ)
       - 'ক' বগি থাকে ইঞ্জিনের ঠিক পেছনে (শুরুতে), 'ড' বগি থাকে ট্রেনের লেজে।
    
    ২. প্রান্তিক থেকে ঢাকাগামী ফিরতি যাত্রা (DOWN Trains: যেমন ৭০৬ একতা, ৭৫৮ দ্রুতযান, ৭৬৬ নীলসাগর):
       - টার্নটেবিল না থাকায় ইঞ্জিন শান্টিং করে অপর প্রান্তে জোড়া হয়।
       - ক্রম: [ইঞ্জিন] ➔ [বগি 'ড'] ➔ [বগি 'ঠ'] ... ➔ [বগি 'ক'] (লেজ)
       - 'ড' বগি থাকে ইঞ্জিনের পাশে (শুরুতে), এবং 'ক' বগি চলে যায় ট্রেনের একদম শেষ মাথায় (লেজে)।
    """
    import random
    num_str = str(train_number).strip()
    train = get_train_by_number(num_str)
    
    # Determine natural operational orientation
    # In Bangladesh Railway: 
    # 1. UP Trains (Odd numbers: 705, 757, 765, 799, 727) -> Outbound from base / Dhaka:
    #    Engine couples to 'ক'. Sequence: [ইঞ্জিন] ➔ [ক] ➔ ... ➔ [ড (লেজ)]
    # 2. DOWN Trains (Even numbers: 706, 758, 766, 800, 728) -> Inbound to Dhaka / Base terminus:
    #    Engine couples to 'ড'. Sequence: [ইঞ্জিন] ➔ [ড] ➔ ... ➔ [ক (লেজ)]
    num = int(num_str) if num_str.isdigit() else 705
    is_return_to_hub = False
    if train:
        dest_lower = train.get("destination", "").lower()
        orig_lower = train.get("origin", "").lower()
        if "dhaka" in dest_lower and "dhaka" not in orig_lower:
            is_return_to_hub = True
        elif num % 2 == 0:
            is_return_to_hub = True
    random.seed(num + 101)

    # Standard 13-Coach Base Passenger Rake ('ক' through 'ড')
    base_coaches = [
        {
            "code": "ক",
            "bangla_tag": "বগি 'ক'",
            "type": "POWER_CAR",
            "name": "পাওয়ার কার ও গার্ড ব্রেক ভ্যান",
            "class_type": "পাওয়ার কার",
            "total_seats": 12,
            "available_seats": random.choice([0, 1, 2]),
            "is_engine": False,
            "badge_color": "bg-rose-950 text-rose-300 border-rose-800"
        },
        {
            "code": "খ",
            "bangla_tag": "বগি 'খ'",
            "type": "SHOVAN_CHAIR",
            "name": "শোভন চেয়ার (নন-এসি)",
            "class_type": "শোভন চেয়ার",
            "total_seats": 60,
            "available_seats": random.choice([0, 2, 5, 8]),
            "is_engine": False,
            "badge_color": "bg-emerald-950 text-emerald-300 border-emerald-800"
        },
        {
            "code": "গ",
            "bangla_tag": "বগি 'গ'",
            "type": "SHOVAN_CHAIR",
            "name": "শোভন চেয়ার (নন-এসি)",
            "class_type": "শোভন চেয়ার",
            "total_seats": 60,
            "available_seats": random.choice([0, 3, 6]),
            "is_engine": False,
            "badge_color": "bg-emerald-950 text-emerald-300 border-emerald-800"
        },
        {
            "code": "ঘ",
            "bangla_tag": "বগি 'ঘ'",
            "type": "SHOVAN_CHAIR",
            "name": "শোভন চেয়ার (নন-এসি)",
            "class_type": "শোভন চেয়ার",
            "total_seats": 60,
            "available_seats": random.choice([0, 1, 4]),
            "is_engine": False,
            "badge_color": "bg-emerald-950 text-emerald-300 border-emerald-800"
        },
        {
            "code": "ঙ",
            "bangla_tag": "বগি 'ঙ'",
            "type": "SHOVAN_CHAIR",
            "name": "শোভন চেয়ার (নন-এসি)",
            "class_type": "শোভন চেয়ার",
            "total_seats": 60,
            "available_seats": random.choice([0, 2, 5]),
            "is_engine": False,
            "badge_color": "bg-emerald-950 text-emerald-300 border-emerald-800"
        },
        {
            "code": "চ",
            "bangla_tag": "বগি 'চ'",
            "type": "DINING_CAR",
            "name": "খাবার বগি ও বুফে ক্যাফে",
            "class_type": "ডাইনিং ও খাবার",
            "total_seats": 30,
            "available_seats": random.choice([0, 2, 4]),
            "is_engine": False,
            "badge_color": "bg-amber-950 text-amber-300 border-amber-800"
        },
        {
            "code": "ছ",
            "bangla_tag": "বগি 'ছ'",
            "type": "SNIGDHA_AC",
            "name": "স্নিগ্ধা এসি চেয়ার",
            "class_type": "স্নিগ্ধা (এসি)",
            "total_seats": 50,
            "available_seats": random.choice([0, 1, 3]),
            "is_engine": False,
            "badge_color": "bg-cyan-950 text-cyan-300 border-cyan-800"
        },
        {
            "code": "জ",
            "bangla_tag": "বগি 'জ'",
            "type": "SNIGDHA_AC",
            "name": "স্নিগ্ধা এসি চেয়ার",
            "class_type": "স্নিগ্ধা (এসি)",
            "total_seats": 50,
            "available_seats": random.choice([0, 2, 4]),
            "is_engine": False,
            "badge_color": "bg-cyan-950 text-cyan-300 border-cyan-800"
        },
        {
            "code": "ঝ",
            "bangla_tag": "বগি 'ঝ'",
            "type": "AC_BERTH",
            "name": "এসি বার্থ ও স্লিপার",
            "class_type": "এসি বার্থ",
            "total_seats": 36,
            "available_seats": random.choice([0, 1, 2]),
            "is_engine": False,
            "badge_color": "bg-purple-950 text-purple-300 border-purple-800"
        },
        {
            "code": "ঞ",
            "bangla_tag": "বগি 'ঞ'",
            "type": "AC_CABIN",
            "name": "এসি কেবিন (ফার্স্ট ক্লাস)",
            "class_type": "এসি কেবিন",
            "total_seats": 24,
            "available_seats": random.choice([0, 1]),
            "is_engine": False,
            "badge_color": "bg-indigo-950 text-indigo-300 border-indigo-800"
        },
        {
            "code": "ট",
            "bangla_tag": "বগি 'ট'",
            "type": "SHOVAN_CHAIR",
            "name": "শোভন চেয়ার (নন-এসি)",
            "class_type": "শোভন চেয়ার",
            "total_seats": 60,
            "available_seats": random.choice([0, 3, 7]),
            "is_engine": False,
            "badge_color": "bg-emerald-950 text-emerald-300 border-emerald-800"
        },
        {
            "code": "ঠ",
            "bangla_tag": "বগি 'ঠ'",
            "type": "SHOVAN_CHAIR",
            "name": "শোভন চেয়ার (নন-এসি)",
            "class_type": "শোভন চেয়ার",
            "total_seats": 60,
            "available_seats": random.choice([0, 2, 6]),
            "is_engine": False,
            "badge_color": "bg-emerald-950 text-emerald-300 border-emerald-800"
        },
        {
            "code": "ড",
            "bangla_tag": "বগি 'ড'",
            "type": "POWER_CAR",
            "name": "রিভার্স পাওয়ার কার ও ব্রেক ভ্যান",
            "class_type": "পাওয়ার কার",
            "total_seats": 12,
            "available_seats": 0,
            "is_engine": False,
            "badge_color": "bg-rose-950 text-rose-300 border-rose-800"
        }
    ]

    # If return journey to Dhaka, reverse coach list so 'ড' is first after engine, and 'ক' is at the tail
    if is_return_to_hub:
        ordered_coaches = list(reversed(base_coaches))
    else:
        ordered_coaches = list(base_coaches)

    # Locomotive Engine is ALWAYS Position 1 (at the front)
    loco = {
        "position": 1,
        "code": "ইঞ্জিন",
        "bangla_tag": "লোকো",
        "type": "LOCOMOTIVE",
        "name": "লোকোমোটিভ ইঞ্জিন (Class 2900 EMD)",
        "class_type": "লোকোমোটিভ",
        "total_seats": 0,
        "available_seats": 0,
        "is_engine": True,
        "badge_color": "bg-emerald-600 text-white border-emerald-400"
    }

    final_rake = [loco]
    for idx, c in enumerate(ordered_coaches):
        c_copy = dict(c)
        c_copy["position"] = idx + 2
        final_rake.append(c_copy)

    return {
        "coaches": final_rake,
        "is_return_trip": is_return_to_hub,
        "is_ka_at_front": not is_return_to_hub,
        "first_coach_code": "ড" if is_return_to_hub else "ক",
        "last_coach_code": "ক" if is_return_to_hub else "ড",
        "ka_position_text": "ট্রেনের একদম শেষ মাথায় (লেজে)" if is_return_to_hub else "ইঞ্জিনের ঠিক পেছনে (সম্মুখভাগে)",
        "da_position_text": "ইঞ্জিনের ঠিক পেছনে (সম্মুখভাগে)" if is_return_to_hub else "ট্রেনের একদম শেষ মাথায় (লেজে)",
        "orientation_title": f"প্রান্তিক ➔ ঢাকা অভিমুখী (বগি 'ড' শুরুতে, বগি 'ক' লেজে)" if is_return_to_hub else f"ঢাকা ➔ প্রান্তিক অভিমুখী (বগি 'ক' শুরুতে, বগি 'ড' লেজে)",
        "explanation": "বাংলাদেশ রেলওয়ের অফিসিয়াল নিয়ম: ঢাকা থেকে যাওয়ার সময় বগি 'ক' ইঞ্জিনের ঠিক পেছনে (শুরুতে) থাকে। আর ফিরতি যাত্রায় ইঞ্জিন অপর প্রান্তে জোড়ায় বগি 'ড' ইঞ্জিনের পাশে (শুরুতে) থাকে এবং বগি 'ক' ট্রেনের একদম লেজে চলে যায়।"
    }
