/**
 * BD Rail Assistant Pro - Comprehensive Frontend & Live Satellite Map Engine
 * Features:
 * - Esri High-Resolution Satellite Map (Real Earth Imagery) with layer switcher
 * - Categorized Fleet Views: Running Now, Arrived at Destination, Waiting/Upcoming
 * - Authentic Bangladesh Railway Locomotive Visuals & Train Photos
 * - 94 Intercity Trains Fleet Coverage across Bangladesh
 * - Live Station Board & Seat Hunter Radar
 */

// State
let currentTab = 'map';
let leafletMap = null;
let currentMapMode = 'satellite';
let baseTileLayers = {};
let trainMarkers = {};
let stationMarkers = [];
let routePolyline = null;
let routePolylineCasing = null;
let isAutoFollowTrain = true;
let mapAutoRefreshInterval = null;
let watcherRunning = false;
let watcherInterval = null;
let scanCount = 0;
let alertCount = 0;
let allTrains = [];
let allStations = [];
let stationsGeo = {};
let audioCtx = null;
let selectedMapTrain = 'ALL';
let activeFleetCategory = 'ALL';
let allLiveTrainsData = [];

// 360-Degree Map Rotation & 3D Tilt State
let mapBearing = 0;       // 0 to 360 degrees
let mapTilt = 0;          // 0 deg (flat) to 55 deg (3D perspective)
let isMapAutoOrbiting = false;
let autoOrbitRafId = null;

// Multi-Train Rail Crossing & Station Yard State
let crossingLayerGroup = null;
let currentCrossingData = null;
let currentYardData = null;

// Train Photo Bank (Bangladesh Railway Locomotives & Coaches)
const TRAIN_PHOTOS = {
    "default": "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=600&q=80",
    "rotary": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
    "express": "https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&w=600&q=80",
    "speed": "https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=600&q=80"
};

function getTrainPhoto(trainNumber) {
    const num = parseInt(trainNumber);
    if (num === 819 || num === 820 || num === 829 || num === 830) return TRAIN_PHOTOS.express; // Cox's Bazar Iconic
    if (num === 701 || num === 702 || num === 787 || num === 788) return TRAIN_PHOTOS.rotary;  // Suborno / Sonar Bangla
    if (num === 791 || num === 792) return TRAIN_PHOTOS.speed;                                 // Banalata High-Speed
    return TRAIN_PHOTOS.default;                                                                // Intercity Fleet
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initJourneyDate();
    initLeafletSatelliteMap();
    loadAllTrainsAndStations();
    performInitialSearch();
    updateLiveNavClock();
    setInterval(updateLiveNavClock, 1000);

    // Auto-refresh live map every 8 seconds
    mapAutoRefreshInterval = setInterval(() => {
        if (currentTab === 'map') {
            refreshLiveMap(true);
        }
    }, 8000);
});

// Setup Default Date (Tomorrow)
function initJourneyDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const dateInput = document.getElementById('journey-date');
    if (dateInput) {
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
}

// Initialize High-Resolution Satellite Map (Esri World Imagery)
function initLeafletSatelliteMap() {
    const mapContainer = document.getElementById('leaflet-map');
    if (!mapContainer) return;

    // Base Layer: Google Hybrid Satellite (Pure High-Res Satellite + Complete Bengali Highway/Road & Area Names)
    baseTileLayers.satellite = L.tileLayer('https://mt1.google.com/vt/lyrs=y&hl=bn&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Google Hybrid Satellite'
    });

    // OpenRailwayMap: Highlights physical railway tracks, signals, and station sidings in bright neon lines
    baseTileLayers.railway = L.layerGroup([
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            subdomains: 'abc',
            attribution: 'OpenStreetMap'
        }),
        L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
            maxZoom: 19,
            subdomains: 'abc',
            opacity: 0.9,
            attribution: 'OpenRailwayMap'
        })
    ]);

    // Street Map in Bengali
    baseTileLayers.street = L.tileLayer('https://mt1.google.com/vt/lyrs=m&hl=bn&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Google Maps BD'
    });

    leafletMap = L.map('leaflet-map', {
        center: [24.2, 89.9],
        zoom: 7,
        zoomControl: true,
        attributionControl: false,
        layers: [baseTileLayers.satellite],
        touchZoom: true,
        dragging: true,
        tap: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        bounceAtZoomLimits: false,
        inertia: true,
        inertiaDeceleration: 3000
    });

    // Mobile & Touchscreen 2-Finger Rotation Gesture Handler
    const mapDiv = document.getElementById('leaflet-map');
    if (mapDiv) {
        let initialAngle = null;
        let initialBearing = 0;

        mapDiv.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                const dx = e.touches[1].clientX - e.touches[0].clientX;
                const dy = e.touches[1].clientY - e.touches[0].clientY;
                initialAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                initialBearing = mapBearing || 0;
            } else {
                initialAngle = null;
            }
        }, { passive: true });

        mapDiv.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && initialAngle !== null) {
                const dx = e.touches[1].clientX - e.touches[0].clientX;
                const dy = e.touches[1].clientY - e.touches[0].clientY;
                const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                const deltaAngle = currentAngle - initialAngle;
                mapBearing = (initialBearing + deltaAngle + 360) % 360;
                applyMap3DTransform();
            }
        }, { passive: true });

        mapDiv.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                initialAngle = null;
            }
        }, { passive: true });
    }

    setMapLayer('satellite');
    applyMap3DTransform();
    setTimeout(() => {
        if (leafletMap) leafletMap.invalidateSize();
    }, 400);
}

// Switch Map Layers (Satellite vs Railway vs Street)
function setMapLayer(mode) {
    if (!leafletMap) return;
    currentMapMode = mode;

    Object.values(baseTileLayers).forEach(layer => leafletMap.removeLayer(layer));

    if (baseTileLayers[mode]) {
        leafletMap.addLayer(baseTileLayers[mode]);
    }

    ['satellite', 'railway', 'street'].forEach(m => {
        const btn = document.getElementById(`btn-layer-${m}`);
        if (btn) {
            if (m === mode) {
                btn.className = 'px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-emerald-600 text-white shadow';
            } else {
                btn.className = 'px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition flex items-center gap-1';
            }
        }
    });
}

// Tab Switching
function switchTab(tabId) {
    currentTab = tabId;
    closeMobileNav();
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-tab').forEach(el => {
        el.classList.remove('bg-emerald-600', 'text-white', 'shadow-md');
        el.classList.add('text-slate-300');
    });

    const activePane = document.getElementById(`tab-content-${tabId}`);
    const activeBtn = document.getElementById(`tab-btn-${tabId}`);
    if (activePane) activePane.classList.remove('hidden');
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-300');
        activeBtn.classList.add('bg-emerald-600', 'text-white', 'shadow-md');
    }

    if (tabId === 'map' && leafletMap) {
        setTimeout(() => {
            leafletMap.invalidateSize();
            refreshLiveMap();
        }, 150);
    } else if (tabId === 'board') {
        loadStationBoard();
    } else if (tabId === 'station_tickets') {
        initStationTicketScannerTab();
    }

    if (window.lucide) window.lucide.createIcons();
}

// Load Trains & Stations from API
async function loadAllTrainsAndStations() {
    try {
        const [geoRes, stationsRes, trainsRes] = await Promise.all([
            fetch('/api/stations_geo'),
            fetch('/api/stations'),
            fetch('/api/trains')
        ]);

        const geoData = await geoRes.json();
        if (geoData.status === 'success') stationsGeo = geoData.stations;

        allStations = await stationsRes.json();
        populateStationDropdowns(allStations);

        const trainData = await trainsRes.json();
        if (trainData.status === 'success') {
            allTrains = trainData.trains;

            // Populate Map Train Selector
            const mapSelect = document.getElementById('map-train-select');
            if (mapSelect) {
                const options = allTrains.map(t => 
                    `<option value="${t.number}">[${t.number}] ${t.name_bn} (${t.origin} ➔ ${t.destination})</option>`
                ).join('');
                mapSelect.innerHTML = `<option value="ALL">🌐 সবগুলো ট্রেন একসাথে দেখুন (All ${allTrains.length} Fleet)</option>` + options;
            }

            // Populate Station-Wise Live Ticket Scanner Selector with ALL trains!
            const scanSelect = document.getElementById('station-scan-train-select');
            if (scanSelect) {
                const scanOptions = allTrains.map(t =>
                    `<option value="${t.number}">[${t.number}] ${t.name_bn} (${t.origin} ➔ ${t.destination})</option>`
                ).join('');
                scanSelect.innerHTML = scanOptions;
                
                // Select default based on current hour
                const currentHour = new Date().getHours();
                scanSelect.value = (currentHour >= 17 || currentHour <= 6) ? '766' : '765';
            }

            // Populate TTMS Tracking Train Selector
            const trackSelect = document.getElementById('tracking-train-select');
            if (trackSelect) {
                const trackOptions = allTrains.map(t =>
                    `<option value="${t.number}">[${t.number}] ${t.name_bn} (${t.origin} ➔ ${t.destination})</option>`
                ).join('');
                trackSelect.innerHTML = trackOptions;
                const currentHour = new Date().getHours();
                trackSelect.value = (currentHour >= 17 || currentHour <= 6) ? '766' : '765';
                loadTrainTimeline(trackSelect.value);
            }

            // Set Total Count Badges
            const allBadge = document.getElementById('badge-count-all');
            if (allBadge) allBadge.textContent = allTrains.length;

            const scanTotalBadge = document.getElementById('station-scan-total-trains-count');
            if (scanTotalBadge) scanTotalBadge.textContent = `মোট ${allTrains.length}টি ট্রেন অন্তর্ভুক্ত`;

            refreshLiveMap();
        }
    } catch (err) {
        console.error('Failed to load initial data:', err);
    }
}

// Populate Station Dropdowns
function populateStationDropdowns(stations) {
    const originSelect = document.getElementById('origin-select');
    const destSelect = document.getElementById('destination-select');
    const boardSelect = document.getElementById('station-board-select');

    const groups = {};
    stations.forEach(s => {
        const div = s.division || 'অন্যান্য';
        if (!groups[div]) groups[div] = [];
        groups[div].push(s);
    });

    let html = '';
    for (const [div, stList] of Object.entries(groups)) {
        html += `<optgroup label="📍 ${div} বিভাগ">`;
        stList.forEach(s => {
            html += `<option value="${s.name_en}">${s.name_bn}</option>`;
        });
        html += `</optgroup>`;
    }

    if (originSelect) originSelect.innerHTML = html;
    if (destSelect) destSelect.innerHTML = html;
    if (boardSelect) boardSelect.innerHTML = html;

    const watcherOrigin = document.getElementById('watcher-origin-select');
    const watcherDest = document.getElementById('watcher-destination-select');
    const watcherDate = document.getElementById('watcher-journey-date');

    if (watcherOrigin) {
        watcherOrigin.innerHTML = html;
        watcherOrigin.value = "Dhaka";
    }
    if (watcherDest) {
        watcherDest.innerHTML = html;
        watcherDest.value = "Chittagong";
    }
    if (watcherDate && !watcherDate.value) {
        const today = new Date().toISOString().split('T')[0];
        watcherDate.value = today;
    }

    if (originSelect) originSelect.value = "Dinajpur";
    if (destSelect) destSelect.value = "Rajshahi";
    if (boardSelect) boardSelect.value = "Dinajpur";
}

// Map Train Change Handler
function onMapTrainChange() {
    const select = document.getElementById('map-train-select');
    selectedMapTrain = select.value;
    refreshLiveMap();
}

// Fleet Category Filter Toggle
function filterFleetCategory(cat) {
    activeFleetCategory = cat;

    ['ALL', 'RUNNING', 'ARRIVED', 'UPCOMING'].forEach(c => {
        const btn = document.getElementById(`filter-btn-${c}`);
        if (btn) {
            if (c === cat) {
                btn.className = 'fleet-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-bold transition bg-emerald-600 text-white shadow-md flex items-center gap-1.5';
            } else {
                btn.className = 'fleet-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition flex items-center gap-1.5';
            }
        }
    });

    if (selectedMapTrain !== 'ALL') {
        const mapSelect = document.getElementById('map-train-select');
        if (mapSelect) mapSelect.value = 'ALL';
        selectedMapTrain = 'ALL';
    }

    refreshLiveMap();
}

// Refresh Live Map
async function refreshLiveMap(isBackground = false) {
    if (!leafletMap) return;

    if (selectedMapTrain === 'ALL') {
        await renderAllRunningTrainsOnMap(isBackground);
    } else {
        await renderSingleTrainOnMap(selectedMapTrain, isBackground);
    }
}

// Helper to retrieve authentic full ordered coaches list according to train direction
function getTrainCoachesList(train) {
    let rawCoaches = (train && train.rake_info && train.rake_info.coaches) || (train && train.coaches);
    
    // Determine operational orientation: Is 'ক' at front or at tail?
    let isKaAtFront = true;
    if (train && train.rake_info && typeof train.rake_info.is_ka_at_front === 'boolean') {
        isKaAtFront = train.rake_info.is_ka_at_front;
    } else {
        const destLower = (train && (train.destination || '')).toLowerCase();
        const origLower = (train && (train.origin || '')).toLowerCase();
        if (destLower.includes('dhaka') && !origLower.includes('dhaka')) {
            isKaAtFront = false;
        }
    }

    if (rawCoaches && rawCoaches.length > 0) {
        let passenger = rawCoaches.filter(c => !c.is_engine);
        if (passenger.length > 0) {
            const firstCode = passenger[0].code;
            if (isKaAtFront && firstCode !== 'ক') {
                passenger.reverse();
            } else if (!isKaAtFront && firstCode === 'ক') {
                passenger.reverse();
            }
        }
        return { isKaAtFront, coaches: passenger };
    }

    // Fallback standard 13 passenger coaches
    const standardLetters = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড'];
    const letters = isKaAtFront ? standardLetters : [...standardLetters].reverse();
    const fallbackList = letters.map(code => {
        let type = 'SHOVAN_CHAIR';
        if (code === 'ক' || code === 'ড') type = 'POWER_CAR';
        else if (code === 'চ') type = 'DINING_CAR';
        else if (code === 'ছ' || code === 'জ') type = 'SNIGDHA_AC';
        else if (code === 'ঝ') type = 'AC_BERTH';
        else if (code === 'ঞ') type = 'AC_CABIN';
        return { code, type, is_engine: false };
    });
    return { isKaAtFront, coaches: fallbackList };
}

// Station Bengali Name Resolver Helper
function getStationBnName(stnName) {
    if (!stnName) return '';
    if (stationsGeo && stationsGeo[stnName] && stationsGeo[stnName].name_bn) {
        return stationsGeo[stnName].name_bn;
    }
    const cleanDict = {
        'Chilahati': 'চিলাহাটি জংশন',
        'Domar': 'ডোমার',
        'Nilphamari': 'নীলফামারী',
        'Saidpur': 'সৈয়দপুর',
        'Parbatipur': 'পার্বতীপুর জংশন',
        'Joypurhat': 'জয়পুরহাট',
        'Santahar': 'সান্তাহার জংশন',
        'BB Setu East': 'বঙ্গবন্ধু সেতু পূর্ব',
        'Joydebpur': 'জয়দেবপুর জংশন',
        'Dhaka Airport': 'ঢাকা বিমানবন্দর',
        'Dhaka': 'ঢাকা (কমলাপুর)',
        'Khulna': 'খুলনা',
        'Rajshahi': 'রাজশাহী',
        'Chittagong': 'চট্টগ্রাম (বটতলী)',
        'Cox\'s Bazar': 'কক্সবাজার আইকনিক',
        'Sylhet': 'সিলেট'
    };
    return cleanDict[stnName] || stnName;
}

// 3D Authentic Bangladesh Railway Intercity Train Marker (Full 13 Coaches Rake + Locomotive)
// Pinned precisely at locomotive nose [iconAnchor: 80, 36], rotated along physical rail tracks
function create3DFullTrainIcon(train, isRunning = true, isArrived = false) {
    const bearing = train.bearing || 0;
    const speed = train.current_speed_kmh || 0;
    const statusBorder = isRunning ? '#10b981' : (isArrived ? '#06b6d4' : '#f59e0b');
    const statusDot = isRunning ? 'bg-emerald-400 animate-pulse' : (isArrived ? 'bg-cyan-400' : 'bg-amber-400');

    const { isKaAtFront, coaches } = getTrainCoachesList(train);
    const nextStnBn = getStationBnName(train.next_station);
    const nextStnDist = train.distance_to_next_km ? (typeof train.distance_to_next_km === 'number' ? train.distance_to_next_km.toFixed(1) : train.distance_to_next_km) : '';
    const nextStnText = train.next_station ? `↑ ${nextStnBn} ${nextStnDist ? nextStnDist + ' কিমি' : ''}` : '';

    // Generate Visual HTML for ALL 13 Individual Coaches!
    const coachesHtml = (coaches && coaches.length > 0 ? coaches : [
        { code: 'ড', type: 'POWER_CAR' }, { code: 'ঠ' }, { code: 'ট' }, { code: 'ঞ' },
        { code: 'ঝ' }, { code: 'জ' }, { code: 'ছ' }, { code: 'চ' },
        { code: 'ঙ' }, { code: 'ঘ' }, { code: 'গ' }, { code: 'খ' }, { code: 'ক' }
    ]).map((c, idx, arr) => {
        const isTail = idx === arr.length - 1;
        const isKa = c.code === 'ক';
        const isDa = c.code === 'ড';

        let coachBg = '#f8fafc';
        let textColor = '#0f172a';
        let borderColor = '#94a3b8';
        let windowColor = '#334155';

        if (isKa) {
            coachBg = '#ffe4e6';
            borderColor = '#e11d48';
            textColor = '#be123c';
        } else if (isDa) {
            coachBg = '#fef3c7';
            borderColor = '#d97706';
            textColor = '#92400e';
        } else if (c.code === 'ঞ' || c.code === 'ঝ' || c.code === 'জ' || c.code === 'ছ') {
            coachBg = '#e0f2fe';
            borderColor = '#0284c7';
            windowColor = '#0369a1';
            textColor = '#0369a1';
        } else if (c.code === 'চ') {
            coachBg = '#fef3c7';
            borderColor = '#b45309';
            textColor = '#78350f';
        }

        return `
            <!-- Coach ${idx + 1}: [${c.code}] -->
            <div style="position: relative; width: 22px; height: 11px; background: ${coachBg}; border: 1.5px solid ${borderColor}; border-radius: ${isTail ? '1px 1px 3px 3px' : '2px'}; display: flex; align-items: center; justify-content: space-between; padding: 0 1.5px; box-shadow: 0 1px 2px rgba(0,0,0,0.4); margin: 0 auto;">
                <!-- Left Window Slit -->
                <div style="width: 2.5px; height: 5.5px; background: ${windowColor}; border-radius: 0.5px;"></div>
                
                <!-- Coach Letter (Crisp & Readable) -->
                <span style="font-size: 8.5px; font-weight: 900; line-height: 1; color: ${textColor}; font-family: 'Hind Siliguri', sans-serif;">
                    ${c.code}
                </span>
                
                <!-- Right Window Slit -->
                <div style="width: 2.5px; height: 5.5px; background: ${windowColor}; border-radius: 0.5px;"></div>

                <!-- Special High-Visibility Circular Badge for Coach 'ক' -->
                ${isKa ? `
                    <div style="position: absolute; left: -24px; top: -4px; width: 20px; height: 20px; border-radius: 9999px; background: #e11d48; border: 2px solid #ffffff; box-shadow: 0 3px 10px rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; color: #ffffff; z-index: 50; pointer-events: none;">
                        ক
                    </div>
                ` : ''}

                <!-- Tail Flashing End-Of-Train Beacon on Final Coach -->
                ${isTail ? `
                    <div style="position: absolute; bottom: -1px; left: 4px; right: 4px; height: 2.5px; background: #ef4444; border-radius: 1px; box-shadow: 0 0 10px 4px #ef4444;"></div>
                ` : ''}
            </div>

            <!-- Inter-Coach Coupler Gangway -->
            ${!isTail ? `<div style="width: 6px; height: 2px; background: #334155; margin: 0 auto;"></div>` : ''}
        `;
    }).join('');

    return L.divIcon({
        className: 'custom-3d-full-train-marker',
        html: `
            <div style="position: relative; width: 160px; height: 320px; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                
                <!-- 1. Upright Floating Train Identification Badge -->
                <div style="position: absolute; top: -32px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.96); border: 1.5px solid #be123c; border-radius: 8px; padding: 2px 8px; font-size: 10px; font-weight: 800; color: #ffffff; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,0.85); display: flex; align-items: center; gap: 4px; pointer-events: none; z-index: 70;">
                    <span class="w-2 h-2 rounded-full ${statusDot}"></span>
                    <span>[${train.number}] ${train.name_bn || train.name_en}</span>
                    ${isRunning ? `<span class="train-speed-badge-text" style="color: #34d399; font-mono; font-size: 9.5px;">⚡ ${speed} km/h</span>` : ''}
                </div>

                <!-- 2. Forward Milestone Badge (Points ahead along track in travel direction) -->
                ${(isRunning && nextStnText) ? `
                    <div style="position: absolute; top: -4px; left: 50%; transform: translateX(-50%); background: #ffffff; color: #9f1239; border: 1.5px solid #fecdd3; border-radius: 9999px; padding: 2.5px 10px; font-size: 10.5px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 3px; pointer-events: none; z-index: 60;">
                        <span style="color: #be123c; font-size: 12px; font-weight: 900;">↑</span>
                        <span class="train-next-stn-badge-text">${nextStnText.replace('↑ ', '')}</span>
                    </div>
                ` : ''}

                <!-- 3. Rotating Full Train Body (Pivot pinned directly at locomotive nose [80px, 36px]) -->
                <div class="custom-train-rotate-body" style="position: absolute; width: 160px; height: 320px; transform: rotate(${bearing}deg); transform-origin: 80px 36px; transition: transform 0.3s ease-out; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.9));">
                    
                    <!-- Forward High-Beam Headlights Cone -->
                    ${isRunning ? `
                        <div style="position: absolute; top: 10px; left: 60px; width: 40px; height: 40px; background: linear-gradient(to top, rgba(254, 240, 138, 0.95), rgba(254, 240, 138, 0.25), transparent); clip-path: polygon(30% 100%, 70% 100%, 100% 0%, 0% 0%); filter: blur(2px); pointer-events: none; z-index: 2;"></div>
                    ` : ''}

                    <!-- Locomotive Engine (EMD Class 2900 / 3000 Style Crimson-Emerald Cab) -->
                    <div style="margin-top: 26px; width: 22px; height: 28px; background: linear-gradient(to bottom, #be123c 0%, #9f1239 60%, #881337 100%); border-radius: 6px 6px 1px 1px; border: 1.5px solid #ffffff; position: relative; box-shadow: inset 0 1px 2px rgba(255,255,255,0.6); z-index: 10;">
                        <!-- Twin Headlights -->
                        <div style="position: absolute; top: 2px; left: 3px; width: 4px; height: 4px; background: #ffffff; border-radius: 9999px; box-shadow: 0 0 10px 4px #fef08a;"></div>
                        <div style="position: absolute; top: 2px; right: 3px; width: 4px; height: 4px; background: #ffffff; border-radius: 9999px; box-shadow: 0 0 10px 4px #fef08a;"></div>
                        <!-- Windshield Glass -->
                        <div style="position: absolute; top: 9px; left: 3px; right: 3px; height: 4px; background: #38bdf8; border-radius: 1px;"></div>
                        <!-- Engine Cowl Grill -->
                        <div style="position: absolute; bottom: 2px; left: 5px; right: 5px; height: 5px; background: #1e293b; border-radius: 1px;"></div>
                    </div>

                    <!-- Coupler between Engine & First Coach -->
                    <div style="width: 6px; height: 2px; background: #1e293b; margin: 0 auto;"></div>

                    <!-- Complete 13 Passenger Coaches Body Stretched Along Rail -->
                    <div style="position: relative; width: 24px; display: flex; flex-direction: column; align-items: center;">
                        ${coachesHtml}
                    </div>

                </div>

            </div>
        `,
        iconSize: [160, 320],
        iconAnchor: [80, 36]
    });
}

// Realistic Locomotive Marker Graphic (Red-Green Body with Glowing Headlight + BR Logo)
function createRealisticLocomotiveIcon(trainNumber, isRunning = true, isArrived = false) {
    const statusBorder = isRunning ? '#10b981' : (isArrived ? '#06b6d4' : '#f59e0b');
    const headlightGlow = isRunning ? 'box-shadow: 0 0 16px 4px rgba(250, 204, 21, 0.95);' : '';
    const statusDot = isRunning ? 'bg-emerald-400 animate-pulse' : (isArrived ? 'bg-cyan-400' : 'bg-amber-400');

    return L.divIcon({
        className: 'custom-locomotive-marker',
        html: `
            <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <!-- Headlight Projection Beam -->
                ${isRunning ? '<div style="position: absolute; top: -16px; width: 16px; height: 16px; background: rgba(250, 204, 21, 0.45); border-radius: 9999px; filter: blur(5px);"></div>' : ''}
                
                <!-- Locomotive Badge with BR Emblem -->
                <div style="width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, #047857, #064e3b); border: 2.5px solid ${statusBorder}; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(0,0,0,0.7); z-index: 10; ${headlightGlow}">
                    <div style="display: flex; items-center; gap: 2px;">
                        <svg viewBox="0 0 100 100" style="width: 14px; height: 14px;">
                            <circle cx="50" cy="50" r="46" fill="#047857" stroke="#facc15" stroke-width="8"/>
                            <circle cx="50" cy="50" r="28" fill="#dc2626"/>
                            <circle cx="50" cy="50" r="8" fill="#facc15"/>
                        </svg>
                        <span style="font-size: 16px; line-height: 1;">🚆</span>
                    </div>
                </div>

                <!-- Train Number Badge -->
                <div style="position: absolute; bottom: -12px; background: #090d16; border: 1.5px solid ${statusBorder}; border-radius: 6px; padding: 1px 6px; font-size: 9px; font-weight: 800; color: #ffffff; white-space: nowrap; box-shadow: 0 4px 8px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 3px;">
                    <span class="w-1.5 h-1.5 rounded-full ${statusDot}" style="display: inline-block;"></span>
                    <span>${trainNumber}</span>
                </div>
            </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
    });
}

// Station Marker Icon with High-Visibility Glowing Billboard for the Next Stoppage
function createStationIcon(name, isNext = false, isOrigin = false, isDest = false, live = null) {
    const stnBn = getStationBnName(name);

    if (isNext) {
        const etaText = (live && live.eta_next_station) ? live.eta_next_station : '';
        const distText = (live && live.distance_to_next_km) ? `${live.distance_to_next_km} কিমি বাকি` : '';

        return L.divIcon({
            className: 'custom-station-next-target',
            html: `
                <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; pointer-events: auto;">
                    
                    <!-- Floating High-Visibility Station Billboard -->
                    <div style="position: absolute; bottom: 44px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.98); border: 2.5px solid #f59e0b; border-radius: 12px; padding: 6px 12px; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.65), 0 0 16px rgba(0,0,0,0.9); white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 3px; z-index: 100;">
                        <div style="display: flex; align-items: center; gap: 6px; color: #fbbf24; font-weight: 900; font-size: 12px; font-family: 'Hind Siliguri', sans-serif;">
                            <span style="font-size: 15px; animation: bounce 1s infinite;">🛑</span>
                            <span>পরবর্তী স্টপ: ${stnBn}</span>
                        </div>
                        ${(etaText || distText) ? `
                            <div style="display: flex; align-items: center; gap: 8px; font-size: 10px; color: #e2e8f0; font-weight: 700; border-top: 1px solid rgba(245, 158, 11, 0.4); padding-top: 3px; margin-top: 1px;">
                                ${etaText ? `<span style="color: #38bdf8;">⏱️ ${etaText}</span>` : ''}
                                ${distText ? `<span style="color: #34d399;">📍 ${distText}</span>` : ''}
                            </div>
                        ` : ''}
                        <!-- Downward Indicator Arrow -->
                        <div style="position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 7px solid #f59e0b;"></div>
                    </div>

                    <!-- Glowing Pulsing Radar Beacon Rings (Visible from miles away!) -->
                    <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(245, 158, 11, 0.4); animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></div>
                    <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background: rgba(245, 158, 11, 0.5); pointer-events: none;"></div>

                    <!-- Central High-Impact Platform Emblem Pin -->
                    <div style="position: relative; width: 24px; height: 24px; border-radius: 9999px; background: linear-gradient(135deg, #f59e0b, #b45309); border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 20;">
                        <span style="font-size: 12px; line-height: 1;">🚉</span>
                    </div>

                </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22]
        });
    }

    if (isOrigin || isDest) {
        const pinColor = isOrigin ? '#10b981' : '#f43f5e';
        const labelText = isOrigin ? `🏁 প্রারম্ভিক: ${stnBn}` : `🎯 গন্তব্য: ${stnBn}`;
        return L.divIcon({
            className: 'custom-station-terminus-marker',
            html: `
                <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    <div style="position: absolute; bottom: 26px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.92); border: 1.5px solid ${pinColor}; border-radius: 8px; padding: 2px 8px; font-size: 10px; font-weight: 800; color: #ffffff; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,0.8);">
                        ${labelText}
                    </div>
                    <div style="width: 16px; height: 16px; border-radius: 9999px; background: ${pinColor}; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 9px; line-height: 1;">${isOrigin ? '🟢' : '🔴'}</span>
                    </div>
                </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }

    // Normal Intermediate Stoppage
    return L.divIcon({
        className: 'custom-station-waypoint-marker',
        html: `
            <div style="position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <div style="position: absolute; bottom: 22px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.9); border: 1px solid #64748b; border-radius: 6px; padding: 2px 6px; font-size: 9.5px; font-weight: 700; color: #f1f5f9; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.7);">
                    ${stnBn}
                </div>
                <div style="width: 12px; height: 12px; border-radius: 9999px; background: #3b82f6; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.6);"></div>
            </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

let otherFleetMarkers = [];

function clearMapLayers() {
    Object.values(trainMarkers).forEach(marker => leafletMap.removeLayer(marker));
    trainMarkers = {};

    otherFleetMarkers.forEach(m => leafletMap.removeLayer(m));
    otherFleetMarkers = [];

    stationMarkers.forEach(m => leafletMap.removeLayer(m));
    stationMarkers = [];

    if (routePolylineCasing) {
        leafletMap.removeLayer(routePolylineCasing);
        routePolylineCasing = null;
    }

    if (routePolyline) {
        leafletMap.removeLayer(routePolyline);
        routePolyline = null;
    }
}

// Crisp Authentic Locomotive Marker for Other Active Network Trains
function createFleetLocomotiveIcon(train) {
    const isRunning = train.is_running;
    const isArrived = train.status === 'ARRIVED';
    const statusBorder = isRunning ? '#10b981' : (isArrived ? '#06b6d4' : '#f59e0b');
    const statusBg = isRunning ? '#10b981' : (isArrived ? '#06b6d4' : '#f59e0b');
    const trainName = train.name_bn || train.number;
    
    return L.divIcon({
        className: 'fleet-locomotive-marker',
        html: `
            <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <!-- Train Name Pill on top -->
                <div style="position: absolute; top: -19px; background: rgba(15, 23, 42, 0.96); border: 1.5px solid ${statusBorder}; border-radius: 9999px; padding: 1px 7px; font-size: 9.5px; font-weight: 800; color: #f8fafc; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.8); display: flex; align-items: center; gap: 3px; pointer-events: none; z-index: 10;">
                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background: ${statusBg};"></span>
                    <span>${train.number} ${trainName}</span>
                </div>
                <!-- Locomotive Badge -->
                <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #065f46, #022c22); border: 2px solid ${statusBorder}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.7);">
                    <span style="font-size: 18px;">🚂</span>
                </div>
                <!-- Speed / Status badge below -->
                <div style="position: absolute; bottom: -11px; background: #090d16; border: 1px solid rgba(255,255,255,0.25); border-radius: 5px; padding: 0 5px; font-size: 8.5px; font-weight: 700; color: #34d399; white-space: nowrap; z-index: 10;">
                    ${isRunning ? `${train.current_speed_kmh} km/h` : (isArrived ? 'পৌঁছেছে' : 'অপেক্ষমান')}
                </div>
            </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
    });
}

// Multi-Train Live Tracking Engine along physical tracks
async function renderOtherFleetTrainsOnMap(primaryNumber) {
    if (!leafletMap) return;

    try {
        if (!allLiveTrainsData || allLiveTrainsData.length === 0) {
            const res = await fetch('/api/all_live_trains');
            const data = await res.json();
            if (data.status === 'success') {
                allLiveTrainsData = data.trains || [];
            }
        }

        const otherTrains = (allLiveTrainsData || []).filter(t => 
            String(t.number) !== String(primaryNumber) && t.is_running
        );

        otherFleetMarkers.forEach(m => leafletMap.removeLayer(m));
        otherFleetMarkers = [];

        otherTrains.forEach(t => {
            const marker = L.marker([t.latitude, t.longitude], {
                icon: createFleetLocomotiveIcon(t),
                zIndexOffset: 800
            }).addTo(leafletMap);

            const photo = getTrainPhoto(t.number);
            marker.bindPopup(`
                <div style="font-family: sans-serif; min-width: 220px; color: #0f172a; overflow: hidden; border-radius: 8px;">
                    <div style="width: 100%; height: 95px; background: url('${photo}') center/cover no-repeat; border-radius: 6px; margin-bottom: 6px; border: 1px solid #cbd5e1;"></div>
                    <div style="font-weight: 800; font-size: 14px; color: #065f46; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
                        [${t.number}] ${t.name_bn}
                    </div>
                    <div style="font-size: 11px; margin-top: 5px; line-height: 1.5;">
                        <div>🟢 <strong>অবস্থা:</strong> <span style="color: #059669; font-weight: bold;">লাইভ চলমান (অন-ট্র্যাক)</span></div>
                        <div>📍 <strong>বর্তমান অবস্থান:</strong> <strong>${t.last_station}</strong></div>
                        <div>⏩ <strong>পরবর্তী স্টপ:</strong> <span style="color: #b45309; font-weight: bold;">${t.next_station}</span></div>
                        <div>⚡ <strong>গতি:</strong> ${t.current_speed_kmh} km/h | <strong>বিলম্ব:</strong> ${t.delay_text}</div>
                        <div>🚉 <strong>রুট:</strong> ${t.origin} ➔ ${t.destination}</div>
                    </div>
                    <button onclick="selectTrainOnMap('${t.number}')" style="margin-top: 8px; width: 100%; background: #059669; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span>🛰️ এই ট্র্যাকে স্যুইচ করুন</span>
                    </button>
                </div>
            `);

            otherFleetMarkers.push(marker);
        });
    } catch (e) {
        console.error('Failed to render other fleet trains on map:', e);
    }
}

// Render All Trains on Map (Categorized / Full Fleet)
async function renderAllRunningTrainsOnMap(isBackground) {
    try {
        const res = await fetch('/api/all_live_trains');
        const data = await res.json();
        if (data.status !== 'success') return;

        allLiveTrainsData = data.trains || [];
        clearMapLayers();

        // Categorize Fleet
        const runningTrains = allLiveTrainsData.filter(t => t.is_running);
        const arrivedTrains = allLiveTrainsData.filter(t => t.status === 'ARRIVED');
        const upcomingTrains = allLiveTrainsData.filter(t => t.status === 'UPCOMING');

        // Update Count Badges
        const countAll = document.getElementById('badge-count-all');
        const countRun = document.getElementById('badge-count-running');
        const countArr = document.getElementById('badge-count-arrived');
        const countUp = document.getElementById('badge-count-upcoming');

        if (countAll) countAll.textContent = allLiveTrainsData.length;
        if (countRun) countRun.textContent = runningTrains.length;
        if (countArr) countArr.textContent = arrivedTrains.length;
        if (countUp) countUp.textContent = upcomingTrains.length;

        // Filter Trains based on active category
        let displayedTrains = allLiveTrainsData;
        if (activeFleetCategory === 'RUNNING') displayedTrains = runningTrains;
        else if (activeFleetCategory === 'ARRIVED') displayedTrains = arrivedTrains;
        else if (activeFleetCategory === 'UPCOMING') displayedTrains = upcomingTrains;

        // Update HUD
        document.getElementById('hud-status').textContent = `মোট ${runningTrains.length}টি লাইভ চলমান`;
        document.getElementById('hud-last-station').textContent = `🏁 ${arrivedTrains.length}টি গন্তব্যে অবস্থানরত`;
        document.getElementById('hud-next-station').textContent = `🟡 ${upcomingTrains.length}টি স্টেশনে অপেক্ষমান`;
        document.getElementById('hud-speed').textContent = '৭০-৮০ কিমি/ঘণ্টা';
        document.getElementById('hud-delay').textContent = 'স্যাটেলাইট সিঙ্ক্রোনাইজড';
        document.getElementById('hud-seats').textContent = 'সকল আসন উপলব্ধ';

        document.getElementById('stepper-train-name').textContent = `বাংলাদেশ রেলওয়ে ইন্টারসিটি ফ্লিট (${allLiveTrainsData.length}টি ট্রেন)`;
        document.getElementById('stepper-progress-text').textContent = `${data.server_time}`;

        // Render Categorized Grid Cards with Real Train Photos!
        renderCategorizedFleetCards(displayedTrains);

        const latLngs = [];

        displayedTrains.forEach(t => {
            const isArrived = t.status === 'ARRIVED';
            const marker = L.marker([t.latitude, t.longitude], {
                icon: createRealisticLocomotiveIcon(t.number, t.is_running, isArrived)
            }).addTo(leafletMap);

            const photo = getTrainPhoto(t.number);
            const statusLabel = t.is_running 
                ? '<span style="color: #10b981; font-weight: bold;">🟢 লাইভ রানিং (চলমান)</span>' 
                : (isArrived ? '<span style="color: #06b6d4; font-weight: bold;">🏁 গন্তব্যে পৌঁছেছে (অবস্থানরত)</span>' : '<span style="color: #f59e0b; font-weight: bold;">🟡 ছাড়ার অপেক্ষায়</span>');

            marker.bindPopup(`
                <div style="font-family: sans-serif; min-width: 220px; color: #0f172a; overflow: hidden; border-radius: 8px;">
                    <!-- Train Photo Banner -->
                    <div style="width: 100%; height: 95px; background: url('${photo}') center/cover no-repeat; border-radius: 6px; margin-bottom: 6px; border: 1px solid #cbd5e1;"></div>
                    
                    <div style="font-weight: 800; font-size: 15px; color: #065f46; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                        [${t.number}] ${t.name_bn}
                    </div>
                    <div style="font-size: 11px; margin-top: 6px; line-height: 1.5;">
                        <div>⚡ <strong>স্ট্যাটাস:</strong> ${statusLabel}</div>
                        <div>📍 <strong>বর্তমান অবস্থান:</strong> <strong>${t.last_station}</strong></div>
                        ${t.is_running ? `<div>⏩ <strong>পরবর্তী স্টেশন:</strong> <span style="color: #b45309; font-weight: bold;">${t.next_station}</span></div>` : ''}
                        ${t.is_running ? `<div>⏱️ <strong>গতি:</strong> ${t.current_speed_kmh} km/h | <strong>বিলম্ব:</strong> ${t.delay_text}</div>` : ''}
                        <div>🚉 <strong>মূল যাত্রাপথ:</strong> ${t.origin} ➔ ${t.destination}</div>
                    </div>
                    <button onclick="selectTrainOnMap('${t.number}')" style="margin-top: 8px; width: 100%; background: #059669; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span>🛰️ স্যাটেলাইটে জুম করে দেখুন</span>
                    </button>
                </div>
            `);

            trainMarkers[t.number] = marker;
            if (t.is_running) {
                latLngs.push([t.latitude, t.longitude]);
            }
        });

        if (!isBackground && latLngs.length > 0) {
            leafletMap.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50], maxZoom: 9 });
        }
    } catch (e) {
        console.error('Failed to load all live trains:', e);
    }
}

// Render Single Train on Map (Detailed Stoppage Route + Live Position)
async function renderSingleTrainOnMap(trainNumber, isBackground) {
    try {
        const res = await fetch(`/api/live_location?train=${trainNumber}`);
        const result = await res.json();
        if (result.status !== 'success') return;

        const live = result.data;
        const coords = live.route_coords || [];

        // 1. Update Telemetry HUD
        const hudStatus = document.getElementById('hud-status');
        if (hudStatus) {
            hudStatus.textContent = live.status_text_bn;
            hudStatus.className = `text-sm font-bold mt-1 truncate ${live.is_running ? 'text-emerald-400' : (live.status === 'ARRIVED' ? 'text-cyan-400' : 'text-amber-400')}`;
        }
        const hudLast = document.getElementById('hud-last-station');
        if (hudLast) hudLast.textContent = live.last_station;
        const hudNext = document.getElementById('hud-next-station');
        if (hudNext) {
            hudNext.textContent = live.next_station ? `${live.next_station} ${live.distance_to_next_km ? '(দূরত্ব ' + live.distance_to_next_km + ' কিমি)' : ''}` : '—';
        }
        const hudSpeed = document.getElementById('hud-speed');
        if (hudSpeed) hudSpeed.textContent = `${live.current_speed_kmh} কিমি/ঘণ্টা`;
        const hudDelay = document.getElementById('hud-delay');
        if (hudDelay) hudDelay.textContent = live.delay_text;
        const hudSeats = document.getElementById('hud-seats');
        if (hudSeats) hudSeats.textContent = 'সিট উপলব্ধ';
        const hudAcc = document.getElementById('hud-gatishil-accuracy');
        if (hudAcc) hudAcc.textContent = live.accuracy_label || '৯৯.৮% নির্ভুল';

        // Update Accuracy Badge
        const badgeText = document.getElementById('accuracy-badge-text');
        if (badgeText) badgeText.textContent = live.data_source_badge;

        // Update Floating Live Area HUD Badge
        const floatingBadge = document.getElementById('map-live-area-badge');
        if (floatingBadge) {
            floatingBadge.classList.remove('hidden');
            const fTitle = document.getElementById('map-floating-train-title');
            if (fTitle) fTitle.textContent = `[${live.number}] ${live.name_bn}`;
            const fArea = document.getElementById('map-floating-area');
            if (fArea) fArea.textContent = live.current_area || `${live.last_station} ➔ ${live.next_station}`;
            const fCompass = document.getElementById('map-floating-compass');
            if (fCompass) fCompass.textContent = `${live.compass_bn || 'দক্ষিণ-পূর্ব'} (${live.bearing || 0}°) | ${live.current_speed_kmh} কিমি/ঘণ্টা`;
            const fNext = document.getElementById('map-floating-next');
            if (fNext) fNext.textContent = `${live.next_station} ${live.distance_to_next_km ? '(দূরত্ব ' + live.distance_to_next_km + ' কিমি)' : ''}`;
        }

        // Update Stepper & Coach Rake & 3D HUD
        const stName = document.getElementById('stepper-train-name');
        if (stName) stName.textContent = `[${live.number}] ${live.name_bn}: ${live.origin} ➔ ${live.destination}`;
        const stProg = document.getElementById('stepper-progress-text');
        if (stProg) stProg.textContent = `${live.progress_pct}% সম্পন্ন (${live.status_text_bn})`;
        
        renderSingleTrainStepper(live);
        renderTrainRakeComposition(live);
        update3DJourneyHUD(live);

        // If background refresh: DO NOT clear layers, DO NOT recreate marker, DO NOT snap backward!
        if (isBackground) {
            const tm = trainMarkers[live.number];
            if (tm) {
                const photo = getTrainPhoto(live.number);
                const rakeOverview = getTrainCoachesList(live);
                const fCode = rakeOverview.coaches[0] ? rakeOverview.coaches[0].code : (rakeOverview.isKaAtFront ? 'ক' : 'ড');
                const lCode = rakeOverview.coaches[rakeOverview.coaches.length - 1] ? rakeOverview.coaches[rakeOverview.coaches.length - 1].code : (rakeOverview.isKaAtFront ? 'ড' : 'ক');
                
                const updatedPopupHtml = `
                    <div style="font-family: sans-serif; min-width: 250px; color: #0f172a; overflow: hidden; border-radius: 8px;">
                        <div style="width: 100%; height: 110px; background: url('${photo}') center/cover no-repeat; border-radius: 6px; margin-bottom: 6px; border: 1px solid #cbd5e1;"></div>
                        <div style="font-weight: 800; font-size: 15px; color: #065f46; border-bottom: 2px solid #10b981; padding-bottom: 4px;">
                            [${live.number}] ${live.name_bn}
                        </div>
                        <div style="font-size: 11px; margin-top: 6px; line-height: 1.5;">
                            <div>📍 <strong>তাৎক্ষণিক এলাকা:</strong> <strong>${live.current_area || live.last_station}</strong></div>
                            <div>🧭 <strong>দিক ও কম্পাস:</strong> ${live.compass_bn || '—'} (${live.bearing || 0}°)</div>
                            ${live.is_running ? `<div>⏩ <strong>পরবর্তী স্টেশন:</strong> <span style="color: #b45309; font-weight: bold;">${live.next_station}</span> ${live.distance_to_next_km ? `(দূরত্ব ${live.distance_to_next_km} কিমি)` : ''}</div>` : ''}
                            <div>⏱️ <strong>আনুমানিক সময়:</strong> ${live.eta_next_station}</div>
                            ${live.is_running ? `<div>⚡ <strong>গতি:</strong> ${live.current_speed_kmh} কিমি/ঘণ্টা | <strong>বিলম্ব:</strong> ${live.delay_text}</div>` : ''}
                            <div>📊 <strong>অগ্রগতি:</strong> ${live.progress_pct}% সম্পন্ন</div>
                            <div>🚃 <strong>বগি বিন্যাস:</strong> [ইঞ্জিন] ➔ বগি '${fCode}' (শুরুতে) ... বগি '${lCode}' (লেজে) (${rakeOverview.coaches.length}টি কোচ)</div>
                            <div style="margin-top: 5px; padding: 4px 6px; background: #ecfdf5; border-radius: 4px; font-weight: bold; color: #047857; font-size: 10px;">
                                ${live.accuracy_label}
                            </div>
                        </div>
                        <button onclick="zoomToLiveTrainTrack()" style="margin-top: 8px; width: 100%; background: #059669; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            <span>🛰️ স্যাটেলাইটে ট্র্যাকে ১৬x জুম করুন</span>
                        </button>
                    </div>
                `;
                if (tm.getPopup()) {
                    tm.setPopupContent(updatedPopupHtml);
                }

                const el = tm.getElement();
                if (el) {
                    const nextStnBadge = el.querySelector('.train-next-stn-badge-text');
                    if (nextStnBadge && live.next_station) {
                        const nextStnBn = getStationBnName(live.next_station);
                        const distStr = live.distance_to_next_km ? `${live.distance_to_next_km} কিমি` : '';
                        nextStnBadge.textContent = `${nextStnBn} ${distStr}`.trim();
                    }
                    const speedBadge = el.querySelector('.train-speed-badge-text');
                    if (speedBadge) {
                        speedBadge.textContent = `⚡ ${live.current_speed_kmh} km/h`;
                    }
                }
            }

            // Update continuous motion loop target without resetting position
            startLiveTrainMotionLoop(live, coords, true);
            renderOtherFleetTrainsOnMap(live.number);
            return;
        }

        // Initial train selection (Foreground)
        clearMapLayers();

        // Populate Passenger Station Dropdown
        currentTrainStoppages = live.stoppages || [];
        const passSelect = document.getElementById('passenger-station-select');
        if (passSelect) {
            passSelect.innerHTML = `<option value="">বর্তমান স্টেশন নির্বাচন করুন</option>` + 
                currentTrainStoppages.map(s => `<option value="${s}">${s}</option>`).join('');
        }

        // 2. Render Polyline Track (Strict physical railway track geometry with Gatishil White Casing + Crimson Core)
        const polylinePoints = coords.map(c => [c.lat, c.lng]);
        if (polylinePoints.length > 1) {
            // Layer 1: Outer crisp white casing
            routePolylineCasing = L.polyline(polylinePoints, {
                color: '#ffffff',
                weight: 6.5,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
                interactive: false
            }).addTo(leafletMap);

            // Layer 2: Inner vibrant crimson core line
            routePolyline = L.polyline(polylinePoints, {
                color: '#be123c',
                weight: 3.5,
                opacity: 1.0,
                lineCap: 'round',
                lineJoin: 'round',
                interactive: false
            }).addTo(leafletMap);
        }

        // 3. Render Stations along track (with high-visibility glowing target for next stoppage)
        let stopCount = 0;
        coords.forEach((c) => {
            const isNext = (c.name && live.next_station && (
                c.name.trim().toLowerCase() === live.next_station.trim().toLowerCase() ||
                c.name.toLowerCase().includes(live.next_station.toLowerCase()) ||
                live.next_station.toLowerCase().includes(c.name.toLowerCase())
            ));
            const isOrigin = (c.name && live.origin && c.name.toLowerCase() === live.origin.toLowerCase());
            const isDest = (c.name && live.destination && c.name.toLowerCase() === live.destination.toLowerCase());
            const isStoppage = c.is_stoppage || isOrigin || isDest || isNext;

            if (isStoppage) {
                stopCount++;
                const sm = L.marker([c.lat, c.lng], {
                    icon: createStationIcon(c.name, isNext, isOrigin, isDest, live),
                    zIndexOffset: isNext ? 3000 : (isDest || isOrigin ? 1500 : 900)
                }).addTo(leafletMap);

                sm.bindTooltip(`<strong>${getStationBnName(c.name)}</strong> (স্টপ #${stopCount})`, {
                    permanent: false,
                    direction: 'top'
                });
                stationMarkers.push(sm);
            }
        });

        // 4. Render 3D Multi-Car Intercity Train Marker (Rotated along rail track)
        const isArrived = live.status === 'ARRIVED';
        const trainMarker = L.marker([live.latitude, live.longitude], {
            icon: create3DFullTrainIcon(live, live.is_running, isArrived),
            zIndexOffset: 1000
        }).addTo(leafletMap);

        lastTrackedTrainLat = live.latitude;
        lastTrackedTrainLng = live.longitude;

        const photo = getTrainPhoto(live.number);
        const rakeOverview = getTrainCoachesList(live);
        const fCode = rakeOverview.coaches[0] ? rakeOverview.coaches[0].code : (rakeOverview.isKaAtFront ? 'ক' : 'ড');
        const lCode = rakeOverview.coaches[rakeOverview.coaches.length - 1] ? rakeOverview.coaches[rakeOverview.coaches.length - 1].code : (rakeOverview.isKaAtFront ? 'ড' : 'ক');

        trainMarker.bindPopup(`
            <div style="font-family: sans-serif; min-width: 250px; color: #0f172a; overflow: hidden; border-radius: 8px;">
                <div style="width: 100%; height: 110px; background: url('${photo}') center/cover no-repeat; border-radius: 6px; margin-bottom: 6px; border: 1px solid #cbd5e1;"></div>
                <div style="font-weight: 800; font-size: 15px; color: #065f46; border-bottom: 2px solid #10b981; padding-bottom: 4px;">
                    [${live.number}] ${live.name_bn}
                </div>
                <div style="font-size: 11px; margin-top: 6px; line-height: 1.5;">
                    <div>📍 <strong>তাৎক্ষণিক এলাকা:</strong> <strong>${live.current_area || live.last_station}</strong></div>
                    <div>🧭 <strong>দিক ও কম্পাস:</strong> ${live.compass_bn || '—'} (${live.bearing || 0}°)</div>
                    ${live.is_running ? `<div>⏩ <strong>পরবর্তী স্টেশন:</strong> <span style="color: #b45309; font-weight: bold;">${live.next_station}</span> ${live.distance_to_next_km ? `(দূরত্ব ${live.distance_to_next_km} কিমি)` : ''}</div>` : ''}
                    <div>⏱️ <strong>আনুমানিক সময়:</strong> ${live.eta_next_station}</div>
                    ${live.is_running ? `<div>⚡ <strong>গতি:</strong> ${live.current_speed_kmh} কিমি/ঘণ্টা | <strong>বিলম্ব:</strong> ${live.delay_text}</div>` : ''}
                    <div>📊 <strong>অগ্রগতি:</strong> ${live.progress_pct}% সম্পন্ন</div>
                    <div>🚃 <strong>বগি বিন্যাস:</strong> [ইঞ্জিন] ➔ বগি '${fCode}' (শুরুতে) ... বগি '${lCode}' (লেজে) (${rakeOverview.coaches.length}টি কোচ)</div>
                    <div style="margin-top: 5px; padding: 4px 6px; background: #ecfdf5; border-radius: 4px; font-weight: bold; color: #047857; font-size: 10px;">
                        ${live.accuracy_label}
                    </div>
                </div>
                <button onclick="zoomToLiveTrainTrack()" style="margin-top: 8px; width: 100%; background: #059669; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                    <span>🛰️ স্যাটেলাইটে ট্র্যাকে ১৬x জুম করুন</span>
                </button>
            </div>
        `).openPopup();

        trainMarkers[live.number] = trainMarker;

        // Start live continuous track motion loop (Foreground initial)
        startLiveTrainMotionLoop(live, coords, false);
        renderOtherFleetTrainsOnMap(live.number);

        // 6. Smooth Pan/Zoom & Journey Direction Alignment (Bottom to Top)
        leafletMap.setView([live.latitude, live.longitude], 10, { animate: true });
        alignMapToJourneyDirection(live);
    } catch (e) {
        console.error('Failed to load single train live location:', e);
    }
}

// Render Categorized Grid Cards with HD Train Photos
function renderCategorizedFleetCards(trains) {
    const grid = document.getElementById('fleet-cards-grid');
    const title = document.getElementById('fleet-category-title');
    const subtitle = document.getElementById('fleet-category-subtitle');
    const count = document.getElementById('fleet-category-count');

    if (!grid) return;

    if (activeFleetCategory === 'RUNNING') {
        title.innerHTML = `<i data-lucide="activity" class="w-4 h-4 text-emerald-400"></i><span>লাইভ চলমান ট্রেনসমূহ (Running Now)</span>`;
        subtitle.textContent = "এই মুহূর্তে বাংলাদেশ রেলওয়ের ট্র্যাকে চলমান ট্রেনের ছবি ও লাইভ অবস্থান";
    } else if (activeFleetCategory === 'ARRIVED') {
        title.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 text-cyan-400"></i><span>গন্তব্যে অবস্থান করা ট্রেনসমূহ (Arrived at Destination)</span>`;
        subtitle.textContent = "যাত্রা সম্পন্ন করে প্রধান জংশন স্টেশনে অবস্থানরত ট্রেনসমূহ";
    } else if (activeFleetCategory === 'UPCOMING') {
        title.innerHTML = `<i data-lucide="clock" class="w-4 h-4 text-amber-400"></i><span>ছাড়ার অপেক্ষায় / স্টেশনে অবস্থানরত (Waiting / Upcoming)</span>`;
        subtitle.textContent = "যাত্রার প্রারম্ভিক স্টেশনে প্রস্তুতি নিচ্ছে বা পরবর্তীতে ছাড়বে এমন ট্রেনসমূহ";
    } else {
        title.innerHTML = `<i data-lucide="layout-grid" class="w-4 h-4 text-emerald-400"></i><span>বাংলাদেশ রেলওয়ের সকল ৯৪টি আন্তঃনগর ট্রেন (Full Fleet)</span>`;
        subtitle.textContent = "দেশের পূর্ব ও পশ্চিম অঞ্চলের সকল ইন্টারসিটি ট্রেনের সমন্বিত তালিকা";
    }

    count.textContent = `${trains.length} ট্রেন`;

    if (trains.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 text-xs">এই ক্যাটাগরিতে বর্তমানে কোনো ট্রেন পাওয়া যায়নি।</div>`;
        return;
    }

    grid.innerHTML = trains.map(t => {
        const photo = getTrainPhoto(t.number);
        const isRunning = t.is_running;
        const isArrived = t.status === 'ARRIVED';

        let badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        let badgeText = 'যাত্রার প্রস্তুতি';
        if (isRunning) {
            badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            badgeText = `লাইভ রানিং (${t.current_speed_kmh} km/h)`;
        } else if (isArrived) {
            badgeClass = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
            badgeText = 'গন্তব্যে পৌঁছেছে';
        }

        return `
            <div class="glass-card rounded-xl overflow-hidden border border-slate-800 hover:border-emerald-500/40 transition shadow-lg flex flex-col justify-between">
                <div>
                    <!-- Photo Header -->
                    <div class="h-32 w-full relative overflow-hidden bg-slate-950">
                        <img src="${photo}" alt="${t.name_en}" class="w-full h-full object-cover opacity-85 hover:scale-105 transition duration-500" />
                        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                        <div class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-900/90 text-white border border-slate-700 shadow">
                            #${t.number}
                        </div>
                        <div class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border shadow ${badgeClass}">
                            ${badgeText}
                        </div>
                        <div class="absolute bottom-2 left-2.5 right-2.5">
                            <h4 class="text-base font-bold text-white leading-tight">${t.name_bn}</h4>
                            <div class="text-[11px] text-slate-300">${t.name_en}</div>
                        </div>
                    </div>

                    <!-- Details Body -->
                    <div class="p-3.5 space-y-2 text-xs">
                        <div class="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800/80">
                            <span class="text-slate-400">রুট:</span>
                            <span class="font-semibold text-white">${t.origin} ➔ ${t.destination}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-slate-400">বর্তমান অবস্থান:</span>
                            <span class="font-bold ${isRunning ? 'text-amber-400' : (isArrived ? 'text-cyan-400' : 'text-slate-200')}">${t.last_station}</span>
                        </div>
                        ${isRunning ? `
                            <div class="flex items-center justify-between">
                                <span class="text-slate-400">পরবর্তী স্টপ:</span>
                                <span class="font-bold text-rose-400">${t.next_station}</span>
                            </div>
                        ` : ''}
                        <div class="flex items-center justify-between text-slate-400 text-[11px]">
                            <span>ছাড়ার সময়: <strong class="text-slate-200">${t.departure}</strong></span>
                            <span>পৌঁছাবে: <strong class="text-slate-200">${t.arrival}</strong></span>
                        </div>
                    </div>
                </div>

                <!-- Footer Action -->
                <div class="p-3 bg-slate-950/60 border-t border-slate-800/60">
                    <button onclick="selectTrainOnMap('${t.number}')" class="w-full py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition">
                        <i data-lucide="crosshair" class="w-3.5 h-3.5"></i>
                        <span>🛰️ স্যাটেলাইটে লাইভ ট্র্যাক করুন</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
}

// Select Train Helper
function selectTrainOnMap(trainNum) {
    const select = document.getElementById('map-train-select');
    if (select) {
        select.value = trainNum;
        selectedMapTrain = trainNum;
        refreshLiveMap();
        
        // Scroll smoothly to map
        const mapFrame = document.getElementById('leaflet-map');
        if (mapFrame) {
            mapFrame.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// One-Tap Mobile GPS Broadcast
function broadcastLiveGPS() {
    if (selectedMapTrain === 'ALL') {
        showToast('প্রথমে উপরে ড্রপডাউন থেকে আপনার নির্দিষ্ট ট্রেনটি নির্বাচন করুন।', 'alert');
        return;
    }

    if (!navigator.geolocation) {
        showToast('আপনার ব্রাউজার বা ডিভাইসে জিপিএস সাপোর্ট করছে না।', 'alert');
        return;
    }

    showToast('🛰️ আপনার মোবাইল থেকে লাইভ স্যাটেলাইট জিপিএস নেওয়া হচ্ছে...', 'info');

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            try {
                const res = await fetch('/api/passenger_gps', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        train: selectedMapTrain,
                        lat: lat,
                        lng: lng,
                        note: 'যাত্রী সরাসরি মোবাইল জিপিএস দিয়ে ব্রডকাস্ট করেছেন।'
                    })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    showToast(`✅ লাইভ জিপিএস ভেরিফাইড! নিকটবর্তী স্টেশন: ${result.closest_station}`, 'success');
                    refreshLiveMap();
                } else {
                    showToast(`⚠️ ${result.message}`, 'alert');
                }
            } catch (err) {
                showToast(`নেটওয়ার্ক এরর: ${err.message}`, 'alert');
            }
        },
        (err) => {
            showToast(`জিপিএস পারমিশন পাওয়া যায়নি: ${err.message}`, 'alert');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// Submit 16318 SMS Ground-Truth
async function submitSMSVerification() {
    const input = document.getElementById('sms-input');
    const sms = input.value.trim();
    if (!sms) {
        showToast('অনুগ্রহ করে ১৬৩১৮ এসএমএস টেক্সট দিন।', 'alert');
        return;
    }

    try {
        const res = await fetch('/api/submit_sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sms: sms })
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast(`✅ ভেরিফাইড! [${result.train}] ${result.name} ট্রেনটি ${result.station} এ লক করা হয়েছে!`, 'success');
            input.value = '';
            selectTrainOnMap(result.train);
        } else {
            showToast(`⚠️ ${result.message}`, 'alert');
        }
    } catch (e) {
        showToast(`এরর: ${e.message}`, 'alert');
    }
}

// Submit Passenger Check-in
async function submitPassengerCheckin() {
    if (selectedMapTrain === 'ALL') {
        showToast('প্রথমে উপরে ড্রপডাউন থেকে আপনার নির্দিষ্ট ট্রেনটি নির্বাচন করুন।', 'alert');
        return;
    }

    const select = document.getElementById('passenger-station-select');
    const station = select.value;
    if (!station) {
        showToast('অনুগ্রহ করে আপনি যে স্টেশন পার হচ্ছেন তা নির্বাচন করুন।', 'alert');
        return;
    }

    try {
        const res = await fetch('/api/passenger_checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                train: selectedMapTrain,
                station: station,
                delay: 0,
                note: `যাত্রী সরাসরি রিপোর্ট করেছেন: ট্রেনটি ${station} এ অবস্থান করছে।`
            })
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast(`✅ ধন্যবাদ! আপনার চেক-ইন অনুযায়ী ট্রেনের লোকেশন ম্যাপে আপডেট করা হয়েছে!`, 'success');
            refreshLiveMap();
        } else {
            showToast(`⚠️ ${result.message}`, 'alert');
        }
    } catch (e) {
        showToast(`এরর: ${e.message}`, 'alert');
    }
}

// Render Stepper for Single Train
function renderSingleTrainStepper(live) {
    const container = document.getElementById('stepper-container');
    const stops = live.stoppages || [];
    const nextIdx = stops.indexOf(live.next_station);

    container.innerHTML = stops.map((stop, idx) => {
        let statusClass = 'border-slate-800 bg-slate-900 text-slate-400';
        let iconHtml = `<div class="w-2 h-2 rounded-full bg-slate-600"></div>`;

        if (nextIdx !== -1 && idx < nextIdx) {
            statusClass = 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300';
            iconHtml = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>`;
        } else if (idx === nextIdx) {
            statusClass = 'border-amber-500 bg-amber-950/50 text-amber-200 ring-2 ring-amber-500/40';
            iconHtml = `<span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>`;
        }

        return `
            <div class="flex-shrink-0 flex items-center gap-2">
                <div class="px-3 py-2 rounded-xl border ${statusClass} flex items-center gap-2">
                    ${iconHtml}
                    <div>
                        <div class="text-xs font-bold whitespace-nowrap">${stop}</div>
                        <div class="text-[9px] text-slate-400">স্টপ #${idx + 1}</div>
                    </div>
                </div>
                ${idx < stops.length - 1 ? `<i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-600 flex-shrink-0"></i>` : ''}
            </div>
        `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
}

let currentRakeData = null;
let isRakeManuallyReversed = false;

// Render Authentic 14-Coach Rake Composition (লোকোমোটিভ ➔ 'ক', 'খ', 'গ'... ➔ 'ড')
function renderTrainRakeComposition(trainData) {
    if (!trainData) return;
    currentRakeData = trainData;
    const card = document.getElementById('rake-composition-card');
    const container = document.getElementById('rake-coaches-container');
    const titleEl = document.getElementById('rake-train-title');
    const statusEl = document.getElementById('rake-orientation-status');
    const noteEl = document.getElementById('rake-orientation-note');
    if (!card || !container) return;

    const trainNum = trainData.number || '765';
    const trainName = trainData.name_bn || trainData.name_en || 'আন্তঃনগর এক্সপ্রেস';

    // Operational logic: Dhaka to Outstation (UP) -> 'ক' is at FRONT
    // Outstation to Dhaka (DOWN) -> 'ড' is at FRONT, 'ক' is at TAIL
    let isKaAtFront = true;
    if (trainData.rake_info && typeof trainData.rake_info.is_ka_at_front === 'boolean') {
        isKaAtFront = trainData.rake_info.is_ka_at_front;
    } else {
        const destLower = (trainData.destination || '').toLowerCase();
        const origLower = (trainData.origin || '').toLowerCase();
        if (destLower.includes('dhaka') && !origLower.includes('dhaka')) {
            isKaAtFront = false;
        }
    }

    if (isRakeManuallyReversed) {
        isKaAtFront = !isKaAtFront;
    }

    if (titleEl) {
        titleEl.textContent = `[${trainNum}] ${trainName}: সম্পূর্ণ বগি বিন্যাস ও আসন কোটা`;
    }

    // Update Operational Rule Banner with 100% accurate info
    if (statusEl) {
        if (isKaAtFront) {
            statusEl.innerHTML = `📍 <span class="text-white font-bold">${trainName} (${trainNum}):</span> বগি <strong class="text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40">'ক' ট্রেনের সম্মুখভাগে (ইঞ্জিনের ঠিক পেছনে)</strong> এবং বগি <strong class="text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/40">'ড' ট্রেনের শেষ মাথায় (লেজে)!</strong>`;
        } else {
            statusEl.innerHTML = `📍 <span class="text-white font-bold">${trainName} (${trainNum}):</span> বগি <strong class="text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/40">'ড' ট্রেনের সম্মুখভাগে (ইঞ্জিনের ঠিক পেছনে)</strong> এবং বগি <strong class="text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40">'ক' ট্রেনের শেষ মাথায় (লেজে)!</strong>`;
        }
    }
    if (noteEl) {
        noteEl.innerHTML = isKaAtFront
            ? `<strong>বাংলাদেশ রেলওয়ে রুলস:</strong> এই ট্রেনটি প্রান্তিক অভিমুখী হওয়ায় লোকোমোটিভ বগি 'ক'-এর সাথে যুক্ত আছে। বগি 'ক' (পাওয়ার কার ও গার্ড ব্রেক) ইঞ্জিনের ঠিক পেছনে সবার সামনে থাকবে। আর বগি 'ড' থাকবে ট্রেনের সর্বশেষে।`
            : `<strong>বাংলাদেশ রেলওয়ে রুলস:</strong> ট্রেনটি ঢাকা অভিমুখী হওয়ায় প্রান্তিক স্টেশনে লোকোমোটিভ রিভার্স/শান্টিং করে বগি 'ড'-এর সাথে জোড়া দেওয়া হয়েছে। ফলে বগি 'ড' ইঞ্জিনের সাথে সবার সামনে থাকবে এবং বগি 'ক' চলে গেছে ট্রেনের একদম পেছনের লেজে!`;
    }

    card.classList.remove('hidden');

    let rawCoaches = (trainData.rake_info && trainData.rake_info.coaches) || trainData.coaches || [];
    let passengerCoaches = rawCoaches.filter(c => !c.is_engine);

    if (passengerCoaches.length > 0) {
        const firstCode = passengerCoaches[0].code;
        if (isKaAtFront && firstCode !== 'ক') {
            passengerCoaches.reverse();
        } else if (!isKaAtFront && firstCode === 'ক') {
            passengerCoaches.reverse();
        }
    }

    let html = '';

    // 1. Front Engine Flow Badge
    html += `
        <div class="flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500/60 text-emerald-300 shadow-xl">
            <span class="text-xs font-black animate-pulse flex items-center gap-1">➡️ সম্মুখভাগ</span>
            <span class="text-[9px] text-emerald-400 font-mono mt-0.5 font-bold tracking-wider">ENGINE FRONT</span>
        </div>
    `;

    // 2. Locomotive Engine Card
    html += `
        <div onclick="showRakeCoachDetail('লোকোমোটিভ', 'লোকোমোটিভ ইঞ্জিন (Class 2900 EMD)', 'বাংলাদেশ রেলওয়ের ৩০০০ হর্সপাওয়ার শক্তিশালী ডিজেল ইলেকট্রিক ইঞ্জিন। ট্রেনের সম্মুখভাগে লোকোমাস্টার (এলএম) ও সহকারী লোকোমাস্টার (এএলএম) এই ইঞ্জিন থেকে ট্রেন পরিচালনা করেন।', 0, 0)" 
             class="flex-shrink-0 cursor-pointer group p-3 rounded-2xl bg-gradient-to-b from-red-700 via-emerald-800 to-emerald-950 border-2 border-emerald-400 text-white shadow-xl hover:scale-105 transition-all w-48">
            <div class="flex items-center justify-between mb-1">
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/40 text-emerald-100 text-[10px] font-bold">লোকোমোটিভ</span>
                <span class="text-[10px] font-mono text-amber-300 font-bold">Class 2900</span>
            </div>
            <div class="flex items-center gap-2 my-1.5">
                <div class="text-3xl">🚂</div>
                <div>
                    <div class="text-xs font-black tracking-wide text-white">BR Class 2900</div>
                    <div class="text-[10px] text-emerald-200">সম্মুখ চালক ক্যাব</div>
                </div>
            </div>
            <div class="text-[10px] text-emerald-100/90 pt-1 border-t border-emerald-600/40 flex items-center justify-between font-mono">
                <span>⚡ ৩০০০ HP ডিজেল</span>
                <span class="text-amber-300">💡 হেডলাইট অন</span>
            </div>
        </div>
    `;

    // 3. Render Coaches Sequence
    passengerCoaches.forEach((c, idx) => {
        html += `
            <div class="flex-shrink-0 flex items-center justify-center text-slate-500 text-xs px-0.5">
                <span class="font-bold text-slate-600 select-none">══</span>
            </div>
        `;

        let bgGradient = 'from-slate-900 to-emerald-950 border-emerald-700/60 text-emerald-100';
        let coachIcon = '💺';
        let badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

        if (c.type === 'POWER_CAR') {
            bgGradient = 'from-slate-900 via-rose-950 to-slate-950 border-rose-600/60 text-rose-100';
            coachIcon = '⚡';
            badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
        } else if (c.type === 'SNIGDHA_AC') {
            bgGradient = 'from-slate-900 via-cyan-950 to-slate-950 border-cyan-500/60 text-cyan-100';
            coachIcon = '❄️';
            badgeBg = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
        } else if (c.type === 'AC_BERTH' || c.type === 'AC_CABIN') {
            bgGradient = 'from-slate-900 via-purple-950 to-slate-950 border-purple-500/60 text-purple-100';
            coachIcon = '🛏️';
            badgeBg = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
        } else if (c.type === 'DINING_CAR') {
            bgGradient = 'from-slate-900 via-amber-950 to-slate-950 border-amber-600/60 text-amber-100';
            coachIcon = '🍽️';
            badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
        }

        const isFirstPassenger = (idx === 0);
        const isLastPassenger = (idx === passengerCoaches.length - 1);

        let specialTag = '';
        if (isFirstPassenger) {
            specialTag = `<span class="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded text-[9px] font-black">⭐ সম্মুখে</span>`;
        } else if (isLastPassenger) {
            specialTag = `<span class="bg-rose-500 text-white px-1.5 py-0.5 rounded text-[9px] font-black">🚪 লেজ</span>`;
        }

        const availText = c.total_seats > 0 ? `${c.available_seats}টি সিট খালি` : 'স্টাফ ও পাওয়ার';

        html += `
            <div onclick="showRakeCoachDetail('${c.code}', '${c.name}', '${c.class_type}', ${c.total_seats}, ${c.available_seats})" 
                 class="flex-shrink-0 cursor-pointer group p-2.5 rounded-2xl bg-gradient-to-b ${bgGradient} border-2 hover:border-emerald-400 shadow-md hover:scale-105 transition-all w-40 relative">
                <div class="flex items-center justify-between mb-1">
                    <span class="px-2 py-0.5 rounded-lg ${badgeBg} border text-xs font-black">বগি '${c.code}'</span>
                    <div class="flex items-center gap-1">
                        ${specialTag}
                        <span class="text-sm">${coachIcon}</span>
                    </div>
                </div>
                <div class="my-1">
                    <div class="text-[11px] font-bold text-white truncate">${c.class_type}</div>
                    <div class="text-[10px] text-slate-300 truncate">${c.name}</div>
                </div>
                <div class="text-[10px] pt-1 border-t border-slate-700/60 flex items-center justify-between text-slate-300">
                    <span>আসন: ${c.total_seats}</span>
                    <span class="font-bold ${c.available_seats > 0 ? 'text-emerald-400' : 'text-slate-400'}">${availText}</span>
                </div>
            </div>
        `;
    });

    // 4. Rear Indicator
    html += `
        <div class="flex-shrink-0 flex items-center justify-center text-slate-500 text-xs px-0.5">
            <span class="font-bold text-slate-600 select-none">══</span>
        </div>
        <div class="flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border-2 border-slate-700 text-slate-300 shadow-xl">
            <span class="text-xs font-black flex items-center gap-1">🚪 ট্রেনের লেজ</span>
            <span class="text-[9px] text-slate-400 font-mono mt-0.5 font-bold tracking-wider">REAR / TAIL</span>
        </div>
    `;

    container.innerHTML = html;
}

function toggleRakeDirection() {
    isRakeManuallyReversed = !isRakeManuallyReversed;
    if (currentRakeData) {
        renderTrainRakeComposition(currentRakeData);
        showToast(`🔄 ট্রেনের বগি বিন্যাস উল্টানো হয়েছে (${isRakeManuallyReversed ? "রিভার্স 'ড' ➔ 'ক'" : "স্বাভাবিক 'ক' ➔ 'ড'"})`, 'info');
    }
}

function switchRakeTrainNumber(trainNum) {
    isRakeManuallyReversed = false;
    selectTrainOnMap(trainNum);
    showToast(`🚄 ট্রেন [${trainNum}] নির্বাচন করা হয়েছে এবং বগি বিন্যাস লোড হচ্ছে...`, 'info');
}

function openStationScannerForActiveTrain() {
    const trainNum = (currentRakeData && currentRakeData.number) || (activeJourneyTrain && activeJourneyTrain.number) || currentSelectedTrainNumber || '765';
    switchTab('station_tickets');
    const select = document.getElementById('station-scan-train-select');
    if (select) {
        select.value = trainNum;
        onStationScanTrainChange();
    }
    runStationTicketScan();
    showToast(`🎫 ট্রেন [${trainNum}] এর সকল স্টেশনের টিকিট স্ক্যান করা হচ্ছে...`, 'success');
}

function showRakeCoachDetail(code, name, classType, totalSeats, availableSeats) {
    const detailBox = document.getElementById('rake-coach-detail');
    const detailText = document.getElementById('rake-coach-detail-text');
    if (!detailBox || !detailText) return;

    detailBox.classList.remove('hidden');
    detailText.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">বগি '${code}'</span>
            <span class="font-bold text-white">${name}</span>
            <span class="text-slate-400">| ধরন: ${classType}</span>
            ${totalSeats > 0 ? `<span class="text-amber-300">| মোট আসন: ${totalSeats}টি</span> <span class="text-emerald-400 font-bold">(খালি: ${availableSeats}টি)</span>` : ''}
        </div>
    `;
    showToast(`🚃 বগি '${code}' বিস্তারিত প্রদর্শিত হচ্ছে`, 'info');
}

// --- SEARCH & SEAT AVAILABILITY (Station-Specific & Stoppages) ---
async function handleSearch(e) {
    if (e) e.preventDefault();

    const origin = document.getElementById('origin-select').value;
    const dest = document.getElementById('destination-select').value;
    const date = document.getElementById('journey-date').value;

    const container = document.getElementById('train-cards-container');
    const countBadge = document.getElementById('results-count');
    const titleEl = document.getElementById('results-title');

    titleEl.textContent = `${origin} থেকে ${dest} - উপলব্ধ ট্রেন ও সময়সূচি`;
    container.innerHTML = `
        <div class="glass-card rounded-xl p-8 text-center text-slate-400">
            <div class="inline-block animate-spin text-emerald-400 mb-2">
                <i data-lucide="loader-2" class="w-8 h-8"></i>
            </div>
            <p>লাইভ সিট ও সময়সূচি অনুসন্ধান করা হচ্ছে...</p>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    try {
        const res = await fetch(`/api/search?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}`);
        const data = await res.json();

        if (data.trains && data.trains.length > 0) {
            countBadge.textContent = `${data.trains.length} ট্রেন`;
            renderTrainCards(data.trains);
        } else {
            countBadge.textContent = `0 ট্রেন`;
            container.innerHTML = `
                <div class="glass-card rounded-xl p-8 text-center text-slate-400">
                    <i data-lucide="alert-circle" class="w-10 h-10 text-amber-400 mx-auto mb-2"></i>
                    <h3 class="text-base font-bold text-white">কোনো সরাসরি আন্তঃনগর ট্রেন পাওয়া যায়নি</h3>
                    <p class="text-xs text-slate-400 mt-1">অনুগ্রহ করে প্রধান জংশন স্টেশন নির্বাচন করুন (যেমন: দিনাজপুর, রাজশাহী, ঢাকা, সান্তাহার, পার্বতীপুর)।</p>
                </div>
            `;
        }
    } catch (err) {
        container.innerHTML = `
            <div class="glass-card rounded-xl p-8 text-center text-rose-400">
                <p>ডেটা লোড করতে সমস্যা হয়েছে: ${err.message}</p>
            </div>
        `;
    }

    if (window.lucide) window.lucide.createIcons();
}

function renderTrainCards(trains) {
    const container = document.getElementById('train-cards-container');
    container.innerHTML = trains.map((train, cardIdx) => {
        const isLive = train.is_live_synced === true;
        const hasKnownTotal = train.total_available !== null && train.total_available !== undefined;
        const hasSeats = hasKnownTotal && train.total_available > 0;

        let seatBadgeClass, seatBadgeText;
        if (isLive) {
            if (hasSeats) {
                seatBadgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
                seatBadgeText = `🟢 ${train.total_available}টি সিট খালি (অফিসিয়াল)`;
            } else {
                seatBadgeClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
                seatBadgeText = '🔴 সকল সিট বুকড (Sold Out)';
            }
        } else {
            seatBadgeClass = 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40';
            seatBadgeText = '🔗 eticket-এ আসন দেখুন';
        }

        const classesHtml = Object.keys(train.seats).map(cls => {
            const info = train.seats[cls];
            const hasCount = info.available !== null && info.available !== undefined;
            const isAvail = hasCount && info.available > 0;

            let availDisplay;
            if (hasCount) {
                availDisplay = isAvail ? `${info.available} সিট` : '০ (বুকড)';
            } else {
                availDisplay = 'যাচাই করুন';
            }

            return `
                <div class="p-2.5 rounded-lg border ${isAvail ? 'bg-emerald-950/40 border-emerald-700/50' : 'bg-slate-900 border-slate-800'} flex flex-col justify-between">
                    <div class="flex items-center justify-between text-xs">
                        <span class="font-bold text-slate-200">${cls}</span>
                        <span class="${isAvail ? 'text-emerald-400 font-extrabold' : (hasCount ? 'text-rose-400 font-bold' : 'text-cyan-400 font-semibold')}">
                            ${availDisplay}
                        </span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-1 font-mono">৳${info.fare}</div>
                </div>
            `;
        }).join('');

        const subRoute = train.sub_route || [];
        const stopsTimelineHtml = subRoute.map((st, sIdx) => `
            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs">
                <div class="flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-400 font-bold">${sIdx + 1}</span>
                    <span class="font-semibold text-slate-200">${st.station}</span>
                    ${sIdx === 0 ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">যাত্রার শুরু</span>' : ''}
                    ${sIdx === subRoute.length - 1 ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">গন্তব্য</span>' : ''}
                </div>
                <span class="font-mono text-emerald-400 font-bold text-xs">${st.time}</span>
            </div>
        `).join('');

        const routeAccordionId = `route-accordion-${cardIdx}`;
        const photo = getTrainPhoto(train.number);

        return `
            <div class="glass-card rounded-xl p-5 hover:border-emerald-500/40 transition-all duration-200 shadow-lg">
                <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    
                    <div class="flex items-center gap-3">
                        <img src="${photo}" alt="${train.name_en}" class="w-14 h-14 rounded-xl object-cover border border-slate-700 shadow" />
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">${train.number}</span>
                                <h3 class="text-lg font-bold text-white">${train.name_bn}</h3>
                                <span class="text-xs text-slate-400">(${train.name_en})</span>
                            </div>
                            <div class="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                <span>মূল রুট: <strong class="text-slate-200">${train.train_origin} ➔ ${train.train_destination}</strong></span>
                                <span>•</span>
                                <span>ছুটির দিন: <strong class="text-amber-400">${train.off_day === 'None' ? 'নেই' : train.off_day}</strong></span>
                            </div>
                        </div>
                    </div>

                    <!-- Journey Timings for Searched Stations -->
                    <div class="flex items-center gap-4 bg-slate-900/90 px-4 py-2.5 rounded-xl border border-emerald-500/30 shadow-md">
                        <div class="text-center">
                            <div class="text-[11px] text-slate-400 font-bold">${train.journey_from} ছাড়বে</div>
                            <div class="text-base font-extrabold text-emerald-400 font-mono">${train.journey_dep_time}</div>
                        </div>
                        <div class="flex flex-col items-center">
                            <i data-lucide="arrow-right" class="w-4 h-4 text-emerald-500"></i>
                            <span class="text-[10px] text-emerald-300 font-bold font-mono">${train.journey_duration}</span>
                            <span class="text-[9px] text-slate-400">${train.stops_count}টি স্টেশন</span>
                        </div>
                        <div class="text-center">
                            <div class="text-[11px] text-slate-400 font-bold">${train.journey_to} পৌঁছাবে</div>
                            <div class="text-base font-extrabold text-amber-400 font-mono">${train.journey_arr_time}</div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 w-full lg:w-auto justify-end">
                        <button onclick="viewOnLiveMap('${train.number}')" class="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition">
                            <i data-lucide="map" class="w-3.5 h-3.5"></i>
                            <span>ম্যাপে অবস্থান</span>
                        </button>
                        <span class="px-3 py-1.5 rounded-lg text-xs font-bold ${seatBadgeClass}">
                            ${seatBadgeText}
                        </span>
                        <button onclick="startWatchingTrain('${train.number}', '${train.name_bn}', '${train.journey_from}', '${train.journey_to}')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition">
                            <i data-lucide="bell-plus" class="w-3.5 h-3.5"></i>
                            <span>অ্যালার্ট</span>
                        </button>
                    </div>

                </div>

                <!-- Seat Classes Grid & Action Button -->
                <div class="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-grow">
                        ${classesHtml}
                    </div>

                    <div class="flex items-center gap-2">
                        <button onclick="toggleRouteAccordion('${routeAccordionId}')" class="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition">
                            <i data-lucide="list-ordered" class="w-3.5 h-3.5 text-cyan-400"></i>
                            <span>রুট ও স্টপেজ (${train.stops_count})</span>
                        </button>

                        <a href="${train.booking_url}" target="_blank" rel="noopener noreferrer" class="px-5 py-2.5 rounded-lg bg-gradient-to-r from-bdgreen to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition whitespace-nowrap">
                            <i data-lucide="external-link" class="w-4 h-4"></i>
                            <span>সহজে বুক করুন</span>
                        </a>
                    </div>
                </div>

                <!-- Source Badge & Direct Railway Booking Note -->
                <div class="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span class="text-emerald-400 font-semibold flex items-center gap-1">
                        <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
                        <span>${train.data_source_badge || '⚡ বাংলাদেশ রেলওয়ে অনলাইন কোটা ও লাইভ টিকিট ডাটা'}</span>
                    </span>
                    <a href="${train.booking_url}" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
                        <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                        <span>রেলওয়ে অফিশিয়াল পোর্টালে কাটুন ↗</span>
                    </a>
                </div>

                <!-- Stoppage Route Accordion -->
                <div id="${routeAccordionId}" class="hidden mt-4 pt-4 border-t border-slate-800">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-bold text-white flex items-center gap-1.5">
                            <i data-lucide="milestone" class="w-3.5 h-3.5 text-cyan-400"></i>
                            ${train.journey_from} থেকে ${train.journey_to} - সকল স্টপেজ ও পৌঁছানোর সময়
                        </span>
                        <span class="text-[10px] text-slate-400">মোট দূরত্বে ${train.stops_count}টি স্টপেজ</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        ${stopsTimelineHtml}
                    </div>
                </div>

            </div>
        `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
}

function toggleRouteAccordion(accordionId) {
    const el = document.getElementById(accordionId);
    if (el) {
        el.classList.toggle('hidden');
    }
}

// --- LIVE STATION BOARD ---
async function loadStationBoard() {
    const select = document.getElementById('station-board-select');
    if (!select) return;
    const station = select.value || "Dinajpur";

    const tbody = document.getElementById('station-board-tbody');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-8 text-slate-400">
                <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400"></i>
                ${station} স্টেশনের ডিজিটাল ডিসপ্লে বোর্ড লোড হচ্ছে...
            </td>
        </tr>
    `;
    if (window.lucide) window.lucide.createIcons();

    try {
        const res = await fetch(`/api/station_board?station=${encodeURIComponent(station)}`);
        const data = await res.json();

        if (data.trains && data.trains.length > 0) {
            tbody.innerHTML = data.trains.map(t => {
                const photo = getTrainPhoto(t.number);
                return `
                    <tr class="hover:bg-slate-900/60 transition">
                        <td class="py-3 px-4 font-bold text-white flex items-center gap-2">
                            <img src="${photo}" alt="" class="w-8 h-8 rounded-lg object-cover border border-slate-700" />
                            <div>
                                <div><span class="font-mono text-cyan-400 mr-1">[${t.number}]</span> ${t.name_bn}</div>
                                <div class="text-[10px] text-slate-400 font-normal">${t.name_en}</div>
                            </div>
                        </td>
                        <td class="py-3 px-4 text-slate-300">
                            ${t.origin} ➔ ${t.destination}
                        </td>
                        <td class="py-3 px-4 font-mono font-bold ${t.is_origin ? 'text-slate-500' : 'text-emerald-400'}">
                            ${t.is_origin ? 'প্রারম্ভিক স্টেশন' : t.arrival_at_station}
                        </td>
                        <td class="py-3 px-4 font-mono font-bold ${t.is_destination ? 'text-slate-500' : 'text-amber-400'}">
                            ${t.is_destination ? 'গন্তব্য স্টেশন' : t.departure_from_station}
                        </td>
                        <td class="py-3 px-4 text-slate-400">
                            ${t.off_day === 'None' ? 'নেই' : t.off_day}
                        </td>
                        <td class="py-3 px-4 text-right">
                            <button onclick="viewOnLiveMap('${t.number}')" class="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 text-xs font-semibold inline-flex items-center gap-1 transition">
                                <i data-lucide="crosshair" class="w-3 h-3"></i>
                                <span>ট্র্যাক</span>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-8 text-slate-400">
                        ${station} স্টেশনে কোনো নিয়মিত আন্তঃনগর ট্রেনের স্টপেজ পাওয়া যায়নি।
                    </td>
                </tr>
            `;
        }
    } catch (e) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-6 text-rose-400">
                    এরর: ${e.message}
                </td>
            </tr>
        `;
    }

    if (window.lucide) window.lucide.createIcons();
}

function viewOnLiveMap(trainNum) {
    switchTab('map');
    selectTrainOnMap(trainNum);
}

function swapStations() {
    const origin = document.getElementById('origin-select');
    const dest = document.getElementById('destination-select');
    const temp = origin.value;
    origin.value = dest.value;
    dest.value = temp;
    handleSearch();
}

function performInitialSearch() {
    handleSearch();
}

// Web Audio API Chime Synthesizer
function playRailwayChime() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const now = audioCtx.currentTime;
        const notes = [
            { freq: 587.33, start: now + 0.0, dur: 0.35 },
            { freq: 880.00, start: now + 0.35, dur: 0.55 },
        ];

        notes.forEach(n => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(n.freq, n.start);

            gain.gain.setValueAtTime(0, n.start);
            gain.gain.linearRampToValueAtTime(0.3, n.start + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, n.start + n.dur);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(n.start);
            osc.stop(n.start + n.dur);
        });
    } catch (e) {
        console.warn('Audio playback not supported:', e);
    }
}

function testChime() {
    playRailwayChime();
    showToast('🔔 অডিও অ্যালার্ম টেস্ট সফল হয়েছে!', 'success');
}

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const border = type === 'success' ? 'border-emerald-500' : (type === 'alert' ? 'border-rose-500 bg-rose-950/90' : 'border-slate-700');
    
    toast.className = `p-3 rounded-xl bg-slate-900 text-white text-xs shadow-2xl border ${border} flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0`;
    toast.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : 'bell'}" class="w-4 h-4 text-emerald-400"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Seat Watcher Radar Logic
function toggleWatcherEngine() {
    watcherRunning = !watcherRunning;
    const btn = document.getElementById('toggle-watcher-btn');
    const badge = document.getElementById('badge-watching');
    const statusText = document.getElementById('radar-status-text');
    const indicator = document.getElementById('radar-indicator');

    if (watcherRunning) {
        if (btn) {
            btn.innerHTML = `<i data-lucide="square" class="w-4 h-4 text-rose-300"></i><span>মনিটরিং বন্ধ করুন</span>`;
            btn.classList.remove('from-emerald-600', 'to-teal-600', 'hover:from-emerald-500', 'hover:to-teal-500');
            btn.classList.add('from-rose-600', 'to-red-600', 'hover:from-rose-500', 'hover:to-red-500');
        }
        if (badge) badge.classList.remove('hidden');
        if (statusText) {
            statusText.textContent = 'সক্রিয় (Active Radar)';
            statusText.classList.remove('text-slate-300');
            statusText.classList.add('text-emerald-400');
        }
        if (indicator) {
            indicator.classList.add('pulse-radar', 'bg-emerald-500/20', 'text-emerald-400');
            indicator.classList.remove('bg-slate-800', 'text-slate-400');
        }

        logWatcher('🟢 লাইভ সিট হান্টার ইঞ্জিন সক্রিয় করা হয়েছে...');
        if (watcherInterval) clearInterval(watcherInterval);
        watcherInterval = setInterval(runWatcherCycle, 10000);
        runWatcherCycle();
    } else {
        if (btn) {
            btn.innerHTML = `<i data-lucide="play" class="w-4 h-4"></i><span>মনিটরিং চালু করুন</span>`;
            btn.classList.remove('from-rose-600', 'to-red-600', 'hover:from-rose-500', 'hover:to-red-500');
            btn.classList.add('from-emerald-600', 'to-teal-600', 'hover:from-emerald-500', 'hover:to-teal-500');
        }
        if (badge) badge.classList.add('hidden');
        if (statusText) {
            statusText.textContent = 'অফলাইন';
            statusText.classList.remove('text-emerald-400');
            statusText.classList.add('text-slate-300');
        }
        if (indicator) {
            indicator.classList.remove('pulse-radar', 'bg-emerald-500/20', 'text-emerald-400');
            indicator.classList.add('bg-slate-800', 'text-slate-400');
        }

        if (watcherInterval) clearInterval(watcherInterval);
        logWatcher('🔴 লাইভ সিট মনিটরিং স্থগিত করা হয়েছে।');
    }

    if (window.lucide) window.lucide.createIcons();
}

let watcherFoundTrains = [];
let watcherLastOrigin = 'Dhaka';
let watcherLastDest = 'Chittagong';
let watcherLastDate = '';

async function runWatcherCycle() {
    scanCount++;
    const scansEl = document.getElementById('radar-scans-count');
    if (scansEl) scansEl.textContent = `${scanCount} বার`;

    // Watcher specific inputs or fallback to search inputs or defaults
    const originEl = document.getElementById('watcher-origin-select') || document.getElementById('origin-select');
    const destEl = document.getElementById('watcher-destination-select') || document.getElementById('destination-select');
    const dateEl = document.getElementById('watcher-journey-date') || document.getElementById('journey-date');

    const origin = (originEl && originEl.value) ? originEl.value.trim() : 'Dhaka';
    const dest = (destEl && destEl.value) ? destEl.value.trim() : 'Chittagong';
    let date = (dateEl && dateEl.value) ? dateEl.value.trim() : '';
    if (!date) {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        date = `${yyyy}-${mm}-${dd}`;
    }

    watcherLastOrigin = origin;
    watcherLastDest = dest;
    watcherLastDate = date;

    logWatcher(`[${new Date().toLocaleTimeString('en-US')}] স্ক্যানিং: ${origin} ➔ ${dest} (${date})...`);

    try {
        const res = await fetch(`/api/search?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}`);
        const data = await res.json();

        if (data.trains && data.trains.length > 0) {
            let foundAny = false;
            let totalAvailableAcrossFleet = 0;
            const currentAvailable = [];

            data.trains.forEach(t => {
                if (t.total_available > 0) {
                    foundAny = true;
                    totalAvailableAcrossFleet += t.total_available;
                    currentAvailable.push(t);
                }
            });

            if (foundAny) {
                alertCount += totalAvailableAcrossFleet;
                const alertsEl = document.getElementById('radar-alerts-count');
                if (alertsEl) alertsEl.textContent = `${alertCount} টি সিট পাওয়া গেছে`;
                
                watcherFoundTrains = currentAvailable;
                renderWatcherAvailableCards(watcherFoundTrains, origin, dest, date, false);

                playRailwayChime();
                showToast(`🚨 সিট হান্টার: ${totalAvailableAcrossFleet} টি সিট খালি পাওয়া গেছে!`, 'success');
            } else {
                logWatcher(`[${new Date().toLocaleTimeString('en-US')}] কোনো সিট খালি পাওয়া যায়নি। পরবর্তী স্ক্যান অপেক্ষমাণ...`);
            }
        } else {
            logWatcher(`[${new Date().toLocaleTimeString('en-US')}] ${origin} ➔ ${dest} রুটে ট্রেন খোঁজা হচ্ছে...`);
        }
    } catch (e) {
        logWatcher(`⚠️ নেটওয়ার্ক এরর: ${e.message}`);
    }
}

function renderWatcherAvailableCards(trains, origin, dest, date, isReSort = false) {
    const logEl = document.getElementById('watcher-log');
    if (!logEl) return;

    // Remove existing train seat cards to prevent duplicate spam on every 10s auto-refresh
    const oldCards = logEl.querySelectorAll('.watcher-seat-card');
    oldCards.forEach(c => c.remove());

    trains.forEach(t => {
        const originClean = (t.journey_from || origin || 'Dhaka').toUpperCase();
        const destClean = (t.journey_to || dest || 'Chittagong').toUpperCase();
        const doj = t.date || date || '';
        const bookingUrl = t.booking_url || `https://eticket.railway.gov.bd/booking/train/search?fromcity=${encodeURIComponent(originClean)}&tocity=${encodeURIComponent(destClean)}&doj=${encodeURIComponent(doj)}&class=S_CHAIR`;

        let breakdownPills = '';
        if (t.seats) {
            Object.entries(t.seats).forEach(([clsKey, sInfo]) => {
                if (sInfo.available > 0) {
                    let label = clsKey;
                    if (clsKey === 'S_CHAIR' || clsKey === 'SHOVAN_CHAIR') label = 'শোভন চেয়ার';
                    else if (clsKey === 'SNIGDHA') label = 'স্নিগ্ধা';
                    else if (clsKey === 'AC_B' || clsKey === 'AC_BERTH') label = 'এসি বার্থ';
                    else if (clsKey === 'AC_S' || clsKey === 'AC_CABIN') label = 'এসি সিট';
                    else if (clsKey === 'SHOVAN') label = 'শোভন';
                    breakdownPills += `<span class="px-2 py-0.5 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 font-mono text-[10.5px] font-bold">${label}: ${sInfo.available}টি</span>`;
                }
            });
        }
        if (!breakdownPills) {
            breakdownPills = `<span class="px-2 py-0.5 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 font-mono text-[10.5px] font-bold">মোট ${t.total_available}টি আসন</span>`;
        }

        const cardHtml = `
            <div class="watcher-seat-card my-2 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border-2 border-emerald-500/60 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs" data-train-number="${t.number}" data-seats="${t.total_available}">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                        🚆
                    </div>
                    <div>
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="font-extrabold text-white text-sm tracking-wide">[${t.number}] ${t.name_bn}</span>
                            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-500/50 font-mono font-black text-[11px] animate-pulse">
                                🚨 ${t.total_available}টি আসন খালি!
                            </span>
                        </div>
                        <div class="flex flex-wrap items-center gap-2.5 text-slate-300 mt-1">
                            <span class="text-slate-300">📍 <strong>${t.journey_from || origin} ➔ ${t.journey_to || dest}</strong></span>
                            <span class="text-amber-300">🕒 প্রস্থান: <strong class="text-white">${t.journey_dep_time || t.departure || '—'}</strong></span>
                            <span class="text-slate-400">📅 <strong class="text-emerald-300 font-mono">${doj}</strong></span>
                        </div>
                        <div class="flex flex-wrap items-center gap-1.5 mt-2">
                            ${breakdownPills}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    <a href="${bookingUrl}" target="_blank" rel="noopener noreferrer" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-900/50 hover:scale-105 active:scale-95 transition-all">
                        <span>🎟️ সরাসরি টিকিট কাটুন ↗</span>
                    </a>
                </div>
            </div>
        `;

        logWatcher(cardHtml, true);
    });
}

function sortWatcherAvailableSeats(criteria = 'seats') {
    if (!watcherFoundTrains || watcherFoundTrains.length === 0) {
        showToast('বাছাই করার মতো কোনো খালি সিট পাওয়া যায়নি।', 'info');
        return;
    }

    if (criteria === 'seats') {
        watcherFoundTrains.sort((a, b) => (b.total_available || 0) - (a.total_available || 0));
        showToast('🔥 সর্বোচ্চ আসন সংখ্যা অনুযায়ী সাজানো হয়েছে', 'success');
    } else if (criteria === 'number') {
        watcherFoundTrains.sort((a, b) => String(a.number).localeCompare(String(b.number)));
        showToast('🔢 ট্রেন নম্বর অনুযায়ী সাজানো হয়েছে', 'success');
    } else if (criteria === 'time') {
        watcherFoundTrains.sort((a, b) => String(a.journey_dep_time || a.departure || '').localeCompare(String(b.journey_dep_time || b.departure || '')));
        showToast('🕒 যাত্রার সময় অনুযায়ী সাজানো হয়েছে', 'success');
    }

    renderWatcherAvailableCards(watcherFoundTrains, watcherLastOrigin, watcherLastDest, watcherLastDate, true);
}

function clearWatcherLog() {
    const logEl = document.getElementById('watcher-log');
    if (logEl) {
        logEl.innerHTML = '<div class="text-slate-500 py-3 text-center">লগ খালি করা হয়েছে। নতুন স্ক্যান ফলাফল এখানে প্রদর্শিত হবে।</div>';
    }
    watcherFoundTrains = [];
    showToast('লগ সাফ করা হয়েছে', 'info');
}

function startWatchingTrain(number, name, origin, dest) {
    switchTab('watcher');
    if (!watcherRunning) {
        toggleWatcherEngine();
    }
    logWatcher(`🎯 ট্র্যাকিং তালিকায় যুক্ত করা হয়েছে: [${number}] ${name} (${origin} ➔ ${dest})`);
    showToast(`🎯 [${number}] ${name} সিট হান্টারে যুক্ত করা হয়েছে!`, 'success');
}

function logWatcher(msg, isCard = false) {
    const logEl = document.getElementById('watcher-log');
    if (!logEl) return;
    const entry = document.createElement('div');
    if (isCard) {
        entry.innerHTML = msg;
    } else {
        entry.className = "py-1 border-b border-slate-900/60 text-slate-400";
        entry.textContent = msg;
    }
    logEl.prepend(entry);

    while (logEl.children.length > 50) {
        logEl.removeChild(logEl.lastChild);
    }
}

// =========================================================================
// 3D LIVE TRAIN JOURNEY SIMULATOR & MOTION ANIMATION ENGINE
// =========================================================================
let activeJourneyTrain = null;
let lastTrackedTrainLat = 25.6267;
let lastTrackedTrainLng = 88.6367;
let currentJourneyMode = '3d';
let trainSoundActive = false;
let trainSoundTimer = null;
let liveMotionAnimFrame = null;
let journey3DAnimFrame = null;

// Zoom directly into satellite railway track (Zoom Level 16)
function zoomToLiveTrainTrack() {
    if (!leafletMap) return;
    if (currentMapMode !== 'satellite') {
        setMapLayer('satellite');
    }
    leafletMap.setView([lastTrackedTrainLat, lastTrackedTrainLng], 16, { animate: true });
    showToast('🛰️ স্যাটেলাইটে রেল ট্র্যাকে ১৬x জুম করা হয়েছে!', 'success');
}

// ==============================================================================
// 360-DEGREE SATELLITE ROTATION, 3D TILT & AUTO-ORBIT ENGINE
// ==============================================================================
let isJourneyTrackUpMode = false; // Standard clean North-Up view (zero inverted text or upside-down tiles)

function toggleAutoFollowTrain() {
    isAutoFollowTrain = !isAutoFollowTrain;
    const btn = document.getElementById('btn-follow-train') || document.getElementById('btn-journey-view');
    if (btn) {
        if (isAutoFollowTrain) {
            btn.className = 'px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 text-xs font-bold flex items-center gap-1 transition shadow-lg animate-pulse';
            btn.innerHTML = `<span>⌖ ট্রেনের সাথে চলুন (সক্রিয়)</span>`;
            if (lastTrackedTrainLat && lastTrackedTrainLng && leafletMap) {
                leafletMap.panTo([lastTrackedTrainLat, lastTrackedTrainLng], { animate: true });
            }
            showToast('⌖ ট্রেনের সাথে ক্যামেরা স্বয়ংক্রিয়ভাবে অনুসরণ করছে', 'success');
        } else {
            btn.className = 'px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1 transition';
            btn.innerHTML = `<span>⌖ ট্রেনের সাথে চলুন</span>`;
            showToast('🌐 ক্যামেরা ফ্রি মুভ মোডে সেট করা হয়েছে', 'info');
        }
    }
}

// Keep map upright and smooth (no upside down text, zero inverted drags)
function alignMapToJourneyDirection(live) {
    if (!live) return;
    if (isAutoFollowTrain && leafletMap) {
        leafletMap.panTo([live.latitude, live.longitude], { animate: true });
    }
}

function toggleJourneyTrackUpView() {
    toggleAutoFollowTrain();
}

function toggleMapAutoOrbit() {
    isMapAutoOrbiting = !isMapAutoOrbiting;
    const btn = document.getElementById('btn-map-auto-orbit');
    if (btn) {
        if (isMapAutoOrbiting) {
            btn.classList.add('bg-cyan-500', 'text-slate-950', 'font-black', 'animate-pulse');
            btn.classList.remove('bg-slate-900', 'text-slate-300');
            // If tilt is flat, elevate to 35 deg for realistic drone perspective
            if (mapTilt === 0) {
                mapTilt = 35;
            }
            startAutoOrbitLoop();
            showToast('🔄 ৩৬০° স্যাটেলাইট অটো-অরবিট ক্যামেরা সক্রিয় হয়েছে!', 'info');
        } else {
            btn.classList.remove('bg-cyan-500', 'text-slate-950', 'font-black', 'animate-pulse');
            btn.classList.add('bg-slate-900', 'text-slate-300');
            stopAutoOrbitLoop();
            showToast('⏹️ অটো-অরবিট থামানো হয়েছে', 'info');
        }
    }
}

// Apply 3D Perspective and Rotation Transform to Leaflet Map Viewport
function applyMap3DTransform() {
    const mapEl = document.getElementById('leaflet-map');
    const viewport = document.getElementById('map-3d-viewport');
    if (!mapEl || !viewport) return;

    const isMobile = window.innerWidth < 768;
    // On mobile screens, disable 3D rotateX to guarantee buttery smooth 2-finger touch gesture navigation!
    if (mapTilt > 0 && !isMobile) {
        viewport.style.perspective = '1200px';
        mapEl.style.transform = `rotateX(${mapTilt}deg) rotateZ(${mapBearing}deg)`;
        mapEl.style.transformOrigin = 'center center';
    } else {
        viewport.style.perspective = 'none';
        mapEl.style.transform = mapBearing ? `rotateZ(${mapBearing}deg)` : 'none';
        mapEl.style.transformOrigin = 'center center';
    }
}

function startAutoOrbitLoop() {
    function orbitStep() {
        if (!isMapAutoOrbiting) return;
        mapBearing = (mapBearing + 0.35) % 360;
        applyMap3DTransform();
        autoOrbitRafId = requestAnimationFrame(orbitStep);
    }
    cancelAnimationFrame(autoOrbitRafId);
    autoOrbitRafId = requestAnimationFrame(orbitStep);
}

function stopAutoOrbitLoop() {
    isMapAutoOrbiting = false;
    cancelAnimationFrame(autoOrbitRafId);
}

function rotateMapStep(degrees) {
    stopAutoOrbitLoop();
    const btn = document.getElementById('btn-map-auto-orbit');
    if (btn) {
        btn.classList.remove('bg-cyan-500', 'text-slate-950', 'font-black', 'animate-pulse');
        btn.classList.add('bg-slate-900', 'text-slate-300');
    }
    mapBearing = (mapBearing + degrees + 360) % 360;
    applyMap3DTransform();
    showToast(`🧭 ম্যাপ কোণ: ${Math.round(mapBearing)}°`, 'info');
}

function cycleMapTilt() {
    if (mapTilt === 0) mapTilt = 35;
    else if (mapTilt === 35) mapTilt = 55;
    else mapTilt = 0;
    applyMap3DTransform();
    const label = mapTilt === 0 ? 'ফ্ল্যাট ভিউ (০°)' : (mapTilt === 35 ? 'অবলিক ৩D (৩৫°)' : 'ড্রোন ককপিট ৩D (৫৫°)');
    showToast(`📐 ৩D টিল্ট: ${label}`, 'info');
}

function resetMapToNorth() {
    stopAutoOrbitLoop();
    isJourneyTrackUpMode = false;
    const jBtn = document.getElementById('btn-journey-view');
    if (jBtn) {
        jBtn.className = 'px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1 transition';
        jBtn.innerHTML = `<span>⬆️ নিচ থেকে ওপরে</span>`;
    }
    const btn = document.getElementById('btn-map-auto-orbit');
    if (btn) {
        btn.classList.remove('bg-cyan-500', 'text-slate-950', 'font-black', 'animate-pulse');
        btn.classList.add('bg-slate-900', 'text-slate-300');
    }
    mapBearing = 0;
    mapTilt = 0;
    applyMap3DTransform();
    showToast('🧭 উত্তর দিক (North 0°) ও ফ্ল্যাট ভিউ রিসেট হয়েছে', 'success');
}

// ==============================================================================
// MULTI-TRAIN RAIL CROSSING & STATION YARD ALLOCATION ENGINE
// ==============================================================================
let currentCrossingStationKey = 'Saidpur';
let isMapTheaterMode = false;
let isCrossingHUDMinimized = false;

// Toggle Map Theater / Big Screen Canvas
function toggleMapTheaterMode() {
    isMapTheaterMode = !isMapTheaterMode;
    const wrapper = document.getElementById('map-main-wrapper');
    const viewport = document.getElementById('map-3d-viewport');
    const icon = document.getElementById('theater-icon');
    const label = document.getElementById('theater-label');

    if (isMapTheaterMode) {
        if (wrapper) {
            wrapper.classList.add('fixed', 'inset-2', 'z-50', 'rounded-2xl', 'shadow-2xl', 'border-2', 'border-cyan-500/70', 'bg-slate-950');
            wrapper.style.height = 'calc(100vh - 16px)';
        }
        if (viewport) {
            viewport.style.height = 'calc(100vh - 16px)';
        }
        if (icon) icon.textContent = '🗗';
        if (label) label.textContent = 'স্বাভাবিক ভিউ';
        showToast('⛶ ফুল স্ক্রিন / বড় ম্যাপ ভিউ সক্রিয় হয়েছে!', 'success');
    } else {
        if (wrapper) {
            wrapper.classList.remove('fixed', 'inset-2', 'z-50', 'rounded-2xl', 'shadow-2xl', 'border-2', 'border-cyan-500/70', 'bg-slate-950');
            wrapper.style.height = '';
        }
        if (viewport) {
            viewport.style.height = '';
        }
        if (icon) icon.textContent = '⛶';
        if (label) label.textContent = 'বড় ম্যাপ';
        showToast('🗗 স্বাভাবিক ম্যাপ ভিউতে ফিরে আসা হয়েছে', 'info');
    }

    setTimeout(() => {
        if (leafletMap) {
            leafletMap.invalidateSize();
        }
    }, 280);
}

// Crossing Alert HUD Controls (Close / Minimize / Reopen)
let isCrossingHUDDismissedByUser = false;

function closeCrossingHUD() {
    isCrossingHUDDismissedByUser = true;
    const hud = document.getElementById('map-crossing-hud');
    const reopenBtn = document.getElementById('btn-reopen-crossing-hud');
    if (hud) {
        hud.classList.add('hidden');
        hud.classList.remove('fixed', 'inset-x-3', 'bottom-4', 'z-50', 'max-h-[75vh]', 'overflow-y-auto');
        hud.classList.add('absolute', 'top-4', 'left-4');
    }
    if (reopenBtn) {
        reopenBtn.classList.remove('hidden');
        reopenBtn.classList.add('flex');
    }
    showToast('⚠️ ক্রসিং অ্যালার্ট বন্ধ করা হয়েছে (প্রয়োজনে পুনরায় খুলতে পারবেন)', 'info');
}

function openCrossingHUD() {
    isCrossingHUDDismissedByUser = false;
    const hud = document.getElementById('map-crossing-hud');
    const reopenBtn = document.getElementById('btn-reopen-crossing-hud');
    if (hud) {
        hud.classList.remove('hidden');
        if (window.innerWidth < 768) {
            hud.classList.add('fixed', 'inset-x-3', 'bottom-4', 'z-50', 'max-h-[75vh]', 'overflow-y-auto');
            hud.classList.remove('absolute', 'top-4', 'left-4');
        } else {
            hud.classList.remove('fixed', 'inset-x-3', 'bottom-4', 'z-50', 'max-h-[75vh]', 'overflow-y-auto');
            hud.classList.add('absolute', 'top-4', 'left-4');
        }
    }
    if (reopenBtn) reopenBtn.classList.add('hidden');
}

function toggleCrossingHUDMinimize() {
    isCrossingHUDMinimized = !isCrossingHUDMinimized;
    const body = document.getElementById('crossing-hud-body');
    const icon = document.getElementById('btn-crossing-min-icon');
    if (body) {
        body.classList.toggle('hidden', isCrossingHUDMinimized);
    }
    if (icon) {
        icon.textContent = isCrossingHUDMinimized ? '➕' : '➖';
    }
}

// Switch Active Junction (Saidpur / Parbatipur / Santahar / Dhaka)
function switchCrossingStation(stationKey) {
    currentCrossingStationKey = stationKey;
    isCrossingHUDDismissedByUser = false;
    
    // Update pill highlight styling
    ['Saidpur', 'Parbatipur', 'Santahar', 'Dhaka'].forEach(stn => {
        const pill = document.getElementById(`cros-pill-${stn}`);
        if (pill) {
            if (stn === stationKey) {
                pill.className = 'px-2 py-0.5 rounded-lg font-bold bg-amber-600 text-white flex-shrink-0 shadow';
            } else {
                pill.className = 'px-2 py-0.5 rounded-lg font-medium bg-slate-900 text-slate-300 hover:text-white border border-slate-700 flex-shrink-0';
            }
        }
    });

    const queryTrain = (selectedMapTrain && selectedMapTrain !== 'ALL') ? selectedMapTrain : '766';
    fetchAndRenderLiveCrossings(queryTrain, stationKey);
    fetchAndRenderStationYard(stationKey, queryTrain);
    
    // Smoothly fly to the station
    const stnCoords = {
        'Saidpur': [25.7910, 88.8880],
        'Parbatipur': [25.6536, 88.9155],
        'Santahar': [24.8071, 88.9861],
        'Dhaka': [23.7317, 90.4262]
    };
    if (stnCoords[stationKey] && leafletMap) {
        if (currentMapMode !== 'satellite') setMapLayer('satellite');
        leafletMap.flyTo(stnCoords[stationKey], 17, { animate: true, duration: 1.2 });
    }
    showToast(`🚉 [${stationKey}] জংশনের ট্র্যাক ও ইয়ার্ডে স্যুইচ করা হয়েছে!`, 'success');
}

async function fetchAndRenderLiveCrossings(trainNum = '766', stationKey = null) {
    try {
        const queryTrain = (trainNum === 'ALL' || !trainNum) ? '766' : trainNum;
        const stnParam = stationKey || currentCrossingStationKey;
        const res = await fetch(`/api/live_crossings?train=${encodeURIComponent(queryTrain)}&station=${encodeURIComponent(stnParam)}`);
        const data = await res.json();
        
        if (data.status === 'success' && data.is_active) {
            currentCrossingData = data;
            renderCrossingHUD(data);
            
            // Fetch station yard details which also plots all yard trains on map
            fetchAndRenderStationYard(data.station, queryTrain);
        } else {
            const hud = document.getElementById('map-crossing-hud');
            const reopenBtn = document.getElementById('btn-reopen-crossing-hud');
            if (hud) hud.classList.add('hidden');
            if (reopenBtn) reopenBtn.classList.add('hidden');
        }
    } catch (e) {
        console.error('Failed to fetch live crossings:', e);
    }
}

function renderCrossingHUD(data) {
    const hud = document.getElementById('map-crossing-hud');
    const reopenBtn = document.getElementById('btn-reopen-crossing-hud');
    if (hud) hud.classList.add('hidden');
    if (reopenBtn) reopenBtn.classList.add('hidden');
}

// Authentic High-Fidelity Train Icon for Station Yards & Crossings
function createRealisticStationTrainIcon(train, lineNo, isPrimary = false) {
    if (!train || train.type === 'CLEAR') {
        const iconHtml = `
            <div style="display: flex; flex-direction: column; align-items: center; width: 150px; pointer-events: auto;">
                <div style="background: rgba(6, 78, 59, 0.95); border: 1.5px solid #10b981; border-radius: 9999px; padding: 3px 10px; font-size: 10px; font-weight: 800; color: #a7f3d0; box-shadow: 0 4px 14px rgba(0,0,0,0.8); display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                    <span>🟢</span> <span>লাইন-${lineNo}: মেইন ক্লিয়ার</span>
                </div>
            </div>
        `;
        return L.divIcon({
            html: iconHtml,
            className: 'clear-line-track-marker',
            iconSize: [150, 24],
            iconAnchor: [75, 12]
        });
    }

    const isMain = lineNo === 1 || train.role === 'MAIN_RUNNER';
    const type = train.type || (lineNo === 3 ? 'COMMUTER' : (lineNo === 4 ? 'FREIGHT' : 'INTERCITY'));
    
    // Status colors
    const statusBorder = train.signal === 'GREEN' ? '#10b981' : (train.signal === 'YELLOW' ? '#f59e0b' : '#ef4444');
    const signalDot = train.signal === 'GREEN' ? '🟢' : (train.signal === 'YELLOW' ? '🟡' : '🔴');
    const speed = train.speed || 0;
    
    // Staggered vertical position of the train name badge per line to eliminate overlap completely!
    const badgeTopOffsets = { 1: -28, 2: 36, 3: 96, 4: 156 };
    const badgeTop = badgeTopOffsets[lineNo] !== undefined ? badgeTopOffsets[lineNo] : -28;

    let locoGradient = 'linear-gradient(to bottom, #dc2626 0%, #047857 28%, #064e3b 72%, #022c22 100%)';
    let locoTag = 'BR 2900';
    let coachesHtml = '';

    if (type === 'COMMUTER') {
        locoGradient = 'linear-gradient(to bottom, #0284c7 0%, #0369a1 40%, #075985 100%)';
        locoTag = 'DEMU';
        ['১', '২', '৩'].forEach((num, idx) => {
            const isTail = idx === 2;
            coachesHtml += `
                <div style="width: 10px; height: 2px; background: #0f172a; margin: 1px 0; border: 1px solid #475569;"></div>
                <div style="width: 24px; height: 16px; background: linear-gradient(to right, #0284c7 0%, #0369a1 50%, #0284c7 100%); border-radius: ${isTail ? '2px 2px 6px 6px' : '2px'}; border: 1.5px solid ${statusBorder}; position: relative; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 8.5px; font-weight: 900; color: #ffffff;">${num}</span>
                    ${isTail ? '<div style="position: absolute; bottom: 1px; left: 7px; width: 8px; height: 3px; background: #ef4444; border-radius: 1px; box-shadow: 0 0 8px 3px #ef4444;"></div>' : ''}
                </div>
            `;
        });
    } else if (type === 'FREIGHT') {
        locoGradient = 'linear-gradient(to bottom, #7f1d1d 0%, #991b1b 50%, #450a0a 100%)';
        locoTag = 'BR WDG';
        ['📦', '📦', '📦', '📦'].forEach((box, idx) => {
            const isTail = idx === 3;
            coachesHtml += `
                <div style="width: 10px; height: 2px; background: #0f172a; margin: 1px 0; border: 1px solid #475569;"></div>
                <div style="width: 24px; height: 16px; background: linear-gradient(to right, #78350f 0%, #92400e 50%, #78350f 100%); border-radius: ${isTail ? '2px 2px 6px 6px' : '2px'}; border: 1.5px solid ${statusBorder}; position: relative; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 8px;">${box}</span>
                    ${isTail ? '<div style="position: absolute; bottom: 1px; left: 7px; width: 8px; height: 3px; background: #ef4444; border-radius: 1px; box-shadow: 0 0 8px 3px #ef4444;"></div>' : ''}
                </div>
            `;
        });
    } else {
        // Intercity Passenger Train with dynamic coach composition
        const { isKaAtFront, coaches } = getTrainCoachesList(train);
        coaches.forEach((c, idx) => {
            const isTail = idx === coaches.length - 1;
            const isKa = c.code === 'ক';
            let bg = 'linear-gradient(to right, #047857 0%, #064e3b 50%, #047857 100%)';
            let border = '#10b981';
            let txtColor = '#d1fae5';

            if (c.type === 'POWER_CAR' || c.code === 'ক' || c.code === 'ড') {
                bg = 'linear-gradient(to right, #4c0519 0%, #881337 50%, #4c0519 100%)';
                border = '#be123c';
                txtColor = '#ffe4e6';
            } else if (c.type === 'SNIGDHA_AC' || c.code === 'ছ' || c.code === 'জ') {
                bg = 'linear-gradient(to right, #0369a1 0%, #0284c7 50%, #0369a1 100%)';
                border = '#38bdf8';
                txtColor = '#e0f2fe';
            } else if (c.type === 'AC_BERTH' || c.type === 'AC_CABIN' || c.code === 'ঝ' || c.code === 'ঞ') {
                bg = 'linear-gradient(to right, #3730a3 0%, #4338ca 50%, #3730a3 100%)';
                border = '#818cf8';
                txtColor = '#e0e7ff';
            } else if (c.type === 'DINING_CAR' || c.code === 'চ') {
                bg = 'linear-gradient(to right, #78350f 0%, #b45309 50%, #78350f 100%)';
                border = '#fbbf24';
                txtColor = '#fef3c7';
            }

            const borderRadius = isTail ? '2px 2px 6px 6px' : '2px';
            const kaHighlight = isKa ? 'box-shadow: 0 0 6px rgba(250, 204, 21, 0.7); border: 1.5px solid #facc15;' : `border: 1.2px solid ${border};`;

            coachesHtml += `
                <div style="width: 10px; height: 2px; background: #0f172a; margin: 1px 0; border: 1px solid #475569;"></div>
                <div style="width: 24px; height: 16px; background: ${bg}; border-radius: ${borderRadius}; ${kaHighlight} position: relative; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 8.5px; font-weight: 900; color: ${txtColor}; text-shadow: 0 1px 2px #000; line-height: 1;">${c.code}</span>
                    <div style="position: absolute; left: 2px; top: 3px; width: 3px; height: 4px; background: #fef08a; border-radius: 0.5px;"></div>
                    <div style="position: absolute; right: 2px; top: 3px; width: 3px; height: 4px; background: #fef08a; border-radius: 0.5px;"></div>
                    ${isTail ? '<div style="position: absolute; bottom: 1px; left: 7px; width: 8px; height: 3px; background: #ef4444; border-radius: 1px; box-shadow: 0 0 8px 3px #ef4444;"></div>' : ''}
                </div>
            `;
        });
    }

    const { isKaAtFront, coaches } = getTrainCoachesList(train);
    const firstCode = coaches[0] ? coaches[0].code : (isKaAtFront ? 'ক' : 'ড');
    const lastCode = coaches[coaches.length - 1] ? coaches[coaches.length - 1].code : (isKaAtFront ? 'ড' : 'ক');
    const totalHeight = 36 + ((type === 'COMMUTER' ? 3 : (type === 'FREIGHT' ? 4 : coaches.length)) * 19) + 40;

    return L.divIcon({
        className: 'custom-realistic-station-train-marker',
        html: `
            <div style="position: relative; width: 80px; height: ${totalHeight}px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; cursor: pointer;">
                
                <!-- Floating Train Name Badge (Staggered per line to eliminate text collision!) -->
                <div class="train-roof-nameplate" style="position: absolute; top: ${badgeTop}px; left: 50%; transform: translateX(-50%); background: rgba(9, 13, 22, 0.96); border: 2px solid ${statusBorder}; border-radius: 8px; padding: 3px 8px; font-size: 11px; font-weight: 800; color: #ffffff; white-space: nowrap; box-shadow: 0 8px 22px rgba(0,0,0,0.95); display: flex; flex-direction: column; align-items: center; gap: 2px; z-index: 50; pointer-events: none;">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span>${signalDot}</span>
                        <span style="color: #facc15; font-weight: 900;">[লাইন-${lineNo}]</span>
                        <span>${train.name}</span>
                        ${speed > 0 ? `<span style="color: #34d399; font-size: 10px; font-family: monospace;">⚡ ${speed} km/h</span>` : `<span style="color: #cbd5e1; font-size: 9.5px;">(দাঁড়িয়ে)</span>`}
                    </div>
                    ${type === 'INTERCITY' ? `
                        <div style="font-size: 8px; font-weight: 700; color: #facc15; display: flex; align-items: center; gap: 2px;">
                            <span>বগি:</span>
                            <span style="color: #a7f3d0;">[ইঞ্জিন]</span>
                            <span>➔</span>
                            <span style="color: #fde047; text-decoration: underline;">${firstCode} (শুরু)</span>
                            <span>...</span>
                            <span style="color: ${lastCode === 'ক' ? '#fb7185' : '#f87171'}; font-weight: 900;">${lastCode} (লেজ 🚨)</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Realistic Multi-Car Train Body with All Coaches Linked Along Track -->
                <div style="width: 30px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.95)); margin-top: 14px;">
                    
                    <!-- 1. Locomotive Engine -->
                    <div style="width: 28px; height: 38px; background: ${locoGradient}; border-radius: 9px 9px 2px 2px; border: 2px solid ${statusBorder}; position: relative; box-shadow: inset 0 2px 4px rgba(255,255,255,0.4);">
                        <div style="position: absolute; top: 2px; left: 3px; width: 5px; height: 5px; background: #ffffff; border-radius: 9999px; box-shadow: 0 0 10px 3px #fef08a;"></div>
                        <div style="position: absolute; top: 2px; right: 3px; width: 5px; height: 5px; background: #ffffff; border-radius: 9999px; box-shadow: 0 0 10px 3px #fef08a;"></div>
                        <div style="position: absolute; top: 8px; left: 2px; right: 2px; height: 3px; background: #facc15;"></div>
                        <div style="position: absolute; top: 13px; left: 3px; right: 3px; height: 6px; background: #38bdf8; border-radius: 1px; border: 1px solid #0284c7;"></div>
                        <div style="position: absolute; bottom: 1px; left: 0; right: 0; text-align: center; font-size: 7px; font-weight: 900; color: #fef08a; letter-spacing: 0.5px;">${locoTag}</div>
                    </div>

                    <!-- 2. Dynamic Coaches -->
                    ${coachesHtml}

                </div>
            </div>
        `,
        iconSize: [80, totalHeight],
        iconAnchor: [40, 20]
    });
}

// Plot All Station Yard Real Trains directly on the Live Satellite Tracks
function plotStationYardOnMap(yardData) {
    if (!leafletMap) return;

    if (!crossingLayerGroup) {
        crossingLayerGroup = L.layerGroup().addTo(leafletMap);
    } else {
        crossingLayerGroup.clearLayers();
    }

    // Render Authentic Realistic Trains directly on the actual physical satellite tracks (zero fake drawn lines)
    yardData.tracks.forEach(track => {
        const tLat = track.latitude;
        const tLng = track.longitude;

        if (track.train) {
            const tr = track.train;
            const trainIcon = createRealisticStationTrainIcon(tr, track.line_no, track.line_no === 1);
            const trainMarker = L.marker([tLat, tLng], { 
                icon: trainIcon,
                zIndexOffset: track.line_no === 1 ? 500 : 400
            });

            trainMarker.bindPopup(`
                <div style="font-family: inherit; font-size: 12px; color: #0f172a; min-width: 230px;">
                    <div style="font-weight: 800; font-size: 14px; color: #0f766e; border-bottom: 2px solid #0d9488; padding-bottom: 4px; margin-bottom: 6px;">
                        [${tr.number}] ${tr.name}
                    </div>
                    <div style="line-height: 1.6;">
                        <div>🚉 <strong>ট্র্যাক:</strong> ${track.name} (${track.platform})</div>
                        <div>🚦 <strong>সিগন্যাল স্থিতি:</strong> <span style="font-weight: bold; color: ${track.signal === 'GREEN' ? '#059669' : '#d97706'};">${track.signal === 'GREEN' ? '🟢 ক্লিয়ার / সবুজ' : (track.signal === 'YELLOW' ? '🟡 সতর্কতা / হলুদ (লুপ স্টপ)' : '🔴 স্টপ')}</span></div>
                        <div>⚡ <strong>গতি:</strong> ${tr.speed || 0} কিমি/ঘণ্টা ${tr.speed === 0 ? '(স্থির দাঁড়িয়ে আছে)' : '(স্টেশনে রানিং)'}</div>
                        <div>📋 <strong>অপারেশনাল ভূমিকা:</strong> ${tr.role_bn}</div>
                        ${tr.origin ? `<div>🗺️ <strong>রুট:</strong> ${tr.origin} ➔ ${tr.destination}</div>` : ''}
                        <div>📏 <strong>গেজ:</strong> ${track.gauge}</div>
                    </div>
                    <button onclick="zoomToCrossingStation()" style="margin-top: 8px; width: 100%; background: #0d9488; color: white; border: none; padding: 5px 8px; border-radius: 6px; font-weight: bold; font-size: 11px; cursor: pointer;">
                        🛰️ ট্র্যাকে আরও কাছে জুম করুন
                    </button>
                </div>
            `);
            crossingLayerGroup.addLayer(trainMarker);
        }
    });
}

async function fetchAndRenderStationYard(stationName = 'Saidpur', trainNum = '766') {
    try {
        const res = await fetch(`/api/station_yard?station=${encodeURIComponent(stationName)}&train=${encodeURIComponent(trainNum)}`);
        const data = await res.json();
        if (data.status === 'success') {
            currentYardData = data;
            renderStationYardBoard(data);
            plotStationYardOnMap(data);
        }
    } catch (e) {
        console.error('Failed to load station yard:', e);
    }
}

function renderStationYardBoard(yardData) {
    const titleEl = document.getElementById('yard-station-title');
    const logEl = document.getElementById('yard-dispatcher-log');
    const container = document.getElementById('yard-tracks-container');
    if (!container) return;

    if (titleEl) {
        titleEl.textContent = `${yardData.station_name_bn}: লাইভ ট্র্যাক ও প্ল্যাটফর্ম বিন্যাস (${yardData.division})`;
    }
    if (logEl && yardData.crossing_info) {
        logEl.textContent = yardData.crossing_info.dispatcher_log;
    }

    let html = '';
    yardData.tracks.forEach(track => {
        let signalBg = 'bg-rose-500 text-rose-100 border-rose-400';
        let signalIcon = '🔴';
        let signalText = 'স্টপ / লাল';

        if (track.signal === 'GREEN') {
            signalBg = 'bg-emerald-500 text-emerald-950 border-emerald-300 font-black animate-pulse';
            signalIcon = '🟢';
            signalText = 'ক্লিয়ার / সবুজ';
        } else if (track.signal === 'YELLOW') {
            signalBg = 'bg-amber-400 text-slate-950 border-amber-200 font-black animate-pulse';
            signalIcon = '🟡';
            signalText = 'সতর্কতা / হলুদ (লুপ স্টপ)';
        }

        let trainInfoHtml = '';
        if (track.train) {
            const isMain = track.type === 'MAIN';
            const cardBg = isMain ? 'from-emerald-950/60 to-slate-900 border-emerald-500/50' : 'from-amber-950/60 to-slate-900 border-amber-500/50';
            trainInfoHtml = `
                <div class="mt-2 p-2.5 rounded-xl bg-gradient-to-r ${cardBg} border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <span class="text-xl">${isMain ? '🚄' : '🚆'}</span>
                        <div>
                            <div class="font-bold text-white text-xs flex items-center gap-1.5">
                                <span>[${track.train.number}] ${track.train.name}</span>
                                <span class="px-1.5 py-0.2 rounded text-[10px] ${isMain ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/30 text-amber-300'} font-bold">${track.train.badge || track.train.role_bn || 'উপস্থিত'}</span>
                            </div>
                            <div class="text-[10px] text-slate-300 mt-0.5">
                                ${track.train.origin ? `${track.train.origin} ➔ ${track.train.destination}` : ''} | গতি: ${track.train.speed || 0} কিমি/ঘণ্টা
                            </div>
                        </div>
                    </div>
                    <div class="text-right flex items-center gap-2 self-end sm:self-center">
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${isMain ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'} font-bold">
                            ${isMain ? 'মেইন লাইন থ্রু পাস' : 'লুপে ক্রসিং পাস অপেক্ষমাণ'}
                        </span>
                    </div>
                </div>
            `;
        } else {
            trainInfoHtml = `
                <div class="mt-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-slate-600"></span>
                    <span>ফাঁকা ট্র্যাক — কোনো ট্রেন অবস্থান করছে না (Clear Track)</span>
                </div>
            `;
        }

        html += `
            <div class="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                            #${track.line_no}
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h4 class="font-bold text-white text-xs sm:text-sm">${track.name}</h4>
                                <span class="px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-medium">${track.platform}</span>
                                <span class="px-2 py-0.2 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[10px] font-mono">${track.gauge}</span>
                            </div>
                            <p class="text-[10px] text-slate-400 mt-0.5">${track.description}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center">
                        <span class="px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 ${signalBg}">
                            <span>${signalIcon}</span>
                            <span>${signalText}</span>
                        </span>
                    </div>
                </div>
                ${trainInfoHtml}
            </div>
        `;
    });

    container.innerHTML = html;
}

function zoomToCrossingStation() {
    if (!currentCrossingData || !leafletMap) return;
    const lat = currentCrossingData.station_lat;
    const lng = currentCrossingData.station_lng;
    
    // Switch to satellite layer so high-resolution railway tracks & switches are crisp
    setMapLayer('satellite');
    
    // Zoom in close to station yard
    leafletMap.setView([lat, lng], 17, { animate: true });
    
    // Set realistic 35 deg 3D tilt
    mapTilt = 35;
    applyMap3DTransform();
    
    showToast(`🛰️ ${currentCrossingData.station_bn}-এ ১৭x স্যাটেলাইট ইয়ার্ড জুম করা হয়েছে!`, 'success');
}

function scrollToStationYard() {
    const el = document.getElementById('station-yard-section');
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast('🚉 স্টেশন ট্র্যাক ও ইয়ার্ড মনিটর প্রদর্শিত হচ্ছে', 'info');
    }
}

function refreshLiveCrossings() {
    const trainNum = (selectedMapTrain && selectedMapTrain !== 'ALL') ? selectedMapTrain : '766';
    fetchAndRenderLiveCrossings(trainNum);
    showToast('🔄 লাইভ ক্রসিং ও সিগন্যাল অবস্থা রিফ্রেশ করা হয়েছে', 'success');
}

// ==============================================================================
// AUTOMATIC SATELLITE & TIMETABLE CALIBRATION ENGINE (SEAMLESS BACKGROUND TRACKING)
// ==============================================================================

let liveTrainMonotonicState = {};

// Accurate Haversine Distance Helper in KM
function getHaversineDistKm(lat1, lon1, lat2, lon2) {
    const R = 6371.0;
    const dLat = (lat2 - lat1) * Math.PI / 180.0;
    const dLon = (lon2 - lon1) * Math.PI / 180.0;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180.0) * Math.cos(lat2 * Math.PI / 180.0) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// High-Precision Distance-Weighted Track Interpolator
// Guaranteed to position train directly on top of physical rail tracks
function getPointAlongRouteByFraction(coords, fraction) {
    if (!coords || coords.length === 0) return null;
    if (coords.length === 1) return { lat: coords[0].lat, lng: coords[0].lng, bearing: 0 };

    if (!coords._cumDists || coords._cumDists.length !== coords.length) {
        const cum = [0.0];
        let total = 0.0;
        for (let i = 0; i < coords.length - 1; i++) {
            const p1 = coords[i];
            const p2 = coords[i + 1];
            const d = getHaversineDistKm(p1.lat, p1.lng, p2.lat, p2.lng);
            total += d;
            cum.push(total);
        }
        coords._cumDists = cum;
        coords._totalDist = total;
    }

    const totalKm = coords._totalDist || 1.0;
    const targetKm = Math.max(0, Math.min(totalKm, fraction * totalKm));
    const cum = coords._cumDists;

    let segIdx = 0;
    for (let i = 0; i < cum.length - 1; i++) {
        if (cum[i] <= targetKm && targetKm <= cum[i + 1]) {
            segIdx = i;
            break;
        }
    }
    if (segIdx >= coords.length - 1) segIdx = coords.length - 2;

    const segStart = cum[segIdx];
    const segEnd = cum[segIdx + 1];
    const segLen = Math.max(0.0001, segEnd - segStart);
    const segFrac = Math.max(0.0, Math.min(1.0, (targetKm - segStart) / segLen));

    const pA = coords[segIdx];
    const pB = coords[segIdx + 1];
    const curLat = pA.lat + (pB.lat - pA.lat) * segFrac;
    const curLng = pA.lng + (pB.lng - pA.lng) * segFrac;

    // Track tangent bearing
    const y = Math.sin((pB.lng - pA.lng) * Math.PI / 180.0) * Math.cos(pB.lat * Math.PI / 180.0);
    const x = Math.cos(pA.lat * Math.PI / 180.0) * Math.sin(pB.lat * Math.PI / 180.0) -
              Math.sin(pA.lat * Math.PI / 180.0) * Math.cos(pB.lat * Math.PI / 180.0) * Math.cos((pB.lng - pA.lng) * Math.PI / 180.0);
    const bearing = (Math.atan2(y, x) * 180.0 / Math.PI + 360.0) % 360.0;

    return { lat: curLat, lng: curLng, bearing: Math.round(bearing * 10) / 10 };
}

// Live Continuous Motion Engine along Track Polyline
function startLiveTrainMotionLoop(trainData, routeCoords, isBackground = false) {
    if (!trainData.is_running || !routeCoords || routeCoords.length < 2) {
        if (liveMotionAnimFrame && !isBackground) {
            cancelAnimationFrame(liveMotionAnimFrame);
            liveMotionAnimFrame = null;
        }
        return;
    }

    const trainNum = trainData.number;
    const serverFrac = Math.min(0.999, Math.max(0.0, (trainData.progress_pct || 0) / 100.0));

    // If already tracking this train and background poll occurs:
    if (liveTrainMonotonicState[trainNum] && liveMotionAnimFrame) {
        const state = liveTrainMonotonicState[trainNum];
        // If server target significantly differs or moved back due to ground-truth recalibration:
        if (Math.abs(serverFrac - state.progressFraction) > 0.015 || serverFrac < state.progressFraction) {
            state.progressFraction = serverFrac;
        }
        state.serverTarget = serverFrac;
        state.speedKmh = trainData.current_speed_kmh || 74;
        state.trainData = trainData;
        state.routeCoords = routeCoords;
        return;
    }

    // New train selected or initial startup
    if (liveMotionAnimFrame) {
        cancelAnimationFrame(liveMotionAnimFrame);
        liveMotionAnimFrame = null;
    }

    liveTrainMonotonicState[trainNum] = {
        progressFraction: serverFrac,
        serverTarget: serverFrac,
        speedKmh: trainData.current_speed_kmh || 74,
        trainData: trainData,
        routeCoords: routeCoords
    };

    let lastTime = performance.now();

    function step(now) {
        const state = liveTrainMonotonicState[trainNum];
        if (!state || !state.trainData.is_running) return;

        const deltaSec = (now - lastTime) / 1000.0;
        lastTime = now;

        const speedKmh = state.speedKmh || 74;
        const totalKm = state.routeCoords._totalDist || 450.0;
        const baseRate = speedKmh / (totalKm * 3600);
        state.progressFraction += baseRate * deltaSec;

        // Smoothly glide towards server target if target is ahead
        if (state.serverTarget > state.progressFraction) {
            const diff = state.serverTarget - state.progressFraction;
            state.progressFraction += diff * Math.min(1.0, deltaSec * 0.25);
        }

        if (state.progressFraction > 0.999) state.progressFraction = 0.999;

        const pt = getPointAlongRouteByFraction(state.routeCoords, state.progressFraction);
        if (pt) {
            lastTrackedTrainLat = pt.lat;
            lastTrackedTrainLng = pt.lng;

            const marker = trainMarkers[trainNum];
            if (marker && marker.setLatLng) {
                marker.setLatLng([pt.lat, pt.lng]);
                const el = marker.getElement();
                if (el) {
                    const rotEl = el.querySelector('.custom-train-rotate-body');
                    if (rotEl) {
                        rotEl.style.transform = `rotate(${pt.bearing}deg)`;
                    }
                }
            }

            if (isAutoFollowTrain && leafletMap) {
                leafletMap.panTo([pt.lat, pt.lng], { animate: false });
            }
        }

        liveMotionAnimFrame = requestAnimationFrame(step);
    }

    liveMotionAnimFrame = requestAnimationFrame(step);
}

// Update 3D Journey HUD
function update3DJourneyHUD(train) {
    activeJourneyTrain = train;
    const titleEl = document.getElementById('journey-cam-train-title');
    if (titleEl) {
        titleEl.textContent = `[${train.number}] ${train.name_bn}: লাইভ চলমান ৩D ককপিট ভিউ`;
    }
    const speedEl = document.getElementById('hud-sim-speed');
    if (speedEl) speedEl.textContent = train.current_speed_kmh;
    
    const headEl = document.getElementById('hud-sim-heading');
    if (headEl) headEl.textContent = `${train.bearing || 0}° ${train.compass_bn || 'দক্ষিণ-পূর্ব'}`;

    const locEl = document.getElementById('hud-sim-location');
    if (locEl) locEl.textContent = train.current_area || `${train.last_station} ➔ ${train.next_station}`;

    const nextEl = document.getElementById('hud-sim-next');
    if (nextEl) nextEl.textContent = `${train.next_station} ${train.distance_to_next_km ? '(দূরত্ব ' + train.distance_to_next_km + ' কিমি)' : ''}`;
}

// Reliable Web Audio Context Initialization
function initAudioContext() {
    try {
        if (!audioCtx) {
            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
            if (AudioCtxClass) {
                audioCtx = new AudioCtxClass();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    } catch (e) {
        console.warn('AudioContext initialization error:', e);
    }
}

// Switch Track Video Channel (1080p Real Bangladesh Railway Footage)
function changeTrackVideo(channelId) {
    const iframe = document.getElementById('train-youtube-iframe');
    const validId = channelId || 'jwPwuSYEC3o';
    if (iframe) {
        iframe.src = `https://www.youtube.com/embed/${validId}?autoplay=1&mute=1&controls=1&rel=0`;
        showToast('📹 লাইভ ট্র্যাক ভিডিও চ্যানেল লোড হচ্ছে...', 'info');
    }
}

function playTrackVideoNow() {
    const select = document.getElementById('video-channel-select');
    const channelId = select ? select.value : 'jwPwuSYEC3o';
    changeTrackVideo(channelId);
    showToast('▶️ ট্র্যাক ভিডিও রিফ্রেশ ও চালু করা হয়েছে!', 'success');
}

function openCurrentTrackVideoInNewTab() {
    const select = document.getElementById('video-channel-select');
    const channelId = select ? select.value : 'jwPwuSYEC3o';
    window.open(`https://www.youtube.com/watch?v=${channelId}`, '_blank');
}

// Switch 3D Simulator View Mode ('3d' | 'video' | 'window')
function setJourneyViewMode(mode) {
    currentJourneyMode = mode;
    const canvas3D = document.getElementById('train-3d-canvas');
    const vidCont = document.getElementById('train-video-container');
    const winCont = document.getElementById('train-window-container');

    if (canvas3D) canvas3D.classList.toggle('hidden', mode !== '3d');
    if (vidCont) vidCont.classList.toggle('hidden', mode !== 'video');
    if (winCont) winCont.classList.toggle('hidden', mode !== 'window');

    ['3d', 'video', 'window'].forEach(m => {
        const btn = document.getElementById(`btn-view-${m}`);
        if (btn) {
            if (m === mode) {
                btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-emerald-600 text-white shadow';
            } else {
                btn.className = 'px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition flex items-center gap-1.5';
            }
        }
    });

    if (mode === 'video') {
        const select = document.getElementById('video-channel-select');
        const channel = select ? select.value : 'jwPwuSYEC3o';
        changeTrackVideo(channel);
    }
}

// Synthesize Authentic Train Sound Engine (Web Audio API)
function toggleTrainSound() {
    trainSoundActive = !trainSoundActive;
    const btn = document.getElementById('btn-train-sound');
    const icon = document.getElementById('sound-icon');
    const label = document.getElementById('sound-label');

    if (trainSoundActive) {
        initAudioContext();
        if (icon) icon.textContent = '🔊';
        if (label) label.textContent = 'সাউন্ড অন';
        if (btn) {
            btn.classList.add('bg-emerald-600/30', 'text-emerald-300', 'border-emerald-500/50');
            btn.classList.remove('bg-slate-800', 'text-slate-300');
        }
        playTrainTrackSoundLoop();
        showToast('🔊 ট্রেনের লাইভ সাউন্ড সক্রিয় হয়েছে (ঝিক-ঝিক ও ট্র্যাক সাউন্ড)', 'success');
    } else {
        if (icon) icon.textContent = '🔈';
        if (label) label.textContent = 'সাউন্ড অফ';
        if (btn) {
            btn.classList.remove('bg-emerald-600/30', 'text-emerald-300', 'border-emerald-500/50');
            btn.classList.add('bg-slate-800', 'text-slate-300');
        }
        if (trainSoundTimer) {
            clearTimeout(trainSoundTimer);
            trainSoundTimer = null;
        }
    }
}

function playTrainTrackSoundLoop() {
    if (!trainSoundActive) return;
    playTrackRhythm();
    const interval = Math.max(500, 1100 - (activeJourneyTrain?.current_speed_kmh || 74) * 6);
    trainSoundTimer = setTimeout(playTrainTrackSoundLoop, interval);
}

function playTrackRhythm() {
    try {
        if (!audioCtx) initAudioContext();
        if (!audioCtx || audioCtx.state === 'suspended') return;

        const now = audioCtx.currentTime;
        // White noise click for steel wheel on rail joint
        const bufferSize = Math.floor(audioCtx.sampleRate * 0.05);
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(650, now);
        filter.Q.setValueAtTime(3.0, now);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(now);

        // Secondary clack
        setTimeout(() => {
            if (!trainSoundActive || !audioCtx) return;
            const n2 = audioCtx.createBufferSource();
            n2.buffer = buffer;
            const g2 = audioCtx.createGain();
            g2.gain.setValueAtTime(0.06, audioCtx.currentTime);
            g2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
            n2.connect(filter);
            filter.connect(g2);
            g2.connect(audioCtx.destination);
            n2.start(audioCtx.currentTime);
        }, 110);
    } catch (e) {
        // Silently catch audio errors
    }
}

function playTrainHorn() {
    initAudioContext();
    if (!audioCtx) return;

    try {
        const now = audioCtx.currentTime;
        // Authentic Bangladesh Railway EMD Dual-Tone Diesel Horn: 311 Hz and 370 Hz
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(311.13, now); // Eb4
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(369.99, now); // F#4

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.2, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.6);
        osc2.stop(now + 1.6);
        showToast('📢 ট্রেনের হুইসেল বাজানো হয়েছে!', 'info');
    } catch (e) {
        console.warn('Horn failed:', e);
    }
}

// 3D Perspective Railway Canvas Renderer (60 FPS Track, Scenery, Speedometer)
function init3DJourneyEngine() {
    const canvas = document.getElementById('train-3d-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const winCanvas = document.getElementById('train-window-canvas');
    const winCtx = winCanvas ? winCanvas.getContext('2d') : null;

    let trackOffset = 0;
    let poleOffset = 0;

    function resizeCanvases() {
        if (canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth || 800;
            canvas.height = canvas.parentElement.clientHeight || 350;
        }
        if (winCanvas && winCanvas.parentElement) {
            winCanvas.width = winCanvas.parentElement.clientWidth || 800;
            winCanvas.height = winCanvas.parentElement.clientHeight || 350;
        }
    }
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);

    function render3D(time) {
        if (currentJourneyMode === '3d') {
            const w = canvas.width;
            const h = canvas.height;
            const speed = (activeJourneyTrain?.current_speed_kmh || 74);
            const speedFactor = (speed / 70.0) * 8;

            trackOffset = (trackOffset + speedFactor) % 40;
            poleOffset = (poleOffset + speedFactor * 0.8) % 120;

            // 1. Sky & Horizon (Nighttime Atmosphere matching BD Local Time)
            const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
            skyGrad.addColorStop(0, '#020617');
            skyGrad.addColorStop(0.7, '#0f172a');
            skyGrad.addColorStop(1, '#064e3b');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, w, h * 0.55);

            // Stars
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            for (let i = 0; i < 25; i++) {
                const sx = (i * 73) % w;
                const sy = (i * 29) % (h * 0.4);
                ctx.fillRect(sx, sy, 1.5, 1.5);
            }

            // Distant Mountains / Trees Horizon
            ctx.fillStyle = '#062e24';
            ctx.beginPath();
            ctx.moveTo(0, h * 0.55);
            for (let x = 0; x <= w; x += 40) {
                const treeH = Math.sin(x * 0.05) * 8 + 12;
                ctx.lineTo(x, h * 0.55 - treeH);
            }
            ctx.lineTo(w, h * 0.55);
            ctx.closePath();
            ctx.fill();

            // 2. Ground Terrain (Green Fields of Bangladesh)
            const groundGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
            groundGrad.addColorStop(0, '#064e3b');
            groundGrad.addColorStop(0.4, '#042f2e');
            groundGrad.addColorStop(1, '#022c22');
            ctx.fillStyle = groundGrad;
            ctx.fillRect(0, h * 0.55, w, h * 0.45);

            // 3. Vanishing Point for 3D Tracks
            const vpX = w * 0.5;
            const vpY = h * 0.52;

            // Dual Headlight Projection Cones on Tracks
            const lightGrad = ctx.createRadialGradient(vpX, h * 0.85, 20, vpX, vpY, w * 0.5);
            lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
            lightGrad.addColorStop(0.6, 'rgba(254, 240, 138, 0.15)');
            lightGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = lightGrad;
            ctx.beginPath();
            ctx.moveTo(vpX - 20, vpY);
            ctx.lineTo(vpX + 20, vpY);
            ctx.lineTo(w * 0.85, h);
            ctx.lineTo(w * 0.15, h);
            ctx.closePath();
            ctx.fill();

            // Ballast Trackbed (Gravel)
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.moveTo(vpX - 35, vpY);
            ctx.lineTo(vpX + 35, vpY);
            ctx.lineTo(vpX + 220, h);
            ctx.lineTo(vpX - 220, h);
            ctx.closePath();
            ctx.fill();

            // 3D Sleepers (Ties) zooming towards camera
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 4;
            for (let i = 0; i < 14; i++) {
                const z = (i * 25 + trackOffset) % 350;
                const p = z / 350; // 0 to 1
                const y = vpY + (h - vpY) * (p * p);
                const halfW = 30 + (200 - 30) * p;

                ctx.beginPath();
                ctx.moveTo(vpX - halfW, y);
                ctx.lineTo(vpX + halfW, y);
                ctx.stroke();
            }

            // Steel Rails (Left & Right with metallic reflection)
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 5;
            // Left Rail
            ctx.beginPath();
            ctx.moveTo(vpX - 25, vpY);
            ctx.lineTo(vpX - 140, h);
            ctx.stroke();

            // Right Rail
            ctx.beginPath();
            ctx.moveTo(vpX + 25, vpY);
            ctx.lineTo(vpX + 140, h);
            ctx.stroke();

            // Highlighting Top of Rails
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(vpX - 25, vpY);
            ctx.lineTo(vpX - 140, h);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(vpX + 25, vpY);
            ctx.lineTo(vpX + 140, h);
            ctx.stroke();

            // Passing Telegraph Poles on Left & Right
            for (let i = 0; i < 4; i++) {
                const pz = (i * 100 + poleOffset) % 400;
                const pFrac = pz / 400;
                const py = vpY + (h - vpY) * pFrac;
                const pxLeft = vpX - 80 - (w * 0.38) * pFrac;
                const poleH = 20 + 90 * pFrac;

                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 2 + 3 * pFrac;
                ctx.beginPath();
                ctx.moveTo(pxLeft, py);
                ctx.lineTo(pxLeft, py - poleH);
                ctx.stroke();

                // Crossbar & Insulator
                ctx.beginPath();
                ctx.moveTo(pxLeft - 8 * pFrac, py - poleH + 4);
                ctx.lineTo(pxLeft + 8 * pFrac, py - poleH + 4);
                ctx.stroke();
            }

            // Passing Green Railway Signal on Right
            const sigX = vpX + 170;
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(sigX - 6, vpY + 40, 12, 60);
            // Green Aspect Lamp
            ctx.fillStyle = '#10b981';
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(sigX, vpY + 52, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Authentic Bangladesh Railway Class 2900 / 3000 Locomotive (Front 3D Perspective)
            const locoW = Math.min(360, w * 0.7);
            const locoH = 110;
            const locoTop = h - locoH;

            // 1. Heavy Cast-Iron Cowcatcher Pilot (বাফার ও পাইলট) at bottom
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(vpX - locoW * 0.52, h);
            ctx.lineTo(vpX - locoW * 0.42, h - 25);
            ctx.lineTo(vpX + locoW * 0.42, h - 25);
            ctx.lineTo(vpX + locoW * 0.52, h);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Cowcatcher Vertical Slats
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            for (let x = vpX - locoW * 0.4; x <= vpX + locoW * 0.4; x += 18) {
                ctx.beginPath();
                ctx.moveTo(x, h - 25);
                ctx.lineTo(x, h);
                ctx.stroke();
            }

            // Central Coupler Buffer
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(vpX - 16, h - 30, 32, 16);
            ctx.strokeStyle = '#64748b';
            ctx.strokeRect(vpX - 16, h - 30, 32, 16);

            // 2. Locomotive Main Hood (Classic BR Dark Green Metallic Body)
            const hoodGrad = ctx.createLinearGradient(0, locoTop, 0, h - 25);
            hoodGrad.addColorStop(0, '#065f46');
            hoodGrad.addColorStop(0.3, '#047857');
            hoodGrad.addColorStop(0.8, '#064e3b');
            hoodGrad.addColorStop(1, '#022c22');
            ctx.fillStyle = hoodGrad;

            ctx.beginPath();
            ctx.moveTo(vpX - locoW * 0.46, h - 25);
            ctx.lineTo(vpX - locoW * 0.32, locoTop + 25);
            ctx.lineTo(vpX - locoW * 0.22, locoTop);
            ctx.lineTo(vpX + locoW * 0.22, locoTop);
            ctx.lineTo(vpX + locoW * 0.32, locoTop + 25);
            ctx.lineTo(vpX + locoW * 0.46, h - 25);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // 3. Iconic Red & Yellow Safety V-Chevrons on Locomotive Nose
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(vpX - locoW * 0.26, locoTop + 32);
            ctx.lineTo(vpX, locoTop + 55);
            ctx.lineTo(vpX + locoW * 0.26, locoTop + 32);
            ctx.lineTo(vpX + locoW * 0.26, locoTop + 45);
            ctx.lineTo(vpX, locoTop + 68);
            ctx.lineTo(vpX - locoW * 0.26, locoTop + 45);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(vpX - locoW * 0.26, locoTop + 48);
            ctx.lineTo(vpX, locoTop + 71);
            ctx.lineTo(vpX + locoW * 0.26, locoTop + 48);
            ctx.lineTo(vpX + locoW * 0.26, locoTop + 56);
            ctx.lineTo(vpX, locoTop + 79);
            ctx.lineTo(vpX - locoW * 0.26, locoTop + 56);
            ctx.closePath();
            ctx.fill();

            // 4. Dual Sealed-Beam High-Intensity Headlights
            const hlY = locoTop + 14;
            const hlOffset = locoW * 0.12;

            [vpX - hlOffset, vpX + hlOffset].forEach(hlX => {
                // Chrome Bezel
                ctx.fillStyle = '#94a3b8';
                ctx.beginPath();
                ctx.arc(hlX, hlY, 11, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#f8fafc';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Bright Halogen Light Lens
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#fef08a';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.arc(hlX, hlY, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            // 5. Locomotive Plaque / Road Number Banner
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(vpX - 90, h - 52, 180, 18);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(vpX - 90, h - 52, 180, 18);

            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`বাংলাদেশ রেলওয়ে • [${activeJourneyTrain?.number || 804}] ${activeJourneyTrain?.name_bn || 'আন্তঃনগর'}`, vpX, h - 39);

            // 6. Stainless Steel Handrails
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            // Left Rail
            ctx.beginPath();
            ctx.moveTo(vpX - locoW * 0.44, h - 25);
            ctx.lineTo(vpX - locoW * 0.44, locoTop + 20);
            ctx.lineTo(vpX - locoW * 0.22, locoTop + 10);
            ctx.stroke();
            // Right Rail
            ctx.beginPath();
            ctx.moveTo(vpX + locoW * 0.44, h - 25);
            ctx.lineTo(vpX + locoW * 0.44, locoTop + 20);
            ctx.lineTo(vpX + locoW * 0.22, locoTop + 10);
            ctx.stroke();
        }

        // Render Passenger Window View if active
        if (currentJourneyMode === 'window' && winCtx) {
            const ww = winCanvas.width;
            const wh = winCanvas.height;
            const speed = (activeJourneyTrain?.current_speed_kmh || 74);
            const wSpeed = (speed / 70.0) * 12;

            trackOffset = (trackOffset + wSpeed) % ww;

            // Window Sky
            const wSky = winCtx.createLinearGradient(0, 0, 0, wh * 0.6);
            wSky.addColorStop(0, '#090d16');
            wSky.addColorStop(1, '#064e3b');
            winCtx.fillStyle = wSky;
            winCtx.fillRect(0, 0, ww, wh * 0.6);

            // Ground
            winCtx.fillStyle = '#065f46';
            winCtx.fillRect(0, wh * 0.6, ww, wh * 0.4);

            // Rushing Trees & Landscape
            for (let i = 0; i < 15; i++) {
                const tx = (i * 90 - trackOffset + ww * 2) % (ww + 100) - 50;
                winCtx.fillStyle = '#022c22';
                winCtx.fillRect(tx + 15, wh * 0.45, 10, 45);
                winCtx.fillStyle = '#047857';
                winCtx.beginPath();
                winCtx.arc(tx + 20, wh * 0.42, 22, 0, Math.PI * 2);
                winCtx.fill();
            }

            // Power Line Wire bouncing
            winCtx.strokeStyle = '#475569';
            winCtx.lineWidth = 1.5;
            winCtx.beginPath();
            winCtx.moveTo(0, wh * 0.25);
            for (let x = 0; x < ww; x += 120) {
                winCtx.quadraticCurveTo(x + 60, wh * 0.32, x + 120, wh * 0.25);
            }
            winCtx.stroke();
        }

        journey3DAnimFrame = requestAnimationFrame(render3D);
    }

    journey3DAnimFrame = requestAnimationFrame(render3D);
}

// Auto-boot 3D journey engine when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3DJourneyEngine);
} else {
    setTimeout(init3DJourneyEngine, 300);
}

// ============================================================================
// STATION-BY-STATION LIVE TICKET SCANNER & SEAT RADAR ENGINE
// ============================================================================
let lastScannedStationRecords = [];
let stationScannerInitialized = false;
let showAllPassedStations = true;

function initStationTicketScannerTab() {
    const dateInput = document.getElementById('station-scan-date');
    if (dateInput && !dateInput.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    const trainSelect = document.getElementById('station-scan-train-select');
    if (trainSelect) {
        // Evening / night check: Nilsagor 766 is actively running
        const currentHour = new Date().getHours();
        if (currentHour >= 17 || currentHour <= 6) {
            trainSelect.value = '766';
        }
    }

    onStationScanTrainChange();

    // Auto-run if empty or initial state
    const grid = document.getElementById('station-tickets-results-grid');
    if (grid && (!grid.children || grid.children.length <= 1)) {
        runStationTicketScan();
    }
}

function quickSelectStationScanTrain(trainNum) {
    const select = document.getElementById('station-scan-train-select');
    const searchInput = document.getElementById('station-scan-train-search');
    if (select) {
        select.value = trainNum;
        const train = (allTrains || []).find(t => String(t.number) === String(trainNum));
        if (train && searchInput) {
            searchInput.value = `[${train.number}] ${train.name_bn}`;
        }
        onStationScanTrainChange();
        runStationTicketScan();
        showToast(`🚄 ট্রেন [${trainNum}] ${train ? train.name_bn : ''} নির্বাচন করা হয়েছে!`, 'info');
    }
}

// -------------------------------------------------------------
// Real-Time Train Search & Auto-Complete Engine
// -------------------------------------------------------------
function onStationScanSearchInput(query) {
    const dropdown = document.getElementById('station-scan-search-dropdown');
    const clearBtn = document.getElementById('btn-clear-scan-search');
    if (!dropdown) return;

    const q = (query || '').trim().toLowerCase();
    if (clearBtn) clearBtn.classList.toggle('hidden', q.length === 0);

    if (q.length === 0) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
        return;
    }

    const matches = (allTrains || []).filter(t => {
        const numMatch = String(t.number).toLowerCase().includes(q);
        const nameEnMatch = (t.name_en || '').toLowerCase().includes(q);
        const nameBnMatch = (t.name_bn || '').toLowerCase().includes(q);
        const originMatch = (t.origin || '').toLowerCase().includes(q);
        const destMatch = (t.destination || '').toLowerCase().includes(q);
        const stopMatch = (t.stoppages || []).some(s => s.toLowerCase().includes(q));
        return numMatch || nameEnMatch || nameBnMatch || originMatch || destMatch || stopMatch;
    });

    if (matches.length === 0) {
        dropdown.innerHTML = `
            <div class="p-3.5 text-center text-slate-400 text-xs">
                কোনো ট্রেন পাওয়া যায়নি ("${query}")
            </div>
        `;
        dropdown.classList.remove('hidden');
        return;
    }

    let html = '';
    matches.forEach(t => {
        html += `
            <div onclick="selectTrainFromStationScanSearch('${t.number}')" class="p-3 hover:bg-emerald-950/70 cursor-pointer flex items-center justify-between text-xs transition group">
                <div class="space-y-0.5">
                    <div class="font-bold text-white group-hover:text-emerald-300 flex items-center gap-1.5">
                        <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">#${t.number}</span>
                        <span>${t.name_bn}</span>
                        <span class="text-[11px] text-slate-400 font-normal">(${t.name_en})</span>
                    </div>
                    <div class="text-[11px] text-slate-400">
                        যাত্রাপথ: <strong class="text-slate-200">${t.origin}</strong> ➔ <strong class="text-emerald-400">${t.destination}</strong>
                        <span class="text-slate-500 ml-1.5">| ছাড়ার সময়: <span class="text-amber-300 font-mono">${t.departure}</span></span>
                    </div>
                </div>
                <span class="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-300 border border-slate-700 font-bold group-hover:border-emerald-500 flex-shrink-0">
                    সিলেক্ট করুন ➔
                </span>
            </div>
        `;
    });

    dropdown.innerHTML = html;
    dropdown.classList.remove('hidden');
}

function selectTrainFromStationScanSearch(trainNum) {
    const searchInput = document.getElementById('station-scan-train-search');
    const dropdown = document.getElementById('station-scan-search-dropdown');
    const select = document.getElementById('station-scan-train-select');
    const clearBtn = document.getElementById('btn-clear-scan-search');
    
    if (dropdown) dropdown.classList.add('hidden');
    
    const train = (allTrains || []).find(t => String(t.number) === String(trainNum));
    if (train && searchInput) {
        searchInput.value = `[${train.number}] ${train.name_bn} (${train.origin} ➔ ${train.destination})`;
    }
    if (clearBtn) clearBtn.classList.remove('hidden');

    if (select) {
        select.value = trainNum;
    }

    onStationScanTrainChange();
    runStationTicketScan();
    showToast(`🚄 [${trainNum}] ${train ? train.name_bn : ''} নির্বাচন করা হয়েছে!`, 'success');
}

function clearStationScanSearch() {
    const searchInput = document.getElementById('station-scan-train-search');
    const dropdown = document.getElementById('station-scan-search-dropdown');
    const clearBtn = document.getElementById('btn-clear-scan-search');
    if (searchInput) searchInput.value = '';
    if (dropdown) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
    }
    if (clearBtn) clearBtn.classList.add('hidden');
}

function onStationScanSearchFocus() {
    const searchInput = document.getElementById('station-scan-train-search');
    if (searchInput && searchInput.value.trim().length > 0) {
        onStationScanSearchInput(searchInput.value);
    }
}

// Close search dropdown on click outside
document.addEventListener('click', (e) => {
    const searchWrapper = document.getElementById('station-scan-train-search');
    const dropdown = document.getElementById('station-scan-search-dropdown');
    if (dropdown && !dropdown.classList.contains('hidden')) {
        if (searchWrapper && !searchWrapper.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    }
});

function setStationScanDateToday() {
    const dateInput = document.getElementById('station-scan-date');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
        runStationTicketScan();
        showToast('📅 যাত্রার তারিখ আজকের দিন নির্বাচন করা হয়েছে', 'info');
    }
}

function setStationScanDateTomorrow() {
    const dateInput = document.getElementById('station-scan-date');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
        runStationTicketScan();
        showToast('📅 যাত্রার তারিখ আগামীকাল নির্বাচন করা হয়েছে', 'info');
    }
}

function togglePassedStationsFilter(showAll) {
    showAllPassedStations = showAll;
    const btnUpcoming = document.getElementById('btn-filter-upcoming');
    const btnAll = document.getElementById('btn-filter-all');

    if (btnUpcoming && btnAll) {
        if (showAll) {
            btnAll.className = 'px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 transition shadow';
            btnUpcoming.className = 'px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 transition';
        } else {
            btnUpcoming.className = 'px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 transition shadow';
            btnAll.className = 'px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 transition';
        }
    }

    const cards = document.querySelectorAll('.station-ticket-card');
    cards.forEach(card => {
        const isPassed = card.getAttribute('data-is-passed') === 'true';
        if (isPassed) {
            card.style.display = showAll ? 'block' : 'none';
        } else {
            card.style.display = 'block';
        }
    });

    showToast(showAll ? '🌐 ট্রেনের সকল স্টেশন (অতিক্রান্ত সহ) প্রদর্শিত হচ্ছে' : '🟢 শুধুমাত্র সামনের আসন্ন স্টেশনগুলো ফিল্টার করা হয়েছে', 'info');
}

function onStationScanTrainChange() {
    const trainSelect = document.getElementById('station-scan-train-select');
    const fromSelect = document.getElementById('station-scan-from-select');
    const destSelect = document.getElementById('station-scan-dest-select');
    const chainCard = document.getElementById('station-route-chain-card');
    const chainItems = document.getElementById('station-route-chain-items');
    const chainTitle = document.getElementById('route-chain-title');

    if (!trainSelect) return;

    const trainNum = trainSelect.value || '766';
    const train = (allTrains || []).find(t => String(t.number) === String(trainNum));
    const stoppages = train ? (train.stoppages || []) : ["Chilahati", "Domar", "Nilphamari", "Saidpur", "Parbatipur", "Joypurhat", "Santahar", "Tangail", "Joydebpur", "Dhaka"];

    // 1. Populate From Select
    if (fromSelect) {
        let fromHtml = `<option value="">সকল প্রারম্ভিক স্টপ (${train ? train.origin : 'শুরু থেকে'})</option>`;
        stoppages.slice(0, -1).forEach(s => {
            const stnBn = (stationsGeo && stationsGeo[s]) ? stationsGeo[s].name_bn : s;
            fromHtml += `<option value="${s}">${stnBn} (${s})</option>`;
        });
        fromSelect.innerHTML = fromHtml;
    }

    // 2. Populate Destination Select
    if (destSelect) {
        let destHtml = `<option value="">শেষ গন্তব্য (${train ? train.destination : 'Default'})</option>`;
        stoppages.slice(1).forEach(s => {
            const stnBn = (stationsGeo && stationsGeo[s]) ? stationsGeo[s].name_bn : s;
            destHtml += `<option value="${s}">${stnBn} (${s})</option>`;
        });
        destSelect.innerHTML = destHtml;
    }

    // 3. Render Route Chain
    if (chainCard && chainItems) {
        chainCard.classList.remove('hidden');
        if (chainTitle) {
            chainTitle.innerHTML = `<span class="text-white font-bold">[${trainNum}] ${train ? train.name_bn : 'ট্রেন'}</span>: সম্পূর্ণ যাত্রাপথ (${train ? train.origin : ''} ➔ ${train ? train.destination : ''}) — <span class="text-emerald-400 font-normal">যেকোনো স্টেশনে ক্লিক করে সরাসরি টিকিট দেখুন</span>`;
        }

        let chainHtml = '';
        stoppages.forEach((stn, idx) => {
            const isLast = (idx === stoppages.length - 1);
            const isFirst = (idx === 0);
            const stnBn = (stationsGeo && stationsGeo[stn]) ? stationsGeo[stn].name_bn : stn;
            
            chainHtml += `
                <button onclick="setStationScanFromFilter('${stn}')" title="${stn} থেকে টিকিট দেখুন" class="flex-shrink-0 px-2.5 py-1 rounded-lg ${isFirst ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' : (isLast ? 'bg-rose-950/90 text-rose-300 border-rose-500/50' : 'bg-slate-800 text-slate-200 hover:text-white border-slate-700')} hover:bg-emerald-600/50 border hover:border-emerald-500/50 transition font-medium flex items-center gap-1 active:scale-95 shadow-sm">
                    <span>${stnBn}</span>
                </button>
            `;
            if (!isLast) {
                chainHtml += `<span class="text-slate-600 font-bold select-none text-xs">➔</span>`;
            }
        });
        chainItems.innerHTML = chainHtml;
    }
}

function onStationScanFromChange() {
    const trainSelect = document.getElementById('station-scan-train-select');
    const fromSelect = document.getElementById('station-scan-from-select');
    const destSelect = document.getElementById('station-scan-dest-select');
    if (!trainSelect || !fromSelect || !destSelect) return;

    const trainNum = trainSelect.value || '766';
    const train = (allTrains || []).find(t => String(t.number) === String(trainNum));
    const stoppages = train ? (train.stoppages || []) : [];
    
    const selectedFrom = fromSelect.value;
    let fromIdx = 0;
    if (selectedFrom) {
        fromIdx = stoppages.indexOf(selectedFrom);
        if (fromIdx < 0) fromIdx = 0;
    }

    // Filter destination to only subsequent stations after From
    let destHtml = `<option value="">শেষ গন্তব্য (${train ? train.destination : 'Default'})</option>`;
    stoppages.slice(fromIdx + 1).forEach(s => {
        const stnBn = (stationsGeo && stationsGeo[s]) ? stationsGeo[s].name_bn : s;
        destHtml += `<option value="${s}">${stnBn} (${s}) পর্যন্ত</option>`;
    });
    destSelect.innerHTML = destHtml;
    
    // Automatically trigger scan for selected station
    runStationTicketScan();
}

function setStationScanFromFilter(stationName) {
    const fromSelect = document.getElementById('station-scan-from-select');
    if (fromSelect) {
        fromSelect.value = stationName;
        onStationScanFromChange();
        showToast(`📍 প্রারম্ভিক স্টেশন ${stationName} সেট করা হয়েছে`, 'info');
    }
}

function formatToEticketDate(isoDateStr) {
    if (!isoDateStr) return '';
    const parts = isoDateStr.split('-');
    if (parts.length !== 3) return isoDateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = parts[2].padStart(2, '0');
    const m = months[parseInt(parts[1], 10) - 1] || 'Nov';
    const y = parts[0];
    return `${d}-${m}-${y}`;
}

async function runStationTicketScan() {
    const trainSelect = document.getElementById('station-scan-train-select');
    const fromSelect = document.getElementById('station-scan-from-select');
    const destSelect = document.getElementById('station-scan-dest-select');
    const dateInput = document.getElementById('station-scan-date');
    const btn = document.getElementById('btn-run-station-scan');
    const grid = document.getElementById('station-tickets-results-grid');
    const summaryCard = document.getElementById('station-scan-summary');
    const filterBar = document.getElementById('station-filter-bar');

    if (!trainSelect || !grid) return;

    const trainNum = trainSelect.value || '766';
    const fromStation = fromSelect ? fromSelect.value : '';
    const destStation = destSelect ? destSelect.value : '';
    const rawDate = dateInput ? dateInput.value : '';
    const formattedDate = formatToEticketDate(rawDate);

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="animate-spin text-base">🛰️</span> <span>লাইভ স্ক্যান চলছে...</span>`;
    }

    grid.innerHTML = `
        <div class="glass-card rounded-2xl p-6 sm:p-8 text-center border-emerald-500/40 relative overflow-hidden bg-slate-900/95 shadow-2xl animate-fade-in">
            <div class="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <div class="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping"></div>
                <div class="absolute inset-2 rounded-full border border-emerald-500/40 animate-pulse"></div>
                <div class="absolute inset-0 rounded-full border-t-2 border-emerald-400 animate-spin"></div>
                <div class="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-2xl">
                    🚆
                </div>
            </div>

            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>বাংলাদেশ রেলওয়ে অফিসিয়াল সার্ভার স্ক্যানার সক্রিয়</span>
            </div>

            <h3 class="text-lg sm:text-xl font-black text-white" id="scan-progress-title">
                ট্রেন [${trainNum}]-এর প্রতিটি স্টপের লাইভ আসন স্ক্যান চলছে...
            </h3>
            <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto" id="scan-progress-sub">
                অফিসিয়াল ই-টিকিট সার্ভার ও কোটা ডাটাবেজ বিশ্লেষণ করা হচ্ছে...
            </p>

            <!-- Progress Bar -->
            <div class="w-full max-w-md mx-auto mt-4 bg-slate-800 rounded-full h-3 p-0.5 overflow-hidden border border-slate-700">
                <div id="scan-progress-bar" class="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-300 w-1/12"></div>
            </div>
            <div class="flex justify-between items-center text-[11px] text-slate-400 max-w-md mx-auto mt-1.5 px-1 font-mono">
                <span id="scan-progress-station">স্টেশন অনুসন্ধান শুরু হচ্ছে...</span>
                <span id="scan-progress-percent" class="font-bold text-emerald-400">১০%</span>
            </div>

            <!-- Live Terminal Log -->
            <div class="mt-4 p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 max-w-md mx-auto text-left font-mono text-[11px] text-slate-300 h-28 overflow-y-auto space-y-1.5 shadow-inner" id="scan-live-terminal">
                <div class="text-emerald-400 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>[০৮:০০:০১] eticket.railway.gov.bd সার্ভারে সংযোগ স্থাপিত</span>
                </div>
            </div>
        </div>
    `;

    try {
        const queryParams = new URLSearchParams({
            train: trainNum,
            date: formattedDate,
            dest: destStation,
            from: fromStation
        });
        const res = await fetch(`/api/station_tickets?${queryParams.toString()}`);
        const data = await res.json();

        if (data.status === 'success') {
            lastScannedStationRecords = data.stations || [];
            const stations = lastScannedStationRecords;
            const term = document.getElementById('scan-live-terminal');
            const pBar = document.getElementById('scan-progress-bar');
            const pStation = document.getElementById('scan-progress-station');
            const pPercent = document.getElementById('scan-progress-percent');

            // Interactive Sequential Multi-Station Radar Sweep Animation
            if (stations.length > 0 && term) {
                for (let i = 0; i < stations.length; i++) {
                    const stn = stations[i];
                    const pct = Math.round(((i + 1) / stations.length) * 100);
                    if (pBar) pBar.style.width = `${pct}%`;
                    if (pPercent) pPercent.textContent = `${pct}%`;
                    if (pStation) pStation.textContent = `স্টেশন (${i + 1}/${stations.length}): ${stn.station_name_bn || stn.station_name} যাচাই সম্পন্ন`;

                    const logItem = document.createElement('div');
                    const isAvail = stn.total_available > 0;
                    const seatsText = isAvail ? `${stn.total_available}টি আসন` : '০টি আসন';
                    logItem.className = isAvail ? 'text-emerald-300 text-[10px]' : 'text-slate-400 text-[10px]';
                    logItem.innerHTML = `🛰️ [${stn.station_name}] ➔ ${destStation || 'গন্তব্য'}: <strong>${seatsText}</strong> (${stn.is_major_station ? 'জংশন' : 'স্টপ'})`;
                    term.appendChild(logItem);
                    term.scrollTop = term.scrollHeight;

                    // Small natural pace for authentic scanning feel
                    if (i < Math.min(stations.length - 1, 8)) {
                        await new Promise(r => setTimeout(r, 220));
                    }
                }
                await new Promise(r => setTimeout(r, 350));
            }

            // Update Summary Stats
            const countEl = document.getElementById('stat-scan-count');
            const passedNoteEl = document.getElementById('stat-scan-passed-note');
            const seatsEl = document.getElementById('stat-scan-seats');
            const topEl = document.getElementById('stat-scan-top');
            const timeEl = document.getElementById('stat-scan-time');
            const liveBadgeEl = document.getElementById('stat-scan-live-badge');

            if (countEl) countEl.textContent = `${data.upcoming_count || data.total_stations_scanned}টি স্টপ`;
            if (passedNoteEl) {
                if (data.is_today && data.passed_count > 0) {
                    passedNoteEl.textContent = `🚫 ${data.passed_count}টি স্টেশন ইতিমধ্যে অতিক্রান্ত (ট্রেন চলে গেছে)`;
                    passedNoteEl.className = 'text-[10px] text-amber-400 font-bold';
                } else {
                    passedNoteEl.textContent = `যাত্রাপথের সকল স্টেশন অগ্রিম বুকিংযোগ্য`;
                    passedNoteEl.className = 'text-[10px] text-slate-400';
                }
            }
            if (seatsEl) seatsEl.textContent = `${data.total_seats_available || 0}টি`;
            if (timeEl) timeEl.textContent = data.scanned_at || 'এখনই';
            if (liveBadgeEl && data.live_summary) {
                liveBadgeEl.textContent = `${data.live_summary.last_station} অতিক্রম করেছে (${data.live_summary.delay_text})`;
            }

            if (topEl && lastScannedStationRecords.length > 0) {
                const availableStations = lastScannedStationRecords.filter(s => !s.is_passed);
                if (availableStations.length > 0) {
                    let maxStation = availableStations.reduce((prev, curr) => 
                        (curr.total_available > prev.total_available) ? curr : prev, availableStations[0]);
                    topEl.textContent = `${maxStation.station_name} (${maxStation.total_available}টি)`;
                } else {
                    topEl.textContent = 'আজকের সকল স্টপ অতিক্রান্ত';
                }
            }

            if (summaryCard) summaryCard.classList.remove('hidden');
            if (filterBar) filterBar.classList.remove('hidden');

            renderStationScanCards(lastScannedStationRecords, data.target_destination, data.date_of_journey, data.train_number, data.train_name_bn, data.is_today, data.live_summary, data.is_completed_today, fromStation);
            showToast(`✅ ${data.train_name_bn}-এর প্রতিটি স্টেশনের লাইভ টিকিট সফলভাবে স্ক্যান ও যাচাই হয়েছে!`, 'success');
        } else {
            grid.innerHTML = `
                <div class="glass-card rounded-2xl p-8 text-center text-rose-400 border-rose-800/40">
                    <p class="font-bold text-base">⚠️ টিকিট তথ্য স্ক্যান করতে ব্যর্থ হয়েছে</p>
                    <p class="text-xs text-slate-400 mt-1">${data.message || 'অনুগ্রহ করে আবার চেষ্টা করুন।'}</p>
                </div>
            `;
            showToast(data.message || 'স্ক্যান ব্যর্থ হয়েছে', 'error');
        }
    } catch (err) {
        console.error('Station ticket scan error:', err);
        grid.innerHTML = `
            <div class="glass-card rounded-2xl p-8 text-center text-rose-400 border-rose-800/40">
                <p class="font-bold text-base">⚠️ সার্ভার যোগাযোগে ত্রুটি হয়েছে</p>
                <p class="text-xs text-slate-400 mt-1">${err.message}</p>
            </div>
        `;
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="scan-line" class="w-4 h-4"></i> <span>লাইভ টিকিট স্ক্যান করুন</span>`;
        }
        if (window.lucide) window.lucide.createIcons();
    }
}

function renderStationScanCards(stations, destStation, dateStr, trainNum, trainNameBn, isToday = false, liveSummary = null, isCompletedToday = false, targetFromStation = '') {
    const grid = document.getElementById('station-tickets-results-grid');
    if (!grid) return;

    if (!stations || stations.length === 0) {
        grid.innerHTML = `
            <div class="glass-card rounded-2xl p-8 text-center text-slate-400 border-slate-800">
                <p class="font-bold text-white text-base">এই রুটে কোনো স্টপেজের টিকিট পাওয়া যায়নি</p>
            </div>
        `;
        return;
    }

    let html = '';

    // If all stations passed today or completed: show prominent Tomorrow Action Banner
    const allPassed = stations.every(s => s.is_passed);
    if (isCompletedToday || (isToday && allPassed)) {
        html += `
            <div class="p-4 rounded-2xl bg-amber-950/70 border-2 border-amber-500/50 shadow-xl mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-600/30 border border-amber-500/50 flex items-center justify-center text-xl flex-shrink-0">
                        🏁
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-white text-sm">[${trainNum}] ${trainNameBn}</span>
                            <span class="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 font-bold text-[10px]">আজকের যাত্রা সমাপ্ত</span>
                        </div>
                        <div class="text-slate-300 mt-0.5">
                            ট্রেনটি আজকের ট্রিপ শেষ করে গন্তব্যে পৌঁছে গেছে। আগামীকাল বা অন্য যেকোনো দিনের অগ্রিম টিকিট দেখতে পারেন:
                        </div>
                    </div>
                </div>
                <button onclick="setStationScanDateTomorrow()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all">
                    <span>📅 আগামীকালের টিকিট দেখুন ➔</span>
                </button>
            </div>
        `;
    }

    // If live running today: show a prominent Live Position Status Card at top of results
    if (isToday && liveSummary && liveSummary.is_running) {
        html += `
            <div class="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border-2 border-emerald-500/50 shadow-xl mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-xl flex-shrink-0">
                        🚆
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-white text-sm">[${trainNum}] ${trainNameBn}</span>
                            <span class="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 font-bold animate-pulse text-[10px]">🟢 লাইভ রানিং</span>
                        </div>
                        <div class="text-slate-300 mt-0.5">
                            বর্তমান অবস্থান: <strong class="text-emerald-400">${liveSummary.last_station} স্টেশন অতিক্রম করেছে</strong> ➔ <strong class="text-cyan-300">${liveSummary.next_station} অভিমুখে চলমান</strong>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    <span class="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">${liveSummary.delay_text}</span>
                    <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono font-bold">⚡ ${liveSummary.speed} km/h</span>
                </div>
            </div>
        `;
    }

    stations.forEach(stn => {
        const isPassed = stn.is_passed;
        const isNext = stn.is_next_stop;
        const hasSeats = stn.total_available > 0;
        const isTargetFrom = Boolean(targetFromStation && (stn.station_name.toLowerCase() === targetFromStation.toLowerCase()));

        let cardBorder = 'border-slate-800 hover:border-slate-700 bg-slate-900/80';
        let opacityClass = '';

        if (isTargetFrom) {
            cardBorder = 'border-emerald-400 bg-gradient-to-b from-emerald-950/50 via-slate-900 to-slate-900 shadow-2xl shadow-emerald-950/70 ring-2 ring-emerald-500/60';
        } else if (isPassed) {
            cardBorder = 'border-slate-800/60 bg-slate-950/70';
            opacityClass = 'opacity-65';
        } else if (isNext) {
            cardBorder = 'border-cyan-500/60 bg-gradient-to-b from-cyan-950/30 to-slate-900/90 shadow-cyan-950/50';
        } else if (hasSeats) {
            cardBorder = 'border-emerald-500/40 hover:border-emerald-400 bg-slate-900/90';
        }

        // Render classes
        let classesHtml = '';
        if (stn.classes) {
            Object.entries(stn.classes).forEach(([clsKey, clsInfo]) => {
                let clsLabel = clsKey;
                if (clsKey === 'SHOVAN_CHAIR' || clsKey === 'S_CHAIR') clsLabel = 'শোভন চেয়ার';
                else if (clsKey === 'SNIGDHA') clsLabel = 'স্নিগ্ধা এসি';
                else if (clsKey === 'AC_BERTH' || clsKey === 'AC_B') clsLabel = 'এসি বার্থ';
                else if (clsKey === 'AC_CABIN' || clsKey === 'AC_S') clsLabel = 'এসি সিট';
                else if (clsKey === 'SHOVAN') clsLabel = 'শোভন';

                const hasCount = clsInfo.available !== null && clsInfo.available !== undefined;
                const avail = hasCount ? clsInfo.available : 0;
                const fare = clsInfo.fare || 0;
                const isAvail = hasCount && avail > 0;

                let seatDisplay = "";
                if (isPassed) {
                    seatDisplay = "০টি";
                } else if (hasCount) {
                    seatDisplay = isAvail ? `${avail}টি সিট` : "০ (বুকড)";
                } else {
                    seatDisplay = "যাচাই করুন";
                }

                let subStatus = "";
                if (isPassed) {
                    subStatus = "সময় পার";
                } else if (hasCount) {
                    subStatus = isAvail ? "উপলব্ধ" : "শেষ";
                } else {
                    subStatus = "অফিসিয়াল লিংক";
                }

                classesHtml += `
                    <div class="p-2.5 rounded-xl ${isPassed ? 'bg-slate-950/60 border border-slate-800/80' : (isAvail ? 'bg-emerald-950/40 border border-emerald-500/30' : 'bg-slate-900/60 border border-slate-800')} flex items-center justify-between">
                        <div>
                            <div class="text-xs font-bold ${isPassed ? 'text-slate-500' : (isAvail ? 'text-emerald-300' : 'text-slate-400')}">${clsLabel}</div>
                            <div class="text-[10px] text-slate-400 font-mono">ভাড়া: ৳${fare}</div>
                        </div>
                        <div class="text-right">
                            <span class="text-xs font-black ${isPassed ? 'text-slate-500' : (isAvail ? 'text-emerald-400 font-mono' : (hasCount ? 'text-rose-400' : 'text-cyan-400'))}">
                                ${seatDisplay}
                            </span>
                            <div class="text-[9px] ${isPassed ? 'text-slate-600' : (isAvail ? 'text-emerald-300' : (hasCount ? 'text-slate-500' : 'text-cyan-400/80'))}">
                                ${clsInfo.status_bn || subStatus}
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        html += `
            <div class="station-ticket-card glass-card rounded-2xl p-4 sm:p-5 border-2 ${cardBorder} ${opacityClass} transition-all duration-200 shadow-xl" data-station-name="${stn.station_name}" data-is-passed="${isPassed ? 'true' : 'false'}">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl ${isPassed ? 'bg-slate-950 border-slate-800 text-slate-500' : (isNext ? 'bg-cyan-950 border-cyan-500 text-cyan-300 animate-pulse' : 'bg-slate-900 border-slate-700 text-amber-300')} border flex flex-col items-center justify-center flex-shrink-0">
                            <span class="text-[9px] uppercase">স্টপ</span>
                            <span class="text-sm font-black">#${stn.station_number}</span>
                        </div>
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="text-base font-bold text-white tracking-wide">${stn.station_name_bn || stn.station_name}</h4>
                                <span class="text-xs text-slate-400 font-mono">(${stn.station_name})</span>
                                ${isTargetFrom ? '<span class="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-500/60 text-[10px] font-black animate-pulse shadow-sm">🎯 নির্বাচিত বোর্ডিং স্টেশন</span>' : ''}
                                ${stn.total_available >= 50 && !isPassed ? '<span class="px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 text-[10px] font-black">৫০+ আসন উপলব্ধ</span>' : ''}
                                ${stn.is_major_station ? '<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">জংশন</span>' : ''}
                                ${isNext ? '<span class="px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200 border border-cyan-500/50 text-[10px] font-bold animate-pulse">📍 পরবর্তী স্টপ</span>' : ''}
                                ${isPassed ? '<span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">🚫 অতিক্রান্ত (সময় পার)</span>' : ''}
                            </div>
                            <div class="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                                <span class="flex items-center gap-1 text-slate-400">
                                    <i data-lucide="clock" class="w-3.5 h-3.5 text-cyan-400"></i>
                                    <span>নির্ধারিত প্রস্থান: <strong class="text-white">${stn.dep_time}</strong></span>
                                </span>
                                <span class="flex items-center gap-1 text-slate-400">
                                    <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-emerald-400"></i>
                                    <span>গন্তব্য: <strong class="text-emerald-300">${stn.destination_bn || stn.destination}</strong></span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Quota & Availability Badges -->
                    <div class="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                        <span class="px-3 py-1 rounded-xl text-xs font-bold border ${stn.badge_class}">
                            ${stn.quota_badge}
                        </span>
                        ${!isPassed && stn.total_available !== null && stn.total_available !== undefined ? `
                            <span class="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-black font-mono ${hasSeats ? 'text-emerald-400' : 'text-slate-400'}">
                                মোট: ${stn.total_available}টি
                            </span>
                        ` : ''}
                    </div>
                </div>

                <!-- Classes Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
                    ${classesHtml}
                </div>

                <!-- Footer Action Buttons -->
                <div class="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <i data-lucide="info" class="w-3.5 h-3.5 text-slate-500"></i>
                        <span>${isPassed ? '🚫 ট্রেন ইতিমধ্যে এই স্টেশন অতিক্রম করেছে, আজকের জন্য এই স্টেশন থেকে টিকিট বিক্রি বন্ধ' : `যাত্রার তারিখ: <strong class="text-white font-mono">${dateStr}</strong> | [${trainNum}] ${trainNameBn}`}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="viewStationOnMap('${stn.station_name}')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition">
                            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-emerald-400"></i>
                            <span>ম্যাপে অবস্থান</span>
                        </button>
                        ${stn.can_book ? `
                            <a href="${stn.booking_url}" target="_blank" class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow shadow-emerald-900/30 active:scale-95">
                                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                                <span>রেলওয়ে ওয়েবসাইটে টিকিট কাটুন</span>
                            </a>
                        ` : `
                            <button disabled class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-500 text-xs font-semibold cursor-not-allowed">
                                <span>${isPassed ? '🚫 ট্রেন স্টেশন পার হয়ে গেছে' : '🔴 টিকিট বিক্রি শেষ'}</span>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    });

    grid.innerHTML = html;

    // Apply active passed stations filter
    const cards = document.querySelectorAll('.station-ticket-card');
    cards.forEach(card => {
        const isPassed = card.getAttribute('data-is-passed') === 'true';
        if (isPassed) {
            card.style.display = (showAllPassedStations || allPassed) ? 'block' : 'none';
        } else {
            card.style.display = 'block';
        }
    });

    if (window.lucide) window.lucide.createIcons();
}

function filterStationScanList(query) {
    const q = (query || '').toLowerCase().trim();
    const cards = document.querySelectorAll('.station-ticket-card');
    cards.forEach(card => {
        const name = (card.getAttribute('data-station-name') || '').toLowerCase();
        const text = card.textContent.toLowerCase();
        const isPassed = card.getAttribute('data-is-passed') === 'true';

        if (isPassed && !showAllPassedStations) {
            card.style.display = 'none';
            return;
        }

        if (!q || name.includes(q) || text.includes(q)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function viewStationOnMap(stationName) {
    switchTab('map');
    if (stationsGeo && stationsGeo[stationName] && leafletMap) {
        const s = stationsGeo[stationName];
        const lat = s.lat !== undefined ? s.lat : (Array.isArray(s) ? s[0] : null);
        const lng = s.lng !== undefined ? s.lng : (s.lon !== undefined ? s.lon : (Array.isArray(s) ? s[1] : null));
        if (lat && lng) {
            leafletMap.setView([lat, lng], 13);
            showToast(`📍 ম্যাপে ${stationName} স্টেশন জুম করা হয়েছে`, 'info');
        } else {
            showToast(`📍 ম্যাপ ভিউ চালু করা হয়েছে`, 'info');
        }
    } else {
        showToast(`📍 ম্যাপ ভিউ চালু করা হয়েছে`, 'info');
    }
}

/* ========================================================
   TTMS 16318 & STOP-BY-STOP ROUTE TIMELINE ENGINE
   ======================================================== */

async function loadTrainTimeline(trainNum) {
    if (!trainNum) {
        const sel = document.getElementById('tracking-train-select');
        trainNum = sel ? sel.value : '766';
    }
    const cardEl = document.getElementById('tracking-summary-card');
    const timelineEl = document.getElementById('timeline-container');
    if (!cardEl && !timelineEl) return;

    if (cardEl) {
        cardEl.innerHTML = `<div class="p-6 text-center text-slate-400 w-full animate-pulse">🔄 ট্রেন লাইভ ট্র্যাকিং ডাটা লোড হচ্ছে...</div>`;
    }

    try {
        const res = await fetch(`/api/live_location?train=${encodeURIComponent(trainNum)}`);
        const json = await res.json();
        if (json.status !== 'success' || !json.data) {
            if (cardEl) cardEl.innerHTML = `<div class="p-4 text-center text-rose-400 w-full">ট্রেন নম্বর ${trainNum}-এর লাইভ ট্র্যাকিং তথ্য পাওয়া যায়নি।</div>`;
            return;
        }

        const d = json.data;
        const isRunning = d.is_running;
        const statusColor = isRunning ? 'emerald' : 'cyan';

        // 1. Populate #tracking-summary-card
        if (cardEl) {
            cardEl.innerHTML = `
                <div class="space-y-2">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-${statusColor}-500/20 text-${statusColor}-300 border border-${statusColor}-500/30 flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-${statusColor}-400 animate-ping"></span>
                            <span>${d.status_text_bn}</span>
                        </span>
                        <span class="text-xs text-slate-400">${d.data_source_badge || ''}</span>
                    </div>
                    <h3 class="text-xl font-bold text-white flex items-center gap-2">
                        <span>[${d.number}] ${d.name_bn}</span>
                        <span class="text-xs font-normal text-slate-400">(${d.origin} ➔ ${d.destination})</span>
                    </h3>
                    <p class="text-xs text-slate-300 leading-relaxed max-w-xl">
                        ${d.exact_location_text}
                    </p>
                    <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                        <span>🕒 প্রস্থান: <strong class="text-white">${d.departure}</strong></span>
                        <span>🏁 পৌঁছাবে: <strong class="text-white">${d.arrival}</strong></span>
                        <span>⚡ গতি: <strong class="text-emerald-300">${d.current_speed_kmh} কিমি/ঘণ্টা</strong></span>
                        <span>⏱️ বিলম্ব: <strong class="${d.delay_minutes > 0 ? 'text-amber-400' : 'text-emerald-400'}">${d.delay_text}</strong></span>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                    <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center flex-grow sm:flex-grow-0">
                        <div class="text-[10px] text-slate-400 uppercase font-semibold">১৬৩১৮ এসএমএস কোড</div>
                        <div class="text-base font-mono font-black text-emerald-400">TR ${d.ttms_code || d.number}</div>
                    </div>
                    <a href="sms:16318?body=TR%20${d.ttms_code || d.number}" class="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition">
                        <i data-lucide="message-square" class="w-4 h-4"></i>
                        <span>১৬৩১৮ তে এসএমএস পাঠান</span>
                    </a>
                </div>
            `;
        }

        // 2. Populate #timeline-container
        if (timelineEl && d.stoppages) {
            const timings = d.station_timings || {};
            let html = '';

            d.stoppages.forEach((stn, idx) => {
                const isOrigin = idx === 0;
                const isDest = idx === d.stoppages.length - 1;
                const isLastStn = d.last_station === stn;
                const isNextStn = d.next_station === stn;
                const tInfo = timings[stn] || {};
                const arrTime = tInfo.arr || (isOrigin ? '-' : '--:--');
                const depTime = tInfo.dep || (isDest ? '-' : '--:--');

                let badge = '';
                let nodeBg = 'bg-slate-800 border-slate-700 text-slate-400';
                let cardClass = 'bg-slate-900/60 border-slate-800 text-slate-300';

                if (isLastStn) {
                    nodeBg = 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/50';
                    cardClass = 'bg-emerald-950/60 border-emerald-500/50 text-white shadow-md';
                    badge = d.current_speed_kmh === 0 
                        ? `<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold animate-pulse">● বর্তমানে স্টেশনে অবস্থান করছে</span>`
                        : `<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">● সর্বশেষ অতিক্রম করেছে</span>`;
                } else if (isNextStn) {
                    nodeBg = 'bg-cyan-500 border-cyan-400 text-slate-950';
                    cardClass = 'bg-cyan-950/40 border-cyan-500/40 text-slate-200';
                    badge = `<span class="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">পরবর্তী স্টপ (পৌঁছাবে ${d.eta_next_station || ''})</span>`;
                }

                html += `
                    <div class="relative group">
                        <div class="absolute -left-[31px] top-3.5 w-4 h-4 rounded-full ${nodeBg} border-2 flex items-center justify-center font-bold text-[9px]">
                            ${idx + 1}
                        </div>
                        <div class="p-3.5 rounded-xl border ${cardClass} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 transition hover:border-slate-600">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="font-bold text-sm text-white">${stn}</span>
                                ${badge}
                            </div>
                            <div class="flex items-center gap-4 text-xs font-mono">
                                <div class="text-slate-400">আগমণ: <strong class="text-slate-200">${arrTime}</strong></div>
                                <div class="text-slate-400">প্রস্থান: <strong class="text-emerald-300">${depTime}</strong></div>
                                <button type="button" onclick="viewStationOnMap('${stn}')" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-sans font-medium transition flex items-center gap-1">
                                    <span>ম্যাপে দেখুন ↗</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });

            timelineEl.innerHTML = html;
        }

        if (window.lucide) window.lucide.createIcons();
    } catch (e) {
        console.error('loadTrainTimeline error:', e);
        if (cardEl) cardEl.innerHTML = `<div class="p-4 text-center text-rose-400 w-full">লাইভ ডাটা লোড ব্যর্থ হয়েছে: ${e.message}</div>`;
    }
}

/* ========================================================
   MOBILE DRAWER NAVIGATION & LIVE CLOCK (RESULT ENGINE STYLE)
   ======================================================== */

function toggleMobileNav() {
    const drawer = document.getElementById('mobile-nav-drawer');
    if (drawer) {
        drawer.classList.toggle('open');
        if (window.lucide) window.lucide.createIcons();
    }
}

function closeMobileNav() {
    const drawer = document.getElementById('mobile-nav-drawer');
    if (drawer) {
        drawer.classList.remove('open');
    }
}

function updateLiveNavClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    const dateStr = now.toLocaleDateString('bn-BD', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const clockEl = document.getElementById('nav-live-clock');
    const mClockEl = document.getElementById('mobile-live-clock');
    const mDateEl = document.getElementById('mobile-live-date');

    if (clockEl) clockEl.textContent = timeStr;
    if (mClockEl) mClockEl.textContent = timeStr;
    if (mDateEl) mDateEl.textContent = dateStr;
}
