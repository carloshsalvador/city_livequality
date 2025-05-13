console.log("Leaflet versão:", L);
let map;
let geoLayer = null;
let scaleControl = null; // Adiciona uma variável para armazenar o controle de escala

// function updateMap(data) { // codigo original sem fallback mantida aqui como memória! se não houver dados, não faz nada. ver alternativa com fallback:
function updateMap(data = { meta: {}, features: [] }) { // """data = { meta: {}, features: [] }""" ao invés de só "data" é o fallback!? Adiciona um valor padrão para data para evitar erros quando não encontra dados.
  console.log("updateMap foi chamado", data); 

  const weights = getWeights();
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

// Exemplo de chamada com dados válidos
const sampleData = {
  meta: {
    map_center: [52.5, 13.4],
    map_zoom: 11
  },
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [13.4, 52.5]
      },
      properties: {
        name: "Sample Point",
        green_per_norm: 0.8,
        summerday_norm: 0.7,
        hotday_norm: 0.6,
        Tropicalnights_norm: 0.5
      }
    }
  ]
};

// Chama a função updateMap com os dados de exemplo
updateMap(sampleData);