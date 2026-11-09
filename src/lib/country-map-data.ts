import countries from "i18n-iso-countries";

export interface SeedInvestorRegion {
  countryCode: string;
  countryName: string;
  investors: number;
}

export const SEED_INVESTOR_REGIONS: readonly SeedInvestorRegion[] = [
  { countryCode: "US", countryName: "United States", investors: 18500 },
  { countryCode: "IN", countryName: "India", investors: 15200 },
  { countryCode: "CN", countryName: "China", investors: 14300 },
  { countryCode: "GB", countryName: "United Kingdom", investors: 11200 },
  { countryCode: "DE", countryName: "Germany", investors: 9800 },
  { countryCode: "JP", countryName: "Japan", investors: 8900 },
  { countryCode: "CA", countryName: "Canada", investors: 8100 },
  { countryCode: "FR", countryName: "France", investors: 7500 },
  { countryCode: "AU", countryName: "Australia", investors: 6900 },
  { countryCode: "SG", countryName: "Singapore", investors: 6200 },
  { countryCode: "AE", countryName: "United Arab Emirates", investors: 5800 },
  { countryCode: "KR", countryName: "South Korea", investors: 5400 },
  { countryCode: "BR", countryName: "Brazil", investors: 4900 },
  { countryCode: "NL", countryName: "Netherlands", investors: 4300 },
  { countryCode: "CH", countryName: "Switzerland", investors: 3900 },
  { countryCode: "SE", countryName: "Sweden", investors: 3500 },
  { countryCode: "IT", countryName: "Italy", investors: 3100 },
  { countryCode: "ES", countryName: "Spain", investors: 2700 },
  { countryCode: "IL", countryName: "Israel", investors: 2400 },
  { countryCode: "ZA", countryName: "South Africa", investors: 1900 },
] as const;

export const SEED_INVESTORS_TOTAL = 144500;

/**
 * Fallback centroid coordinates [longitude, latitude] for countries, territories,
 * and island city-states (such as Singapore SG, Malta MT, Monaco MC, etc.)
 * that do not have a 110m polygon resolution in Natural Earth world-atlas.
 */
export const FALLBACK_COUNTRY_COORDINATES: Record<string, [number, number]> = {
  AS: [-170.1322, -14.271],
  AD: [1.5218, 42.5063],
  AI: [-63.0686, 18.2206],
  AG: [-61.8468, 17.0608],
  AW: [-69.9683, 12.5211],
  BH: [50.5577, 26.0667],
  BB: [-59.5432, 13.1939],
  BM: [-64.7574, 32.3078],
  BV: [3.4132, -54.4232],
  IO: [71.8765, -6.3432],
  CV: [-23.6052, 16.0022],
  KY: [-81.2546, 19.3133],
  CX: [105.6904, -10.4475],
  CC: [96.871, -12.1642],
  KM: [43.3333, -11.6455],
  CK: [-159.7777, -21.2367],
  DM: [-61.371, 15.415],
  FO: [-6.9118, 61.8926],
  GF: [-53.1258, 3.9339],
  PF: [-149.4068, -17.6797],
  GI: [-5.3536, 36.1408],
  GD: [-61.679, 12.1165],
  GP: [-61.551, 16.265],
  GU: [144.7937, 13.4443],
  HM: [73.5042, -53.0818],
  VA: [12.4534, 41.9029],
  HK: [114.1694, 22.3193],
  KI: [-157.363, 1.8709],
  LI: [9.5209, 47.166],
  MO: [113.5439, 22.1987],
  MV: [73.2207, 3.2028],
  MT: [14.3754, 35.9375],
  MH: [171.1845, 7.1315],
  MQ: [-61.0242, 14.6415],
  MU: [57.5522, -20.3484],
  YT: [45.1662, -12.8275],
  FM: [158.159, 6.8874],
  MC: [7.4246, 43.7384],
  MS: [-62.1874, 16.7425],
  NR: [166.9315, -0.5228],
  NU: [-169.8672, -19.0544],
  NF: [167.9547, -29.0408],
  MP: [145.6739, 15.0979],
  PW: [134.5825, 7.515],
  PN: [-130.1015, -25.0667],
  RE: [55.5364, -21.1151],
  SH: [-5.7089, -15.965],
  KN: [-62.783, 17.3578],
  LC: [-60.9789, 13.9094],
  PM: [-56.2711, 46.8852],
  VC: [-61.2872, 13.2528],
  WS: [-172.1046, -13.759],
  SM: [12.4578, 43.9424],
  ST: [6.6131, 0.1864],
  SC: [55.492, -4.6796],
  SG: [103.8198, 1.3521], // Singapore (in seed data)
  GS: [-36.5879, -54.4296],
  SJ: [15.4745, 78.0649],
  TK: [-171.8484, -9.2002],
  TO: [-175.1982, -21.1789],
  TC: [-71.7979, 21.694],
  TV: [179.1942, -7.1095],
  UM: [-160.0, 0.0],
  VG: [-64.6399, 18.4207],
  VI: [-64.8963, 18.3358],
  WF: [-176.2044, -13.2944],
  AX: [19.9156, 60.1785],
  BQ: [-68.2655, 12.1784],
  CW: [-68.99, 12.1696],
  GG: [-2.5853, 49.4657],
  IM: [-4.5481, 54.2361],
  JE: [-2.1312, 49.2144],
  BL: [-62.8333, 17.9],
  MF: [-63.0501, 18.0708],
  SX: [-63.0548, 18.0425],
  XK: [20.903, 42.6026],
};

/**
 * Converts a numeric ISO 3166-1 ID (string or number from world-atlas geometries)
 * to an ISO 3166-1 alpha-2 uppercase string.
 */
export function numericIdToAlpha2(id: string | number | undefined | null): string | null {
  if (id === undefined || id === null) return null;
  const str = String(id).trim();
  const padded = str.padStart(3, "0");
  const code = countries.numericToAlpha2(padded) || countries.numericToAlpha2(str);
  return code ? code.toUpperCase() : null;
}

/**
 * Resolves a country's location either from its geometry feature in world-atlas
 * or from our fallback coordinates table.
 */
export function getCountryFallbackCoordinates(code: string): [number, number] | null {
  const upper = code.toUpperCase().trim();
  return FALLBACK_COUNTRY_COORDINATES[upper] ?? null;
}

