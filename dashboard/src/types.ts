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

export interface BlendedForecastValue {
  value: number;
  confidence: number;
  weights: Record<ModelSource, number>;
  models?: Record<ModelSource, number>;
  spread?: number;
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
  regime: WeatherRegime | string;
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

export interface SkillScore {
  id: number;
  model_source: ModelSource;
  region_code: RegionCode;
  lead_hours: LeadHours;
  variable: Variable;
  weather_regime: string;
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

export const REGION_NAMES: Record<RegionCode, string> = {
  PUN: 'Pune',
  MUM: 'Mumbai',
  NGP: 'Nagpur',
};

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

export const VARIABLE_LABELS: Record<Variable, string> = {
  rainfall_mm: 'Precipitation',
  temp_c: 'Temperature',
  wind_kmh: 'Wind Speed',
};

export const VARIABLE_UNITS: Record<Variable, string> = {
  rainfall_mm: 'mm',
  temp_c: '°C',
  wind_kmh: 'km/h',
};

export const MODEL_DESCRIPTIONS: Record<ModelSource, { name: string; org: string; type: string; res: string }> = {
  NWP_GFS: {
    name: 'Global Forecast System',
    org: 'NOAA / NCEP (USA)',
    type: 'Hydrostatic Numerical Weather Prediction',
    res: '~22 km (0.25°)'
  },
  NWP_ECMWF: {
    name: 'Integrated Forecasting System (IFS)',
    org: 'ECMWF (Europe)',
    type: 'Non-hydrostatic NWP Global Model',
    res: '~9 km (0.1°)'
  },
  AI_GRAPHCAST: {
    name: 'GraphCast GNN Model',
    org: 'Google DeepMind',
    type: 'Autoregressive Graph Neural Network',
    res: '~28 km (0.25°)'
  }
};

export const SOURCE_COLORS: Record<ModelSource | 'BLENDED', string> = {
  NWP_GFS: '#38BDF8', // Cyan
  NWP_ECMWF: '#34D399', // Emerald
  AI_GRAPHCAST: '#818CF8', // Indigo
  BLENDED: '#F59E0B', // Amber
};

export const SEVERITY_COLORS = {
  watch: '#F59E0B',
  warning: '#F97316',
  severe: '#EF4444',
};
