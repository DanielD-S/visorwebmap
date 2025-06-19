import React, { useEffect, useState } from 'react';
import './App.css';
import { Chart } from 'chart.js/auto';
import { WEATHER_VARIABLES } from './data/weatherVariables';
import { coordinates } from './data/coordinates';

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

  useEffect(() => {
    if (selectedId) {
      const coord = coordinates.find(c => c.id === selectedId);
      if (coord) {
        setLatitude(coord.lat);
        setLongitude(coord.long);
        fetchWeatherData(coord.lat, coord.long);
      }
    }
  }, [selectedId]);

  const calculateStartDate = (end, days) => {
    const endDate = new Date(end);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days + 1);
    return startDate.toISOString().split('T')[0];
  };

  const fetchWeatherData = async (lat, lon) => {
    if (!endDate || daysBack < 7 || daysBack > 56) return;
    setLoading(true);
    setError('');

    const startDate = calculateStartDate(endDate, daysBack);
    const variables = Object.keys(WEATHER_VARIABLES).join(',');
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=${variables}&timezone=auto`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      const processed = processChartData(data);
      setChartsData(processed);
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

  useEffect(() => {
    Object.entries(chartsData).forEach(([key, dataset]) => {
      const canvasId = `chart-${key}`;
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        new Chart(canvas, {
          type: 'bar',
          data: {
            labels: dataset.labels,
            datasets: [{
              label: dataset.config.label,
              data: dataset.data,
              backgroundColor: dataset.config.color,
              borderColor: dataset.config.color.replace('0.8', '1.0'),
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: `${dataset.config.label} ${dataset.config.unit}`,
                font: { size: 16, weight: 'bold' }
              },
              legend: { display: false }
            },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: dataset.config.unit } },
              x: { title: { display: true, text: 'Fecha' } }
            }
          }
        });
      }
    });
  }, [chartsData]);

  return (
    <div className="container">
      <h1>Visualizador Climático</h1>
      <div className="form-container">
        <div className="form-row">
          <div className="form-group">
            <label>Ubicación predefinida:</label>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
              <option value="">Seleccionar ubicación...</option>
              {coordinates.map(coord => (
                <option key={coord.id} value={coord.id}>{coord.id}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Latitud:</label>
            <input type="text" value={latitude} disabled />
          </div>
          <div className="form-group">
            <label>Longitud:</label>
            <input type="text" value={longitude} disabled />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Fecha final:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Días hacia atrás:</label>
            <input type="number" value={daysBack} min="7" max="56" onChange={e => setDaysBack(Number(e.target.value))} />
          </div>
        </div>
      </div>

      {loading && <div className="loading">Cargando datos climáticos...</div>}
      {error && <div className="error">{error}</div>}

      <div className="charts-container">
        {Object.keys(chartsData).map(variable => (
          <div className="chart-wrapper" key={variable}>
            <canvas id={`chart-${variable}`}></canvas>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
