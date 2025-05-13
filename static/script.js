let map;
let geoLayer = null;

function getWeights() {
  return {
    green: parseFloat(document.getElementById("wGreen").value),
    summer: parseFloat(document.getElementById("wSummer").value),
    hot: parseFloat(document.getElementById("wHot").value),
    trop: parseFloat(document.getElementById("wTrop").value)
  };
}

function updateSliderLabels() {
  document.getElementById("valGreen").innerText = document.getElementById("wGreen").value;
  document.getElementById("valSummer").innerText = document.getElementById("wSummer").value;
  document.getElementById("valHot").innerText = document.getElementById("wHot").value;
  document.getElementById("valTrop").innerText = document.getElementById("wTrop").value;
}

function scoreToColor(score) {
  const red = Math.round((1 - score) * 255);
  const green = Math.round(score * 255);
  return `rgb(${red},${green},100)`;
}

function styleFeature(feature, weights) {
  const p = feature.properties;
  const values = [
    weights.green * p.green_per_norm,
    weights.summer * p.summerday_norm,
    weights.hot * p.hotday_norm,
    weights.trop * p.Tropicalnights_norm
  ];
  const sumWeights = weights.green + weights.summer + weights.hot + weights.trop;
  const score = sumWeights > 0 ? values.reduce((a, b) => a + b, 0) / sumWeights : 0;
  const color = scoreToColor(score);

  return {
    fillColor: color,
    weight: 1,
    opacity: 1,
    color: "white",
    fillOpacity: 0.7
  };
}

function updateMap(data) {
  const weights = getWeights();
  updateSliderLabels();

  if (!map) {
    const center = data.meta?.map_center || [52.5, 13.4];
    const zoom = data.meta?.map_zoom || 11;
    map = L.map("map").setView(center, zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);
    L.control.scale({ imperial: false }).addTo(map);
  }

  if (geoLayer) map.removeLayer(geoLayer);

  geoLayer = L.geoJSON(data, {
    style: feature => styleFeature(feature, weights),
    onEachFeature: (feature, layer) => {
      const p = feature.properties;
      const lqi = (
        weights.green * p.green_per_norm +
        weights.summer * p.summerday_norm +
        weights.hot * p.hotday_norm +
        weights.trop * p.Tropicalnights_norm
      ) / (weights.green + weights.summer + weights.hot + weights.trop);
      layer.bindPopup(`<b>${p.name || "Area"}</b><br>LQI: ${lqi.toFixed(3)}`);
    }
  }).addTo(map);
  
}

fetch("data.geojson")
  .then(res => res.json())
  .then(data => {
    updateMap(data);
    ["wGreen", "wSummer", "wHot", "wTrop"].forEach(id => {
      document.getElementById(id).addEventListener("input", () => updateMap(data));
    });
  });