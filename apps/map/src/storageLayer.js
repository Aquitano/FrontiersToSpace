import { geoJSON } from 'leaflet';
import { getStorageInfo, getStoredTilesAsJson } from 'leaflet.offline';

const urlTemplate = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export function storageLayer(baseLayer, layerswitcher) {
	let layer;

	const getGeoJsonData = async () => {
		try {
			const tiles = await getStorageInfo(urlTemplate);
			if (!tiles || tiles.length === 0) {
				return { type: 'FeatureCollection', features: [] };
			}

			if (!baseLayer._map) {
				return { type: 'FeatureCollection', features: [] };
			}
			return await getStoredTilesAsJson(baseLayer, tiles);
		} catch (error) {
			console.warn('Failed to get stored tiles GeoJSON:', error.message);
			return { type: 'FeatureCollection', features: [] };
		}
	};

	const addStorageLayer = () => {
		// Delay initialization to ensure map is ready
		setTimeout(() => {
			getGeoJsonData()
				.then((geojson) => {
					if (geojson.features && geojson.features.length > 0) {
						layer = geoJSON(geojson).bindPopup(
							(clickedLayer) => clickedLayer.feature.properties.key,
						);
						layerswitcher.addOverlay(layer, 'offline tiles');
					}
				})
				.catch((error) => {
					console.warn('Storage layer initialization failed:', error.message);
				});
		}, 100);
	};

	addStorageLayer();

	baseLayer.on('storagesize', (e) => {
		const storageElement = document.getElementById('storage');
		if (storageElement) {
			storageElement.innerHTML = e.storagesize;
		}
		if (layer) {
			layer.clearLayers();
			getGeoJsonData()
				.then((data) => {
					if (data.features && data.features.length > 0) {
						layer.addData(data);
					}
				})
				.catch((error) => {
					console.warn('Failed to update storage layer:', error.message);
				});
		}
	});
}
