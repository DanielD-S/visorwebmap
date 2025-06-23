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
  const [kmlFile, setKmlFile] = useState(null);
  const [manualPointData, setManualPointData] = useState(null);
  const [mode, setMode] = useState('daily');

  useEffect(() => {
    const today = new Date();
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const calculateStartDate = (end, days) => {
    const [day, month, year] = end.split('-');
    const safeEndDate = new Date(`${year}-${month}-${day}`);
    const startDate = new Date(safeEndDate);
    startDate.setDate(startDate.getDate() - days + 1);
    return startDate.toISOString().split('T')[0];
  };

  const fetchWeatherData = async (lat, lon, forManualClick = false) => {
    setLoading(true);
    setError('');

    try {
      const [day, month, year] = endDate.split('-');
      const safeEndDate = new Date(`${year}-${month}-${day}`);
      const formattedEnd = safeEndDate.toISOString().split('T')[0];
      const startDate = calculateStartDate(endDate, daysBack);
      const variables = Object.keys(WEATHER_VARIABLES).join(',');
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${formattedEnd}&daily=${variables}&timezone=auto`;

      const res = await fetch(url);
      const data = await res.json();

      if (data && data.daily && data.daily.time) {
        const processed = processChartData(data);

        if (forManualClick) {
          const temps = data.daily.temperature_2m_max || [];
          const min = Math.min(...temps);
          const max = Math.max(...temps);
          const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
          setManualPointData({ lat, lon, avg: avg.toFixed(1), min, max });
        } else {
          setChartsData(processed);
        }
      } else {
        if (forManualClick) setManualPointData(null);
        else setChartsData({});
        setError('La API no devolvió datos válidos.');
      }
    } catch (err) {
      console.error('Error al obtener datos:', err);
      setError('Error al obtener datos (ver consola).');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherDataHourly = async (lat, lon) => {
    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const past = new Date(now);
      past.setHours(now.getHours() - 48);

      const startISO = past.toISOString().split('T')[0];
      const endISO = now.toISOString().split('T')[0];

      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startISO}&end_date=${endISO}&hourly=temperature_2m,precipitation,windspeed_10m&timezone=auto`;

      const res = await fetch(url);
      const data = await res.json();

      if (data && data.hourly && data.hourly.time) {
        const processed = processHourlyChartData(data.hourly);
        setChartsData(processed);
      } else {
        setChartsData({});
        setError('No se recibieron datos horarios válidos.');
      }
    } catch (err) {
      console.error('Error al obtener datos horarios:', err);
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

  const processHourlyChartData = (hourly) => {
    const labels = hourly.time.map(t =>
      new Date(t).toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    );
    const variables = {
      temperature_2m: { label: 'Temperatura', unit: '°C', color: 'rgba(255,99,132,0.8)' },
      precipitation: { label: 'Precipitación', unit: 'mm', color: 'rgba(54,162,235,0.8)' },
      windspeed_10m: { label: 'Viento', unit: 'km/h', color: 'rgba(255,206,86,0.8)' }
    };
    const result = {};
    for (const key in variables) {
      if (hourly[key]) {
        result[key] = {
          labels,
          data: hourly[key],
          config: variables[key]
        };
      }
    }
    return result;
  };

  const handleClick = () => {
    const coord = coordinates.find(c => c.id === selectedId);
    const today = new Date().toISOString().split('T')[0];

    if (!coord || (mode === 'daily' && (!endDate || daysBack < 7 || daysBack > 56))) {
      setError('Verifica que todos los campos estén completos y correctos.');
      return;
    }

    if (endDate > today && mode === 'daily') {
      setError('No puedes consultar fechas futuras.');
      return;
    }

    setLatitude(coord.lat);
    setLongitude(coord.long);
    setManualPointData(null);

    if (mode === 'hourly') {
      fetchWeatherDataHourly(coord.lat, coord.long);
    } else {
      fetchWeatherData(coord.lat, coord.long, false);
    }
  };

  const handleMapClick = (lat, lon) => {
    if (mode === 'daily') {
      setManualPointData(null);
      fetchWeatherData(lat, lon, true);
    } else {
      setError('Solo puedes usar clic en el mapa en modo Diario.');
    }
  };

  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">Visualizador Climático</h1>

      <div className="form-group text-center mb-3">
        <label className="me-2">Modo de consulta:</label>
        <select
          className="form-select d-inline-block w-auto"
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
      />

      <div className="d-flex justify-content-center mt-3">
        <button
          onClick={handleClick}
          className="btn btn-primary"
          disabled={loading || !selectedId || (mode === 'daily' && (!endDate || daysBack < 7 || daysBack > 56))}
        >
          {loading ? 'Cargando...' : 'Consultar datos climáticos'}
        </button>
      </div>

      {loading && <div className="text-center text-muted mt-3">Cargando datos climáticos...</div>}
      {error && <div className="alert alert-danger mt-3 text-center">{error}</div>}

      {(Object.keys(chartsData).length > 0 || manualPointData) && (
        <section className="mt-5">
          <h2 className="mb-3">Resultados</h2>

          <div className="card p-3 mb-4">
            <div className="d-flex align-items-center flex-wrap gap-3">
              <input
                type="file"
                accept=".kml,.geojson"
                onChange={(e) => setKmlFile(e.target.files[0])}
                className="form-control"
                style={{ maxWidth: '300px' }}
              />
              {kmlFile && (
                <>
                  <span className="text-muted small">
                    Archivo cargado: <strong>{kmlFile.name}</strong>
                  </span>
                  <button
                    onClick={() => setKmlFile(null)}
                    className="btn btn-sm btn-outline-danger"
                  >
                    Quitar archivo
                  </button>
                </>
              )}
            </div>
          </div>

          <WeatherMap
            lat={latitude}
            lon={longitude}
            id={selectedId}
            file={kmlFile}
            onMapClick={handleMapClick}
            manualPoint={manualPointData}
          />

          {Object.keys(chartsData).length > 0 && (
            <WeatherCharts chartsData={chartsData} mode={mode} />
          )}
        </section>
      )}
    </div>
  );
}

export default App;
