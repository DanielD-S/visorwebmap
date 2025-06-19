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

// Configura íconos
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

function LoadKMLFromFile({ file }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const contents = e.target.result;
      const parser = new DOMParser();
      const kml = parser.parseFromString(contents, 'text/xml');

      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }

      const layer = window.omnivore.kml.parse(kml)
        .on('ready', function () {
          map.fitBounds(layer.getBounds());
        })
        .addTo(map);

      layerRef.current = layer;
    };

    reader.readAsText(file);
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

        <Marker position={[lat, lon]}>
          <Popup>Torre seleccionada: {id}</Popup>
        </Marker>

        {coordinates.map(coord => (
          <Marker key={coord.id} position={[coord.lat, coord.long]}>
            <Popup>{coord.id}</Popup>
          </Marker>
        ))}

        <MapUpdater lat={lat} lon={lon} />
        <ResetViewControl lat={lat} lon={lon} />
        <LoadKMLFromFile file={kmlFile} />
      </MapContainer>
    </div>
  );
}

export default WeatherMap;
