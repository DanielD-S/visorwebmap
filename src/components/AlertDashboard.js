import React, { useState } from 'react';
import { WEATHER_VARIABLES } from '../data/weatherVariables';
import { coordinates } from '../data/coordinates';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

const DEFAULT_THRESHOLDS = {
  windspeed_10m_max: { limit: 60, label: 'Viento fuerte', color: '🌬️' },
  rain_sum: { limit: 20, label: 'Lluvia intensa', color: '🌧️' },
  temperature_2m_max: { limit: 35, label: 'Calor extremo', color: '🔥' },
  shortwave_radiation_sum: { limit: 25, label: 'Radiación solar alta', color: '☀️' },
  snowfall_sum: { limit: 10, label: 'Nieve acumulada', color: '❄️' },
  pressure_msl_max: { limit: 1020, label: 'Alta presión', color: '📈' }
};

const WeatherAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [progressMessage, setProgressMessage] = useState('');

  const thresholds = DEFAULT_THRESHOLDS;
  const variables = Object.keys(thresholds).join(',');

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const handleFetchAlerts = async () => {
    if (!startDate || !endDate) {
      alert('Por favor, selecciona ambas fechas.');
      return;
    }

    const diffDays = (new Date(endDate) - new Date(startDate)) / (1000 * 3600 * 24);
    if (diffDays > 7) {
      alert('El rango máximo permitido es de 7 días.');
      return;
    }

    setLoading(true);
    setProgressMessage("Iniciando consulta...");
    const results = [];

    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < coordinates.length; i += chunkSize) {
      chunks.push(coordinates.slice(i, i + chunkSize));
    }

    const sd = new Date(startDate);
    const ed = new Date(endDate);

    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];
      setProgressMessage(`⏳ Consultando bloque ${index + 1} de ${chunks.length}...`);

      await Promise.all(chunk.map(async (coord) => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.long}&start_date=${startDate}&end_date=${endDate}&daily=${variables}&timezone=America/Santiago`;

        try {
          const res = await fetch(url);

          if (res.status === 429) {
            console.warn(`⛔ Demasiadas solicitudes para torre ${coord.id}. Intenta nuevamente más tarde.`);
            return;
          }

          if (!res.ok) {
            console.warn(`⚠️ Torre ${coord.id} respondió con estado ${res.status}`);
            return;
          }

          const data = await res.json();
          if (!data.daily || !data.daily.time) {
            console.warn(`⚠️ Datos incompletos en torre ${coord.id}`);
            return;
          }

          const time = data.daily.time;
          Object.entries(thresholds).forEach(([key, { limit, label, color }]) => {
            if (data.daily[key]) {
              data.daily[key].forEach((value, i) => {
                const fecha = time[i];
                const f = new Date(fecha);
                if (value > limit && f >= sd && f <= ed) {
                  results.push({
                    id: coord.id,
                    nombre: coord.nombre || `Torre ${coord.id}`,
                    fecha,
                    alerta: label,
                    tipo: key,
                    valor: value,
                    unidad: WEATHER_VARIABLES[key]?.unit || '',
                    color
                  });
                }
              });
            }
          });
        } catch (error) {
          console.warn(`Error en torre ${coord.id}:`, error.message);
        }
      }));

      await delay(1500);
    }

    setAlerts(results);
    setProgressMessage('');
    setLoading(false);
  };

  const filteredAlerts = (filter === 'all' ? alerts : alerts.filter(a => a.tipo === filter))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.tipo.localeCompare(b.tipo));

  const severityCount = { Alta: 0, Media: 0, Baja: 0 };
  filteredAlerts.forEach(a => {
    const level = a.valor > thresholds[a.tipo]?.limit * 1.5 ? 'Alta' : a.valor > thresholds[a.tipo]?.limit * 1.2 ? 'Media' : 'Baja';
    severityCount[level] += 1;
  });

  const exportToExcel = () => {
    const wsData = [['Torre', 'Fecha', 'Tipo de Alerta', 'Valor', 'Severidad']];
    filteredAlerts.forEach(a => {
      const level = a.valor > thresholds[a.tipo]?.limit * 1.5 ? 'Alta' : a.valor > thresholds[a.tipo]?.limit * 1.2 ? 'Media' : 'Baja';
      wsData.push([a.nombre, a.fecha, a.alerta, `${a.valor.toFixed(1)} ${a.unidad}`, level]);
    });
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alertas');
    XLSX.writeFile(workbook, `alertas_${filter}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`Reporte de Alertas (${filter})`, 15, 15);

    filteredAlerts.forEach((a, i) => {
      const level = a.valor > thresholds[a.tipo]?.limit * 1.5 ? 'Alta' : a.valor > thresholds[a.tipo]?.limit * 1.2 ? 'Media' : 'Baja';
      doc.text(`${a.fecha} - ${a.nombre}: ${a.alerta} (${a.valor.toFixed(1)} ${a.unidad}) - Severidad: ${level}`, 15, 30 + i * 7);
    });

    doc.save(`alertas_${filter}.pdf`);
  };

  return (
    <div className="container my-4">
      <h2 className="mb-4">🔔 Panel de Alertas Meteorológicas</h2>

      <div className="mb-3">
        <strong>Resumen de Severidad:</strong>{' '}
        <span className="badge bg-danger me-2">Alta: {severityCount.Alta}</span>
        <span className="badge bg-warning text-dark me-2">Media: {severityCount.Media}</span>
        <span className="badge bg-info text-dark">Baja: {severityCount.Baja}</span>
      </div>

      <div className="mb-3">
        <strong>Rango de fechas:</strong>{' '}
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="me-2" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button className="btn btn-primary ms-2" onClick={handleFetchAlerts} disabled={loading}>Consultar alertas</button>
      </div>

      <div className="mb-3">
        <strong>Filtrar por tipo:</strong>{' '}
        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setFilter('all')}>Todas</button>
        {Object.entries(thresholds).map(([key, val]) => (
          <button
            key={key}
            className="btn btn-sm btn-outline-primary me-2"
            onClick={() => setFilter(key)}
          >
            {val.color} {val.label}
          </button>
        ))}
      </div>

      {!loading && filteredAlerts.length > 0 && (
        <div className="mb-3">
          <button className="btn btn-success me-2" onClick={exportToExcel}>📊 Exportar Excel</button>
          <button className="btn btn-danger" onClick={exportToPDF}>📄 Exportar PDF</button>
        </div>
      )}

      {loading && <div className="text-muted">{progressMessage || 'Consultando...'}</div>}

      {!loading && filteredAlerts.length === 0 && <div className="alert alert-success">✅ No se detectaron alertas.</div>}

      {!loading && filteredAlerts.length > 0 && (
        <table className="table table-bordered table-sm">
          <thead className="table-light">
            <tr>
              <th>Torre</th>
              <th>Fecha</th>
              <th>Tipo de Alerta</th>
              <th>Valor</th>
              <th>Severidad</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.map((a, i) => {
              const level = a.valor > thresholds[a.tipo]?.limit * 1.5 ? 'Alta' : a.valor > thresholds[a.tipo]?.limit * 1.2 ? 'Media' : 'Baja';
              const bgColor = level === 'Alta' ? '#f8d7da' : level === 'Media' ? '#fff3cd' : '#d1ecf1';
              return (
                <tr key={i} style={{ backgroundColor: bgColor }}>
                  <td>{a.nombre}</td>
                  <td>{new Date(a.fecha).toLocaleDateString('es-CL')}</td>
                  <td>{a.color} {a.alerta}</td>
                  <td>{a.valor.toFixed(1)} {a.unidad}</td>
                  <td>{level}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default WeatherAlerts;
