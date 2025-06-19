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
    const startDate = calculateStartDate(endDate, daysBack);
    const variables = Object.keys(WEATHER_VARIABLES).join(',');
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=${variables}&timezone=auto`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.daily && data.daily.time) {
        const processed = processChartData(data);

        if (forManualClick) {
          const temps = data.daily.temperature_2m_max || [];
          const min = Math.min(...temps);
          const max = Math.max(...temps);
          const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
          setManualPointData({
            lat,
            lon,
            avg: avg.toFixed(1),
            min,
            max
          });
        } else {
          setChartsData(processed);
        }
      } else {
        if (forManualClick) setManualPointData(null);
        else setChartsData({});
        setError('La API no devolvió datos válidos.');
      }
    } catch (err) {
      setError('Error al obtener datos');
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

  const handleClick = () => {
    const coord = coordinates.find(c => c.id === selectedId);
    const today = new Date().toISOString().split('T')[0];

    if (!coord || !endDate || daysBack < 7 || daysBack > 56) {
      setError('Verifica que todos los campos estén completos y correctos.');
      return;
    }

    if (endDate > today) {
      setError('No puedes consultar fechas futuras.');
      return;
    }

    setLatitude(coord.lat);
    setLongitude(coord.long);
    setManualPointData(null); // limpiar marcador manual si viene de una torre
    fetchWeatherData(coord.lat, coord.long, false);
  };

  const handleMapClick = (lat, lon) => {
    setManualPointData(null); // resetear cualquier popup anterior
    fetchWeatherData(lat, lon, true);
  };

  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">Visualizador Climático</h1>

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
          disabled={loading || !selectedId || !endDate || daysBack < 7 || daysBack > 56}
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
            <WeatherCharts chartsData={chartsData} />
          )}
        </section>
      )}
    </div>
  );
}

export default App;
