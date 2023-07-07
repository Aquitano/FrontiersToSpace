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
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
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

const optionsTL = {
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
          if (label === "Temperatur") {
            return `${label}: ${value}°C`;
          } else if (label === "Luftfeuchtigkeit") {
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

const optionsPA = {
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
          if (label === "Pressure") {
            return `${label}: ${value} hPa`;
          } else if (label === "Altitude") {
            return `${label}: ${value} m`;
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
    pressure: {
      type: "linear",
      display: true,
      position: "left",
      ticks: {
        color: "white",
        callback: function (value, index, values) {
          return `${value} hPa`;
        },
      },
    },
    altitude: {
      type: "linear",
      display: true,
      position: "right",
      ticks: {
        color: "white",
        callback: function (value, index, values) {
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
  // @ts-ignore
  const { data } = trpc.getLocation.useQuery(undefined, {
    refetchInterval: 5000,
  });
  // @ts-ignore
  const { data: weatherData } = trpc.getWeathers.useQuery();
  // @ts-ignore
  const { data: recentWeatherData } = trpc.getWeather.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const { data: locations, refetch: refetchLocations } =
    // @ts-ignore
    trpc.getLocations.useQuery(undefined);

  // Chart data for temperature and humidity
  const [chartDataTL, setChartDataTL] = useState<ChartData | {}>({});
  const [showChartTL, setShowChartTL] = useState(false);

  // Chart data for pressure and altitude
  const [chartDataPA, setChartDataPA] = useState<ChartData | {}>({});
  const [showChartPA, setShowChartPA] = useState(false);

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

      setChartDataTL({
        labels: times,
        datasets: [
          {
            label: "Temperatur (°C)",
            data: temps,
            fill: false,
            backgroundColor: "rgb(75, 192, 192)",
            borderColor: "rgba(75, 192, 192, 0.2)",
          },
          {
            label: "Luftfeuchtigkeit (%)",
            data: humidity,
            fill: false,
            backgroundColor: "rgb(255, 99, 132)",
            borderColor: "rgba(255, 99, 132, 0.2)",
          },
        ],
      });
      setShowChartTL(true);
    }
  }, [weatherData]);

  /**
   * Effect to update chart data for pressure and altitude when weather data changes.
   */
  useEffect(() => {
    if (weatherData) {
      const pressureData = weatherData
        .map((entry) => ({
          time: entry.time,
          pressure: entry.pressure,
          altitude: entry.altitude,
        }))
        .filter((entry) => entry.pressure !== null && entry.altitude !== null);

      const times = pressureData.map((entry) => {
        const date = new Date(entry.time);
        return `${date.getHours()}:${date.getMinutes()}`;
      });

      const pressures = pressureData.map((entry) => entry.pressure);
      const altitudes = pressureData.map((entry) => entry.altitude);

      if (pressures.length > 0 && altitudes.length > 0) {
        setChartDataPA({
          labels: times,
          datasets: [
            {
              label: "Luftdruck (hPa)",
              data: pressures,
              yAxisID: "pressure",
              fill: false,
              backgroundColor: "rgb(75, 192, 192)",
              borderColor: "rgba(75, 192, 192, 0.2)",
            },
            {
              label: "Höhe (m)",
              data: altitudes,
              yAxisID: "altitude",
              fill: false,
              backgroundColor: "rgb(255, 99, 132)",
              borderColor: "rgba(255, 99, 132, 0.2)",
            },
          ],
        });
        setShowChartPA(true);
      }
    }
  }, [weatherData]);

  /**
   * Effect to update chart data when recent weather data changes.
   */
  useEffect(() => {
    if (recentWeatherData) {
      setChartDataTL((prevData: ChartData) => {
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

      if (
        recentWeatherData.pressure !== null &&
        recentWeatherData.altitude !== null
      ) {
        setChartDataPA((prevData: ChartData) => {
          const newTime = new Date(recentWeatherData.time);
          const newTimeFormatted = `${newTime.getHours()}:${newTime.getMinutes()}`;
          const newPressure = recentWeatherData.pressure;
          const newAltitude = recentWeatherData.altitude;

          return {
            ...prevData,
            labels: [...prevData.labels, newTimeFormatted],
            datasets: [
              {
                ...prevData.datasets[0],
                data: [...prevData.datasets[0].data, newPressure],
              },
              {
                ...prevData.datasets[1],
                data: [...prevData.datasets[1].data, newAltitude],
              },
            ],
          };
        });
      }
    }
  }, [recentWeatherData]);

  /**
   * Effect to update location when data changes.
   */
  useEffect(() => {
    if (data) {
      setLocation([data.lat, data.lng]);
      if (map.current) map.current.setView([data.lat, data.lng], 10);
      void refetchLocations();
    }
  }, [data]);

  return (
    <div>
      {showChartTL && (
        <div className="absolute left-0 top-0 z-10 h-1/3 w-1/3 bg-slate-900">
          {/* @ts-ignore */}
          <Line data={chartDataTL} options={optionsTL} />
        </div>
      )}
      {showChartPA && (
        <div className="absolute right-0 top-0 z-10 h-1/3 w-1/3 bg-slate-900">
          {/* @ts-ignore */}
          <Line data={chartDataPA} options={optionsPA} />
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
        {locations && <Polyline positions={locations} />}
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
