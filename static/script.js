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
// se remover aqui, tem que remover tbm no updateMap.
function updateSliderLabels() {
  document.getElementById("wGreen").innerText = weights.green.toFixed(2);
  document.getElementById("wSummer").innerText = weights.summer.toFixed(2);
  document.getElementById("wHot").innerText = weights.hot.toFixed(2);
  document.getElementById("wTrop").innerText = weights.trop.toFixed(2);
}

function calculateLQI(properties, weights) {
  return (
    (weights.green * properties.green_per_norm +
      weights.summer * properties.summerday_norm +
      weights.hot * properties.hotday_norm +
      weights.trop * properties.Tropicalnights_norm) /
    (weights.green + weights.summer + weights.hot + weights.trop)
  );
}

function styleFeature(feature, weights) {
  const lqi = calculateLQI(feature.properties, weights);

  return {
    fillColor: lqi > 0.7 ? "#2ECC71" : lqi > 0.4 ? "#F1C40F" : "#E74C3C", // Verde, amarelo ou vermelho
    weight: 2,
    opacity: 1,
    color: "white",
    fillOpacity: 0.7
  };
}


function updateMap(data) {
  console.log("updateMap foi chamado", data);

  // Atualiza os dados globais
  currentData = data;

  // Atualiza os rótulos dos sliders
  updateSliderLabels();

  // Verifica se o mapa já foi inicializado
  if (!map) {
    const mapElement = document.getElementById("map");
    if (!mapElement) {
      console.error("Elemento #map não encontrado no DOM!");
      return;
    }

    // Define o centro inicial e o zoom como fallback
    const center = data.meta?.map_center
      ? [data.meta.map_center[1], data.meta.map_center[0]] // Converte para [latitude, longitude]
      : [52.5, 13.4]; // Fallback para Berlim
    const zoom = data.meta?.map_zoom || 11;



    // Inicializa o mapa
    map = L.map("map", {
      center: center,
      zoom: zoom,
      //crs: L.CRS.EPSG3857 // CRS padrão do Leaflet
    });

    // Adiciona o tile layer (OSM)
    // L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    //   attribution: "© OpenStreetMap contributors",
    //   maxZoom: 19,
    // }).addTo(map);

    // L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    //   attribution: '&copy; OSM contributors'
    //   }).addTo(map);

    // const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    //   attribution: '&copy; OSM contributors'
    // }).addTo(map);
    
    // tileLayer.on('load', function () {
    //   console.log("Todos os tiles carregados.");
    // });
    

    // L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    //   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    //   subdomains: "abcd",
    //   maxZoom: 19
    // }).addTo(map);

    // L.tileLayer("https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png", {
    //   attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://openstreetmap.org">OpenStreetMap</a>',
    //   maxZoom: 20,
    // }).addTo(map);

    // Adiciona controle de escala
    scaleControl = L.control.scale({ imperial: false }).addTo(map);

    // Log do centro do mapa após inicialização
    console.log("Coordenadas do centro do mapa (após inicialização):", map.getCenter());
  }

  // Remove a camada GeoJSON anterior, se existir
  if (geoLayer) {
    map.removeLayer(geoLayer);
  }

  // Adiciona a nova camada GeoJSON
  geoLayer = L.geoJSON(data, {
    style: (feature) => styleFeature(feature, weights),
    onEachFeature: (feature, layer) => {
      const lqi = calculateLQI(feature.properties, weights);
      layer.bindPopup(
        `<b>${feature.properties.name || "Área"}</b><br>LQI: ${lqi.toFixed(3)}`
      );
    },
  }).addTo(map);

  // Ajusta o mapa para caber no GeoJSON
  if (data.features.length > 0) {
    const bounds = geoLayer.getBounds();
    map.fitBounds(bounds); // Ajusta o mapa para os bounds do GeoJSON
    console.log("Bounds ajustados para o GeoJSON:", bounds);
  } else {
    console.warn("GeoJSON não contém features. Usando centro inicial.");
  }

  // Log do centro do mapa após ajustar os bounds
  console.log("Coordenadas do centro do mapa (após ajustar bounds):", map.getCenter());
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

setTimeout(() => {
  map.invalidateSize();
  console.log("map.invalidateSize() chamado após delay");
}, 500);

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

// // para plotar o geojson completo, descomentar a linha abaixo e comentar a linha acima:
// document.addEventListener("DOMContentLoaded", () => {
//   const loadMapButton = document.getElementById("loadMap");
//   if (loadMapButton) {
//     loadMapButton.addEventListener("click", () => {
//       const city = document.getElementById("city").value;
//       const year = document.getElementById("year").value;

//       const geojsonPath = `/city_livequality/cities/${city}/${year}/data.geojson`;

//       fetch(geojsonPath)
//         .then(response => {
//           if (!response.ok) {
//             throw new Error(`Erro ao carregar o GeoJSON: ${response.statusText}`);
//           }
//           return response.json();
//         })
//         .then(data => {
//           updateMap(data);
//         })
//         .catch(error => console.error('Erro ao carregar o GeoJSON:', error));
//     });
//   } else {
//     console.error("Botão 'loadMap' não encontrado no DOM.");
//   }
// });
