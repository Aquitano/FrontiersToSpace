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
import L from 'leaflet';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
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
);

const optionsTL = {
	responsive: true,
	plugins: {
		tooltip: {
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
						yAdjust: -75,
					},
				},
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
						xAdjust: -30,
					},
				},
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

const MapMain = () => {
	const [isTLFullScreen, setIsTLFullScreen] = useState(false);
	const [isPAFullScreen, setIsPAFullScreen] = useState(false);

	// Chart data for temperature and humidity
	const [chartDataTL, setChartDataTL] = useState<ChartData | {}>({});
	const [showChartTL, setShowChartTL] = useState(false);

	// Chart data for pressure and altitude
	const [chartDataPA, setChartDataPA] = useState<ChartData | {}>({});
	const [showChartPA, setShowChartPA] = useState(false);

	const [location, setLocation] = useState<[number, number]>([0, 0]);
	const map = useRef<L.Map>(null);

	const [data] = useState<StratosphereData[]>(inputData);

	/**
	 * Effect to update chart data when weather data changes.
	 */
	useEffect(() => {
		if (data) {
			const times = data.map((entry) => {
				const date = new Date(entry.date * 1000);
				return `${date.getHours()}:${date.getMinutes()}`;
			});
			const temps = data.map((entry) => entry.tmp.toFixed(2));
			const humidity = data.map((entry) => entry.hum);

			setChartDataTL({
				labels: times,
				datasets: [
					{
						label: 'Temperatur (°C)',
						data: temps,
						fill: false,
						backgroundColor: 'rgb(75, 192, 192)',
						borderColor: 'rgba(75, 192, 192, 0.5)',
						tension: 1,
						pointRadius: 0.4,
						yAxisID: 'temp',
					},
					{
						label: 'Luftfeuchtigkeit (%)',
						data: humidity,
						fill: false,
						backgroundColor: 'rgb(255, 99, 132)',
						borderColor: 'rgba(255, 99, 132, 0.5)',
						tension: 1,
						pointRadius: 0.4,
						yAxisID: 'hum',
					},
				],
			});
			setShowChartTL(true);
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
				return `${date.getHours()}:${date.getMinutes()}`;
			});

			const pressures = pressureData.map((entry) => entry.pressure.toFixed(2));
			const altitudes = pressureData.map((entry) => entry.altitude.toFixed(2));

			if (pressures.length > 0 && altitudes.length > 0) {
				setChartDataPA({
					labels: times,
					datasets: [
						{
							label: 'Luftdruck (hPa)',
							data: pressures,
							yAxisID: 'pressure',
							fill: false,
							backgroundColor: 'rgb(75, 192, 192)',
							borderColor: 'rgba(75, 192, 192, 0.5)',
							tension: 1,
							pointRadius: 0.4,
						},
						{
							label: 'Höhe (m)',
							data: altitudes,
							yAxisID: 'altitude',
							fill: false,
							backgroundColor: 'rgb(255, 99, 132)',
							borderColor: 'rgba(255, 99, 132, 0.5)',
							tension: 1,
							pointRadius: 0.4,
						},
					],
				});
				setShowChartPA(true);
			}
		}
	}, [data]);

	/**
	 * Effect to update location when data changes.
	 */
	useEffect(() => {
		if (data) {
			const lastDataPoint = data[data.length - 1];
			setLocation([lastDataPoint.lat, lastDataPoint.lon]);
		}
	}, [data]);

	const locations = data.map((entry) => [entry.lat, entry.lon]);
	if (map.current) map.current.setView([48.56099, 13.44782], 10);

	return (
		<div>
			{showChartTL && (
				<div
					className={`absolute left-0 top-0 ${
						isTLFullScreen ? 'z-50 h-full w-full' : 'z-10 w-full md:w-1/3'
					} bg-slate-900`}
				>
					{/* ... */}
					{/* Text and icon on same line */}
					<button onClick={() => setIsTLFullScreen(!isTLFullScreen)} className="flex items-center">
						<img
							src={fullscreenIcon.src}
							width={20}
							height={20}
							alt="Toggle Full Screen"
							className="invert"
						/>
						{/* @ts-ignore */}
						Vergrößern
					</button>
					{/* @ts-ignore */}
					<Line data={chartDataTL} options={optionsTL} />
				</div>
			)}
			{showChartPA && (
				<div
					className={`absolute right-0 top-0 ${
						isPAFullScreen ? 'z-50 h-full w-full' : 'z-10 w-full md:w-1/3'
					} bg-slate-900`}
				>
					<button onClick={() => setIsPAFullScreen(!isPAFullScreen)} className="flex items-center">
						<img
							src={fullscreenIcon.src}
							width={20}
							height={20}
							alt="Toggle Full Screen"
							className="invert"
						/>
						Vergrößern
					</button>
					{/* @ts-ignore */}
					<Line data={chartDataPA} options={optionsPA} />
				</div>
			)}
			<MapContainer
				center={location}
				zoom={13}
				scrollWheelZoom={true}
				style={{ height: '100vh', zIndex: 0 }}
				ref={map}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				{/* @ts-expect-error */}
				{locations && <Polyline positions={locations} />}
				<Marker
					position={location}
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
						Derzeitige Position: <br /> {location[0].toFixed(3)}, {location[1].toFixed(3)}
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
						Ballon ist geplatzt: <br /> 48.6063067, 12.9076828 <br /> 14:20
					</Popup>
				</Marker>
			</MapContainer>
		</div>
	);
};

export default MapMain;
