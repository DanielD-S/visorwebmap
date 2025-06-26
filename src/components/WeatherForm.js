import React from 'react';
import Select from 'react-select';
import './WeatherForm.css';

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
  // Prepara las opciones para react-select
  const options = coordinates.map(coord => ({
    value: coord.id,
    label: `${coord.id}${coord.Trazado ? ` – ${coord.Trazado}` : ''}`
  }));

  // Valor seleccionado actual
  const selectedOption = options.find(opt => opt.value === selectedId) || null;

  return (
    <div className="form-container">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="locationSelect">Ubicación predefinida:</label>
          <Select
            inputId="locationSelect"
            options={options}
            value={selectedOption}
            onChange={(option) => setSelectedId(option ? option.value : '')}
            placeholder="Seleccionar ubicación..."
            isClearable
            classNamePrefix="react-select"
          />
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
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
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
