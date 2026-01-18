// --- 引入 Firebase SDK ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, increment, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

// --- Firebase Configuration ---
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

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    analytics = getAnalytics(app);
    
    // Init refs
    globalStatsRef = collection(db, 'global_stats');
    greenStatsDocRef = doc(db, 'global_stats', 'green_consumption');
    pageViewsDocRef = doc(db, 'global_stats', 'page_views');
    
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.error("Error initializing Firebase:", error);
    // 處理錯誤顯示
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
    { id: 'poi1', name: '水里永續共好聯盟打氣站', coords: { lat: 23.809799, lng: 120.849286 }, icon: '🌲', description: '營業時間上午8:00~17:00。\n\n不定期辦理活動，小尖兵們完成的永續任務的分數請在此出示，感謝您一起為地球減碳努力!\n\n本區共分為三個單位(水里鄉圖書館內):\n1. 社團法人南投縣水里鄉商圈創生共好協會 - 致力於推動水里地區商圈振興、永續農業、文化保存與地方創生行動。以多元合作模式打造出一個能共好、共學、共榮的地方創新平台。\n2. 水里溪畔驛站 - 在圖書館內的一處靜懿的景觀休憩場域，小農午餐需要事先預訂喔!\n3. 水里青農里山基地 - 是由臺大實驗林水里營林區輔導的里山餐桌團隊打造的里山及永續教育基地，由返鄉青農共同打造的農業與社區發展平台，以農村生產、生活、生態致力於推廣友善農業、食農教育及永續發展為目標。在這裡可以預約由小農開發的豐富教具進行DIY活動與食農、永續教育等活動!', image: '', socialLink: 'https://www.facebook.com/p/%E6%B0%B4%E9%87%8C%E9%84%89%E5%95%86%E5%9C%88%E5%89%B5%E7%94%9F%E5%85%B1%E5%A5%BD%E5%8D%94%E6%9C%83-100076220760859/?locale=zh_TW' },
    { id: 'poi2', name: '漫遊堤岸風光', coords: { lat: 23.808537, lng: 120.849415 }, icon: '🏞️', description: '起點：水里親水公園。終點：永興村，途中經過社子生態堤防、永興大橋、永興社區等地，路線全長約4公里，坡度平緩，適合親子及大眾。', image: '' },
    { id: 'poi3', name: '鑫鮮菇園', coords: { lat: 23.794049, lng: 120.859407 }, icon: '🍄', description: '營業時間: 需預約。\n\n提供香菇園區種植導覽與體驗行程 (時長20分鐘)。\n香菇/袖珍菇三角飯糰食農體驗(時長90分鐘)。', image: '', socialLink: 'https://www.facebook.com/xinxianguyuan', sroiInfo: { reportLink: '#', formLink: '#', lineId: 'TestID' } },
    { id: 'poi4', name: '永興神木', coords: { lat: 23.784127, lng: 120.862294 }, icon: '🌳', description: '社區麵包坊營業時間”上午9:00~17:00。\n\n永興神木（百年大樟樹）位於永興社區活動中心旁。樟樹群由三棵母子樹所形成，第一代木就是母樹，二代木則是母樹根系再長出的兩棵子樹，連成一體。樹齡約300年、樹圍6.2公尺、樹徑1.6公尺、樹高約26公尺、樹冠幅400平方公尺，一旁供俸老樹公及福德祠是居民的信仰中心。', image: '', socialLink: 'https://www.shli.gov.tw/story/1/6' },
    { id: 'poi5', name: '森林小白宮', coords: { lat: 23.779408, lng: 120.844019 }, icon: '🏠', description: '接駁、共乘、摩托。需預約。\n\n完成單一活動可獲得永續與環境教育任務點數10點。\n\n小白宮森林生態導覽，親子活動(彩繪/木藝/親子皮影)。', image: '', socialLink: 'https://wild-kids-studio.waca.tw/' },
    { id: 'poi6', name: '瑪路馬咖啡莊園', coords: { lat: 23.778239, lng: 120.843859 }, icon: '☕', description: '接駁、共乘、摩托。\n\n活動資訊: 咖啡座、咖啡園導覽。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/people/%E9%A6%AC%E8%B7%AF%E7%91%AA%E5%92%96%E5%95%A1%E8%8E%8A%E5%9C%92/100063961898841/' },
    { id: 'poi7', name: '指令教育農場', coords: { lat: 23.802776, lng: 120.864715 }, icon: '👆', description: '台灣好行、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/FarmCMD/', sroiInfo: { reportLink: '#', formLink: '#', lineId: 'TestID' } },
    { id: 'poi8', name: '明揚養蜂', coords: { lat: 23.803787, lng: 120.862401 }, icon: '🐝', description: '共乘、台灣好行、摩托。\n\n活動資訊: 育蜂場導覽、生態導覽、蜂蜜食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/MingYangBee/?locale=zh_TW', sroiInfo: { reportLink: '#', formLink: '#', lineId: 'TestID' } },
    { id: 'poi9', name: '蛇窯文化園區', coords: { lat: 23.801177, lng: 120.864479 }, icon: '🏺', description: '共乘、台灣好行。\n\n活動資訊: 購票入園，完成食農器皿文化參觀可獲得永續與環境教育點數10點。', image: '', socialLink: 'https://www.facebook.com/sskshop/?locale=zh_TW' },
    { id: 'poi10', name: '雨社山下', coords: { lat: 23.790644, lng: 120.896569 }, icon: '🥒', description: '接駁、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=61557727713841&locale=zh_TW', sroiInfo: { reportLink: '#', formLink: '#', lineId: 'TestID' } },
    { id: 'poi11', name: '阿爾喜莊園', coords: { lat: 23.803119, lng: 120.926340 }, icon: '🍋', description: '接駁、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育、農業循環經濟教學。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/AHEIemon?locale=zh_TW', sroiInfo: { reportLink: '#', formLink: '#', lineId: 'TestID' } },
    { id: 'poi12', name: '湧健酪梨園', coords: { lat: 23.725349, lng: 120.846123 }, icon: '🥑', description: '台灣好行、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=100085673588842&locale=zh_TW', sroiInfo: { reportLink: '#', formLink: '#', lineId: 'TestID' } },
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
let poiMarkers = [];
let selectedActivity = null;
let selectedStartPoi = null;
let selectedEndPoi = null;
let loggedActions = [];
let selectedSustainableActions = [];
let currentLogTripPoi = null;
let networkTotalCarbonReduction = 0;
let selectedMarketType = null;
let selectedMarketProduct = null;
let mapLoaded = false;

// --- DOM Elements ---
const homepageSection = document.getElementById('homepage');
const missionPageSection = document.getElementById('mission-page');
const playerNameInput = document.getElementById('player-name');
const playerCodeDisplay = document.getElementById('player-code');
const totalMileageSpan = document.getElementById('total-mileage');
const totalCarbonReductionSpan = document.getElementById('total-carbon-reduction');
const totalScoreSpan = document.getElementById('total-score');
const currentTransportDisplay = document.getElementById('current-transport-display');
const mapElement = document.getElementById('map');
const mapStatusElement = document.getElementById('map-status');
const mapOverlay = document.getElementById('map-overlay');
const selectedPointsDisplay = document.getElementById('selected-points-display');
const calculateMileageButton = document.getElementById('calculate-mileage-button');
const tripCalculationStatusElement = document.getElementById('trip-calculation-status');
const poiListElement = document.getElementById('poi-list');
const poiModal = document.getElementById('poi-modal');
const poiModalTitle = document.getElementById('poi-modal-title');
const poiModalImage = document.getElementById('poi-modal-image');
const poiModalDescription = document.getElementById('poi-modal-description');
const poiModalCoordinates = document.getElementById('poi-modal-coordinates');
const poiModalSocialDiv = document.getElementById('poi-modal-social');
const poiModalDynamicButtonsDiv = document.getElementById('poi-modal-dynamic-buttons');
const setAsStartButton = document.getElementById('set-as-start-button');
const setAsEndButton = document.getElementById('set-as-end-button');
const activityModal = document.getElementById('activity-modal');
const selectedActivityNameElement = document.getElementById('selected-activity-name');
const verificationCodeInput = document.getElementById('verification-code-input');
const activityContentInput = document.getElementById('activity-content-input');
const submitActivityLogButton = document.getElementById('submit-activity-log');
const activityLogStatusElement = document.getElementById('activity-log-status');
const activityListElement = document.getElementById('activity-list');
const participateActivityButton = document.getElementById('participate-activity-button');
const sustainableActionLogTextarea = document.getElementById('sustainable-action-log');
const logActionButton = document.getElementById('log-action-button');
const actionLogStatusElement = document.getElementById('action-log-status');
const backToHomeButton = document.getElementById('back-to-home');
const changeTransportButton = document.getElementById('change-transport-button');
const loggedActionsListElement = document.getElementById('logged-actions-list');
const thsrInfoModal = document.getElementById('thsr-info-modal');
const selectableActionsListElement = document.getElementById('selectable-actions-list');
const downloadDataButton = document.getElementById('download-data-button');
const activityModalImage = document.getElementById('activity-modal-image');
const refreshMapPageButton = document.getElementById('refresh-map-page-button');
const logTripModal = document.getElementById('log-trip-modal');
const logTripPoiNameElement = document.getElementById('log-trip-poi-name');
const logTripTransportOptionsDiv = document.getElementById('log-trip-transport-options');
const logTripMileageInput = document.getElementById('log-trip-mileage');
const submitLogTripButton = document.getElementById('submit-log-trip');
const logTripStatusElement = document.getElementById('log-trip-status');
const logTripTransportStatusElement = document.getElementById('log-trip-transport-status');
const logTripMileageStatusElement = document.getElementById('log-trip-mileage-status');
const taxiInfoModal = document.getElementById('taxi-info-modal');
const taxiInfoButton = document.getElementById('taxi-info-button');
const poiReviewSection = document.getElementById('poi-review-section');
const consumptionAmountInput = document.getElementById('consumption-amount');
const reviewCodeInput = document.getElementById('review-code');
const submitPoiReviewButton = document.getElementById('submit-poi-review');
const poiReviewStatusElement = document.getElementById('poi-review-status');
const poi12ButtonsDiv = document.getElementById('poi12-buttons');
const sroiOrderButtonPoi12 = document.getElementById('sroi-order-button-poi12');
const sroiInfoModal = document.getElementById('sroi-info-modal');
const sroiModalPoiNameElement = document.getElementById('sroi-modal-poi-name');
const sroiModalContentBody = document.getElementById('sroi-modal-content-body');
const showSroiInfoButton = document.getElementById('show-sroi-info-button');
const networkTotalCarbonReductionElement = document.getElementById('network-total-carbon-reduction');
const networkStatsStatusElement = document.getElementById('network-stats-status');
const treesPlantedCountElement = document.getElementById('trees-planted-count');
const marketMileageButton = document.getElementById('market-mileage-button');
const marketSelectionModal = document.getElementById('market-selection-modal');
const marketTypeSelectionStep = document.getElementById('market-type-selection-step');
const marketTypeOptionsDiv = document.getElementById('market-type-options');
const productTypeSelectionStep = document.getElementById('product-type-selection-step');
const selectedMarketTypeDisplay = document.getElementById('selected-market-type-display');
const productTypeOptionsDiv = document.getElementById('product-type-options');
const submitMarketActivityButton = document.getElementById('submit-market-activity-button');
const marketActivityStatusElement = document.getElementById('market-activity-status');
const backToMarketTypeButton = document.getElementById('back-to-market-type-button');
const marketStoreCodeInput = document.getElementById('market-store-code');
const photoAlbumPromoButton = document.getElementById('photo-album-promo-button');
const photoAlbumModal = document.getElementById('photo-album-modal');
const enterpriseBtn = document.getElementById('enterprise-version-btn');
const enterpriseModal = document.getElementById('enterprise-modal');
const govBtn = document.getElementById('gov-version-btn');
const govModal = document.getElementById('gov-modal');
const openGreenEvalBtn = document.getElementById('open-green-eval-btn');
const greenConsumptionModal = document.getElementById('green-consumption-modal');
const displayGreenProcure = document.getElementById('display-green-procurement');
const displaySroiProcure = document.getElementById('display-sroi-procurement');
const displayProjectProcure = document.getElementById('display-project-procurement');
const displayGrandTotalGreen = document.getElementById('display-grand-total-green');
const greenQtyInput = document.getElementById('green-qty');
const greenPriceInput = document.getElementById('green-price');
const greenSubtotalSpan = document.getElementById('green-subtotal');
const logGreenProcureBtn = document.getElementById('log-green-procure-btn');
const totalGreenProcureDisplay = document.getElementById('total-green-procure-display');
const sroiUnitSelect = document.getElementById('sroi-unit-select');
const sroiQtyInput = document.getElementById('sroi-qty');
const sroiPriceInput = document.getElementById('sroi-price');
const sroiSubtotalSpan = document.getElementById('sroi-subtotal');
const logSroiBtn = document.getElementById('log-sroi-btn');
const totalSroiDisplay = document.getElementById('total-sroi-display');
const projectPasswordInput = document.getElementById('project-password');
const unlockProjectBtn = document.getElementById('unlock-project-btn');
const passwordMsg = document.getElementById('password-msg');
const projectEntrySection = document.getElementById('project-entry-section');
const projectPasswordSection = document.getElementById('project-password-section');
const projectDescInput = document.getElementById('project-desc');
const projectAmountInput = document.getElementById('project-amount');
const logProjectBtn = document.getElementById('log-project-btn');
const totalProjectDisplay = document.getElementById('total-project-display');

const localStorageKey = 'shuilSustainableTourismData_v2.2';
const localStorageActionsKey = 'shuilSustainableTourismActions_v2.2';

function loadData() {
    const data = localStorage.getItem(localStorageKey);
    if (data) {
        const parsedData = JSON.parse(data);
        totalMileage = parsedData.totalMileage || 0;
        totalCarbonReduction = parsedData.totalCarbonReduction || 0;
        totalScore = parsedData.totalScore || 0;
        playerName = parsedData.playerName || '';
        playerCode = parsedData.playerCode || '';
        greenProcurementTotal = parsedData.greenProcurementTotal || 0;
        sroiProcurementTotal = parsedData.sroiProcurementTotal || 0;
        projectProcurementTotal = parsedData.projectProcurementTotal || 0;

        if (!playerCode) {
            playerCode = generateRandomCode();
        }

        updateStatsDisplay();
        updateGreenConsumptionDisplay();
        document.getElementById('stats-load-status').textContent = '已成功載入之前的旅遊數據。';
        document.getElementById('stats-load-status').classList.remove('text-gray-600');
        document.getElementById('stats-load-status').classList.add('text-green-600');

    } else {
        playerCode = generateRandomCode();
        totalMileage = 0;
        totalCarbonReduction = 0;
        totalScore = 0;
        playerName = '';
        greenProcurementTotal = 0;
        sroiProcurementTotal = 0;
        projectProcurementTotal = 0;
        
        updateStatsDisplay();
        updateGreenConsumptionDisplay();
        document.getElementById('stats-load-status').textContent = '未發現先前的旅遊數據，已建立新的永續旅者紀錄。';
        document.getElementById('stats-load-status').classList.remove('text-gray-600');
        document.getElementById('stats-load-status').classList.add('text-blue-600');
    }

    const actionsData = localStorage.getItem(localStorageActionsKey);
    if (actionsData) {
        loggedActions = JSON.parse(actionsData);
        renderLoggedActions();
    } else {
        loggedActions = [];
        loggedActionsListElement.innerHTML = '<p class="text-gray-500 text-center">尚無行動紀錄</p>';
    }
    saveData();
    if (db) {
        fetchNetworkTotalCarbonReduction();
        initGlobalCounters(); // Initialize global counters
    }
}

function saveData() {
    const dataToSave = {
        totalMileage: totalMileage,
        totalCarbonReduction: totalCarbonReduction,
        totalScore: totalScore,
        playerName: playerNameInput.value.trim(),
        playerCode: playerCode,
        greenProcurementTotal: greenProcurementTotal,
        sroiProcurementTotal: sroiProcurementTotal,
        projectProcurementTotal: projectProcurementTotal
    };
    localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
    localStorage.setItem(localStorageActionsKey, JSON.stringify(loggedActions));
    if (db && playerCode) {
       savePlayerDataToFirebase({
           playerCode: playerCode,
           playerName: playerNameInput.value.trim(),
           totalMileage: totalMileage,
           totalCarbonReduction: totalCarbonReduction,
           totalScore: totalScore,
           lastUpdated: serverTimestamp()
       });
    }
}

function updateStatsDisplay() {
    totalMileageSpan.textContent = `${(totalMileage / 1000).toFixed(2)} km`;
    totalCarbonReductionSpan.textContent = `${totalCarbonReduction.toFixed(2)} g`;
    totalScoreSpan.textContent = totalScore;
    playerNameInput.value = playerName;
    playerCodeDisplay.textContent = playerCode;
}

function updateGreenConsumptionDisplay() {
    displayGreenProcure.textContent = `$${greenProcurementTotal}`;
    displaySroiProcure.textContent = `$${sroiProcurementTotal.toFixed(0)}`;
    displayProjectProcure.textContent = `$${projectProcurementTotal}`;
    
    // Grand Total Display managed by Global Listener
    
    totalGreenProcureDisplay.textContent = `$${greenProcurementTotal}`;
    totalSroiDisplay.textContent = `$${sroiProcurementTotal.toFixed(0)}`;
    totalProjectDisplay.textContent = `$${projectProcurementTotal}`;
}

// Global Stats Logic
async function initGlobalCounters() {
    if (!db) return;

    try {
        // 1. Page Views Counter
        await setDoc(pageViewsDocRef, { count: increment(1) }, { merge: true });
        onSnapshot(pageViewsDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                const count = data.count || 0;
                const el = document.getElementById('page-view-count');
                if(el) el.textContent = count.toLocaleString();
            }
        });

        // 2. Global Green Consumption Listener
        onSnapshot(greenStatsDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                const green = data.green_amt || 0;
                const sroi = data.sroi_amt || 0;
                const project = data.project_amt || 0;
                const total = green + sroi + project;
                const count = data.count || 0;

                if(displayGrandTotalGreen) displayGrandTotalGreen.textContent = `$${total.toLocaleString()}`;
                const countEl = document.getElementById('global-green-trans-count');
                if(countEl) countEl.textContent = count.toLocaleString();
            }
        });
    } catch (e) { 
        console.error("Global stats init error", e); 
    }
}

async function updateGlobalGreenStats(amount, type) {
    if (!db || amount <= 0) return;
    try {
        const updatePayload = {
            count: increment(1)
        };
        if (type === 'green') updatePayload.green_amt = increment(amount);
        if (type === 'sroi') updatePayload.sroi_amt = increment(amount);
        if (type === 'project') updatePayload.project_amt = increment(amount);

        await setDoc(greenStatsDocRef, updatePayload, { merge: true });
    } catch (e) { console.error("Global stats update error", e); }
}

function generateRandomCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < 3; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 5; i++) {
        code += digits.charAt(Math.floor(Math.random() * digits.length));
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
        console.error("Error saving data: ", e);
    }
}

async function fetchNetworkTotalCarbonReduction() {
     if (!db) {
          networkTotalCarbonReductionElement.textContent = '載入失敗';
          networkStatsStatusElement.textContent = 'Firebase 未初始化 (預覽模式)';
          return;
     }
    networkTotalCarbonReductionElement.textContent = '載入中...';
    try {
        const playersSnapshot = await getDocs(collection(db, 'players'));
        let totalCarbonAcrossNetwork = 0;
        playersSnapshot.forEach(doc => {
            const playerData = doc.data();
            totalCarbonAcrossNetwork += (playerData.totalCarbonReduction || 0);
        });

        networkTotalCarbonReduction = totalCarbonAcrossNetwork;
        networkTotalCarbonReductionElement.textContent = `${networkTotalCarbonReduction.toFixed(2)} g`;
        networkStatsStatusElement.textContent = '網路統計數據載入成功。';
        const gramsPerTree = 10000000; 
        const treesPlanted = Math.floor(networkTotalCarbonReduction / gramsPerTree);
        if (treesPlantedCountElement) {
            treesPlantedCountElement.textContent = treesPlanted;
        }
    } catch (e) {
        console.error("Error fetching network total: ", e);
    }
}

function showHomepage() {
    homepageSection.style.display = 'block';
    missionPageSection.style.display = 'none';
    resetSelectedPoints();
    clearTripLine();
    clearSelectedActions();
    selectedActivity = null;
    if (db) {
        fetchNetworkTotalCarbonReduction();
        // Global stats are init in loadData
    }
}

function showMissionPage() {
    homepageSection.style.display = 'none';
    missionPageSection.style.display = 'block';

    if (mapLoaded && map) {
         google.maps.event.trigger(map, 'resize');
         map.setCenter({ lat: 23.810, lng: 120.850 });
    }
    
    currentTransportDisplay.textContent = currentTransport && transportData[currentTransport] ? transportData[currentTransport].name : '未選擇';
    updateSelectedPointsDisplay();
}

// Haversine algorithm for distance calculation (Fallback)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Return in meters
}

function initMap() {
     if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
         console.error("Google Maps API not loaded.");
         mapStatusElement.innerHTML = '地圖載入失敗。<br><span class="text-xs">啟用離線計算模式，您仍可計算里程。</span>';
         mapStatusElement.className = 'text-center text-red-600 font-bold';
         if(mapOverlay) {
             mapOverlay.classList.add('hidden');
         }
         return;
     }

     transportData.bike.travelMode = google.maps.TravelMode.BICYCLING;
     transportData.walk.travelMode = google.maps.TravelMode.WALKING;
     transportData.bus_train.travelMode = google.maps.TravelMode.TRANSIT;
     transportData.carpool_2_moto.travelMode = google.maps.TravelMode.DRIVING;
     transportData.carpool_3.travelMode = google.maps.TravelMode.DRIVING;
     transportData.carpool_4.travelMode = google.maps.TravelMode.DRIVING;
     transportData.carpool_5.travelMode = google.maps.TravelMode.DRIVING;
     transportData.thsr_haoxing.travelMode = google.maps.TravelMode.TRANSIT;

    const defaultCoords = { lat: 23.810, lng: 120.850 };

    try {
        map = new google.maps.Map(mapElement, {
            center: defaultCoords,
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
                label: {
                    text: poi.name,
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    className: 'map-label'
                }
            });
            marker.poiData = poi;
            marker.addListener('click', function() {
                showPoiModal(this.poiData);
            });
            poiMarkers.push(marker);
        });

        mapLoaded = true;
        // Hide loading overlay
        if(mapOverlay) mapOverlay.classList.add('opacity-0');
        setTimeout(() => { if(mapOverlay) mapOverlay.classList.add('hidden'); }, 500);

    } catch (e) {
        console.error("Map init error:", e);
        mapStatusElement.textContent = "地圖初始化錯誤，已啟用離線計算模式。";
        if(mapOverlay) mapOverlay.classList.add('hidden');
    }
}
window.initMap = initMap;

// Global map script load failure handler (Network blocking)
window.mapScriptLoadError = function() {
    console.error("Google Maps Script failed to load (Network blocked?)");
    const statusEl = document.getElementById('map-status');
    if (statusEl) {
        statusEl.innerHTML = '無法連線至 Google 地圖伺服器。<br><span class="text-xs text-red-600">已自動切換至離線計算模式。</span>';
        statusEl.className = 'text-center text-gray-700 font-bold';
    }
    // Hide overlay so users can see the fallback text or interact with other elements
    if(mapOverlay) mapOverlay.classList.add('hidden');
    // Ensure offline mode works by setting google undefined (just in case)
    if(typeof google !== 'undefined') mapLoaded = false;
};

// Global auth failure handler (API Key invalid)
window.gm_authFailure = function() {
     console.error("Google Maps Auth Failure");
     const statusEl = document.getElementById('map-status');
     if (statusEl) {
         statusEl.innerHTML = '地圖 API 金鑰驗證失敗。<br><span class="text-xs text-red-600">已自動切換至離線計算模式。</span>';
         statusEl.className = 'text-center text-gray-700 font-bold';
     }
     if(mapOverlay) mapOverlay.classList.add('hidden');
     mapLoaded = false; 
};

function updateSelectedPointsDisplay() {
    const startName = selectedStartPoi ? selectedStartPoi.name : '未選擇';
    const endName = selectedEndPoi ? selectedEndPoi.name : '未選擇';
    selectedPointsDisplay.textContent = `起點: ${startName} | 終點: ${endName}`;
    updatePoiListItemHighlights();
}

function updatePoiListItemHighlights() {
     poiListElement.querySelectorAll('li').forEach(item => {
         item.classList.remove('poi-list-item-start', 'poi-list-item-end');
     });
     if (selectedStartPoi) {
         const startItem = poiListElement.querySelector(`li[data-poi-id="${selectedStartPoi.id}"]`);
         if (startItem) startItem.classList.add('poi-list-item-start');
     }
     if (selectedEndPoi) {
         const endItem = poiListElement.querySelector(`li[data-poi-id="${selectedEndPoi.id}"]`);
         if (endItem) endItem.classList.add('poi-list-item-end');
     }
}

function resetSelectedPoints() {
    selectedStartPoi = null;
    selectedEndPoi = null;
    updateSelectedPointsDisplay();
    clearTripLine();
}

function calculateTripMileage() {
    if (!selectedStartPoi || !selectedEndPoi) {
        tripCalculationStatusElement.textContent = '請先選擇起點和終點！';
        return;
    }
    if (selectedStartPoi.id === selectedEndPoi.id) {
        tripCalculationStatusElement.textContent = '起點和終點不能相同！';
        return;
    }
    if (currentTransport === null) {
        tripCalculationStatusElement.textContent = '請先選擇交通方式！';
        return;
    }

    tripCalculationStatusElement.textContent = '正在計算路徑...';
    clearTripLine();

    // Try Google Maps API first
    if (mapLoaded && directionsService && typeof google !== 'undefined') {
        let travelMode = google.maps.TravelMode.DRIVING;
        const selectedTransportData = transportData[currentTransport];
        if (selectedTransportData && selectedTransportData.travelMode) {
            travelMode = selectedTransportData.travelMode;
        }

        const request = {
            origin: selectedStartPoi.coords,
            destination: selectedEndPoi.coords,
            travelMode: travelMode
        };

        directionsService.route(request, (response, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(response);
                const route = response.routes[0];
                const leg = route.legs[0];
                const distanceInMeters = leg.distance.value;
                processTripResult(distanceInMeters, 'Google Maps');
            } else {
                console.warn("Google Directions failed, using fallback:", status);
                useFallbackCalculation();
            }
        });
    } else {
        // Fallback if map not loaded or API missing
        useFallbackCalculation();
    }
}

function useFallbackCalculation() {
    const dist = haversineDistance(
        selectedStartPoi.coords.lat, selectedStartPoi.coords.lng,
        selectedEndPoi.coords.lat, selectedEndPoi.coords.lng
    );
    // Estimate road distance as 1.3x straight line distance
    const estimatedMeters = Math.round(dist * 1.3);
    processTripResult(estimatedMeters, '直線距離估算');
}

function processTripResult(distanceInMeters, method) {
    totalMileage += distanceInMeters;

    let tripCarbonReduction = 0;
    if (currentTransport && transportData[currentTransport].carbonReductionPer10km > 0) {
        const carbonReductionPerMeter = transportData[currentTransport].carbonReductionPer10km / 10000;
        tripCarbonReduction = distanceInMeters * carbonReductionPerMeter;
        totalCarbonReduction += tripCarbonReduction;
    }

    let scoreForThisTrip = 0;
    if (currentTransport && transportData[currentTransport].metersPerPoint !== Infinity) {
        const metersPerPoint = transportData[currentTransport].metersPerPoint;
        scoreForThisTrip = Math.floor(distanceInMeters / metersPerPoint);
        totalScore += scoreForThisTrip;
    }

    updateStatsDisplay();
    tripCalculationStatusElement.innerHTML = `計算成功 (${method})<br>里程: ${(distanceInMeters / 1000).toFixed(2)} km, 減碳: ${tripCarbonReduction.toFixed(2)} g. 獲得分數: ${scoreForThisTrip}`;

    const now = new Date();
    const timestamp = now.toLocaleString();
    const newLogEntry = {
        type: 'trip_calculation',
        startPoiName: selectedStartPoi.name,
        endPoiName: selectedEndPoi.name,
        transportName: transportData[currentTransport].name,
        transportIcon: transportData[currentTransport].icon,
        mileageInMeters: distanceInMeters,
        carbonReduction: tripCarbonReduction,
        points: scoreForThisTrip,
        timestamp: timestamp
    };
    loggedActions.push(newLogEntry);
    saveData();
    renderLoggedActions();
}

function clearTripLine() {
     if (directionsRenderer) {
         directionsRenderer.setDirections({ routes: [] });
     }
}

function populatePoiList() {
    poiListElement.innerHTML = '';
    pois.forEach(poi => {
        const listItem = document.createElement('li');
        listItem.classList.add('clickable-list-item', 'hover:text-green-700', 'p-3', 'rounded-md', 'transition-colors', 'duration-150');
        listItem.dataset.poiId = poi.id;

        const textSpan = document.createElement('span');
        let poiNameDisplay = `${poi.icon} ${poi.name}`;
        if (poi.isNew) poiNameDisplay += ' <span class="new-indicator text-red-500 font-bold text-xs ml-1">NEW</span>';
        if (poi.sroiInfo) poiNameDisplay += ' <span class="text-purple-600 font-semibold text-xs ml-1">(SROI)</span>';
        textSpan.innerHTML = poiNameDisplay;

        textSpan.addEventListener('click', (event) => {
            event.stopPropagation();
            showPoiModal(poi);
        });
        listItem.appendChild(textSpan);

        const iconGroup = document.createElement('div');
        iconGroup.classList.add('icon-group', 'flex', 'items-center', 'space-x-3');

        if (poi.socialLink) {
            const socialLinkElement = document.createElement('a');
            socialLinkElement.href = poi.socialLink;
            socialLinkElement.target = "_blank";
            socialLinkElement.classList.add('social-icon', 'text-gray-600', 'hover:text-blue-500');
            socialLinkElement.innerHTML = '<i class="fas fa-link fa-lg"></i>';
            iconGroup.appendChild(socialLinkElement);
        }

        const navigationLinkElement = document.createElement('a');
        navigationLinkElement.href = `https://www.google.com/maps/search/?api=1&query=$${poi.coords.lat},${poi.coords.lng}`;
        navigationLinkElement.target = "_blank";
        navigationLinkElement.classList.add('navigation-icon', 'text-gray-600', 'hover:text-emerald-500');
        navigationLinkElement.innerHTML = '<i class="fas fa-compass fa-lg"></i>';
        iconGroup.appendChild(navigationLinkElement);

        const logTripIcon = document.createElement('button');
        logTripIcon.classList.add('log-trip-icon', 'text-gray-600', 'hover:text-orange-500', 'p-1', 'rounded-full');
        logTripIcon.innerHTML = '<i class="fas fa-car-side fa-lg"></i>';
        logTripIcon.addEventListener('click', (event) => {
             event.stopPropagation();
             showLogTripModal(poi);
        });
        iconGroup.appendChild(logTripIcon);

        listItem.appendChild(iconGroup);
        listItem.addEventListener('click', () => showPoiModal(poi));
        poiListElement.appendChild(listItem);
    });
     updatePoiListItemHighlights();
}

function showPoiModal(poi) {
    poiModal.currentPoi = poi;
    poiModalTitle.textContent = poi.name;
    let modalDescriptionHTML = poi.description.replace(/\n/g, '<br>');

    if (poi.id === 'poi17' && poi.marketScheduleLink) {
        modalDescriptionHTML += '<br><br>';
         modalDescriptionHTML += `<p class="font-semibold text-green-800">出攤日期預告:</p>`;
        modalDescriptionHTML += `<p><a href="${poi.marketScheduleLink}" target="_blank" class="text-blue-600 hover:underline">點此查看最新出攤日期</a></p>`;
    }

    poiModalDescription.innerHTML = modalDescriptionHTML;
    poiModalCoordinates.textContent = `座標: ${poi.coords.lat}, ${poi.coords.lng}`;

    if (poi.image) {
        poiModalImage.src = poi.image;
        poiModalImage.classList.remove('hidden');
    } else {
        poiModalImage.classList.add('hidden');
        poiModalImage.src = '';
    }

    poiModalSocialDiv.innerHTML = '';
    if (poi.socialLink) {
        const socialLinkElement = document.createElement('a');
        socialLinkElement.href = poi.socialLink;
        socialLinkElement.target = "_blank";
        socialLinkElement.classList.add('text-green-600', 'hover:underline', 'font-semibold', 'block', 'mt-2');
        socialLinkElement.innerHTML = '<i class="fas fa-link mr-1"></i>前往相關網站';
        poiModalSocialDiv.appendChild(socialLinkElement);
    }

    if (poi.id === 'poi14' || poi.id === 'poi16') {
        poiReviewSection.classList.remove('hidden');
        consumptionAmountInput.value = '';
        reviewCodeInput.value = '';
        poiReviewStatusElement.textContent = '';
    } else {
        poiReviewSection.classList.add('hidden');
    }

     if (poi.id === 'poi12') {
         poi12ButtonsDiv.classList.remove('hidden');
          document.getElementById('sroi-info-button-container').classList.add('hidden');
     } else {
         poi12ButtonsDiv.classList.add('hidden');
         if (poi.sroiInfo) {
              document.getElementById('sroi-info-button-container').classList.remove('hidden');
              showSroiInfoButton.sroiInfo = poi.sroiInfo;
              showSroiInfoButton.poiName = poi.name;
         } else {
              document.getElementById('sroi-info-button-container').classList.add('hidden');
         }
     }

    poiModalDynamicButtonsDiv.innerHTML = '';
    if (poi.id === 'poi17') {
        const marketButtonInModal = document.createElement('button');
        marketButtonInModal.className = 'w-full mt-3 px-6 py-3 bg-purple-600 text-white font-bold rounded-lg shadow hover:bg-purple-700 transition-all duration-300 ease-in-out text-center';
        marketButtonInModal.innerHTML = '<i class="fas fa-store mr-2"></i>逛市集增里程';
        marketButtonInModal.addEventListener('click', () => {
            hidePoiModal();
            showMarketSelectionModal();
        });
        poiModalDynamicButtonsDiv.appendChild(marketButtonInModal);
    }
    poiModal.classList.remove('hidden');
}

function hidePoiModal() {
    poiModal.classList.add('hidden');
    poiModal.currentPoi = null;
}

function submitPoiReview() {
    const currentPoi = poiModal.currentPoi;
    if (!currentPoi) return;

    const consumptionAmount = parseFloat(consumptionAmountInput.value);
    const reviewCode = reviewCodeInput.value.trim();

    if (isNaN(consumptionAmount) || consumptionAmount <= 0) {
        poiReviewStatusElement.textContent = '請輸入有效的消費金額。';
        return;
    }

    const codeRegex = /^[0-9]{3}$/;
    if (!codeRegex.test(reviewCode)) {
        poiReviewStatusElement.textContent = '請輸入有效的3碼數字審核碼。';
        return;
    }

    const pointsEarned = 10;
    totalScore += pointsEarned;
    updateStatsDisplay();

    const now = new Date();
    const timestamp = now.toLocaleString();
    const newLogEntry = {
        type: 'poi_review',
        poiName: currentPoi.name,
        consumption: consumptionAmount,
        reviewCode: reviewCode,
        timestamp: timestamp,
        points: pointsEarned
    };

    loggedActions.push(newLogEntry);
    saveData();
    renderLoggedActions();

    poiReviewStatusElement.textContent = `審核成功！獲得 +${pointsEarned} 積分！`;
    consumptionAmountInput.value = '';
    reviewCodeInput.value = '';
}

 function populateActivityList() {
     activityListElement.innerHTML = '';
     activities.forEach(activity => {
         const listItem = document.createElement('li');
         listItem.classList.add('clickable-list-item', 'p-2', 'rounded-md', 'hover:bg-blue-100', 'transition-colors');
         listItem.textContent = `${activity.name} (${activity.points} 分)`;
         listItem.activityData = activity;
         listItem.addEventListener('click', handleActivityItemClick);
         activityListElement.appendChild(listItem);
     });
 }

 function handleActivityItemClick() {
     if (selectedActivity) {
         const previousSelectedItem = Array.from(activityListElement.children).find(child => child.activityData.id === selectedActivity.id);
         if (previousSelectedItem) previousSelectedItem.classList.remove('selected-activity-item', 'bg-blue-200', 'font-semibold');
     }
     selectedActivity = this.activityData;
     this.classList.add('selected-activity-item', 'bg-blue-200', 'font-semibold');
 }


 function showActivityModal() {
     if (!selectedActivity) {
         alert('請先選擇活動。');
         return;
     }
     selectedActivityNameElement.textContent = selectedActivity.name;
     verificationCodeInput.value = '';
     activityContentInput.value = '';
     activityLogStatusElement.textContent = '';

     if (selectedActivity.image) {
         activityModalImage.src = selectedActivity.image;
         activityModalImage.classList.remove('hidden');
     } else {
         activityModalImage.classList.add('hidden');
     }
     activityModal.classList.remove('hidden');
 }

 function hideActivityModal() {
     activityModal.classList.add('hidden');
 }

 function logActivity() {
     if (!selectedActivity) return;
     const inputCode = verificationCodeInput.value.trim();
     const activityContent = activityContentInput.value.trim();

     const codeRegex = /^[a-zA-Z0-9]{6}$/;
     if (codeRegex.test(inputCode)) {
         const pointsEarned = selectedActivity.points;
         totalScore += pointsEarned;
         updateStatsDisplay();

         const now = new Date();
         const timestamp = now.toLocaleString();
         const newLogEntry = {
             type: 'activity',
             activityName: selectedActivity.name,
             content: activityContent,
             timestamp: timestamp,
             points: pointsEarned
         };

         loggedActions.push(newLogEntry);
         saveData();
         renderLoggedActions();

         activityLogStatusElement.textContent = `活動已記錄！獲得 +${pointsEarned} 積分！`;
         verificationCodeInput.value = '';
         activityContentInput.value = '';
         setTimeout(() => { activityLogStatusElement.textContent = ''; }, 3000);
     } else {
         activityLogStatusElement.textContent = '驗證碼格式錯誤 (6碼)。';
     }
 }

function populateSelectableActionsList() {
    selectableActionsListElement.innerHTML = '';
    sustainableActions.forEach(action => {
        const actionItem = document.createElement('div');
        actionItem.classList.add('selectable-action-item', 'p-2', 'border', 'rounded-md', 'cursor-pointer', 'hover:bg-green-50', 'transition-colors');
        actionItem.textContent = `${action.name} (${action.points} 分)`;
        actionItem.actionData = action;
        actionItem.addEventListener('click', toggleSustainableActionSelection);
        selectableActionsListElement.appendChild(actionItem);
    });
}

function toggleSustainableActionSelection() {
    const actionItem = this;
    const actionName = actionItem.actionData.name;
    const index = selectedSustainableActions.indexOf(actionName);
    if (index === -1) {
        selectedSustainableActions.push(actionName);
        actionItem.classList.add('selected', 'bg-green-100', 'border-green-500', 'font-semibold');
    } else {
        selectedSustainableActions.splice(index, 1);
        actionItem.classList.remove('selected', 'bg-green-100', 'border-green-500', 'font-semibold');
    }
}

function clearSelectedActions() {
     selectedSustainableActions = [];
     selectableActionsListElement.querySelectorAll('.selectable-action-item').forEach(item => {
         item.classList.remove('selected', 'bg-green-100', 'border-green-500', 'font-semibold');
     });
}

function logSustainableAction() {
    const actionText = sustainableActionLogTextarea.value.trim();
    if (selectedSustainableActions.length === 0 || !actionText) {
         actionLogStatusElement.textContent = '請選擇行動並輸入內容。';
         return;
    }

    let pointsEarnedFromActions = 0;
    selectedSustainableActions.forEach(selectedName => {
         const action = sustainableActions.find(act => act.name === selectedName);
         if (action) pointsEarnedFromActions += action.points;
    });

    totalScore += pointsEarnedFromActions;
    updateStatsDisplay();

    const now = new Date();
    const timestamp = now.toLocaleString();
    const newLogEntry = {
        type: 'action',
        text: actionText,
        timestamp: timestamp,
        actions: [...selectedSustainableActions],
        points: pointsEarnedFromActions
    };

    loggedActions.push(newLogEntry);
    saveData();
    renderLoggedActions();

    actionLogStatusElement.textContent = `已記錄！獲得 +${pointsEarnedFromActions} 積分！`;
    clearSelectedActions();
    sustainableActionLogTextarea.value = '';
    setTimeout(() => { actionLogStatusElement.textContent = ''; }, 3000);
}

function renderLoggedActions() {
    loggedActionsListElement.innerHTML = '';
    if (loggedActions.length === 0) {
        loggedActionsListElement.innerHTML = '<p class="text-gray-500 text-center">尚無行動紀錄</p>';
        return;
    }
    const sortedLogs = [...loggedActions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    sortedLogs.forEach(log => {
        const logItem = document.createElement('div');
        logItem.classList.add('action-log-item');
        
        let contentHTML = '';
        switch(log.type) {
            case 'action': contentHTML = `<p class="log-type">行動</p><p>項目: ${log.actions.join(', ')}</p><p>${log.text}</p>`; break;
            case 'activity': contentHTML = `<p class="log-type">活動</p><p>名稱: ${log.activityName}</p><p>${log.content || ''}</p>`; break;
            case 'trip_to_poi': contentHTML = `<p class="log-type">手動旅程</p><p>${log.poiName}</p><p>里程: ${(log.mileageInMeters/1000).toFixed(2)}km</p>`; break;
            case 'trip_calculation': contentHTML = `<p class="log-type">地圖旅程</p><p>${log.startPoiName} -> ${log.endPoiName}</p><p>里程: ${(log.mileageInMeters/1000).toFixed(2)}km</p>`; break;
            case 'market_visit': contentHTML = `<p class="log-type">市集</p><p>${log.marketTypeName} - ${log.productName}</p>`; break;
            case 'poi_review': contentHTML = `<p class="log-type">消費</p><p>${log.poiName}</p>`; break;
        }
        
        logItem.innerHTML = `${contentHTML}<p class="timestamp">${log.timestamp}</p>`;
        loggedActionsListElement.appendChild(logItem);
    });
}

function showLogTripModal(poi) {
    currentLogTripPoi = poi;
    logTripPoiNameElement.textContent = poi.name;
    logTripMileageInput.value = '';
    logTripStatusElement.textContent = '';
    logTripTransportOptionsDiv.innerHTML = '';
    
    for (const key in transportData) {
        if (key !== 'thsr_haoxing') {
            const transportOption = transportData[key];
            const button = document.createElement('button');
            button.className = 'log-trip-transport-button px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-sm';
            button.textContent = `${transportOption.icon} ${transportOption.name}`;
            button.dataset.transport = key;
            button.addEventListener('click', handleLogTripTransportSelect);
            logTripTransportOptionsDiv.appendChild(button);
        }
    }
    logTripModal.classList.remove('hidden');
}

function hideLogTripModal() {
    logTripModal.classList.add('hidden');
    currentLogTripPoi = null;
}

let selectedLogTripTransport = null;
function handleLogTripTransportSelect() {
    logTripTransportOptionsDiv.querySelectorAll('.log-trip-transport-button').forEach(button => {
        button.classList.remove('selected', 'bg-orange-300', 'border-orange-600', 'text-orange-900', 'font-semibold');
    });
    this.classList.add('selected', 'bg-orange-300', 'border-orange-600', 'text-orange-900', 'font-semibold');
    selectedLogTripTransport = this.dataset.transport;
}

function submitLogTrip() {
    if (!currentLogTripPoi || !selectedLogTripTransport) return;
    const mileageKm = parseFloat(logTripMileageInput.value);
    if (isNaN(mileageKm) || mileageKm < 0) return;

    const mileageInMeters = mileageKm * 1000;
    const transportInfo = transportData[selectedLogTripTransport];
    
    let tripCarbonReduction = 0;
    if (transportInfo.carbonReductionPer10km > 0) {
        tripCarbonReduction = mileageInMeters * (transportInfo.carbonReductionPer10km / 10000);
    }

    totalMileage += mileageInMeters;
    totalCarbonReduction += tripCarbonReduction;
    
    let scoreForThisTrip = 0;
    if (transportInfo.metersPerPoint !== Infinity) {
          scoreForThisTrip = Math.floor(mileageInMeters / transportInfo.metersPerPoint);
          totalScore += scoreForThisTrip;
    }

    updateStatsDisplay();

    const now = new Date();
    const timestamp = now.toLocaleString();
    const newLogEntry = {
        type: 'trip_to_poi',
        poiName: currentLogTripPoi.name,
        transportName: transportInfo.name,
        transportIcon: transportInfo.icon,
        mileageInMeters: mileageInMeters,
        carbonReduction: tripCarbonReduction,
        points: scoreForThisTrip,
        timestamp: timestamp
    };

    loggedActions.push(newLogEntry);
    saveData();
    renderLoggedActions();
    
    logTripStatusElement.textContent = `已記錄！里程: ${mileageKm.toFixed(2)} km`;
    setTimeout(() => { hideLogTripModal(); }, 1500);
}

function showThsrInfoModal() { thsrInfoModal.classList.remove('hidden'); }
function hideThsrInfoModal() { thsrInfoModal.classList.add('hidden'); }
function showTaxiInfoModal() { taxiInfoModal.classList.remove('hidden'); }
function hideTaxiInfoModal() { taxiInfoModal.classList.add('hidden'); }

function showSroiInfoModal(sroiInfo, poiName) {
      sroiModalPoiNameElement.textContent = poiName;
      sroiModalContentBody.innerHTML = '';
      if (sroiInfo.reportLink) sroiModalContentBody.innerHTML += `<a href="${sroiInfo.reportLink}" target="_blank" class="text-blue-600 hover:underline block"><i class="fas fa-file-alt mr-1"></i>農場影響力報告書</a>`;
      if (sroiInfo.formLink) sroiModalContentBody.innerHTML += `<a href="${sroiInfo.formLink}" target="_blank" class="text-blue-600 hover:underline block mt-2"><i class="fas fa-clipboard-list mr-1"></i>採購表單</a>`;
      sroiInfoModal.classList.remove('hidden');
}
function hideSroiInfoModal() { sroiInfoModal.classList.add('hidden'); }

function downloadTourismData() {
    let htmlContent = `<html><body><h1>水里永續數據</h1><p>代碼: ${playerCode}</p><p>里程: ${(totalMileage/1000).toFixed(2)}km</p></body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `水里永續數據_${playerCode}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function showMarketSelectionModal() {
    marketSelectionModal.classList.remove('hidden');
    marketTypeSelectionStep.classList.remove('hidden');
    productTypeSelectionStep.classList.add('hidden');
    backToMarketTypeButton.classList.add('hidden');
    submitMarketActivityButton.disabled = true;
    populateMarketTypeOptions();
}

function hideMarketSelectionModal() { marketSelectionModal.classList.add('hidden'); }

function populateMarketTypeOptions() {
    marketTypeOptionsDiv.innerHTML = '';
    marketTypes.forEach(market => {
        const button = document.createElement('button');
        button.className = 'market-option-button w-full text-left p-4 border rounded-lg hover:bg-purple-50 mb-2';
        button.innerHTML = `<span class="text-2xl mr-3">${market.icon}</span><span class="font-semibold">${market.name}</span>`;
        button.addEventListener('click', () => {
            selectedMarketType = market;
            marketTypeSelectionStep.classList.add('hidden');
            productTypeSelectionStep.classList.remove('hidden');
            backToMarketTypeButton.classList.remove('hidden');
            selectedMarketTypeDisplay.textContent = market.name;
            populateProductOptions();
        });
        marketTypeOptionsDiv.appendChild(button);
    });
}

function populateProductOptions() {
    productTypeOptionsDiv.innerHTML = '';
    Object.keys(marketProductData).forEach(productKey => {
        const product = marketProductData[productKey];
        const button = document.createElement('button');
        button.className = 'product-option-button w-full text-left p-3 border rounded-lg hover:bg-purple-50 flex justify-between mb-2';
        button.innerHTML = `<span>${product.icon} ${product.name}</span><span class="text-xs text-gray-600">+${product.points}分</span>`;
        button.addEventListener('click', () => {
            selectedMarketProduct = product;
            submitMarketActivityButton.disabled = false;
            // Reset styling loop omitted for brevity
        });
        productTypeOptionsDiv.appendChild(button);
    });
}

function handleBackToMarketType() {
    marketTypeSelectionStep.classList.remove('hidden');
    productTypeSelectionStep.classList.add('hidden');
    backToMarketTypeButton.classList.add('hidden');
    selectedMarketProduct = null;
    submitMarketActivityButton.disabled = true;
}

function submitMarketActivity() {
    if (!selectedMarketType || !selectedMarketProduct) return;
    totalMileage += selectedMarketProduct.mileage;
    totalCarbonReduction += selectedMarketProduct.carbonReduction;
    totalScore += selectedMarketProduct.points;
    updateStatsDisplay();

    const newLogEntry = {
        type: 'market_visit',
        marketTypeName: selectedMarketType.name,
        productName: selectedMarketProduct.name,
        mileageInMeters: selectedMarketProduct.mileage,
        carbonReduction: selectedMarketProduct.carbonReduction,
        points: selectedMarketProduct.points,
        timestamp: new Date().toLocaleString()
    };
    loggedActions.push(newLogEntry);
    saveData();
    renderLoggedActions();
    marketActivityStatusElement.textContent = '已記錄消費！';
    setTimeout(() => { hideMarketSelectionModal(); }, 1500);
}

function showPhotoAlbumModal() { if (photoAlbumModal) photoAlbumModal.classList.remove('hidden'); }
function hidePhotoAlbumModal() { if (photoAlbumModal) photoAlbumModal.classList.add('hidden'); }

function showEnterpriseModal() { if(enterpriseModal) enterpriseModal.classList.remove('hidden'); }
function hideEnterpriseModal() { if(enterpriseModal) enterpriseModal.classList.add('hidden'); }
function showGovModal() { if(govModal) govModal.classList.remove('hidden'); }
function hideGovModal() { if(govModal) govModal.classList.add('hidden'); }

// Green Consumption Functions
function showGreenConsumptionModal() { greenConsumptionModal.classList.remove('hidden'); }
function hideGreenConsumptionModal() { greenConsumptionModal.classList.add('hidden'); }

function calculateGreenSubtotal() {
    const qty = parseFloat(greenQtyInput.value) || 0;
    const price = parseFloat(greenPriceInput.value) || 0;
    greenSubtotalSpan.textContent = (qty * price).toFixed(0);
}

function calculateSroiSubtotal() {
    const qty = parseFloat(sroiQtyInput.value) || 0;
    const price = parseFloat(sroiPriceInput.value) || 0;
    const weight = parseFloat(sroiUnitSelect.value) || 0;
    sroiSubtotalSpan.textContent = (qty * price * weight).toFixed(0);
}

function unlockProject() {
     if (projectPasswordInput.value === '555666') {
         projectEntrySection.classList.remove('hidden');
         projectPasswordSection.classList.add('hidden');
         passwordMsg.textContent = '';
     } else {
         passwordMsg.textContent = '密碼錯誤';
     }
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    populatePoiList();
    populateActivityList();
    populateSelectableActionsList();

    playerNameInput.addEventListener('input', saveData);
    document.querySelectorAll('.transport-option').forEach(button => {
        button.addEventListener('click', () => {
            const transportType = button.dataset.transport;
            if (transportType === 'thsr_haoxing') { showThsrInfoModal(); return; }
            if (transportType === 'taxi') { showTaxiInfoModal(); return; } // Added handler for taxi
            document.querySelectorAll('.transport-option').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            currentTransport = transportType;
            showMissionPage();
        });
    });

    if (marketMileageButton) marketMileageButton.addEventListener('click', showMarketSelectionModal);
    if (marketSelectionModal) marketSelectionModal.querySelector('.close-button').addEventListener('click', hideMarketSelectionModal);
    if (submitMarketActivityButton) submitMarketActivityButton.addEventListener('click', submitMarketActivity);
    if (backToMarketTypeButton) backToMarketTypeButton.addEventListener('click', handleBackToMarketType);
    if (photoAlbumPromoButton) photoAlbumPromoButton.addEventListener('click', showPhotoAlbumModal);
    if (photoAlbumModal) photoAlbumModal.querySelector('.close-button').addEventListener('click', hidePhotoAlbumModal);
    
    if (enterpriseBtn) enterpriseBtn.addEventListener('click', showEnterpriseModal);
    if (enterpriseModal) {
        enterpriseModal.querySelector('.close-button').addEventListener('click', hideEnterpriseModal);
        enterpriseModal.addEventListener('click', (e) => { if (e.target === enterpriseModal) hideEnterpriseModal(); });
    }
    
    if (govBtn) govBtn.addEventListener('click', showGovModal);
    if (govModal) {
        govModal.querySelector('.close-button').addEventListener('click', hideGovModal);
        govModal.addEventListener('click', (e) => { if (e.target === govModal) hideGovModal(); });
    }
    
    // Green Consumption Event Listeners
    openGreenEvalBtn.addEventListener('click', showGreenConsumptionModal);
    greenConsumptionModal.querySelector('.close-button').addEventListener('click', hideGreenConsumptionModal);
    
    // Tabs
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active-tab', 'border-emerald-600', 'text-emerald-600'));
            contents.forEach(c => c.classList.add('hidden'));
            tab.classList.add('active-tab', 'border-emerald-600', 'text-emerald-600');
            document.getElementById(tab.dataset.tab).classList.remove('hidden');
        });
    });

    // Calc & Log Green Procure
    greenQtyInput.addEventListener('input', calculateGreenSubtotal);
    greenPriceInput.addEventListener('input', calculateGreenSubtotal);
    logGreenProcureBtn.addEventListener('click', () => {
        const subtotal = parseFloat(greenSubtotalSpan.textContent) || 0;
        if(subtotal > 0) {
            greenProcurementTotal += subtotal;
            updateGreenConsumptionDisplay();
            updateGlobalGreenStats(subtotal, 'green'); // Update server global stats with type
            saveData();
            // Reset
            greenQtyInput.value = 1;
            greenPriceInput.value = '';
            calculateGreenSubtotal();
            alert('綠色採購已登錄！');
        }
    });

    // Calc & Log SROI
    sroiQtyInput.addEventListener('input', calculateSroiSubtotal);
    sroiPriceInput.addEventListener('input', calculateSroiSubtotal);
    sroiUnitSelect.addEventListener('change', calculateSroiSubtotal);
    logSroiBtn.addEventListener('click', () => {
        const subtotal = parseFloat(sroiSubtotalSpan.textContent) || 0;
        if(subtotal > 0) {
            sroiProcurementTotal += subtotal;
            updateGreenConsumptionDisplay();
            updateGlobalGreenStats(subtotal, 'sroi'); // Update server global stats with type
            saveData();
            // Reset
            sroiQtyInput.value = 1;
            sroiPriceInput.value = '';
            calculateSroiSubtotal();
            alert('SROI 評鑑已登錄！');
        }
    });
    
    // Project
    unlockProjectBtn.addEventListener('click', unlockProject);
    logProjectBtn.addEventListener('click', () => {
        const amount = parseFloat(projectAmountInput.value) || 0;
        if (amount > 0) {
            projectProcurementTotal += amount;
            updateGreenConsumptionDisplay();
            updateGlobalGreenStats(amount, 'project'); // Update server global stats with type
            saveData();
            // Reset
            projectDescInput.value = '';
            projectAmountInput.value = '';
            alert('專案採購金額已登錄！');
        }
    });

    calculateMileageButton.addEventListener('click', calculateTripMileage);
    poiModal.querySelector('.close-button').addEventListener('click', hidePoiModal);
    setAsStartButton.addEventListener('click', () => { if (poiModal.currentPoi) { selectedStartPoi = poiModal.currentPoi; updateSelectedPointsDisplay(); hidePoiModal(); } });
    setAsEndButton.addEventListener('click', () => { if (poiModal.currentPoi) { selectedEndPoi = poiModal.currentPoi; updateSelectedPointsDisplay(); hidePoiModal(); } });
    submitPoiReviewButton.addEventListener('click', submitPoiReview);
    if (sroiOrderButtonPoi12) sroiOrderButtonPoi12.addEventListener('click', () => { const p = pois.find(x=>x.id==='poi12'); if(p && p.sroiInfo) showSroiInfoModal(p.sroiInfo, p.name); });
    if (showSroiInfoButton) showSroiInfoButton.addEventListener('click', () => { if(showSroiInfoButton.sroiInfo) showSroiInfoModal(showSroiInfoButton.sroiInfo, showSroiInfoButton.poiName); });
    participateActivityButton.addEventListener('click', showActivityModal);
    activityModal.querySelector('.close-button').addEventListener('click', hideActivityModal);
    submitActivityLogButton.addEventListener('click', logActivity);
    logActionButton.addEventListener('click', logSustainableAction);
    backToHomeButton.addEventListener('click', showHomepage);
    changeTransportButton.addEventListener('click', showHomepage);
    thsrInfoModal.querySelector('.close-button').addEventListener('click', hideThsrInfoModal);
    downloadDataButton.addEventListener('click', downloadTourismData);
    logTripModal.querySelector('.close-button').addEventListener('click', hideLogTripModal);
    submitLogTripButton.addEventListener('click', submitLogTrip);
    taxiInfoButton.addEventListener('click', showTaxiInfoModal);
    taxiInfoModal.querySelector('.close-button').addEventListener('click', hideTaxiInfoModal);
    sroiInfoModal.querySelector('.close-button').addEventListener('click', hideSroiInfoModal);
    if (refreshMapPageButton) refreshMapPageButton.addEventListener('click', () => location.reload());

    showHomepage();
});
