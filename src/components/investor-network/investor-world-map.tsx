"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as d3Geo from "d3-geo";
import * as d3Zoom from "d3-zoom";
import * as d3Selection from "d3-selection";
import * as topojson from "topojson-client";
import type { Topology, Objects } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import * as reactFlags from "country-flag-icons/react/3x2";
import { hasFlag } from "country-flag-icons";
import { Plus, Minus, RotateCcw } from "lucide-react";
import worldData from "@/data/countries-110m.json";
import { numericIdToAlpha2 } from "@/lib/country-map-data";
import { getCountryName } from "@/lib/validation";
import type { CountryInvestorData } from "@/server/investor-network";

export interface InvestorWorldMapProps {
  countries?: CountryInvestorData[];
  selectedCode?: string | null;
  onSelectCountry?: (code: string) => void;
}

export interface CountryMapInfo {
  code: string | null;
  name: string;
  investors: number;
}

/**
 * Territories / disputed regions that do not carry a sovereign ISO 3166-1 alpha-2 code
 * in the map data. These shapes display their shape name, no flag, no bracket code,
 * and 0 investors.
 */
export const NO_ISO_TERRITORIES = new Set([
  "Antarctica",
  "Kosovo",
  "N. Cyprus",
  "Northern Cyprus",
  "Somaliland",
  "W. Sahara",
  "Western Sahara",
]);

/**
 * Resolves country metadata (name, alpha-2 code, investor count) from a map feature.
 * - If the shape has an ISO alpha-2 code, resolves its name from the app's country list
 *   and pulls its investor count from the data (or 0 if not present).
 * - For shapes with no ISO code, returns null code, map data name, and 0 investors.
 */
export function getCountryMapInfo(
  feature: Feature<Geometry>,
  investorDataMap: Map<string, { investors: number; name?: string }>
): CountryMapInfo {
  const shapeName =
    ((feature.properties as { name?: string })?.name || "").trim() || "Territory";

  if (NO_ISO_TERRITORIES.has(shapeName)) {
    return {
      code: null,
      name: shapeName,
      investors: 0,
    };
  }

  const rawCode = numericIdToAlpha2(feature.id as string | number);
  if (!rawCode) {
    return {
      code: null,
      name: shapeName,
      investors: 0,
    };
  }

  const code = rawCode.toUpperCase();
  const appCountryName = getCountryName(code);
  const data = investorDataMap.get(code);

  return {
    code,
    name: data?.name || (shapeName && shapeName !== "Territory" ? shapeName : appCountryName),
    investors: data?.investors ?? 0,
  };
}

interface HoveredState {
  feature: Feature<Geometry>;
  centroid: [number, number];
  info: CountryMapInfo;
}

interface TooltipState {
  code: string | null;
  name: string;
  investors: number;
  x: number;
  y: number;
}

const MAP_WIDTH = 960;
const MAP_HEIGHT = 500;

export function InvestorWorldMap({
  countries = [],
  selectedCode: _selectedCode = null,
  onSelectCountry,
}: InvestorWorldMapProps) {
  void _selectedCode;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehaviorRef = useRef<d3Zoom.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentTransform, setCurrentTransform] = useState<d3Zoom.ZoomTransform>(
    d3Zoom.zoomIdentity
  );
  const [hoveredCountry, setHoveredCountry] = useState<HoveredState | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
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
  const featureCollection = useMemo(() => {
    const topology = worldData as unknown as Topology<Objects>;
    return topojson.feature(
      topology,
      topology.objects.countries
    ) as unknown as FeatureCollection<Geometry>;
  }, []);

  // Equal Earth projection and path generator
  const pathGenerator = useMemo(() => {
    const proj = d3Geo.geoEqualEarth().fitSize([MAP_WIDTH, MAP_HEIGHT], featureCollection);
    return d3Geo.geoPath(proj);
  }, [featureCollection]);

  // Precompute 2D projected centroids for every feature
  const countryCentroids = useMemo(() => {
    const centroids = new Map<Feature<Geometry>, [number, number]>();

    for (const feat of featureCollection.features) {
      let c: [number, number] = [MAP_WIDTH / 2, MAP_HEIGHT / 2];
      try {
        const calculated = pathGenerator.centroid(feat);
        if (calculated && !isNaN(calculated[0]) && !isNaN(calculated[1])) {
          c = calculated;
        } else {
          const bounds = pathGenerator.bounds(feat);
          if (bounds) {
            c = [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
          }
        }
      } catch {
        // Fallback to center
      }
      centroids.set(feat, c);
    }

    return centroids;
  }, [featureCollection, pathGenerator]);

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

  // Zoom control buttons
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3Selection.select(svgRef.current).call(zoomBehaviorRef.current.scaleBy, 1.4);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3Selection.select(svgRef.current).call(zoomBehaviorRef.current.scaleBy, 1 / 1.4);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3Selection.select(svgRef.current).call(zoomBehaviorRef.current.transform, d3Zoom.zoomIdentity);
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

  // Calculate tooltip coordinates inside the map container
  const computeTooltipPosition = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const relX = clientX - rect.left;
      const relY = clientY - rect.top;

      const tooltipWidth = 240;
      const tooltipHeight = 90;
      const margin = 14;

      let x = relX + 16;
      let y = relY + 16;

      // Flip left if near the right boundary
      if (x + tooltipWidth > rect.width - margin) {
        x = relX - tooltipWidth - 16;
      }
      // Clamp within container horizontally
      x = Math.max(margin, Math.min(x, rect.width - tooltipWidth - margin));

      // Flip up if near the bottom boundary
      if (y + tooltipHeight > rect.height - margin) {
        y = relY - tooltipHeight - 16;
      }
      // Clamp within container vertically
      y = Math.max(margin, Math.min(y, rect.height - tooltipHeight - margin));

      return { x, y };
    },
    []
  );

  // Handle country hover (desktop)
  const handleCountryHover = (
    feat: Feature<Geometry>,
    e: React.MouseEvent<SVGPathElement>
  ) => {
    const info = getCountryMapInfo(feat, investorDataMap);
    const centroid = countryCentroids.get(feat) || [MAP_WIDTH / 2, MAP_HEIGHT / 2];
    const pos = computeTooltipPosition(e.clientX, e.clientY);

    setHoveredCountry({ feature: feat, centroid, info });
    setTooltip({
      code: info.code,
      name: info.name,
      investors: info.investors,
      x: pos.x,
      y: pos.y,
    });
  };

  // Handle country tap / click (desktop & mobile)
  const handleCountryClick = (
    feat: Feature<Geometry>,
    e: React.MouseEvent<SVGPathElement> | React.TouchEvent<SVGPathElement>
  ) => {
    e.stopPropagation();
    const info = getCountryMapInfo(feat, investorDataMap);
    const centroid = countryCentroids.get(feat) || [MAP_WIDTH / 2, MAP_HEIGHT / 2];

    let clientX = 0;
    let clientY = 0;
    if ("clientX" in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    const pos = computeTooltipPosition(clientX, clientY);

    setHoveredCountry({ feature: feat, centroid, info });
    setTooltip({
      code: info.code,
      name: info.name,
      investors: info.investors,
      x: pos.x,
      y: pos.y,
    });

    if (info.code && onSelectCountry) {
      onSelectCountry(info.code);
    }
  };

  // Clear hover state
  const handleMapBackgroundClick = () => {
    setHoveredCountry(null);
    setTooltip(null);
  };

  const hoveredPath = hoveredCountry ? pathGenerator(hoveredCountry.feature) : null;

  return (
    <div
      ref={containerRef}
      onClick={handleMapBackgroundClick}
      className="relative w-full h-full bg-slate-50 dark:bg-[#0c0c0c] rounded-none sm:rounded-3xl overflow-hidden select-none border-y sm:border border-slate-200/90 dark:border-white/10"
    >
      {/* Zoom Control Buttons */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-white/90 dark:bg-[#161616]/90 p-1.5 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleResetZoom();
          }}
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
        onMouseLeave={() => {
          setHoveredCountry(null);
          setTooltip(null);
        }}
      >
        <g
          transform={`translate(${currentTransform.x}, ${currentTransform.y}) scale(${currentTransform.k})`}
        >
          {/* Base Country Polygons - unscaled hit targets */}
          {featureCollection.features.map((feat, idx) => {
            const d = pathGenerator(feat);
            if (!d) return null;

            const info = getCountryMapInfo(feat, investorDataMap);
            const fill = getCountryFill(info.investors);
            const key = info.code ? `feat-${info.code}` : `feat-shape-${idx}`;

            return (
              <path
                key={key}
                data-country-code={info.code || undefined}
                d={d}
                fill={fill}
                stroke={isDark ? "#383838" : "#cbd5e1"}
                strokeWidth={0.6}
                vectorEffect="non-scaling-stroke"
                className="transition-colors duration-150 cursor-pointer"
                onMouseEnter={(e) => handleCountryHover(feat, e)}
                onMouseMove={(e) => handleCountryHover(feat, e)}
                onClick={(e) => handleCountryClick(feat, e)}
                onTouchStart={(e) => handleCountryClick(feat, e)}
              />
            );
          })}

          {/* Separate Overlay Path: enlarged highlight (scale ~1.06 around centroid, 150ms ease) */}
          {hoveredCountry && hoveredPath && (
            <path
              data-overlay="hovered"
              d={hoveredPath}
              fill={isDark ? "#f5f5f5" : "#ff6600"}
              stroke={isDark ? "#ffffff" : "#ea580c"}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              style={{
                pointerEvents: "none",
                transformBox: "view-box",
                transformOrigin: `${hoveredCountry.centroid[0]}px ${hoveredCountry.centroid[1]}px`,
                transform: "scale(1.06)",
                transition: "transform 150ms ease, fill 150ms ease",
              }}
            />
          )}
        </g>
      </svg>

      {/* Tooltip: rounded-2xl box following cursor, clamped inside map container */}
      {tooltip && (
        <div
          data-testid="investor-tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
          className="absolute z-30 pointer-events-none px-4 py-3 rounded-2xl bg-white dark:bg-[#161616] border border-slate-200/90 dark:border-white/10 shadow-xl backdrop-blur-md text-slate-900 dark:text-white min-w-[180px] max-w-[280px] select-none animate-in fade-in zoom-in-95 duration-100"
        >
          {/* First row = flag + country name in bold + ISO code in grey in brackets */}
          <div className="flex items-center gap-2">
            {tooltip.code && hasFlag(tooltip.code) && (
              <div className="w-[24px] h-[18px] rounded-sm overflow-hidden shrink-0 flex items-center justify-center border border-black/10 dark:border-white/15 shadow-2xs">
                {(() => {
                  const FlagComponent = (
                    reactFlags as Record<
                      string,
                      React.ComponentType<{ className?: string; style?: React.CSSProperties }>
                    >
                  )[tooltip.code];
                  return FlagComponent ? (
                    <FlagComponent className="w-full h-full object-cover" />
                  ) : null;
                })()}
              </div>
            )}
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {tooltip.name}
              </span>
              {tooltip.code && (
                <span className="text-xs text-slate-400 dark:text-slate-500 font-normal shrink-0">
                  ({tooltip.code})
                </span>
              )}
            </div>
          </div>

          {/* 1px divider */}
          <div className="h-px w-full bg-slate-200/80 dark:bg-white/10 my-2.5" />

          {/* Second row = ONLY the investor count, en-US formatted, large */}
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-brand-600 dark:text-brand-500 tracking-tight leading-none">
              {tooltip.investors.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
