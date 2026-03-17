// Lawis Point - Shore Monitoring Station
const shoreCoords = [9.874979892536736, 123.60819114958444];

// Simulated boat path (used for now while GPS is unavailable)
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

// Create map
const map = L.map("map").setView(shoreCoords, 12);

// Load map tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Red icon for shore
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Shore marker
const shoreMarker = L.marker(shoreCoords, { icon: redIcon })
  .addTo(map)
  .bindPopup("<b>Shore Monitoring Station</b><br>Lawis Point - Orange Pi");

// Boat marker
const boatMarker = L.marker(boatPath[0])
  .addTo(map)
  .bindPopup("<b>Fishing Boat</b><br>Orange Pi Boat Unit");

// Route line
const routeLine = L.polyline([shoreCoords, boatPath[0]], {
  color: "blue",
  weight: 3,
}).addTo(map);

// Safe zone circle (5 km)
const safeZone = L.circle(shoreCoords, {
  color: "#2ecc71",
  fillColor: "#2ecc71",
  fillOpacity: 0.15,
  radius: 5000,
})
  .addTo(map)
  .bindPopup("LoRa Communication Range (5km)");

// Fit map to show both markers at start
map.fitBounds(routeLine.getBounds());

// Helper: calculate distance in km
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

// Update boat location info
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

// Update sensor status from status.json
async function loadStatus() {
  try {
    const response = await fetch("status.json?t=" + Date.now());
    const data = await response.json();

    const rainStatus = document.getElementById("rain-status");
    const obstacleStatus = document.getElementById("obstacle-status");
    const distanceStatus = document.getElementById("distance-status");
    const gpsStatus = document.getElementById("gps-status");
    const weatherCondition = document.getElementById("weather-condition");
    const systemStatus = document.getElementById("system-status");

    if (rainStatus) {
      rainStatus.textContent = data.rain || "UNKNOWN";
    }

    if (obstacleStatus) {
      obstacleStatus.textContent = data.obstacle || "UNKNOWN";
    }

    if (distanceStatus) {
      distanceStatus.textContent =
        data.distance_cm !== null && data.distance_cm !== undefined
          ? `${data.distance_cm} cm`
          : "No reading";
    }

    if (gpsStatus) {
      gpsStatus.textContent = data.gps || "UNAVAILABLE";
    }

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

// Animate boat movement for now
let currentIndex = 0;

function moveBoat() {
  currentIndex = (currentIndex + 1) % boatPath.length;
  const newCoords = boatPath[currentIndex];

  boatMarker.setLatLng(newCoords);
  routeLine.setLatLngs([shoreCoords, newCoords]);

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

// Initial load
moveBoat();
loadStatus();

// Refresh every 2 seconds
setInterval(moveBoat, 2000);
setInterval(loadStatus, 2000);
function updateStatus() {
  fetch("status.json")
    .then((res) => res.json())
    .then((data) => {
      console.log(data); // for debugging

      const rain = document.getElementById("rain-status");
      const obstacle = document.getElementById("obstacle-status");
      const distance = document.getElementById("distance-status");

      if (rain) rain.textContent = data.rain;
      if (obstacle) obstacle.textContent = data.obstacle;
      if (distance) {
        distance.textContent =
          data.distance_cm !== null
            ? data.distance_cm + " cm"
            : "No data";
      }
    })
    .catch((err) => console.error("Fetch error:", err));
}

// run every 2 seconds
setInterval(updateStatus, 2000);
function updateStatus() {
  fetch("status.json")
    .then((res) => res.json())
    .then((data) => {
      console.log(data); // for debugging

      const rain = document.getElementById("rain-status");
      const obstacle = document.getElementById("obstacle-status");
      const distance = document.getElementById("distance-status");

      if (rain) rain.textContent = data.rain;
      if (obstacle) obstacle.textContent = data.obstacle;
      if (distance) {
        distance.textContent =
          data.distance_cm !== null
            ? data.distance_cm + " cm"
            : "No data";
      }
    })
    .catch((err) => console.error("Fetch error:", err));
}

// run every 2 seconds
setInterval(updateStatus, 2000);
