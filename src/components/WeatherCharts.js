import React, { useEffect } from 'react';
import { Chart } from 'chart.js/auto';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

function computeStats(data) {
  const validData = data.filter(d => typeof d === 'number' && !isNaN(d));
  const sum = validData.reduce((a, b) => a + b, 0);
  const avg = validData.length > 0 ? sum / validData.length : 0;
  const min = Math.min(...validData);
  const max = Math.max(...validData);
  return { avg, min, max };
}

function exportSingleChartCSV(dataset) {
  const rows = [['Fecha', dataset.config.label]];
  for (let i = 0; i < dataset.labels.length; i++) {
    rows.push([dataset.labels[i], dataset.data[i]]);
  }

  const csvContent = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', dataset.config.label.replace(/\s+/g, '_') + '.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportSingleChartExcel(dataset) {
  const wsData = [['Fecha', dataset.config.label]];
  for (let i = 0; i < dataset.labels.length; i++) {
    wsData.push([dataset.labels[i], dataset.data[i]]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
  const filename = dataset.config.label.replace(/\s+/g, '_') + '.xlsx';
  XLSX.writeFile(workbook, filename);
}

function exportChartAsImage(canvasId, label) {
  const canvas = document.getElementById(canvasId);
  const link = document.createElement('a');
  link.download = label.replace(/\s+/g, '_') + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function exportChartAsPDF(canvasId, label) {
  const canvas = document.getElementById(canvasId);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF();
  pdf.text(label, 15, 20);
  pdf.addImage(imgData, 'PNG', 15, 30, 180, 90);
  pdf.save(label.replace(/\s+/g, '_') + '.pdf');
}

function WeatherCharts({ chartsData, mode }) {
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
                ticks: {
                  maxRotation: 45,
                  minRotation: 45,
                  autoSkip: true,
                  maxTicksLimit: 24
                },
                title: {
                  display: true,
                  text: mode === 'hourly' ? 'Fecha y hora' : 'Fecha'
                }
              }
            }
          }
        });
      }
    });
  }, [chartsData, mode]);

  if (!chartsData || Object.keys(chartsData).length === 0) return null;

  return (
    <div className="charts-container">
      {Object.entries(chartsData).map(([variable, dataset]) => {
        const stats = computeStats(dataset.data);
        const canvasId = `chart-${variable}`;

        return (
          <div className="mb-5" key={variable}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="text-muted small">
                <strong>{dataset.config.label}</strong><br />
                Promedio: {stats.avg.toFixed(1)} {dataset.config.unit} | Mín: {stats.min} | Máx: {stats.max}
              </div>

              <div className="btn-group btn-group-sm">
                <button onClick={() => exportSingleChartCSV(dataset)} className="btn btn-outline-secondary">📄 CSV</button>
                <button onClick={() => exportSingleChartExcel(dataset)} className="btn btn-outline-success">📊 Excel</button>
                <button onClick={() => exportChartAsImage(canvasId, dataset.config.label)} className="btn btn-outline-info">🖼 PNG</button>
                <button onClick={() => exportChartAsPDF(canvasId, dataset.config.label)} className="btn btn-outline-danger">📄 PDF</button>
              </div>
            </div>

            <div className="border rounded shadow-sm p-3 bg-white">
              <canvas id={canvasId} height="200"></canvas>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default WeatherCharts;
