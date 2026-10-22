import { describe, it, expect } from 'vitest';
import { calculateWeights } from '../src/blend/weight-calculator';
import { blendForecasts } from '../src/blend/forecast-blender';
import { detectExtremes } from '../src/blend/extreme-detector';
import { generateWeatherInsights } from '../src/blend/insights-generator';
import { REGIONS_METADATA, RegionCode, Variable, ForecastRaw, LatestBlendedForecast } from '../src/types';

describe('Algorithm & Blending Engine Unit Tests', () => {
    describe('Weight Calculator (Regularized Inverse-MAE Softmax)', () => {
        it('normalizes weights so their sum is exactly 1.0 for each group', () => {
            const maes = {
                'PUN|24|temp_c|normal|NWP_GFS': 2.1,
                'PUN|24|temp_c|normal|NWP_ECMWF': 1.4,
                'PUN|24|temp_c|normal|AI_GRAPHCAST': 1.8
            };

            const weights = calculateWeights(maes);
            const groupKey = 'PUN|24|temp_c|normal';
            expect(weights[groupKey]).toBeDefined();

            const sum = Object.values(weights[groupKey]).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1.0, 5);
        });

        it('assigns highest weight to the model with lowest MAE (best historical performance)', () => {
            const maes = {
                'PUN|24|rainfall_mm|normal|NWP_GFS': 5.0,     // Worst
                'PUN|24|rainfall_mm|normal|NWP_ECMWF': 2.0,   // Best
                'PUN|24|rainfall_mm|normal|AI_GRAPHCAST': 3.5 // Moderate
            };

            const weights = calculateWeights(maes);
            const groupWeights = weights['PUN|24|rainfall_mm|normal'];
            expect(groupWeights).toBeDefined();
            expect(groupWeights['NWP_ECMWF']).toBeGreaterThan(groupWeights['AI_GRAPHCAST']);
            expect(groupWeights['AI_GRAPHCAST']).toBeGreaterThan(groupWeights['NWP_GFS']);
        });

        it('gracefully handles missing models by applying Laplace shrinkage toward equal baseline', () => {
            // Only 2 models provided instead of 3
            const maes = {
                'MUM|48|wind_kmh|normal|NWP_GFS': 3.2,
                'MUM|48|wind_kmh|normal|NWP_ECMWF': 2.8
            };

            const weights = calculateWeights(maes);
            const groupWeights = weights['MUM|48|wind_kmh|normal'];
            expect(groupWeights).toBeDefined();

            const sum = Object.values(groupWeights).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1.0, 5);
            expect(groupWeights['NWP_ECMWF']).toBeGreaterThan(groupWeights['NWP_GFS']);
        });
    });

    describe('Forecast Blender (Ensemble Spread & Model Agreement)', () => {
        it('calculates blended value within range of individual models with spread & agreement index', () => {
            const baseTime = new Date('2026-10-22T00:00:00Z');

            const forecasts: ForecastRaw[] = [
                {
                    id: 1,
                    model_source: 'NWP_GFS',
                    region_code: 'PUN',
                    issued_at: baseTime.toISOString(),
                    lead_hours: 24,
                    variable: 'temp_c',
                    value: 30.0,
                    weather_regime: 'normal' as any
                },
                {
                    id: 2,
                    model_source: 'NWP_ECMWF',
                    region_code: 'PUN',
                    issued_at: baseTime.toISOString(),
                    lead_hours: 24,
                    variable: 'temp_c',
                    value: 28.0,
                    weather_regime: 'normal' as any
                },
                {
                    id: 3,
                    model_source: 'AI_GRAPHCAST',
                    region_code: 'PUN',
                    issued_at: baseTime.toISOString(),
                    lead_hours: 24,
                    variable: 'temp_c',
                    value: 29.0,
                    weather_regime: 'normal' as any
                }
            ];

            const weights = {
                'PUN|24|temp_c|normal': {
                    'NWP_GFS': 0.25,
                    'NWP_ECMWF': 0.50,
                    'AI_GRAPHCAST': 0.25
                }
            };

            const blended = blendForecasts(forecasts, weights);
            const key = 'PUN|24|temp_c';
            expect(blended[key]).toBeDefined();

            const result = blended[key];
            // Blend: 30*0.25 + 28*0.50 + 29*0.25 = 7.5 + 14.0 + 7.25 = 28.75
            expect(result.value).toBeCloseTo(28.75, 1);
            expect(result.spread).toBeGreaterThan(0);
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.confidence).toBeLessThanOrEqual(1.0);
            expect(result.uncertaintyRange?.min).toBeLessThan(result.value);
            expect(result.uncertaintyRange?.max).toBeGreaterThan(result.value);
            expect(result.models?.['NWP_GFS']).toBe(30.0);
            expect(result.models?.['NWP_ECMWF']).toBe(28.0);
        });

        it('enforces non-negative bounds for precipitation uncertainty intervals', () => {
            const baseTime = new Date('2026-10-22T00:00:00Z');

            const forecasts: ForecastRaw[] = [
                {
                    id: 1,
                    model_source: 'NWP_GFS',
                    region_code: 'NGP',
                    issued_at: baseTime.toISOString(),
                    lead_hours: 24,
                    variable: 'rainfall_mm',
                    value: 0.5,
                    weather_regime: 'normal' as any
                },
                {
                    id: 2,
                    model_source: 'NWP_ECMWF',
                    region_code: 'NGP',
                    issued_at: baseTime.toISOString(),
                    lead_hours: 24,
                    variable: 'rainfall_mm',
                    value: 0.0,
                    weather_regime: 'normal' as any
                }
            ];

            const weights = {
                'NGP|24|rainfall_mm|normal': {
                    'NWP_GFS': 0.5,
                    'NWP_ECMWF': 0.5,
                    'AI_GRAPHCAST': 0.0
                }
            };

            const blended = blendForecasts(forecasts, weights);
            const key = 'NGP|24|rainfall_mm';
            const result = blended[key];
            expect(result).toBeDefined();
            // Lower uncertainty bound must be clamped at 0.0 mm
            expect(result.uncertaintyRange?.min).toBeGreaterThanOrEqual(0);
            expect(result.value).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Extreme Weather Detector (IMD Calibrated Criteria)', () => {
        it('detects heavy rainfall when blended value exceeds 64.5 mm (IMD Threshold)', () => {
            const key = 'MUM|24|rainfall_mm';
            const blendedResults = {
                [key]: {
                    value: 75.0,
                    confidence: 0.72,
                    spread: 8.2,
                    weights: { 'NWP_GFS': 0.3, 'NWP_ECMWF': 0.4, 'AI_GRAPHCAST': 0.3 },
                    models: { 'NWP_GFS': 70, 'NWP_ECMWF': 80, 'AI_GRAPHCAST': 75 },
                    uncertaintyRange: { min: 58.9, max: 91.1 }
                }
            };

            const alerts = detectExtremes('MUM', '2026-10-22T00:00:00Z', blendedResults);
            expect(alerts.length).toBe(1);
            expect(alerts[0].variable).toBe('rainfall_mm');
            expect(alerts[0].severity).toBe('watch');
            expect(alerts[0].threshold).toBe(64.5);
            expect(alerts[0].reason).toContain('IMD threshold');
        });

        it('detects heatwave when temperature exceeds 40.0°C (IMD Threshold)', () => {
            const key = 'NGP|48|temp_c';
            const blendedResults = {
                [key]: {
                    value: 43.5,
                    confidence: 0.88,
                    spread: 1.1,
                    weights: { 'NWP_GFS': 0.33, 'NWP_ECMWF': 0.33, 'AI_GRAPHCAST': 0.34 },
                    models: { 'NWP_GFS': 44, 'NWP_ECMWF': 43, 'AI_GRAPHCAST': 43.5 },
                    uncertaintyRange: { min: 41.3, max: 45.7 }
                }
            };

            const alerts = detectExtremes('NGP', '2026-10-22T00:00:00Z', blendedResults);
            expect(alerts.length).toBe(1);
            expect(alerts[0].variable).toBe('temp_c');
            expect(alerts[0].severity).toBe('warning');
            expect(alerts[0].threshold).toBe(43.0);
            expect(alerts[0].reason).toContain('IMD threshold');
        });

        it('does not generate alerts when conditions are within normal limits', () => {
            const key = 'PUN|24|temp_c';
            const blendedResults = {
                [key]: {
                    value: 26.5,
                    confidence: 0.95,
                    spread: 0.5,
                    weights: { 'NWP_GFS': 0.33, 'NWP_ECMWF': 0.33, 'AI_GRAPHCAST': 0.34 },
                    models: { 'NWP_GFS': 26, 'NWP_ECMWF': 27, 'AI_GRAPHCAST': 26.5 },
                    uncertaintyRange: { min: 25.5, max: 27.5 }
                }
            };

            const alerts = detectExtremes('PUN', '2026-10-22T00:00:00Z', blendedResults);
            expect(alerts.length).toBe(0);
        });
    });

    describe('Weather Insights Generator', () => {
        it('produces structured meteorological insights with verifiable evidence citations', () => {
            const mockForecast: LatestBlendedForecast = {
                region: 'PUN',
                issued_at: '2026-10-22T00:00:00Z',
                extreme_flag: false,
                location: REGIONS_METADATA['PUN'],
                current_observation: {
                    region: 'PUN',
                    observedAt: '2026-10-22T00:00:00Z',
                    temp_c: 28.0,
                    rainfall_mm: 0.0,
                    wind_kmh: 12.0
                },
                forecast: {
                    temp_c: {
                        '24': {
                            value: 29.5,
                            confidence: 0.85,
                            spread: 0.8,
                            weights: { 'NWP_GFS': 0.3, 'NWP_ECMWF': 0.4, 'AI_GRAPHCAST': 0.3 },
                            models: { 'NWP_GFS': 29, 'NWP_ECMWF': 30, 'AI_GRAPHCAST': 29.5 },
                            uncertaintyRange: { min: 27.9, max: 31.1 }
                        }
                    },
                    rainfall_mm: {
                        '24': {
                            value: 18.5,
                            confidence: 0.70,
                            spread: 2.1,
                            weights: { 'NWP_GFS': 0.3, 'NWP_ECMWF': 0.4, 'AI_GRAPHCAST': 0.3 },
                            models: { 'NWP_GFS': 15, 'NWP_ECMWF': 20, 'AI_GRAPHCAST': 19 },
                            uncertaintyRange: { min: 14.4, max: 22.6 }
                        }
                    },
                    wind_kmh: {
                        '24': {
                            value: 15.0,
                            confidence: 0.90,
                            spread: 1.2,
                            weights: { 'NWP_GFS': 0.33, 'NWP_ECMWF': 0.33, 'AI_GRAPHCAST': 0.34 },
                            models: { 'NWP_GFS': 15, 'NWP_ECMWF': 15, 'AI_GRAPHCAST': 15 },
                            uncertaintyRange: { min: 12.6, max: 17.4 }
                        }
                    }
                }
            };

            const insights = generateWeatherInsights(mockForecast);
            expect(insights.length).toBeGreaterThan(0);
            for (const insight of insights) {
                expect(insight.title).toBeDefined();
                expect(insight.summary).toBeDefined();
                expect(insight.supportingData).toBeDefined();
                expect(insight.category).toMatch(/rainfall|temperature|wind|model_consensus/);
            }
        });
    });

    describe('Station Metadata Completeness', () => {
        it('defines all active Maharashtra stations with valid latitude, longitude, and elevationM', () => {
            const requiredStations: RegionCode[] = ['PUN', 'MUM', 'NGP'];
            for (const code of requiredStations) {
                const meta = REGIONS_METADATA[code];
                expect(meta).toBeDefined();
                expect(meta.latitude).toBeGreaterThan(15);
                expect(meta.latitude).toBeLessThan(22);
                expect(meta.longitude).toBeGreaterThan(72);
                expect(meta.longitude).toBeLessThan(82);
                expect(meta.elevationM).toBeGreaterThanOrEqual(0);
                expect(meta.climateZone).toBeDefined();
            }
        });
    });
});
