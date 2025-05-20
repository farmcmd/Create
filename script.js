// Firebase 初始設定（請替換為您的專案設定）
// firebase.initializeApp({ ... });
// const db = firebase.firestore();

// 景點資料
const pois = [
  // 其他 POI...
  {
    id: 'poi17',
    name: '水里星光市集',
    coords: { lat: 23.813636, lng: 120.780123 },
    description: [
      '1. 農產品 (5 里程)',
      '2. 在地小吃 (3 里程)',
      '3. 文創商品 (2 里程)',
      '4. 服務類   (2 里程)',
      '5. 其他     (2 里程)'
    ].join('\n'),
    isConsumptionPOI: true,
    marketScheduleLink: 'https://www.facebook.com/shuil.starmarket'
  }
];

// DOM 快取
const poiListEl = document.getElementById('poi-list');
const consumptionSectionEl = document.getElementById('poi17-consumption-section');
const consumptionButtons = document.querySelectorAll('.consumption-button');
const consumptionCodeInput = document.getElementById('consumption-code');
const submitConsumptionBtn = document.getElementById('submit-consumption');
const consumptionStatusEl = document.getElementById('consumption-status');

// 全域統計
let totalMileage = 0;           // 公尺
let totalCarbonReduction = 0;   // 克
let totalScore = 0;
let selectedConsumptionMileagePoints = 0;
let selectedConsumptionLabel = '';

// 初始化地圖
function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 23.8, lng: 120.5 },
    zoom: 8
  });
  pois.forEach(poi => {
    const marker = new google.maps.Marker({ position: poi.coords, map, title: poi.name });
    marker.addListener('click', () => openPoiModal(poi));
  });
}

// 打開 POI Modal
function openPoiModal(poi) {
  document.getElementById('poi17-description').innerHTML =
    poi.description.replace(/\n/g, '<br>');
  consumptionSectionEl.classList.toggle('hidden', !poi.isConsumptionPOI);
}

// 綁定消費按鈕
consumptionButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    consumptionButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedConsumptionMileagePoints = Number(btn.dataset.mileagePoints);
    selectedConsumptionLabel = btn.dataset.label;
  });
});

// 提交消費
submitConsumptionBtn.addEventListener('click', () => {
  const code = consumptionCodeInput.value.trim();
  if (code.length !== 5) {
    consumptionStatusEl.textContent = '請輸入正確 5 碼驗證碼';
    consumptionStatusEl.classList.add('text-red-600');
    return;
  }
  const mileageMeters = selectedConsumptionMileagePoints * 1000;
  const carbonReduction = selectedConsumptionMileagePoints * 4;
  const points = selectedConsumptionMileagePoints;

  totalMileage += mileageMeters;
  totalCarbonReduction += carbonReduction;
  totalScore += points;
  renderStats();

  consumptionStatusEl.textContent =
    `已記錄「${selectedConsumptionLabel}」，里程 ${selectedConsumptionMileagePoints} km，減碳 ${carbonReduction} g，積分 ${points}`;
  consumptionStatusEl.classList.remove('text-red-600');
  consumptionStatusEl.classList.add('text-green-600');
});

// 更新統計畫面
function renderStats() {
  document.getElementById('total-mileage').textContent = totalMileage;
  document.getElementById('total-carbon').textContent = totalCarbonReduction;
  document.getElementById('total-score').textContent = totalScore;
}

// 切換頁面
document.getElementById('btn-homepage').addEventListener('click', () => {
  document.getElementById('homepage').classList.add('block');
  document.getElementById('mission-page').classList.remove('block');
});
document.getElementById('btn-mission').addEventListener('click', () => {
  document.getElementById('mission-page').classList.add('block');
  document.getElementById('homepage').classList.remove('block');
});

// 啟動地圖
window.initMap = initMap;
