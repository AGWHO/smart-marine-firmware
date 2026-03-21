// ===== SHORE LOCATION =====
const shoreCoords = [9.874979892536736, 123.60819114958444];

// ===== SIMULATED BOAT PATH =====
const boatPath = [
  [9.905, 123.64],
  [9.9, 123.635],
  [9.895, 123.63],
  [9.89, 123.625],
  [9.885, 123.62],
  [9.88, 123.615],
  [9.878, 123.612],
  [9.882, 123.618],
  [9.888, 123.626],
  [9.894, 123.633],
  [9.9, 123.639],
];

// ===== MAP SETUP =====
const map = L.map("map").setView([9.89, 123.62], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// ===== SHORE MARKER =====
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.marker(shoreCoords, { icon: redIcon })
  .addTo(map)
  .bindPopup("<b>Shore Monitoring Station</b><br>Lawis Point");

// ===== BOAT MARKER =====
const boatMarker = L.marker(boatPath[0])
  .addTo(map)
  .bindPopup("<b>Fishing Boat</b>");

// ===== SAFE ZONE =====
L.circle(shoreCoords, {
  color: "#2ecc71",
  fillColor: "#2ecc71",
  fillOpacity: 0.15,
  radius: 5000,
}).addTo(map);

// ===== DISTANCE FUNCTION =====
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ===== NAVIGATION =====
function goToBoatPage() {
  window.location.href = "boat.html";
}

// ===== ALERT SYSTEM =====
function triggerAlert(message) {
  const banner = document.getElementById("alert-banner");
  if (!banner) return;

  banner.textContent = "⚠️ " + message;
  banner.classList.remove("hidden");
}

// ===== CLEAR ALERT =====
function clearAlert() {
  const banner = document.getElementById("alert-banner");
  if (!banner) return;

  banner.classList.add("hidden");
}

// ===== UPDATE DASHBOARD INFO =====
function updateBoatInfo(coords, distanceKm, data) {
  const [lat, lng] = coords;

  const boatLat = document.getElementById("boat-lat");
  const boatLng = document.getElementById("boat-lng");
  const boatStatus = document.getElementById("boat-status");
  const alertsToday = document.getElementById("alerts-today");

  if (boatLat) boatLat.textContent = lat.toFixed(6);
  if (boatLng) boatLng.textContent = lng.toFixed(6);

  // ===== STATUS LOGIC =====
  if (boatStatus) {
    if (data?.tilt_status === "Danger") {
      boatStatus.textContent = "⚠️ Tilt Danger";
      boatStatus.className = "danger";
      triggerAlert("Boat tilt is dangerous!");
    } else if (distanceKm > 5) {
      boatStatus.textContent = "⚠️ Out of Range";
      boatStatus.className = "warning";
      triggerAlert("Boat out of safe range!");
    } else {
      boatStatus.textContent = "Active - Safe";
      boatStatus.className = "safe";
      clearAlert();
    }
  }

  // ===== ALERT COUNT =====
  if (alertsToday) {
    let count = 0;
    if (distanceKm > 5) count++;
    if (data?.tilt_status === "Danger") count++;

    alertsToday.textContent = count.toString().padStart(2, "0");
  }
}

// ===== LOAD SENSOR DATA =====
let latestData = {};

async function loadStatus() {
  try {
    const response = await fetch("status.json?t=" + Date.now());
    const data = await response.json();
    latestData = data;

    const weather = document.getElementById("weather-condition");
    const system = document.getElementById("system-status");

    if (weather) {
      weather.textContent = data.rain === "DETECTED" ? "Rain Detected" : "Fair";
    }

    if (system) {
      system.textContent = "🟢 Online";
    }
  } catch (error) {
    console.error("Status load failed:", error);

    const system = document.getElementById("system-status");
    if (system) {
      system.textContent = "🔴 Offline";
    }
  }
}

// ===== BOAT MOVEMENT =====
let currentIndex = 0;

function moveBoat() {
  currentIndex = (currentIndex + 1) % boatPath.length;
  const coords = boatPath[currentIndex];

  boatMarker.setLatLng(coords);

  const distanceKm = calculateDistance(
    shoreCoords[0],
    shoreCoords[1],
    coords[0],
    coords[1],
  );

  boatMarker.bindPopup(`
    <b>Fishing Boat</b><br>
    Lat: ${coords[0].toFixed(6)}<br>
    Lng: ${coords[1].toFixed(6)}<br>
    Distance: ${distanceKm.toFixed(2)} km
  `);

  updateBoatInfo(coords, distanceKm, latestData);
}

// ===== FIX MAP RESIZE =====
window.addEventListener("resize", () => {
  map.invalidateSize();
});

// ===== INIT =====
moveBoat();
loadStatus();

// ===== AUTO REFRESH =====
setInterval(moveBoat, 2000);
setInterval(loadStatus, 2000);
