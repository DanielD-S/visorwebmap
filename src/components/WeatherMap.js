import React, { useEffect } from 'react';
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

// Configura los íconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
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

function WeatherMap({ lat, lon, id }) {
  if (!lat || !lon) return null;

  return (
    <div style={{ height: '400px', marginTop: '20px' }}>
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

        <Marker position={[lat, lon]}>
          <Popup>Torre: {id}</Popup>
        </Marker>

        <MapUpdater lat={lat} lon={lon} />
        <ResetViewControl lat={lat} lon={lon} />
      </MapContainer>
    </div>
  );
}

export default WeatherMap;
