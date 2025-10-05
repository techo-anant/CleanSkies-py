// --- Map centered on Canada ---
const map = L.map('map', {
  center: [56.1304, -106.3468],
  zoom: 4,
  minZoom: 3,
  maxZoom: 12
});

// Limit movement to Canada
const canadaBounds = [[41.7, -141.0],[83.1, -52.6]];
map.setMaxBounds(canadaBounds);
map.on('drag', () => map.panInsideBounds(canadaBounds, { animate: false }));

// Base tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

// Sample stations (replace with live later)
const stations = [
  { city: "Windsor Downtown", lat: 42.314, lon: -83.04, aqi: 55,  temp: 22, wind: "15 km/h" },
  { city: "West Windsor",     lat: 42.290, lon: -83.08, aqi: 120, temp: 21, wind: "12 km/h" },
  { city: "Tecumseh",         lat: 42.320, lon: -82.90, aqi: 38,  temp: 23, wind: "10 km/h" }
];

function aqiCategory(aqi){
  if (aqi <= 50)  return { label:"Good",               color:"#86efac" };
  if (aqi <= 100) return { label:"Moderate",           color:"#fde68a" };
  if (aqi <= 150) return { label:"Unhealthy (SG)",     color:"#fdba74" };
  if (aqi <= 200) return { label:"Unhealthy",          color:"#f87171" };
  return               { label:"Very Unhealthy",       color:"#c4b5fd" };
}
function adviceFor(aqi){
  if (aqi <= 50)  return "Air quality is good — enjoy outdoor activities.";
  if (aqi <= 100) return "Moderate — sensitive people should limit prolonged exertion.";
  if (aqi <= 150) return "Sensitive groups: reduce prolonged or heavy exertion outdoors.";
  if (aqi <= 200) return "Unhealthy — everyone should reduce prolonged outdoor exertion.";
  return "Very Unhealthy — avoid outdoor activity if possible.";
}

// Sidebar refs
const sidebar = document.getElementById('sidebar');
const closeBtn = document.getElementById('closeSidebar');
closeBtn?.addEventListener('click', () => sidebar.style.transform = 'translateX(-100%)');

// Add colored markers + click handlers
stations.forEach(s => {
  const cat = aqiCategory(s.aqi);
  const marker = L.circleMarker([s.lat, s.lon], {
    radius: 10, color: cat.color, fillColor: cat.color, fillOpacity: 0.9
  }).addTo(map);

  marker.bindPopup(`${s.city}<br/>AQI: ${s.aqi} (${cat.label})`);

  marker.on('click', () => {
    document.getElementById('cityName').textContent = s.city;
    document.getElementById('aqiValue').textContent = s.aqi;
    document.getElementById('aqiCat').textContent = cat.label;
    document.getElementById('aqiBox').style.background = cat.color;
    document.getElementById('advice').textContent = adviceFor(s.aqi);
    document.getElementById('temp').textContent = `${s.temp}°C`;
    document.getElementById('wind').textContent = s.wind;
    document.getElementById('source').textContent = 'OpenAQ (sample)';
    document.getElementById('updated').textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    sidebar.style.transform = 'translateX(0)'; // show
  });
});
