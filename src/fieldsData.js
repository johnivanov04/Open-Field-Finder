// src/fieldsData.js

// Helper: same opening hours every day
const dailyHours = (open, close) => ({
  mon: { open, close },
  tue: { open, close },
  wed: { open, close },
  thu: { open, close },
  fri: { open, close },
  sat: { open, close },
  sun: { open, close }
});

export const fields = [
  {
    id: 1,
    name: "North Turf Field",
    neighborhood: "Campus North",
    address: "1234 College Ave",
    lat: 34.137,
    lng: -118.127,
    surface: "turf",
    hasLights: true,
    hasSoccerLines: true,
    hasGoals: true,
    openingHours: dailyHours("06:00", "22:00")
  },
  {
    id: 2,
    name: "Community Park Grass Field",
    neighborhood: "Downtown",
    address: "5678 Main St",
    lat: 34.143,
    lng: -118.131,
    surface: "grass",
    hasLights: false,
    hasSoccerLines: true,
    hasGoals: false,
    openingHours: dailyHours("07:00", "19:00")
  },
  {
    id: 3,
    name: "Riverside Recreation Ground",
    neighborhood: "Riverside",
    address: "890 River Rd",
    lat: 34.149,
    lng: -118.12,
    surface: "grass",
    hasLights: true,
    hasSoccerLines: false,
    hasGoals: false,
    openingHours: {
      mon: { open: "08:00", close: "18:00" },
      tue: { open: "08:00", close: "18:00" },
      wed: { open: "08:00", close: "18:00" },
      thu: { open: "08:00", close: "18:00" },
      fri: { open: "08:00", close: "18:00" },
      sat: { open: "09:00", close: "17:00" },
      sun: { open: "09:00", close: "17:00" }
    }
  },
  {
    id: 4,
    name: "Southside Sports Complex",
    neighborhood: "Southside",
    address: "1010 Elm St",
    lat: 34.131,
    lng: -118.135,
    surface: "turf",
    hasLights: true,
    hasSoccerLines: true,
    hasGoals: true,
    openingHours: dailyHours("06:00", "23:00")
  },
  {
    id: 5,
    name: "Neighborhood School Field",
    neighborhood: "Midtown",
    address: "222 School Ln",
    lat: 34.139,
    lng: -118.118,
    surface: "grass",
    hasLights: false,
    hasSoccerLines: false,
    hasGoals: true,
    openingHours: {
      mon: { open: "16:00", close: "20:00" },
      tue: { open: "16:00", close: "20:00" },
      wed: { open: "16:00", close: "20:00" },
      thu: { open: "16:00", close: "20:00" },
      fri: { open: "16:00", close: "20:00" },
      sat: { open: "08:00", close: "20:00" },
      sun: { open: "08:00", close: "20:00" }
    }
  }
];
