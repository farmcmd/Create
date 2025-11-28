import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCEH65YbNirj_IRmtsIJZS-HNEbsRBBsSQ",
    authDomain: "sustainable-tourism-65025.firebaseapp.com",
    projectId: "sustainable-tourism-65025",
    storageBucket: "sustainable-tourism-65025.firebasestorage.app",
    messagingSenderId: "781325465882",
    appId: "1:781325465882:web:9435b02bd618f0c16814a3",
    measurementId: "G-SZJ1RX5QS4"
};

// GLOBAL CONSTANTS
const localStorageKey = 'shuilSustainableTourismData_v2.2';
const localStorageActionsKey = 'shuilSustainableTourismActions_v2.2';

let app, db, analytics;
let isMapApiLoaded = false;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    analytics = getAnalytics(app);
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

// Handle Google Maps Authentication Failure
window.gm_authFailure = function() {
    console.error("Google Maps Authentication Failed. Switching to fallback mode.");
    isMapApiLoaded = false;
    const mapElement = document.getElementById('map');
    if (mapElement) {
        mapElement.innerHTML = `
            <div class="map-error-overlay flex flex-col items-center justify-center h-full bg-gray-100 rounded-lg p-6 text-center text-gray-600">
                <i class="fas fa-map-signs text-5xl mb-4 text-green-600"></i>
                <h3 class="text-xl font-bold mb-2">已切換至距離估算模式</h3>
                <p class="mb-4">由於地圖服務暫時無法連線 (API Key 限制)，系統將自動使用直線距離進行里程計算。</p>
                <p class="text-sm bg-white p-3 rounded shadow">
                    <i class="fas fa-info-circle mr-1"></i>
                    功能完全正常！請繼續從下方列表選擇起點與終點，並點擊「計算本次旅程」。
                </p>
            </div>
        `;
    }
};

// Data Definitions
let transportData = {
    bike: { name: '腳踏車', icon: '🚲', carbonReductionPer10km: 350, travelMode: null, metersPerPoint: 10000 },
    walk: { name: '步行', icon: '🚶‍♂️', carbonReductionPer10km: 400, travelMode: null, metersPerPoint: 8000 },
    bus_train: { name: '共乘巴士', icon: '🚌', carbonReductionPer10km: 300, travelMode: null, metersPerPoint: 15000 },
    carpool_2_moto: { name: '共乘2人/摩托', icon: '🏍️🚗', carbonReductionPer10km: 100, travelMode: null, metersPerPoint: 25000 },
    carpool_3: { name: '共乘3人', icon: '🚗', carbonReductionPer10km: 120, travelMode: null, metersPerPoint: 20000 },
    carpool_4: { name: '共乘4人', icon: '🚗', carbonReductionPer10km: 150, travelMode: null, metersPerPoint: 18000 },
    carpool_5: { name: '共乘5人', icon: '🚗', carbonReductionPer10km: 200, travelMode: null, metersPerPoint: 16000 },
    thsr_haoxing: { name: '高鐵假期x台灣好行', icon: '🚄🚌', carbonReductionPer10km: 0, travelMode: null, metersPerPoint: Infinity }
};

const pois = [
    { id: 'poi1', name: '水里永續共好聯盟打氣站', coords: { lat: 23.809799, lng: 120.849286 }, icon: '🌲', description: '營業時間上午8:00~17:00。\n\n不定期辦理活動，小尖兵們完成的永續任務的分數請在此出示，感謝您一起為地球減碳努力!', image: '', socialLink: 'https://www.facebook.com/p/%E6%B0%B4%E9%87%8C%E9%84%89%E5%95%86%E5%9C%88%E5%89%B5%E7%94%9F%E5%85%B1%E5%A5%BD%E5%8D%94%E6%9C%83-100076220760859/?locale=zh_TW' },
    { id: 'poi2', name: '漫遊堤岸風光', coords: { lat: 23.808537, lng: 120.849415 }, icon: '🏞️', description: '起點：水里親水公園。終點：永興村，途中經過社子生態堤防、永興大橋、永興社區等地，路線全長約4公里，坡度平緩，適合親子及大眾。', image: '' },
    { id: 'poi3', name: '鑫鮮菇園', coords: { lat: 23.794049, lng: 120.859407 }, icon: '🍄', description: '營業時間: 需預約。\n\n提供香菇園區種植導覽與體驗行程。', image: '', socialLink: 'https://www.facebook.com/xinxianguyuan' },
    { id: 'poi4', name: '永興神木', coords: { lat: 23.784127, lng: 120.862294 }, icon: '🌳', description: '永興神木（百年大樟樹）位於永興社區活動中心旁。', image: '', socialLink: 'https://www.shli.gov.tw/story/1/6' },
    { id: 'poi5', name: '森林小白宮', coords: { lat: 23.779408, lng: 120.844019 }, icon: '🏠', description: '小白宮森林生態導覽，親子活動。', image: '', socialLink: 'https://wild-kids-studio.waca.tw/' },
    { id: 'poi6', name: '瑪路馬咖啡莊園', coords: { lat: 23.778239, lng: 120.843859 }, icon: '☕', description: '咖啡座、咖啡園導覽。', image: '', socialLink: 'https://www.facebook.com/people/%E9%A6%AC%E8%B7%AF%E7%91%AA%E5%92%96%E5%95%A1%E8%8E%8A%E5%9C%92/100063961898841/' },
    { id: 'poi7', name: '指令教育農場', coords: { lat: 23.802776, lng: 120.864715 }, icon: '👆', description: '農場導覽、生態導覽、食農教育。', image: '', socialLink: 'https://www.facebook.com/FarmCMD/', sroiInfo: { reportLink: 'https://docs.google.com/document/d/10XDI3hhf-RXBqccPj1N2MWakgebgUWFuiQU_W3EO-zw/edit?tab=t.0', formLink: '#', lineId: '#' } },
    { id: 'poi8', name: '明揚養蜂', coords: { lat: 23.803787, lng: 120.862401 }, icon: '🐝', description: '育蜂場導覽、生態導覽、蜂蜜食農教育。', image: '', socialLink: 'https://www.facebook.com/MingYangBee/?locale=zh_TW', sroiInfo: { reportLink: 'https://docs.google.com/document/d/1O6APHIfaE84wwvJGd6C6d4aPfwvXA7oArpsQR8eLvr0/edit?tab=t.0', formLink: '#', lineId: '#' } },
    { id: 'poi9', name: '蛇窯文化園區', coords: { lat: 23.801177, lng: 120.864479 }, icon: '🏺', description: '購票入園，完成食農器皿文化參觀可獲得永續與環境教育點數。', image: '', socialLink: 'https://www.facebook.com/sskshop/?locale=zh_TW' },
    { id: 'poi10', name: '雨社山下', coords: { lat: 23.790644, lng: 120.896569 }, icon: '🥒', description: '農場導覽、生態導覽、食農教育。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=61557727713841&locale=zh_TW', sroiInfo: { reportLink: 'https://docs.google.com/document/d/1lv-K1f4eKcFuMCHLa9KYpK5liC6akftd20osvOyJzyk/edit?tab=t.0', formLink: '#', lineId: '#' } },
    { id: 'poi11', name: '阿爾喜莊園', coords: { lat: 23.803119, lng: 120.926340 }, icon: '🍋', description: '農場導覽、生態導覽、食農教育、農業循環經濟教學。', image: '', socialLink: 'https://www.facebook.com/AHEIemon?locale=zh_TW', sroiInfo: { reportLink: 'https://docs.google.com/document/d/1vvti2M8jRU0Vh_AuXslUh2g4uOHnX68wRdTDhb0n4Yc/edit?tab=t.0', formLink: '#', lineId: '#' } },
    { id: 'poi12', name: '湧健酪梨園', coords: { lat: 23.725349, lng: 120.846123 }, icon: '🥑', description: '農場導覽、生態導覽、食農教育。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=100085673588842&locale=zh_TW', sroiInfo: { reportLink: 'https://docs.google.com/document/d/1F_ZaCamhyN5GnvfJUt3mgWYU1zAsHtHyHMjGhRwxbOU/edit?tab=t.0', formLink: '#', lineId: '#' } },
    { id: 'poi13', name: '謝家肉圓', coords: { lat: 23.817521, lng: 120.853831 }, icon: '🥟', description: '在地人巷內70年老店。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=100054428473137&locale=zh_TW' },
    { id: 'poi14', name: '機車貓聯盟', coords: { lat: 23.810883, lng: 120.855798 }, icon: '🍚', description: '無菜單料理店，50%以上使用在地食材。', image: '', socialLink: 'https://m.facebook.com/機車貓聯盟-552637305127422/' },
    { id: 'poi15', name: '二坪大觀冰店', coords: { lat: 23.813627, lng: 120.859651 }, icon: '🍦', description: '在地推薦古早味枝仔冰。', image: '', socialLink: 'https://www.facebook.com/2pinIce/' },
    { id: 'poi16', name: '水里里山村', coords: { lat: 23.813459, lng: 120.853787 }, icon: '🏡', description: '在地推鑑環保旅宿。', image: '', socialLink: 'https://tg-ecohotel.com/' },
    { id: 'poi17', name: '水里星光市集', coords: { lat: 23.813636, lng: 120.850816 }, icon: '💡', description: '參加”逛市集增里程”地產地銷最減碳。', image: '', socialLink: 'https://www.facebook.com/p/%E6%B0%B4%E9%87%8C%E9%84%89%E5%95%86%E5%9C%88%E5%89%B5%E7%94%9F%E5%85%B1%E5%A5%BD%E5%8D%94%E6%9C%83-100076220760859/?locale=zh_TW', isNew: true, marketScheduleLink: 'https://www.facebook.com/photo/?fbid=2583695705169366&set=pcb.2583695981835995' }
];

const sustainableActions = [
    { name: '支持在地飲食', points: 5 },
    { name: '減少剩食', points: 5 },
    { name: '自備環保用品', points: 5 },
    { name: '回收分類', points: 5 },
    { name: '保育行為', points: 10 },
    { name: '導覽參加', points: 10 },
    { name: '不破壞棲地', points: 10 },
    { name: '支持小農', points: 5 },
    { name: '遵守營火', points: 5 }
];

const activities = [
    { id: 'act1', name: 'SROI 社會責任農產品購買', points: 15, validCodes: ['ABC123', 'XYZ789'], image: 'https://placehold.co/400x200/4caf50/white?text=SROI+Image' },
    { id: 'act2', name: '生態棲地破冰活動', points: 20, validCodes: ['DEF456', 'UVW012'] },
    { id: 'act3', name: 'ESG社會責任活動講堂', points: 25, validCodes: ['GHI789', 'RST345'] },
    { id: 'act4', name: 'CBD里山生態廊道永續旅遊', points: 30, validCodes: ['JKL012', 'QRS678'] },
    { id: 'act5', name: '里山倡議食農下午茶講堂', points: 20, validCodes: ['MNO345', 'PQR901'] },
    { id: 'act6', name: '小白宮x山形工作室', points: 10, validCodes: ['PQR678', 'STU234'] },
    { id: 'act7', name: '其他永續與環境教育活動及課程', points: 10, validCodes: ['VWX901', 'YZA567'] }
];

const marketTypes = [
    { id: 'starlight_market', name: '水里星光市集', icon: '🌟' },
    { id: 'farmers_market', name: '小農市集', icon: '🧑‍🌾' },
    { id: 'festival_market', name: '其他節慶市集', icon: '🎉' }
];

const marketProductData = {
    'agricultural_products': { name: '農產品', mileage: 5000, carbonReduction: 20, points: 5, icon: '🥕' },
    'local_snacks': { name: '在地小吃', mileage: 3000, carbonReduction: 12, points: 3, icon: '🍜' },
    'creative_products': { name: '文創商品', mileage: 2000, carbonReduction: 8, points: 2, icon: '🎨' },
    'services': { name: '服務類', mileage: 2000, carbonReduction: 8, points: 2, icon: '🛠️' },
    'others': { name: '其他', mileage: 2000, carbonReduction: 8, points: 2, icon: '🛍️' }
};

// State
let currentTransport = null;
let totalMileage = 0;
let totalCarbonReduction = 0;
let totalScore = 0;
let playerName = '';
let playerCode = '';
let map = null;
let directionsService = null;
let directionsRenderer = null;
let poiMarkers = [];
let selectedActivity = null;
let selectedStartPoi = null;
let selectedEndPoi = null;
let loggedActions = [];
let selectedSustainableActions = [];
let currentLogTripPoi = null;
let networkTotalCarbonReduction = 0;
let selectedLogTripTransport = null;
let selectedMarketType = null;
let selectedMarketProduct = null;

// --- Core Functions ---
function loadData() {
    const data = localStorage.getItem(localStorageKey);
    if (data) {
        const parsedData = JSON.parse(data);
        totalMileage = parsedData.totalMileage || 0;
        totalCarbonReduction = parsedData.totalCarbonReduction || 0;
        totalScore = parsedData.totalScore || 0;
        playerName = parsedData.playerName || '';
        playerCode = parsedData.playerCode || generateRandomCode();
    } else {
        playerCode = generateRandomCode();
    }

    const actionsData = localStorage.getItem(localStorageActionsKey);
    if (actionsData) {
        loggedActions = JSON.parse(actionsData);
        renderLoggedActions();
    }

    updateStatsDisplay();
    if (db) fetchNetworkTotalCarbonReduction();
}

function saveData() {
    const dataToSave = {
        totalMileage,
        totalCarbonReduction,
        totalScore,
        playerName: document.getElementById('player-name').value.trim(),
        playerCode
    };
    localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
    localStorage.setItem(localStorageActionsKey, JSON.stringify(loggedActions));

    if (db && playerCode) {
        savePlayerDataToFirebase({
            ...dataToSave,
            lastUpdated: serverTimestamp()
        });
    }
}

function updateStatsDisplay() {
    document.getElementById('total-mileage').textContent = `${(totalMileage / 1000).toFixed(2)} km`;
    document.getElementById('total-carbon-reduction').textContent = `${totalCarbonReduction.toFixed(2)} g`;
    document.getElementById('total-score').textContent = totalScore;
    document.getElementById('player-name').value = playerName;
    document.getElementById('player-code').textContent = playerCode;
}

function generateRandomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function savePlayerDataToFirebase(playerData) {
    if (!db) return;
    try {
        const playerDocRef = doc(collection(db, 'players'), playerData.playerCode);
        await setDoc(playerDocRef, playerData, { merge: true });
        fetchNetworkTotalCarbonReduction();
    } catch (e) {
        console.error("Error saving to Firebase:", e);
    }
}

async function fetchNetworkTotalCarbonReduction() {
    if (!db) return;
    try {
        const playersSnapshot = await getDocs(collection(db, 'players'));
        let total = 0;
        playersSnapshot.forEach(doc => {
            total += (doc.data().totalCarbonReduction || 0);
        });
        networkTotalCarbonReduction = total;
        document.getElementById('network-total-carbon-reduction').textContent = `${total.toFixed(2)} g`;
        document.getElementById('network-stats-status').textContent = '網路統計數據載入成功。';
        document.getElementById('network-stats-status').className = 'text-xs text-green-600 mt-2';
    } catch (e) {
        console.error("Error fetching network total:", e);
        document.getElementById('network-stats-status').textContent = '無法載入網路統計數據。';
        document.getElementById('network-stats-status').className = 'text-xs text-red-600 mt-2';
    }
}

// --- Navigation ---
function showHomepage() {
    document.getElementById('homepage').style.display = 'block';
    document.getElementById('mission-page').style.display = 'none';
}

function showMissionPage() {
    document.getElementById('homepage').style.display = 'none';
    document.getElementById('mission-page').style.display = 'block';
    if (map) {
        google.maps.event.trigger(map, 'resize');
        map.setCenter({ lat: 23.810, lng: 120.850 });
    }
    document.getElementById('current-transport-display').textContent = currentTransport ? transportData[currentTransport].name : '未選擇';
}

// --- Map & POI ---
function initMap() {
    if (typeof google === 'undefined') return;

    transportData.bike.travelMode = google.maps.TravelMode.BICYCLING;
    transportData.walk.travelMode = google.maps.TravelMode.WALKING;
    transportData.bus_train.travelMode = google.maps.TravelMode.TRANSIT;
    transportData.carpool_2_moto.travelMode = google.maps.TravelMode.DRIVING;
    transportData.carpool_3.travelMode = google.maps.TravelMode.DRIVING;
    transportData.carpool_4.travelMode = google.maps.TravelMode.DRIVING;
    transportData.carpool_5.travelMode = google.maps.TravelMode.DRIVING;
    transportData.thsr_haoxing.travelMode = google.maps.TravelMode.TRANSIT;

    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 23.810, lng: 120.850 },
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map: map, suppressMarkers: true });

    pois.forEach(poi => {
        const marker = new google.maps.Marker({
            position: poi.coords,
            map: map,
            title: poi.name,
            label: { text: poi.name, color: '#000000', fontSize: '12px', fontWeight: 'bold' }
        });
        marker.addListener('click', () => showPoiModal(poi));
        poiMarkers.push(marker);
    });
    isMapApiLoaded = true;
}
window.initMap = initMap;

// --- Helper: Haversine Distance ---
function calculateHaversineDistance(coords1, coords2) {
    const R = 6371e3; // metres
    const φ1 = coords1.lat * Math.PI / 180; // φ, λ in radians
    const φ2 = coords2.lat * Math.PI / 180;
    const Δφ = (coords2.lat - coords1.lat) * Math.PI / 180;
    const Δλ = (coords2.lng - coords1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
}

// --- Modals Logic ---
function showPoiModal(poi) {
    const modal = document.getElementById('poi-modal');
    modal.querySelector('#poi-modal-title').textContent = poi.name;
    modal.querySelector('#poi-modal-description').innerHTML = poi.description.replace(/\n/g, '<br>');
    modal.querySelector('#poi-modal-coordinates').textContent = `座標: ${poi.coords.lat}, ${poi.coords.lng}`;
    
    const socialDiv = modal.querySelector('#poi-modal-social');
    socialDiv.innerHTML = '';
    if (poi.socialLink) {
        const a = document.createElement('a');
        a.href = poi.socialLink;
        a.target = '_blank';
        a.className = 'text-green-600 hover:underline block mt-2';
        a.innerHTML = '<i class="fas fa-link mr-1"></i>前往相關網站';
        socialDiv.appendChild(a);
    }

    document.getElementById('poi12-buttons').classList.toggle('hidden', poi.id !== 'poi12');
    document.getElementById('sroi-info-button-container').classList.toggle('hidden', !poi.sroiInfo || poi.id === 'poi12');

    // Setup SROI button link if available
    const sroiBtn = document.getElementById('show-sroi-info-button');
    if (poi.sroiInfo && poi.sroiInfo.reportLink) {
        sroiBtn.onclick = () => window.open(poi.sroiInfo.reportLink, '_blank');
    }

    const poi12Btn = document.getElementById('sroi-order-button-poi12');
    if (poi.id === 'poi12' && poi.sroiInfo && poi.sroiInfo.reportLink) {
        poi12Btn.onclick = () => window.open(poi.sroiInfo.reportLink, '_blank');
    }

    const dynamicDiv = document.getElementById('poi-modal-dynamic-buttons');
    dynamicDiv.innerHTML = '';
    if (poi.id === 'poi17') {
        const btn = document.createElement('button');
        btn.className = 'w-full mt-3 px-6 py-3 bg-purple-600 text-white font-bold rounded-lg shadow hover:bg-purple-700 transition-all';
        btn.innerHTML = '<i class="fas fa-store mr-2"></i>逛市集增里程';
        btn.onclick = () => { modal.classList.add('hidden'); showMarketSelectionModal(); };
        dynamicDiv.appendChild(btn);
    }

    modal.currentPoi = poi;
    modal.classList.remove('hidden');
}

// --- Log Trip Modal Logic (Manual) ---
function showLogTripModal(poi) {
    currentLogTripPoi = poi;
    document.getElementById('log-trip-poi-name').textContent = poi.name;
    document.getElementById('log-trip-mileage').value = '';
    document.getElementById('log-trip-status').textContent = '';
    const optionsDiv = document.getElementById('log-trip-transport-options');
    optionsDiv.innerHTML = '';
    selectedLogTripTransport = null;

    for (const key in transportData) {
        if (key !== 'thsr_haoxing') {
            const btn = document.createElement('button');
            btn.className = 'log-trip-transport-button px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-sm m-1';
            btn.textContent = `${transportData[key].icon} ${transportData[key].name}`;
            btn.onclick = () => {
                optionsDiv.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedLogTripTransport = key;
                document.getElementById('log-trip-transport-status').classList.add('hidden');
            };
            optionsDiv.appendChild(btn);
        }
    }
    document.getElementById('log-trip-modal').classList.remove('hidden');
}

function submitLogTrip() {
    if (!currentLogTripPoi || !selectedLogTripTransport) {
        document.getElementById('log-trip-transport-status').classList.remove('hidden');
        return;
    }

    const mileageKm = parseFloat(document.getElementById('log-trip-mileage').value);
    if (isNaN(mileageKm) || mileageKm < 0) {
        document.getElementById('log-trip-mileage-status').classList.remove('hidden');
        return;
    }

    const mileageMeters = mileageKm * 1000;
    const reduction = mileageMeters * (transportData[selectedLogTripTransport].carbonReductionPer10km / 10000);
    
    let points = 0;
    if (transportData[selectedLogTripTransport].metersPerPoint !== Infinity) {
        points = Math.floor(mileageMeters / transportData[selectedLogTripTransport].metersPerPoint);
    }

    totalMileage += mileageMeters;
    totalCarbonReduction += reduction;
    totalScore += points;

    logAction({
        type: 'trip_to_poi',
        poiName: currentLogTripPoi.name,
        transportName: transportData[selectedLogTripTransport].name,
        transportIcon: transportData[selectedLogTripTransport].icon,
        mileageInMeters: mileageMeters,
        carbonReduction: reduction,
        points: points
    });

    updateStatsDisplay();
    const statusEl = document.getElementById('log-trip-status');
    statusEl.textContent = `旅程已記錄！獲得 ${points} 積分，減碳 ${reduction.toFixed(2)}g`;
    statusEl.className = 'mt-4 text-sm font-semibold text-green-600';
    
    setTimeout(() => document.getElementById('log-trip-modal').classList.add('hidden'), 2000);
}

// --- Action Logging Logic ---
function logSustainableAction() {
    const text = document.getElementById('sustainable-action-log').value.trim();
    const statusEl = document.getElementById('action-log-status');
    
    if (selectedSustainableActions.length === 0 && !text) {
        statusEl.textContent = '請選擇行動項目或輸入內容';
        statusEl.className = 'mt-3 text-sm font-semibold text-red-600';
        return;
    }

    let points = 0;
    const actionNames = [];
    selectedSustainableActions.forEach(name => {
        const action = sustainableActions.find(a => a.name === name);
        if (action) {
            points += action.points;
            actionNames.push(name);
        }
    });

    totalScore += points;
    
    logAction({
        type: 'action',
        text: text ? `${actionNames.join(', ')} - ${text}` : actionNames.join(', '),
        points: points
    });

    updateStatsDisplay();
    statusEl.textContent = `行動已記錄！獲得 ${points} 積分`;
    statusEl.className = 'mt-3 text-sm font-semibold text-green-600';
    
    document.getElementById('sustainable-action-log').value = '';
    selectedSustainableActions = [];
    document.getElementById('selectable-actions-list').querySelectorAll('.selectable-action-item').forEach(el => el.classList.remove('selected'));
    
    setTimeout(() => {
         statusEl.textContent = '';
    }, 3000);
}

// --- Activity Logging Logic ---
function submitActivityLog() {
    const code = document.getElementById('verification-code-input').value.trim();
    const content = document.getElementById('activity-content-input').value.trim();
    const statusEl = document.getElementById('activity-log-status');

    if (!selectedActivity) return;

    if (code.length < 3) {
         statusEl.textContent = '請輸入有效的驗證碼';
         statusEl.className = 'mt-4 text-sm font-semibold text-red-600';
         return;
    }

    const points = selectedActivity.points;
    totalScore += points;

    logAction({
        type: 'activity',
        activityName: selectedActivity.name,
        text: content,
        verificationCode: code,
        points: points
    });

    updateStatsDisplay();
    statusEl.textContent = `活動已驗證！獲得 ${points} 積分`;
    statusEl.className = 'mt-4 text-sm font-semibold text-green-600';

    setTimeout(() => {
        statusEl.textContent = '';
        document.getElementById('verification-code-input').value = '';
        document.getElementById('activity-content-input').value = '';
        document.getElementById('activity-modal').classList.add('hidden');
    }, 2000);
}

// --- Market Selection Logic ---
function showMarketSelectionModal() {
    selectedMarketType = null;
    selectedMarketProduct = null;
    renderMarketTypes();
    const modal = document.getElementById('market-selection-modal');
    document.getElementById('market-type-selection-step').classList.remove('hidden');
    document.getElementById('product-type-selection-step').classList.add('hidden');
    document.getElementById('back-to-market-type-button').classList.add('hidden');
    document.getElementById('submit-market-activity-button').disabled = true;
    modal.classList.remove('hidden');
}

function renderMarketTypes() {
    const container = document.getElementById('market-type-options');
    container.innerHTML = '';
    marketTypes.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'market-option-button p-4 border rounded-lg hover:bg-purple-50 flex flex-col items-center justify-center transition-all';
        btn.innerHTML = `<span class="text-3xl mb-2">${type.icon}</span><span class="font-bold">${type.name}</span>`;
        btn.onclick = () => {
            selectedMarketType = type;
            renderProductTypes();
            document.getElementById('market-type-selection-step').classList.add('hidden');
            document.getElementById('product-type-selection-step').classList.remove('hidden');
            document.getElementById('selected-market-type-display').textContent = type.name;
            document.getElementById('back-to-market-type-button').classList.remove('hidden');
        };
        container.appendChild(btn);
    });
}

function renderProductTypes() {
    const container = document.getElementById('product-type-options');
    container.innerHTML = '';
    for (const key in marketProductData) {
        const product = marketProductData[key];
        const btn = document.createElement('button');
        btn.className = 'product-option-button w-full p-3 border rounded-lg hover:bg-purple-50 flex items-center justify-between transition-all';
        btn.innerHTML = `<span>${product.icon} ${product.name}</span><span class="text-xs text-gray-500">里程+${product.mileage/1000}km</span>`;
        btn.onclick = () => {
            container.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedMarketProduct = product;
            document.getElementById('submit-market-activity-button').disabled = false;
        };
        container.appendChild(btn);
    }
}

function submitMarketActivity() {
    const storeCode = document.getElementById('market-store-code').value.trim();
    if (!storeCode || storeCode.length !== 5 || isNaN(storeCode)) {
        alert('請輸入有效的5位數字商店碼');
        return;
    }

    totalMileage += selectedMarketProduct.mileage;
    totalCarbonReduction += selectedMarketProduct.carbonReduction;
    totalScore += selectedMarketProduct.points;

    logAction({
        type: 'market_visit',
        marketTypeName: selectedMarketType.name,
        productName: selectedMarketProduct.name,
        productIcon: selectedMarketProduct.icon,
        mileageInMeters: selectedMarketProduct.mileage,
        carbonReduction: selectedMarketProduct.carbonReduction,
        points: selectedMarketProduct.points,
        storeCode: storeCode
    });

    updateStatsDisplay();
    document.getElementById('market-activity-status').textContent = '消費已記錄！';
    setTimeout(() => document.getElementById('market-selection-modal').classList.add('hidden'), 1500);
}

// --- Trip Calculation Logic (Map Based with Fallback) ---
function calculateTripMileage() {
    const statusEl = document.getElementById('trip-calculation-status');
    
    if (!selectedStartPoi || !selectedEndPoi) {
        statusEl.textContent = '請先選擇起點和終點景點！';
        statusEl.className = 'mt-4 text-sm font-semibold text-red-600';
        return;
    }
    
    if (selectedStartPoi.id === selectedEndPoi.id) {
        statusEl.textContent = '起點和終點不能相同！';
        statusEl.className = 'mt-4 text-sm font-semibold text-red-600';
        return;
    }
    
    if (!currentTransport) {
        statusEl.textContent = '請先在首頁選擇交通方式！';
        statusEl.className = 'mt-4 text-sm font-semibold text-red-600';
        return;
    }

    statusEl.textContent = '正在計算路徑...';
    statusEl.className = 'mt-4 text-sm font-semibold text-gray-700';

    // Check if map API is available and usable
    if (isMapApiLoaded && directionsService && window.google) {
        try {
            const request = {
                origin: selectedStartPoi.coords,
                destination: selectedEndPoi.coords,
                travelMode: transportData[currentTransport].travelMode || google.maps.TravelMode.DRIVING
            };

            directionsService.route(request, (result, status) => {
                if (status === 'OK') {
                    directionsRenderer.setDirections(result);
                    const distanceMeters = result.routes[0].legs[0].distance.value;
                    finalizeCalculation(distanceMeters, false);
                } else {
                    // Map request failed (e.g. ZERO_RESULTS), fallback to manual calc
                    console.warn("Directions request failed, using fallback.", status);
                    useFallbackCalculation();
                }
            });
        } catch (error) {
            console.warn("Error calling route service, falling back.", error);
            useFallbackCalculation();
        }
    } else {
        // Map API not loaded or auth failed, use fallback immediately
        useFallbackCalculation();
    }

    function useFallbackCalculation() {
        const dist = calculateHaversineDistance(selectedStartPoi.coords, selectedEndPoi.coords);
        // Add 20% to account for road curvature vs straight line
        const estimatedDist = dist * 1.2; 
        finalizeCalculation(estimatedDist, true);
    }

    function finalizeCalculation(distanceMeters, isEstimate) {
        const distanceKm = distanceMeters / 1000;
        
        // Calculate Carbon
        const reduction = distanceMeters * (transportData[currentTransport].carbonReductionPer10km / 10000);
        
        // Calculate Points
        let points = 0;
        if (transportData[currentTransport].metersPerPoint !== Infinity) {
            points = Math.floor(distanceMeters / transportData[currentTransport].metersPerPoint);
        }

        totalMileage += distanceMeters;
        totalCarbonReduction += reduction;
        totalScore += points;

        logAction({
            type: 'trip_to_poi',
            poiName: `${selectedStartPoi.name} 到 ${selectedEndPoi.name}`,
            transportName: transportData[currentTransport].name,
            transportIcon: transportData[currentTransport].icon,
            mileageInMeters: distanceMeters,
            carbonReduction: reduction,
            points: points
        });

        updateStatsDisplay();
        
        let msg = `路徑計算完成: ${distanceKm.toFixed(2)} km, 減碳: ${reduction.toFixed(2)} g, 積分: ${points}`;
        if (isEstimate) {
            msg += " (直線距離估算)";
        }
        statusEl.textContent = msg;
        statusEl.className = 'mt-4 text-sm font-semibold text-green-600';
    }
}

function updatePoiListHighlights() {
    const listItems = document.getElementById('poi-list').querySelectorAll('li');
    listItems.forEach(li => {
        li.classList.remove('poi-list-item-start', 'poi-list-item-end');
        if (selectedStartPoi && li.dataset.id === selectedStartPoi.id) {
            li.classList.add('poi-list-item-start');
        }
        if (selectedEndPoi && li.dataset.id === selectedEndPoi.id) {
            li.classList.add('poi-list-item-end');
        }
    });
}

// --- Helper Logging Function ---
function logAction(data) {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const entry = { ...data, timestamp };
    loggedActions.push(entry);
    saveData();
    renderLoggedActions();
}

function renderLoggedActions() {
    const list = document.getElementById('logged-actions-list');
    list.innerHTML = '';
    if (loggedActions.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center">尚無行動紀錄</p>';
        return;
    }

    [...loggedActions].reverse().forEach(log => {
        const div = document.createElement('div');
        div.className = 'action-log-item';
        let content = '';

        if (log.type === 'trip_to_poi') {
            content = `<p class="log-type">前往旅程</p><p>${log.transportIcon} ${log.poiName}</p><p>里程: ${(log.mileageInMeters/1000).toFixed(2)}km</p>`;
        } else if (log.type === 'market_visit') {
            content = `<p class="log-type">市集消費</p><p>${log.marketTypeName} - ${log.productName}</p><p>+${(log.mileageInMeters/1000).toFixed(1)}km 里程</p>`;
        } else if (log.type === 'action') {
            content = `<p class="log-type">永續行動</p><p>${log.text}</p>`;
        } else if (log.type === 'activity') {
            content = `<p class="log-type">參加活動</p><p>${log.activityName}</p>`;
        }

        div.innerHTML = `${content}<p class="timestamp">${log.timestamp}</p>`;
        list.appendChild(div);
    });
}

// --- Other Modal Controls ---
function showThsrInfoModal() { document.getElementById('thsr-info-modal').classList.remove('hidden'); }
function hideThsrInfoModal() { document.getElementById('thsr-info-modal').classList.add('hidden'); }
function showTaxiInfoModal() { document.getElementById('taxi-info-modal').classList.remove('hidden'); }
function hideTaxiInfoModal() { document.getElementById('taxi-info-modal').classList.add('hidden'); }
function showSroiInfoModal(poiName, info) { 
    document.getElementById('sroi-modal-poi-name').textContent = poiName;
    document.getElementById('sroi-info-modal').classList.remove('hidden'); 
}
function hideSroiInfoModal() { document.getElementById('sroi-info-modal').classList.add('hidden'); }

// EXPOSE FUNCTIONS TO WINDOW FOR HTML ONCLICK ATTRIBUTES
window.showPoiModal = showPoiModal;
window.showLogTripModal = showLogTripModal;
window.pois = pois;

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
        initMap();
    }

    // Populate Lists
    const poiList = document.getElementById('poi-list');
    poiList.innerHTML = '';
    pois.forEach(poi => {
        const li = document.createElement('li');
        li.dataset.id = poi.id; // Added dataset ID for highlighting
        li.className = 'clickable-list-item p-3 hover:bg-gray-100 rounded transition';
        li.innerHTML = `
            <span onclick="event.stopPropagation(); window.showPoiModal(window.pois.find(p => p.id === '${poi.id}'))">
                ${poi.icon} ${poi.name} 
                ${poi.isNew ? '<span class="text-red-500 text-xs font-bold ml-1">NEW</span>' : ''}
                ${poi.sroiInfo ? '<span class="text-purple-600 text-xs font-bold ml-1">(SROI)</span>' : ''}
            </span>
            <button class="text-gray-500 hover:text-orange-500" onclick="window.showLogTripModal(window.pois.find(p => p.id === '${poi.id}'))">
                <i class="fas fa-car-side"></i>
            </button>
        `;
        poiList.appendChild(li);
    });

    // Transport Buttons
    document.querySelectorAll('.transport-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.transport;
            if (type === 'thsr_haoxing') return showThsrInfoModal();
            if (btn.id === 'taxi-info-button') return showTaxiInfoModal();
            
            currentTransport = type;
            document.querySelectorAll('.transport-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            showMissionPage();
        });
    });

    // Activity List
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = '';
    activities.forEach(act => {
        const li = document.createElement('li');
        li.className = 'clickable-list-item p-2 hover:bg-blue-50 rounded cursor-pointer';
        li.textContent = `${act.name} (${act.points}分)`;
        li.onclick = () => {
            selectedActivity = act;
            document.getElementById('selected-activity-name').textContent = act.name;
            document.getElementById('activity-modal').classList.remove('hidden');
        };
        activityList.appendChild(li);
    });

    // Action List
    const actionList = document.getElementById('selectable-actions-list');
    actionList.innerHTML = '';
    sustainableActions.forEach(act => {
        const div = document.createElement('div');
        div.className = 'selectable-action-item p-2 border rounded cursor-pointer hover:bg-green-50';
        div.textContent = `${act.name} (${act.points}分)`;
        div.onclick = () => {
            div.classList.toggle('selected');
            const idx = selectedSustainableActions.indexOf(act.name);
            if (idx > -1) selectedSustainableActions.splice(idx, 1);
            else selectedSustainableActions.push(act.name);
        };
        actionList.appendChild(div);
    });

    // Buttons
    document.getElementById('back-to-home').onclick = showHomepage;
    document.getElementById('change-transport-button').onclick = showHomepage;
    document.getElementById('log-action-button').onclick = logSustainableAction;
    document.getElementById('submit-activity-log').onclick = submitActivityLog;
    document.getElementById('submit-log-trip').onclick = submitLogTrip;
    
    // Set Start/End Buttons
    document.getElementById('set-as-start-button').onclick = () => {
        const modal = document.getElementById('poi-modal');
        if (modal.currentPoi) {
            selectedStartPoi = modal.currentPoi;
            document.getElementById('selected-points-display').textContent = 
                `起點: ${selectedStartPoi.name} | 終點: ${selectedEndPoi ? selectedEndPoi.name : '未選擇'}`;
            updatePoiListHighlights();
            modal.classList.add('hidden');
        }
    };

    document.getElementById('set-as-end-button').onclick = () => {
        const modal = document.getElementById('poi-modal');
        if (modal.currentPoi) {
            selectedEndPoi = modal.currentPoi;
            document.getElementById('selected-points-display').textContent = 
                `起點: ${selectedStartPoi ? selectedStartPoi.name : '未選擇'} | 終點: ${selectedEndPoi.name}`;
            updatePoiListHighlights();
            modal.classList.add('hidden');
        }
    };

    // Calculate Trip Button
    document.getElementById('calculate-mileage-button').onclick = calculateTripMileage;

    // Modal Close Buttons
    document.querySelectorAll('.close-button').forEach(btn => {
        btn.onclick = () => {
            btn.closest('.modal-overlay').classList.add('hidden');
        };
    });
    
    // Market Modal
    document.getElementById('market-mileage-button').onclick = showMarketSelectionModal;
    document.getElementById('back-to-market-type-button').onclick = () => {
        document.getElementById('product-type-selection-step').classList.add('hidden');
        document.getElementById('market-type-selection-step').classList.remove('hidden');
        document.getElementById('back-to-market-type-button').classList.add('hidden');
    };
    document.getElementById('submit-market-activity-button').onclick = submitMarketActivity;
    
    // Info Modals
    document.getElementById('taxi-info-button').onclick = showTaxiInfoModal;
    document.getElementById('download-data-button').onclick = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "shuil_tourism_data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };
});
