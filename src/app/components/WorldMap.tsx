import { useState, useCallback } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Graticule, Sphere, Annotation } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country name map for display
const COUNTRY_NAMES: Record<string, string> = {
  "France": "France", "Japan": "Japan", "United States of America": "USA",
  "Egypt": "Egypt", "Brazil": "Brazil", "Australia": "Australia",
  "Iceland": "Iceland", "Morocco": "Morocco", "Vietnam": "Vietnam",
  "China": "China", "India": "India", "Russia": "Russia",
  "Germany": "Germany", "United Kingdom": "UK", "Italy": "Italy",
  "Spain": "Spain", "Canada": "Canada", "Mexico": "Mexico",
  "Argentina": "Argentina", "South Africa": "S. Africa", "Nigeria": "Nigeria",
  "Kenya": "Kenya", "Saudi Arabia": "Saudi Arabia", "Iran": "Iran",
  "Turkey": "Turkey", "Thailand": "Thailand", "Indonesia": "Indonesia",
  "Philippines": "Philippines", "South Korea": "S. Korea", "North Korea": "N. Korea",
  "Pakistan": "Pakistan", "Bangladesh": "Bangladesh", "Myanmar": "Myanmar",
  "Afghanistan": "Afghanistan", "Iraq": "Iraq", "Syria": "Syria",
  "Ukraine": "Ukraine", "Poland": "Poland", "Sweden": "Sweden",
  "Norway": "Norway", "Finland": "Finland", "Denmark": "Denmark",
  "Netherlands": "Netherlands", "Belgium": "Belgium", "Switzerland": "Switzerland",
  "Portugal": "Portugal", "Greece": "Greece", "Romania": "Romania",
  "New Zealand": "New Zealand", "Peru": "Peru", "Chile": "Chile",
  "Colombia": "Colombia", "Venezuela": "Venezuela", "Bolivia": "Bolivia",
  "Algeria": "Algeria", "Libya": "Libya", "Sudan": "Sudan",
  "Ethiopia": "Ethiopia", "Tanzania": "Tanzania", "Mozambique": "Mozambique",
  "Madagascar": "Madagascar", "Angola": "Angola", "Zambia": "Zambia",
  "Zimbabwe": "Zimbabwe", "Ghana": "Ghana", "Cameroon": "Cameroon",
  "Mali": "Mali", "Niger": "Niger", "Chad": "Chad",
  "Somalia": "Somalia", "Yemen": "Yemen", "Oman": "Oman",
  "Kazakhstan": "Kazakhstan", "Uzbekistan": "Uzbekistan",
  "Mongolia": "Mongolia", "Cambodia": "Cambodia", "Laos": "Laos",
  "Malaysia": "Malaysia", "Papua New Guinea": "Papua N.G.",
  "Ecuador": "Ecuador", "Paraguay": "Paraguay", "Uruguay": "Uruguay",
};

export function getDisplayName(en: string) {
  return COUNTRY_NAMES[en] || en;
}

// Keep for backward compatibility
export function getChineseName(en: string) {
  return COUNTRY_NAMES[en] || en;
}

interface WorldMapProps {
  selectedCountry: string | null;
  correctCountry?: string | null;
  wrongCountry?: string | null;
  onCountryClick: (name: string) => void;
  disabled?: boolean;
}

export function WorldMap({ selectedCountry, correctCountry, wrongCountry, onCountryClick, disabled = false }: WorldMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 15],
    zoom: 1,
  });

  const getFill = useCallback((name: string) => {
    if (correctCountry && name === correctCountry) return "#16a34a";
    if (wrongCountry && name === wrongCountry) return "#dc2626";
    if (!correctCountry && selectedCountry === name) return "#d97706";
    if (!disabled && hoveredCountry === name) return "#4f46e5";
    // Realistic terrain-inspired coloring by region
    return "#1e3a5f";
  }, [selectedCountry, correctCountry, wrongCountry, hoveredCountry, disabled]);

  const getStroke = useCallback((name: string) => {
    if (correctCountry && name === correctCountry) return "#4ade80";
    if (wrongCountry && name === wrongCountry) return "#f87171";
    if (!correctCountry && selectedCountry === name) return "#fbbf24";
    return "#0d2137";
  }, [selectedCountry, correctCountry, wrongCountry]);

  const getStrokeWidth = useCallback((name: string) => {
    if (correctCountry === name || wrongCountry === name || selectedCountry === name) return 1.2;
    if (hoveredCountry === name) return 0.8;
    return 0.3;
  }, [correctCountry, wrongCountry, selectedCountry, hoveredCountry]);

  // Countries to show labels for at any zoom
  const specialCountries = [correctCountry, wrongCountry, selectedCountry, hoveredCountry].filter(Boolean) as string[];

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden select-none"
      style={{ background: "linear-gradient(180deg, #020c18 0%, #041525 40%, #020c18 100%)", minHeight: "100%" }}
    >
      {/* Ocean depth visual */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)"
      }} />

      {/* Zoom controls */}
      {!disabled && (
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          <button
            className="w-8 h-8 rounded-lg text-white text-lg font-bold flex items-center justify-center transition-all"
            style={{ background: "rgba(30,58,95,0.9)", border: "1px solid rgba(100,150,220,0.3)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(50,90,150,0.9)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(30,58,95,0.9)")}
            onClick={() => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.6, 8) }))}
          >+</button>
          <button
            className="w-8 h-8 rounded-lg text-white text-lg font-bold flex items-center justify-center transition-all"
            style={{ background: "rgba(30,58,95,0.9)", border: "1px solid rgba(100,150,220,0.3)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(50,90,150,0.9)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(30,58,95,0.9)")}
            onClick={() => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.6, 1) }))}
          >−</button>
          {position.zoom > 1.2 && (
            <button
              className="w-8 h-8 rounded-lg text-white text-xs flex items-center justify-center transition-all"
              style={{ background: "rgba(30,58,95,0.9)", border: "1px solid rgba(100,150,220,0.3)" }}
              onClick={() => setPosition({ coordinates: [0, 15], zoom: 1 })}
              title="Reset view"
            >⊙</button>
          )}
        </div>
      )}

      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 155 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={({ coordinates, zoom }) => setPosition({ coordinates, zoom })}
        >
          {/* Ocean sphere */}
          <Sphere id="ocean-sphere" fill="#0a1f3a" stroke="#1a3a5c" strokeWidth={0.5} />

          {/* Graticule — lat/lon grid */}
          <Graticule stroke="#0d2a45" strokeWidth={0.3} strokeDasharray="2,4" />

          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name: string = geo.properties.name;
                const fill = getFill(name);
                const stroke = getStroke(name);
                const strokeWidth = getStrokeWidth(name);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => !disabled && setHoveredCountry(name)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    onClick={() => !disabled && onCountryClick(name)}
                    style={{
                      default: {
                        fill,
                        stroke,
                        strokeWidth,
                        outline: "none",
                        cursor: disabled ? "default" : "pointer",
                        transition: "fill 0.18s ease, stroke 0.18s ease",
                        filter: (correctCountry === name || wrongCountry === name)
                          ? "drop-shadow(0 0 4px currentColor)"
                          : "none",
                      },
                      hover: {
                        fill: disabled ? fill : "#4f46e5",
                        stroke: disabled ? stroke : "#818cf8",
                        strokeWidth: disabled ? strokeWidth : 0.7,
                        outline: "none",
                        cursor: disabled ? "default" : "pointer",
                      },
                      pressed: {
                        fill,
                        stroke,
                        strokeWidth,
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* Country name annotations for special countries */}
          {specialCountries.map(country => {
            // We'd need centroid data for precise placement, so use hover tooltip instead
            return null;
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Hover tooltip — floating label */}
      {hoveredCountry && !disabled && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap flex items-center gap-2"
          style={{ background: "rgba(5,20,45,0.92)", border: "1px solid rgba(100,160,255,0.25)", color: "#e2e8f0" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
          {getDisplayName(hoveredCountry)}
          {COUNTRY_NAMES[hoveredCountry] ? <span className="text-slate-500">· {hoveredCountry}</span> : ""}
        </div>
      )}

      {/* Selected country label */}
      {selectedCountry && !hoveredCountry && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap flex items-center gap-2"
          style={{ background: "rgba(5,20,45,0.92)", border: "1px solid rgba(251,191,36,0.4)", color: "#fbbf24" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          Selected: {getDisplayName(selectedCountry)}
        </div>
      )}

      {/* Map legend after answer */}
      {(correctCountry || wrongCountry) && (
        <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
          {correctCountry && (
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(5,20,45,0.9)", border: "1px solid rgba(74,222,128,0.3)" }}>
              <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
              <span className="text-green-300">Thief's Location</span>
            </div>
          )}
          {wrongCountry && wrongCountry !== correctCountry && (
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(5,20,45,0.9)", border: "1px solid rgba(248,113,113,0.3)" }}>
              <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              <span className="text-red-300">Your Guess</span>
            </div>
          )}
        </div>
      )}

      {/* Compass rose */}
      <div className="absolute top-3 left-3 text-slate-600 text-xs opacity-60 select-none pointer-events-none">
        <div className="flex flex-col items-center gap-0">
          <span>N</span>
          <span style={{ fontSize: "8px" }}>↑</span>
        </div>
      </div>

      {/* Scale bar */}
      <div className="absolute bottom-10 right-3 flex items-center gap-1 pointer-events-none opacity-50">
        <div className="h-px w-10 bg-slate-500" />
        <span className="text-slate-500 text-xs">~5000km</span>
      </div>
    </div>
  );
}
