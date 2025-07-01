import React from 'react';
import './ExecutiveSummary.css';

const ExecutiveSummary = ({ summaryData }) => {
  const { startDate, endDate, lat, lon, averages, totalRain, maxWind, risk, analysis } = summaryData;

  // Dinámica de alertas visuales
  const windAlert = maxWind > 50;
  const rainAlert = totalRain > 10;

  return (
    <div className="executive-summary control-panel mt-4">
      <h2 className="mb-4 text-center">📄 Resumen Ejecutivo</h2>
      <p className="text-center mb-4">
        Desde las 00:00 horas del <strong>{startDate}</strong> hasta las 23:59 horas del <strong>{endDate}</strong>
        en la coordenada <strong>[{parseFloat(lat).toFixed(6)}, {parseFloat(lon).toFixed(6)}]</strong>
      </p>

      <div className="summary-grid">
        <div className={`summary-card gradient-card`}>
          <div className="value">{averages.temperature.avg}°C</div>
          <div className="label">Temp. Promedio</div>
        </div>
        <div className={`summary-card gradient-card ${rainAlert ? 'alert-rain' : ''}`}>
          <div className="value">{totalRain} mm</div>
          <div className="label">Lluvia Total</div>
        </div>
        <div className={`summary-card gradient-card ${windAlert ? 'alert-wind' : ''}`}>
          <div className="value">{maxWind} km/h</div>
          <div className="label">Viento Máximo</div>
        </div>
        <div className="summary-card gradient-card">
          <div className="value">{risk}</div>
          <div className="label">Nivel de Riesgo</div>
        </div>
      </div>

      <div className="details-grid mt-5">
        <div className="detail-box">
          <h4>🌡️ Temperatura Promedio</h4>
          <p className="big">{averages.temperature.avg}°C</p>
          <small>Min: {averages.temperature.min} | Max: {averages.temperature.max}</small>
        </div>

        <div className="detail-box">
          <h4>💨 Viento Promedio</h4>
          <p className="big">{averages.wind.avg} km/h</p>
          <small>Min: {averages.wind.min} | Max: {averages.wind.max}</small>
        </div>

        <div className="detail-box">
          <h4>🧭 Presión Promedio</h4>
          <p className="big">{averages.pressure.avg} hPa</p>
          <small>Min: {averages.pressure.min} | Max: {averages.pressure.max}</small>
        </div>
      </div>

      <div className="analysis mt-5">
        <h4>📊 Análisis de Patrones</h4>
        <ul>
          {analysis.map((item, idx) => (
            <li key={idx}>
              <strong>{item.title}:</strong> {item.desc}
            </li>
          ))}
        </ul>
      </div>

      {(windAlert || rainAlert) && (
        <div className="mt-4 alert-box">
          ⚠️ Atención: {windAlert && "vientos fuertes (>50 km/h)"} {windAlert && rainAlert && "y"} {rainAlert && "precipitaciones elevadas (>10 mm)"}
        </div>
      )}
    </div>
  );
};

export default ExecutiveSummary;
