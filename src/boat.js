// ===== GO BACK TO DASHBOARD =====
function goBackToDashboard() {
  window.location.href = "index.html";
}

// ===== SHORE LOCATION =====
const shoreCoords = [9.874979892536736, 123.60819114958444];

// ===== SIMULATED BOAT PATH =====
// Used for now while real GPS is unavailable
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

// ===== CREATE FIXED MAP =====
// Fixed view only, no auto-fit and no auto-zoom
const boatMap = L.map("boat-map").setView([9.89, 123.62], 13);

// ===== LOAD MAP TILES =====
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors",
}).addTo(boatMap);

// ===== SHORE MARKER ICON =====
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
  .addTo(boatMap)
  .bindPopup("<b>Shore Monitoring Station</b><br>Lawis Point");

// ===== BOAT MARKER =====
const boatMarker = L.marker(boatPath[0])
  .addTo(boatMap)
  .bindPopup("<b>Fishing Boat</b><br>Orange Pi Boat Unit");

// ===== SAFE ZONE =====
L.circle(shoreCoords, {
  color: "#2ecc71",
  fillColor: "#2ecc71",
  fillOpacity: 0.15,
  radius: 5000,
})
  .addTo(boatMap)
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

// ===== STORE LATEST SENSOR DATA =====
// These match the fields written by main.py
let latestData = {
  rain: "UNKNOWN",
  obstacle: "UNKNOWN",
  distance_cm: null,
  wind_kmh: 0,
  gps: "UNAVAILABLE",
};

// ===== LOAD SENSOR DATA FROM status.json =====
async function loadBoatStatus() {
  try {
    const response = await fetch("status.json?t=" + Date.now());
    const data = await response.json();
    latestData = data;
  } catch (error) {
    console.error("Failed to load boat status:", error);
  }
}

// ===== UPDATE BOAT DETAIL CARDS =====
function updateCards(distanceKm) {
  const wind = document.getElementById("detail-wind-status");
  const obstacle = document.getElementById("detail-obstacle-status");
  const distance = document.getElementById("detail-distance-status");
  const boatStatus = document.getElementById("detail-boat-status");
  const distanceToShore = document.getElementById("distance-to-shore");
  const tilt = document.getElementById("detail-tilt-status");

  // ===== WIND SENSOR =====
  if (wind) {
    wind.textContent =
      latestData.wind_kmh !== null && latestData.wind_kmh !== undefined
        ? `${latestData.wind_kmh} km/h`
        : "No Data";
  }

  // ===== OBSTACLE SENSOR =====
  if (obstacle) {
    obstacle.textContent = latestData.obstacle || "UNKNOWN";
  }

  // ===== DISTANCE SENSOR =====
  if (distance) {
    distance.textContent =
      latestData.distance_cm !== null && latestData.distance_cm !== undefined
        ? `${latestData.distance_cm} cm`
        : "No reading";
  }

  // ===== DISTANCE TO SHORE =====
  if (distanceToShore) {
    distanceToShore.textContent = `${distanceKm.toFixed(2)} km`;
  }

  // ===== TILT SENSOR =====
  // Still placeholder because your main.py does not provide tilt yet
  if (tilt) {
    tilt.textContent = "No Data";
  }

  // ===== BOAT STATUS =====
  if (boatStatus) {
    if (latestData.obstacle === "DETECTED") {
      boatStatus.textContent = "Warning - Obstacle";
    } else {
      boatStatus.textContent = "Active - Safe";
    }
  }
}

// ===== MOVE ONLY THE BOAT MARKER =====
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
    Latitude: ${coords[0].toFixed(6)}<br>
    Longitude: ${coords[1].toFixed(6)}<br>
    Distance from Shore: ${distanceKm.toFixed(2)} km
  `);

  updateCards(distanceKm);
}

// ===== FIX MAP RESIZE =====
window.addEventListener("resize", () => {
  boatMap.invalidateSize();
});

// ===== INITIAL LOAD =====
loadBoatStatus();
moveBoat();

// ===== AUTO REFRESH =====
setInterval(loadBoatStatus, 2000);
setInterval(moveBoat, 2000);
