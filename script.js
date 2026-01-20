// --- 引入 Firebase SDK (使用 CDN 方式，方便直接預覽) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, doc, setDoc, updateDoc, increment, onSnapshot, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

// --- Firebase Configuration ---
// 這裡已更新為 sustainable-procurement-1 的設定
const firebaseConfig = {
  apiKey: "AIzaSyArR1k85j1tWxP1dZSEFEJgj1X-T04l8RI",
  authDomain: "sustainable-procurement-1.firebaseapp.com",
  projectId: "sustainable-procurement-1",
  storageBucket: "sustainable-procurement-1.firebasestorage.app",
  messagingSenderId: "524848367336",
  appId: "1:524848367336:web:85d888f1668506bbd4eb5d",
  measurementId: "G-NQ3G51CFP1"
};

// Initialize Firebase
let app;
let db;
let analytics;

// Define Global Stats References
let globalStatsRef;
let greenStatsDocRef;
let pageViewsDocRef;
let carbonStatsDocRef; // 用於碳排統計的參照

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    analytics = getAnalytics(app);
    
    // Init refs - 參照到 global_stats 集合下的各個文件
    globalStatsRef = collection(db, 'global_stats');
    greenStatsDocRef = doc(db, 'global_stats', 'green_consumption');
    pageViewsDocRef = doc(db, 'global_stats', 'page_views');
    carbonStatsDocRef = doc(db, 'global_stats', 'carbon_stats'); // 這是累計碳排的關鍵文件
    
    console.log("Firebase initialized successfully with project: sustainable-procurement-1");
} catch (error) {
    console.error("Error initializing Firebase:", error);
    const networkStatsStatusElement = document.getElementById('network-stats-status');
    if (networkStatsStatusElement) {
        networkStatsStatusElement.textContent = `連線錯誤: 無法連結至資料庫 (sustainable-procurement-1)。`;
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

// ... (Pois, Activities, Market definitions - kept same as previous context for brevity) ... 
// (Assume full definitions here)
const pois = [
    { id: 'poi1', name: '水里永續共好聯盟打氣站', coords: { lat: 23.809799, lng: 120.849286 }, icon: '🌲', description: '營業時間上午8:00~17:00。\n\n不定期辦理活動，小尖兵們完成的永續任務的分數請在此出示，感謝您一起為地球減碳努力!\n\n本區共分為三個單位(水里鄉圖書館內):\n1. 社團法人南投縣水里鄉商圈創生共好協會 - 致力於推動水里地區商圈振興、永續農業、文化保存與地方創生行動。以多元合作模式打造出一個能共好、共學、共榮的地方創新平台。\n2. 水里溪畔驛站 - 在圖書館內的一處靜懿的景觀休憩場域，小農午餐需要事先預訂喔!\n3. 水里青農里山基地 - 是由臺大實驗林水里營林區輔導的里山餐桌團隊打造的里山及永續教育基地，由返鄉青農共同打造的農業與社區發展平台，以農村生產、生活、生態致力於推廣友善農業、食農教育及永續發展為目標。在這裡可以預約由小農開發的豐富教具進行DIY活動與食農、永續教育等活動!', image: '', socialLink: 'https://www.facebook.com/p/%E6%B0%B4%E9%87%8C%E9%84%89%E5%95%86%E5%9C%88%E5%89%B5%E7%94%9F%E5%85%B1%E5%A5%BD%E5%8D%94%E6%9C%83-100076220760859/?locale=zh_TW' },
    { id: 'poi2', name: '漫遊堤岸風光', coords: { lat: 23.808537, lng: 120.849415 }, icon: '🏞️', description: '起點：水里親水公園。終點：永興村，途中經過社子生態堤防、永興大橋、永興社區等地，路線全長約4公里，坡度平緩，適合親子及大眾。', image: '' },
    { id: 'poi3', name: '鑫鮮菇園', coords: { lat: 23.794049, lng: 120.859407 }, icon: '🍄', description: '營業時間: 需預約。\n\n提供香菇園區種植導覽與體驗行程 (時長20分鐘)。\n香菇/袖珍菇三角飯糰食農體驗(時長90分鐘)。', image: '', socialLink: 'https://www.facebook.com/xinxianguyuan', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_3', formLink: 'YOUR_FORM_LINK_3', lineId: 'YOUR_LINE_ID_3' } },
    { id: 'poi4', name: '永興神木', coords: { lat: 23.784127, lng: 120.862294 }, icon: '🌳', description: '社區麵包坊營業時間”上午9:00~17:00。\n\n永興神木（百年大樟樹）位於永興社區活動中心旁。樟樹群由三棵母子樹所形成，第一代木就是母樹，二代木則是母樹根系再長出的兩棵子樹，連成一體。樹齡約300年、樹圍6.2公尺、樹徑1.6公尺、樹高約26公尺、樹冠幅400平方公尺，一旁供俸老樹公及福德祠是居民的信仰中心。\n\n社區活動中心二樓設有社區麵包坊，由北海扶輪社、臺大實驗林、水里商工，共同扶持社區成立，利用當地種植的果物製作的吐司產品是新鮮別具風味的暢銷品。', image: '', socialLink: 'https://www.shli.gov.tw/story/1/6' },
    { id: 'poi5', name: '森林小白宮', coords: { lat: 23.779408, lng: 120.844019 }, icon: '🏠', description: '接駁、共乘、摩托。需預約。\n\n完成單一活動可獲得永續與環境教育任務點數10點。\n\n小白宮森林生態導覽，親子活動(彩繪/木藝/親子皮影)。', image: '', socialLink: 'https://wild-kids-studio.waca.tw/' },
    { id: 'poi6', name: '瑪路馬咖啡莊園', coords: { lat: 23.778239, lng: 120.843859 }, icon: '☕', description: '接駁、共乘、摩托。\n\n活動資訊: 咖啡座、咖啡園導覽。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/people/%E9%A6%AC%E8%B7%AF%E7%91%AA%E5%92%96%E5%95%A1%E8%8E%8A%E5%9C%92/100063961898841/' },
    { id: 'poi7', name: '指令教育農場', coords: { lat: 23.802776, lng: 120.864715 }, icon: '👆', description: '台灣好行、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/FarmCMD/', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_7', formLink: 'YOUR_FORM_LINK_7', lineId: 'https://line.me/ti/g2/HFRcE4eII1eQ761y0Zs3QEvs70saIQ-dHYbYgA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default' } },
    { id: 'poi8', name: '明揚養蜂', coords: { lat: 23.803787, lng: 120.862401 }, icon: '🐝', description: '共乘、台灣好行、摩托。\n\n活動資訊: 育蜂場導覽、生態導覽、蜂蜜食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/MingYangBee/?locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_8', formLink: 'YOUR_FORM_LINK_8', lineId: 'https://line.me/ti/g2/VuGeDsA2K8tPEJ9JOElK70LbUmGk8dW_7Q2zxA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default' } },
    { id: 'poi9', name: '蛇窯文化園區', coords: { lat: 23.801177, lng: 120.864479 }, icon: '🏺', description: '共乘、台灣好行。\n\n活動資訊: 購票入園，完成食農器皿文化參觀可獲得永續與環境教育點數10點。', image: '', socialLink: 'https://www.facebook.com/sskshop/?locale=zh_TW' },
    { id: 'poi10', name: '雨社山下', coords: { lat: 23.790644, lng: 120.896569 }, icon: '🥒', description: '接駁、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=61557727713841&locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_10', formLink: 'YOUR_FORM_LINK_10', lineId: 'https://line.me/ti/g2/ltdgi_rY8K-frnjS9Q0n0n2vGSO8uw8m5uGUWA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default' } },
    { id: 'poi11', name: '阿爾喜莊園', coords: { lat: 23.803119, lng: 120.926340 }, icon: '🍋', description: '接駁、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育、農業循環經濟教學。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/AHEIemon?locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_11', formLink: 'YOUR_FORM_LINK_11', lineId: 'https://line.me/ti/g2/f2JhyAIKmKvProOMzM2z4Mb-6ogaJOOsPT0jug?utm_source=invitation&utm_medium=link_copy&utm_campaign=default' } },
    { id: 'poi12', name: '湧健酪梨園', coords: { lat: 23.725349, lng: 120.846123 }, icon: '🥑', description: '台灣好行、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=100085673588842&locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_12', formLink: 'YOUR_FORM_LINK_12', lineId: 'https://line.me/ti/g2/PIlIHjGJgO-mmn3JvqgCJ9_mPY7Aoeqg8VOEDg?utm_source=invitation&utm_medium=link_copy&utm_campaign=default' } },
    { id: 'poi13', name: '謝家肉圓', coords: { lat: 23.817521, lng: 120.853831 }, icon: '🥟', description: '步行、摩托、台灣好行。營業時間 11:00–17:00。\n\n在地人巷內70年老店。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=100054428473137&locale=zh_TW' },
    { id: 'poi14', name: '機車貓聯盟', coords: { lat: 23.810883, lng: 120.855798 }, icon: '🍚', description: '共乘、摩托、台灣好行。營業時間 11:00–17:00。\n\n無菜單料理店，50%以上使用在地食材，任一消費金額可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://m.facebook.com/機車貓聯盟-552637305127422/' },
    { id: 'poi15', name: '二坪大觀冰店', coords: { lat: 23.813627, lng: 120.859651 }, icon: '🍦', description: '共乘、摩托。\n\n在地推薦古早味枝仔冰。台電員工福利社60年老店。', image: '', socialLink: 'https://www.facebook.com/2pinIce/' },
    { id: 'poi16', name: '水里里山村', coords: { lat: 23.813459, lng: 120.853787 }, icon: '🏡', description: '共乘、摩托。\n\n在地推鑑環保旅宿，任一消費金額可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://tg-ecohotel.com/' },
    { id: 'poi17', name: '水里星光市集', coords: { lat: 23.813636, lng: 120.850816 }, icon: '💡', description: '參加”逛市集增里程”地產地銷最減碳，支持在地消費獲得減碳量。\n\n本年度預計於星光市集舉辦「食農教育」活動，場次及內容請洽水里鄉商圈創生共好協會。', image: '', socialLink: 'https://www.facebook.com/p/%E6%B0%B4%E9%87%8C%E9%84%89%E5%95%86%E5%9C%88%E5%89%B5%E7%94%9F%E5%85%B1%E5%A5%BD%E5%8D%94%E6%9C%83-100076220760859/?locale=zh_TW', isNew: true, marketScheduleLink: 'https://www.facebook.com/photo/?fbid=2583695705169366&set=pcb.2583695981835995' },
    { id: 'poi18', name: '森音', coords: { lat: 23.742587, lng: 120.866954 }, icon: '🎶', description: '接駁、摩托、私家車。需預約。\n\n完成單一活動可獲得永續與環境教育任務點數10點。\n\n森音森林導覽，親子活動(咖啡座/木藝上板/森林育樂/畫廊)。', image: '', socialLink: 'https://www.facebook.com/morinooto111' }
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
    
    if(document.getElementById('player-code')) document.getElementById('player-code').textContent = playerCode;
    updateStatsDisplay();
    updateGreenConsumptionDisplay();
    if(document.getElementById('stats-load-status')) document.getElementById('stats-load-status').textContent = '已載入數據';
    
    if (db) {
        initGlobalCounters();
    }
}

function saveData() {
    const dataToSave = {
        totalMileage, totalCarbonReduction, totalScore, playerName: playerNameInput ? playerNameInput.value : '',
        playerCode, greenProcurementTotal, sroiProcurementTotal, projectProcurementTotal
    };
    localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
}

function updateStatsDisplay() {
    if(totalMileageSpan) totalMileageSpan.textContent = `${(totalMileage / 1000).toFixed(2)} km`;
    if(totalCarbonReductionSpan) totalCarbonReductionSpan.textContent = `${totalCarbonReduction.toFixed(2)} g`;
    if(totalScoreSpan) totalScoreSpan.textContent = totalScore;
    if(playerNameInput) playerNameInput.value = playerName;
}

function updateGreenConsumptionDisplay() {
    if(displayGreenProcure) displayGreenProcure.textContent = `$${greenProcurementTotal}`;
    if(displaySroiProcure) displaySroiProcure.textContent = `$${sroiProcurementTotal.toFixed(0)}`;
    if(displayProjectProcure) displayProjectProcure.textContent = `$${projectProcurementTotal}`;
    // Grand total is handled by Firebase listener
    if(totalGreenProcureDisplay) totalGreenProcureDisplay.textContent = `$${greenProcurementTotal}`;
    if(totalSroiDisplay) totalSroiDisplay.textContent = `$${sroiProcurementTotal.toFixed(0)}`;
    if(totalProjectDisplay) totalProjectDisplay.textContent = `$${projectProcurementTotal}`;
}

// --- Firebase Global Stats Logic ---
async function initGlobalCounters() {
    if (!db) return;

    try {
        // 1. Page Views
        // 先檢查是否存在，不存在則建立，存在則更新
        // 為了簡單起見，直接用 setDoc merge: true，如果不存在會建立
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
                 if(statusEl) statusEl.textContent = '雲端數據同步成功';

                 // Update Trees
                 const gramsPerTree = 10000; // Assuming 10kg = 1 tree
                 const trees = Math.floor(totalCarbon / gramsPerTree);
                 const treeEl = document.getElementById('trees-planted-count');
                 if(treeEl) treeEl.textContent = trees;
             }
        }, (error) => {
             console.error("Carbon stats listener error:", error);
             // 如果權限不足，這裡會報錯，但不會卡死其他功能
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

// 更新全域碳排與里程
async function updateGlobalCarbonStats(mileage, carbon) {
    if (!db) return;
    try {
        await setDoc(carbonStatsDocRef, {
            total_mileage: increment(mileage),
            total_carbon: increment(carbon),
            trip_count: increment(1)
        }, { merge: true });
        console.log("Global Carbon Updated:", carbon);
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
        if(document.getElementById('map-overlay')) document.getElementById('map-overlay').classList.add('hidden');
    } catch(e) {
        console.warn("Map init failed", e);
        window.mapScriptLoadError();
    }
}
window.initMap = initMap;

window.mapScriptLoadError = function() {
    if(document.getElementById('map-overlay')) document.getElementById('map-overlay').classList.add('hidden');
    if(document.getElementById('map-status')) {
        document.getElementById('map-status').innerHTML = '地圖載入失敗，已啟用離線計算模式。';
        document.getElementById('map-status').classList.add('text-red-600');
    }
    mapLoaded = false;
};

// UI Handlers
document.addEventListener('DOMContentLoaded', () => {
    
    // Transport Buttons
    document.querySelectorAll('.transport-option').forEach(button => {
        button.addEventListener('click', () => {
            const transportType = button.dataset.transport;
            if (transportType === 'thsr_haoxing') { showThsrInfoModal(); return; }
            if (transportType === 'taxi') { showTaxiInfoModal(); return; }
            document.querySelectorAll('.transport-option').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            currentTransport = transportType;
            showMissionPage();
        });
    });

    const entBtn = document.getElementById('enterprise-version-btn');
    if(entBtn) entBtn.addEventListener('click', () => document.getElementById('enterprise-modal').classList.remove('hidden'));
    
    const govBtn = document.getElementById('gov-version-btn');
    if(govBtn) govBtn.addEventListener('click', () => document.getElementById('gov-modal').classList.remove('hidden'));
    
    const greenEvalBtn = document.getElementById('open-green-eval-btn');
    if(greenEvalBtn) greenEvalBtn.addEventListener('click', () => document.getElementById('green-consumption-modal').classList.remove('hidden'));

    const marketBtn = document.getElementById('market-mileage-button');
    if(marketBtn) marketBtn.addEventListener('click', showMarketSelectionModal);

    const photoBtn = document.getElementById('photo-album-promo-button');
    if(photoBtn) photoBtn.addEventListener('click', showPhotoAlbumModal);

    document.querySelectorAll('.close-button').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal-overlay').classList.add('hidden');
        });
    });

    // Tabs
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active-tab', 'border-emerald-600', 'text-emerald-600'));
            const contents = document.querySelectorAll('.tab-content');
            contents.forEach(c => c.classList.add('hidden'));
            tab.classList.add('active-tab', 'border-emerald-600', 'text-emerald-600');
            const target = document.getElementById(tab.dataset.tab);
            if(target) target.classList.remove('hidden');
        });
    });

    // Populate Lists
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
             // Map is loaded or not, we handle it
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

    // Modal Submits
    const submitLogTripBtn = document.getElementById('submit-log-trip');
    if(submitLogTripBtn) submitLogTripBtn.addEventListener('click', submitLogTrip);
    const marketSubmitBtn = document.getElementById('submit-market-activity-button');
    if(marketSubmitBtn) marketSubmitBtn.addEventListener('click', submitMarketActivity);
    const backMarketBtn = document.getElementById('back-to-market-type-button');
    if(backMarketBtn) backMarketBtn.addEventListener('click', handleBackToMarketType);

    // Green Consumption Buttons
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

    populateMarketTypeOptions();
    loadData();
    showHomepage();
});

function showPoiModal(poi) {
    const modal = document.getElementById('poi-modal');
    if(!modal) return;
    modal.classList.remove('hidden');
    document.getElementById('poi-modal-title').textContent = poi.name;
    const startBtn = document.getElementById('set-as-start-button');
    if(startBtn) startBtn.onclick = () => { selectedStartPoi = poi; modal.classList.add('hidden'); updateSelectedPointsDisplay(); };
    const endBtn = document.getElementById('set-as-end-button');
    if(endBtn) endBtn.onclick = () => { selectedEndPoi = poi; modal.classList.add('hidden'); updateSelectedPointsDisplay(); };
}

function processTripResult(distanceMeters, method) {
    totalMileage += distanceMeters;
    const carbon = distanceMeters * 0.035; 
    totalCarbonReduction += carbon;
    
    updateStatsDisplay();
    updateGlobalCarbonStats(distanceMeters, carbon); // Update Global
    saveData();
    const statusEl = document.getElementById('trip-calculation-status');
    if(statusEl) statusEl.innerHTML = `計算成功 (${method})<br>里程: ${(distanceMeters/1000).toFixed(2)}km`;
}
