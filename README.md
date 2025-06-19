# 🌤️ Visor Meteorológico

## 🚀 Funcionalidades principales

- Selección de torre meteorológica desde una lista desplegable
- Consulta de datos climáticos históricos por fecha y cantidad de días hacia atrás
- Visualización de mapas con diferentes basemaps
- Marcador rojo para la torre consultada y azul para otras torres
- Carga y visualización de archivos `.kml` y `.geojson` locales
- Botón para quitar archivos cargados
- Control para restablecer la vista del mapa
- Leyenda visual de los íconos usados

---

## 🛠️ Tecnologías utilizadas

- [React](https://reactjs.org/)
- [React Leaflet](https://react-leaflet.js.org/)
- [Leaflet](https://leafletjs.com/)
- [Bootstrap](https://getbootstrap.com/)
- [Chart.js](https://www.chartjs.org/) vía `react-chartjs-2`
- [Open-Meteo API](https://open-meteo.com/)
- [@tmcw/togeojson](https://github.com/tmcw/togeojson) para convertir archivos `.kml` a GeoJSON

---

## 📦 Instalación local

```bash
# Clonar repositorio
https://github.com/DanielD-S/visorwebmap.git

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

---

## 🌍 Despliegue

El proyecto se despliega en GitHub Pages:
🔗 https://danield-s.github.io/visorwebmap

Para desplegar:
```bash
git add .
git commit -m "Nueva funcionalidad o corrección"
git push origin main
npm run deploy
```

---

## 📁 Estructura del proyecto

```
/src
├── App.js
├── components/
│   ├── WeatherForm.js
│   ├── WeatherCharts.js
│   └── WeatherMap.js
├── data/
│   ├── coordinates.js
│   └── weatherVariables.js
```
