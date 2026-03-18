function goBackToDashboard() {
  window.location.href = "index.html";
}

const shoreCoords = [9.874979892536736, 123.60819114958444];

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

// MAP
const boatMap = L.map("boat-map").setView(boatPath[0], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors",
}).addTo(boatMap);

// Shore marker
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.marker(shoreCoords, { icon: redIcon })
  .addTo(boatMap)
  .bindPopup("<b>Shore Monitoring Station</b><br>Lawis Point");

// Boat marker
const boatMarker = L.marker(boatPath[0])
  .addTo(boatMap)
  .bindPopup("<b>Fishing Boat</b><br>Orange Pi Boat Unit");

// Line
const routeLine = L.polyline([shoreCoords, boatPath[0]], {
  color: "blue",
  weight: 3,
}).addTo(boatMap);

// Safe zone
L.circle(shoreCoords, {
  color: "#2ecc71",
  fillColor: "#2ecc71",
  fillOpacity: 0.15,
  radius: 5000,
}).addTo(boatMap);

// Distance calculator
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

// Store latest sensor data
let latestData = {
  obstacle: "UNKNOWN",
  distance_cm: null,
};

// Load sensor data
async function loadBoatStatus() {
  try {
    const response = await fetch("status.json?t=" + Date.now());
    const data = await response.json();
    latestData = data;
  } catch (error) {
    console.error("Failed to load boat status:", error);
  }
}

// Update UI
function updateCards(distanceKm) {
  const wind = document.getElementById("detail-wind-status");
  const obstacle = document.getElementById("detail-obstacle-status");
  const distance = document.getElementById("detail-distance-status");
  const boatStatus = document.getElementById("detail-boat-status");
  const distanceToShore = document.getElementById("distance-to-shore");
  const tilt = document.getElementById("detail-tilt-status");

  // Wind (placeholder)
  if (wind) wind.textContent = "No Data";

  // Obstacle
  if (obstacle) {
    obstacle.textContent = latestData.obstacle || "UNKNOWN";
  }

  // Distance (sensor)
  if (distance) {
    distance.textContent =
      latestData.distance_cm !== null && latestData.distance_cm !== undefined
        ? `${latestData.distance_cm} cm`
        : "No reading";
  }

  // Distance to shore
  if (distanceToShore) {
    distanceToShore.textContent = `${distanceKm.toFixed(2)} km`;
  }

  // Tilt (placeholder)
  if (tilt) tilt.textContent = "No Data";

  // Boat status
  if (boatStatus) {
    boatStatus.textContent =
      latestData.obstacle === "DETECTED"
        ? "Warning - Obstacle"
        : "Active - Safe";
  }
}

// Movement
let currentIndex = 0;

function moveBoat() {
  currentIndex = (currentIndex + 1) % boatPath.length;
  const coords = boatPath[currentIndex];

  boatMarker.setLatLng(coords);
  routeLine.setLatLngs([shoreCoords, coords]);

  const distanceKm = calculateDistance(
    shoreCoords[0],
    shoreCoords[1],
    coords[0],
    coords[1],
  );

  // Auto-fit map to both points
  const bounds = L.latLngBounds([shoreCoords, coords]);
  boatMap.fitBounds(bounds, { padding: [40, 40] });

  boatMarker.bindPopup(`
    <b>Fishing Boat</b><br>
    Latitude: ${coords[0].toFixed(6)}<br>
    Longitude: ${coords[1].toFixed(6)}<br>
    Distance: ${distanceKm.toFixed(2)} km
  `);

  updateCards(distanceKm);
}

// Fix resize bug
window.addEventListener("resize", () => {
  boatMap.invalidateSize();
});

// INIT
loadBoatStatus();
moveBoat();

setInterval(loadBoatStatus, 2000);
setInterval(moveBoat, 2000);
