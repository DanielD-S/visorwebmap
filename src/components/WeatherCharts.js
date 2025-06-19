import React, { useEffect } from 'react';
import { Chart } from 'chart.js/auto';

function WeatherCharts({ chartsData }) {
  useEffect(() => {
    Object.entries(chartsData).forEach(([key, dataset]) => {
      const canvasId = `chart-${key}`;
      const canvas = document.getElementById(canvasId);

      if (canvas) {
        // ✅ Evita superposición destruyendo gráfico anterior
        const existingChart = Chart.getChart(canvasId);
        if (existingChart) {
          existingChart.destroy();
        }

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

  return (
    <div className="charts-container">
      {Object.keys(chartsData).map(variable => (
        <div className="chart-wrapper" key={variable}>
          <canvas id={`chart-${variable}`}></canvas>
        </div>
      ))}
    </div>
  );
}

export default WeatherCharts;
