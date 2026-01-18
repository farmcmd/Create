// --- 引入 Firebase SDK (使用 CDN 方式，方便直接預覽) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, doc, setDoc, updateDoc, increment, onSnapshot, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

// --- Firebase Configuration (User Provided) ---
const firebaseConfig = {
  apiKey: "AIzaSyB2vgQFtOGle5qtf7sp_zydPCjt0Hw7A90",
  authDomain: "sustainable-procurement.firebaseapp.com",
  projectId: "sustainable-procurement",
  storageBucket: "sustainable-procurement.firebasestorage.app",
  messagingSenderId: "580097886645",
  appId: "1:580097886645:web:871719aee24fddae8931fc",
  measurementId: "G-T2PJ4VYZ8Z"
};

// Initialize Firebase
let app;
let db;
let analytics;

// Define Global Stats References
let globalStatsRef;
let greenStatsDocRef;
let pageViewsDocRef;
let carbonStatsDocRef;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    analytics = getAnalytics(app);
    
    // Init refs
    globalStatsRef = collection(db, 'global_stats');
    greenStatsDocRef = doc(db, 'global_stats', 'green_consumption');
    pageViewsDocRef = doc(db, 'global_stats', 'page_views');
    carbonStatsDocRef = doc(db, 'global_stats', 'carbon_stats'); 
    
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.error("Error initializing Firebase:", error);
    const networkStatsStatusElement = document.getElementById('network-stats-status');
    if (networkStatsStatusElement) {
        networkStatsStatusElement.textContent = `預覽模式: 無法連線至資料庫。`;
        networkStatsStatusElement.classList.add('text-red-600');
    }
}

// --- Data Definitions ---
let transportData = {
    bike: { name: '腳踏車', icon: '🚲', carbonReductionPer10km: 350, travelMode: null, metersPerPoint: 10000 },
    walk: { name: '步行', icon: '🚶‍♂️', carbonReductionPer10km: 400, travelMode: null, metersPerPoint: 8000 },
    bus_train: { name: '共乘巴士', icon: '🚌', carbonReductionPer10km: 300, travelMode: null, metersPerPoint: 15000 },
    carpool_2_moto: { name: '私家車共乘 2 人 / 摩托車', icon: '🏍️🚗', carbonReductionPer10km: 100, travelMode: null, metersPerPoint: 25000 },
    carpool_3: { name: '私家車共乘 3 人', icon: '🚗', carbonReductionPer10km: 120, travelMode: null, metersPerPoint: 20000 },
    carpool_4: { name: '私家車共乘 4 人', icon: '🚗', carbonReductionPer10km: 150, travelMode: null, metersPerPoint: 18000 },
    carpool_5: { name: '私家車共乘 5 人', icon: '🚗', carbonReductionPer10km: 200, travelMode: null, metersPerPoint: 16000 },
    thsr_haoxing: { name: '高鐵假期x台灣好行', icon: '🚄🚌', carbonReductionPer10km: 0, travelMode: null, metersPerPoint: Infinity } 
};

const pois = [
    { id: 'poi1', name: '水里永續共好聯盟打氣站', coords: { lat: 23.809799, lng: 120.849286 }, icon: '🌲', description: '營業時間上午8:00~17:00...', image: '', socialLink: '#' },
    { id: 'poi2', name: '漫遊堤岸風光', coords: { lat: 23.808537, lng: 120.849415 }, icon: '🏞️', description: '路線全長約4公里...', image: '' },
    { id: 'poi3', name: '鑫鮮菇園', coords: { lat: 23.794049, lng: 120.859407 }, icon: '🍄', description: '需預約。提供香菇園區種植導覽...', image: '', socialLink: '#', sroiInfo: { reportLink: '#', formLink: '#', lineId: 'TestID' } },
    { id: 'poi12', name: '湧健酪梨園', coords: { lat: 23.725349, lng: 120.846123 }, icon: '🥑', description: '農場導覽、生態導覽...', image: '', socialLink: '#', sroiInfo: { reportLink: '#', formLink: '#', lineId: 'TestID' } },
    { id: 'poi17', name: '水里星光市集', coords: { lat: 23.813636, lng: 120.850816 }, icon: '💡', description: '參加”逛市集增里程”...', image: '', socialLink: '#', isNew: true, marketScheduleLink: '#' }
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

// --- State Variables ---
let currentTransport = null;
let totalMileage = 0;
let totalCarbonReduction = 0;
let totalScore = 0;
let playerName = '';
let playerCode = '';
let greenProcurementTotal = 0;
let sroiProcurementTotal = 0;
let projectProcurementTotal = 0;
let map = null;
let directionsService = null;
let directionsRenderer = null;
let selectedStartPoi = null;
let selectedEndPoi = null;
let mapLoaded = false;
let selectedMarketType = null;
let selectedMarketProduct = null;
let selectedActivity = null; 
let loggedActions = []; 
let selectedSustainableActions = [];

// --- DOM Elements ---
const playerNameInput = document.getElementById('player-name');
const totalMileageSpan = document.getElementById('total-mileage');
const totalCarbonReductionSpan = document.getElementById('total-carbon-reduction');
const totalScoreSpan = document.getElementById('total-score');
const mapElement = document.getElementById('map');
const mapStatusElement = document.getElementById('map-status');
const mapOverlay = document.getElementById('map-overlay');
const displayGreenProcure = document.getElementById('display-green-procurement');
const displaySroiProcure = document.getElementById('display-sroi-procurement');
const displayProjectProcure = document.getElementById('display-project-procurement');
const displayGrandTotalGreen = document.getElementById('display-grand-total-green'); 
const totalGreenProcureDisplay = document.getElementById('total-green-procure-display');
const totalSroiDisplay = document.getElementById('total-sroi-display');
const totalProjectDisplay = document.getElementById('total-project-display');

const localStorageKey = 'shuilSustainableTourismData_v2.2';

function loadData() {
    const data = localStorage.getItem(localStorageKey);
    if (data) {
        const parsedData = JSON.parse(data);
        totalMileage = parsedData.totalMileage || 0;
        totalCarbonReduction = parsedData.totalCarbonReduction || 0;
        totalScore = parsedData.totalScore || 0;
        playerName = parsedData.playerName || '';
        playerCode = parsedData.playerCode || generateRandomCode();
        greenProcurementTotal = parsedData.greenProcurementTotal || 0;
        sroiProcurementTotal = parsedData.sroiProcurementTotal || 0;
        projectProcurementTotal = parsedData.projectProcurementTotal || 0;
    } else {
        playerCode = generateRandomCode();
    }
    
    document.getElementById('player-code').textContent = playerCode;
    updateStatsDisplay();
    updateGreenConsumptionDisplay();
    document.getElementById('stats-load-status').textContent = '已載入數據';
    
    if (db) {
        initGlobalCounters();
    }
}

function saveData() {
    const dataToSave = {
        totalMileage, totalCarbonReduction, totalScore, playerName: playerNameInput.value,
        playerCode, greenProcurementTotal, sroiProcurementTotal, projectProcurementTotal
    };
    localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
}

function updateStatsDisplay() {
    totalMileageSpan.textContent = `${(totalMileage / 1000).toFixed(2)} km`;
    totalCarbonReductionSpan.textContent = `${totalCarbonReduction.toFixed(2)} g`;
    totalScoreSpan.textContent = totalScore;
    if(playerNameInput) playerNameInput.value = playerName;
}

function updateGreenConsumptionDisplay() {
    displayGreenProcure.textContent = `$${greenProcurementTotal}`;
    displaySroiProcure.textContent = `$${sroiProcurementTotal.toFixed(0)}`;
    displayProjectProcure.textContent = `$${projectProcurementTotal}`;
    // Grand total is handled by Firebase listener
    totalGreenProcureDisplay.textContent = `$${greenProcurementTotal}`;
    totalSroiDisplay.textContent = `$${sroiProcurementTotal.toFixed(0)}`;
    totalProjectDisplay.textContent = `$${projectProcurementTotal}`;
}

// --- Firebase Global Stats Logic ---
async function initGlobalCounters() {
    if (!db) return;

    try {
        // 1. Page Views
        // Check if doc exists first to avoid errors if rules are strict
        // We use setDoc with merge: true to effectively "create if missing"
        await setDoc(pageViewsDocRef, { count: increment(1) }, { merge: true });
        
        onSnapshot(pageViewsDocRef, (doc) => {
            if (doc.exists()) {
                const count = doc.data().count || 0;
                const el = document.getElementById('page-view-count');
                if(el) el.textContent = count.toLocaleString();
            }
        });

        // 2. Green Consumption
        // Ensure doc exists so listener doesn't fail
        await setDoc(greenStatsDocRef, { count: increment(0) }, { merge: true });

        onSnapshot(greenStatsDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                const total = (data.green_amt || 0) + (data.sroi_amt || 0) + (data.project_amt || 0);
                const count = data.count || 0;
                
                const grandEl = document.getElementById('display-grand-total-green');
                if(grandEl) grandEl.textContent = `$${total.toLocaleString()}`;
                
                const countEl = document.getElementById('global-green-trans-count');
                if(countEl) countEl.textContent = count.toLocaleString();
            }
        });

        // 3. Global Carbon & Mileage (New Feature)
         // Ensure doc exists so listener doesn't fail
        await setDoc(carbonStatsDocRef, { trip_count: increment(0) }, { merge: true });

        onSnapshot(carbonStatsDocRef, (doc) => {
             if (doc.exists()) {
                 const data = doc.data();
                 const totalCarbon = data.total_carbon || 0;
                 const networkEl = document.getElementById('network-total-carbon-reduction');
                 if(networkEl) networkEl.textContent = `${totalCarbon.toFixed(2)} g`;
                 
                 const statusEl = document.getElementById('network-stats-status');
                 if(statusEl) statusEl.textContent = '雲端數據同步中...';

                 // Update Trees
                 const gramsPerTree = 10000; // Assuming 10kg = 1 tree
                 const trees = Math.floor(totalCarbon / gramsPerTree);
                 const treeEl = document.getElementById('trees-planted-count');
                 if(treeEl) treeEl.textContent = trees;
             }
        });

    } catch (e) {
        console.error("Global stats init error:", e);
    }
}

// 更新全域綠色消費
async function updateGlobalGreenStats(amount, type) {
    if (!db || amount <= 0) return;
    try {
        const updatePayload = { count: increment(1) };
        if (type === 'green') updatePayload.green_amt = increment(amount);
        if (type === 'sroi') updatePayload.sroi_amt = increment(amount);
        if (type === 'project') updatePayload.project_amt = increment(amount);
        await setDoc(greenStatsDocRef, updatePayload, { merge: true });
    } catch (e) { console.error("Update Green Stats Error", e); }
}

// 更新全域碳排與里程 (新增)
async function updateGlobalCarbonStats(mileage, carbon) {
    if (!db) return;
    try {
        await setDoc(carbonStatsDocRef, {
            total_mileage: increment(mileage),
            total_carbon: increment(carbon),
            trip_count: increment(1)
        }, { merge: true });
    } catch (e) { console.error("Update Carbon Stats Error", e); }
}

function generateRandomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Map Functions (with Fallback)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; 
}

function initMap() {
    if (typeof google === 'undefined') {
        window.mapScriptLoadError();
        return;
    }
    const defaultCoords = { lat: 23.810, lng: 120.850 };
    try {
        map = new google.maps.Map(document.getElementById('map'), {
            center: defaultCoords,
            zoom: 13,
            mapTypeControl: false
        });
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({ map: map });
        
        // Add markers logic here (simplified for brevity)
        pois.forEach(poi => {
            const marker = new google.maps.Marker({
                position: poi.coords,
                map: map,
                title: poi.name
            });
            marker.addListener('click', () => showPoiModal(poi));
        });

        mapLoaded = true;
        if(mapOverlay) mapOverlay.classList.add('hidden');
    } catch(e) {
        console.warn("Map init failed", e);
        window.mapScriptLoadError();
    }
}
window.initMap = initMap;

window.mapScriptLoadError = function() {
    if(mapOverlay) mapOverlay.classList.add('hidden');
    if(mapStatusElement) {
        mapStatusElement.innerHTML = '地圖載入失敗，已啟用離線計算模式。';
        mapStatusElement.classList.add('text-red-600');
    }
    mapLoaded = false;
};

// UI Handlers
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    // ... (Event listeners for buttons, modals, inputs) ...
    // Green Consumption
    const greenBtn = document.getElementById('log-green-procure-btn');
    if (greenBtn) {
        greenBtn.addEventListener('click', () => {
            const qty = parseFloat(document.getElementById('green-qty').value) || 0;
            const price = parseFloat(document.getElementById('green-price').value) || 0;
            const total = qty * price;
            if (total > 0) {
                greenProcurementTotal += total;
                updateGreenConsumptionDisplay();
                updateGlobalGreenStats(total, 'green');
                saveData();
                alert('已記錄');
            }
        });
    }
    
    const sroiBtn = document.getElementById('log-sroi-btn');
    if (sroiBtn) {
        sroiBtn.addEventListener('click', () => {
            const qty = parseFloat(document.getElementById('sroi-qty').value) || 0;
            const price = parseFloat(document.getElementById('sroi-price').value) || 0;
            const weight = parseFloat(document.getElementById('sroi-unit-select').value) || 0;
            const total = qty * price * weight;
            if (total > 0) {
                sroiProcurementTotal += total;
                updateGreenConsumptionDisplay();
                updateGlobalGreenStats(total, 'sroi');
                saveData();
                alert('已記錄');
            }
        });
    }

    const projBtn = document.getElementById('log-project-btn');
    if(projBtn) {
        projBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('project-amount').value) || 0;
            if (amount > 0) {
                projectProcurementTotal += amount;
                updateGreenConsumptionDisplay();
                updateGlobalGreenStats(amount, 'project');
                saveData();
                alert('已記錄');
            }
        });
    }

    // Modal Triggers with Null Checks (Crucial Fix)
    const entBtn = document.getElementById('enterprise-version-btn');
    if(entBtn) entBtn.addEventListener('click', () => {
        const modal = document.getElementById('enterprise-modal');
        if(modal) modal.classList.remove('hidden');
    });
    
    const govBtn = document.getElementById('gov-version-btn');
    if(govBtn) govBtn.addEventListener('click', () => {
        const modal = document.getElementById('gov-modal');
        if(modal) modal.classList.remove('hidden');
    });
    
    const greenEvalBtn = document.getElementById('open-green-eval-btn');
    if(greenEvalBtn) greenEvalBtn.addEventListener('click', () => {
        const modal = document.getElementById('green-consumption-modal');
        if(modal) modal.classList.remove('hidden');
    });
    
    document.querySelectorAll('.close-button').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal-overlay').classList.add('hidden');
        });
    });

    // Tabs
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active-tab', 'border-emerald-600', 'text-emerald-600'));
            contents.forEach(c => c.classList.add('hidden'));
            tab.classList.add('active-tab', 'border-emerald-600', 'text-emerald-600');
            const target = document.getElementById(tab.dataset.tab);
            if(target) target.classList.remove('hidden');
        });
    });
    
    // Populate Lists (Simplified)
    const poiList = document.getElementById('poi-list');
    if (poiList) {
        pois.forEach(poi => {
            const li = document.createElement('li');
            li.className = 'clickable-list-item p-2 hover:bg-gray-100 cursor-pointer';
            li.innerHTML = `${poi.icon} ${poi.name}`;
            li.onclick = () => showPoiModal(poi);
            poiList.appendChild(li);
        });
    }

    const calcBtn = document.getElementById('calculate-mileage-button');
    if(calcBtn) {
        calcBtn.addEventListener('click', () => {
             if (!selectedStartPoi || !selectedEndPoi) { alert('請選擇起訖點'); return; }
             if (mapLoaded && directionsService) {
                 const request = {
                    origin: selectedStartPoi.coords,
                    destination: selectedEndPoi.coords,
                    travelMode: google.maps.TravelMode.DRIVING
                 };
                 directionsService.route(request, (res, status) => {
                     if (status === 'OK') {
                         directionsRenderer.setDirections(res);
                         const dist = res.routes[0].legs[0].distance.value;
                         processTripResult(dist, 'Google Maps');
                     } else useFallbackCalculation();
                 });
             } else {
                 useFallbackCalculation();
             }
        });
    }
    
    showHomepage();
});

function showPoiModal(poi) {
    const modal = document.getElementById('poi-modal');
    if(!modal) return;
    modal.classList.remove('hidden');
    document.getElementById('poi-modal-title').textContent = poi.name;
    // Set current selections for trip
    const startBtn = document.getElementById('set-as-start-button');
    if(startBtn) startBtn.onclick = () => { selectedStartPoi = poi; modal.classList.add('hidden'); updateSelectedPointsDisplay(); };
    
    const endBtn = document.getElementById('set-as-end-button');
    if(endBtn) endBtn.onclick = () => { selectedEndPoi = poi; modal.classList.add('hidden'); updateSelectedPointsDisplay(); };
}

// Helper to process trip result and update DB
function processTripResult(distanceMeters, method) {
    totalMileage += distanceMeters;
    const carbon = distanceMeters * 0.035; // Example factor
    totalCarbonReduction += carbon;
    
    updateStatsDisplay();
    updateGlobalCarbonStats(distanceMeters, carbon); // Update Global
    saveData();
    const statusEl = document.getElementById('trip-calculation-status');
    if(statusEl) statusEl.innerHTML = `計算成功 (${method})<br>里程: ${(distanceMeters/1000).toFixed(2)}km`;
}
