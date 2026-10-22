import { ForecastRaw, ModelSource, BlendedForecastValue, Variable } from '../types';

/**
 * Domain-specific reference dispersion scale for calculating Model Agreement Index.
 * When ensemble standard deviation equals sigma_ref, agreement drops to exp(-1) ~= 0.37.
 */
const REF_DISPERSION: Record<Variable, number> = {
    rainfall_mm: 8.0, // 8 mm spread
    temp_c: 2.5,      // 2.5 °C spread
    wind_kmh: 6.0     // 6.0 km/h spread
};

export function blendForecasts(
    forecasts: ForecastRaw[], 
    weights: Record<string, Record<ModelSource, number>>
): Record<string, BlendedForecastValue> {
    const groups: Record<string, ForecastRaw[]> = {};

    for (const f of forecasts) {
        const groupKey = `${f.region_code}|${f.lead_hours}|${f.variable}`;
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(f);
    }

    const blended: Record<string, BlendedForecastValue> = {};

    for (const groupKey in groups) {
        const models = groups[groupKey];
        if (models.length === 0) continue;

        const [, , variableStr] = groupKey.split('|');
        const variable = variableStr as Variable;
        const regime = models[0].weather_regime;
        const weightKey = `${groupKey}|${regime}`;
        
        const configuredWeights = weights[weightKey];
        
        // Build active models map and active normalized weights
        const modelValues: Record<string, number> = {};
        const activeWeights: Record<string, number> = {};
        let rawWeightSum = 0;

        for (const m of models) {
            modelValues[m.model_source] = m.value;
            const w = configuredWeights?.[m.model_source] ?? (1 / models.length);
            activeWeights[m.model_source] = w;
            rawWeightSum += w;
        }

        // Re-normalize active weights if some models in group were missing
        const normalizedWeights: Record<ModelSource, number> = {} as any;
        for (const m of models) {
            normalizedWeights[m.model_source] = rawWeightSum > 0 
                ? activeWeights[m.model_source] / rawWeightSum 
                : 1 / models.length;
        }

        // 1. Calculate blended expected value
        let blendedValue = 0;
        for (const m of models) {
            blendedValue += m.value * (normalizedWeights[m.model_source] || 0);
        }

        // Physical bounds clamping
        if (variable === 'rainfall_mm' || variable === 'wind_kmh') {
            blendedValue = Math.max(0, blendedValue);
        }

        // 2. Calculate weighted ensemble spread (variance & standard deviation)
        let weightedVariance = 0;
        for (const m of models) {
            const diff = m.value - blendedValue;
            weightedVariance += (normalizedWeights[m.model_source] || 0) * (diff * diff);
        }
        const spread = Math.sqrt(Math.max(0, weightedVariance));

        // 3. Calculate Model Agreement Index (0.0 to 1.0)
        // High agreement -> models tightly clustered -> index close to 1.0
        const refScale = REF_DISPERSION[variable] || 5.0;
        const agreementIndex = Math.max(0, Math.min(1, Math.exp(-spread / refScale)));

        // 4. Statistical 95% uncertainty interval
        const lowerBound = (variable === 'rainfall_mm' || variable === 'wind_kmh') 
            ? Math.max(0, blendedValue - 1.96 * spread) 
            : blendedValue - 1.96 * spread;
        const upperBound = blendedValue + 1.96 * spread;

        blended[groupKey] = {
            value: blendedValue,
            confidence: Number(agreementIndex.toFixed(3)),
            weights: normalizedWeights,
            models: modelValues as Record<ModelSource, number>,
            spread: Number(spread.toFixed(2)),
            uncertaintyRange: {
                min: Number(lowerBound.toFixed(2)),
                max: Number(upperBound.toFixed(2))
            }
        };
    }

    return blended;
}
