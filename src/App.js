import React, { useEffect, useState } from 'react';
import './App.css';
import 'leaflet-omnivore';

import { WEATHER_VARIABLES } from './data/weatherVariables';
import { coordinates } from './data/coordinates';
import WeatherForm from './components/WeatherForm';
import WeatherCharts from './components/WeatherCharts';
import WeatherMap from './components/WeatherMap';

function App() {
  const [selectedId, setSelectedId] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysBack, setDaysBack] = useState(28);
  const [chartsData, setChartsData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('daily');

function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return (arr.reduce((sum, val) => sum + val, 0) / arr.length).toFixed(1);
}

  useEffect(() => {
    const today = new Date();
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const calculateStartDate = (end, days) => {
    const endDate = new Date(end);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days + 1);
    return startDate.toISOString().split('T')[0];
  };

  const fetchWeatherData = async (lat, lon, forManualClick = false) => {
    setLoading(true);
    setError('');
    const startDate = calculateStartDate(endDate, daysBack);
    const variables = Object.keys(WEATHER_VARIABLES).join(',');
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=${variables}&timezone=auto`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.daily && data.daily.time) {
        const processed = processChartData(data);
        setChartsData(processed);
      } else {
        setChartsData({});
        setError('No se recibieron datos diarios válidos.');
      }
    } catch (err) {
      setError('Error al obtener datos diarios.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherDataHourly = async (lat, lon) => {
    setLoading(true);
    setError('');
    setChartsData({});

    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);

    const now = new Date();
    const startDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const start = startDate.toISOString().split('T')[0];
    const end = now.toISOString().split('T')[0];

    const variables = 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation';

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${parsedLat}&longitude=${parsedLon}&start_date=${start}&end_date=${end}&hourly=${variables}&timezone=auto`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.hourly && data.hourly.time) {
        const processed = processHourlyChartData(data);
        setChartsData(processed);
      } else {
        setError('No se recibieron datos horarios válidos.');
      }
    } catch (err) {
      setError('Error al obtener datos horarios.');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (data) => {
    const dates = data.daily.time.map(date =>
      new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    );

    const datasets = {};
    Object.keys(WEATHER_VARIABLES).forEach(variable => {
      if (data.daily[variable]) {
        datasets[variable] = {
          labels: dates,
          data: data.daily[variable],
          config: WEATHER_VARIABLES[variable]
        };
      }
    });

    return datasets;
  };

  const processHourlyChartData = (data) => {
    const labels = data.hourly.time.map(date =>
      new Date(date).toLocaleString('es-CL', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      })
    );

    const mapVar = (key, label, color, unit) => ({
      labels,
      data: data.hourly[key],
      config: { label, color, unit }
    });

    return {
      temperature: mapVar('temperature_2m', 'Temperatura', 'rgba(255, 99, 132, 0.8)', '°C'),
      humidity: mapVar('relative_humidity_2m', 'Humedad relativa', 'rgba(54, 162, 235, 0.8)', '%'),
      wind: mapVar('wind_speed_10m', 'Velocidad del viento', 'rgba(75, 192, 192, 0.8)', 'km/h'),
      precipitation: mapVar('precipitation', 'Precipitación', 'rgba(153, 102, 255, 0.8)', 'mm')
    };
  };

  const handleClick = () => {
    const coord = coordinates.find(c => c.id === selectedId);
    const today = new Date().toISOString().split('T')[0];

    if (!coord) {
      setError('Selecciona una ubicación válida.');
      return;
    }

    setLatitude(coord.lat);
    setLongitude(coord.long);

    if (mode === 'daily') {
      if (!endDate || daysBack < 7 || daysBack > 56 || endDate > today) {
        setError('Verifica que todos los campos estén completos y correctos.');
        return;
      }
      fetchWeatherData(coord.lat, coord.long, false);
    }

    if (mode === 'hourly') {
      fetchWeatherDataHourly(coord.lat, coord.long);
    }
  };

  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">Visualizador Climático</h1>

      <div className="form-group text-center">
        <label className="fw-bold">Modo de consulta:</label>
        <select
          className="form-select d-inline w-auto ms-2"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="daily">Diario</option>
          <option value="hourly">Por hora (últimas 48h)</option>
        </select>
      </div>

      <WeatherForm
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        latitude={latitude}
        longitude={longitude}
        endDate={endDate}
        setEndDate={setEndDate}
        daysBack={daysBack}
        setDaysBack={setDaysBack}
        coordinates={coordinates}
        mode={mode}
      />

      <div className="d-flex justify-content-center mt-3">
        <button
          onClick={handleClick}
          className="btn btn-primary"
          disabled={loading || (!selectedId && mode === 'daily')}
        >
          {loading ? 'Cargando...' : 'Consultar datos climáticos'}
        </button>
      </div>

      {loading && <div className="text-center text-muted mt-3">Cargando datos climáticos...</div>}
      {error && <div className="alert alert-danger mt-3 text-center">{error}</div>}

      {Object.keys(chartsData).length > 0 && (
        <section className="mt-5">
          <h2 className="mb-3">Resultados</h2>
          <WeatherMap
  lat={latitude}
  lon={longitude}
  id={selectedId}
  manualPoint={
    mode === 'daily' && chartsData.temperature_2m_max
      ? {
          lat: parseFloat(latitude),
          lon: parseFloat(longitude),
          avg: average(chartsData.temperature_2m_max.data),
          min: Math.min(...(chartsData.temperature_2m_min?.data || [])),
          max: Math.max(...chartsData.temperature_2m_max.data)
        }
      : null
  }
  onMapClick={(lat, lon) => {
    setLatitude(lat);
    setLongitude(lon);
    setSelectedId('');
    if (mode === 'daily') {
      fetchWeatherData(lat, lon);
    } else {
      fetchWeatherDataHourly(lat, lon);
    }
  }}
/>

          <WeatherCharts chartsData={chartsData} />
        </section>
      )}
    </div>
  );
}

export default App;
