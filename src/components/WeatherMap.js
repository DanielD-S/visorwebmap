import React, { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  Polyline,
  useMap
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { coordinates } from '../data/coordinates';
import { kml } from '@tmcw/togeojson';

// Íconos personalizados
const blueIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapUpdater({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], 14);
    }
  }, [lat, lon, map]);
  return null;
}

function ResetViewControl({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    const button = L.control({ position: 'topright' });
    button.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      div.style.background = 'white';
      div.style.padding = '5px';
      div.style.cursor = 'pointer';
      div.style.fontSize = '18px';
      div.title = 'Restablecer vista';
      div.innerHTML = '🔄';
      div.onclick = () => {
        if (lat && lon) {
          map.setView([lat, lon], 14);
        }
      };
      return div;
    };
    button.addTo(map);
    return () => button.remove();
  }, [lat, lon, map]);
  return null;
}

function LegendControl() {
  const map = useMap();
  useEffect(() => {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      div.style.background = 'white';
      div.style.padding = '10px';
      div.style.fontSize = '14px';
      div.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
      div.innerHTML = `
        <strong>Leyenda</strong><br />
        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" style="vertical-align: middle;" /> Torre seleccionada<br />
        <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" style="vertical-align: middle;" /> Otras torres
      `;
      return div;
    };
    legend.addTo(map);
    return () => legend.remove();
  }, [map]);
  return null;
}

function LoadKMLFromFile({ file }) {
  const map = useMap();
  const layerRef = useRef(null);

  function isGeoJSON(content) {
    try {
      const json = JSON.parse(content);
      return json.type && json.features;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const text = e.target.result;
        if (layerRef.current) map.removeLayer(layerRef.current);

        if (isGeoJSON(text)) {
          const geojson = JSON.parse(text);
          const geojsonLayer = L.geoJSON(geojson).addTo(map);
          map.fitBounds(geojsonLayer.getBounds());
          layerRef.current = geojsonLayer;
          return;
        }

        const parser = new DOMParser();
        const kmlDom = parser.parseFromString(text, 'text/xml');
        const converted = kml(kmlDom);
        const geojsonLayer = L.geoJSON(converted).addTo(map);
        map.fitBounds(geojsonLayer.getBounds());
        layerRef.current = geojsonLayer;
      } catch {
        alert('Archivo inválido o corrupto (KML o GeoJSON).');
      }
    };
    reader.readAsText(file);

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [file, map]);

  return null;
}

function WeatherMap({ lat, lon, id, file }) {
  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);

  if (!parsedLat || !parsedLon) return null;

  // Preparamos la línea: NPDA -> Torre 1 -> ... -> Torre 897 -> POL
  const torresNumeradas = coordinates
    .filter(c => /^Torre \d+$/.test(c.id))
    .sort((a, b) => parseInt(a.id.replace('Torre ', '')) - parseInt(b.id.replace('Torre ', '')));

  const inicio = coordinates.find(c => c.id === 'NPDA');
  const fin = coordinates.find(c => c.id === 'POL');

  const polylineCoords = [
    ...(inicio ? [[inicio.lat, inicio.long]] : []),
    ...torresNumeradas.map(c => [c.lat, c.long]),
    ...(fin ? [[fin.lat, fin.long]] : [])
  ];

  return (
    <div style={{ height: '550px' }}>
      <MapContainer center={[parsedLat, parsedLon]} zoom={14} style={{ height: '100%', width: '100%' }}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="🗺 OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🌍 Esri World Imagery">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="📄 CartoDB Light">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; CartoDB"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Polilínea del trazado */}
        <Polyline positions={polylineCoords} pathOptions={{ color: 'orange', weight: 3, opacity: 0.8 }} />

        {/* Torre seleccionada */}
        <Marker position={[parsedLat, parsedLon]} icon={redIcon}>
          <Popup>Torre seleccionada: {id}</Popup>
        </Marker>

        {/* Otras torres */}
        {coordinates.map(coord => (
          coord.id !== id && (
            <Marker key={coord.id} position={[coord.lat, coord.long]} icon={blueIcon}>
              <Popup>{coord.id}</Popup>
            </Marker>
          )
        ))}

        <MapUpdater lat={parsedLat} lon={parsedLon} />
        <ResetViewControl lat={parsedLat} lon={parsedLon} />
        <LegendControl />
        <LoadKMLFromFile file={file} />
      </MapContainer>
    </div>
  );
}

export default WeatherMap;
