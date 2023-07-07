import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import L from "leaflet";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { trpc } from "../utils/trpc";

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
  Legend
);

const options = {
  responsive: true,
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context: {
          dataset: { label: string };
          parsed: { y: any };
        }) {
          const label = context.dataset.label || "";
          const value = context.parsed.y;
          if (label === "Temperature") {
            return `${label}: ${value}°C`;
          } else if (label === "Humidity") {
            return `${label}: ${value}%`;
          }
          return `${label}: ${value}`;
        },
      },
    },
    legend: {
      labels: {
        color: "white",
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: "white",
      },
    },
    y: {
      ticks: {
        color: "white",
      },
    },
  },
};

const MapMain = () => {
  // @ts-ignore
  const { data } = trpc.getLocation.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const { data: weatherData } = trpc.getWeathers.useQuery(undefined);
  const { data: recentWeatherData } = trpc.getWeather.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const [chartData, setChartData] = useState({});
  const [showChart, setShowChart] = useState(false);
  const [location, setLocation] = useState<[number, number]>([0, 0]);
  const map = useRef<L.Map>(null);

  /**
   * Effect to update chart data when weather data changes.
   */
  useEffect(() => {
    if (weatherData) {
      console.log(weatherData);
      const times = weatherData.map((entry) => {
        const date = new Date(entry.time);
        return `${date.getHours()}:${date.getMinutes()}`;
      });
      const temps = weatherData.map((entry) => entry.temp);
      const humidity = weatherData.map((entry) => entry.humidity);

      setChartData({
        labels: times,
        datasets: [
          {
            label: "Temperatur",
            data: temps,
            fill: false,
            backgroundColor: "rgb(75, 192, 192)",
            borderColor: "rgba(75, 192, 192, 0.2)",
          },
          {
            label: "Luftfeuchtigkeit",
            data: humidity,
            fill: false,
            backgroundColor: "rgb(255, 99, 132)",
            borderColor: "rgba(255, 99, 132, 0.2)",
          },
        ],
      });
      setShowChart(true);
    }
  }, [weatherData]);

  /**
   * Effect to update location when data changes.
   */
  useEffect(() => {
    if (data) {
      setLocation([data.lat, data.lng]);
      if (map.current) map.current.setView([data.lat, data.lng], 10);
    }
  }, [data]);

  /**
   * Effect to update chart data when recent weather data changes.
   */
  useEffect(() => {
    if (recentWeatherData) {
      setChartData((prevData) => {
        const newTime = new Date(recentWeatherData.time);
        const newTimeFormatted = `${newTime.getHours()}:${newTime.getMinutes()}`;
        const newTemp = recentWeatherData.temp;
        const newHumidity = recentWeatherData.humidity;

        return {
          ...prevData,
          labels: [...prevData.labels, newTimeFormatted],
          datasets: [
            {
              ...prevData.datasets[0],
              data: [...prevData.datasets[0].data, newTemp],
            },
            {
              ...prevData.datasets[1],
              data: [...prevData.datasets[1].data, newHumidity],
            },
          ],
        };
      });
    }
  }, [recentWeatherData]);

  return (
    <div>
      {showChart && (
        <div className="absolute left-0 top-0 z-10 h-1/3 w-1/3 bg-slate-900">
          {/* @ts-ignore */}
          <Line data={chartData} options={options} />
        </div>
      )}
      {/* <p>{JSON.stringify(data)}</p> */}
      <MapContainer
        center={location}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100vh", zIndex: 0 }}
        ref={map}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={location}
          icon={L.icon({
            iconUrl: markerIcon.src,
            shadowUrl: markerShadow.src,
            iconSize: [markerIcon.width, markerIcon.height],
            popupAnchor: [0, -20],
            shadowAnchor: [10, 20],
            shadowSize: [markerShadow.width, markerShadow.height],
          })}
        >
          <Popup>
            Derzeitige Position: <br /> {location[0]}, {location[1]}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapMain;
