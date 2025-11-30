// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import { FieldsMap } from "./FieldsMap";

const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Map centers for each city
const PASADENA_CENTER = { lat: 34.1478, lng: -118.1445 };
const IRVINE_CENTER = { lat: 33.6846, lng: -117.8265 };

// Generic hours for now (both cities)
// You can customize later per city if you want.
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

// Compute centroid from polygon ring with fallback
function polygonCentroid(coords, fallbackCenter) {
  if (!Array.isArray(coords) || coords.length === 0) {
    return { lat: fallbackCenter.lat, lng: fallbackCenter.lng };
  }
  let sumLat = 0;
  let sumLng = 0;
  let count = 0;

  coords.forEach((pair) => {
    if (!Array.isArray(pair) || pair.length < 2) return;
    const [lng, lat] = pair;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    sumLat += lat;
    sumLng += lng;
    count += 1;
  });

  if (count === 0) {
    return { lat: fallbackCenter.lat, lng: fallbackCenter.lng };
  }

  return {
    lat: sumLat / count,
    lng: sumLng / count
  };
}

// Convert GeoJSON geometry → {lat,lng} with safe fallback
function geometryToLatLng(geom, fallbackCenter) {
  if (!geom || !geom.type) return { ...fallbackCenter };

  if (geom.type === "Point" && Array.isArray(geom.coordinates)) {
    const [lng, lat] = geom.coordinates;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
    return { ...fallbackCenter };
  }

  if (geom.type === "Polygon" && Array.isArray(geom.coordinates)) {
    const ring = geom.coordinates[0];
    return polygonCentroid(ring, fallbackCenter);
  }

  if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
    const outerRing = geom.coordinates?.[0]?.[0];
    return polygonCentroid(outerRing, fallbackCenter);
  }

  return { ...fallbackCenter };
}

/* ---------- City-specific mappers ---------- */

// Pasadena parks (Pasadena open data portal)
function mapPasadenaFeature(feature) {
  const props = feature.properties || {};
  const geom = feature.geometry || {};
  const pos = geometryToLatLng(geom, PASADENA_CENTER);
  const lat = pos.lat;
  const lng = pos.lng;

  const name = props.NAME || "Unnamed park";
  const neighborhood = "Pasadena";
  const address = props.Address || "";

  const descText = `${props.Short_Desc || ""} ${props.Desc1 || ""}`.toLowerCase();

  const hasLights = descText.includes("lighted") || descText.includes("lights");
  const hasSoccerLines =
    descText.includes("soccer") || descText.includes("multi-purpose field");

  const rawImageUrl = props.Image_URL || "";
  const imageUrl = rawImageUrl.replace(/^http:\/\//, "https://");
  const website = props.Website || "";

  return {
    id: props.OBJECTID ?? feature.id ?? Math.random(),
    name,
    neighborhood,
    address,
    lat,
    lng,
    surface: "grass",
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

// Irvine parks (Irvine_Parks FeatureServer layer 8)
function mapIrvineFeature(feature) {
  const props = feature.properties || {};
  const geom = feature.geometry || {};
  const pos = geometryToLatLng(geom, IRVINE_CENTER);
  const lat = pos.lat;
  const lng = pos.lng;

  const name =
    props.NAME || props.PARK_NAME || props.Park || props.Name || "Unnamed park";
  const neighborhood = "Irvine";

  const address =
    props.Address ||
    props.ADDRESS ||
    props.SITE_ADDR ||
    props.LOCATION ||
    "";

  // We don't know exact field names, so use text heuristics
  const descText = [
    props.Short_Desc,
    props.Desc1,
    props.DESCRIPT,
    props.DESCRIPTION,
    props.TYPE
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const hasLights =
    (props.LIGHTS && String(props.LIGHTS).toLowerCase().includes("yes")) ||
    descText.includes("lighted") ||
    descText.includes("lights");

  const hasSoccerLines =
    (props.SPORT && String(props.SPORT).toLowerCase().includes("soccer")) ||
    descText.includes("soccer");

  // Irvine dataset probably doesn't include image/website; safe defaults
  const website = props.Website || "";
  const imageUrl = (props.Image_URL || "").replace(/^http:\/\//, "https://");

  return {
    id: props.OBJECTID ?? feature.id ?? Math.random(),
    name,
    neighborhood,
    address,
    lat,
    lng,
    surface: "grass",
    hasLights,
    hasSoccerLines,
    hasGoals: descText.includes("goal") || descText.includes("goals"),
    openingHours: defaultHours(),
    shortDesc:
      props.Short_Desc || props.DESCRIPT || props.DESCRIPTION || props.TYPE || "",
    extraDesc: props.Desc1 || "",
    website,
    imageUrl
  };
}

/* ---------- City Config ---------- */

const CITY_CONFIGS = {
  pasadena: {
    id: "pasadena",
    label: "Pasadena, CA",
    apiUrl:
      "https://services2.arcgis.com/zNjnZafDYCAJAbN0/arcgis/rest/services/Parks/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson",
    center: PASADENA_CENTER,
    mapFeature: mapPasadenaFeature
  },
  irvine: {
    id: "irvine",
    label: "Irvine, CA",
    apiUrl:
      "https://services2.arcgis.com/3mkVbLdbLBFHrfbK/arcgis/rest/services/Irvine_Parks/FeatureServer/8/query?outFields=*&where=1%3D1&f=geojson",
    center: IRVINE_CENTER,
    mapFeature: mapIrvineFeature
  }
};

/* ---------- Shared helpers ---------- */

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

/* ---------- App Component ---------- */

function App() {
  const [cityId, setCityId] = useState("pasadena");
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hasLightsOnly, setHasLightsOnly] = useState(false);
  const [hasLinesOnly, setHasLinesOnly] = useState(false);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [surfaceFilter, setSurfaceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const currentCity = CITY_CONFIGS[cityId];

  // Load fields when city changes
  useEffect(() => {
    async function loadFields() {
      try {
        setLoading(true);
        setError("");

        const city = CITY_CONFIGS[cityId];
        const res = await fetch(city.apiUrl);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const features = Array.isArray(data.features) ? data.features : [];
        const mapped = features.map(city.mapFeature);
        setFields(mapped);
      } catch (err) {
        console.error("Error loading fields:", err);
        setError("Failed to load fields from the city open-data API.");
        setFields([]);
      } finally {
        setLoading(false);
      }
    }

    loadFields();
  }, [cityId]);

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
          Live park data for{" "}
          <strong>{currentCity.label}</strong>, with filters for lights, soccer,
          and whether fields are open right now.
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
        {/* City selector */}
        <label className="filter-item">
          City
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
          >
            <option value="pasadena">Pasadena, CA</option>
            <option value="irvine">Irvine, CA</option>
          </select>
        </label>

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
        <FieldsMap fields={filteredFields} center={currentCity.center} />
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
            No fields match your filters. Try relaxing a filter or clearing the
            search.
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
                  <span className="hours-text">
                    Today: {formatTodayHours(field)}
                  </span>
                </div>

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
