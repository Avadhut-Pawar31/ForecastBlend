import fs from 'fs';
import path from 'path';
import { 
  ForecastRaw, 
  ObservationTruth, 
  RegionCode, 
  ModelSource, 
  Variable, 
  LatestBlendedForecast, 
  WeightMapEntry, 
  ExtremeAlert, 
  SkillScore, 
  BacktestResult,
  WeatherInsight,
  LocationMetadata,
  REGIONS_METADATA 
} from '../types';
import { runBlendPipeline } from '../blend/index';
import { generateWeatherInsights } from '../blend/insights-generator';
import { generateData, generateDataInMemory } from './generator';

class Store {
  forecasts: ForecastRaw[] = [];
  observations: ObservationTruth[] = [];
  
  latestBlendedForecasts: Record<string, LatestBlendedForecast | null> = { PUN: null, MUM: null, NGP: null };
  weightMaps: Record<string, WeightMapEntry[]> = { PUN: [], MUM: [], NGP: [] };
  alerts: ExtremeAlert[] = [];
  skillHistory: SkillScore[] = [];
  backtestResults: BacktestResult[] = [];

  load() {
    try {
      const outDir = path.join(__dirname, '../../generated-data');
      if (fs.existsSync(path.join(outDir, 'forecast_raw.json')) && fs.existsSync(path.join(outDir, 'observation_truth.json'))) {
        this.forecasts = JSON.parse(fs.readFileSync(path.join(outDir, 'forecast_raw.json'), 'utf8'));
        this.observations = JSON.parse(fs.readFileSync(path.join(outDir, 'observation_truth.json'), 'utf8'));
        return;
      }
    } catch {
      // Filesystem access not available or read-only, proceed with memory generator
    }
    const data = generateDataInMemory();
    this.forecasts = data.forecasts;
    this.observations = data.observations;
  }

  getForecasts(region?: RegionCode, source?: ModelSource, variable?: Variable) {
    let result = this.forecasts;
    if (region) result = result.filter(f => f.region_code === region);
    if (source) result = result.filter(f => f.model_source === source);
    if (variable) result = result.filter(f => f.variable === variable);
    return result;
  }

  getObservations(region?: RegionCode, variable?: Variable) {
    let result = this.observations;
    if (region) result = result.filter(o => o.region_code === region);
    if (variable) result = result.filter(o => o.variable === variable);
    return result;
  }

  getLatestBlended(region: RegionCode) {
    return this.latestBlendedForecasts[region];
  }

  getWeights(region: RegionCode) {
    return this.weightMaps[region] || [];
  }

  getAlerts(region?: RegionCode) {
    if (region) return this.alerts.filter(a => a.region_code === region);
    return this.alerts;
  }

  getSkillHistory(region: RegionCode) {
    return this.skillHistory.filter(s => s.region_code === region);
  }

  getBacktestResults(region?: RegionCode) {
    if (region) return this.backtestResults.filter(b => b.region_code === region);
    return this.backtestResults;
  }

  getWeatherInsights(region: RegionCode): WeatherInsight[] {
    const f = this.getLatestBlended(region);
    if (!f) return [];
    return generateWeatherInsights(f);
  }

  getLocationMetadata(region: RegionCode): LocationMetadata {
    return REGIONS_METADATA[region];
  }

  getAllLocations(): LocationMetadata[] {
    return Object.values(REGIONS_METADATA);
  }

  getVerificationSummary(region: RegionCode) {
    const regionResults = this.getBacktestResults(region);
    const variables: Variable[] = ['rainfall_mm', 'temp_c', 'wind_kmh'];
    const reductionMap: Record<string, number> = {};

    variables.forEach(v => {
      const vResults = regionResults.filter(r => r.variable === v);
      const blendedRes = vResults.filter(r => r.source_label === 'BLENDED');
      const individualRes = vResults.filter(r => r.source_label !== 'BLENDED');

      if (blendedRes.length && individualRes.length) {
        const meanBlendedMae = blendedRes.reduce((s, r) => s + r.mae, 0) / blendedRes.length;
        const meanIndivMae = individualRes.reduce((s, r) => s + r.mae, 0) / individualRes.length;
        const reductionPct = meanIndivMae > 0 ? ((meanIndivMae - meanBlendedMae) / meanIndivMae) * 100 : 0;
        reductionMap[v] = Number(reductionPct.toFixed(1));
      } else {
        reductionMap[v] = 0;
      }
    });

    return {
      region,
      location: REGIONS_METADATA[region],
      evalWindow: 'Trailing 14-day rolling window',
      totalEvaluations: regionResults.length,
      averageErrorReductionPct: reductionMap,
      results: regionResults
    };
  }

  runPipeline() {
    const results = runBlendPipeline(this.forecasts, this.observations);
    this.latestBlendedForecasts = results.latestBlendedForecasts;
    this.weightMaps = results.weightMaps;
    this.alerts = results.alerts;
    this.skillHistory = results.skillHistory;
    this.backtestResults = results.backtestResults;
    return { executionId: Date.now().toString(), status: 'completed' };
  }
}

export const store = new Store();
