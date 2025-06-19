import React, { useEffect, useState } from 'react';
import './App.css';
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

  const fetchWeatherData = async (lat, lon) => {
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
        setError('La API no devolvió datos válidos para esta ubicación o rango de fechas.');
      }
    } catch (err) {
      setError('Error al obtener datos');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (data) => {
    const dates = data.daily.time.map(date => new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }));
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
    fetchWeatherData(coord.lat, coord.long);
  };

  return (
    <div className="container">
      <h1>Visualizador Climático</h1>

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

      <div className="form-row" style={{ justifyContent: 'center', marginTop: '20px' }}>
        <button
          onClick={handleClick}
          className="btn btn-primary"
          disabled={loading || !selectedId || !endDate || daysBack < 7 || daysBack > 56}
        >
          {loading ? 'Cargando...' : 'Consultar datos climáticos'}
        </button>
      </div>

      {loading && <div className="loading">Cargando datos climáticos...</div>}
      {error && <div className="error">{error}</div>}

     {Object.keys(chartsData).length > 0 && (
  <>
    <WeatherMap lat={latitude} lon={longitude} id={selectedId} />
    <WeatherCharts chartsData={chartsData} />
  </>
)}

    </div>
  );
}

export default App;
