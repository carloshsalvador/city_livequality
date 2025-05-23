// Enhanced script.js with explicit tile and geojson loading coordination
console.log("Leaflet version:", L);

let map;
let geoLayer = null;
let scaleControl = null;
let currentData = null;

let weights = {
  green: 1.0,
  summer: 1.0,
  hot: 1.0,
  trop: 1.0,
  pm25: 1.0,
  no2: 1.0
};

function getWeights() {
  weights.green = parseFloat(document.getElementById("wGreen")?.value || 1.0);
  weights.summer = parseFloat(document.getElementById("wSummer")?.value || 1.0);
  weights.hot = parseFloat(document.getElementById("wHot")?.value || 1.0);
  weights.trop = parseFloat(document.getElementById("wTrop")?.value || 1.0);
  weights.pm25 = parseFloat(document.getElementById("wPM25")?.value || 1.0);
  weights.no2 = parseFloat(document.getElementById("wNO2")?.value || 1.0);
  console.log("Updated weights:", weights);
}

function updateSliderLabels() {
  document.getElementById("valGreen").innerText = weights.green.toFixed(2);
  document.getElementById("valSummer").innerText = weights.summer.toFixed(2);
  document.getElementById("valHot").innerText = weights.hot.toFixed(2);
  document.getElementById("valTrop").innerText = weights.trop.toFixed(2);
  document.getElementById("valPM25").innerText = weights.pm25.toFixed(2);
  document.getElementById("valNO2").innerText = weights.no2.toFixed(2);
}

function calculateLQI(properties, weights) {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const score = (
    weights.green * properties.green_per_norm +
    weights.summer * properties.summerday_norm +
    weights.hot * properties.hotday_norm +
    weights.trop * properties.Tropicalnights_norm +
    weights.pm25 * properties.pm25_norm +
    weights.no2 * properties.no2_norm
  );
  return score / totalWeight;
}

function getContinuousColor(lqi) {
  const v = Math.max(0, Math.min(1, lqi));
  const r = Math.round((1 - v) * 255);
  const g = Math.round(v * 255);
  return `rgb(${r},${g},100)`;
}

function styleFeature(feature, weights) {
  const lqi = calculateLQI(feature.properties, weights);
  return {
    fillColor: getContinuousColor(lqi),
    weight: 2,
    opacity: 1,
    color: "white",
    fillOpacity: 0.7
  };
}

function drawGeoLayer(data) {
  if (geoLayer) map.removeLayer(geoLayer);
  geoLayer = L.geoJSON(data, {
    style: (feature) => styleFeature(feature, weights),
    onEachFeature: (feature, layer) => {
      const lqi = calculateLQI(feature.properties, weights);
      layer.bindPopup(`<b>${feature.properties.name || "Area"}</b><br>LQI: ${lqi.toFixed(3)}`);
    }
  }).addTo(map);

  if (data.features.length > 0) {
    const bounds = geoLayer.getBounds();
    map.fitBounds(bounds);
  } else {
    console.warn("No features in GeoJSON.");
  }
}

function loadTiles(tileProvider) {
  return new Promise(resolve => {
    if (tileProvider === "none") {
      resolve(null);
      return;
    }

    let tileURL = "", attribution = "";
    switch (tileProvider) {
      case "osm-hot":
        tileURL = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
        attribution = "&copy; OpenStreetMap contributors";
        break;
      case "carto":
        tileURL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
        attribution = "&copy; OpenStreetMap & CARTO";
        break;
      case "stamen":
        tileURL = "https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png";
        attribution = "Map tiles by Stamen Design, &copy; OpenStreetMap contributors";
        break;
      default:
        tileURL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
        attribution = "&copy; OpenStreetMap contributors";
    }

    const layer = L.tileLayer(tileURL, {
      attribution,
      subdomains: ["a", "b", "c"],
      maxZoom: 19
    });

    layer.on("load", () => {
      console.log("Tiles loaded");
      resolve(layer);
    });
    layer.on("tileerror", () => {
      console.warn("Tile error occurred");
      resolve(layer);
    });

    resolve(layer); // Add immediately; listener resolves load
  });
}

function updateMap(data) {
  currentData = data;
  getWeights();
  updateSliderLabels();

  if (!map) {
    const center = data.meta?.map_center ? [data.meta.map_center[1], data.meta.map_center[0]] : [52.5, 13.4];
    const zoom = data.meta?.map_zoom || 11;
    map = L.map("map", { center, zoom });
    scaleControl = L.control.scale({ imperial: false }).addTo(map);
  }

  const tileProvider = data.meta?.map_tile || "osm";
  loadTiles(tileProvider).then(tileLayer => {
    if (tileLayer) tileLayer.addTo(map);
    drawGeoLayer(data);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  updateSliderLabels();

  fetch("data.geojson")
    .then(response => response.json())
    .then(data => {
      console.log("GeoJSON loaded");
      updateMap(data);
    });

  ["wGreen", "wSummer", "wHot", "wTrop", "wPM25", "wNO2"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", () => {
      getWeights();
      updateSliderLabels();
      updateMap(currentData);
    });
  });
});
