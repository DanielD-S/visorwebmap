import React, { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  useMap
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-omnivore';
import { coordinates } from '../data/coordinates';

// Configura íconos personalizados
const blueIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-red.png',
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
      div.style.lineHeight = '20px';
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

    return () => {
      button.remove();
    };
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
        <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-red.png" style="vertical-align: middle;" /> Torre seleccionada<br />
        <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" style="vertical-align: middle;" /> Otras torres
      `;

      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
}

function LoadKMLFromFile({ file }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    const layer = window.omnivore.kml(blobUrl)
      .on('ready', function () {
        map.fitBounds(layer.getBounds());
      })
      .addTo(map);

    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [file, map]);

  return null;
}

function WeatherMap({ lat, lon, id }) {
  const [kmlFile, setKmlFile] = useState(null);

  if (!lat || !lon) return null;

  return (
    <div style={{ height: '550px', marginTop: '20px' }}>
      <input
        type="file"
        accept=".kml"
        onChange={(e) => setKmlFile(e.target.files[0])}
        style={{ marginBottom: '10px' }}
      />

      <MapContainer center={[lat, lon]} zoom={14} style={{ height: '100%', width: '100%' }}>
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

        <Marker position={[lat, lon]} icon={redIcon}>
          <Popup>Torre seleccionada: {id}</Popup>
        </Marker>

        {coordinates.map(coord => (
          coord.id !== id && (
            <Marker key={coord.id} position={[coord.lat, coord.long]} icon={blueIcon}>
              <Popup>{coord.id}</Popup>
            </Marker>
          )
        ))}

        <MapUpdater lat={lat} lon={lon} />
        <ResetViewControl lat={lat} lon={lon} />
        <LegendControl />
        <LoadKMLFromFile file={kmlFile} />
      </MapContainer>
    </div>
  );
}

export default WeatherMap;
