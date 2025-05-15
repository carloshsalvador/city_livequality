console.log("Leaflet versão:", L);

let map;
let geoLayer = null;
let scaleControl = null; // Adiciona uma variável para armazenar o controle de escala

let weights = {
  green: 1.0,
  summer: 1.0,
  hot: 1.0,
  trop: 1.0
};

let currentData = null; // Armazena os dados GeoJSON

function getWeights() {
  weights.green = parseFloat(document.getElementById("wGreen").value);
  weights.summer = parseFloat(document.getElementById("wSummer").value);
  weights.hot = parseFloat(document.getElementById("wHot").value);
  weights.trop = parseFloat(document.getElementById("wTrop").value);
  console.log("Pesos atualizados:", weights);
}


  //...updateSliderLabels implementada aqui, mas chamada dentro do updateMap().
  // se removar aqui, tem que remover tbm no updateMap.
  function updateSliderLabels() {
    document.getElementById("wGreen").innerText = weights.green.toFixed(2);
    document.getElementById("wSummer").innerText = weights.summer.toFixed(2);
    document.getElementById("wHot").innerText = weights.hot.toFixed(2);
    document.getElementById("wTrop").innerText = weights.trop.toFixed(2);
  }



// function updateMap(data) { // codigo original sem fallback mantida aqui como memória! se não houver dados, não faz nada. ver alternativa com fallback:
function updateMap(data = { meta: {}, features: [] }) { // """data = { meta: {}, features: [] }""" ao invés de só "data" é o fallback!? Adiciona um valor padrão para data para evitar erros quando não encontra dados.
  currentData = data; // Atualiza os dados globais
  console.log("updateMap foi chamado", data);

  updateSliderLabels();   //...updateSliderLabels implementada aqui

  if (!map) {
    const mapElement = document.getElementById("map");
    console.log("Elemento #map encontrado:", mapElement);
    if (!mapElement) {
      console.error("Elemento #map não encontrado no DOM!");
      return;
    }
    // const center = data.meta?.map_center || [52.5, 13.4]; // usa os dados map_center da chave metadata do geojson ou a coord. de Berlin, em caso de não encontrar ou fallback
    // Converte o ponto central do GeoJSON para o formato [latitude, longitude]
    const center = data.meta?.map_center
    ? [data.meta.map_center[1], data.meta.map_center[0]] // Converte para [latitude, longitude]
    : [52.5, 13.4]; // Fallback
    
    
    const zoom = data.meta?.map_zoom || 11; // usa os dados map_zoom da chave metadata do geojson ou valor padrão 11, em caso de não encontrar ou fallback
    map = L.map("map").setView(center, zoom);
  
    // L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    //   attribution: "© OpenStreetMap contributors"
    // }).addTo(map);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19
    }).addTo(map);

    scaleControl = L.control.scale({ imperial: false }).addTo(map);
  }

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

// para testar se data.geojson tem problema, primeiro testar o mapa ccom um geojson mínimo, depois testar o geojson completo.
// GeoJSON mínimo para teste:
// const sampleGeoJSON = {
//   "type": "FeatureCollection",
//   "features": [
//     {
//       "type": "Feature",
//       "geometry": {
//         "type": "Point",
//         "coordinates": [13.402313, 52.501493] // Coordenadas de Berlim
//       },
//       "properties": {
//         "name": "Sample Point",
//         "green_per_norm": 0.8,
//         "summerday_norm": 0.7,
//         "hotday_norm": 0.6,
//         "Tropicalnights_norm": 0.5
//       }
//     }
//   ]
// };
// updateMap(sampleGeoJSON); // Substitua a chamada para updateMap com o GeoJSON mínimo

// para plotar o geojson completo, descomentar a linha abaixo e comentar a linha acima:
fetch('/city_livequality/cities/berlin/2024/data.geojson')
  .then(response => response.json())
  .then(data => {
    updateMap(data);
  })
  .catch(error => console.error('Erro ao carregar o GeoJSON:', error));