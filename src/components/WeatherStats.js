// src/components/WeatherStats.js
import React from 'react';

function WeatherStats({ chartsData }) {
  const format = (n, unit) => `${n.toFixed(1)} ${unit}`;

  // Unidades acumulativas
  const acumulativas = ['mm', 'MJ/m²'];

  return (
    <div className="results-section">
      <h2>Resumen Estadístico</h2>
      <ul>
        {Object.entries(chartsData).map(([key, dataset]) => {
          const values = dataset.data.filter(v => typeof v === 'number' && !isNaN(v));
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          const min = Math.min(...values);
          const max = Math.max(...values);
          const total = values.reduce((a, b) => a + b, 0);
          const { label, unit } = dataset.config;

          return (
            <li key={key}>
              <strong>{label}</strong> ({unit}) → 
              Promedio: {format(avg, unit)} | 
              Mín: {format(min, unit)} | 
              Máx: {format(max, unit)}
              {acumulativas.includes(unit) && ` | Total: ${format(total, unit)}`}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default WeatherStats;
