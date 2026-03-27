import { useState, useCallback } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Chinese names for countries that may appear in the game + common ones
const ZH_NAMES: Record<string, string> = {
  "France": "法国", "Japan": "日本", "United States of America": "美国",
  "Egypt": "埃及", "Brazil": "巴西", "Australia": "澳大利亚",
  "Iceland": "冰岛", "Morocco": "摩洛哥", "Vietnam": "越南",
  "China": "中国", "India": "印度", "Russia": "俄罗斯",
  "Germany": "德国", "United Kingdom": "英国", "Italy": "意大利",
  "Spain": "西班牙", "Canada": "加拿大", "Mexico": "墨西哥",
  "Argentina": "阿根廷", "South Africa": "南非", "Nigeria": "尼日利亚",
  "Kenya": "肯尼亚", "Saudi Arabia": "沙特阿拉伯", "Iran": "伊朗",
  "Turkey": "土耳其", "Thailand": "泰国", "Indonesia": "印度尼西亚",
  "Philippines": "菲律宾", "South Korea": "韩国", "North Korea": "朝鲜",
  "Pakistan": "巴基斯坦", "Bangladesh": "孟加拉国", "Myanmar": "缅甸",
  "Afghanistan": "阿富汗", "Iraq": "伊拉克", "Syria": "叙利亚",
  "Ukraine": "乌克兰", "Poland": "波兰", "Sweden": "瑞典",
  "Norway": "挪威", "Finland": "芬兰", "Denmark": "丹麦",
  "Netherlands": "荷兰", "Belgium": "比利时", "Switzerland": "瑞士",
  "Portugal": "葡萄牙", "Greece": "希腊", "Romania": "罗马尼亚",
  "New Zealand": "新西兰", "Peru": "秘鲁", "Chile": "智利",
  "Colombia": "哥伦比亚", "Venezuela": "委内瑞拉", "Bolivia": "玻利维亚",
  "Algeria": "阿尔及利亚", "Libya": "利比亚", "Sudan": "苏丹",
  "Ethiopia": "埃塞俄比亚", "Tanzania": "坦桑尼亚", "Mozambique": "莫桑比克",
  "Madagascar": "马达加斯加", "Angola": "安哥拉", "Zambia": "赞比亚",
  "Zimbabwe": "津巴布韦", "Ghana": "加纳", "Cameroon": "喀麦隆",
  "Mali": "马里", "Niger": "尼日尔", "Chad": "乍得",
  "Somalia": "索马里", "Yemen": "也门", "Oman": "阿曼",
  "Kazakhstan": "哈萨克斯坦", "Uzbekistan": "乌兹别克斯坦",
  "Mongolia": "蒙古", "Cambodia": "柬埔寨", "Laos": "老挝",
  "Malaysia": "马来西亚", "Papua New Guinea": "巴布亚新几内亚",
  "Ecuador": "厄瓜多尔", "Paraguay": "巴拉圭", "Uruguay": "乌拉圭",
};

export function getChineseName(en: string) {
  return ZH_NAMES[en] || en;
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
    if (correctCountry && name === correctCountry) return "#22c55e";
    if (wrongCountry && name === wrongCountry) return "#ef4444";
    if (!correctCountry && selectedCountry === name) return "#f59e0b";
    if (!disabled && hoveredCountry === name) return "#6366f1";
    return "#1e3a5f";
  }, [selectedCountry, correctCountry, wrongCountry, hoveredCountry, disabled]);

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden select-none"
      style={{ background: "#071526" }}
    >
      {/* Zoom controls */}
      {!disabled && (
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
          <button
            className="w-7 h-7 rounded bg-white/10 text-white hover:bg-white/20 transition text-sm font-bold flex items-center justify-center"
            onClick={() => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 6) }))}
          >+</button>
          <button
            className="w-7 h-7 rounded bg-white/10 text-white hover:bg-white/20 transition text-sm font-bold flex items-center justify-center"
            onClick={() => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }))}
          >−</button>
          {position.zoom > 1 && (
            <button
              className="w-7 h-7 rounded bg-white/10 text-white hover:bg-white/20 transition text-xs flex items-center justify-center"
              onClick={() => setPosition({ coordinates: [0, 15], zoom: 1 })}
              title="Reset"
            >⊙</button>
          )}
        </div>
      )}

      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 155 }}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={({ coordinates, zoom }) => setPosition({ coordinates, zoom })}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name: string = geo.properties.name;
                const fill = getFill(name);
                const isSpecial = correctCountry === name || wrongCountry === name || selectedCountry === name;
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
                        stroke: "#0a1628",
                        strokeWidth: isSpecial ? 0.8 : 0.4,
                        outline: "none",
                        cursor: disabled ? "default" : "pointer",
                        transition: "fill 0.15s ease",
                      },
                      hover: {
                        fill: disabled ? fill : "#6366f1",
                        stroke: "#0a1628",
                        strokeWidth: 0.4,
                        outline: "none",
                        cursor: disabled ? "default" : "pointer",
                      },
                      pressed: {
                        fill,
                        stroke: "#0a1628",
                        strokeWidth: 0.4,
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Hover tooltip */}
      {hoveredCountry && !disabled && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1 rounded-full pointer-events-none whitespace-nowrap">
          {getChineseName(hoveredCountry)} {ZH_NAMES[hoveredCountry] ? `· ${hoveredCountry}` : ""}
        </div>
      )}

      {/* Map legend */}
      {(correctCountry || wrongCountry) && (
        <div className="absolute bottom-2 left-2 flex flex-col gap-1">
          {correctCountry && (
            <div className="flex items-center gap-1 text-xs bg-black/70 px-2 py-0.5 rounded">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-green-300">正确位置</span>
            </div>
          )}
          {wrongCountry && wrongCountry !== correctCountry && (
            <div className="flex items-center gap-1 text-xs bg-black/70 px-2 py-0.5 rounded">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-red-300">你的选择</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
