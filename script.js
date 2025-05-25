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
    thsr_haoxing: { name: '高鐵假期x台灣好行', icon: '🚄🚌', carbonReductionPer10km: 0, travelMode: null, metersPerPoint: Infinity } // THSR doesn't get points from distance in this model
    // Taxi info is not included here as it's not for mileage calculation
};


// Points of Interest Data (Removed iconUrl for default markers)
const pois = [
    // Removed 'iconUrl' property to use default Google Maps markers
    // 'socialLink' property is kept for external links.
    { id: 'poi1', name: '水里永續共好聯盟打氣站', coords: { lat: 23.809799, lng: 120.849286 }, icon: '🌲', description: '營業時間上午8:00~17:00。\n\n不定期辦理活動，小尖兵們完成的永續任務的分數請在此出示，感謝您一起為地球減碳努力!\n\n本區共分為三個單位(水里鄉圖書館內):\n1. 社團法人南投縣水里鄉商圈創生共好協會 - 致力於推動水里地區商圈振興、永續農業、文化保存與地方創生行動。以多元合作模式打造出一個能共好、共學、共榮的地方創新平台。\n2. 水里溪畔驛站 - 在圖書館內的一處靜懿的景觀休憩場域，小農午餐需要事先預訂喔!\n3. 水里青農里山基地 - 是由臺大實驗林水里營林區輔導的里山餐桌團隊打造的里山及永續教育基地，由返鄉青農共同打造的農業與社區發展平台，以農村生產、生活、生態致力於推廣友善農業、食農教育及永續發展為目標。在這裡可以預約由小農開發的豐富教具進行DIY活動與食農、永續教育等活動!', image: '', socialLink: 'https://www.facebook.com/p/%E6%B0%B4%E9%87%8C%E9%84%89%E5%95%86%E5%9C%88%E5%89%B5%E7%94%9F%E5%85%B1%E5%A5%BD%E5%8D%94%E6%9C%83-100076220760859/?locale=zh_TW' },
    { id: 'poi2', name: '漫遊堤岸風光', coords: { lat: 23.808537, lng: 120.849415 }, icon: '🏞️', description: '起點：水里親水公園。終點：永興村，途中經過社子生態堤防、永興大橋、永興社區等地，路線全長約4公里，坡度平緩，適合親子及大眾。', image: '' },
    { id: 'poi3', name: '鑫鮮菇園', coords: { lat: 23.794049, lng: 120.859407 }, icon: '🍄', description: '營業時間: 需預約。\n\n提供香菇園區種植導覽與體驗行程 (時長20分鐘)。\n香菇/袖珍菇三角飯糰食農體驗(時長90分鐘)。', image: '', socialLink: 'https://www.facebook.com/xinxianguyuan', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_3', formLink: 'YOUR_FORM_LINK_3', lineId: 'YOUR_LINE_ID_3' } }, // Added sroiInfo
    { id: 'poi4', name: '永興神木', coords: { lat: 23.784127, lng: 120.862294 }, icon: '🌳', description: '社區麵包坊營業時間”上午9:00~17:00。\n\n永興神木（百年大樟樹）位於永興社區活動中心旁。樟樹群由三棵母子樹所形成，第一代木就是母樹，二代木則是母樹根系再長出的兩棵子樹，連成一體。樹齡約300年、樹圍6.2公尺、樹徑1.6公尺、樹高約26公尺、樹冠幅400平方公尺，一旁供俸老樹公及福德祠是居民的信仰中心。\n\n社區活動中心二樓設有社區麵包坊，由北海扶輪社、臺大實驗林、水里商工，共同扶持社區成立，利用當地種植的果物製作的吐司產品是新鮮別具風味的暢銷品。', image: '', socialLink: 'https://www.shli.gov.tw/story/1/6' },
    { id: 'poi5', name: '森林小白宮', coords: { lat: 23.779408, lng: 120.844019 }, icon: '🏠', description: '接駁、共乘、摩托。需預約。\n\n完成單一活動可獲得永續與環境教育任務點數10點。\n\n小白宮森林生態導覽，親子活動(彩繪/木藝/親子皮影)。', image: '', socialLink: 'https://wild-kids-studio.waca.tw/' },
    { id: 'poi6', name: '瑪路馬咖啡莊園', coords: { lat: 23.778239, lng: 120.843859 }, icon: '☕', description: '接駁、共乘、摩托。\n\n活動資訊: 咖啡座、咖啡園導覽。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/people/%E9%A6%AC%E8%B7%AF%E7%91%AA%E5%92%96%E5%95%A1%E8%8E%8A%E5%9C%92/100063961898841/' },
    { id: 'poi7', name: '指令教育農場', coords: { lat: 23.802776, lng: 120.864715 }, icon: '👆', description: '台灣好行、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/FarmCMD/', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_7', formLink: 'YOUR_FORM_LINK_7', lineId: 'https://line.me/ti/g2/HFRcE4eII1eQ761y0Zs3QEvs70saIQ-dHYbYgA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default' } }, // Updated LINE ID
    { id: 'poi8', name: '明揚養蜂', coords: { lat: 23.803787, lng: 120.862401 }, icon: '🐝', description: '共乘、台灣好行、摩托。\n\n活動資訊: 育蜂場導覽、生態導覽、蜂蜜食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/MingYangBee/?locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_8', formLink: 'YOUR_FORM_LINK_8', lineId: 'https://line.me/ti/g2/VuGeDsA2K8tPEJ9JOElK70LbUmGk8dW_7Q2zxA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default' } }, // Added sroiInfo
    { id: 'poi9', name: '蛇窯文化園區', coords: { lat: 23.801177, lng: 120.864479 }, icon: '🏺', description: '共乘、台灣好行。\n\n活動資訊: 購票入園，完成食農器皿文化參觀可獲得永續與環境教育點數10點。', image: '', socialLink: 'https://www.facebook.com/sskshop/?locale=zh_TW' },
    { id: 'poi10', name: '雨社山下', coords: { lat: 23.790644, lng: 120.896569 }, icon: '🥒', description: '接駁、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=61557727713841&locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_10', formLink: 'YOUR_FORM_LINK_10', lineId: 'https://line.me/ti/g2/ltdgi_rY8K-frnjS9Q0n0n2vGSO8uw8m5uGUWA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default' } }, // Added sroiInfo
    { id: 'poi11', name: '阿爾喜莊園', coords: { lat: 23.803119, lng: 120.926340 }, icon: '🍋', description: '接駁、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育、農業循環經濟教學。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/AHEIemon?locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_11', formLink: 'YOUR_FORM_LINK_11', lineId: 'https://line.me/ti/g2/f2JhyAIKmKvProOMzM2z4Mb-6ogaJOOsPT0jug?utm_source=invitation&utm_medium=link_copy&utm_campaign=default' } }, // Added sroiInfo
    // Re-added sroiInfo for poi12
    { id: 'poi12', name: '湧健酪梨園', coords: { lat: 23.725349, lng: 120.846123 }, icon: '🥑', description: '台灣好行、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=100085673588842&locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_12', formLink: 'YOUR_FORM_LINK_12', lineId: 'https://line.me/ti/g2/PIlIHjGJgO-mmn3JvqgCJ9_mPY7Aoeqg8VOEDg?utm_source=invitation&utm_medium=link_copy&utm_campaign=default' } }, // Re-added sroiInfo for poi12
    { id: 'poi13', name: '謝家肉圓', coords: { lat: 23.817521, lng: 120.853831 }, icon: '🥟', description: '步行、摩托、台灣好行。營業時間 11:00–17:00。\n\n在地人巷內70年老店。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=100054428473137&locale=zh_TW' },
    { id: 'poi14', name: '機車貓聯盟', coords: { lat: 23.810883, lng: 120.855798 }, icon: '🍚', description: '共乘、摩托、台灣好行。營業時間 11:00–17:00。\n\n無菜單料理店，50%以上使用在地食材，任一消費金額可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://m.facebook.com/機車貓聯盟-552637305127422/' }, // Added social link (using the one from search result)
    { id: 'poi15', name: '二坪大觀冰店', coords: { lat: 23.813627, lng: 120.859651 }, icon: '🍦', description: '共乘、摩托。\n\n在地推薦古早味枝仔冰。台電員工福利社60年老店。', image: '', socialLink: 'https://www.facebook.com/2pinIce/' },
    { id: 'poi16', name: '水里里山村', coords: { lat: 23.813459, lng: 120.853787 }, icon: '🏡', description: '共乘、摩托。\n\n在地推鑑環保旅宿，任一消費金額可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://tg-ecohotel.com/' }, // Added website link
    // Updated description for poi17
    { id: 'poi17', name: '水里星光市集', coords: { lat: 23.813636, lng: 120.850816 }, icon: '💡', description: '參加”逛市集增里程”地產地銷最減碳，支持在地消費獲得減碳量。\n\n本年度預計於星光市集舉辦「食農教育」活動，場次及內容請洽水里鄉商圈創生共好協會。', image: '', socialLink: 'https://www.facebook.com/p/%E6%B0%B4%E9%87%8C%E9%84%89%E5%95%86%E5%9C%88%E5%89%B5%E7%94%9F%E5%85%B1%E5%A5%BD%E5%8D%94%E6%9C%83-100076220760859/?locale=zh_TW', isNew: true, marketScheduleLink: 'https://www.facebook.com/photo/?fbid=2583695705169366&set=pcb.2583695981835995' },
    // New POI: 森音
    { id: 'poi18', name: '森音', coords: { lat: 23.742587, lng: 120.866954 }, icon: '🎶', description: '接駁、摩托、私家車。需預約。\n\n完成單一活動可獲得永續與環境教育任務點數10點。\n\n森音森林導覽，親子活動(咖啡座/木藝上板/森林育樂/畫廊)。', image: '', socialLink: 'https://www.facebook.com/morinooto111' }
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

// New Market Data
const marketTypes = [
    { id: 'starlight_market', name: '水里星光市集', icon: '🌟' }, // Updated name
    { id: 'farmers_market', name: '小農市集', icon: '🧑‍🌾' },
    { id: 'festival_market', name: '其他節慶市集', icon: '🎉' }
];

const marketProductData = {
    'agricultural_products': { name: '農產品', mileage: 5000, carbonReduction: 20, points: 5, icon: '🥕' }, // 5km, 20g, 5 points
    'local_snacks': { name: '在地小吃', mileage: 3000, carbonReduction: 12, points: 3, icon: '🍜' },      // 3km, 12g, 3 points
    'creative_products': { name: '文創商品', mileage: 2000, carbonReduction: 8, points: 2, icon: '🎨' },   // 2km, 8g, 2 points
    'services': { name: '服務類', mileage: 2000, carbonReduction: 8, points: 2, icon: '🛠️' },           // 2km, 8g, 2 points
    'others': { name: '其他', mileage: 2000, carbonReduction: 8, points: 2, icon: '🛍️' }                 // 2km, 8g, 2 points
};


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

// New state for market selection
let selectedMarketType = null;
let selectedMarketProduct = null;


// --- DOM Elements ---
const homepageSection = document.getElementById('homepage');
const missionPageSection = document.getElementById('mission-page');
// const thsrInfoDiv = document.getElementById('thsr-info'); // This div is now unused for display, kept for reference
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
const poiModalDynamicButtonsDiv = document.getElementById('poi-modal-dynamic-buttons'); // Container for dynamic buttons
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

// New Market Modal DOM Elements
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
const marketStoreCodeInput = document.getElementById('market-store-code'); // Added for store code

// New Photo Album Modal DOM Elements
const photoAlbumPromoButton = document.getElementById('photo-album-promo-button');
const photoAlbumModal = document.getElementById('photo-album-modal');


// --- Local Storage ---
const localStorageKey = 'shuilSustainableTourismData_v2.2'; // Updated key for versioning
const localStorageActionsKey = 'shuilSustainableTourismActions_v2.2'; // Updated key for versioning

function loadData() {
    console.log("Loading data from localStorage..."); // Debugging line
    const data = localStorage.getItem(localStorageKey);
    if (data) {
        const parsedData = JSON.parse(data);
        totalMileage = parsedData.totalMileage || 0;
        totalCarbonReduction = parsedData.totalCarbonReduction || 0;
        totalScore = parsedData.totalScore || 0;
        playerName = parsedData.playerName || ''; // Load player name
        playerCode = parsedData.playerCode || ''; // Load player code

        // If player code is not loaded (first time or cleared data), generate a new one
        if (!playerCode) {
            playerCode = generateRandomCode();
            console.log("Generated new player code:", playerCode); // Debugging line
        } else {
             console.log("Loaded player code:", playerCode); // Debugging line
        }


        updateStatsDisplay();
         document.getElementById('stats-load-status').textContent = '已成功載入之前的旅遊數據。'; // Update status message
         document.getElementById('stats-load-status').classList.remove('text-gray-600');
         document.getElementById('stats-load-status').classList.add('text-green-600');

    } else {
         // If no data at all, generate a new code and initialize stats
         playerCode = generateRandomCode();
         totalMileage = 0;
         totalCarbonReduction = 0;
         totalScore = 0;
         playerName = '';
         console.log("No data found, generated new player code and initialized stats:", playerCode); // Debugging line
         updateStatsDisplay(); // Update display with initial stats and new code
         document.getElementById('stats-load-status').textContent = '未發現先前的旅遊數據，已建立新的永續旅者紀錄。'; // Update status message
         document.getElementById('stats-load-status').classList.remove('text-gray-600');
         document.getElementById('stats-load-status').classList.add('text-blue-600');
    }

    // Load action logs
    console.log("Loading action logs from localStorage..."); // Debugging line
    const actionsData = localStorage.getItem(localStorageActionsKey);
    if (actionsData) {
        loggedActions = JSON.parse(actionsData);
        console.log("Loaded action logs:", loggedActions); // Debugging line
        renderLoggedActions(); // Display loaded actions
    } else {
         loggedActions = []; // Initialize as empty array if no data
         loggedActionsListElement.innerHTML = '<p class="text-gray-500 text-center">尚無行動紀錄</p>'; // Show empty message if no data
         console.log("No action logs found."); // Debugging line
    }
     saveData(); // Save data including the potentially new code and initialized actions
     console.log("Data loading complete."); // Debugging line

     // Fetch and display network-wide total (only if Firebase initialized successfully)
    if (db) {
        fetchNetworkTotalCarbonReduction();
    } else {
         console.warn("Firebase not initialized, cannot fetch network total.");
    }
}

function saveData() {
    console.log("Saving data to localStorage..."); // Debugging line
    const dataToSave = {
        totalMileage: totalMileage,
        totalCarbonReduction: totalCarbonReduction,
        totalScore: totalScore,
        playerName: playerNameInput.value.trim(), // Save player name from input
        playerCode: playerCode // Save player code
    };
    localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
    console.log("Saved main data:", dataToSave); // Debugging line


    // Save action logs
    localStorage.setItem(localStorageActionsKey, JSON.stringify(loggedActions));
    console.log("Saved action logs:", loggedActions); // Debugging line

    // Send player data to Firebase (only if Firebase initialized successfully)
    if (db && playerCode) { // Ensure playerCode exists before saving to Firebase
       savePlayerDataToFirebase({
           playerCode: playerCode,
           playerName: playerNameInput.value.trim(),
           totalMileage: totalMileage,
           totalCarbonReduction: totalCarbonReduction,
           totalScore: totalScore,
           lastUpdated: serverTimestamp() // Use the imported serverTimestamp function
       });
    } else {
        console.warn("Firebase not initialized or player code missing, cannot save player data.");
    }
}

function updateStatsDisplay() {
    totalMileageSpan.textContent = `${(totalMileage / 1000).toFixed(2)} km`; // Display in km
    totalCarbonReductionSpan.textContent = `${totalCarbonReduction.toFixed(2)} g`;
    totalScoreSpan.textContent = totalScore;
    playerNameInput.value = playerName; // Set player name input value
    playerCodeDisplay.textContent = playerCode; // Display player code
    console.log("Stats display updated."); // Debugging line
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

// Function to save individual player data to Firebase
async function savePlayerDataToFirebase(playerData) {
    console.log("Attempting to save player data to Firebase for永續旅者:", playerData.playerCode); // Debugging line
     // Check if db is initialized before proceeding
     if (!db) {
          console.error("Firebase Firestore not initialized. Cannot save永續旅者data.");
          return;
     }
    try {
        // Use playerCode as the document ID in the 'players' collection
        // Use the imported collection and doc functions
        const playerDocRef = doc(collection(db, 'players'), playerData.playerCode);


        // Use set with merge: true to create or update the document
        // Use the imported setDoc function
        await setDoc(playerDocRef, playerData, { merge: true });


        console.log("永續旅者data saved to Firebase successfully for永續旅者:", playerData.playerCode); // Debugging line
        // After saving, fetch the updated network total (which sums all player data)
        fetchNetworkTotalCarbonReduction();

    } catch (e) {
        console.error("Error saving 永續旅者 data to Firebase: ", e); // Debugging line
        // Optional: Display an error message to the user
    }
}


// Function to fetch and display network-wide total carbon reduction from Firebase
async function fetchNetworkTotalCarbonReduction() {
    console.log("Attempting to fetch network total carbon reduction from Firebase..."); // Debugging line
     // Check if db is initialized before proceeding
     if (!db) {
          console.error("Firebase Firestore not initialized. Cannot fetch data.");
          networkTotalCarbonReductionElement.textContent = '載入失敗';
          networkStatsStatusElement.textContent = 'Firebase 未初始化。';
          networkStatsStatusElement.classList.remove('text-gray-600', 'text-green-600');
          networkStatsStatusElement.classList.add('text-red-600');
          return;
     }

    networkTotalCarbonReductionElement.textContent = '載入中...';
    networkStatsStatusElement.textContent = '從伺服器載入中...';
    networkStatsStatusElement.classList.remove('text-green-600', 'text-red-600', 'text-blue-600'); // Remove all previous status colors
    networkStatsStatusElement.classList.add('text-gray-600'); // Set to gray for loading
    
    const treeCountElement = document.getElementById('tree-count');


    try {
        // Get all documents in the 'players' collection
        // Use the imported collection and getDocs functions
        const playersSnapshot = await getDocs(collection(db, 'players'));


        let totalCarbonAcrossNetwork = 0;

        if (!playersSnapshot.empty) {
            playersSnapshot.forEach(doc => {
                const playerData = doc.data();
                // Add each player's totalCarbonReduction to the network total
                totalCarbonAcrossNetwork += (playerData.totalCarbonReduction || 0); // Use 0 if value is missing
            });
             console.log(`Processed ${playersSnapshot.size} 永續旅者documents.`); // Debugging line
        } else {
             console.log("No 永續旅者data found in Firebase 'players' collection."); // Debugging line
        }

        networkTotalCarbonReduction = totalCarbonAcrossNetwork; // Update the state variable
        networkTotalCarbonReductionElement.textContent = `${networkTotalCarbonReduction.toFixed(2)} g`;
        
        const treesPlanted = Math.floor(networkTotalCarbonReduction / 10000000); // 10 tons = 10,000,000 g
        if (treeCountElement) {
            treeCountElement.textContent = treesPlanted;
        }
        
        networkStatsStatusElement.textContent = '網路統計數據載入成功。';
        networkStatsStatusElement.classList.remove('text-gray-600', 'text-red-600', 'text-blue-600');
        networkStatsStatusElement.classList.add('text-green-600');
        console.log("Network total carbon reduction calculated and displayed:", networkTotalCarbonReduction, "g"); // Debugging line


    } catch (e) {
        console.error("Error fetching network total carbon reduction from Firebase: ", e); // Debugging line
        networkTotalCarbonReduction = 0; // Reset to 0 on error
        networkTotalCarbonReductionElement.textContent = '載入失敗';
        
        if (treeCountElement) {
            treeCountElement.textContent = 0; // Reset tree count on error
        }
        
        networkStatsStatusElement.textContent = '無法載入網路統計數據。';
        networkStatsStatusElement.classList.remove('text-gray-600', 'text-green-600', 'text-blue-600');
        networkStatsStatusElement.classList.add('text-red-600');
    }
}


// --- Page Navigation ---
function showHomepage() {
    homepageSection.style.display = 'block';
    missionPageSection.style.display = 'none';
     // Reset selected points and clear trip line when returning to homepage
    resetSelectedPoints(); // Re-added resetSelectedPoints
    clearTripLine(); // Re-added clearTripLine
     // Clear selected actions when returning to homepage
     clearSelectedActions();
     // Clear selected activity state
     selectedActivity = null;
      // Remove highlight from previously selected activity item
     const previousSelectedItem = activityListElement.querySelector(`.selected-activity-item`);
     if (previousSelectedItem) {
                 previousSelectedItem.classList.remove('selected-activity-item');
     }
     console.log("Showing homepage."); // Debugging line
     // Ensure network total is fetched/updated when returning to homepage
    if (db) {
        fetchNetworkTotalCarbonReduction();
    } else {
         console.warn("Firebase not initialized, cannot fetch network total on homepage.");
    }
}

function showMissionPage() {
    homepageSection.style.display = 'none';
    missionPageSection.style.display = 'block';

    // Trigger map resize and recenter after the container becomes visible
    // This helps the map render correctly if it was initialized while hidden
    if (map) {
         console.log("Map exists, triggering resize and recenter."); // Debugging line
         google.maps.event.trigger(map, 'resize');
         map.setCenter({ lat: 23.810, lng: 120.850 }); // Re-center to default location
         console.log("Map container is now visible. Triggered resize and recenter."); // Debugging line
    } else {
         console.log("Map not initialized yet when showing mission page."); // Debugging line
         // If map is not initialized, update status to reflect this
         const missionPageMapStatus = document.getElementById('map-status');
         if (missionPageMapStatus) {
              mapStatusElement.innerHTML = '地圖載入中... (等待 Google Maps API)<br><span class="text-xs">若地圖未正確載入，請利用景點列表中的 <i class="fas fa-car-side text-orange-500"></i> 圖示記錄您的里程。</span>';
              mapStatusElement.classList.remove('text-green-600', 'text-red-600');
              mapStatusElement.classList.add('text-gray-600');
         }
    }


    // Check if transportData is defined before accessing its properties
    currentTransportDisplay.textContent = currentTransport && transportData[currentTransport] ? transportData[currentTransport].name : '未選擇';
     updateSelectedPointsDisplay(); // Re-added updateSelectedPointsDisplay
     console.log("Showing mission page. Current transport:", currentTransport); // Debugging line
}

// --- Google Map Initialization and POI Markers ---
// This function is called automatically by the Google Maps API script's callback parameter
function initMap() {
     console.log("initMap function called by Google Maps API."); // Debugging line

     // ** Added check for google.maps object and potential API loading errors **
     if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
         console.error("Google Maps API not loaded. Please check your API key, network connection, and browser console for errors.");
         // Check for common API loading errors logged by Google Maps itself
         if (window.google && window.google.maps && window.google.maps.api && window.google.maps.api.loaded === false) {
              console.error("Google Maps API failed to load. Check the network tab for details on the API request.");
         } else {
              console.error("Google Maps API object is not available.");
         }

         // Update map status element in mission page
         const missionPageMapStatus = document.getElementById('map-status');
         if (missionPageMapStatus) {
              mapStatusElement.innerHTML = '地圖載入失敗：API 金鑰認證失敗。請檢查您的金鑰和限制設定。<br><span class="text-xs">若地圖未正確載入，請利用景點列表中的 <i class="fas fa-car-side text-orange-500"></i> 圖示記錄您的里程。</span>';
              mapStatusElement.classList.remove('text-gray-600', 'text-green-600');
              mapStatusElement.classList.add('text-red-600');
         }
         // Re-added tripCalculationStatusElement update
         if (tripCalculationStatusElement) {
            tripCalculationStatusElement.textContent = '地圖服務未載入，無法計算路徑。';
            tripCalculationStatusElement.classList.remove('text-green-600', 'text-gray-700');
            tripCalculationStatusElement.classList.add('text-red-600');
         }
         return; // Exit if API is not loaded
     }
      console.log("Google Maps API object is available."); // Debugging line


     // Assign google.maps.TravelMode values after the API is loaded
     // Re-added travelMode assignments
     transportData.bike.travelMode = google.maps.TravelMode.BICYCLING;
     transportData.walk.travelMode = google.maps.TravelMode.WALKING;
     transportData.bus_train.travelMode = google.maps.TravelMode.TRANSIT; // Using TRANSIT for public transport
     transportData.carpool_2_moto.travelMode = google.maps.TravelMode.DRIVING;
     transportData.carpool_3.travelMode = google.maps.TravelMode.DRIVING;
     transportData.carpool_4.travelMode = google.maps.TravelMode.DRIVING;
     transportData.carpool_5.travelMode = google.maps.TravelMode.DRIVING;
     transportData.thsr_haoxing.travelMode = google.maps.TravelMode.TRANSIT; // Using TRANSIT mode


    // Default view centered around Shuil里 (approximate coordinates)
    const defaultCoords = { lat: 23.810, lng: 120.850 };

    console.log("Initializing Google Map with center:", defaultCoords); // Debugging line
    map = new google.maps.Map(mapElement, {
        center: defaultCoords,
        zoom: 13, // Zoom level 13
         mapTypeControl: false, // Optional: hide map type control
         streetViewControl: false // Optional: hide street view control
    });
     console.log("Google Map object created:", map); // Debugging line


    // Re-added Directions Service and Renderer
    // Initialize Directions Service and Renderer
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map: map, suppressMarkers: true }); // suppressMarkers: true to use our own POI markers
    console.log("DirectionsService and DirectionsRenderer initialized.");


    // Add POI markers with default icons and labels
    console.log("Adding POI markers with default icons. Total POIs:", pois.length); // Debugging line
    pois.forEach(poi => {
        // Removed the custom icon property here to use default markers
        const marker = new google.maps.Marker({
            position: poi.coords,
            map: map,
            title: poi.name, // Marker title on hover
             label: { // Add label property to display text
                text: poi.name, // Display the POI name
                color: '#000000', // Label text color (black)
                fontSize: '12px', // Label font size
                fontWeight: 'bold', // Label font weight
                className: 'map-label' // Optional: Add a class for custom styling if needed
            }
        });

        // Store POI data with the marker
        marker.poiData = poi;

        // Add click listener to marker
        marker.addListener('click', function() {
            // For all POIs, including poi17, clicking the marker will open the standard POI modal.
            showPoiModal(this.poiData);
        });

        poiMarkers.push(marker); // Store marker object
    });
    console.log("POI markers added to map with default icons."); // Debugging line


    // The DirectionsRenderer will handle drawing the route polyline
    // We no longer need a separate tripPolyline object managed manually.
    // tripPolyline = new google.maps.Polyline({...});
    // tripPolyline.setMap(null);

    // Update map status element in mission page
     const missionPageMapStatus = document.getElementById('map-status');
     if (missionPageMapStatus) {
         mapStatusElement.innerHTML = '地圖載入成功！請從下方景點列表或地圖上選擇起點和終點。<br><span class="text-xs">若地圖未正確載入，請利用景點列表中的 <i class="fas fa-car-side text-orange-500"></i> 圖示記錄您的里程。</span>';
         mapStatusElement.classList.remove('text-gray-600', 'text-red-600');
         mapStatusElement.classList.add('text-green-600');
     }
     console.log("Google Map initialization complete."); // Debugging line
}
window.initMap = initMap; // Make initMap globally available

// --- POI Selection and Mileage Calculation ---

function updateSelectedPointsDisplay() {
    const startName = selectedStartPoi ? selectedStartPoi.name : '未選擇';
    const endName = selectedEndPoi ? selectedEndPoi.name : '未選擇';
    selectedPointsDisplay.textContent = `起點: ${startName} | 終點: ${endName}`;
     // Update list item highlights
     updatePoiListItemHighlights();
     console.log("Selected points display updated."); // Debugging line
}

function updatePoiListItemHighlights() {
     // Remove all existing highlights
     poiListElement.querySelectorAll('li').forEach(item => { // Changed selector to 'li'
         item.classList.remove('poi-list-item-start', 'poi-list-item-end');
     });

     // Add highlight to selected start POI list item
     if (selectedStartPoi) {
         const startItem = poiListElement.querySelector(`li[data-poi-id="${selectedStartPoi.id}"]`);
         if (startItem) {
             startItem.classList.add('poi-list-item-start');
         }
     }

     // Add highlight to selected end POI list item
     if (selectedEndPoi) {
         const endItem = poiListElement.querySelector(`li[data-poi-id="${selectedEndPoi.id}"]`);
         if (endItem) {
             endItem.classList.add('poi-list-item-end');
         }
     }
     console.log("POI list item highlights updated."); // Debugging line
}


function resetSelectedPoints() {
    selectedStartPoi = null;
    selectedEndPoi = null;
    updateSelectedPointsDisplay();
     // Clear the displayed route on the map
     clearTripLine();
     console.log("Selected points reset."); // Debugging line
}

function calculateTripMileage() {
    console.log("Calculate mileage button clicked."); // Debugging line
    // Check if directionsService is initialized
    if (!directionsService) {
        tripCalculationStatusElement.textContent = '地圖服務尚未載入，請稍候再試。';
        tripCalculationStatusElement.classList.remove('text-green-600');
        tripCalculationStatusElement.classList.add('text-red-600');
        console.error("DirectionsService not initialized."); // Debugging line
        return;
    }

    if (!selectedStartPoi || !selectedEndPoi) {
        tripCalculationStatusElement.textContent = '請先選擇起點和終點景點！';
        tripCalculationStatusElement.classList.remove('text-green-600');
        tripCalculationStatusElement.classList.add('text-red-600');
        console.warn("Start or end POI not selected."); // Debugging line
        return;
    }

     if (selectedStartPoi.id === selectedEndPoi.id) {
         tripCalculationStatusElement.textContent = '起點和終點不能是同一個景點！';
         tripCalculationStatusElement.classList.remove('text-green-600');
         tripCalculationStatusElement.classList.add('text-red-600');
         console.warn("Start and end POI are the same."); // Debugging line
         return;
     }

     if (currentTransport === null) {
          tripCalculationStatusElement.textContent = '請先在首頁選擇交通方式！';
          tripCalculationStatusElement.classList.remove('text-green-600');
          tripCalculationStatusElement.classList.add('text-red-600');
          console.warn("Transport mode not selected."); // Debugging line
          return;
     }

    tripCalculationStatusElement.textContent = '正在計算路徑...'; // Added loading indicator
    tripCalculationStatusElement.classList.remove('text-red-600', 'text-gray-700');
    tripCalculationStatusElement.classList.add('text-gray-700');
    clearTripLine(); // Clear previous route

    // Determine travel mode based on selected transport (simplified)
    let travelMode = google.maps.TravelMode.DRIVING; // Default
     // Find the selected transport data object
     const selectedTransportData = transportData[currentTransport];
     if (selectedTransportData && selectedTransportData.travelMode) {
         travelMode = selectedTransportData.travelMode;
     }
     console.log("Calculating trip with travel mode:", travelMode); // Debugging line


    const request = {
        origin: selectedStartPoi.coords,
        destination: selectedEndPoi.coords,
        travelMode: travelMode
         // Optional: Add optimizeWaypoints: true if you had multiple waypoints
    };

    directionsService.route(request, (response, status) => {
        console.log("Directions service response status:", status); // Debugging line
        if (status === 'OK') {
            // Display the route on the map
            directionsRenderer.setDirections(response);
            console.log("Route rendered on map."); // Debugging line

            // Get the distance from the response
            const route = response.routes[0];
            const leg = route.legs[0]; // Assuming a simple A to B route with one leg
            const distanceInMeters = leg.distance.value; // Distance in meters
            console.log("Calculated distance:", distanceInMeters, "meters"); // Debugging line

            // Add this distance to total mileage
            totalMileage += distanceInMeters;

            // Calculate carbon reduction for this trip
            let tripCarbonReduction = 0;
             if (currentTransport && transportData[currentTransport].carbonReductionPer10km > 0) {
                 // Carbon reduction per meter = (reduction per 10km / 10000 meters)
                 const carbonReductionPerMeter = transportData[currentTransport].carbonReductionPer10km / 10000;
                 tripCarbonReduction = distanceInMeters * carbonReductionPerMeter;
                 totalCarbonReduction += tripCarbonReduction;
             }
            console.log("Calculated carbon reduction:", tripCarbonReduction, "grams"); // Debugging line


            // Calculate score based on metersPerPoint for the selected transport
            let scoreForThisTrip = 0;
            if (currentTransport && transportData[currentTransport].metersPerPoint !== Infinity) {
                 const metersPerPoint = transportData[currentTransport].metersPerPoint;
                 scoreForThisTrip = Math.floor(distanceInMeters / metersPerPoint);
                 totalScore += scoreForThisTrip;
                 console.log("Score earned this trip based on metersPerPoint:", scoreForThisTrip); // Debugging line
            } else {
                 console.log("No distance-based score for this transport type."); // Debugging line
            }


            // Update displays
            updateStatsDisplay();
             tripCalculationStatusElement.textContent = `本次旅程里程 (路徑): ${(distanceInMeters / 1000).toFixed(2)} km, 估計減碳: ${tripCarbonReduction.toFixed(2)} g. 獲得分數: ${scoreForThisTrip}`;
             tripCalculationStatusElement.classList.remove('text-red-600', 'text-gray-700');
             tripCalculationStatusElement.classList.add('text-green-600');


            // --- Log the trip calculation result ---
            const now = new Date();
            const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

            const newLogEntry = {
                type: 'trip_calculation', // New type for trip calculation logs
                startPoiName: selectedStartPoi.name,
                endPoiName: selectedEndPoi.name,
                transportName: transportData[currentTransport].name,
                transportIcon: transportData[currentTransport].icon,
                mileageInMeters: distanceInMeters,
                carbonReduction: tripCarbonReduction,
                points: scoreForThisTrip, // Score from this trip
                timestamp: timestamp
            };

            loggedActions.push(newLogEntry); // Add new log to the array
            saveData(); // Save updated logs and potentially send data to server
            renderLoggedActions(); // Re-render the list
            console.log("Logged trip calculation:", newLogEntry); // Debugging line
            // --- End of logging ---

        } else {
            // Handle errors, e.g., route not found
            tripCalculationStatusElement.textContent = `計算路徑失敗: ${status}`;
            tripCalculationStatusElement.classList.remove('text-green-600', 'text-gray-700');
            tripCalculationStatusElement.classList.add('text-red-600');
            console.error('Directions request failed due to ' + status); // Debugging line
        }
    });
}

function clearTripLine() {
     // DirectionsRenderer handles clearing the displayed route
     if (directionsRenderer) {
         directionsRenderer.setDirections({ routes: [] }); // Clear directions
         console.log("Trip line cleared."); // Debugging line
     }
}


// --- POI List and Modal ---
function populatePoiList() {
    poiListElement.innerHTML = ''; // Clear existing list
    pois.forEach(poi => {
        const listItem = document.createElement('li');
        listItem.classList.add('clickable-list-item', 'hover:text-green-700', 'p-3', 'rounded-md', 'transition-colors', 'duration-150'); // Added more Tailwind classes for better styling
        listItem.dataset.poiId = poi.id; // Store POI ID for highlighting

        // Create a span for the text content (POI name and icon)
        const textSpan = document.createElement('span');
        // Use the emoji icon from the poi data for the list item display
        let poiNameDisplay = `${poi.icon} ${poi.name}`;

        // Add "NEW" indicator if isNew flag is true
        if (poi.isNew) {
            poiNameDisplay += ' <span class="new-indicator text-red-500 font-bold text-xs ml-1">NEW</span>'; // Added NEW indicator
        }
        // Add (SROI) tag if sroiInfo exists
        if (poi.sroiInfo) {
            poiNameDisplay += ' <span class="text-purple-600 font-semibold text-xs ml-1">(SROI)</span>';
        }
        textSpan.innerHTML = poiNameDisplay; // Use innerHTML to render the span tag for NEW and SROI

        // Add a click listener to the text span to show the modal
        textSpan.addEventListener('click', (event) => {
            event.stopPropagation();
            showPoiModal(poi); // Always show POI modal first
        });
        listItem.appendChild(textSpan);

        // Create a container for icons (social, navigation, and log trip)
        const iconGroup = document.createElement('div');
        iconGroup.classList.add('icon-group', 'flex', 'items-center', 'space-x-3'); // Use Tailwind for spacing

        // Add social media link icon if available
        if (poi.socialLink) {
            const socialLinkElement = document.createElement('a');
            socialLinkElement.href = poi.socialLink;
            socialLinkElement.target = "_blank"; // Open in new tab
            socialLinkElement.classList.add('social-icon', 'text-gray-600', 'hover:text-blue-500'); // Tailwind styling
            // Determine icon based on link (simple check)
            if (poi.socialLink.includes('facebook')) {
                 socialLinkElement.innerHTML = '<i class="fab fa-facebook fa-lg"></i>'; // Facebook icon, larger
            } else if (poi.socialLink.includes('instagram')) {
                 socialLinkElement.innerHTML = '<i class="fab fa-instagram fa-lg"></i>'; // Instagram icon, larger
            } else {
                 socialLinkElement.innerHTML = '<i class="fas fa-link fa-lg"></i>'; // Generic link icon, larger
            }
            iconGroup.appendChild(socialLinkElement);
        }

        // Add navigation link icon
        const navigationLinkElement = document.createElement('a');
        // Use Google Maps navigation URL format
        navigationL
