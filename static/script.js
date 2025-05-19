console.log("Leaflet versão:", L);

let map;
let geoLayer = null;
let scaleControl = null;
let currentData = null;

let weights = {
  green: 1.0,
  summer: 1.0,
  hot: 1.0,
  trop: 1.0
};

function getWeights() {
  const greenSlider = document.getElementById("wGreen");
  const summerSlider = document.getElementById("wSummer");
  const hotSlider = document.getElementById("wHot");
  const tropSlider = document.getElementById("wTrop");

  weights.green = greenSlider ? parseFloat(greenSlider.value) : 1.0;
  weights.summer = summerSlider ? parseFloat(summerSlider.value) : 1.0;
  weights.hot = hotSlider ? parseFloat(hotSlider.value) : 1.0;
  weights.trop = tropSlider ? parseFloat(tropSlider.value) : 1.0;

  console.log("Pesos atualizados:", weights);
}


function updateSliderLabels() {
  const greenLabel = document.getElementById("valGreen");
  const summerLabel = document.getElementById("valSummer");
  const hotLabel = document.getElementById("valHot");
  const tropLabel = document.getElementById("valTrop");

  if (greenLabel) greenLabel.innerText = weights.green.toFixed(2);
  if (summerLabel) summerLabel.innerText = weights.summer.toFixed(2);
  if (hotLabel) hotLabel.innerText = weights.hot.toFixed(2);
  if (tropLabel) tropLabel.innerText = weights.trop.toFixed(2);
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
    fillColor: lqi > 0.7 ? "#2ECC71" : lqi > 0.4 ? "#F1C40F" : "#E74C3C",
    weight: 2,
    opacity: 1,
    color: "white",
    fillOpacity: 0.7
  };
}

function updateMap(data) {
  console.log("updateMap foi chamado", data);
  currentData = data;
  getWeights();
  updateSliderLabels();

  if (!map) {
    const center = data.meta?.map_center
      ? [data.meta.map_center[1], data.meta.map_center[0]]
      : [52.5, 13.4];
    const zoom = data.meta?.map_zoom || 11;

    map = L.map("map", {
      center: center,
      zoom: zoom
    });

    const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      subdomains: ["a", "b", "c"],
      maxZoom: 19,
    }).addTo(map);

    tileLayer.on("load", () => {
      console.log("Todos os tiles carregados.");
    });

    scaleControl = L.control.scale({ imperial: false }).addTo(map);
    console.log("Coordenadas do centro do mapa (após inicialização):", map.getCenter());

    setTimeout(() => {
      map.invalidateSize();
      console.log("map.invalidateSize() chamado após delay");
    }, 1000);
  }

  if (geoLayer) {
    map.removeLayer(geoLayer);
  }

  geoLayer = L.geoJSON(data, {
    style: (feature) => styleFeature(feature, weights),
    onEachFeature: (feature, layer) => {
      const lqi = calculateLQI(feature.properties, weights);
      layer.bindPopup(
        `<b>${feature.properties.name || "Área"}</b><br>LQI: ${lqi.toFixed(3)}`
      );
    }
  }).addTo(map);

  if (data.features.length > 0) {
    const bounds = geoLayer.getBounds();
    map.fitBounds(bounds);
    console.log("Bounds ajustados para o GeoJSON:", bounds);
  } else {
    console.warn("GeoJSON não contém features. Usando centro inicial.");
  }

  console.log("Coordenadas do centro do mapa (após ajustar bounds):", map.getCenter());
}

// Executa só após o DOM estar carregado
window.addEventListener("DOMContentLoaded", () => {
  // Atualiza valores iniciais dos sliders
  updateSliderLabels();

  // Carrega o GeoJSON
  fetch("data.geojson")
    .then((response) => response.json())
    .then((data) => {
      console.log("GeoJSON carregado:", data);
      updateMap(data);
    });

  // Liga os sliders aos eventos
  ["wGreen", "wSummer", "wHot", "wTrop"].forEach((id) => {
    const slider = document.getElementById(id);
    if (slider) {
      slider.addEventListener("input", () => {
        getWeights();
        updateSliderLabels();
        updateMap(currentData);
      });
    }
  });
});
