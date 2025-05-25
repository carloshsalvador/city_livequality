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

    layer.addTo(map); // Add immediately
  });
}

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
  // Atualiza os valores exibidos ao lado dos sliders
  document.getElementById("valGreen").textContent = document.getElementById("wGreen").value;
  document.getElementById("valSummer").textContent = document.getElementById("wSummer").value;
  document.getElementById("valHot").textContent = document.getElementById("wHot").value;
  document.getElementById("valTrop").textContent = document.getElementById("wTrop").value;
  document.getElementById("valPM25").textContent = document.getElementById("wPM25").value;
  document.getElementById("valNO2").textContent = document.getElementById("wNO2").value;
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
    drawGeoLayer(data); // Draw polygons after tiles are loaded
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