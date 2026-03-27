import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Esri World Street Map — colorful political atlas with English country names
const ESRI_STREET = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

// Country GeoJSON with name properties
const COUNTRIES_URL =
  'https://cdn.jsdelivr.net/gh/holtzy/D3-graph-gallery@master/DATA/world.geojson';

// Stable default style — defined at module level so the reference never
// changes between renders, preventing react-leaflet from resetting styles
function defaultGeoStyle(): L.PathOptions {
  return { fillColor: 'transparent', fillOpacity: 0, color: '#94a3b8', weight: 0.4, opacity: 0.3 };
}

// Normalize GeoJSON names to match the game's mapCountry values
const NORMALIZE: Record<string, string> = {
  'USA': 'United States of America',
  'United States': 'United States of America',
};
function norm(name: string): string {
  return NORMALIZE[name] ?? name;
}

// Country flag emoji map
const FLAGS: Record<string, string> = {
  'France': '🇫🇷', 'Germany': '🇩🇪', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
  'Portugal': '🇵🇹', 'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Switzerland': '🇨🇭',
  'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Denmark': '🇩🇰', 'Finland': '🇫🇮',
  'Poland': '🇵🇱', 'Austria': '🇦🇹', 'Greece': '🇬🇷', 'Turkey': '🇹🇷',
  'Russia': '🇷🇺', 'Ukraine': '🇺🇦', 'United Kingdom': '🇬🇧',
  'United States of America': '🇺🇸', 'Canada': '🇨🇦', 'Mexico': '🇲🇽',
  'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Colombia': '🇨🇴',
  'Peru': '🇵🇪', 'Venezuela': '🇻🇪', 'Ecuador': '🇪🇨', 'Bolivia': '🇧🇴',
  'China': '🇨🇳', 'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'India': '🇮🇳',
  'Indonesia': '🇮🇩', 'Thailand': '🇹🇭', 'Vietnam': '🇻🇳', 'Philippines': '🇵🇭',
  'Malaysia': '🇲🇾', 'Singapore': '🇸🇬', 'Pakistan': '🇵🇰', 'Bangladesh': '🇧🇩',
  'Egypt': '🇪🇬', 'Morocco': '🇲🇦', 'South Africa': '🇿🇦', 'Nigeria': '🇳🇬',
  'Kenya': '🇰🇪', 'Ethiopia': '🇪🇹', 'Tanzania': '🇹🇿', 'Ghana': '🇬🇭',
  'Australia': '🇦🇺', 'New Zealand': '🇳🇿', 'Saudi Arabia': '🇸🇦',
  'Iran': '🇮🇷', 'Iraq': '🇮🇶', 'Israel': '🇮🇱', 'Jordan': '🇯🇴',
  'Afghanistan': '🇦🇫', 'Kazakhstan': '🇰🇿', 'Uzbekistan': '🇺🇿',
  'Iceland': '🇮🇸', 'Georgia': '🇬🇪', 'Sri Lanka': '🇱🇰', 'England': '🇬🇧',
};

// Custom amber pin icon for selected country
const PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35));display:flex;align-items:flex-end;justify-content:center;">
    <svg viewBox="0 0 24 32" width="28" height="37" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 23 9 23s9-16.25 9-23C21 4.03 16.97 0 12 0z" fill="#f59e0b"/>
      <circle cx="12" cy="9" r="4.5" fill="white"/>
      <circle cx="12" cy="9" r="2.5" fill="#f59e0b"/>
    </svg>
  </div>`,
  iconSize: [28, 37],
  iconAnchor: [14, 37],
  popupAnchor: [0, -37],
});

const CORRECT_PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35));display:flex;align-items:flex-end;justify-content:center;">
    <svg viewBox="0 0 24 32" width="28" height="37" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 23 9 23s9-16.25 9-23C21 4.03 16.97 0 12 0z" fill="#16a34a"/>
      <circle cx="12" cy="9" r="4.5" fill="white"/>
      <circle cx="12" cy="9" r="2.5" fill="#16a34a"/>
    </svg>
  </div>`,
  iconSize: [28, 37],
  iconAnchor: [14, 37],
});

const WRONG_PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35));display:flex;align-items:flex-end;justify-content:center;">
    <svg viewBox="0 0 24 32" width="28" height="37" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 23 9 23s9-16.25 9-23C21 4.03 16.97 0 12 0z" fill="#dc2626"/>
      <circle cx="12" cy="9" r="4.5" fill="white"/>
      <circle cx="12" cy="9" r="2.5" fill="#dc2626"/>
    </svg>
  </div>`,
  iconSize: [28, 37],
  iconAnchor: [14, 37],
});

function countryStyle(
  name: string,
  selected: string | null,
  correct: string | null | undefined,
  wrong: string | null | undefined,
  hovered: string | null,
  disabled: boolean,
): L.PathOptions {
  if (correct && name === correct)
    return { fillColor: '#16a34a', fillOpacity: 0.55, color: '#15803d', weight: 3, opacity: 1 };
  if (wrong && name === wrong)
    return { fillColor: '#dc2626', fillOpacity: 0.55, color: '#b91c1c', weight: 3, opacity: 1 };
  if (!correct && selected === name)
    return { fillColor: '#f59e0b', fillOpacity: 0.45, color: '#d97706', weight: 2.5, opacity: 1 };
  if (!disabled && hovered === name)
    return { fillColor: '#3b82f6', fillOpacity: 0.35, color: '#1d4ed8', weight: 2.5, opacity: 1 };
  // Transparent by default — let Esri tile show country colors & names through
  return { fillColor: 'transparent', fillOpacity: 0, color: 'transparent', weight: 0, opacity: 0 };
}

// Force Leaflet to recalculate map size after mount
function MapInit() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t)
  }, [map]);
  return null;
}

// Dashed line between wrong guess and correct location
function DistanceLine({ from, to }: { from: [number, number]; to: [number, number] }) {
  return (
    <Polyline positions={[from, to]} pathOptions={{ color: '#facc15', weight: 4, opacity: 1, dashArray: '10 7' }} interactive={false} />
  );
}

// Auto-fit map to show both pins (wrong + correct) when answer is revealed
function MapFitBounds({ wrongPos, correctPos }: { wrongPos: [number, number] | null; correctPos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!correctPos) return;
    const t = setTimeout(() => {
      if (wrongPos && wrongPos[0] !== correctPos[0] && wrongPos[1] !== correctPos[1]) {
        const bounds = L.latLngBounds([wrongPos, correctPos]);
        map.flyToBounds(bounds, { padding: [60, 60], duration: 1.4, maxZoom: 5 });
      } else {
        map.flyTo(correctPos, Math.max(map.getZoom(), 4), { duration: 1.4 });
      }
    }, 500);
    return () => clearTimeout(t);
  }, [wrongPos, correctPos, map]);
  return null;
}

// Custom zoom buttons
function ZoomButtons() {
  const map = useMap();
  const btnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(100,120,160,0.25)',
    backdropFilter: 'blur(6px)',
    color: '#334155',
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 18,
    fontWeight: 700,
    userSelect: 'none',
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  };
  return (
    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button style={btnStyle} onClick={() => map.zoomIn()}>+</button>
      <button style={btnStyle} onClick={() => map.zoomOut()}>−</button>
      <button style={{ ...btnStyle, fontSize: 12 }} onClick={() => map.setView([20, 0], 2)} title="Reset">⊙</button>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface GeoGuessrMapProps {
  selectedCountry: string | null;
  correctCountry?: string | null;
  wrongCountry?: string | null;
  onCountryClick: (name: string) => void;
  disabled?: boolean;
}

// ── Main component ────────────────────────────────────────────────────────────
export function GeoGuessrMap({
  selectedCountry,
  correctCountry,
  wrongCountry,
  onCountryClick,
  disabled = false,
}: GeoGuessrMapProps) {
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [pinPosition, setPinPosition] = useState<[number, number] | null>(null);
  const [correctPinPos, setCorrectPinPos] = useState<[number, number] | null>(null);
  const [wrongPinPos, setWrongPinPos] = useState<[number, number] | null>(null);

  // Refs for stable Leaflet callbacks
  const disabledRef = useRef(disabled);
  const onClickRef = useRef(onCountryClick);
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);
  useEffect(() => { onClickRef.current = onCountryClick; }, [onCountryClick]);

  // Store all layers + centroids
  const layersRef = useRef<Array<{ name: string; layer: L.Path }>>([]);
  const centroidsRef = useRef<Record<string, [number, number]>>({});

  // Mouse tracking for floating hover badge
  const containerRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);
  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
    setHoveredCountry(null);
  }, []);

  // Fetch GeoJSON once
  useEffect(() => {
    fetch(COUNTRIES_URL)
      .then(r => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        layersRef.current = [];
        setGeoData(data);
      })
      .catch(err => console.error('GeoJSON load failed:', err));
  }, []);

  // Update pin positions when selection / result changes
  useEffect(() => {
    if (selectedCountry && centroidsRef.current[selectedCountry]) {
      setPinPosition(centroidsRef.current[selectedCountry]);
    } else {
      setPinPosition(null);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (correctCountry && centroidsRef.current[correctCountry]) {
      setCorrectPinPos(centroidsRef.current[correctCountry]);
    } else {
      setCorrectPinPos(null);
    }
  }, [correctCountry]);

  useEffect(() => {
    if (wrongCountry && centroidsRef.current[wrongCountry]) {
      setWrongPinPos(centroidsRef.current[wrongCountry]);
    } else {
      setWrongPinPos(null);
    }
  }, [wrongCountry]);

  // Imperatively update Leaflet layer styles
  useEffect(() => {
    layersRef.current.forEach(({ name, layer }) => {
      layer.setStyle(
        countryStyle(name, selectedCountry, correctCountry, wrongCountry, hoveredCountry, disabled),
      );
    });
  }, [selectedCountry, correctCountry, wrongCountry, hoveredCountry, disabled, geoData]);

  // Called once per feature when GeoJSON mounts
  const onEachFeature = useCallback((feature: GeoJSON.Feature, layer: L.Layer) => {
    const rawName = (feature.properties as Record<string, string>)?.name ?? '';
    const name = norm(rawName);
    if (!name) return;

    layersRef.current.push({ name, layer: layer as L.Path });

    // Store centroid for pin placement — use largest polygon to avoid overseas-territory offset
    const geoLayer = layer as unknown as { feature?: GeoJSON.Feature };
    const geom = geoLayer.feature?.geometry;
    let center: [number, number] | null = null;

    if (geom?.type === 'MultiPolygon') {
      let maxArea = 0;
      for (const poly of (geom as GeoJSON.MultiPolygon).coordinates) {
        const ring = poly[0];
        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        for (const [lng, lat] of ring) {
          if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
        }
        const area = (maxLat - minLat) * (maxLng - minLng);
        if (area > maxArea) {
          maxArea = area;
          center = [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
        }
      }
    } else if (geom?.type === 'Polygon') {
      const ring = (geom as GeoJSON.Polygon).coordinates[0];
      let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
      for (const [lng, lat] of ring) {
        if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
      }
      center = [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
    } else {
      const bounds = (layer as L.Path).getBounds?.();
      if (bounds) { const c = bounds.getCenter(); center = [c.lat, c.lng]; }
    }
    if (center) centroidsRef.current[name] = center;

    layer.on({
      mouseover: (e) => {
        if (!disabledRef.current) {
          setHoveredCountry(name);
          (e.target as L.Path).bringToFront();
        }
      },
      mouseout: () => setHoveredCountry(null),
      click: () => {
        if (!disabledRef.current) onClickRef.current(name);
      },
    });
  }, []);

  const flag = hoveredCountry ? (FLAGS[hoveredCountry] ?? '🌍') : null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 400,
        background: '#c4b49a',
        borderRadius: 'inherit',
        overflow: 'hidden',
        cursor: disabled ? 'default' : 'crosshair',
      }}
    >
      {/* Vintage cartography overlay — sepia aged-map effect */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 500, pointerEvents: 'none',
        background: 'rgba(80,50,10,0.08)',
        mixBlendMode: 'multiply',
      }} />
      <MapContainer
        center={[15, 10]}
        zoom={2.5}
        zoomControl={false}
        scrollWheelZoom
        style={{ width: '100%', height: '100%', minHeight: 400, filter: 'sepia(0.45) saturate(0.8) brightness(0.92) contrast(1.05)' }}
        minZoom={2.6}
        maxZoom={8}
        maxBounds={[[-85, -220], [85, 220]]}
        maxBoundsViscosity={1.0}
        attributionControl={false}
      >
        {/* Esri World Street Map — colorful political atlas with English labels */}
        <TileLayer url={ESRI_STREET} tileSize={256} />

        {/* Country fills */}
        {geoData && (
          <GeoJSON
            key="world"
            data={geoData}
            style={defaultGeoStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Location pin for selected country */}
        {pinPosition && !correctCountry && (
          <Marker position={pinPosition} icon={PIN_ICON} interactive={false} />
        )}

        {/* Correct country green pin */}
        {correctPinPos && (
          <Marker position={correctPinPos} icon={CORRECT_PIN_ICON} interactive={false} />
        )}

        {/* Wrong country red pin (only if different from correct) */}
        {wrongPinPos && wrongCountry !== correctCountry && (
          <Marker position={wrongPinPos} icon={WRONG_PIN_ICON} interactive={false} />
        )}

        {/* Connection line + distance label between wrong and correct pin */}
        {wrongPinPos && correctPinPos && wrongCountry !== correctCountry && (
          <DistanceLine from={wrongPinPos} to={correctPinPos} />
        )}

        <MapInit />
        <ZoomButtons />
        <MapFitBounds wrongPos={wrongPinPos} correctPos={correctPinPos} />
      </MapContainer>

      {/* Floating flag badge following the mouse */}
      {hoveredCountry && !disabled && mousePos && flag && (
        <div
          style={{
            position: 'absolute',
            left: mousePos.x + 16,
            top: mousePos.y - 40,
            zIndex: 1200,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.97)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 20,
            padding: '4px 10px 4px 6px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            fontSize: 12,
            color: '#1e293b',
            fontWeight: 600,
          }}
        >
          {/* Mini pin icon */}
          <svg viewBox="0 0 24 32" width="14" height="18" fill="none">
            <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 23 9 23s9-16.25 9-23C21 4.03 16.97 0 12 0z" fill="#3b82f6"/>
            <circle cx="12" cy="9" r="4" fill="white"/>
          </svg>
          <span style={{ fontSize: 16 }}>{flag}</span>
          {hoveredCountry}
        </div>
      )}

      {/* Selected country label (when not hovered, not yet answered) */}
      {selectedCountry && !hoveredCountry && !correctCountry && pinPosition && (
        <div
          style={{
            position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, pointerEvents: 'none', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(245,158,11,0.5)',
            borderRadius: 999, padding: '5px 14px', color: '#92400e', fontSize: 12, fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <svg viewBox="0 0 24 32" width="12" height="16" fill="none">
            <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 23 9 23s9-16.25 9-23C21 4.03 16.97 0 12 0z" fill="#f59e0b"/>
            <circle cx="12" cy="9" r="4" fill="white"/>
          </svg>
          {FLAGS[selectedCountry] ?? ''} {selectedCountry}
        </div>
      )}

      {/* Result legend */}
      {(correctCountry || wrongCountry) && (
        <div style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {correctCountry && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(22,163,74,0.4)', borderRadius: 8, padding: '4px 10px', fontSize: 11, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
              <svg viewBox="0 0 24 32" width="10" height="13" fill="none"><path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 23 9 23s9-16.25 9-23C21 4.03 16.97 0 12 0z" fill="#16a34a"/></svg>
              <span style={{ color: '#15803d', fontWeight: 600 }}>{FLAGS[correctCountry] ?? '✅'} Thief's Location</span>
            </div>
          )}
          {wrongCountry && wrongCountry !== correctCountry && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(220,38,38,0.4)', borderRadius: 8, padding: '4px 10px', fontSize: 11, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
              <svg viewBox="0 0 24 32" width="10" height="13" fill="none"><path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 23 9 23s9-16.25 9-23C21 4.03 16.97 0 12 0z" fill="#dc2626"/></svg>
              <span style={{ color: '#b91c1c', fontWeight: 600 }}>{FLAGS[wrongCountry] ?? '❌'} Your Guess</span>
            </div>
          )}
        </div>
      )}

      {/* Compass */}
      <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 1000, color: '#94a3b8', fontSize: 11, opacity: 0.7, pointerEvents: 'none', textAlign: 'center', lineHeight: 1.2 }}>
        N<br /><span style={{ fontSize: 8 }}>↑</span>
      </div>

      {/* Attribution */}
      <div style={{ position: 'absolute', bottom: 4, right: 8, zIndex: 1000, color: '#94a3b8', fontSize: 9, opacity: 0.6, pointerEvents: 'none' }}>
        © OpenStreetMap · CARTO
      </div>
    </div>
  );
}
