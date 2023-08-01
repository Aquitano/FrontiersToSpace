import {
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LineElement,
	LinearScale,
	PointElement,
	Title,
	Tooltip,
	type TooltipItem,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { CrosshairPlugin } from 'chartjs-plugin-crosshair';
import L, { LatLngTuple } from 'leaflet';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-geometryutil';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import markerIcon from '../assets/balloon.png';
import burstIcon from '../assets/burst.png';
import fullscreenIcon from '../assets/fullscreen.svg';
import { inputData, type StratosphereData } from '../utils/data';

// Get type of options from Line
type optionsProps = React.ComponentProps<typeof Line>['options'];
type dataProps = React.ComponentProps<typeof Line>['data'];

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

/**
 * Base options for the chart.
 * @constant
 * @type {optionsProps}
 */
const baseOptions: optionsProps = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		tooltip: {
			mode: 'index',
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
		// @ts-expect-error
		crosshair: {
			line: {
				color: '#F66',
				width: 1,
			},
			sync: {
				enabled: true,
				group: 1,
				suppressTooltips: false,
			},
			zoom: {
				enabled: false,
			},
		},
	},
	scales: {
		x: {
			ticks: {
				color: 'white',
			},
		},
	},
};

/**
 * Options for the TL chart.
 * @constant
 * @type {optionsProps}
 */
const optionsTL: optionsProps = {
	...baseOptions,
	plugins: {
		...baseOptions?.plugins,
		tooltip: {
			...baseOptions?.plugins?.tooltip,
			callbacks: {
				label: function (context: TooltipItem<'line'>) {
					const label = context.dataset.label ?? '';
					const value = context.parsed.y;
					if (label === 'Temperatur') {
						return `${label}: ${value}°C`;
					} else if (label === 'Luftfeuchtigkeit') {
						return `${label}: ${value}%`;
					}
					return `${label}: ${value}`;
				},
			},
		},
	},
	scales: {
		...baseOptions?.scales,
		temp: {
			type: 'linear',
			display: true,
			position: 'left',
			ticks: {
				color: 'white',
				callback: function (value: string | number) {
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
				callback: function (value: string | number) {
					return `${value}%`;
				},
			},
		},
	},
};

/**
 * Options for the PA chart.
 * @constant
 * @type {optionsProps}
 */
const optionsPA: optionsProps = {
	...baseOptions,
	plugins: {
		...baseOptions?.plugins,
		tooltip: {
			...baseOptions?.plugins?.tooltip,
			callbacks: {
				label: function (context: TooltipItem<'line'>) {
					const label = context.dataset.label ?? '';
					const value = context.parsed.y;
					if (label === 'Pressure') {
						return `${label}: ${value} hPa`;
					} else if (label === 'Altitude') {
						return `${label}: ${value} m`;
					}
					return `${label}: ${value}`;
				},
			},
		},
	},
	scales: {
		...baseOptions?.scales,
		pressure: {
			type: 'linear',
			display: true,
			position: 'left',
			ticks: {
				color: 'white',
				callback: function (value: string | number) {
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
				callback: function (value: string | number) {
					return `${value} m`;
				},
			},
			grid: {
				drawOnChartArea: false,
			},
		},
	},
};

/**
 * Initial state for the component.
 * @constant
 * @type {Object}
 */
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

	isSmallScreen: window.innerWidth <= 768,
	currentGraph: 'TL',
};

/**
 * Main component for displaying the map and related data.
 * @function
 * @returns {JSX.Element} Rendered component.
 */
const MapMain = (): JSX.Element => {
	const [state, setState] = useState(initialState);

	const map = useRef<L.Map>(null);
	const polyline = useRef<L.Polyline>(null);
	const tlGraphContainer = useRef<HTMLDivElement>(null);
	const paGraphContainer = useRef<HTMLDivElement>(null);

	const [data] = useState<StratosphereData[]>(inputData);

	/**
	 * Toggles the full-screen mode for the Temperature and Humidity graph.
	 */
	const handleToggleTLFullScreen = useCallback(() => {
		setState((prevState) => ({
			...prevState,
			isTLFullScreen: !prevState.isTLFullScreen,
		}));
	}, []);

	/**
	 * Toggles the full-screen mode for the Pressure and Altitude graph.
	 */
	const handleTogglePAFullScreen = useCallback(() => {
		setState((prevState) => ({
			...prevState,
			isPAFullScreen: !prevState.isPAFullScreen,
		}));
	}, []);

	/**
	 * Handles window resize events to update the isSmallScreen state.
	 */
	const handleResize = useCallback(() => {
		setState((prevState) => ({
			...prevState,
			isSmallScreen: window.innerWidth < 768,
		}));
	}, []);

	/**
	 * Handles click events on the polyline to display a popup with relevant data.
	 *
	 * @param {Object} event - The click event object.
	 */
	const handlePolylineClick = useCallback((event: { latlng: any }) => {
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
	}, []);

	/**
	 * Sets the size of the container based on the full-screen state.
	 *
	 * @param {HTMLDivElement} container - The container element.
	 * @param {boolean} isFullScreen - Indicates if the container should be in full-screen mode.
	 */
	const setContainerSize = (container: HTMLDivElement, isFullScreen: boolean) => {
		if (isFullScreen) {
			if (state.isSmallScreen) {
				container.style.width = '200%';
			} else {
				container.style.width = '100%';
			}
			container.style.height = '95vh';
		} else {
			container.style.width = '';
			container.style.height = '';
		}
	};

	/**
	 * Toggles between the Temperature and Humidity graph and the Pressure and Altitude graph on smaller screens.
	 */
	const toggleGraphDisplay = () => {
		setState((prevState) => ({
			...prevState,
			currentGraph: prevState.currentGraph === 'TL' ? 'PA' : 'TL',
		}));
	};

	/**
	 * Updates the chart data for pressure and altitude based on the weather data.
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
	 * Updates the chart data for pressure and altitude based on the weather data.
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
	 * Updates the map location based on the latest data point.
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

	/**
	 * Adds an event listener to handle window resize events.
	 */
	useEffect(() => {
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	/**
	 * Adjusts the size of the graph containers based on the full-screen state.
	 */
	useEffect(() => {
		if (tlGraphContainer.current) {
			setContainerSize(tlGraphContainer.current, state.isTLFullScreen);
		}
		if (paGraphContainer.current) {
			setContainerSize(paGraphContainer.current, state.isPAFullScreen);
		}
	}, [state.isPAFullScreen, state.isTLFullScreen]);

	const locations = data.map((entry) => [entry.lat, entry.lon]);
	if (map.current) map.current.setView([48.56099, 13.44782], 10);

	return (
		<div>
			{/* Button to switch between graphs on smaller screens */}
			{state.isSmallScreen && (
				<button onClick={toggleGraphDisplay} className="absolute right-0 top-0 z-20">
					Switch Graph
				</button>
			)}

			{state.showChartTL &&
				(!state.isSmallScreen || (state.isSmallScreen && state.currentGraph === 'TL')) && (
					<div
						className={`absolute left-0 top-0 overflow-hidden ${
							state.isTLFullScreen
								? 'z-50 h-screen w-screen max-md:overflow-x-scroll'
								: 'z-10 w-full md:w-5/12 2xl:w-1/3'
						} bg-slate-900`}
					>
						<button
							onClick={handleToggleTLFullScreen}
							className="left-0 top-0 flex items-center text-white xl:absolute"
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
						<div className="h-[30vh]" ref={tlGraphContainer}>
							<Line data={state.chartDataTL as dataProps} options={optionsTL} />
						</div>
					</div>
				)}

			{state.showChartPA &&
				(!state.isSmallScreen || (state.isSmallScreen && state.currentGraph === 'PA')) && (
					<div
						className={`absolute right-0 top-0 ml-10 overflow-hidden ${
							state.isPAFullScreen
								? 'z-50 h-screen w-screen max-md:overflow-x-scroll'
								: 'z-10 w-full md:w-5/12 2xl:w-1/3'
						} bg-slate-900`}
					>
						<button
							onClick={handleTogglePAFullScreen}
							className="left-0 top-0 flex items-center text-white xl:absolute"
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
						<div className="h-[30vh]" ref={paGraphContainer}>
							<Line data={state.chartDataPA as dataProps} options={optionsPA} />
						</div>
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

export default memo(MapMain);
