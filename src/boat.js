// ===== GO BACK TO DASHBOARD =====
function goBackToDashboard() {
  window.location.href = "index.html";
}

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

// ===== CREATE MAP =====
const boatMap = L.map("boat-map").setView([9.89, 123.62], 13);

// ===== MAP TILES =====
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors",
}).addTo(boatMap);

// ===== SHORE ICON =====
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// ===== SHORE MARKER =====
L.marker(shoreCoords, { icon: redIcon })
  .addTo(boatMap)
  .bindPopup("<b>Shore Monitoring Station</b><br>Lawis Point");

// ===== BOAT MARKER =====
const boatMarker = L.marker(boatPath[0])
  .addTo(boatMap)
  .bindPopup("<b>Fishing Boat</b>");

// ===== SAFE ZONE =====
L.circle(shoreCoords, {
  color: "#2ecc71",
  fillColor: "#2ecc71",
  fillOpacity: 0.15,
  radius: 5000,
}).addTo(boatMap);

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

// ===== SENSOR DATA =====
let latestData = {
  rain: "UNKNOWN",
  obstacle: "UNKNOWN",
  distance_cm: null,
  wind_kmh: 0,
  tilt_angle: null,
  tilt_status: "UNKNOWN",
};

// ===== LOAD DATA =====
async function loadBoatStatus() {
  try {
    const response = await fetch("status.json?t=" + Date.now());
    const data = await response.json();
    latestData = data;
  } catch (error) {
    console.error("Failed to load boat status:", error);
  }
}

// ===== UPDATE UI =====
function updateCards(distanceKm) {
  const wind = document.getElementById("detail-wind-status");
  const obstacle = document.getElementById("detail-obstacle-status");
  const distance = document.getElementById("detail-distance-status");
  const boatStatus = document.getElementById("detail-boat-status");
  const distanceToShore = document.getElementById("distance-to-shore");

  const tiltAngle = document.getElementById("detail-tilt-angle");
  const tiltStatus = document.getElementById("detail-tilt-status");

  // WIND
  if (wind) {
    wind.textContent =
      latestData.wind_kmh != null ? `${latestData.wind_kmh} km/h` : "No Data";
  }

  // OBSTACLE
  if (obstacle) {
    obstacle.textContent = latestData.obstacle || "UNKNOWN";
  }

  // DISTANCE SENSOR
  if (distance) {
    distance.textContent =
      latestData.distance_cm != null
        ? `${latestData.distance_cm} cm`
        : "No reading";
  }

  // DISTANCE TO SHORE
  if (distanceToShore) {
    distanceToShore.textContent = `${distanceKm.toFixed(2)} km`;
  }

  // ===== ✅ TILT ANGLE =====
  if (tiltAngle) {
    tiltAngle.textContent =
      latestData.tilt_angle != null ? `${latestData.tilt_angle}°` : "--";
  }

  // ===== ✅ TILT STATUS + COLOR =====
  if (tiltStatus) {
    tiltStatus.textContent = latestData.tilt_status || "UNKNOWN";

    if (latestData.tilt_status === "Flat") {
      tiltStatus.style.color = "green";
    } else if (latestData.tilt_status === "Slight") {
      tiltStatus.style.color = "orange";
    } else if (latestData.tilt_status === "Danger") {
      tiltStatus.style.color = "red";
    } else {
      tiltStatus.style.color = "gray";
    }
  }

  // ===== BOAT STATUS =====
  if (boatStatus) {
    if (latestData.tilt_status === "Danger") {
      boatStatus.textContent = "⚠️ Danger - Tilt Critical";
    } else if (latestData.obstacle === "DETECTED") {
      boatStatus.textContent = "Warning - Obstacle";
    } else {
      boatStatus.textContent = "Active - Safe";
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

  updateCards(distanceKm);
}

// ===== RESIZE FIX =====
window.addEventListener("resize", () => {
  boatMap.invalidateSize();
});

// ===== INIT =====
loadBoatStatus();
moveBoat();

// ===== AUTO REFRESH =====
setInterval(loadBoatStatus, 2000);
setInterval(moveBoat, 2000);
