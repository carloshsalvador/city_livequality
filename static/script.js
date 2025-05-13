console.log("Leaflet versão:", L);
let map;
let geoLayer = null;
let scaleControl = null; // Adiciona uma variável para armazenar o controle de escala

// function updateMap(data) { // codigo original sem fallback mantida aqui como memória! se não houver dados, não faz nada. ver alternativa com fallback:
function updateMap(data = { meta: {}, features: [] }) { // """data = { meta: {}, features: [] }""" ao invés de só "data" é o fallback!? Adiciona um valor padrão para data para evitar erros quando não encontra dados.
  console.log("updateMap foi chamado", data); 

  let weights = {
    green: 1.0,
    summer: 1.0,
    hot: 1.0,
    trop: 1.0
  };

  // const weights = getWeights(); // antigo, original, mantido como memória

  let currentData = null; // Armazena os dados GeoJSON

function getWeights() {
  weights.green = parseFloat(document.getElementById("wGreen").value);
  weights.summer = parseFloat(document.getElementById("wSummer").value);
  weights.hot = parseFloat(document.getElementById("wHot").value);
  weights.trop = parseFloat(document.getElementById("wTrop").value);
  console.log("Pesos atualizados:", weights);
}

function updateMap(data = { meta: {}, features: [] }) {
  currentData = data; // Atualiza os dados globais
  console.log("updateMap foi chamado", data);


  updateSliderLabels();

  if (!map) {
    const mapElement = document.getElementById("map");
    console.log("Elemento #map encontrado:", mapElement);
    if (!mapElement) {
      console.error("Elemento #map não encontrado no DOM!");
      return;
    }
    const center = data.meta?.map_center || [52.5, 13.4];
    const zoom = data.meta?.map_zoom || 11;
    map = L.map("map").setView(center, zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    // Adiciona o controle de escala apenas na inicialização do mapa
    scaleControl = L.control.scale({ imperial: false }).addTo(map);
  }

  // Remove a camada GeoJSON existente, se houver
  if (geoLayer) {
    map.removeLayer(geoLayer);
  }

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

// Adiciona eventos aos sliders
document.getElementById("wGreen").addEventListener("input", () => {
  getWeights();
  updateMap(currentData);
});

document.getElementById("wSummer").addEventListener("input", () => {
  getWeights();
  updateMap(currentData);
});

document.getElementById("wHot").addEventListener("input", () => {
  getWeights();
  updateMap(currentData);
});

document.getElementById("wTrop").addEventListener("input", () => {
  getWeights();
  updateMap(currentData);
});