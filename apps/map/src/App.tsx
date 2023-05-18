/* eslint-disable @typescript-eslint/ban-ts-comment */
import L, { Control } from 'leaflet';
import 'leaflet.offline';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { useMap } from './hooks';
import { storageLayer } from './storageLayer.js';

const markers = [
    {
        name: 'DB0BW',
        qth: 'Passau',
        output: '438.67500',
        input: '431.07500',
        description: 'Tonruf 1750 Hz oder Subton 71,9 Hz',
        lat: 48.553953,
        lng: 13.345679,
    },
];

const App = () => {
    const { position } = useMap();
    const [map, setMap] = useState(null);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (map) {
            const tileLayerOffline = L.tileLayer.offline(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {
                    attribution:
                        '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
                    subdomains: 'abc',
                    minZoom: 8,
                    maxZoom: 10,
                },
            );

            tileLayerOffline.addTo(map);

            const controlSaveTiles = L.control.savetiles(tileLayerOffline, {
                zoomlevels: [8, 9, 10],
                confirm(
                    layer: { _tilesforSave: string | any[] },
                    succescallback: () => void,
                ) {
                    // eslint-disable-next-line no-alert
                    if (window.confirm(`Save ${layer._tilesforSave.length}`)) {
                        succescallback();
                    }
                },
                confirmRemoval(successCallback: () => void) {
                    // eslint-disable-next-line no-alert
                    if (window.confirm('Remove all the tiles?')) {
                        successCallback();
                    }
                },
                saveText:
                    '<i class="fas fa-download" aria-hidden="true" title="Save tiles"></i>',
                rmText: '<i class="fas fa-trash" aria-hidden="true"  title="Remove tiles"></i>',
            });

            controlSaveTiles.addTo(map);

            const layerswitcher = new Control.Layers(
                {
                    'osm (offline)': tileLayerOffline,
                },
                null,
                { collapsed: false },
            ).addTo(map);
            // add storage overlay
            storageLayer(tileLayerOffline, layerswitcher);

            let locProgress: number;
            tileLayerOffline.on(
                'savestart',
                (e: { _tilesforSave: string | any[] }) => {
                    locProgress = 0;
                    setTotal(e._tilesforSave.length);
                },
            );
            tileLayerOffline.on('savetileend', () => {
                locProgress += 1;
                setProgress(locProgress);
            });
        }
    }, [map]);

    return (
        <>
            <p
                style={{
                    zIndex: 100,
                    position: 'fixed',
                    top: 'auto',
                    bottom: 0,
                    left: 0,
                    right: 'auto',
                    color: 'red',
                    backgroundColor: 'white',
                }}
            >
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
                <TileLayer
                    // @ts-expect-error
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                    <Popup>Eigener Standort</Popup>
                </Marker>
                {markers.map((marker) => (
                    <Marker position={[marker.lat, marker.lng]}>
                        <Popup>
                            <table>
                                <tbody>
                                    <tr>
                                        <td>Rufzeichen</td>
                                        <td>{marker.name}</td>
                                    </tr>
                                    <tr>
                                        <td>QTH</td>
                                        <td>{marker.qth}</td>
                                    </tr>
                                    <tr>
                                        <td>Ausgabe/Eingabe</td>
                                        <td>
                                            {marker.output} / {marker.input}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Bemerkung</td>
                                        <td>{marker.description}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </>
    );
};

export default App;
