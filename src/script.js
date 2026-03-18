// ===== SHORE LOCATION =====
const shoreCoords = [9.874979892536736, 123.60819114958444];

// ===== SIMULATED BOAT PATH =====
// Used for now while GPS is unavailable
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

// ===== CREATE MAP =====
// Fixed view only, no auto zooming in and out
const map = L.map("map").setView([9.89, 123.62], 13);

// ===== LOAD MAP TILES =====
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// ===== SHORE ICON =====
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ===== SHORE MARKER =====
L.marker(shoreCoords, { icon: redIcon })
  .addTo(map)
  .bindPopup("<b>Shore Monitoring Station</b><br>Lawis Point - Orange Pi");

// ===== BOAT MARKER =====
const boatMarker = L.marker(boatPath[0])
  .addTo(map)
  .bindPopup("<b>Fishing Boat</b><br>Orange Pi Boat Unit");

// ===== SAFE ZONE CIRCLE =====
L.circle(shoreCoords, {
  color: "#2ecc71",
  fillColor: "#2ecc71",
  fillOpacity: 0.15,
  radius: 5000,
})
  .addTo(map)
  .bindPopup("LoRa Communication Range (5km)");

// ===== DISTANCE CALCULATOR =====
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ===== UPDATE BOAT INFO ON DASHBOARD =====
function updateBoatInfo(coords, distanceKm) {
  const [lat, lng] = coords;

  const boatLat = document.getElementById("boat-lat");
  const boatLng = document.getElementById("boat-lng");
  const boatStatus = document.getElementById("boat-status");
  const alertsToday = document.getElementById("alerts-today");

  if (boatLat) boatLat.textContent = lat.toFixed(6);
  if (boatLng) boatLng.textContent = lng.toFixed(6);

  if (boatStatus) {
    boatStatus.textContent =
      distanceKm <= 5 ? "Active - Within Range" : "Warning - Out of Range";
  }

  if (alertsToday) {
    alertsToday.textContent = distanceKm <= 5 ? "00" : "01";
  }
}

// ===== LOAD STATUS FROM status.json =====
async function loadStatus() {
  try {
    const response = await fetch("status.json?t=" + Date.now());
    const data = await response.json();

    const weatherCondition = document.getElementById("weather-condition");
    const systemStatus = document.getElementById("system-status");

    if (weatherCondition) {
      weatherCondition.textContent =
        data.rain === "DETECTED" ? "Rain Detected" : "Fair";
    }

    if (systemStatus) {
      systemStatus.textContent = "System Online";
    }
  } catch (error) {
    console.error("Failed to load status.json:", error);

    const systemStatus = document.getElementById("system-status");
    if (systemStatus) {
      systemStatus.textContent = "System Offline";
    }
  }
}

// ===== OPEN BOAT DETAILS PAGE =====
function goToBoatPage() {
  window.location.href = "boat.html";
}

// ===== MOVE ONLY THE BOAT MARKER =====
let currentIndex = 0;

function moveBoat() {
  currentIndex = (currentIndex + 1) % boatPath.length;
  const newCoords = boatPath[currentIndex];

  boatMarker.setLatLng(newCoords);

  const distanceKm = calculateDistance(
    shoreCoords[0],
    shoreCoords[1],
    newCoords[0],
    newCoords[1],
  );

  boatMarker.bindPopup(`
    <b>Fishing Boat</b><br>
    Orange Pi Boat Unit<br>
    Latitude: ${newCoords[0].toFixed(6)}<br>
    Longitude: ${newCoords[1].toFixed(6)}<br>
    Distance from Shore: ${distanceKm.toFixed(2)} km
  `);

  updateBoatInfo(newCoords, distanceKm);
}

// ===== RESIZE MAP ONLY =====
window.addEventListener("resize", () => {
  map.invalidateSize();
});

// ===== INITIAL LOAD =====
moveBoat();
loadStatus();

// ===== AUTO REFRESH =====
setInterval(moveBoat, 2000);
setInterval(loadStatus, 2000);
