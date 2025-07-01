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
  mode,
  setMode,
  handleClick
}) {
  const options = coordinates.map(coord => ({
    value: coord.id,
    label: `${coord.id}${coord.Trazado ? ` – ${coord.Trazado}` : ''}`
  }));

  const selectedOption = options.find(opt => opt.value === selectedId) || null;

  return (
    <div className="control-panel compact-panel">
      <div className="form-inline">
        <div className="form-group-inline">
          <label>Ubicación</label>
          <Select
            options={options}
            value={selectedOption}
            onChange={(option) => setSelectedId(option ? option.value : '')}
            placeholder="Seleccionar..."
            classNamePrefix="react-select"
          />
        </div>

        <div className="form-group-inline">
          <label>Tipo de datos</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="historical">Datos Históricos</option>
            <option value="forecast">Pronóstico (7 días)</option>
          </select>
        </div>

        {mode === 'historical' && (
          <div className="form-group-inline">
            <label>Fecha final</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        )}

        <div className="form-group-inline">
          <button className="btn-generate" onClick={handleClick}>
            ANALIZAR
          </button>
        </div>
      </div>
    </div>
  );
}

export default WeatherForm;
