import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
Chart.register(...registerables);

const CombinedAnalysis = ({ combinedData }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [correlationMsg, setCorrelationMsg] = useState(null);
  const [alertType, setAlertType] = useState(null);

  const pearsonCorrelation = (x, y) => {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    const avgX = x.reduce((a, b) => a + b, 0) / n;
    const avgY = y.reduce((a, b) => a + b, 0) / n;
    const num = x.slice(0,n).reduce((acc, xi, i) => acc + ((xi - avgX)*(y[i] - avgY)), 0);
    const den = Math.sqrt(
      x.slice(0,n).reduce((acc, xi) => acc + Math.pow(xi - avgX,2),0) *
      y.slice(0,n).reduce((acc, yi) => acc + Math.pow(yi - avgY,2),0)
    );
    return den === 0 ? 0 : num/den;
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("📈 Análisis Combinado", 15, 20);
    doc.setFontSize(12);
    doc.text(`Correlación temperatura-humedad: ${correlationMsg}`, 15, 30);
    doc.text("Patrones observados:", 15, 45);
    doc.text("- 🌡 Temperatura busca picos y ciclos diurnos.", 20, 55);
    doc.text("- 💧 Humedad inversamente relacionada.", 20, 65);
    doc.text("- 📊 Presión indica cambios meteorológicos.", 20, 75);
    doc.save('analisis_combinado.pdf');
  };

  useEffect(() => {
    if (!combinedData) return;

    const ctx = canvasRef.current.getContext('2d');
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: combinedData.labels,
        datasets: [
          { 
            label: 'Temperatura (°C)', 
            data: combinedData.temperature, 
            borderColor: '#ff7675', 
            backgroundColor: 'rgba(255,118,117,0.3)', 
            yAxisID: 'y1', tension:0.4 
          },
          { 
            label: 'Humedad (%)', 
            data: combinedData.humidity && combinedData.humidity.length 
              ? combinedData.humidity 
              : Array(combinedData.labels.length).fill(0),
            borderColor: '#00b894', 
            backgroundColor: 'rgba(0,184,148,0.3)', 
            yAxisID: 'y2', tension:0.4 
          },
          { 
            label: 'Presión (hPa)', 
            data: combinedData.pressure, 
            borderColor: '#0984e3', 
            backgroundColor: 'rgba(9,132,227,0.3)', 
            yAxisID: 'y3', tension:0.4 
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top' }, tooltip: { enabled: true }},
        scales: {
          y1: { type: 'linear', position: 'left', title: {display:true,text:'Temperatura (°C)'} },
          y2: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title:{display:true,text:'Humedad (%)'} },
          y3: { type: 'linear', position: 'right', offset: true, grid: { drawOnChartArea: false }, title:{display:true,text:'Presión (hPa)'} }
        }
      }
    });

    const corr = pearsonCorrelation(combinedData.temperature, combinedData.humidity);
    if (corr < -0.9) {
      setCorrelationMsg(`🚨 ALERTA: correlación inversa muy fuerte (r = ${corr.toFixed(2)})`);
      setAlertType('red');
    } else if (corr > 0.9) {
      setCorrelationMsg(`🚨 ALERTA: correlación directa muy fuerte (r = ${corr.toFixed(2)})`);
      setAlertType('red');
    } else if (corr < -0.6) {
      setCorrelationMsg(`✅ Alta correlación inversa (r = ${corr.toFixed(2)}). Patrón normal diario.`);
      setAlertType('green');
    } else {
      setCorrelationMsg(null);
      setAlertType(null);
    }
  }, [combinedData]);

  return (
    <div className="control-panel mt-4">
      <h4 className="mb-4">📈 Análisis Combinado - Temperatura, Humedad y Presión</h4>
      <div style={{ height: '350px' }}>
        <canvas ref={canvasRef}></canvas>
      </div>

      {correlationMsg && (
        <div style={{
          marginTop: '20px',
          background: alertType === 'red' ? 'rgba(231,76,60,0.15)' : 'rgba(46,204,113,0.15)',
          border: `1px solid ${alertType === 'red' ? 'rgba(192,57,43,0.5)' : 'rgba(39,174,96,0.5)'}`,
          padding: '15px',
          borderRadius: '12px',
          textAlign: 'center',
          fontWeight: 'bold',
          color: alertType === 'red' ? '#c0392b' : '#27ae60'
        }}>
          {correlationMsg}
          <div style={{ marginTop: '10px' }}>
            <button className="btn-generate" onClick={exportToPDF}>📄 Exportar análisis a PDF</button>
          </div>
        </div>
      )}

      <div className="analysis mt-4">
        <h4>🔍 ¿Qué buscamos en este análisis?</h4>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '15px'
        }}>
          <div style={{
            flex: 1, minWidth: '220px', background: 'rgba(255,255,255,0.8)',
            borderRadius: '12px', padding: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
          }}>
            <strong>🌡️ Temperatura (Rojo):</strong>
            <p style={{ fontSize: '14px', marginTop: '5px' }}>
              Picos, valles y ciclos diurnos.
            </p>
          </div>
          <div style={{
            flex: 1, minWidth: '220px', background: 'rgba(255,255,255,0.8)',
            borderRadius: '12px', padding: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
          }}>
            <strong>💧 Humedad (Verde):</strong>
            <p style={{ fontSize: '14px', marginTop: '5px' }}>
              Alta humedad + baja temperatura = posible niebla.
            </p>
          </div>
          <div style={{
            flex: 1, minWidth: '220px', background: 'rgba(255,255,255,0.8)',
            borderRadius: '12px', padding: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
          }}>
            <strong>📊 Presión (Azul):</strong>
            <p style={{ fontSize: '14px', marginTop: '5px' }}>
              Cambios bruscos anuncian sistemas meteorológicos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedAnalysis;
