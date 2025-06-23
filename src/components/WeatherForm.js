import React from 'react';

function WeatherForm({
  selectedId,
  setSelectedId,
  latitude,
  longitude,
  endDate,
  setEndDate,
  daysBack,
  setDaysBack,
  coordinates,
  mode
}) {
  return (
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

      {mode === 'daily' && (
        <div className="form-row">
          <div className="form-group">
            <label>Fecha final:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Días hacia atrás:</label>
            <input
              type="number"
              min="7"
              max="56"
              value={daysBack}
              onChange={e => setDaysBack(Number(e.target.value))}
            />
          </div>
        </div>
      )}

      {mode === 'hourly' && (
        <div className="form-row">
          <div className="form-group">
            <p className="text-muted small">
              Se consultarán automáticamente las últimas 48 horas desde el momento actual.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeatherForm;