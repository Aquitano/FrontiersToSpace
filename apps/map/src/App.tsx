/* eslint-disable @typescript-eslint/ban-ts-comment */
import L, { Control } from 'leaflet';
import 'leaflet.offline';
import { block } from 'million/react';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup } from 'react-leaflet';
import { useMap } from './hooks';
import { repeaters } from './repeaters.js';
import { storageLayer } from './storageLayer.js';

interface TileEvent {
	_tilesforSave: string[];
}

const useTileLayerOffline = (
	map: L.Map | null,
	setProgress: (progress: number) => void,
	setTotal: (total: number) => void,
) => {
	useEffect(() => {
		if (map) {
			const tileLayerOffline = L.tileLayer.offline(
				'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
				{
					attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
					subdomains: 'abc',
					minZoom: 7,
					maxZoom: 10,
				},
			);

			tileLayerOffline.addTo(map);

			const controlSaveTiles = L.control.savetiles(tileLayerOffline, {
				zoomlevels: [8, 9, 10],
				confirm(layer: TileEvent, successCallback: () => void) {
					if (window.confirm(`Save ${layer._tilesforSave.length}`)) {
						successCallback();
					}
				},
				confirmRemoval(successCallback: () => void) {
					if (window.confirm('Remove all the tiles?')) {
						successCallback();
					}
				},
				saveText: '<i class="fas fa-download" aria-hidden="true" title="Save tiles"></i>',
				rmText: '<i class="fas fa-trash" aria-hidden="true"  title="Remove tiles"></i>',
			});

			controlSaveTiles.addTo(map);

			const layerSwitcher = new Control.Layers(
				{
					'osm (offline)': tileLayerOffline,
				},
				null,
				{ collapsed: false },
			).addTo(map);

			storageLayer(tileLayerOffline, layerSwitcher);

			let locProgress = 0;
			tileLayerOffline.on('savestart', (e: TileEvent) => {
				locProgress = 0;
				setTotal(e._tilesforSave.length);
			});
			tileLayerOffline.on('savetileend', () => {
				locProgress += 1;
				setProgress(locProgress);
			});
		}
	}, [map, setProgress, setTotal]);
};

const App = block(() => {
	const { position } = useMap();
	const [map, setMap] = useState(null);
	const [progress, setProgress] = useState(0);
	const [total, setTotal] = useState(0);

	useTileLayerOffline(map, setProgress, setTotal);

	return (
		<>
			<p className="download-progress">
				Downloaded: {progress} of {total}
			</p>
			<MapContainer
				// @ts-expect-error
				center={position}
				zoom={8}
				scrollWheelZoom={true}
				ref={setMap}
				style={{ minHeight: '100vh', minWidth: '100vw', zIndex: 0 }}
			>
				<Marker position={position}>
					<Popup>Eigener Standort</Popup>
				</Marker>
				{repeaters.map((marker) => (
					<Marker position={[marker[0].lat, marker[0].lng]} key={marker[0].name}>
						<Popup>
							{marker.map((element, index) => (
								<details open={index === 0} key={element.name + index}>
									<summary>{element.name}</summary>

									<table>
										<tbody>
											<tr>
												<td>Call</td>
												<td>{element.name}</td>
											</tr>
											<tr>
												<td>Position</td>
												<td>{element.qth}</td>
											</tr>
											<tr>
												<td>Ausgabe / Eingabe</td>
												<td>
													{element.output} / {element.input}
												</td>
											</tr>
											<tr>
												<td>Offset</td>
												<td>
													{Number.parseFloat(element.output) - Number.parseFloat(element.input)}
												</td>
											</tr>
											<tr>
												<td>Mode</td>
												<td>{element.mode}</td>
											</tr>
											<tr>
												<td>Bemerkung</td>
												<td>{element.description}</td>
											</tr>
										</tbody>
									</table>
								</details>
							))}
						</Popup>
					</Marker>
				))}
			</MapContainer>
		</>
	);
});

export default App;
