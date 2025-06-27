import React, { useEffect, useState } from 'react';
import { WEATHER_VARIABLES } from '../data/weatherVariables';
import { coordinates } from '../data/coordinates';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

const THRESHOLDS = {
  windspeed_10m_max: { limit: 60, label: 'Viento fuerte', color: '🌬️' },
  rain_sum: { limit: 20, label: 'Lluvia intensa', color: '🌧️' },
  temperature_2m_max: { limit: 35, label: 'Calor extremo', color: '🔥' },
  shortwave_radiation_sum: { limit: 28, label: 'Radiación solar alta', color: '☀️' }
};

const AlertDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [progressMessage, setProgressMessage] = useState('');

  const variables = Object.keys(WEATHER_VARIABLES).join(',');

  useEffect(() => {
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    const fetchAlerts = async () => {
      setLoading(true);
      setProgressMessage("Iniciando consulta...");
      const results = [];

      const chunkSize = 30;
      const chunks = [];
      for (let i = 0; i < coordinates.length; i += chunkSize) {
        chunks.push(coordinates.slice(i, i + chunkSize));
      }

      for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index];
        setProgressMessage(`⏳ Consultando bloque ${index + 1} de ${chunks.length}...`);

        await Promise.all(chunk.map(async (coord) => {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.long}&start_date=${startDate}&end_date=${endDate}&daily=${variables}&timezone=auto`;

          try {
            const res = await fetch(url);
            const data = await res.json();
            const time = data?.daily?.time || [];

            Object.entries(THRESHOLDS).forEach(([key, { limit, label, color }]) => {
              if (data.daily[key]) {
                data.daily[key].forEach((value, i) => {
                  if (value > limit) {
                    results.push({
                      id: coord.id,
                      nombre: coord.nombre || `Torre ${coord.id}`,
                      fecha: time[i],
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

    fetchAlerts();
  }, [startDate, endDate]);

  const filteredAlerts = (filter === 'all' ? alerts : alerts.filter(a => a.tipo === filter))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.tipo.localeCompare(b.tipo));

  const exportToExcel = () => {
    const wsData = [['Torre', 'Fecha', 'Tipo de Alerta', 'Valor', 'Severidad']];
    filteredAlerts.forEach(a => {
      const level = a.valor > THRESHOLDS[a.tipo]?.limit * 1.5 ? 'Alta' : a.valor > THRESHOLDS[a.tipo]?.limit * 1.2 ? 'Media' : 'Baja';
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
      const level = a.valor > THRESHOLDS[a.tipo]?.limit * 1.5 ? 'Alta' : a.valor > THRESHOLDS[a.tipo]?.limit * 1.2 ? 'Media' : 'Baja';
      doc.text(`${a.fecha} - ${a.nombre}: ${a.alerta} (${a.valor.toFixed(1)} ${a.unidad}) - Severidad: ${level}`, 15, 30 + i * 7);
    });

    doc.save(`alertas_${filter}.pdf`);
  };

  const severityCount = { Alta: 0, Media: 0, Baja: 0 };
  filteredAlerts.forEach(a => {
    const level = a.valor > THRESHOLDS[a.tipo]?.limit * 1.5 ? 'Alta' : a.valor > THRESHOLDS[a.tipo]?.limit * 1.2 ? 'Media' : 'Baja';
    severityCount[level] += 1;
  });

  return (
    <div className="container my-4">
      <h2 className="mb-4">🔔 Panel de Alertas Meteorológicas Globales</h2>

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
      </div>

      <div className="mb-3">
        <strong>Filtrar por tipo de alerta:</strong>{' '}
        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setFilter('all')}>Todas</button>
        {Object.entries(THRESHOLDS).map(([key, val]) => (
          <button
            key={key}
            className="btn btn-sm btn-outline-primary me-2"
            onClick={() => setFilter(key)}
          >
            {val.color} {val.label}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <button className="btn btn-success me-2" onClick={exportToExcel}>📊 Exportar Excel</button>
        <button className="btn btn-danger" onClick={exportToPDF}>📄 Exportar PDF</button>
      </div>

      {loading && (
        <div className="text-muted">
          {progressMessage || 'Consultando todas las torres...'}
        </div>
      )}

      {!loading && filteredAlerts.length === 0 && (
        <div className="alert alert-success">✅ No se detectaron alertas meteorológicas.</div>
      )}

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
            {filteredAlerts.map((a, i) => (
              <tr
                key={i}
                style={{
                  backgroundColor:
                    a.valor > THRESHOLDS[a.tipo]?.limit * 1.5
                      ? '#f8d7da'
                      : a.valor > THRESHOLDS[a.tipo]?.limit * 1.2
                      ? '#fff3cd'
                      : '#d1ecf1'
                }}
              >
                <td>{a.nombre}</td>
                <td>{new Date(a.fecha).toLocaleDateString('es-CL')}</td>
                <td>{a.color} {a.alerta}</td>
                <td>{a.valor.toFixed(1)} {a.unidad}</td>
                <td>
                  {a.valor > THRESHOLDS[a.tipo]?.limit * 1.5
                    ? 'Alta'
                    : a.valor > THRESHOLDS[a.tipo]?.limit * 1.2
                    ? 'Media'
                    : 'Baja'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AlertDashboard;
