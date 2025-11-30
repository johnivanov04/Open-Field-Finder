// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import { FieldsMap } from "./FieldsMap";

const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Your Pasadena Parks GeoJSON endpoint 🎉
const API_URL =
  "https://services2.arcgis.com/zNjnZafDYCAJAbN0/arcgis/rest/services/Parks/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson";

// Default hours if we don't parse from text
function defaultHours() {
  return {
    mon: { open: "06:00", close: "22:00" },
    tue: { open: "06:00", close: "22:00" },
    wed: { open: "06:00", close: "22:00" },
    thu: { open: "06:00", close: "22:00" },
    fri: { open: "06:00", close: "22:00" },
    sat: { open: "06:00", close: "22:00" },
    sun: { open: "06:00", close: "22:00" }
  };
}

// Compute a simple centroid from a polygon ring
function polygonCentroid(coords) {
  // coords = [[lng, lat], [lng, lat], ...]
  if (!coords || !coords.length) {
    return { lat: 0, lng: 0 };
  }
  let sumLat = 0;
  let sumLng = 0;
  coords.forEach(([lng, lat]) => {
    sumLat += lat;
    sumLng += lng;
  });
  return {
    lat: sumLat / coords.length,
    lng: sumLng / coords.length
  };
}

// Map one GeoJSON feature → your internal field object
function mapFeatureToField(feature) {
  const props = feature.properties || {};
  const geom = feature.geometry || {};

  let lat = 0;
  let lng = 0;

  if (geom.type === "Polygon" && Array.isArray(geom.coordinates)) {
    // Use the outer ring (first element) for centroid
    const outerRing = geom.coordinates[0];
    const c = polygonCentroid(outerRing);
    lat = c.lat;
    lng = c.lng;
  } else if (geom.type === "Point" && Array.isArray(geom.coordinates)) {
    // [lng, lat]
    lng = geom.coordinates[0];
    lat = geom.coordinates[1];
  }

  const name = props.NAME || "Unnamed park";
  // Dataset doesn't have a neighborhood field, so just label it "Pasadena"
  const neighborhood = "Pasadena";
  const address = props.Address || "";

  const descText = `${props.Short_Desc || ""} ${props.Desc1 || ""}`.toLowerCase();

  // crude heuristics based on description text
  const hasLights = descText.includes("lighted") || descText.includes("lights");
  const hasSoccerLines =
    descText.includes("soccer") || descText.includes("multi-purpose field");

  // NEW: pick up website + image URL if present
  const website = props.Website || "";
  const imageUrl = props.Image_URL || "";

  return {
    id: props.OBJECTID ?? feature.id ?? Math.random(),
    name,
    neighborhood,
    address,
    lat,
    lng,
    surface: "grass", // we don't have surfacing data; tweak later if you want
    hasLights,
    hasSoccerLines,
    hasGoals: descText.includes("goal") || descText.includes("goals"),
    openingHours: defaultHours(),
    shortDesc: props.Short_Desc || "",
    extraDesc: props.Desc1 || "",
    website,
    imageUrl
  };
}

function isOpenNow(field, now = new Date()) {
  const dayKey = dayNames[now.getDay()];
  const hours = field.openingHours?.[dayKey];
  if (!hours) return false;

  const [oh, om] = hours.open.split(":").map(Number);
  const [ch, cm] = hours.close.split(":").map(Number);

  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
}

function formatTodayHours(field) {
  const dayKey = dayNames[new Date().getDay()];
  const hours = field.openingHours?.[dayKey];
  if (!hours) return "No hours listed";
  return `${hours.open} – ${hours.close}`;
}

function App() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hasLightsOnly, setHasLightsOnly] = useState(false);
  const [hasLinesOnly, setHasLinesOnly] = useState(false);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [surfaceFilter, setSurfaceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Pasadena Parks GeoJSON on mount
  useEffect(() => {
    async function loadFields() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(API_URL);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const features = Array.isArray(data.features) ? data.features : [];
        const mapped = features.map(mapFeatureToField);
        setFields(mapped);
      } catch (err) {
        console.error("Error loading fields:", err);
        setError("Failed to load fields from the city open-data API.");
      } finally {
        setLoading(false);
      }
    }

    loadFields();
  }, []);

  const filteredFields = useMemo(() => {
    return fields.filter((f) => {
      if (hasLightsOnly && !f.hasLights) return false;
      if (hasLinesOnly && !f.hasSoccerLines) return false;
      if (surfaceFilter !== "all" && f.surface !== surfaceFilter) return false;
      if (openNowOnly && !isOpenNow(f)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = f.name.toLowerCase().includes(q);
        const matchNeighborhood = f.neighborhood.toLowerCase().includes(q);
        if (!matchName && !matchNeighborhood) return false;
      }

      return true;
    });
  }, [fields, hasLightsOnly, hasLinesOnly, openNowOnly, surfaceFilter, searchQuery]);

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Open Fields Finder</h1>
        <p>
          Live parks data from Pasadena&apos;s open-data API, filtered by lights,
          soccer usage, and whether fields are open right now.
        </p>
      </header>

      {/* Status messages */}
      {loading && (
        <div className="empty-state" style={{ marginTop: "0.75rem" }}>
          Loading fields from city open-data API...
        </div>
      )}
      {error && (
        <div className="empty-state" style={{ marginTop: "0.75rem", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <section className="filters-panel">
        <label className="filter-item">
          <input
            type="checkbox"
            checked={hasLightsOnly}
            onChange={(e) => setHasLightsOnly(e.target.checked)}
          />
          <span>Has lights</span>
        </label>

        <label className="filter-item">
          <input
            type="checkbox"
            checked={hasLinesOnly}
            onChange={(e) => setHasLinesOnly(e.target.checked)}
          />
          <span>Mentions soccer</span>
        </label>

        <label className="filter-item">
          <input
            type="checkbox"
            checked={openNowOnly}
            onChange={(e) => setOpenNowOnly(e.target.checked)}
          />
          <span>Open now</span>
        </label>

        <label className="filter-item">
          Surface
          <select
            value={surfaceFilter}
            onChange={(e) => setSurfaceFilter(e.target.value)}
          >
            <option value="all">Any</option>
            <option value="turf">Turf</option>
            <option value="grass">Grass</option>
          </select>
        </label>

        <label className="filter-item search-field">
          Search
          <input
            type="text"
            placeholder="Name or neighborhood..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </section>

      {/* Map */}
      <section className="map-section">
        <h2>Map</h2>
        <FieldsMap fields={filteredFields} />
      </section>

      {/* List */}
      <section className="list-section">
        <div className="list-header">
          <h2>Fields</h2>
          <span>
            Showing <strong>{filteredFields.length}</strong>{" "}
            {filteredFields.length === 1 ? "field" : "fields"}.
          </span>
        </div>

        {filteredFields.length === 0 && !loading && (
          <div className="empty-state">
            No fields match your filters. Try relaxing a filter or clearing the search.
          </div>
        )}

        <div className="fields-list">
          {filteredFields.map((field) => {
  const open = isOpenNow(field);
  return (
    <article key={field.id} className="field-card">
      {/* Park image, if available */}
      {field.imageUrl && (
        <div className="field-image-wrapper">
          <img
            src={field.imageUrl}
            alt={field.name}
            className="field-image"
            loading="lazy"
          />
        </div>
      )}

      <h3 className="field-title">{field.name}</h3>
      <div className="field-subtitle">
        {field.neighborhood} · {field.address}
      </div>

      <div className="field-meta">
        <span>Surface: {field.surface}</span>
        <span>Lights: {field.hasLights ? "Yes" : "No"}</span>
        <span>Mentions soccer: {field.hasSoccerLines ? "Yes" : "No"}</span>
        <span>Goals: {field.hasGoals ? "Yes" : "No"}</span>
      </div>

      {(field.shortDesc || field.extraDesc) && (
        <div className="hours-text" style={{ marginBottom: "0.25rem" }}>
          {field.shortDesc || field.extraDesc}
        </div>
      )}

      <div className="field-status-row">
        <span
          className={`status-pill ${open ? "status-open" : "status-closed"}`}
        >
          {open ? "Open now" : "Closed now"}
        </span>
        <span className="hours-text">Today: {formatTodayHours(field)}</span>
      </div>

      {/* Official park page link, if available */}
      {field.website && (
        <div className="field-link-row">
          <a
            href={field.website}
            target="_blank"
            rel="noreferrer"
            className="field-link"
          >
            Official park page ↗
          </a>
        </div>
      )}
    </article>
  );
})}
        </div>
      </section>
    </div>
  );
}

export default App;
