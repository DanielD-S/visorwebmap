import React, { useEffect } from 'react';
import { Chart } from 'chart.js/auto';

/**
 * Calcula promedio, mínimo y máximo
 */
function computeStats(data) {
  const validData = data.filter(d => typeof d === 'number' && !isNaN(d));
  const sum = validData.reduce((a, b) => a + b, 0);
  const avg = validData.length > 0 ? sum / validData.length : 0;
  const min = Math.min(...validData);
  const max = Math.max(...validData);
  return { avg, min, max };
}

/**
 * Exporta CSV de un gráfico individual
 */
function exportSingleChartCSV(dataset, variableKey) {
  const rows = [
    ['Fecha', dataset.config.label]
  ];

  for (let i = 0; i < dataset.labels.length; i++) {
    rows.push([dataset.labels[i], dataset.data[i]]);
  }

  const csvContent = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const filename = dataset.config.label.replace(/\s+/g, '_') + '.csv';
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function WeatherCharts({ chartsData }) {
  useEffect(() => {
    Object.keys(Chart.instances || {}).forEach((key) => {
      const chart = Chart.instances[key];
      if (chart) chart.destroy();
    });

    Object.entries(chartsData).forEach(([key, dataset]) => {
      const canvasId = `chart-${key}`;
      const canvas = document.getElementById(canvasId);

      if (canvas) {
        const existingChart = Chart.getChart(canvasId);
        if (existingChart) existingChart.destroy();

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
                text: `${dataset.config.label} (${dataset.config.unit})`,
                font: { size: 16, weight: 'bold' }
              },
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: dataset.config.unit
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Fecha'
                }
              }
            }
          }
        });
      }
    });
  }, [chartsData]);

  if (!chartsData || Object.keys(chartsData).length === 0) return null;

  return (
    <div className="charts-container">
      {Object.entries(chartsData).map(([variable, dataset]) => {
        const stats = computeStats(dataset.data);

        return (
          <div className="chart-wrapper" key={variable}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '14px', color: '#34495e' }}>
                <strong>{dataset.config.label}</strong><br />
                Promedio: {stats.avg.toFixed(1)} {dataset.config.unit} | 
                Mín: {stats.min} | 
                Máx: {stats.max}
              </div>
              <button
                onClick={() => exportSingleChartCSV(dataset, variable)}
                style={{ fontSize: '13px', padding: '6px 10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                📥 CSV
              </button>
            </div>
            <canvas id={`chart-${variable}`}></canvas>
          </div>
        );
      })}
    </div>
  );
}

export default WeatherCharts;
