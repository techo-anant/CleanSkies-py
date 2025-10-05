// static/js/map.js

// Approx Canada bounds (southwest, northeast)
const canadaBounds = L.latLngBounds(
  [41.0, -141.0], // SW (near Windsor/Vancouver Island south edge)
  [84.0, -52.0]   // NE (far north / Newfoundland east edge)
);

// Center on Canada (roughly Nunavut)
const initialCenter = [56.0, -96.0];

const map = L.map('map', {
  center: initialCenter,
  zoom: 4,
  minZoom: 3,                 // prevent zooming too far out
  maxZoom: 12,                // cap max zoom if tiles get slow
  maxBounds: canadaBounds,    // hard bounding box
  maxBoundsViscosity: 1.0,    // â€œelastic wallâ€ (1.0 = hard)
  worldCopyJump: false        // donâ€™t wrap to another world copy
});

// make it globally accessible if you use invalidateSize()
window.map = map;

// Use tiles with noWrap so the map won't wrap around the world copies
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  noWrap: true,               // important for bounds
  bounds: canadaBounds        // hint to the tile layer
}).addTo(map);

let marker;

// make the map global and accessible 
window.map = map;

// Debounce rapid clicks (prevents flicker)
let loadTimer;
function debounceLoad(lat, lon, ms=200) {
  clearTimeout(loadTimer);
  loadTimer = setTimeout(() => loadAir(lat, lon), ms);
}


// ====== sidebar toggle logic ======
const sidebar  = document.getElementById('sidebar');
const closeBtn = document.getElementById('closeSidebar');
const openBtn  = document.getElementById('openSidebarBtn');

function openSidebar()  {
  if (!sidebar) return;
  sidebar.classList.add('open');
  document.body.classList.add('sidebar-open');
  // wait for CSS transition, then resize the map
  setTimeout(() => { if (window.map && map.invalidateSize) map.invalidateSize(); }, 320);
}

function closeSidebar() {
  if (!sidebar) return;
  sidebar.classList.remove('open');
  document.body.classList.remove('sidebar-open');
  setTimeout(() => { if (window.map && map.invalidateSize) map.invalidateSize(); }, 320);
}

if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
if (openBtn)  openBtn.addEventListener('click', openSidebar);


// 2. helper: advice
function adviceFromAqi(label) {
  switch (label) {
    case 'Good': return 'Air quality is good â€” enjoy outdoor activities.';
    case 'Fair': return 'Fair â€” sensitive groups should monitor symptoms.';
    case 'Moderate': return 'Moderate â€” consider shorter outdoor activity if sensitive.';
    case 'Poor': return 'Poor â€” limit strenuous outdoor activity.';
    case 'Very Poor': return 'Very Poor â€” avoid outdoor activity if possible.';
    default: return 'â€”';
  }
}

// 3. helper: number formatting
function fmt(n, d = 1) {
  return (n == null) ? 'â€”' : Number(n).toFixed(d);
}

// helper: aqi Colors
function aqiColor(label) {
  return {
    "Good":      "#34d399", // green
    "Fair":      "#fbbf24", // yellow
    "Moderate":  "#f59e0b", // amber
    "Poor":      "#f87171", // red
    "Very Poor": "#9b1c1c"  // dark red
  }[label] || "#e5e7eb";    // gray default
}

// helper: city name fallback
async function reverseGeocode(lat, lon) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const j = await r.json();
    return j.address?.city ||
           j.address?.town ||
           j.address?.village ||
           j.display_name?.split(",")[0] ||
           "";
  } catch {
    return "";
  }
}


// 4) Update sidebar content + marker, then open the panel
async function updateSidebar(data, lat, lon) {
  const ok    = !!(data && data.ok);
  const aqi   = ok ? data.aqi : 'â€”';
  const label = ok ? data.aqi_label : 'â€”';
  const src   = ok ? data.source : 'â€”';
  const wx    = (ok && data.weather) ? data.weather : {};
  const comps = (data && data.components) ? data.components : {};

  // --- city/title (with fallback if city missing) ---
  const cityEl = document.getElementById('cityName');
  if (cityEl) {
    if (wx.city) {
      cityEl.textContent = wx.city;
    } else {
      // fallback: reverse geocode to nearest town; if that fails, show coordinates
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const j = await r.json();
        cityEl.textContent =
          j.address?.city || j.address?.town || j.address?.village ||
          `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      } catch {
        cityEl.textContent = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      }
    }
  }

  // --- AQI core values + advice ---
  const aqiValueEl = document.getElementById('aqiValue');
  const aqiCatEl   = document.getElementById('aqiCat');
  const adviceEl   = document.getElementById('advice');

  if (aqiValueEl) aqiValueEl.textContent = aqi;
  if (aqiCatEl)   aqiCatEl.textContent   = label;
  if (adviceEl)   adviceEl.textContent   = adviceFromAqi(label);

  // --- Weather row ---
  const tempEl = document.getElementById('temp');
  const windEl = document.getElementById('wind');
  if (tempEl) tempEl.textContent = (wx.temp_c != null) ? `${fmt(wx.temp_c, 0)} Â°C` : 'â€”';
  if (windEl) windEl.textContent = (wx.wind_kmh != null) ? `${fmt(wx.wind_kmh, 0)} km/h` : 'â€”';

  // --- Source + updated time ---
  const srcEl     = document.getElementById('source');
  const updatedEl = document.getElementById('updated');
  if (srcEl)     srcEl.textContent     = src;
  if (updatedEl) updatedEl.textContent = data.timestamp || data.lastUpdated || new Date().toLocaleTimeString();

  // --- Marker + popup on the map ---
  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lon]).addTo(map);
  marker.bindPopup(ok ? `AQI: ${aqi} (${label})` : 'AQI unavailable').openPopup();

  // --- AQI card color (uses your helper aqiColor) ---
  const card = document.getElementById('aqiBox');
  if (card) {
    card.style.background = aqiColor(label);
    // optional: improve contrast for darker backgrounds
    card.style.color = (label === 'Poor' || label === 'Very Poor') ? 'white' : '#111827';
  }

  // --- pollutant chips ---
  const pm25El = document.getElementById('pm25');
  const pm10El = document.getElementById('pm10');
  if (pm25El) pm25El.textContent = `PM2.5 ${fmt(comps.pm2_5)} Âµg/mÂ³`;
  if (pm10El) pm10El.textContent = `PM10 ${fmt(comps.pm10)} Âµg/mÂ³`;

  // --- finally: reveal the sidebar ---
  openSidebar(); // adds .open class + shifts map (your helpers handle invalidateSize)
}


// ====== center panel (modal) logic ======
const openModalBtn  = document.getElementById('openModalBtn');
const modalBackdrop = document.getElementById('modalBackdrop');
const closeModalBtn = document.getElementById('closeModalBtn');

function openModal() {
  modalBackdrop.classList.add('show');
  modalBackdrop.style.display = 'flex';   // optional
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalBackdrop.classList.remove('show');
  modalBackdrop.style.display = '';       // optional: lets CSS take over
  document.body.style.overflow = '';
}


if (openModalBtn)  openModalBtn.addEventListener('click', openModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
// click on backdrop closes the modal
if (modalBackdrop) modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});
// ESC key closes the modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});



// 7. fetch data from backend
async function loadAir(lat, lon) {
  try {
    const res = await fetch(`/api/air?lat=${lat}&lon=${lon}`);
    const data = await res.json();
    updateSidebar(data, lat, lon);
  } catch (e) {
    console.error('air fetch failed', e);
    updateSidebar({ ok: false }, lat, lon);
  }
}

function clampToBounds(latlng) {
  const b = canadaBounds;
  const lat = Math.min(Math.max(latlng.lat, b.getSouth()), b.getNorth());
  const lon = Math.min(Math.max(latlng.lng, b.getWest()),  b.getEast());
  return L.latLng(lat, lon);
}

map.on('click', (ev) => {
  const clamped = clampToBounds(ev.latlng);
  if (!canadaBounds.contains(ev.latlng)) {
    map.panTo(clamped, { animate: true });
  }
  debounceLoad(clamped.lat, clamped.lng);
});