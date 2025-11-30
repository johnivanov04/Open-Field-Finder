// src/FieldsMap.jsx
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export function FieldsMap({ fields }) {
  if (!fields || fields.length === 0) {
    return (
      <div className="map-placeholder">
        No fields to show on the map for the current filters.
      </div>
    );
  }

  const center = [fields[0].lat, fields[0].lng];

  return (
    <div className="map-wrapper">
      <MapContainer center={center} zoom={13} className="map-container">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fields.map((field) => (
          <Marker key={field.id} position={[field.lat, field.lng]}>
            <Popup>
              <strong>{field.name}</strong>
              <br />
              {field.neighborhood}
              <br />
              {field.address}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
