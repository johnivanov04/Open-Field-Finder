// src/FieldsMap.jsx
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Wire up default marker icons so they work with Vite
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const DEFAULT_CENTER = [34.1478, -118.1445]; // Pasadena as a general fallback

export function FieldsMap({ fields, center }) {
  const safeFields = (fields || []).filter(
    (f) => Number.isFinite(f.lat) && Number.isFinite(f.lng)
  );

  const fallbackCenter = center
    ? [center.lat, center.lng]
    : DEFAULT_CENTER;

  const mapCenter = safeFields.length
    ? [safeFields[0].lat, safeFields[0].lng]
    : fallbackCenter;

  return (
    <div className="map-wrapper">
      <MapContainer
        center={mapCenter}
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
