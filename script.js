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
    { id: 'poi7', name: '指令教育農場', coords: { lat: 23.802776, lng: 120.864715 }, icon: '👆', description: '台灣好行、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/FarmCMD/', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_7', formLink: 'YOUR_FORM_LINK_7', lineId: 'YOUR_LINE_ID_7' } }, // Added sroiInfo
    { id: 'poi8', name: '明揚養蜂', coords: { lat: 23.803787, lng: 120.862401 }, icon: '🐝', description: '共乘、台灣好行、摩托。\n\n活動資訊: 育蜂場導覽、生態導覽、蜂蜜食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/MingYangBee/?locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_8', formLink: 'YOUR_FORM_LINK_8', lineId: 'YOUR_LINE_ID_8' } }, // Added sroiInfo
    { id: 'poi9', name: '蛇窯文化園區', coords: { lat: 23.801177, lng: 120.864479 }, icon: '🏺', description: '共乘、台灣好行。\n\n活動資訊: 購票入園，完成食農器皿文化參觀可獲得永續與環境教育點數10點。', image: '', socialLink: 'https://www.facebook.com/sskshop/?locale=zh_TW' },
    { id: 'poi10', name: '雨社山下', coords: { lat: 23.790644, lng: 120.896569 }, icon: '🥒', description: '接駁、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=61557727713841&locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_10', formLink: 'YOUR_FORM_LINK_10', lineId: 'YOUR_LINE_ID_10' } }, // Added sroiInfo
    { id: 'poi11', name: '阿爾喜莊園', coords: { lat: 23.803119, lng: 120.926340 }, icon: '🍋', description: '接駁、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育、農業循環經濟教學。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/AHEIemon?locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_11', formLink: 'YOUR_FORM_LINK_11', lineId: 'YOUR_LINE_ID_11' } }, // Added sroiInfo
    // Re-added sroiInfo for poi12
    { id: 'poi12', name: '湧健酪梨園', coords: { lat: 23.725349, lng: 120.846123 }, icon: '🥑', description: '台灣好行、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=100085673588742&locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_12', formLink: 'YOUR_FORM_LINK_12', lineId: 'YOUR_LINE_ID_12' } }, // Re-added sroiInfo for poi12
    { id: 'poi13', name: '謝家肉圓', coords: { lat: 23.817521, lng: 120.853831 }, icon: '🥟', description: '步行、摩托、台灣好行。營業時間 11:00–17:00。\n\n在地人巷內70年老店。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=100054428473137&locale=zh_TW' },
    { id: 'poi14', name: '機車貓聯盟', coords: { lat: 23.810883, lng: 120.855798 }, icon: '🍚', description: '共乘、摩托、台灣好行。營業時間 11:00–17:00。\n\n無菜單料理店，50%以上使用在地食材，任一消費金額可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://m.facebook.com/機車貓聯盟-552637305127422/' }, // Added social link (using the one from search result)
    { id: 'poi15', name: '二坪大觀冰店', coords: { lat: 23.813627, lng: 120.859651 }, icon: '🍦', description: '共乘、摩托。\n\n在地推薦古早味枝仔冰。台電員工福利社60年老店。', image: '', socialLink: 'https://www.facebook.com/2pinIce/' },
    { id: 'poi16', name: '水里里山村', coords: { lat: 23.813459, lng: 120.853787 }, icon: '🏡', description: '共乘、摩托。\n\n在地推鑑環保旅宿，任一消費金額可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://tg-ecohotel.com/' }, // Added website link
    // Added isNew flag and updated description for poi17
    { id: 'poi17', name: '水里星光市集', coords: { lat: 23.813636, lng: 120.850816 }, icon: '💡', description: '共乘、摩托。\n\n任一消費金額可獲得永續與環境教育任務點數10點。\n\n本年度預計於星光市集舉辦「食農教育」活動，場次及內容請洽水里鄉商圈創生共好協會。', image: '', socialLink: 'https://www.facebook.com/p/%E6%B0%B4%E9%87%8C%E9%84%89%E5%95%86%E5%9C%88%E5%89%B5%E7%94%9F%E5%85%B1%E5%A5%BD%E5%8D%94%E6%9C%83-100076220760859/?locale=zh_TW', isNew: true, marketScheduleLink: 'https://www.facebook.com/photo/?fbid=2583695705169366&set=pcb.2583696081835995' } // Added isNew flag and marketScheduleLink
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

// Define consumption data for poi17 with corresponding mileage in meters
const poi17ConsumptionData = {
    農產品: { mileage: 5000 }, // 5 km = 5000 meters
    在地小吃: { mileage: 3000 }, // 3 km
    文創商品: { mileage: 2000 }, // 2 km
    服務類: { mileage: 2000 }, // 2 km
    其他: { mileage: 2000 } // 2 km
};


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
const poiModalSocialDiv = docum
