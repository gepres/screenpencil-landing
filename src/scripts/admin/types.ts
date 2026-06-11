/* Tipos de la API de analítica que consume el panel /admin. */
export interface Totals { pageviews: number; visits: number }
export interface Bar { label: string; views: number }
export interface Provider {
  totals: Totals;
  topPages: { path: string; views: number }[];
  countries: { code?: string; name?: string; views: number }[];
  referrers: { host: string; views: number }[];
}
export interface Summary {
  period: string; range: { start: string; end: string }; updatedAt: string;
  partial: boolean; goatcounter: Provider | null; cloudflare: Provider | null;
}
export interface EventItem { name: string; count: number }
export interface Events { events: EventItem[]; partial: boolean }
export interface SeriesPoint { date: string; views: number; visits?: number; hourly?: number[] }
export interface Timeseries { goatcounter: SeriesPoint[] | null; cloudflare: SeriesPoint[] | null; partial: boolean }
export interface DeviceRow { name: string; count: number }
export interface Devices { browsers: DeviceRow[]; systems: DeviceRow[]; sizes: DeviceRow[]; partial: boolean }
export interface VitalMetric { p50: number; p75: number }
export interface Vitals { fcp: VitalMetric | null; loadTime: VitalMetric | null; partial: boolean }
export interface EventSeries { name: string; total: number; series: { date: string; count: number }[] }
export interface ActionSeries { events: EventSeries[]; partial: boolean }

/* GeoJSON (mapa mundial). */
export interface GeoFeature { properties?: { name?: string }; geometry?: { type?: string; coordinates?: unknown } }
export interface GeoJson { features?: GeoFeature[] }
