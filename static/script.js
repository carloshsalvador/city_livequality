const mapInstance = L.map('map'); //.setView([52.5, 13.4], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(mapInstance);

let geoLayer = null;
let geojsonData = null;

const weights = {
  green: 1.0,
  summer: 1.0,
  hot: 1.0,
  trop: 1.0,
  pm25: 1.0,
  no2: 1.0
};

function updateSliderLabels() {
  document.getElementById("valGreen").textContent = document.getElementById("wGreen").value;
  document.getElementById("valSummer").textContent = document.getElementById("wSummer").value;
  document.getElementById("valHot").textContent = document.getElementById("wHot").value;
  document.getElementById("valTrop").textContent = document.getElementById("wTrop").value;
  document.getElementById("valPM25").textContent = document.getElementById("wPM25").value;
  document.getElementById("valNO2").textContent = document.getElementById("wNO2").value;
}

function updateWeights() {
  weights.green = parseFloat(document.getElementById("wGreen").value);
  weights.summer = parseFloat(document.getElementById("wSummer").value);
  weights.hot = parseFloat(document.getElementById("wHot").value);
  weights.trop = parseFloat(document.getElementById("wTrop").value);
  weights.pm25 = parseFloat(document.getElementById("wPM25").value);
  weights.no2 = parseFloat(document.getElementById("wNO2").value);
}

function drawGeoLayer(data) {
  if (geoLayer) mapInstance.removeLayer(geoLayer); // Use mapInstance aqui
  geoLayer = L.geoJSON(data, {
    style: feature => ({
      fillColor: getContinuousColor(calculateLQI(feature.properties)),
      weight: 2,
      opacity: 1,
      color: "white",
      fillOpacity: 0.7
    }),
    onEachFeature: (feature, layer) => {
      const lqi = calculateLQI(feature.properties);  
      layer.bindPopup(`
        <b>${feature.properties.ID || "Area"}</b><br>
        LQI: ${lqi.toFixed(3)}<br>
        Green: ${(feature.properties.green_per).toFixed(1)} %<br>
        Summer days: ${(feature.properties.summerday).toFixed(1)} days/year<br>
        Hot days: ${(feature.properties.hotday).toFixed(1)} days/year<br>
        Tropical nights: ${(feature.properties.Tropicalnights).toFixed(1)} days/year<br>
        PM2.5: ${(feature.properties.pm25.toFixed(1))} µg/m³<br>
        NO₂: ${feature.properties.no2.toFixed(1)} µg/m³<br>`);
    }
  }).addTo(mapInstance); // Use mapInstance aqui
}

function calculateLQI(properties) {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  return (
    weights.green * properties.green_per_norm +
    weights.summer * properties.summerday_norm +
    weights.hot * properties.hotday_norm +
    weights.trop * properties.Tropicalnights_norm +
    weights.pm25 * properties.pm25_norm +
    weights.no2 * properties.no2_norm
  ) / totalWeight;
}

function getContinuousColor(lqi) {
  const v = Math.max(0, Math.min(1, lqi));
  const r = Math.round((1 - v) * 255);
  const g = Math.round(v * 255);
  return `rgb(${r},${g},100)`;
}

fetch('data.geojson')  // manter sem pahts superior, pois o arquivo já está na mesma pasta do html -->
  .then(response => response.json())
  .then(data => {
    geojsonData = data;
    const year = data.meta?.norm_ref_year || "today";
    const city = data.meta?.norm_ref_city || "Your City";
    document.getElementById('main-title').textContent = `Life Quality Index - ${city} (${year})`;
    drawGeoLayer(data);
    const bounds = L.geoJSON(data).getBounds();
    mapInstance.fitBounds(bounds);
  })
  .catch(error => console.error('Erro ao carregar o GeoJSON:', error));

  ["wGreen", "wSummer", "wHot", "wTrop", "wPM25", "wNO2"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    updateWeights();
    updateSliderLabels();
    drawGeoLayer(geojsonData);
  });
});

updateSliderLabels();