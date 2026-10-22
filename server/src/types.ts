export type ModelSource = 'NWP_GFS' | 'NWP_ECMWF' | 'AI_GRAPHCAST';
export type RegionCode = 'PUN' | 'MUM' | 'NGP';
export type Variable = 'rainfall_mm' | 'temp_c' | 'wind_kmh';
export type WeatherRegime = 'convective' | 'monsoon_synoptic' | 'clear' | 'western_disturbance';
export type LeadHours = 24 | 48 | 72 | 96;
export type ExtremeType = 'heavy_rainfall' | 'heatwave' | 'high_wind';

export interface LocationMetadata {
  code: RegionCode;
  name: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  elevationM: number;
  climateZone: string;
  description: string;
}

export interface CurrentObservation {
  region: RegionCode;
  observedAt: string;
  temp_c: number;
  rainfall_mm: number;
  wind_kmh: number;
  source: string;
  isSimulatedBaseline: boolean;
}

export interface ForecastRaw {
  id: number;
  model_source: ModelSource;
  region_code: RegionCode;
  issued_at: string; // ISO timestamp
  lead_hours: LeadHours;
  variable: Variable;
  value: number;
  weather_regime: WeatherRegime;
}

export interface ObservationTruth {
  id: number;
  region_code: RegionCode;
  observed_at: string;
  variable: Variable;
  value: number;
}

export interface SkillScore {
  id: number;
  model_source: ModelSource;
  region_code: RegionCode;
  lead_hours: LeadHours;
  variable: Variable;
  weather_regime: WeatherRegime;
  score_date: string;
  mae: number;
  skill_weight: number;
}

export interface BacktestResult {
  id: number;
  region_code: RegionCode;
  variable: Variable;
  lead_hours: LeadHours;
  source_label: ModelSource | 'BLENDED';
  mae: number;
  rmse: number;
  eval_window: string;
  sample_count?: number;
}

export interface BlendedForecastValue {
  value: number;
  confidence: number; // Agreement index between models (0.0 to 1.0)
  weights: Record<ModelSource, number>;
  models?: Record<ModelSource, number>; // Individual model forecasts
  spread?: number; // Standard deviation across individual models
  uncertaintyRange?: { min: number; max: number };
}

export interface LatestBlendedForecast {
  region: RegionCode;
  issued_at: string;
  forecast: Record<Variable, Record<string, BlendedForecastValue>>;
  extreme_flag: boolean;
  current_observation?: CurrentObservation;
  location?: LocationMetadata;
}

export interface WeightMapEntry {
  region_code: RegionCode;
  lead_hours: LeadHours;
  regime: WeatherRegime;
  weights: Record<ModelSource, number>;
  updated_at: string;
}

export interface ExtremeAlert {
  region_code: RegionCode;
  timestamp: string;
  type: ExtremeType;
  severity: 'watch' | 'warning' | 'severe';
  confidence: number;
  message: string;
  variable: Variable;
  value: number;
  threshold: number;
  reason?: string;
}

export interface WeatherInsight {
  id: string;
  category: 'rainfall' | 'temperature' | 'wind' | 'model_consensus';
  severity: 'info' | 'advisory' | 'alert';
  title: string;
  summary: string;
  supportingData: string;
  leadHours: LeadHours;
}

export interface PipelineExecution {
  executionId: string;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  startedAt: string;
  stages: Array<{
    name: string;
    status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
    startedAt?: string;
    completedAt?: string;
  }>;
}

export const REGIONS_METADATA: Record<RegionCode, LocationMetadata> = {
  PUN: {
    code: 'PUN',
    name: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    latitude: 18.5204,
    longitude: 73.8567,
    elevationM: 560,
    climateZone: 'Semi-arid / Western Ghats Rain Shadow',
    description: 'Deccan plateau urban hub with orographic rain shadow regime'
  },
  MUM: {
    code: 'MUM',
    name: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    latitude: 19.0760,
    longitude: 72.8777,
    elevationM: 14,
    climateZone: 'Tropical Wet & Dry / Coastal Maritime',
    description: 'Coastal megacity subject to heavy Arabian Sea convective bursts'
  },
  NGP: {
    code: 'NGP',
    name: 'Nagpur',
    state: 'Maharashtra',
    country: 'India',
    latitude: 21.1458,
    longitude: 79.0882,
    elevationM: 310,
    climateZone: 'Tropical Wet & Dry / Central Continental',
    description: 'Central India inland plateau with high summer convective potential'
  }
};
