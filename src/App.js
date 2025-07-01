import React, { useEffect, useState } from 'react';
import './App.css';
import 'leaflet-omnivore';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';

import { WEATHER_VARIABLES } from './data/weatherVariables';
import { coordinates } from './data/coordinates';
import WeatherForm from './components/WeatherForm';
import WeatherCharts from './components/WeatherCharts';
import WeatherMap from './components/WeatherMap';
import WeatherAlerts from './components/AlertDashboard';
import ExecutiveSummary from './components/ExecutiveSummary';
import CombinedAnalysis from './components/CombinedAnalysis';


function App() {
  const [selectedId, setSelectedId] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [endDate, setEndDate] = useState('');
  const [chartsData, setChartsData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('historical');
  const [lastQueriedId, setLastQueriedId] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const today = new Date();
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    setChartsData({});
    setLastQueriedId('');
  }, [selectedId]);

  const computeStats = (data) => {
    const valid = data.filter(d => typeof d === 'number' && !isNaN(d));
    const sum = valid.reduce((a,b)=>a+b,0);
    return {
      avg: valid.length ? (sum / valid.length).toFixed(1) : 0,
      min: valid.length ? Math.min(...valid) : 0,
      max: valid.length ? Math.max(...valid) : 0
    };
  };

  const computeRange = (data) => {
    const min = Math.min(...(data || [0]));
    const max = Math.max(...(data || [0]));
    return `${(max - min).toFixed(1)} km/h (${min} - ${max})`;
  };

  const fetchForecastData = async (lat, lon) => {
    setLoading(true);
    setError('');
    setChartsData({});
    const variables = ['temperature_2m_max', 'precipitation_sum', 'windspeed_10m_max', 'pressure_msl_max'].join(',');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=${variables}&forecast_days=7&timezone=auto`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log("📦 Forecast data:", data.daily);
      if (data && data.daily && data.daily.time) {
        const processed = processChartData(data);
        setChartsData(processed);
        setLastQueriedId(selectedId);
      } else {
        setChartsData({});
        setError('No se recibieron datos de pronóstico válidos.');
      }
    } catch (err) {
      setError('Error al obtener datos de pronóstico.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async (lat, lon) => {
    setLoading(true);
    setError('');
    const today = new Date().toISOString().split('T')[0];
    const startDate = endDate; // desde fecha elegida hasta hoy
    const variables = ['temperature_2m_max', 'precipitation_sum', 'windspeed_10m_max', 'pressure_msl_max'].join(',');
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${today}&daily=${variables}&timezone=auto`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log("📦 Historical data:", data.daily);
      if (data && data.daily && data.daily.time) {
        const processed = processChartData(data);
        setChartsData(processed);
        setLastQueriedId(selectedId);
      } else {
        setChartsData({});
        setError('No se recibieron datos históricos válidos.');
      }
    } catch (err) {
      setError('Error al obtener datos históricos.');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (data) => {
    const dates = data.daily.time.map(date =>
      new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    );
    return {
      temperature_2m_max: {
        labels: dates,
        data: data.daily.temperature_2m_max,
        config: WEATHER_VARIABLES.temperature_2m_max
      },
      precipitation_sum: {
        labels: dates,
        data: data.daily.precipitation_sum,
        config: WEATHER_VARIABLES.rain_sum || { label: 'Lluvia', color: '#74b9ff', unit: 'mm' }
      },
      windspeed_10m_max: {
        labels: dates,
        data: data.daily.windspeed_10m_max,
        config: WEATHER_VARIABLES.windspeed_10m_max || { label: 'Viento Máximo', color: '#55efc4', unit: 'km/h' }
      },
      pressure_msl_max: {
        labels: dates,
        data: data.daily.pressure_msl_max,
        config: WEATHER_VARIABLES.pressure_msl_max || { label: 'Presión', color: '#ffeaa7', unit: 'hPa' }
      }
    };
  };

  const handleClick = () => {
    const coord = coordinates.find(c => c.id === selectedId);
    if (!coord) {
      setError('Selecciona una ubicación válida.');
      return;
    }
    setLatitude(coord.lat);
    setLongitude(coord.long);

    if (mode === 'historical') {
      fetchHistoricalData(coord.lat, coord.long);
    }

    if (mode === 'forecast') {
      fetchForecastData(coord.lat, coord.long);
    }
  };

  const todayDateStr = new Date().toISOString().split('T')[0];

  const summaryData = (latitude && longitude) ? {
    startDate: mode === 'forecast'
      ? todayDateStr
      : endDate,
    endDate: mode === 'forecast'
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : todayDateStr,
    lat: latitude,
    lon: longitude,
    averages: {
      temperature: computeStats(chartsData?.temperature_2m_max?.data || []),
      wind: computeStats(chartsData?.windspeed_10m_max?.data || []),
      pressure: computeStats(chartsData?.pressure_msl_max?.data || [])
    },
    totalRain: chartsData?.precipitation_sum?.data?.reduce((a,b)=>a+b,0).toFixed(1) || 0,
    maxWind: Math.max(...(chartsData?.windspeed_10m_max?.data || [0])),
    risk: "BAJO",
    analysis: [
      { title: "Tendencia Temp", desc: "Estimación moderada" },
      { title: "Precipitación", desc: `Lluvia: ${chartsData?.precipitation_sum?.data?.reduce((a,b)=>a+b,0).toFixed(1) || 0} mm` },
      { title: "Variabilidad Viento", desc: `Rango: ${computeRange(chartsData?.windspeed_10m_max?.data)}` },
      { title: "Estabilidad Atmosférica", desc: "Variable" }
    ],
    alerts: []
  } : null;

  const VisorView = () => (
    <>
      <WeatherForm
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        latitude={latitude}
        longitude={longitude}
        endDate={endDate}
        setEndDate={setEndDate}
        coordinates={coordinates}
        mode={mode}
        setMode={setMode}
        handleClick={handleClick}
      />

      {loading && <div className="text-center text-muted mt-3">Cargando datos climáticos...</div>}
      {error && <div className="alert alert-danger mt-3 text-center">{error}</div>}

      {Object.keys(chartsData).length > 0 && (
        <>
          <section className="mt-5">
            <h2 className="mb-3">Resultados</h2>
            <WeatherMap lat={latitude} lon={longitude} id={selectedId} file={null} />
          </section>

          <div className="tabs mt-4 mb-3">
            <button
              className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Resumen Ejecutivo
            </button>
            <button
              className={`tab-btn ${activeTab === 'variables' ? 'active' : ''}`}
              onClick={() => setActiveTab('variables')}
            >
              Variables
            </button>
            <button
              className={`tab-btn ${activeTab === 'combined' ? 'active' : ''}`}
              onClick={() => setActiveTab('combined')}
            >
              Análisis Combinado
            </button>
          </div>

          {activeTab === 'summary' && summaryData && selectedId === lastQueriedId && (
            <ExecutiveSummary summaryData={summaryData} />
          )}

          {activeTab === 'variables' && (
            <WeatherCharts chartsData={chartsData} mode={mode} />
          )}
       
{activeTab === 'combined' && (
  <CombinedAnalysis combinedData={{
    labels: chartsData?.temperature_2m_max?.labels || [],
    temperature: chartsData?.temperature_2m_max?.data || [],
    humidity: [], // <---- de momento vacío
    pressure: chartsData?.pressure_msl_max?.data || []
  }} />
)}
        </>
      )}
    </>
  );

  return (
    <Router>
      <div className="container control-panel my-4">
        <div className="text-center mb-3">
          <img
            src="https://www.interchilesa.com/wp-content/uploads/2025/03/isa-energia.logo_.png"
            alt="Logo Interchile"
            style={{ maxWidth: '240px', height: 'auto' }}
          />
        </div>

        <h1 className="text-center mb-4">Visualizador Meteorológico ISA Energía</h1>

        <div className="text-center mb-3">
          <Link to="/" className="btn btn-outline-primary me-2">Visor por Torre</Link>
          <Link to="/alertas" className="btn btn-outline-danger">🔔 Alertas Globales</Link>
        </div>

        <Routes>
          <Route path="/" element={<VisorView />} />
          <Route path="/alertas" element={<WeatherAlerts />} />
        </Routes>
      </div>
      <footer className="app-footer">
  © 2025 ISA Energía - Visor Meteorológico. Desarrollado por Daniel Díaz Santander & Luis Alejandro Zapata.
</footer>

    </Router>
    
  );
}

export default App;
