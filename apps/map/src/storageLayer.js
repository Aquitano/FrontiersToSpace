import { geoJSON } from 'leaflet';
import { getStorageInfo, getStoredTilesAsJson } from 'leaflet.offline';

const urlTemplate = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const wmtsUrlTemplate =
  'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0?service=WMTS&request=GetTile&version=1.0.0&tilematrixset=EPSG:3857&layer={layer}&tilematrix={z}&tilerow={y}&tilecol={x}&format=image%2Fpng';

export function storageLayer(baseLayer, layerswitcher) {
  let layer;

  const getGeoJsonData = () =>
    getStorageInfo(urlTemplate).then((tiles) => getStoredTilesAsJson(baseLayer, tiles));

  const addStorageLayer = () => {
    getGeoJsonData()
      .then((geojson) => {
        layer = geoJSON(geojson).bindPopup((clickedLayer) => clickedLayer.feature.properties.key);
        layerswitcher.addOverlay(layer, 'offline tiles');
      })
      .catch((error) => {
        console.error(error);
      });
  };

  addStorageLayer();

  baseLayer.on('storagesize', (e) => {
    document.getElementById('storage').innerHTML = e.storagesize;
    if (layer) {
      layer.clearLayers();
      getGeoJsonData()
        .then((data) => {
          layer.addData(data);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  });
}
