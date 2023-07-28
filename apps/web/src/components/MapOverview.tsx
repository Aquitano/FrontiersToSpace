import {
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LineElement,
	LinearScale,
	PointElement,
	Title,
	Tooltip,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { CrosshairPlugin } from 'chartjs-plugin-crosshair';
import L, { LatLngTuple } from 'leaflet';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-geometryutil';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import markerIcon from '../assets/balloon.png';
import burstIcon from '../assets/burst.png';
import fullscreenIcon from '../assets/fullscreen.svg';
import { inputData, type StratosphereData } from '../utils/data';

/**
 * Register the necessary ChartJS components.
 */
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	annotationPlugin,
	CrosshairPlugin,
);

const optionsTL = {
	responsive: true,
	plugins: {
		tooltip: {
			mode: 'index',
			callbacks: {
				label: function (context: { dataset: { label: string }; parsed: { y: any } }) {
					const label = context.dataset.label || '';
					const value = context.parsed.y;
					if (label === 'Temperatur') {
						return `${label}: ${value}°C`;
					} else if (label === 'Luftfeuchtigkeit') {
						return `${label}: ${value}%`;
					}
					return `${label}: ${value}`;
				},
			},
			intersect: false,
		},
		legend: {
			labels: {
				color: 'white',
			},
		},
		annotation: {
			annotations: {
				line1: {
					type: 'line',
					xMin: '14:20',
					xMax: '14:20',
					borderColor: 'rgba(155, 99, 32, 0.3)',
					borderWidth: 2,
					label: {
						backgroundColor: 'rgba(155, 99, 32, 0.3)',
						content: 'Ballon geplatzt',
						display: true,
						yAdjust: -40,
					},
				},
			},
		},
		crosshair: {
			line: {
				color: '#F66', // crosshair line color
				width: 1, // crosshair line width
			},
			sync: {
				enabled: true, // enable trace line syncing with other charts
				group: 2, // chart group
				suppressTooltips: false, // suppress tooltips when showing a synced tracer
			},
			zoom: {
				enabled: true, // enable zooming
				zoomboxBackgroundColor: 'rgba(66,133,244,0.2)', // background color of zoom box
				zoomboxBorderColor: '#48F', // border color of zoom box
				zoomButtonText: 'Reset Zoom', // reset zoom button text
				zoomButtonClass: 'reset-zoom', // reset zoom button class
			},
		},
	},
	scales: {
		x: {
			ticks: {
				color: 'white',
			},
		},
		temp: {
			type: 'linear',
			display: true,
			position: 'left',
			ticks: {
				color: 'white',
				callback: function (value: string) {
					return `${value}°C`;
				},
			},
		},
		hum: {
			type: 'linear',
			display: true,
			position: 'right',
			ticks: {
				color: 'white',
				callback: function (value: string) {
					return `${value}%`;
				},
			},
		},
	},
};

const optionsPA = {
	responsive: true,
	plugins: {
		tooltip: {
			mode: 'index',
			callbacks: {
				label: function (context: { dataset: { label: string }; parsed: { y: any } }) {
					const label = context.dataset.label || '';
					const value = context.parsed.y;
					if (label === 'Pressure') {
						return `${label}: ${value} hPa`;
					} else if (label === 'Altitude') {
						return `${label}: ${value} m`;
					}
					return `${label}: ${value}`;
				},
			},
			intersect: false,
		},
		legend: {
			labels: {
				color: 'white',
			},
		},
		annotation: {
			annotations: {
				line1: {
					type: 'line',
					xMin: '14:20',
					xMax: '14:20',
					borderColor: 'rgba(155, 99, 32, 0.3)',
					borderWidth: 2,
					label: {
						backgroundColor: 'rgba(155, 99, 32, 0.3)',
						content: 'Ballon geplatzt',
						display: true,
						yAdjust: -40,
					},
				},
			},
		},
		crosshair: {
			line: {
				color: '#F66', // crosshair line color
				width: 1, // crosshair line width
			},
			sync: {
				enabled: true, // enable trace line syncing with other charts
				group: 1, // chart group
				suppressTooltips: false, // suppress tooltips when showing a synced tracer
			},
			zoom: {
				enabled: true, // enable zooming
				zoomboxBackgroundColor: 'rgba(66,133,244,0.2)', // background color of zoom box
				zoomboxBorderColor: '#48F', // border color of zoom box
				zoomButtonText: 'Reset Zoom', // reset zoom button text
				zoomButtonClass: 'reset-zoom', // reset zoom button class
			},
		},
	},
	scales: {
		x: {
			ticks: {
				color: 'white',
			},
		},
		pressure: {
			type: 'linear',
			display: true,
			position: 'left',
			ticks: {
				color: 'white',
				callback: function (value: string) {
					return `${value} hPa`;
				},
			},
		},
		altitude: {
			type: 'linear',
			display: true,
			position: 'right',
			ticks: {
				color: 'white',
				callback: function (value: string) {
					return `${value} m`;
				},
			},
			// grid line settings
			grid: {
				drawOnChartArea: false, // only want the grid lines for one axis to show up
			},
		},
	},
};

type ChartData = {
	labels: string[];
	datasets: {
		label: string;
		data: number[];
		fill: boolean;
		backgroundColor: string;
		borderColor: string;
	}[];
};

const initialState = {
	isTLFullScreen: false,
	isPAFullScreen: false,

	// Chart data for temperature and humidity
	chartDataTL: {},
	showChartTL: false,

	// Chart data for pressure and altitude
	chartDataPA: {},
	showChartPA: false,
	location: [0, 0],
};

const MapMain = () => {
	const [state, setState] = useState(initialState);

	const map = useRef<L.Map>(null);
	const polyline = useRef<L.Polyline>(null);

	const [data] = useState<StratosphereData[]>(inputData);

	const toggleTLFullScreen = useCallback(() => {
		setState((prevState) => ({
			...prevState,
			isTLFullScreen: !prevState.isTLFullScreen,
		}));
	}, []);

	const togglePAFullScreen = useCallback(() => {
		setState((prevState) => ({
			...prevState,
			isPAFullScreen: !prevState.isPAFullScreen,
		}));
	}, []);

	/**
	 * Effect to update chart data when weather data changes.
	 */
	useEffect(() => {
		if (data) {
			const times = data.map((entry) => {
				const date = new Date(entry.date * 1000);
				if (date.getMinutes().toString().length === 1) {
					return `${date.getHours()}:0${date.getMinutes()}`;
				}
				return `${date.getHours()}:${date.getMinutes()}`;
			});
			const temps = data.map((entry) => entry.tmp.toFixed(2));
			const humidity = data.map((entry) => entry.hum);

			setState((prevState) => ({
				...prevState,
				chartDataTL: {
					labels: times,
					datasets: [
						{
							label: 'Temperatur (°C)',
							data: temps,
							fill: false,
							backgroundColor: 'rgb(75, 192, 192)',
							borderColor: 'rgba(75, 192, 192, 0.6)',
							tension: 1,
							pointRadius: 0.4,
							yAxisID: 'temp',
						},
						{
							label: 'Luftfeuchtigkeit (%)',
							data: humidity,
							fill: false,
							backgroundColor: 'rgb(255, 99, 132)',
							borderColor: 'rgba(255, 99, 132, 0.6)',
							tension: 1,
							pointRadius: 0.4,
							yAxisID: 'hum',
						},
					],
				},
				showChartTL: true,
			}));
		}
	}, [data]);

	/**
	 * Effect to update chart data for pressure and altitude when weather data changes.
	 */
	useEffect(() => {
		if (data) {
			const pressureData = data
				.map((entry) => ({
					time: entry.date,
					pressure: entry.pss,
					altitude: entry.alt,
				}))
				.filter((entry) => entry.pressure !== null && entry.altitude !== null);

			const times = pressureData.map((entry) => {
				const date = new Date(entry.time * 1000);
				if (date.getMinutes().toString().length === 1) {
					return `${date.getHours()}:0${date.getMinutes()}`;
				}
				return `${date.getHours()}:${date.getMinutes()}`;
			});

			const pressures = pressureData.map((entry) => entry.pressure.toFixed(2));
			const altitudes = pressureData.map((entry) => entry.altitude.toFixed(2));

			if (pressures.length > 0 && altitudes.length > 0) {
				setState((prevState) => ({
					...prevState,
					chartDataPA: {
						labels: times,
						datasets: [
							{
								label: 'Luftdruck (hPa)',
								data: pressures,
								yAxisID: 'pressure',
								fill: false,
								backgroundColor: 'rgb(75, 192, 192)',
								borderColor: 'rgba(75, 192, 192, 0.6)',
								tension: 1,
								pointRadius: 0.4,
							},
							{
								label: 'Höhe (m)',
								data: altitudes,
								yAxisID: 'altitude',
								fill: false,
								backgroundColor: 'rgb(255, 99, 132)',
								borderColor: 'rgba(255, 99, 132, 0.6)',
								tension: 1,
								pointRadius: 0.4,
							},
						],
					},
					showChartPA: true,
				}));
			}
		}
	}, [data]);

	/**
	 * Effect to update location when data changes.
	 */
	useEffect(() => {
		if (data) {
			const lastDataPoint = data[data.length - 1];
			setState((prevState) => ({
				...prevState,
				location: [lastDataPoint.lat, lastDataPoint.lon],
			}));
		}
	}, [data]);

	const locations = data.map((entry) => [entry.lat, entry.lon]);
	if (map.current) map.current.setView([48.56099, 13.44782], 10);

	const handlePolylineClick = (event: { latlng: any }) => {
		if (!map.current) return;

		const threshold = 5;
		const clickPoint = event.latlng;

		for (let i = 0; i < locations.length - 1; i++) {
			const start = locations[i] as LatLngTuple;
			const end = locations[i + 1] as LatLngTuple;
			const distance = L.GeometryUtil.distanceSegment(map.current, clickPoint, start, end);

			if (distance < threshold) {
				// Retrieve the corresponding data point
				const entry = data[i];

				// Format the data for the popup
				const time = new Date(entry.date * 1000).toLocaleTimeString('de-DE', {
					hour: '2-digit',
					minute: '2-digit',
				});
				const content = `
                Uhrzeit: ${time}<br>
                Ort: ${entry.lat.toFixed(4)}, ${entry.lon.toFixed(4)}<br>
                Temperatur: ${entry.tmp.toFixed(2)} °C<br>
                Luftfeuchtigkeit: ${entry.hum} %<br>
                Höhe: ${entry.alt.toFixed(2)} m<br>
                Luftdruck: ${entry.pss.toFixed(2)} hPa
            `;

				// Create a new popup at the clicked location with the formatted data
				L.popup().setLatLng([data[i].lat, data[i].lon]).setContent(content).openOn(map.current);

				break;
			}
		}
	};

	return (
		<div>
			{state.showChartTL && (
				<div
					className={`absolute left-0 top-0 mr-10 overflow-hidden ${
						state.isTLFullScreen ? 'z-50 h-full w-full' : 'z-10 w-full md:w-1/3'
					} bg-slate-900`}
				>
					<button
						onClick={toggleTLFullScreen}
						className="absolute left-0 top-0 flex items-center text-white"
					>
						<img
							src={fullscreenIcon.src}
							width={20}
							height={20}
							alt="Toggle Full Screen"
							className="invert"
						/>
						{state.isTLFullScreen ? 'Verkleinern' : 'Vergrößern'}
					</button>
					{/* @ts-ignore */}
					<Line data={state.chartDataTL} options={optionsTL} />
				</div>
			)}
			{state.showChartPA && (
				<div
					className={`absolute right-0 top-0 ml-10 overflow-hidden ${
						state.isPAFullScreen ? 'z-50 h-full w-full' : 'z-10 w-full md:w-1/3'
					} bg-slate-900`}
				>
					<button
						onClick={togglePAFullScreen}
						className="absolute left-0 top-0 flex items-center text-white"
					>
						<img
							src={fullscreenIcon.src}
							width={20}
							height={20}
							alt="Toggle Full Screen"
							className="invert"
						/>
						{state.isPAFullScreen ? 'Verkleinern' : 'Vergrößern'}
					</button>
					{/* @ts-ignore */}
					<Line data={state.chartDataPA} options={optionsPA} />
				</div>
			)}
			<MapContainer
				center={state.location as LatLngTuple}
				zoom={13}
				scrollWheelZoom={true}
				style={{ height: '100vh', zIndex: 0 }}
				ref={map}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				{locations && (
					<div>
						<Polyline
							positions={locations.map((location) => [location[0], location[1]] as LatLngTuple)}
							ref={polyline}
						/>
						<Polyline
							positions={locations.map((location) => [location[0], location[1]] as LatLngTuple)}
							eventHandlers={{
								click: handlePolylineClick,
							}}
							weight={25}
							opacity={0}
						/>
					</div>
				)}
				<Marker
					position={state.location as LatLngTuple}
					icon={L.icon({
						iconUrl: markerIcon.src,
						shadowUrl: markerShadow.src,
						iconSize: [40, 40],
						popupAnchor: [0, -20],
						shadowAnchor: [10, 20],
						shadowSize: [markerShadow.width, markerShadow.height],
					})}
				>
					<Popup>
						Ballon ist gelandet: <br /> {state.location[0].toFixed(3)},{' '}
						{state.location[1].toFixed(3)} <br /> 15:09
					</Popup>
				</Marker>
				<Marker
					position={[48.606306736741516, 12.907682857037855]}
					icon={L.icon({
						iconUrl: burstIcon.src,
						iconSize: [30, 30],
						iconAnchor: [15, 20],
						popupAnchor: [0, -20],
					})}
				>
					<Popup>
						Ballon ist geplatzt: <br /> 48.606, 12.907 <br /> 14:20
					</Popup>
				</Marker>
			</MapContainer>
		</div>
	);
};

export default MapMain;
