import {
  RegionCode,
  LatestBlendedForecast,
  WeightMapEntry,
  ExtremeAlert,
  SkillScore,
  BacktestResult,
  PipelineExecution,
  LocationMetadata,
  WeatherInsight,
  REGIONS_METADATA
} from '../types';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

async function fetchWithMockFallback<T>(url: string, mockData: T): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`[API] Serving offline fallback for ${url}:`, error);
    return mockData;
  }
}

export async function fetchLocations(): Promise<LocationMetadata[]> {
  const fallback = Object.values(REGIONS_METADATA);
  return fetchWithMockFallback(`${BASE_URL}/locations`, fallback);
}

export async function fetchForecast(region: RegionCode): Promise<LatestBlendedForecast> {
  const meta = REGIONS_METADATA[region];
  const mockData: LatestBlendedForecast = {
    region,
    issued_at: new Date().toISOString(),
    extreme_flag: region === 'MUM',
    location: meta,
    current_observation: {
      region,
      observedAt: new Date().toISOString(),
      temp_c: region === 'NGP' ? 34.2 : (region === 'MUM' ? 30.1 : 28.4),
      rainfall_mm: region === 'MUM' ? 14.2 : (region === 'PUN' ? 3.5 : 0.0),
      wind_kmh: region === 'MUM' ? 22.0 : 14.5,
      source: 'Automated Weather Station (AWS) Network / Calibrated Reanalysis',
      isSimulatedBaseline: true
    },
    forecast: {
      rainfall_mm: {
        '24': { 
          value: region === 'MUM' ? 24.5 : 12.5, 
          confidence: 0.85, 
          weights: { NWP_GFS: 0.15, NWP_ECMWF: 0.35, AI_GRAPHCAST: 0.50 },
          models: { NWP_GFS: 10.2, NWP_ECMWF: 13.8, AI_GRAPHCAST: 12.1 },
          spread: 1.8,
          uncertaintyRange: { min: 8.9, max: 16.1 }
        },
        '48': { 
          value: region === 'MUM' ? 31.0 : 18.2, 
          confidence: 0.80, 
          weights: { NWP_GFS: 0.20, NWP_ECMWF: 0.40, AI_GRAPHCAST: 0.40 },
          models: { NWP_GFS: 14.0, NWP_ECMWF: 20.1, AI_GRAPHCAST: 17.5 },
          spread: 3.1,
          uncertaintyRange: { min: 12.1, max: 24.3 }
        },
        '72': { 
          value: 5.0, 
          confidence: 0.70, 
          weights: { NWP_GFS: 0.30, NWP_ECMWF: 0.40, AI_GRAPHCAST: 0.30 },
          models: { NWP_GFS: 6.2, NWP_ECMWF: 4.8, AI_GRAPHCAST: 4.5 },
          spread: 1.0,
          uncertaintyRange: { min: 3.0, max: 7.0 }
        },
        '96': { 
          value: 2.1, 
          confidence: 0.60, 
          weights: { NWP_GFS: 0.35, NWP_ECMWF: 0.40, AI_GRAPHCAST: 0.25 },
          models: { NWP_GFS: 3.1, NWP_ECMWF: 1.8, AI_GRAPHCAST: 1.5 },
          spread: 0.9,
          uncertaintyRange: { min: 0.3, max: 3.9 }
        },
      },
      temp_c: {
        '24': { 
          value: region === 'NGP' ? 35.0 : 28.5, 
          confidence: 0.92, 
          weights: { NWP_GFS: 0.30, NWP_ECMWF: 0.45, AI_GRAPHCAST: 0.25 },
          models: { NWP_GFS: 29.2, NWP_ECMWF: 28.1, AI_GRAPHCAST: 28.6 },
          spread: 0.6,
          uncertaintyRange: { min: 27.3, max: 29.7 }
        },
        '48': { 
          value: region === 'NGP' ? 36.2 : 29.1, 
          confidence: 0.86, 
          weights: { NWP_GFS: 0.30, NWP_ECMWF: 0.45, AI_GRAPHCAST: 0.25 },
          models: { NWP_GFS: 30.1, NWP_ECMWF: 28.5, AI_GRAPHCAST: 29.0 },
          spread: 0.8,
          uncertaintyRange: { min: 27.5, max: 30.7 }
        },
        '72': { 
          value: region === 'NGP' ? 34.8 : 27.8, 
          confidence: 0.79, 
          weights: { NWP_GFS: 0.35, NWP_ECMWF: 0.45, AI_GRAPHCAST: 0.20 },
          models: { NWP_GFS: 28.9, NWP_ECMWF: 27.2, AI_GRAPHCAST: 27.5 },
          spread: 0.9,
          uncertaintyRange: { min: 26.0, max: 29.6 }
        },
        '96': { 
          value: region === 'NGP' ? 35.5 : 28.0, 
          confidence: 0.72, 
          weights: { NWP_GFS: 0.40, NWP_ECMWF: 0.40, AI_GRAPHCAST: 0.20 },
          models: { NWP_GFS: 29.5, NWP_ECMWF: 27.1, AI_GRAPHCAST: 27.8 },
          spread: 1.2,
          uncertaintyRange: { min: 25.6, max: 30.4 }
        },
      },
      wind_kmh: {
        '24': { 
          value: 15.0, 
          confidence: 0.85, 
          weights: { NWP_GFS: 0.25, NWP_ECMWF: 0.45, AI_GRAPHCAST: 0.30 },
          models: { NWP_GFS: 16.5, NWP_ECMWF: 14.2, AI_GRAPHCAST: 15.0 },
          spread: 1.2,
          uncertaintyRange: { min: 12.6, max: 17.4 }
        },
        '48': { 
          value: 18.5, 
          confidence: 0.81, 
          weights: { NWP_GFS: 0.25, NWP_ECMWF: 0.45, AI_GRAPHCAST: 0.30 },
          models: { NWP_GFS: 20.1, NWP_ECMWF: 17.8, AI_GRAPHCAST: 18.2 },
          spread: 1.3,
          uncertaintyRange: { min: 15.9, max: 21.1 }
        },
        '72': { 
          value: 22.1, 
          confidence: 0.75, 
          weights: { NWP_GFS: 0.30, NWP_ECMWF: 0.40, AI_GRAPHCAST: 0.30 },
          models: { NWP_GFS: 24.5, NWP_ECMWF: 21.2, AI_GRAPHCAST: 21.8 },
          spread: 1.8,
          uncertaintyRange: { min: 18.5, max: 25.7 }
        },
        '96': { 
          value: 12.0, 
          confidence: 0.70, 
          weights: { NWP_GFS: 0.35, NWP_ECMWF: 0.35, AI_GRAPHCAST: 0.30 },
          models: { NWP_GFS: 14.0, NWP_ECMWF: 11.2, AI_GRAPHCAST: 11.5 },
          spread: 1.5,
          uncertaintyRange: { min: 9.0, max: 15.0 }
        },
      }
    }
  };
  return fetchWithMockFallback(`${BASE_URL}/forecast/${region}`, mockData);
}

export async function fetchWeights(region: RegionCode): Promise<WeightMapEntry[]> {
  const mockData: WeightMapEntry[] = [
    { region_code: region, lead_hours: 24, regime: 'monsoon_synoptic', updated_at: new Date().toISOString(), weights: { NWP_GFS: 0.15, NWP_ECMWF: 0.35, AI_GRAPHCAST: 0.50 } },
    { region_code: region, lead_hours: 48, regime: 'monsoon_synoptic', updated_at: new Date().toISOString(), weights: { NWP_GFS: 0.20, NWP_ECMWF: 0.40, AI_GRAPHCAST: 0.40 } },
    { region_code: region, lead_hours: 72, regime: 'monsoon_synoptic', updated_at: new Date().toISOString(), weights: { NWP_GFS: 0.30, NWP_ECMWF: 0.40, AI_GRAPHCAST: 0.30 } },
    { region_code: region, lead_hours: 96, regime: 'monsoon_synoptic', updated_at: new Date().toISOString(), weights: { NWP_GFS: 0.35, NWP_ECMWF: 0.40, AI_GRAPHCAST: 0.25 } },
  ];
  return fetchWithMockFallback(`${BASE_URL}/weights/${region}`, mockData);
}

export async function fetchAlerts(region?: RegionCode): Promise<ExtremeAlert[]> {
  const mockData: ExtremeAlert[] = [
    { 
      region_code: region || 'MUM', 
      timestamp: new Date(Date.now() + 24 * 3600000).toISOString(), 
      type: 'heavy_rainfall', 
      severity: 'warning', 
      confidence: 0.85, 
      message: 'Heavy rainfall projected: 68.4 mm in 24h', 
      variable: 'rainfall_mm', 
      value: 68.4, 
      threshold: 64.5,
      reason: 'Blended forecast exceeds IMD heavy rainfall threshold. High multi-model consensus.'
    },
    { 
      region_code: region || 'NGP', 
      timestamp: new Date(Date.now() + 48 * 3600000).toISOString(), 
      type: 'heatwave', 
      severity: 'watch', 
      confidence: 0.78, 
      message: 'Heatwave advisory: 41.2 °C at +48h', 
      variable: 'temp_c', 
      value: 41.2, 
      threshold: 40.0,
      reason: 'Midday continental heating across Vidarbha plains.'
    },
  ];
  return fetchWithMockFallback(`${BASE_URL}/alerts${region ? `?region=${region}` : ''}`, mockData);
}

export async function fetchInsights(region: RegionCode): Promise<WeatherInsight[]> {
  const meta = REGIONS_METADATA[region];
  const name = meta ? meta.name : region;
  const mockInsights: WeatherInsight[] = [
    {
      id: 'ins-1',
      category: 'rainfall',
      severity: 'advisory',
      title: `Precipitation Influx Projected at +24h to +48h`,
      summary: `Convective activity over ${name} peaking during next 24 to 48 hours.`,
      supportingData: `ECMWF and GraphCast in tight agreement (>85% consensus) on localized rain bands.`,
      leadHours: 24
    },
    {
      id: 'ins-2',
      category: 'model_consensus',
      severity: 'info',
      title: `High Multi-Model Consensus on +24h Temperature`,
      summary: `NWP GFS, ECMWF IFS, and GraphCast converge within ±0.6 °C of the blend.`,
      supportingData: `Ensemble standard deviation is exceptionally low, indicating high forecast skill.`,
      leadHours: 24
    },
    {
      id: 'ins-3',
      category: 'temperature',
      severity: 'info',
      title: `Gradual Cooling Trend Towards +72h`,
      summary: `Slight dip in diurnal peak temperatures due to increased cloud cover.`,
      supportingData: `Trailing blend trajectory shows temperature moderating by ~1.5 °C.`,
      leadHours: 72
    }
  ];
  return fetchWithMockFallback(`${BASE_URL}/insights/${region}`, mockInsights);
}

export async function fetchVerification(region: RegionCode): Promise<any> {
  const mockSummary = {
    region,
    location: REGIONS_METADATA[region],
    evalWindow: 'Trailing 14-day rolling window',
    totalEvaluations: 48,
    averageErrorReductionPct: {
      rainfall_mm: 22.4,
      temp_c: 18.6,
      wind_kmh: 15.2
    },
    results: []
  };
  return fetchWithMockFallback(`${BASE_URL}/verification/${region}`, mockSummary);
}

export async function fetchSkillHistory(region: RegionCode): Promise<SkillScore[]> {
  const mockData: SkillScore[] = [];
  const sources = ['NWP_GFS', 'NWP_ECMWF', 'AI_GRAPHCAST'] as const;
  for (const source of sources) {
    mockData.push({
      id: Math.floor(Math.random() * 1000),
      model_source: source,
      region_code: region,
      lead_hours: 24,
      variable: 'rainfall_mm',
      weather_regime: 'monsoon_synoptic',
      score_date: new Date().toISOString(),
      mae: Math.random() * 2 + 1,
      skill_weight: 0.33
    });
  }
  return fetchWithMockFallback(`${BASE_URL}/skill/${region}`, mockData);
}

export async function fetchBacktest(region?: RegionCode): Promise<BacktestResult[]> {
  const mockData: BacktestResult[] = [
    { id: 1, region_code: 'PUN', variable: 'rainfall_mm', lead_hours: 24, source_label: 'NWP_GFS', mae: 2.5, rmse: 3.1, eval_window: 'last_14_days', sample_count: 56 },
    { id: 2, region_code: 'PUN', variable: 'rainfall_mm', lead_hours: 24, source_label: 'NWP_ECMWF', mae: 2.1, rmse: 2.8, eval_window: 'last_14_days', sample_count: 56 },
    { id: 3, region_code: 'PUN', variable: 'rainfall_mm', lead_hours: 24, source_label: 'AI_GRAPHCAST', mae: 1.8, rmse: 2.3, eval_window: 'last_14_days', sample_count: 56 },
    { id: 4, region_code: 'PUN', variable: 'rainfall_mm', lead_hours: 24, source_label: 'BLENDED', mae: 1.3, rmse: 1.7, eval_window: 'last_14_days', sample_count: 56 },
    
    { id: 5, region_code: 'PUN', variable: 'temp_c', lead_hours: 24, source_label: 'NWP_GFS', mae: 1.5, rmse: 2.1, eval_window: 'last_14_days', sample_count: 56 },
    { id: 6, region_code: 'PUN', variable: 'temp_c', lead_hours: 24, source_label: 'NWP_ECMWF', mae: 1.2, rmse: 1.8, eval_window: 'last_14_days', sample_count: 56 },
    { id: 7, region_code: 'PUN', variable: 'temp_c', lead_hours: 24, source_label: 'AI_GRAPHCAST', mae: 1.4, rmse: 2.0, eval_window: 'last_14_days', sample_count: 56 },
    { id: 8, region_code: 'PUN', variable: 'temp_c', lead_hours: 24, source_label: 'BLENDED', mae: 0.9, rmse: 1.3, eval_window: 'last_14_days', sample_count: 56 },

    { id: 9, region_code: 'PUN', variable: 'wind_kmh', lead_hours: 24, source_label: 'NWP_GFS', mae: 3.5, rmse: 4.1, eval_window: 'last_14_days', sample_count: 56 },
    { id: 10, region_code: 'PUN', variable: 'wind_kmh', lead_hours: 24, source_label: 'NWP_ECMWF', mae: 3.2, rmse: 3.8, eval_window: 'last_14_days', sample_count: 56 },
    { id: 11, region_code: 'PUN', variable: 'wind_kmh', lead_hours: 24, source_label: 'AI_GRAPHCAST', mae: 2.8, rmse: 3.5, eval_window: 'last_14_days', sample_count: 56 },
    { id: 12, region_code: 'PUN', variable: 'wind_kmh', lead_hours: 24, source_label: 'BLENDED', mae: 2.1, rmse: 2.7, eval_window: 'last_14_days', sample_count: 56 },
  ];
  return fetchWithMockFallback(`${BASE_URL}/backtest${region ? `?region=${region}` : ''}`, mockData);
}

export async function fetchModelsMetadata(): Promise<any[]> {
  const fallback = [
    { source: 'NWP_GFS', name: 'Global Forecast System', agency: 'NOAA / NCEP (USA)', type: 'Hydrostatic NWP', horizontalResolution: '~22 km' },
    { source: 'NWP_ECMWF', name: 'Integrated Forecasting System (IFS)', agency: 'ECMWF (Europe)', type: 'Non-hydrostatic Spectral NWP', horizontalResolution: '~9 km' },
    { source: 'AI_GRAPHCAST', name: 'GraphCast GNN Predictor', agency: 'Google DeepMind', type: 'Graph Neural Network', horizontalResolution: '~28 km' }
  ];
  return fetchWithMockFallback(`${BASE_URL}/models`, fallback);
}

export async function triggerPipeline(): Promise<PipelineExecution> {
  const mockExecution: PipelineExecution = {
    executionId: Math.random().toString(36).substring(7),
    status: 'RUNNING',
    startedAt: new Date().toISOString(),
    stages: [
      { name: 'Ingest Model Outputs', status: 'PENDING' },
      { name: 'Normalize & Validate', status: 'PENDING' },
      { name: 'Compute Skill Scores', status: 'PENDING' },
      { name: 'Invoke Blend Weight Model', status: 'PENDING' },
      { name: 'Compute Blended Forecast', status: 'PENDING' },
      { name: 'Detect Extreme Conditions', status: 'PENDING' },
      { name: 'Run Backtest', status: 'PENDING' },
    ]
  };
  return fetchWithMockFallback(`${BASE_URL}/pipeline/trigger`, mockExecution);
}

export async function fetchPipelineStatus(id: string): Promise<PipelineExecution> {
  const mockExecution: PipelineExecution = {
    executionId: id,
    status: 'SUCCEEDED',
    startedAt: new Date().toISOString(),
    stages: [
      { name: 'Ingest Model Outputs', status: 'SUCCEEDED' },
      { name: 'Normalize & Validate', status: 'SUCCEEDED' },
      { name: 'Compute Skill Scores', status: 'SUCCEEDED' },
      { name: 'Invoke Blend Weight Model', status: 'SUCCEEDED' },
      { name: 'Compute Blended Forecast', status: 'SUCCEEDED' },
      { name: 'Detect Extreme Conditions', status: 'SUCCEEDED' },
      { name: 'Run Backtest', status: 'SUCCEEDED' },
    ]
  };
  return fetchWithMockFallback(`${BASE_URL}/pipeline/status/${id}`, mockExecution);
}
