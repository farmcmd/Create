// script.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";


// --- Firebase Configuration ---
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCEH65YbNirj_IRmtsIJZS-HNEbsRBBsSQ", // Your Firebase API Key
    authDomain: "sustainable-tourism-65025.firebaseapp.com",
    projectId: "sustainable-tourism-65025",
    storageBucket: "sustainable-tourism-65025.firebasestorage.app",
    messagingSenderId: "781325465882",
    appId: "1:781325465882:web:9435b02bd618f0c16814a3",
    measurementId: "G-SZJ1RX5QS4"
};

// Initialize Firebase
let app;
let db;
let analytics;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app); // Get a reference to the Firestore service using the new method
    analytics = getAnalytics(app); // Get a reference to the Analytics service using the new method
    console.log("Firebase initialized successfully."); // Debugging line
    // Initial fetch of network total after Firebase is initialized
    // This will now happen when loadData is called on DOMContentLoaded
    // fetchNetworkTotalCarbonReduction(); // This is called in loadData now

} catch (error) {
    console.error("Error initializing Firebase:", error); // Debugging line
    // Update network stats status on Firebase initialization error
    const networkStatsStatusElement = document.getElementById('network-stats-status');
    if (networkStatsStatusElement) {
        networkStatsStatusElement.textContent = `Firebase 初始化失敗: ${error.message}. 無法載入網路統計。`;
        networkStatsStatusElement.classList.remove('text-gray-600', 'text-green-600');
        networkStatsStatusElement.classList.add('text-red-600');
    }
    const networkTotalCarbonReductionElement = document.getElementById('network-total-carbon-reduction');
    if (networkTotalCarbonReductionElement) {
        networkTotalCarbonReductionElement.textContent = '載入失敗';
    }
}


// --- Data Definitions ---
// Define transportData here, outside initMap, with placeholder travelMode
let transportData = {
    // Added metersPerPoint for score calculation based on distance
    // Corrected carbon reduction values based on user feedback
    bike: { name: '腳踏車', icon: '🚲', carbonReductionPer10km: 350, travelMode: null, metersPerPoint: 10000 }, // 10km = 10000m
    walk: { name: '步行', icon: '🚶‍♂️', carbonReductionPer10km: 400, travelMode: null, metersPerPoint: 8000 },   // 8km = 8000m
    bus_train: { name: '共乘巴士 (公車/火車/遊覽巴士)', icon: '🚌', carbonReductionPer10km: 300, travelMode: null, metersPerPoint: 15000 }, // 15km = 15000m
    carpool_2_moto: { name: '私家車共乘 2 人 / 摩托車', icon: '🏍️🚗', carbonReductionPer10km: 100, travelMode: null, metersPerPoint: 25000 }, // 25km = 25000m
    carpool_3: { name: '私家車共乘 3 人', icon: '🚗', carbonReductionPer10km: 120, travelMode: null, metersPerPoint: 20000 }, // 20km = 20000m
    carpool_4: { name: '私家車共乘 4 人', icon: '🚗', carbonReductionPer10km: 150, travelMode: null, metersPerPoint: 18000 }, // 18km = 18000m
    carpool_5: { name: '私家車共乘 5 人', icon: '🚗', carbonReductionPer10km: 200, travelMode: null, metersPerPoint: 16000 }, // 16km = 16000m
    thsr_haoxing: { name: '高鐵假期x台灣好行', icon: '🚄🚌', carbonReductionPer10km: 0, travelMode: null, metersPerPoint: Infinity }
    // Taxi info is not included here as it's not for mileage calculation
};


// Points of Interest Data
const pois = [
    { id: 'poi1', name: '水里永續共好聯盟打氣站', coords: { lat: 23.809799, lng: 120.849286 }, icon: '🌲', description: '營業時間上午8:00~17:00。\n\n不定期辦理活動，小尖兵們完成的永續任務的分數請在此出示，感謝您一起為地球減碳努力!\n\n本區共分為三個單位(水里鄉圖書館內):\n1. 社團法人南投縣水里鄉商圈創生共好協會 - 致力於推動水里地區商圈振興、永續農業、文化保存與地方創生行動。以多元合作模式打造出一個能共好、共學、共榮的地方創新平台。\n2. 水里溪畔驛站 - 在圖書館內的一處靜懿的景觀休憩場域，小農午餐需要事先預訂喔!\n3. 水里青農里山基地 - 是由臺大實驗林水里營林區輔導的里山餐桌團隊打造的里山及永續教育基地，由返鄉青農共同打造的農業與社區發展平台，以農村生產、生活、生態致力於推廣友善農業、食農教育及永續發展為目標。在這裡可以預約由小農開發的豐富教具進行DIY活動與食農、永續教育等活動!', image: '', socialLink: 'https://www.facebook.com/p/%E6%B0%B4%E9%87%8C%E9%84%89%E5%95%86%E5%9C%88%E5%89%B5%E7%94%9F%E5%85%B1%E5%A5%BD%E5%8D%94%E6%9C%83-100076220760859/?locale=zh_TW' },
    { id: 'poi2', name: '漫遊堤岸風光', coords: { lat: 23.808537, lng: 120.849415 }, icon: '🏞️', description: '起點：水里親水公園。終點：永興村，途中經過社子生態堤防、永興大橋、永興社區等地，路線全長約4公里，坡度平緩，適合親子及大眾。', image: '' },
    { id: 'poi3', name: '鑫鮮菇園', coords: { lat: 23.794049, lng: 120.859407 }, icon: '🍄', description: '營業時間: 需預約。\n\n提供香菇園區種植導覽與體驗行程 (時長20分鐘)。\n香菇/袖珍菇三角飯糰食農體驗(時長90分鐘)。', image: '', socialLink: 'https://www.facebook.com/xinxianguyuan', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_3', formLink: 'YOUR_FORM_LINK_3', lineId: 'YOUR_LINE_ID_3' } },
    { id: 'poi4', name: '永興神木', coords: { lat: 23.784127, lng: 120.862294 }, icon: '🌳', description: '社區麵包坊營業時間”上午9:00~17:00。\n\n永興神木（百年大樟樹）位於永興社區活動中心旁。樟樹群由三棵母子樹所形成，第一代木就是母樹，二代木則是母樹根系再長出的兩棵子樹，連成一體。樹齡約300年、樹圍6.2公尺、樹徑1.6公尺、樹高約26公尺、樹冠幅400平方公尺，一旁供俸老樹公及福德祠是居民的信仰中心。\n\n社區活動中心二樓設有社區麵包坊，由北海扶輪社、臺大實驗林、水里商工，共同扶持社區成立，利用當地種植的果物製作的吐司產品是新鮮別具風味的暢銷品。', image: '', socialLink: 'https://www.shli.gov.tw/story/1/6' },
    { id: 'poi5', name: '森林小白宮', coords: { lat: 23.779408, lng: 120.844019 }, icon: '🏠', description: '接駁、共乘、摩托。需預約。\n\n完成單一活動可獲得永續與環境教育任務點數10點。\n\n小白宮森林生態導覽，親子活動(彩繪/木藝/親子皮影)。', image: '', socialLink: 'https://wild-kids-studio.waca.tw/' },
    { id: 'poi6', name: '瑪路馬咖啡莊園', coords: { lat: 23.778239, lng: 120.843859 }, icon: '☕', description: '接駁、共乘、摩托。\n\n活動資訊: 咖啡座、咖啡園導覽。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/people/%E9%A6%AC%E8%B7%AF%E7%91%AA%E5%92%96%E5%95%A1%E8%8E%8A%E5%9C%93/100063961898841/' },
    { id: 'poi7', name: '指令教育農場', coords: { lat: 23.802776, lng: 120.864715 }, icon: '👆', description: '台灣好行、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/FarmCMD/', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_7', formLink: 'YOUR_FORM_LINK_7', lineId: 'YOUR_LINE_ID_7' } },
    { id: 'poi8', name: '明揚養蜂', coords: { lat: 23.803787, lng: 120.862401 }, icon: '🐝', description: '共乘、台灣好行、摩托。\n\n活動資訊: 育蜂場導覽、生態導覽、蜂蜜食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/MingYangBee/?locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_8', formLink: 'YOUR_FORM_LINK_8', lineId: 'YOUR_LINE_ID_8' } },
    { id: 'poi9', name: '蛇窯文化園區', coords: { lat: 23.801177, lng: 120.864479 }, icon: '🏺', description: '共乘、台灣好行。\n\n活動資訊: 購票入園，完成食農器皿文化參觀可獲得永續與環境教育點數10點。', image: '', socialLink: 'https://www.facebook.com/sskshop/?locale=zh_TW' },
    { id: 'poi10', name: '雨社山下', coords: { lat: 23.790644, lng: 120.896569 }, icon: '🥒', description: '接駁、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=61557727713841&locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_10', formLink: 'YOUR_FORM_LINK_10', lineId: 'YOUR_LINE_ID_10' } },
    { id: 'poi11', name: '阿爾喜莊園', coords: { lat: 23.803119, lng: 120.926340 }, icon: '🍋', description: '接駁、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育、農業循環經濟教學。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/AHEIemon?locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_11', formLink: 'YOUR_FORM_LINK_11', lineId: 'YOUR_LINE_ID_11' } },
    { id: 'poi12', name: '湧健酪梨園', coords: { lat: 23.725349, lng: 120.846123 }, icon: '🥑', description: '台灣好行、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=100085673588842&locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_12', formLink: 'YOUR_FORM_LINK_12', lineId: 'YOUR_LINE_ID_12' } },
    { id: 'poi13', name: '謝家肉圓', coords: { lat: 23.817521, lng: 120.853831 }, icon: '🥟', description: '步行、摩托、台灣好行。營業時間 11:00–17:00。\n\n在地人巷內70年老店。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=100054428473137&locale=zh_TW' },
    { id: 'poi14', name: '機車貓聯盟', coords: { lat: 23.810883, lng: 120.855798 }, icon: '🍚', description: '共乘、摩托、台灣好行。營業時間 11:00–17:00。\n\n無菜單料理店，50%以上使用在地食材，任一消費金額可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://m.facebook.com/%E機車貓聯盟-552637305127422/' },
    { id: 'poi15', name: '二坪大觀冰店', coords: { lat: 23.813627, lng: 120.859651 }, icon: '🍦', description: '共乘、摩托。\n\n在地推薦古早味枝仔冰。台電員工福利社60年老店。', image: '', socialLink: 'https://www.facebook.com/2pinIce/' },
    { id: 'poi16', name: '水里里山村', coords: { lat: 23.813459, lng: 120.853787 }, icon: '🏡', description: '共乘、摩托。\n\n在地推鑑環保旅宿，任一消費金額可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://tg-ecohotel.com/' },
    {
        id: 'poi17',
        name: '水里星光市集',
        coords: { lat: 23.813636, lng: 120.850816 },
        icon: '💡',
        description: '共乘、摩托。\n\n任一消費金額可獲得永續與環境教育任務點數10點。\n\n本年度預計於星光市集舉辦「食農教育」活動，場次及內容請洽水里鄉商圈創生共好協會。',
        image: '',
        socialLink: 'https://www.facebook.com/p/%E6%B0%B4%E9%87%8C%E9%84%89%E5%95%86%E5%9C%88%E5%89%B5%E7%94%9F%E5%85%B1%E5%A5%BD%E5%8D%94%E6%9C%83-100076220760859/?locale=zh_TW',
        isNew: true,
        marketScheduleLink: 'https://www.facebook.com/photo/?fbid=2583695705169366&set=pcb.2583696081835995',
        isConsumptionPOI: true,
        consumptionData: { // New property for consumption-specific data
            farm_product: { mileage: 5000, carbonReduction: 20, label: '農產品' }, // 5km = 5000m, 20g
            local_food: { mileage: 3000, carbonReduction: 12, label: '在地小吃' },   // 3km = 3000m, 12g
            cultural_creative: { mileage: 2000, carbonReduction: 8, label: '文創商品' }, // 2km = 2000m, 8g
            service: { mileage: 2000, carbonReduction: 8, label: '服務類' },      // 2km = 2000m, 8g
            other: { mileage: 2000, carbonReduction: 8, label: '其他' }         // 2km = 2000m, 8g
        }
    }
];

 // Sustainable Actions Data with points
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


// Sustainable Activities Data
const activities = [
    // validCodes are now only used for reference, verification checks format only
    // TODO: Replace the placeholder image URL below with a permanent, publicly accessible URL for the SROI image
    { id: 'act1', name: 'SROI 社會責任農產品購買', points: 15, validCodes: ['ABC123', 'XYZ789'], image: 'https://placehold.co/400x200/4caf50/white?text=SROI+Image' }, // Added placeholder image URL with green color
    { id: 'act2', name: '生態棲地破冰活動', points: 20, validCodes: ['DEF456', 'UVW012'] },
    { id: 'act3', name: 'ESG社會責任活動講堂', points: 25, validCodes: ['GHI789', 'RST345'] },
    { id: 'act4', name: 'CBD里山生態廊道永續旅遊', points: 30, validCodes: ['JKL012', 'QRS678'] },
    { id: 'act5', name: '里山倡議食農下午茶講堂', points: 20, validCodes: ['MNO345', 'PQR901'] },
    { id: 'act6', name: '小白宮x山形工作室', points: 10, validCodes: ['PQR678', 'STU234'] },
    { id: 'act7', name: '其他永續與環境教育活動及課程', points: 10, validCodes: ['VWX901', 'YZA567'] }
    // Add more activities and valid codes as needed
];

// --- State Variables ---
let currentTransport = null; // This is for the *overall* selected transport on the homepage
let totalMileage = 0; // in meters
let totalCarbonReduction = 0; // in grams
let totalScore = 0;
let playerName = ''; // New state variable for player name
let playerCode = ''; // New state variable for player code
let map = null; // Google Map object
// Re-added Directions Service and Renderer
let directionsService = null; // Google Maps DirectionsService object
let directionsRenderer = null; // Google Maps DirectionsRenderer object
let poiMarkers = []; // Array to store Google Maps Marker objects
let selectedActivity = null; // To store the currently selected activity for verification
// Re-added selectedStartPoi and selectedEndPoi
let selectedStartPoi = null; // To store the selected start POI object
let selectedEndPoi = null; // To store the selected end POI object
let loggedActions = []; // Array to store sustainable action logs
let selectedSustainableActions = []; // Array to store selected sustainable action names

// New state variable for the currently selected POI in the log trip modal
let currentLogTripPoi = null;

// New state variable for network-wide total carbon reduction
let networkTotalCarbonReduction = 0;

// New state variable for selected consumption type in poi17 modal
let selectedConsumptionType = null; // Changed from selectedConsumptionMileagePoints
let selectedConsumptionLabel = null;


// --- DOM Elements ---
const homepageSection = document.getElementById('homepage');
const missionPageSection = document.getElementById('mission-page');
const thsrInfoDiv = document.getElementById('thsr-info'); // This div is now unused for display, kept for reference
const playerNameInput = document.getElementById('player-name'); // New input element for player name
const playerCodeDisplay = document.getElementById('player-code'); // New element to display player code
const totalMileageSpan = document.getElementById('total-mileage');
const totalCarbonReductionSpan = document.getElementById('total-carbon-reduction');
const totalScoreSpan = document.getElementById('total-score');
const currentTransportDisplay = document.getElementById('current-transport-display');
const mapElement = document.getElementById('map');
const mapStatusElement = document.getElementById('map-status'); // Get the map status element
// Re-added selectedPointsDisplay and calculateMileageButton
const selectedPointsDisplay = document.getElementById('selected-points-display'); // New element for selected points
const calculateMileageButton = document.getElementById('calculate-mileage-button'); // New button
// Re-added tripCalculationStatusElement
const tripCalculationStatusElement = document.getElementById('trip-calculation-status'); // New status element
const poiListElement = document.getElementById('poi-list');
const poiModal = document.getElementById('poi-modal');
const poiModalTitle = document.getElementById('poi-modal-title');
const poiModalImage = document.getElementById('poi-modal-image');
const poiModalDescription = document.getElementById('poi-modal-description');
const poiModalCoordinates = document.getElementById('poi-modal-coordinates');
const poiModalSocialDiv = document.getElementById('poi-modal-social'); // New element for social links in modal
// Re-added setAsStartButton and setAsEndButton
const setAsStartButton = document.getElementById('set-as-start-button'); // New button in modal
const setAsEndButton = document.getElementById('set-as-end-button'); // New button in modal
const activityModal = document.getElementById('activity-modal'); // Activity Modal
const selectedActivityNameElement = document.getElementById('selected-activity-name'); // Element to show selected activity name in modal
const verificationCodeInput = document.getElementById('verification-code-input'); // Input in Activity Modal
const activityContentInput = document.getElementById('activity-content-input'); // New input for activity content
const submitActivityLogButton = document.getElementById('submit-activity-log'); // Button in Activity Modal (renamed from submitVerificationCode)
const activityLogStatusElement = document.getElementById('activity-log-status'); // Status in Activity Modal (renamed from verificationStatus)
const activityListElement = document.getElementById('activity-list');
const participateActivityButton = document.getElementById('participate-activity-button'); // Participate button
const sustainableActionLogTextarea = document.getElementById('sustainable-action-log');
const logActionButton = document.getElementById('log-action-button');
const actionLogStatusElement = document.getElementById('action-log-status'); // Status for sustainable actions
const backToHomeButton = document.getElementById('back-to-home');
const changeTransportButton = document.getElementById('change-transport-button'); // New button
const loggedActionsListElement = document.getElementById('logged-actions-list'); // Element to display logged actions
const thsrInfoModal = document.getElementById('thsr-info-modal'); // THSR Info Modal
const selectableActionsListElement = document.getElementById('selectable-actions-list'); // Element to display selectable actions
const downloadDataButton = document.getElementById('download-data-button'); // New download button element
const activityModalImage = document.getElementById('activity-modal-image'); // Get the activity modal image element

// New DOM elements for Log Trip Modal
const logTripModal = document.getElementById('log-trip-modal');
const logTripPoiNameElement = document.getElementById('log-trip-poi-name');
const logTripTransportOptionsDiv = document.getElementById('log-trip-transport-options');
const logTripMileageInput = document.getElementById('log-trip-mileage');
const submitLogTripButton = document.getElementById('submit-log-trip');
const logTripStatusElement = document.getElementById('log-trip-status');
const logTripTransportStatusElement = document.getElementById('log-trip-transport-status'); // Status for transport selection
const logTripMileageStatusElement = document.getElementById('log-trip-mileage-status'); // Status for mileage input

// New DOM elements for Taxi Info Modal
const taxiInfoModal = document.getElementById('taxi-info-modal');
const taxiInfoButton = document.getElementById('taxi-info-button'); // Button to open taxi info modal

// New DOM elements for POI Review Section
const poiReviewSection = document.getElementById('poi-review-section');
const consumptionAmountInput = document.getElementById('consumption-amount');
const reviewCodeInput = document.getElementById('review-code');
const submitPoiReviewButton = document.getElementById('submit-poi-review');
const poiReviewStatusElement = document.getElementById('poi-review-status');

// New DOM elements for poi12 specific buttons
const poi12ButtonsDiv = document.getElementById('poi12-buttons');
// Re-added sroiOrderButton for poi12
const sroiOrderButtonPoi12 = document.getElementById('sroi-order-button-poi12');


// New DOM elements for SROI Info Modal
const sroiInfoModal = document.getElementById('sroi-info-modal');
const sroiModalPoiNameElement = document.getElementById('sroi-modal-poi-name');
const sroiModalContentBody = document.getElementById('sroi-modal-content-body');
const showSroiInfoButton = document.getElementById('show-sroi-info-button'); // Get the new SROI button

// New DOM element for network total carbon reduction display
const networkTotalCarbonReductionElement = document.getElementById('network-total-carbon-reduction');
const networkStatsStatusElement = document.getElementById('network-stats-status'); // Status for network stats

// New DOM elements for poi17 consumption section
const poi17ConsumptionSection = document.getElementById('poi17-consumption-section');
const consumptionButtonsDiv = document.getElementById('consumption-buttons');
const consumptionCodeInput = document.getElementById('consumption-code-input');
const submitConsumptionButton = document.getElementById('submit-consumption');
const consumptionStatusElement = document.getElementById('consumption-status');


// --- Local Storage ---
const localStorageKey = 'shuilSustainableTourismData';
const localStorageActionsKey = 'shuilSustainableTourismActions'; // New key for actions

function loadData() {
    console.log("--- Loading Data ---"); // Debugging
    const data = localStorage.getItem(localStorageKey);
    if (data) {
        const parsedData = JSON.parse(data);
        totalMileage = parsedData.totalMileage || 0;
        totalCarbonReduction = parsedData.totalCarbonReduction || 0;
        totalScore = parsedData.totalScore || 0;
        playerName = parsedData.playerName || '';
        playerCode = parsedData.playerCode || '';

        console.log("Loaded from localStorage:", {totalMileage, totalCarbonReduction, totalScore, playerName, playerCode}); // Debugging

        if (!playerCode) {
            playerCode = generateRandomCode();
            console.log("No playerCode found, generated new:", playerCode); // Debugging
        } else {
            console.log("PlayerCode loaded:", playerCode); // Debugging
        }

        updateStatsDisplay();
        document.getElementById('stats-load-status').textContent = '已成功載入之前的旅遊數據。';
        document.getElementById('stats-load-status').classList.remove('text-gray-600');
        document.getElementById('stats-load-status').classList.add('text-green-600');

    } else {
        playerCode = generateRandomCode();
        totalMileage = 0;
        totalCarbonReduction = 0;
        totalScore = 0;
        playerName = '';
        console.log("No data found in localStorage. Initializing new record with playerCode:", playerCode); // Debugging
        updateStatsDisplay();
        document.getElementById('stats-load-status').textContent = '未發現先前的旅遊數據，已建立新的永續旅者紀錄。';
        document.getElementById('stats-load-status').classList.remove('text-gray-600');
        document.getElementById('stats-load-status').classList.add('text-blue-600');
    }

    const actionsData = localStorage.getItem(localStorageActionsKey);
    if (actionsData) {
        loggedActions = JSON.parse(actionsData);
        console.log("Loaded action logs from localStorage:", loggedActions); // Debugging
        renderLoggedActions();
    } else {
        loggedActions = [];
        loggedActionsListElement.innerHTML = '<p class="text-gray-500 text-center">尚無行動紀錄</p>';
        console.log("No action logs found in localStorage."); // Debugging
    }
    saveData(); // Save initial state (potentially new playerCode)
    console.log("--- Data Loading Complete ---"); // Debugging

    if (db) {
        fetchNetworkTotalCarbonReduction();
    } else {
        console.warn("Firebase not initialized, cannot fetch network total.");
    }
}

function saveData() {
    console.log("--- Saving Data ---"); // Debugging
    const dataToSave = {
        totalMileage: totalMileage,
        totalCarbonReduction: totalCarbonReduction,
        totalScore: totalScore,
        playerName: playerNameInput.value.trim(),
        playerCode: playerCode
    };
    localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
    console.log("Saved to localStorage:", dataToSave); // Debugging

    localStorage.setItem(localStorageActionsKey, JSON.stringify(loggedActions));
    console.log("Saved action logs to localStorage:", loggedActions); // Debugging

    if (db && playerCode) {
        console.log("Attempting to save to Firebase for playerCode:", playerCode); // Debugging
        savePlayerDataToFirebase({
            playerCode: playerCode,
            playerName: playerNameInput.value.trim(),
            totalMileage: totalMileage,
            totalCarbonReduction: totalCarbonReduction,
            totalScore: totalScore,
            lastUpdated: serverTimestamp()
        });
    } else {
        console.warn("Firebase not initialized or player code missing, cannot save player data to Firebase."); // Debugging
    }
    console.log("--- Data Saving Complete ---"); // Debugging
}

function updateStatsDisplay() {
    totalMileageSpan.textContent = `${(totalMileage / 1000).toFixed(2)} km`;
    totalCarbonReductionSpan.textContent = `${totalCarbonReduction.toFixed(2)} g`;
    totalScoreSpan.textContent = totalScore;
    playerNameInput.value = playerName;
    playerCodeDisplay.textContent = playerCode;
    console.log("Stats display updated to:", { mileage: totalMileage, carbon: totalCarbonReduction, score: totalScore, name: playerName, code: playerCode }); // Debugging
}

// --- Generate Random Code ---
function generateRandomCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    let code = '';
    // 3 random letters
    for (let i = 0; i < 3; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    // 5 random digits
    for (let i = 0; i < 5; i++) {
        code += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return code;
}

// --- Firebase Integration ---

async function savePlayerDataToFirebase(playerData) {
    if (!db) {
        console.error("Firebase Firestore not initialized. Cannot save data.");
        return;
    }
    try {
        const playerDocRef = doc(collection(db, 'players'), playerData.playerCode);
        await setDoc(playerDocRef, playerData, { merge: true });
        console.log("Player data saved to Firebase successfully for playerCode:", playerData.playerCode); // Debugging
        fetchNetworkTotalCarbonReduction();

    } catch (e) {
        console.error("Error saving player data to Firebase: ", e); // Debugging
    }
}


async function fetchNetworkTotalCarbonReduction() {
    console.log("Attempting to fetch network total carbon reduction from Firebase..."); // Debugging
    if (!db) {
        console.error("Firebase Firestore not initialized. Cannot fetch data."); // Debugging
        networkTotalCarbonReductionElement.textContent = '載入失敗';
        networkStatsStatusElement.textContent = 'Firebase 未初始化。請檢查 API 金鑰。';
        networkStatsStatusElement.classList.remove('text-gray-600', 'text-green-600');
        networkStatsStatusElement.classList.add('text-red-600');
        return;
    }

    networkTotalCarbonReductionElement.textContent = '載入中...';
    networkStatsStatusElement.textContent = '從伺服器載入中...';
    networkStatsStatusElement.classList.remove('text-green-600', 'text-red-600', 'text-blue-600');
    networkStatsStatusElement.classList.add('text-gray-600');


    try {
        const playersSnapshot = await getDocs(collection(db, 'players'));
        console.log("Fetched players snapshot from Firebase."); // Debugging

        let totalCarbonAcrossNetwork = 0;

        if (!playersSnapshot.empty) {
            playersSnapshot.forEach(doc => {
                const playerData = doc.data();
                totalCarbonAcrossNetwork += (playerData.totalCarbonReduction || 0);
            });
            console.log(`Processed ${playersSnapshot.size} player documents.`); // Debugging
        } else {
            console.log("No player data found in Firebase 'players' collection."); // Debugging
        }

        networkTotalCarbonReduction = totalCarbonAcrossNetwork;
        networkTotalCarbonReductionElement.textContent = `${networkTotalCarbonReduction.toFixed(2)} g`;
        networkStatsStatusElement.textContent = '網路統計數據載入成功。';
        networkStatsStatusElement.classList.remove('text-gray-600', 'text-red-600', 'text-blue-600');
        networkStatsStatusElement.classList.add('text-green-600');
        console.log("Network total carbon reduction calculated and displayed:", networkTotalCarbonReduction, "g"); // Debugging

    } catch (e) {
        console.error("Error fetching network total carbon reduction from Firebase: ", e); // Debugging
        networkTotalCarbonReduction = 0;
        networkTotalCarbonReductionElement.textContent = '載入失敗';
        networkStatsStatusElement.textContent = '無法載入網路統計數據。請檢查 Firestore 安全規則。'; // 更具體提示
        networkStatsStatusElement.classList.remove('text-gray-600', 'text-green-600', 'text-blue-600');
        networkStatsStatusElement.classList.add('text-red-600');
    }
}


// --- Page Navigation ---
function showHomepage() {
    console.log("Attempting to show homepage."); // Debugging
    homepageSection.style.display = 'block';
    missionPageSection.style.display = 'none';
    console.log("Homepage display set to block, Mission page to none."); // Debugging
    resetSelectedPoints();
    clearTripLine();
    clearSelectedActions();
    selectedActivity = null;
    const previousSelectedItem = activityListElement.querySelector(`.selected-activity-item`);
    if (previousSelectedItem) {
        previousSelectedItem.classList.remove('selected-activity-item');
    }
    if (db) {
        fetchNetworkTotalCarbonReduction();
    } else {
        console.warn("Firebase not initialized, cannot fetch network total on homepage.");
    }
}

function showMissionPage() {
    console.log("Attempting to show mission page."); // Debugging
    homepageSection.style.display = 'none';
    missionPageSection.style.display = 'block';
    console.log("Homepage display set to none, Mission page to block."); // Debugging

    if (map) {
        console.log("Map exists, triggering resize and recenter."); // Debugging
        google.maps.event.trigger(map, 'resize');
        map.setCenter({ lat: 23.810, lng: 120.850 });
        console.log("Map resized and recentered."); // Debugging
    } else {
        console.log("Map not initialized yet when showing mission page."); // Debugging
        const missionPageMapStatus = document.getElementById('map-status');
        if (missionPageMapStatus) {
            mapStatusElement.innerHTML = '地圖載入中... (等待 Google Maps API)<br><span class="text-xs">若地圖未正確載入，請利用景點列表中的 <i class="fas fa-car-side text-orange-500"></i> 圖示記錄您的里程。</span>';
            mapStatusElement.classList.remove('text-green-600', 'text-red-600');
            mapStatusElement.classList.add('text-gray-600');
        }
    }

    currentTransportDisplay.textContent = currentTransport && transportData ? transportData[currentTransport].name : '未選擇';
    updateSelectedPointsDisplay();
    console.log("Mission page displayed. Current transport:", currentTransport); // Debugging
}

// --- Google Map Initialization and POI Markers ---
function initMap() {
    console.log("initMap function called by Google Maps API."); // Debugging
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        console.error("Google Maps API not loaded. Please check your API key, network connection, and browser console for errors."); // Debugging
        if (window.google && window.google.maps && window.google.maps.api && window.google.maps.api.loaded === false) {
            console.error("Google Maps API failed to load. Check the network tab for details on the API request."); // Debugging
        }
        const missionPageMapStatus = document.getElementById('map-status');
        if (missionPageMapStatus) {
            mapStatusElement.innerHTML = '地圖載入失敗：API 金鑰認證失敗。請檢查您的金鑰和限制設定。<br><span class="text-xs">若地圖未正確載入，請利用景點列表中的 <i class="fas fa-car-side text-orange-500"></i> 圖示記錄您的里程。</span>';
            mapStatusElement.classList.remove('text-gray-600', 'text-green-600');
            mapStatusElement.classList.add('text-red-600');
        }
        tripCalculationStatusElement.textContent = '地圖服務未載入，無法計算路徑。';
        tripCalculationStatusElement.classList.remove('text-green-600', 'text-gray-700');
        tripCalculationStatusElement.classList.add('text-red-600');
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

    map = new google.maps.Map(mapElement, {
        center: defaultCoords,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false
    });
    console.log("Google Map object created."); // Debugging

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map: map, suppressMarkers: true });
    console.log("DirectionsService and DirectionsRenderer initialized."); // Debugging

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
    console.log("POI markers added to map."); // Debugging

    const missionPageMapStatus = document.getElementById('map-status');
    if (missionPageMapStatus) {
        mapStatusElement.innerHTML = '地圖載入成功！請從下方景點列表或地圖上選擇起點和終點。<br><span class="text-xs">若地圖未正確載入，請利用景點列表中的 <i class="fas fa-car-side text-orange-500"></i> 圖示記錄您的里程。</span>';
        mapStatusElement.classList.remove('text-gray-600', 'text-red-600');
        mapStatusElement.classList.add('text-green-600');
    }
    console.log("Google Map initialization complete."); // Debugging
}

// --- POI Selection and Mileage Calculation ---

function updateSelectedPointsDisplay() {
    const startName = selectedStartPoi ? selectedStartPoi.name : '未選擇';
    const endName = selectedEndPoi ? selectedEndPoi.name : '未選擇';
    selectedPointsDisplay.textContent = `起點: ${startName} | 終點: ${endName}`;
    updatePoiListItemHighlights();
}

function updatePoiListItemHighlights() {
    poiListElement.querySelectorAll('.poi-list-item-start, .poi-list-item-end').forEach(item => {
        item.classList.remove('poi-list-item-start', 'poi-list-item-end');
    });

    if (selectedStartPoi) {
        const startItem = poiListElement.querySelector(`li[data-poi-id="${selectedStartPoi.id}"]`);
        if (startItem) {
            startItem.classList.add('poi-list-item-start');
        }
    }

    if (selectedEndPoi) {
        const endItem = poiListElement.querySelector(`li[data-poi-id="${selectedEndPoi.id}"]`);
        if (endItem) {
            endItem.classList.add('poi-list-item-end');
        }
    }
}


function resetSelectedPoints() {
    selectedStartPoi = null;
    selectedEndPoi = null;
    updateSelectedPointsDisplay();
    clearTripLine();
}

function calculateTripMileage() {
    console.log("Calculate mileage button clicked."); // Debugging
    if (!directionsService) {
        tripCalculationStatusElement.textContent = '地圖服務尚未載入，請稍候再試。';
        tripCalculationStatusElement.classList.remove('text-green-600');
        tripCalculationStatusElement.classList.add('text-red-600');
        console.error("DirectionsService not initialized."); // Debugging
        return;
    }

    if (!selectedStartPoi || !selectedEndPoi) {
        tripCalculationStatusElement.textContent = '請先選擇起點和終點景點！';
        tripCalculationStatusElement.classList.remove('text-green-600');
        tripCalculationStatusElement.classList.add('text-red-600');
        console.warn("Start or end POI not selected."); // Debugging
        return;
    }

    if (selectedStartPoi.id === selectedEndPoi.id) {
        tripCalculationStatusElement.textContent = '起點和終點不能是同一個景點！';
        tripCalculationStatusElement.classList.remove('text-green-600');
        tripCalculationStatusElement.classList.add('text-red-600');
        console.warn("Start and end POI are the same."); // Debugging
        return;
    }

    if (currentTransport === null) {
        tripCalculationStatusElement.textContent = '請先在首頁選擇交通方式！';
        tripCalculationStatusElement.classList.remove('text-green-600');
        tripCalculationStatusElement.classList.add('text-red-600');
        console.warn("Transport mode not selected."); // Debugging
        return;
    }

    tripCalculationStatusElement.textContent = '正在計算路徑...';
    tripCalculationStatusElement.classList.remove('text-red-600', 'text-gray-700');
    tripCalculationStatusElement.classList.add('text-gray-700');
    clearTripLine();

    let travelMode = google.maps.TravelMode.DRIVING;
    const selectedTransportData = transportData[currentTransport];
    if (selectedTransportData && selectedTransportData.travelMode) {
        travelMode = selectedTransportData.travelMode;
    }
    console.log("Calculating trip with travel mode:", travelMode); // Debugging

    const request = {
        origin: selectedStartPoi.coords,
        destination: selectedEndPoi.coords,
        travelMode: travelMode
    };

    directionsService.route(request, (response, status) => {
        console.log("Directions service response status:", status); // Debugging
        if (status === 'OK') {
            directionsRenderer.setDirections(response);
            console.log("Route rendered on map."); // Debugging

            const route = response.routes[0];
            const leg = route.legs[0];
            const distanceInMeters = leg.distance.value;
            console.log("Calculated distance:", distanceInMeters, "meters"); // Debugging

            totalMileage += distanceInMeters;

            let tripCarbonReduction = 0;
            if (currentTransport && transportData[currentTransport].carbonReductionPer10km > 0) {
                const carbonReductionPerMeter = transportData[currentTransport].carbonReductionPer10km / 10000;
                tripCarbonReduction = distanceInMeters * carbonReductionPerMeter;
                totalCarbonReduction += tripCarbonReduction;
            }
            console.log("Calculated carbon reduction:", tripCarbonReduction, "grams"); // Debugging

            let scoreForThisTrip = 0;
            if (currentTransport && transportData[currentTransport].metersPerPoint !== Infinity) {
                const metersPerPoint = transportData[currentTransport].metersPerPoint;
                scoreForThisTrip = Math.floor(distanceInMeters / metersPerPoint);
                totalScore += scoreForThisTrip;
                console.log("Score earned this trip based on metersPerPoint:", scoreForThisTrip); // Debugging
            } else {
                console.log("No distance-based score for this transport type."); // Debugging
            }

            updateStatsDisplay();
            tripCalculationStatusElement.textContent = `本次旅程里程 (路徑): ${(distanceInMeters / 1000).toFixed(2)} km, 估計減碳: ${tripCarbonReduction.toFixed(2)} g. 獲得分數: ${scoreForThisTrip}`;
            tripCalculationStatusElement.classList.remove('text-red-600', 'text-gray-700');
            tripCalculationStatusElement.classList.add('text-green-600');

            const now = new Date();
            const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

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
            console.log("Logged trip calculation:", newLogEntry); // Debugging

        } else {
            tripCalculationStatusElement.textContent = `計算路徑失敗: ${status}`;
            tripCalculationStatusElement.classList.remove('text-green-600', 'text-gray-700');
            tripCalculationStatusElement.classList.add('text-red-600');
            console.error('Directions request failed due to ' + status); // Debugging
        }
    });
}

function clearTripLine() {
    if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
        console.log("Trip line cleared."); // Debugging
    }
}


// --- POI List and Modal ---
function populatePoiList() {
    poiListElement.innerHTML = '';
    pois.forEach(poi => {
        const listItem = document.createElement('li');
        listItem.classList.add('clickable-list-item', 'hover:text-green-700');

        const textSpan = document.createElement('span');
        let poiNameDisplay = `${poi.icon} ${poi.name}`;

        if (poi.isNew) {
            poiNameDisplay += ' <span class="new-indicator text-red-600 font-bold text-xs ml-1">NEW</span>';
        }

        if (poi.sroiInfo) {
            poiNameDisplay += ' (SROI)';
        }
        textSpan.innerHTML = poiNameDisplay;
        listItem.appendChild(textSpan);

        const iconGroup = document.createElement('div');
        iconGroup.classList.add('icon-group');

        if (poi.socialLink) {
            const socialLinkElement = document.createElement('a');
            socialLinkElement.href = poi.socialLink;
            socialLinkElement.target = "_blank";
            socialLinkElement.classList.add('social-icon');
            if (poi.socialLink.includes('facebook')) {
                socialLinkElement.innerHTML = '<i class="fab fa-facebook"></i>';
            } else if (poi.socialLink.includes('instagram')) {
                socialLinkElement.innerHTML = '<i class="fab fa-instagram"></i>';
            } else {
                socialLinkElement.innerHTML = '<i class="fas fa-link"></i>';
            }
            socialLinkElement.addEventListener('click', (event) => { event.stopPropagation(); }); // Prevent modal from opening
            iconGroup.appendChild(socialLinkElement);
        }

        const navigationLinkElement = document.createElement('a');
        navigationLinkElement.href = `https://www.google.com/maps/dir/?api=1&destination=${poi.coords.lat},${poi.coords.lng}`; // Corrected Google Maps navigation URL
        navigationLinkElement.target = "_blank";
        navigationLinkElement.classList.add('navigation-icon');
        navigationLinkElement.innerHTML = '<i class="fas fa-compass"></i>';
        navigationLinkElement.addEventListener('click', (event) => { event.stopPropagation(); }); // Prevent modal from opening
        iconGroup.appendChild(navigationLinkElement);

        const logTripIcon = document.createElement('i');
        logTripIcon.classList.add('fas', 'fa-car-side', 'log-trip-icon');
        logTripIcon.title = `記錄前往 ${poi.name} 的旅程`;
        logTripIcon.addEventListener('click', (event) => {
            event.stopPropagation();
            showLogTripModal(poi);
        });
        iconGroup.appendChild(logTripIcon);


        listItem.appendChild(iconGroup);

        listItem.poiData = poi;
        listItem.dataset.poiId = poi.id;
        listItem.addEventListener('click', () => showPoiModal(poi)); // Main click listener for the whole item
        poiListElement.appendChild(listItem);
    });
    updatePoiListItemHighlights();
    console.log("POI list populated and click handlers set."); // Debugging
}

function showPoiModal(poi) {
    console.log("Showing POI modal for:", poi.name); // Debugging
    poiModal.currentPoi = poi;

    poiModalTitle.textContent = poi.name;
    let modalDescriptionHTML = poi.description.replace(/\n/g, '<br>');

    if (poi.id === 'poi17') {
        modalDescriptionHTML += '<br><br>';
        modalDescriptionHTML += '<p class="font-semibold text-green-800">出攤日期預告:</p>';
        if (poi.marketScheduleLink) {
            modalDescriptionHTML += `<p><a href="${poi.marketScheduleLink}" target="_blank" class="text-blue-600 hover:underline">點此查看最新出攤日期</a></p>`;
        } else {
            modalDescriptionHTML += '<p class="text-gray-600">出攤日期連結未提供。</p>';
        }
        modalDescriptionHTML += '<p class="mt-3 text-sm text-gray-700">本年度預計於星光市集舉辦「食農教育」活動，場次及內容請洽水里鄉商圈創生共好協會。</p>';
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
        if (poi.socialLink.includes('facebook')) {
            socialLinkElement.innerHTML = '<i class="fab fa-facebook mr-1"></i>前往 Facebook 粉絲專頁';
        } else if (poi.socialLink.includes('instagram')) {
            socialLinkElement.innerHTML = '<i class="fab fa-instagram mr-1"></i>前往 Instagram 頁面';
        } else if (poi.socialLink.includes('waca.tw') || poi.socialLink.includes('tg-ecohotel.com') || poi.socialLink.includes('shli.gov.tw') || poi.socialLink.includes('taiwantrip.com.tw')) {
            socialLinkElement.innerHTML = '<i class="fas fa-link mr-1"></i>前往官方網站';
        } else {
            socialLinkElement.innerHTML = '<i class="fas fa-link mr-1"></i>前往相關網站';
        }
        poiModalSocialDiv.appendChild(socialLinkElement);
    }

    if (poi.id === 'poi14' || poi.id === 'poi16') {
        poiReviewSection.classList.remove('hidden');
        consumptionAmountInput.value = '';
        reviewCodeInput.value = '';
        poiReviewStatusElement.textContent = '';
        poiReviewStatusElement.classList.remove('text-green-600', 'text-red-600');
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
            showSroiInfoButton.sroiInfo = null;
            showSroiInfoButton.poiName = null;
        }
    }

    if (poi.isConsumptionPOI) {
        poi17ConsumptionSection.classList.remove('hidden');
        consumptionCodeInput.value = '';
        consumptionStatusElement.textContent = '';
        consumptionStatusElement.classList.remove('text-green-600', 'text-red-600');
        selectedConsumptionType = null;
        selectedConsumptionLabel = null;
        consumptionButtonsDiv.querySelectorAll('.consumption-button').forEach(button => {
            button.classList.remove('selected');
        });
    } else {
        poi17ConsumptionSection.classList.add('hidden');
    }


    poiModal.classList.remove('hidden');
    console.log("POI modal shown for:", poi.name); // Debugging
}

function hidePoiModal() {
    console.log("Hiding POI modal."); // Debugging
    poiModal.classList.add('hidden');
    poiModal.currentPoi = null;
}

// --- POI Review Submission ---
function submitPoiReview() {
    console.log("Submit POI review button clicked."); // Debugging
    const currentPoi = poiModal.currentPoi;
    if (!currentPoi) {
        console.error("No POI selected for review submission."); // Debugging
        return;
    }

    const consumptionAmount = parseFloat(consumptionAmountInput.value);
    const reviewCode = reviewCodeInput.value.trim();

    if (isNaN(consumptionAmount) || consumptionAmount <= 0) {
        poiReviewStatusElement.textContent = '請輸入有效的消費金額。';
        poiReviewStatusElement.classList.remove('text-green-600');
        poiReviewStatusElement.classList.add('text-red-600');
        console.warn("Invalid consumption amount:", consumptionAmount); // Debugging
        return;
    }

    const codeRegex = /^[0-9]{3}$/;
    if (!codeRegex.test(reviewCode)) {
        poiReviewStatusElement.textContent = '請輸入有效的3碼數字審核碼。';
        poiReviewStatusElement.classList.remove('text-green-600');
        poiReviewStatusElement.classList.add('text-red-600');
        console.warn("Invalid review code format:", reviewCode); // Debugging
        return;
    }

    const pointsEarned = 10;
    totalScore += pointsEarned;
    updateStatsDisplay();
    saveData();

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

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

    console.log(`Logged review for ${currentPoi.name}: Consumption ${consumptionAmount}, Code ${reviewCode}. Points: ${pointsEarned}`); // Debugging

    poiReviewStatusElement.textContent = `審核成功！獲得 +${pointsEarned} 積分！`;
    poiReviewStatusElement.classList.remove('text-red-600');
    poiReviewStatusElement.classList.add('text-green-600');

    consumptionAmountInput.value = '';
    reviewCodeInput.value = '';

    setTimeout(() => {
        poiReviewStatusElement.textContent = '';
        poiReviewStatusElement.classList.remove('text-green-600');
    }, 5000);
}


// --- poi17 Sustainable Consumption Logic ---

function handleConsumptionSelect() {
    console.log("Consumption button clicked. Type:", this.dataset.consumptionType, "Label:", this.dataset.label); // Debugging
    consumptionButtonsDiv.querySelectorAll('.consumption-button').forEach(button => {
        button.classList.remove('selected');
    });

    this.classList.add('selected');
    selectedConsumptionType = this.dataset.consumptionType;
    selectedConsumptionLabel = this.dataset.label; // Use data-label for pure category name
    consumptionStatusElement.textContent = '';
    consumptionStatusElement.classList.remove('text-green-600', 'text-red-600');
    consumptionCodeInput.value = '';
    console.log("Selected consumption: type=", selectedConsumptionType, "label=", selectedConsumptionLabel); // Debugging
}

function submitConsumption() {
    console.log("Submit consumption button clicked."); // Debugging
    consumptionStatusElement.textContent = '';
    consumptionStatusElement.classList.remove('text-red-600', 'text-green-600');

    if (selectedConsumptionType === null) {
        consumptionStatusElement.textContent = '請先選擇消費類別。';
        consumptionStatusElement.classList.add('text-red-600');
        console.warn("No consumption type selected."); // Debugging
        return;
    }

    const inputCode = consumptionCodeInput.value.trim();

    const codeRegex = /^[0-9]{5}$/;
    if (!codeRegex.test(inputCode)) {
        consumptionStatusElement.textContent = '請輸入有效的5碼數字驗證碼。';
        consumptionStatusElement.classList.add('text-red-600');
        console.warn("Invalid consumption code format:", inputCode); // Debugging
        return;
    }

    const poi17Data = pois.find(p => p.id === 'poi17');
    const consumptionDetails = poi17Data.consumptionData[selectedConsumptionType];

    if (!consumptionDetails) {
        console.error("Consumption details not found for type:", selectedConsumptionType); // Debugging
        consumptionStatusElement.textContent = '發生錯誤：找不到消費類別詳情。';
        consumptionStatusElement.classList.add('text-red-600');
        return;
    }

    const mileageToAddInMeters = consumptionDetails.mileage;
    const carbonReductionToAdd = consumptionDetails.carbonReduction;
    const pointsToAdd = Math.floor(mileageToAddInMeters / 1000); // 1 point per km

    console.log(`Adding consumption: Mileage=${mileageToAddInMeters}m, Carbon=${carbonReductionToAdd}g, Points=${pointsToAdd}`); // Debugging

    totalMileage += mileageToAddInMeters;
    totalCarbonReduction += carbonReductionToAdd;
    totalScore += pointsToAdd;

    updateStatsDisplay();
    saveData();

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newLogEntry = {
        type: 'consumption',
        poiName: poiModal.currentPoi.name,
        consumptionType: selectedConsumptionLabel, // Use pure category name
        mileageAdded: mileageToAddInMeters,
        carbonReduction: carbonReductionToAdd,
        points: pointsToAdd,
        verificationCode: inputCode,
        timestamp: timestamp
    };

    loggedActions.push(newLogEntry);
    saveData();
    renderLoggedActions();

    console.log("Logged Consumption:", newLogEntry); // Debugging

    consumptionStatusElement.textContent = `消費記錄成功！新增 里程: ${(mileageToAddInMeters / 1000).toFixed(2)} km, 估計減碳: ${carbonReductionToAdd.toFixed(2)} g, 獲得積分: ${pointsToAdd}`;
    consumptionStatusElement.classList.remove('text-red-600');
    consumptionStatusElement.classList.add('text-green-600');

    consumptionCodeInput.value = '';
    selectedConsumptionType = null;
    selectedConsumptionLabel = null;
    consumptionButtonsDiv.querySelectorAll('.consumption-button').forEach(button => {
        button.classList.remove('selected');
    });

    setTimeout(() => {
        consumptionStatusElement.textContent = '';
        consumptionStatusElement.classList.remove('text-green-600');
    }, 5000);
}


// --- Sustainable Activities and Verification Modal ---
 function populateActivityList() {
     activityListElement.innerHTML = '';
     activities.forEach(activity => {
         const listItem = document.createElement('li');
         listItem.classList.add('clickable-list-item');
         listItem.textContent = `${activity.name} (${activity.points} 分)`;
         listItem.activityData = activity;
         listItem.addEventListener('click', handleActivityItemClick);
         activityListElement.appendChild(listItem);
     });
     console.log("Activity list populated."); // Debugging
 }

 function handleActivityItemClick() {
     console.log("Activity item clicked:", this.activityData.name); // Debugging
     if (selectedActivity) {
         const previousSelectedItem = activityListElement.querySelector(`.selected-activity-item`);
         if (previousSelectedItem) {
             previousSelectedItem.classList.remove('selected-activity-item');
         }
     }

     selectedActivity = this.activityData;
     this.classList.add('selected-activity-item');

     console.log("Selected Activity:", selectedActivity.name); // Debugging
 }


 function showActivityModal() {
     console.log("Participate activity button clicked. Showing activity modal."); // Debugging
     if (!selectedActivity) {
         alert('請先從列表中選擇一個永續山村任務活動。');
         console.warn("No activity selected when trying to show modal."); // Debugging
         return;
     }
     selectedActivityNameElement.textContent = selectedActivity.name;
     verificationCodeInput.value = '';
     activityContentInput.value = '';
     activityLogStatusElement.textContent = '';
     activityLogStatusElement.classList.remove('text-green-600', 'text-red-600');

     if (selectedActivity.image) {
         activityModalImage.src = selectedActivity.image;
         activityModalImage.classList.remove('hidden');
          activityModalImage.alt = `${selectedActivity.name} 相關圖片`;
     } else {
         activityModalImage.classList.add('hidden');
         activityModalImage.src = '';
          activityModalImage.alt = '';
     }


     activityModal.classList.remove('hidden');
 }

 function hideActivityModal() {
     console.log("Hiding activity modal."); // Debugging
     activityModal.classList.add('hidden');
 }

 function logActivity() {
     console.log("Submit activity log button clicked."); // Debugging
     if (!selectedActivity) {
         activityLogStatusElement.textContent = '請先選擇一個活動。';
         activityLogStatusElement.classList.remove('text-green-600');
         activityLogStatusElement.classList.add('text-red-600');
         console.warn("No activity selected when logging."); // Debugging
         return;
     }

     const inputCode = verificationCodeInput.value.trim();
     const activityContent = activityContentInput.value.trim();

     if (!inputCode) {
         activityLogStatusElement.textContent = '請輸入活動驗證碼。';
         activityLogStatusElement.classList.remove('text-green-600');
         activityLogStatusElement.classList.add('text-red-600');
         console.warn("Verification code is empty."); // Debugging
         return;
     }

     const codeRegex = /^[a-zA-Z0-9]{6}$/;

     if (codeRegex.test(inputCode)) {
         const pointsEarned = selectedActivity.points;
         totalScore += pointsEarned;
         updateStatsDisplay();
         saveData();

         const now = new Date();
         const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}:${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

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

         console.log("Logged Activity:", selectedActivity.name, "Content:", activityContent, "Code:", inputCode, "Points:", pointsEarned, "at", timestamp); // Debugging
         activityLogStatusElement.textContent = `活動已記錄！獲得 +${pointsEarned} 積分！`;
         activityLogStatusElement.classList.remove('text-red-600');
         activityLogStatusElement.classList.add('text-green-600');

         verificationCodeInput.value = '';
         activityContentInput.value = '';
         selectedActivity = null;
         const previousSelectedItem = activityListElement.querySelector(`.selected-activity-item`);
         if (previousSelectedItem) {
             previousSelectedItem.classList.remove('selected-activity-item');
         }

         activityModalImage.classList.add('hidden');
         activityModalImage.src = '';


         setTimeout(() => {
             activityLogStatusElement.textContent = '';
             activityLogStatusElement.classList.remove('text-green-600');
         }, 5000);

     } else {
         activityLogStatusElement.textContent = '無效的驗證碼格式。請輸入任 6 個英文字母或數字。';
         activityLogStatusElement.classList.remove('text-green-600');
         activityLogStatusElement.classList.add('text-red-600');
         console.warn("Invalid verification code format."); // Debugging
     }
 }


// --- Sustainable Actions Logging ---

function populateSelectableActionsList() {
    selectableActionsListElement.innerHTML = '';
    sustainableActions.forEach(action => {
        const actionItem = document.createElement('div');
        actionItem.classList.add('selectable-action-item');
        actionItem.textContent = `${action.name} (${action.points} 分)`;
        actionItem.actionData = action;
        actionItem.addEventListener('click', toggleSustainableActionSelection);
        selectableActionsListElement.appendChild(actionItem);
    });
    console.log("Selectable actions list populated."); // Debugging
}

function toggleSustainableActionSelection() {
    const actionItem = this;
    const actionName = actionItem.actionData.name;

    const index = selectedSustainableActions.indexOf(actionName);

    if (index === -1) {
        selectedSustainableActions.push(actionName);
        actionItem.classList.add('selected');
    } else {
        selectedSustainableActions.splice(index, 1);
        actionItem.classList.remove('selected');
    }
    console.log("Selected Actions:", selectedSustainableActions); // Debugging
}

function clearSelectedActions() {
    selectedSustainableActions = [];
    selectableActionsListElement.querySelectorAll('.selectable-action-item').forEach(item => {
        item.classList.remove('selected');
    });
    console.log("Selected actions cleared."); // Debugging
}


function logSustainableAction() {
    console.log("Log action button clicked."); // Debugging
    const actionText = sustainableActionLogTextarea.value.trim();

    if (selectedSustainableActions.length === 0) {
        actionLogStatusElement.textContent = '請至少選擇一個永續行動項目。';
        actionLogStatusElement.classList.remove('text-green-600');
        actionLogStatusElement.classList.add('text-red-600');
        console.warn("No sustainable action selected."); // Debugging
        return;
    }

    if (!actionText) {
        actionLogStatusElement.textContent = '請輸入您具體的行動內容。';
        actionLogStatusElement.classList.remove('text-green-600');
        actionLogStatusElement.classList.add('text-red-600');
        console.warn("Sustainable action content is empty."); // Debugging
        return;
    }


    let pointsEarnedFromActions = 0;
    selectedSustainableActions.forEach(selectedName => {
        const action = sustainableActions.find(act => act.name === selectedName);
        if (action) {
            pointsEarnedFromActions += action.points;
        }
    });

    totalScore += pointsEarnFromActions;
    updateStatsDisplay();
    saveData();


    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

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

    console.log("Logged Action:", actionText, "Selected:", selectedSustainableActions, "Points:", pointsEarnedFromActions, "at", timestamp); // Debugging
    actionLogStatusElement.textContent = `行動已記錄！獲得 +${pointsEarnedFromActions} 積分！`;
    actionLogStatusElement.classList.remove('text-red-600');
    actionLogStatusElement.classList.add('text-green-600');

    clearSelectedActions();
    sustainableActionLogTextarea.value = '';

    setTimeout(() => {
        actionLogStatusElement.textContent = '';
        actionLogStatusElement.classList.remove('text-green-600');
    }, 5000);

}

function renderLoggedActions() {
    loggedActionsListElement.innerHTML = '';
    console.log("Rendering logged actions. Total logs:", loggedActions.length); // Debugging

    if (loggedActions.length === 0) {
        loggedActionsListElement.innerHTML = '<p class="text-gray-500 text-center">尚無行動紀錄</p>';
        return;
    }

    const sortedLogs = [...loggedActions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));


    sortedLogs.forEach(log => {
        const logItem = document.createElement('div');
        logItem.classList.add('action-log-item');

        let logContentHTML = '';
        let pointsText = '';

        if (log.type === 'action') {
            let actionsText = '';
            if (log.actions && log.actions.length > 0) {
                actionsText = `<p class="text-sm text-gray-700 mb-1">選擇的行動: ${log.actions.join(', ')}</p>`;
            }
            logContentHTML = `
                <p class="log-type">永續行動記錄</p>
                ${actionsText}
                <p>${log.text}</p>
            `;
        } else if (log.type === 'activity') {
            logContentHTML = `
                <p class="log-type">永續山村任務活動記錄</p>
                <p class="text-sm text-gray-700 mb-1">活動名稱: ${log.activityName}</p>`;
            if (log.content) {
                logContentHTML += `<p>活動內容/課程名稱: ${log.content}</p>`;
            }

        } else if (log.type === 'trip_to_poi') {
            logContentHTML = `
                 <p class="log-type">前往景點旅程記錄 (手動)</p>
                 <p class="text-sm text-gray-700 mb-1">景點: ${log.poiName}</p>
                 <p class="text-sm text-gray-700 mb-1">交通方式: ${log.transportName} (${log.transportIcon})</p>
                 <p class="text-sm text-gray-700 mb-1">里程: ${(log.mileageInMeters / 1000).toFixed(2)} km</p>`;
            if (log.carbonReduction > 0) {
                logContentHTML += `<p class="text-sm text-gray-700 mb-1">估計減碳: ${log.carbonReduction.toFixed(2)} g</p>`;
            }

        } else if (log.type === 'poi_review') {
            logContentHTML = `
                  <p class="log-type">永續消費審核記錄</p>
                  <p class="text-sm text-gray-700 mb-1">景點: ${log.poiName}</p>
                  <p class="text-sm text-gray-700 mb-1">消費金額: ${log.consumption}</p>
                  <p class="text-sm text-gray-700 mb-1">審核碼: ${log.reviewCode}</p>
              `;
        } else if (log.type === 'trip_calculation') {
            logContentHTML = `
                  <p class="log-type">旅程計算記錄 (地圖)</p>
                  <p class="text-sm text-gray-700 mb-1">起點: ${log.startPoiName}</p>
                  <p class="text-sm text-gray-700 mb-1">終點: ${log.endPoiName}</p> <p class="text-sm text-gray-700 mb-1">交通方式: ${log.transportName} (${log.transportIcon})</p>
                  <p class="text-sm text-gray-700 mb-1">里程: ${(log.mileageInMeters / 1000).toFixed(2)} km</p>
                       ${log.carbonReduction > 0 ? `<p class="text-sm text-gray-700 mb-1">估計減碳: ${log.carbonReduction.toFixed(2)} g</p>` : ''}
                  `;
        } else if (log.type === 'consumption') {
            logContentHTML = `
                     <p class="log-type">永續消費記錄 (星光市集)</p>
                     <p class="text-sm text-gray-700 mb-1">景點: ${log.poiName}</p>
                     <p class="text-sm text-gray-700 mb-1">消費類別: ${log.consumptionType}</p>
                     <p class="text-sm text-gray-700 mb-1">驗證碼: ${log.verificationCode}</p>
                     <p class="text-sm text-gray-700 mb-1">新增里程: ${(log.mileageAdded / 1000).toFixed(2)} km</p>
                     <p class="text-sm text-gray-700 mb-1">估計減碳: ${log.carbonReduction.toFixed(2)} g</p>
                 `;
        }


        if (log.points !== undefined && log.points > 0) {
            pointsText = `<p class="log-points text-sm font-bold text-green-700">獲得積分: ${log.points}</p>`;
        } else if (log.points === 0) {
            pointsText = `<p class="log-points text-sm font-bold text-gray-600">獲得積分: 0</p>`;
        } else {
            pointsText = '';
        }


        logItem.innerHTML = `
            ${logContentHTML}
            ${pointsText}
            <p class="timestamp">${log.timestamp}</p>
        `;
        loggedActionsListElement.appendChild(logItem);
    });
    console.log("Logged actions rendered."); // Debugging
}

// --- Log Trip Modal (Manual Logging) ---

function showLogTripModal(poi) {
    console.log("Showing log trip modal for:", poi.name); // Debugging
    currentLogTripPoi = poi;

    logTripPoiNameElement.textContent = poi.name;
    logTripMileageInput.value = '';
    logTripStatusElement.textContent = '';
    logTripTransportOptionsDiv.innerHTML = '';

    for (const key in transportData) {
        if (key !== 'thsr_haoxing' && key !== 'taxi') { // 'taxi' transport is not a real type for manual logging
            const transportOption = transportData[key];
            const button = document.createElement('button');
            button.classList.add('log-trip-transport-button', 'px-4', 'py-2', 'bg-gray-200', 'rounded-md', 'hover:bg-gray-300', 'transition-colors');
            button.textContent = `${transportOption.icon} ${transportOption.name}`;
            button.dataset.transport = key;
            button.addEventListener('click', handleLogTripTransportSelect);
            logTripTransportOptionsDiv.appendChild(button);
        }
    }


    logTripTransportStatusElement.classList.add('hidden');
    logTripMileageStatusElement.classList.add('hidden');

    logTripModal.classList.remove('hidden');
}

function hideLogTripModal() {
    console.log("Hiding log trip modal."); // Debugging
    logTripModal.classList.add('hidden');
    currentLogTripPoi = null;
    selectedLogTripTransport = null;
    logTripTransportOptionsDiv.querySelectorAll('.log-trip-transport-button').forEach(button => {
        button.classList.remove('selected');
    });
}

let selectedLogTripTransport = null;

function handleLogTripTransportSelect() {
    console.log("Log trip transport button clicked:", this.dataset.transport); // Debugging
    logTripTransportOptionsDiv.querySelectorAll('.log-trip-transport-button').forEach(button => {
        button.classList.remove('selected');
    });

    this.classList.add('selected');
    selectedLogTripTransport = this.dataset.transport;
    logTripTransportStatusElement.classList.add('hidden');
    console.log("Selected manual log trip transport:", selectedLogTripTransport); // Debugging
}


function submitLogTrip() {
    console.log("Submit log trip button clicked."); // Debugging

    logTripStatusElement.textContent = '';
    logTripStatusElement.classList.remove('text-red-600', 'text-green-600', 'text-gray-700');
    logTripTransportStatusElement.classList.add('hidden');
    logTripMileageStatusElement.classList.add('hidden');


    if (!currentLogTripPoi) {
        logTripStatusElement.textContent = '發生錯誤：未選擇景點。';
        logTripStatusElement.classList.add('text-red-600');
        console.error("No POI selected for manual trip logging."); // Debugging
        return;
    }

    if (!selectedLogTripTransport) {
        logTripTransportStatusElement.textContent = '請選擇交通方式。';
        logTripTransportStatusElement.classList.remove('hidden');
        logTripTransportStatusElement.classList.add('text-red-600');
        console.warn("No transport selected for manual log trip."); // Debugging
        return;
    }

    const mileageKm = parseFloat(logTripMileageInput.value);

    if (isNaN(mileageKm) || mileageKm < 0) {
        logTripMileageStatusElement.textContent = '請輸入有效的里程數 (大於等於 0)。';
        logTripMileageStatusElement.classList.remove('hidden');
        logTripMileageStatusElement.classList.add('text-red-600');
        console.warn("Invalid mileage input:", mileageKm); // Debugging
        return;
    }

    const mileageInMeters = mileageKm * 1000; // Convert km to meters

    let tripCarbonReduction = 0;
    const transportInfo = transportData[selectedLogTripTransport];
    if (transportInfo && transportInfo.carbonReductionPer10km > 0) {
        const carbonReductionPerMeter = transportInfo.carbonReductionPer10km / 10000;
        tripCarbonReduction = mileageInMeters * carbonReductionPerMeter;
    }

    totalMileage += mileageInMeters;
    totalCarbonReduction += tripCarbonReduction;
    let scoreForThisTrip = 0;
    if (transportInfo && transportInfo.metersPerPoint !== Infinity) {
        const metersPerPoint = transportInfo.metersPerPoint;
        scoreForThisTrip = Math.floor(mileageInMeters / metersPerPoint);
        totalScore += scoreForThisTrip;
    }

    updateStatsDisplay();
    saveData();

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

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

    console.log("Logged Manual Trip:", newLogEntry); // Debugging

    logTripStatusElement.textContent = `已記錄前往 ${currentLogTripPoi.name} 的旅程！里程: ${mileageKm.toFixed(2)} km, 估計減碳: ${tripCarbonReduction.toFixed(2)} g. 獲得分數: ${scoreForThisTrip}`;
    logTripStatusElement.classList.remove('text-red-600', 'text-gray-700');
    logTripStatusElement.classList.add('text-green-600');

    logTripMileageInput.value = '';
    selectedLogTripTransport = null;
    logTripTransportOptionsDiv.querySelectorAll('.log-trip-transport-button').forEach(button => {
        button.classList.remove('selected');
    });

    setTimeout(() => {
        hideLogTripModal();
    }, 1500);


    currentLogTripPoi = null;

}


// --- THSR Info Modal ---
function showThsrInfoModal() {
    console.log("Showing THSR info modal."); // Debugging
    thsrInfoModal.classList.remove('hidden');
}

function hideThsrInfoModal() {
    console.log("Hiding THSR info modal."); // Debugging
    thsrInfoModal.classList.add('hidden');
}

// --- Taxi Info Modal ---
function showTaxiInfoModal() {
    console.log("Showing taxi info modal."); // Debugging
    const taxiInfoContent = taxiInfoModal.querySelector('.modal-content div');
    taxiInfoContent.innerHTML = `
         <p class="mb-2"><strong>車號:</strong> TBD-5339</p>
         <p class="mb-2"><strong>駕駛人:</strong> 詹聖慈</p>
         <p class="mb-2"><strong>營業時間:</strong> 9:00~20:00</p>
         <p class="mb-2"><strong>旅遊範圍:</strong> 水里鄉、信義鄉、日月潭</p>
         <p class="mb-2"><strong>最大乘客數:</strong> 4</p>
         <p class="mb-2"><strong>駕駛人永續旅遊導覽培訓時數:</strong> 12/時</p>
         <p class="mb-2"><strong>預約叫車電話:</strong> 0980-015-339</p>
         <p class="mb-2"><strong>LINE ID:</strong> 未提供</p>
     `;
    taxiInfoModal.classList.remove('hidden');
}

function hideTaxiInfoModal() {
    console.log("Hiding taxi info modal."); // Debugging
    taxiInfoModal.classList.add('hidden');
}

// --- SROI Info Modal ---
function showSroiInfoModal(sroiInfo, poiName) {
    console.log("Showing SROI info modal for:", poiName); // Debugging
    sroiModalPoiNameElement.textContent = poiName;

    sroiModalContentBody.innerHTML = '';

    if (sroiInfo.reportLink) {
        const reportLinkElement = document.createElement('a');
        reportLinkElement.href = sroiInfo.reportLink;
        reportLinkElement.target = "_blank";
        reportLinkElement.classList.add('block', 'text-blue-600', 'hover:underline', 'font-semibold');
        reportLinkElement.innerHTML = '<i class="fas fa-file-alt mr-1"></i>農場影響力報告書';
        sroiModalContentBody.appendChild(reportLinkElement);
    } else {
        const noReportElement = document.createElement('p');
        noReportElement.classList.add('text-gray-600');
        noReportElement.innerHTML = '<i class="fas fa-info-circle mr-1"></i>農場影響力報告書：未提供';
        sroiModalContentBody.appendChild(noReportElement);
    }

    if (sroiInfo.formLink) {
        const formLinkElement = document.createElement('a');
        formLinkElement.href = sroiInfo.formLink;
        formLinkElement.target = "_blank";
        formLinkElement.classList.add('block', 'text-blue-600', 'hover:underline', 'font-semibold');
        formLinkElement.innerHTML = '<i class="fas fa-clipboard-list mr-1"></i>採購表單';
        sroiModalContentBody.appendChild(formLinkElement);
    } else {
        const noFormElement = document.createElement('p');
        noFormElement.classList.add('text-gray-600');
        noFormElement.innerHTML = '<i class="fas fa-info-circle mr-1"></i>採購表單：未提供';
        sroiModalContentBody.appendChild(noFormElement);
    }

    if (sroiInfo.lineId) {
        const lineIdElement = document.createElement('p');
        lineIdElement.classList.add('text-gray-700', 'font-semibold');
        lineIdElement.innerHTML = `<i class="fab fa-line mr-1"></i>LINE ID: ${sroiInfo.lineId}`;
        sroiModalContentBody.appendChild(lineIdElement);
    } else {
        const noLineIdElement = document.createElement('p');
        noLineIdElement.classList.add('text-gray-600');
        noLineIdElement.innerHTML = '<i class="fas fa-info-circle mr-1"></i>LINE ID：未提供';
        sroiModalContentBody.appendChild(noLineIdElement);
    }


    sroiInfoModal.classList.remove('hidden');
}

function hideSroiInfoModal() {
    console.log("Hiding SROI info modal."); // Debugging
    sroiInfoModal.classList.add('hidden');
    sroiModalPoiNameElement.textContent = '';
    sroiModalContentBody.innerHTML = '';
}


// --- Download Data ---
function downloadTourismData() {
    console.log("Download data button clicked."); // Debugging

    let htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>水里永續旅遊數據報告</title>
            <style>
                body { font-family: 'Noto Sans TC', sans-serif; line-height: 1.6; padding: 20px; }
                h1, h2 { color: #1b5e20; }
                .stats { margin-bottom: 20px; padding: 15px; border: 1px solid #a5d6a7; border-radius: 8px; background-color: #e8f5e9; }
                .stats p { margin: 5px 0; }
                .log-entry { border-bottom: 1px solid #eee; padding: 10px 0; }
                .log-entry:last-child { border-bottom: none; }
                .log-entry p { margin: 3px 0; }
                .log-type { font-weight: bold; color: #388e3c; }
                .timestamp { font-size: 0.8em; color: #757575; text-align: right; }
                .log-points { font-weight: bold; color: #1b5e20; }
            </style>
             <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;700&display=swap" rel="stylesheet">
        </head>
        <body>
            <h1>水里永續旅遊數據報告</h1>

            <div class="stats">
                <h2>您的旅遊統計</h2>
                <p><strong>永續旅者姓名:</strong> ${playerNameInput.value.trim()}</p>
                <p><strong>永續旅者隨機碼:</strong> ${playerCode}</p>
                <p><strong>累計里程:</strong> ${(totalMileage / 1000).toFixed(2)} km</p>
                <p><strong>減碳總量:</strong> ${totalCarbonReduction.toFixed(2)} g</p>
                <p><strong>永續分數:</strong> ${totalScore}</p>
            </div>

            <h2>我的行動紀錄</h2>
            <div>
    `;

    if (loggedActions.length === 0) {
        htmlContent += '<p>尚無行動紀錄</p>';
    } else {
        const sortedLogs = [...loggedActions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        sortedLogs.forEach(log => {
            let logEntryHtml = '<div class="log-entry">';
            let logContent = '';
            let pointsContent = '';

            if (log.type === 'action') {
                logContent = `
                    <p class="log-type">永續行動記錄</p>
                    <p class="text-sm text-gray-700 mb-1">選擇的行動: ${log.actions ? log.actions.join(', ') : '無'}</p>
                    <p>${log.text}</p>
                `;
            } else if (log.type === 'activity') {
                logContent = `
                    <p class="log-type">永續山村任務活動記錄</p>
                    <p class="text-sm text-gray-700 mb-1">活動名稱: ${log.activityName}</p>
                    ${log.content ? `<p>活動內容/課程名稱: ${log.content}</p>` : ''}
                `;
            } else if (log.type === 'trip_to_poi') {
                logContent = `
                     <p class="log-type">前往景點旅程記錄 (手動)</p>
                     <p class="text-sm text-gray-700 mb-1">景點: ${log.poiName}</p>
                     <p class="text-sm text-gray-700 mb-1">交通方式: ${log.transportName} (${log.transportIcon})</p>
                     <p class="text-sm text-gray-700 mb-1">里程: ${(log.mileageInMeters / 1000).toFixed(2)} km</p>
                     ${log.carbonReduction > 0 ? `<p class="text-sm text-gray-700 mb-1">估計減碳: ${log.carbonReduction.toFixed(2)} g</p>` : ''}
                 `;
            } else if (log.type === 'poi_review') {
                logContent = `
                      <p class="log-type">永續消費審核記錄</p>
                      <p class="text-sm text-gray-700 mb-1">景點: ${log.poiName}</p>
                      <p class="text-sm text-gray-700 mb-1">消費金額: ${log.consumption}</p>
                      <p class="text-sm text-gray-700 mb-1">審核碼: ${log.reviewCode}</p>
                  `;
            } else if (log.type === 'trip_calculation') {
                logContent = `
                      <p class="log-type">旅程計算記錄 (地圖)</p>
                      <p class="text-sm text-gray-700 mb-1">起點: ${log.startPoiName}</p>
                      <p class="text-sm text-gray-700 mb-1">終點: ${log.endPoiName}</p> <p class="text-sm text-gray-700 mb-1">交通方式: ${log.transportName} (${log.transportIcon})</p>
                      <p class="text-sm text-gray-700 mb-1">里程: ${(log.mileageInMeters / 1000).toFixed(2)} km</p>
                       ${log.carbonReduction > 0 ? `<p class="text-sm text-gray-700 mb-1">估計減碳: ${log.carbonReduction.toFixed(2)} g</p>` : ''}
                  `;
            } else if (log.type === 'consumption') {
                logContent = `
                     <p class="log-type">永續消費記錄 (星光市集)</p>
                     <p class="text-sm text-gray-700 mb-1">景點: ${log.poiName}</p>
                     <p class="text-sm text-gray-700 mb-1">消費類別: ${log.consumptionType}</p>
                     <p class="text-sm text-gray-700 mb-1">驗證碼: ${log.verificationCode}</p>
                     <p class="text-sm text-gray-700 mb-1">新增里程: ${(log.mileageAdded / 1000).toFixed(2)} km</p>
                     <p class="text-sm text-gray-700 mb-1">估計減碳: ${log.carbonReduction.toFixed(2)} g</p>
                 `;
            }


            if (log.points !== undefined && log.points > 0) {
                pointsContent = `<p class="log-points text-sm font-bold text-green-700">獲得積分: ${log.points}</p>`;
            } else if (log.points === 0) {
                pointsContent = `<p class="log-points text-sm font-bold text-gray-600">獲得積分: 0</p>`;
            } else {
                pointsContent = '';
            }

            logEntryHtml += logContent;
            logEntryHtml += pointsContent;
            logEntryHtml += `<p class="timestamp">${log.timestamp}</p>`;
            logEntryHtml += '</div>';
            htmlContent += logEntryHtml;
        });
    }

    htmlContent += `
            </div>
        </body>
        </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    console.log("Blob created with UTF-8 charset and HTML type."); // Debugging

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '水里永續旅遊數據.html';
    console.log("Download link created:", a.download); // Debugging

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    console.log("Download data removed and object URL revoked."); // Debugging
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired. Initializing application."); // Debugging
    loadData();
    populatePoiList();
    populateActivityList();
    populateSelectableActionsList();

    playerNameInput.addEventListener('input', saveData);

    document.querySelectorAll('.transport-option').forEach(button => {
        button.addEventListener('click', () => {
            const transportType = button.dataset.transport;
            console.log("Transport option button clicked:", transportType); // Debugging

            if (transportType === 'thsr_haoxing') {
                showThsrInfoModal();
                return; // Stop here for THSR
            }

            // For other transport options:
            document.querySelectorAll('.transport-option').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');

            currentTransport = transportType;
            console.log('Current transport selected:', currentTransport); // Debugging

            thsrInfoDiv.classList.add('hidden'); // Ensure THSR info div is hidden if not THSR

            showMissionPage(); // Navigate to mission page
        });
    });

    calculateMileageButton.addEventListener('click', calculateTripMileage);

    poiModal.querySelector('.close-button').addEventListener('click', hidePoiModal);
    poiModal.addEventListener('click', (e) => {
        if (e.target === poiModal) {
            hidePoiModal();
        }
    });

    setAsStartButton.addEventListener('click', () => {
        if (poiModal.currentPoi) {
            selectedStartPoi = poiModal.currentPoi;
            updateSelectedPointsDisplay();
            hidePoiModal();
            console.log('起點設定為:', selectedStartPoi.name); // Debugging
        }
    });

    setAsEndButton.addEventListener('click', () => {
        if (poiModal.currentPoi) {
            selectedEndPoi = poiModal.currentPoi;
            updateSelectedPointsDisplay();
            hidePoiModal();
            console.log('終點設定為:', selectedEndPoi.name); // Debugging
        }
    });

    submitPoiReviewButton.addEventListener('click', submitPoiReview);

    if (sroiOrderButtonPoi12) {
        sroiOrderButtonPoi12.addEventListener('click', () => {
            console.log("SROI生態棲地農產品訂購&ESG企業採購表單 button clicked (poi12)."); // Debugging
            const poi12Data = pois.find(p => p.id === 'poi12');
            if (poi12Data && poi12Data.sroiInfo) {
                showSroiInfoModal(poi12Data.sroiInfo, poi12Data.name);
            } else {
                console.error("SROI info not available for poi12."); // Debugging
            }
        });
    }

    if (showSroiInfoButton) {
        showSroiInfoButton.addEventListener('click', () => {
            console.log("Show SROI Info button clicked."); // Debugging
            if (showSroiInfoButton.sroiInfo && showSroiInfoButton.poiName) {
                showSroiInfoModal(showSroiInfoButton.sroiInfo, showSroiInfoButton.poiName);
            } else {
                console.error("SROI info or POI name not available on the button."); // Debugging
            }
        });
    }

    consumptionButtonsDiv.querySelectorAll('.consumption-button').forEach(button => {
        button.addEventListener('click', handleConsumptionSelect);
    });

    submitConsumptionButton.addEventListener('click', submitConsumption);

    participateActivityButton.addEventListener('click', showActivityModal);

    activityModal.querySelector('.close-button').addEventListener('click', hideActivityModal);
    activityModal.addEventListener('click', (e) => {
        if (e.target === activityModal) {
            hideActivityModal();
        }
    });

    submitActivityLogButton.addEventListener('click', logActivity);

    logActionButton.addEventListener('click', logSustainableAction);

    backToHomeButton.addEventListener('click', showHomepage);

    changeTransportButton.addEventListener('click', showHomepage);

    thsrInfoModal.querySelector('.close-button').addEventListener('click', hideThsrInfoModal);
    thsrInfoModal.addEventListener('click', (e) => {
        if (e.target === thsrInfoModal) {
            hideThsrInfoModal();
        }
    });

    downloadDataButton.addEventListener('click', downloadTourismData);

    logTripModal.querySelector('.close-button').addEventListener('click', hideLogTripModal);
    logTripModal.addEventListener('click', (e) => {
        if (e.target === logTripModal) {
            hideLogTripModal();
        }
    });

    submitLogTripButton.addEventListener('click', submitLogTrip);

    // 修正：確保 taxiInfoButton 的點擊事件能被正確捕捉
    if (taxiInfoButton) {
        taxiInfoButton.addEventListener('click', showTaxiInfoModal);
        console.log("Taxi Info button listener added."); // Debugging
    } else {
        console.warn("Taxi Info button element not found on DOMContentLoaded."); // Debugging
    }

    taxiInfoModal.querySelector('.close-button').addEventListener('click', hideTaxiInfoModal);
    taxiInfoModal.addEventListener('click', (e) => {
        if (e.target === taxiInfoModal) {
            hideTaxiInfoModal();
        }
    });

    sroiInfoModal.querySelector('.close-button').addEventListener('click', hideSroiInfoModal);
    sroiInfoModal.addEventListener('click', (e) => {
        if (e.target === sroiInfoModal) {
            hideSroiInfoModal();
        }
    });

    showHomepage();
});

window.addEventListener('resize', () => {
    if (map) {
        // map.setCenter(map.getCenter()); // Google Maps handles resize automatically, but calling center can help
    }
});

window.initMap = initMap;

window.gm_authFailure = function() {
    console.error("Google Maps API authentication failure. Check your API key and its restrictions."); // Debugging
    const mapStatusElement = document.getElementById('map-status');
    if (mapStatusElement) {
        mapStatusElement.innerHTML = '地圖載入失敗：API 金鑰認證失敗。請檢查您的金鑰和限制設定。<br><span class="text-xs">若地圖未正確載入，請利用景點列表中的 <i class="fas fa-car-side text-orange-500"></i> 圖示記錄您的里程。</span>';
        mapStatusElement.classList.remove('text-gray-600', 'text-green-600');
        mapStatusElement.classList.add('text-red-600');
    }
    const tripCalculationStatusElement = document.getElementById('trip-calculation-status');
    if (tripCalculationStatusElement) {
        tripCalculationStatusElement.textContent = '地圖服務未載入，無法計算路徑。';
        tripCalculationStatusElement.classList.remove('text-green-600', 'text-gray-700');
        tripCalculationStatusElement.classList.add('text-red-600');
    }
};
