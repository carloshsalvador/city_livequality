let map;
let geoLayer = null;
let scaleControl = null; // Adiciona uma variável para armazenar o controle de escala

function updateMap(data) {
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