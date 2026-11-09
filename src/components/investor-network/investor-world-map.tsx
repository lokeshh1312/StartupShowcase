"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as d3Geo from "d3-geo";
import * as d3Zoom from "d3-zoom";
import * as d3Selection from "d3-selection";
import * as topojson from "topojson-client";
import type { Topology, Objects } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { Plus, Minus, RotateCcw } from "lucide-react";
import worldData from "@/data/countries-110m.json";
import {
  numericIdToAlpha2,
  FALLBACK_COUNTRY_COORDINATES,
} from "@/lib/country-map-data";
import { CountryFlag } from "@/components/common/country-flag";
import type { CountryInvestorData } from "@/server/investor-network";

interface InvestorWorldMapProps {
  countries: CountryInvestorData[];
  selectedCode: string | null;
  onSelectCountry: (code: string) => void;
}

interface TooltipInfo {
  code: string;
  name: string;
  investors: number;
  startups: number;
  x: number;
  y: number;
}

const MAP_WIDTH = 960;
const MAP_HEIGHT = 500;

export function InvestorWorldMap({
  countries,
  selectedCode,
  onSelectCountry,
}: InvestorWorldMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehaviorRef = useRef<d3Zoom.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentTransform, setCurrentTransform] = useState<d3Zoom.ZoomTransform>(
    d3Zoom.zoomIdentity
  );
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode reactively
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Map of uppercase countryCode -> CountryInvestorData
  const investorDataMap = useMemo(() => {
    const map = new Map<string, CountryInvestorData>();
    for (const c of countries) {
      map.set(c.code.toUpperCase(), c);
    }
    return map;
  }, [countries]);

  // Max investors among all countries for color interpolation
  const maxInvestors = useMemo(() => {
    let max = 1;
    for (const c of countries) {
      if (c.investors > max) max = c.investors;
    }
    return max;
  }, [countries]);

  // Extract GeoJSON features from topojson
  const { featureCollection, countryFeaturesByCode } = useMemo(() => {
    const topology = worldData as unknown as Topology<Objects>;
    const collection = topojson.feature(
      topology,
      topology.objects.countries
    ) as unknown as FeatureCollection<Geometry>;

    const byCode = new Map<string, Feature<Geometry>>();
    for (const feat of collection.features) {
      const code = numericIdToAlpha2(feat.id as string | number);
      if (code) {
        byCode.set(code, feat);
      }
    }

    return { featureCollection: collection, countryFeaturesByCode: byCode };
  }, []);

  // Equal Earth projection and path generator
  const { projection, pathGenerator } = useMemo(() => {
    const proj = d3Geo.geoEqualEarth().fitSize([MAP_WIDTH, MAP_HEIGHT], featureCollection);
    const path = d3Geo.geoPath(proj);
    return { projection: proj, pathGenerator: path };
  }, [featureCollection]);

  // Precompute centroids for polygon features and fallback markers
  const countryPositions = useMemo(() => {
    const positions = new Map<string, [number, number]>();

    // Polygons
    for (const [code, feat] of countryFeaturesByCode.entries()) {
      try {
        const centroid = pathGenerator.centroid(feat);
        if (centroid && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
          positions.set(code, centroid);
        }
      } catch {
        // fallback
      }
    }

    // Fallbacks for microstates / island territories without 110m polygons
    for (const [code, lngLat] of Object.entries(FALLBACK_COUNTRY_COORDINATES)) {
      if (!positions.has(code)) {
        const projPoint = projection(lngLat);
        if (projPoint) {
          positions.set(code, projPoint);
        }
      }
    }

    return positions;
  }, [countryFeaturesByCode, pathGenerator, projection]);

  // Attach D3 Zoom
  useEffect(() => {
    if (!svgRef.current) return;

    const zoom = d3Zoom
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .translateExtent([
        [0, 0],
        [MAP_WIDTH, MAP_HEIGHT],
      ])
      .on("zoom", (event) => {
        setCurrentTransform(event.transform);
      });

    zoomBehaviorRef.current = zoom;
    const selection = d3Selection.select(svgRef.current);
    selection.call(zoom);

    return () => {
      selection.on(".zoom", null);
    };
  }, []);

  // Smooth zoom to country when selectedCode changes
  const zoomToCountry = useCallback(
    (code: string | null) => {
      if (!code || !svgRef.current || !zoomBehaviorRef.current) return;

      const pos = countryPositions.get(code.toUpperCase());
      if (!pos) return;

      const [cx, cy] = pos;
      const targetScale = 3.5;
      const x = MAP_WIDTH / 2 - cx * targetScale;
      const y = MAP_HEIGHT / 2 - cy * targetScale;

      const newTransform = d3Zoom.zoomIdentity.translate(x, y).scale(targetScale);
      d3Selection
        .select(svgRef.current)
        .call(zoomBehaviorRef.current.transform, newTransform);
    },
    [countryPositions]
  );

  useEffect(() => {
    if (selectedCode) {
      zoomToCountry(selectedCode);
    }
  }, [selectedCode, zoomToCountry]);

  // Zoom control buttons
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3Selection
      .select(svgRef.current)
      .call(zoomBehaviorRef.current.scaleBy, 1.4);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3Selection
      .select(svgRef.current)
      .call(zoomBehaviorRef.current.scaleBy, 1 / 1.4);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3Selection
      .select(svgRef.current)
      .call(zoomBehaviorRef.current.transform, d3Zoom.zoomIdentity);
  };

  // Color interpolation: sequential brand orange in light theme, neutral slate in dark theme
  const getCountryFill = (investors: number): string => {
    if (investors <= 0) {
      return isDark ? "#262626" : "#f1f5f9"; // neutral land
    }

    const ratio = Math.min(1, investors / maxInvestors);

    if (isDark) {
      // Dark theme: neutral grey scale
      if (ratio < 0.2) return "#404040";
      if (ratio < 0.4) return "#525252";
      if (ratio < 0.6) return "#737373";
      if (ratio < 0.8) return "#a3a3a3";
      return "#d4d4d4";
    } else {
      // Light theme: brand orange scale
      if (ratio < 0.2) return "#ffcca3";
      if (ratio < 0.4) return "#ffad70";
      if (ratio < 0.6) return "#ff8a3d";
      if (ratio < 0.8) return "#ff6600";
      return "#c24e00";
    }
  };

  // Sizing of centroid circles: sqrt(investors)
  const getCircleRadius = (investors: number): number => {
    if (investors <= 0) return 0;
    const base = Math.sqrt(investors) * 0.13;
    // Scale slightly inversely with zoom so circles stay manageable
    const scaleFactor = Math.pow(currentTransform.k, 0.45);
    return Math.max(3, Math.min(22, base / scaleFactor));
  };

  // Handle pointer interactions for tooltip
  const handleCountryHover = (
    code: string | null,
    defaultName: string,
    e?: React.MouseEvent | React.TouchEvent
  ) => {
    if (!code) {
      setTooltip(null);
      return;
    }

    const data = investorDataMap.get(code.toUpperCase());
    const name = data?.name || defaultName || code;
    const investors = data?.investors ?? 0;
    const startups = data?.startups ?? 0;

    let clientX = 0;
    let clientY = 0;
    if (e && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if ("clientX" in e) {
        clientX = e.clientX - rect.left;
        clientY = e.clientY - rect.top;
      } else if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX - rect.left;
        clientY = e.touches[0].clientY - rect.top;
      }
    }

    setTooltip({
      code: code.toUpperCase(),
      name,
      investors,
      startups,
      x: clientX,
      y: clientY,
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[380px] sm:min-h-[440px] md:min-h-[500px] bg-slate-50 dark:bg-[#0c0c0c] rounded-3xl overflow-hidden select-none border border-slate-200/90 dark:border-white/10"
    >
      {/* Zoom Control Buttons */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
          title="Reset map view"
          aria-label="Reset map view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        aria-label="World map showing investor network distribution"
      >
        <g
          transform={`translate(${currentTransform.x}, ${currentTransform.y}) scale(${currentTransform.k})`}
        >
          {/* Base Country Polygons */}
          {featureCollection.features.map((feat, idx) => {
            const code = numericIdToAlpha2(feat.id as string | number);
            const countryData = code ? investorDataMap.get(code) : undefined;
            const investors = countryData?.investors ?? 0;
            const isSelected = Boolean(code && selectedCode && code === selectedCode.toUpperCase());
            const d = pathGenerator(feat);
            if (!d) return null;

            const name = (feat.properties as { name?: string })?.name || code || "Country";

            return (
              <path
                key={code || `feat-${idx}`}
                d={d}
                fill={getCountryFill(investors)}
                stroke={isSelected ? "#2563eb" : isDark ? "#404040" : "#cbd5e1"}
                strokeWidth={isSelected ? 2.5 / currentTransform.k : 0.6 / currentTransform.k}
                className="transition-colors duration-150 cursor-pointer hover:opacity-90"
                onMouseEnter={(e) => handleCountryHover(code, name, e)}
                onMouseMove={(e) => handleCountryHover(code, name, e)}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => {
                  if (code) onSelectCountry(code);
                }}
              />
            );
          })}

          {/* Centroid Circles Sized by sqrt(investors) */}
          {Array.from(countryPositions.entries()).map(([code, [cx, cy]]) => {
            const countryData = investorDataMap.get(code);
            const investors = countryData?.investors ?? 0;
            if (investors <= 0) return null;

            const r = getCircleRadius(investors);
            const isSelected = Boolean(selectedCode && code === selectedCode.toUpperCase());

            return (
              <g
                key={`bubble-${code}`}
                transform={`translate(${cx}, ${cy})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCountry(code);
                }}
                onMouseEnter={(e) =>
                  handleCountryHover(code, countryData?.name || code, e)
                }
                onMouseMove={(e) =>
                  handleCountryHover(code, countryData?.name || code, e)
                }
                onMouseLeave={() => setTooltip(null)}
              >
                <circle
                  r={r}
                  fill={isDark ? "#ffffff" : "#ff6600"}
                  fillOpacity={isSelected ? 0.95 : 0.8}
                  stroke={isSelected ? "#2563eb" : isDark ? "#171717" : "#ffffff"}
                  strokeWidth={isSelected ? 2 / currentTransform.k : 1 / currentTransform.k}
                  className="transition-all duration-200 hover:scale-110"
                />
                {/* Number label for top countries when zoomed in */}
                {currentTransform.k >= 2.4 && r >= 5 && (
                  <text
                    y={-(r + 2 / currentTransform.k)}
                    textAnchor="middle"
                    fill={isDark ? "#ffffff" : "#0f172a"}
                    fontSize={`${Math.max(9, 11 / currentTransform.k)}px`}
                    fontWeight="bold"
                    className="pointer-events-none drop-shadow-xs font-mono"
                  >
                    {investors >= 1000 ? `${(investors / 1000).toFixed(1)}k` : investors}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Hover / Tap Tooltip */}
      {tooltip && (
        <div
          style={{
            left: Math.max(12, Math.min(tooltip.x + 12, (containerRef.current?.clientWidth || 300) - 200)),
            top: Math.max(12, tooltip.y - 80),
          }}
          className="absolute z-30 pointer-events-none px-3.5 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 border border-white/10 shadow-2xl backdrop-blur-md text-white text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100 min-w-[170px]"
        >
          <div className="flex items-center gap-2 font-bold text-slate-100 border-b border-white/10 pb-1.5">
            <CountryFlag code={tooltip.code} className="text-base" />
            <span className="truncate max-w-[140px]">{tooltip.name}</span>
            <span className="text-[10px] font-mono text-slate-400">({tooltip.code})</span>
          </div>

          {tooltip.investors === 0 && tooltip.startups === 0 ? (
            <div className="text-[11px] text-slate-400 italic">No data yet</div>
          ) : (
            <div className="space-y-0.5 pt-0.5 text-[11px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Investors:</span>
                <span className="font-mono font-bold text-brand-400">
                  {tooltip.investors.toLocaleString("en-US")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Startups:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {tooltip.startups.toLocaleString("en-US")}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
