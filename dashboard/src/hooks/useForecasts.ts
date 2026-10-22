import { useState, useEffect, useCallback } from 'react';
import { 
  RegionCode, 
  LeadHours, 
  LatestBlendedForecast, 
  WeightMapEntry, 
  ExtremeAlert, 
  BacktestResult, 
  PipelineExecution,
  LocationMetadata,
  WeatherInsight 
} from '../types';
import { 
  fetchForecast, 
  fetchWeights, 
  fetchAlerts, 
  fetchBacktest, 
  triggerPipeline, 
  fetchLocations, 
  fetchInsights, 
  fetchVerification 
} from '../api/client';

export function useForecasts(region: RegionCode, _leadHours: LeadHours) {
  const [locations, setLocations] = useState<LocationMetadata[]>([]);
  const [forecast, setForecast] = useState<LatestBlendedForecast | null>(null);
  const [weights, setWeights] = useState<WeightMapEntry[]>([]);
  const [alerts, setAlerts] = useState<ExtremeAlert[]>([]);
  const [backtest, setBacktest] = useState<BacktestResult[]>([]);
  const [insights, setInsights] = useState<WeatherInsight[]>([]);
  const [verification, setVerification] = useState<any>(null);
  const [pipeline, setPipeline] = useState<PipelineExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load of locations
  useEffect(() => {
    fetchLocations().then(locs => {
      if (locs && locs.length) setLocations(locs);
    }).catch(console.error);
  }, []);

  const loadRegionData = useCallback(async (r: RegionCode) => {
    setLoading(true);
    setError(null);

    try {
      const [fData, wData, aData, bData, insData, verData] = await Promise.all([
        fetchForecast(r),
        fetchWeights(r),
        fetchAlerts(r),
        fetchBacktest(r),
        fetchInsights(r),
        fetchVerification(r)
      ]);

      setForecast(fData);
      setWeights(wData);
      setAlerts(aData);
      setBacktest(bData);
      setInsights(insData);
      setVerification(verData);
      setLoading(false);
    } catch (err: any) {
      console.error('[useForecasts] Error loading region data:', err);
      setError(err?.message || 'Failed to load meteorological forecast data');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegionData(region);
  }, [region, loadRegionData]);

  const runPipeline = async () => {
    try {
      const exec = await triggerPipeline();
      setPipeline(exec);
      // After pipeline run, refresh data
      setTimeout(() => {
        loadRegionData(region);
      }, 3500);
    } catch (e: any) {
      console.error('[useForecasts] Error triggering pipeline:', e);
    }
  };

  return { 
    locations,
    forecast, 
    weights, 
    alerts, 
    backtest, 
    insights,
    verification,
    pipeline, 
    setPipeline, 
    loading, 
    error,
    runPipeline,
    refetch: () => loadRegionData(region)
  };
}
