// src/FieldsMap.jsx
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const PASADENA_CENTER = [34.1478, -118.1445];

// Fix default icon paths so Vite/Leaflet can find them in production
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

export function FieldsMap({ fields }) {
  const safeFields = (fields || []).filter(
    (f) => Number.isFinite(f.lat) && Number.isFinite(f.lng)
  );

  const center = safeFields.length
    ? [safeFields[0].lat, safeFields[0].lng]
    : PASADENA_CENTER;

  return (
    <div className="map-wrapper">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {safeFields.map((field) => (
          <Marker
            key={field.id}
            position={[field.lat, field.lng]}
            title={field.name}
          >
            <Popup>
              <strong>{field.name}</strong>
              <br />
              {field.address}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
