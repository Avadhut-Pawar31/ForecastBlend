import { ExtremeAlert, RegionCode, Variable, BlendedForecastValue } from '../types';

/**
 * Evaluates rule-based meteorological risk indicators based on IMD / WMO thresholds.
 * 
 * Note: These are advisory decision-support thresholds derived from multi-model blending,
 * not official civil defense warnings. Official alerts should always be verified with
 * the India Meteorological Department (IMD).
 */
export function detectExtremes(
    region: RegionCode,
    issueTime: string,
    blended: Record<string, BlendedForecastValue>
): ExtremeAlert[] {
    const alerts: ExtremeAlert[] = [];

    // Keys in blended: `region_code|lead_hours|variable`
    for (const key in blended) {
        const [r, leadStr, variableStr] = key.split('|');
        if (r !== region) continue;

        const lead = parseInt(leadStr, 10);
        const variable = variableStr as Variable;
        const result = blended[key];
        const val = result.value;
        const targetDate = new Date(new Date(issueTime).getTime() + lead * 60 * 60 * 1000).toISOString();

        if (variable === 'rainfall_mm') {
            if (val >= 64.5) {
                let severity: 'watch' | 'warning' | 'severe' = 'watch';
                let threshold = 64.5;
                let desc = 'Heavy rainfall';
                
                if (val >= 204.5) {
                    severity = 'severe';
                    threshold = 204.5;
                    desc = 'Extremely heavy rainfall';
                } else if (val >= 115.6) {
                    severity = 'warning';
                    threshold = 115.6;
                    desc = 'Very heavy rainfall';
                }

                alerts.push({
                    region_code: region,
                    timestamp: targetDate,
                    type: 'heavy_rainfall',
                    severity,
                    confidence: result.confidence,
                    message: `${desc} projected: ${val.toFixed(1)} mm in 24h`,
                    variable,
                    value: Number(val.toFixed(1)),
                    threshold,
                    reason: `Blended forecast (${val.toFixed(1)} mm) exceeds IMD threshold (${threshold} mm). Model agreement: ${(result.confidence * 100).toFixed(0)}%.`
                });
            }
        } else if (variable === 'temp_c') {
            if (val >= 40.0) {
                let severity: 'watch' | 'warning' | 'severe' = 'watch';
                let threshold = 40.0;
                let desc = 'Heatwave advisory';

                if (val >= 45.0) {
                    severity = 'severe';
                    threshold = 45.0;
                    desc = 'Severe heatwave condition';
                } else if (val >= 43.0) {
                    severity = 'warning';
                    threshold = 43.0;
                    desc = 'Heatwave condition';
                }

                alerts.push({
                    region_code: region,
                    timestamp: targetDate,
                    type: 'heatwave',
                    severity,
                    confidence: result.confidence,
                    message: `${desc}: ${val.toFixed(1)} °C at +${lead}h`,
                    variable,
                    value: Number(val.toFixed(1)),
                    threshold,
                    reason: `Blended temperature (${val.toFixed(1)} °C) exceeds IMD threshold (${threshold} °C). Model spread: ±${(result.spread || 0).toFixed(1)} °C.`
                });
            }
        } else if (variable === 'wind_kmh') {
            if (val >= 50.0) {
                let severity: 'watch' | 'warning' | 'severe' = 'watch';
                let threshold = 50.0;
                let desc = 'Gusty wind watch';

                if (val >= 88.0) {
                    severity = 'severe';
                    threshold = 88.0;
                    desc = 'Severe gale condition';
                } else if (val >= 62.0) {
                    severity = 'warning';
                    threshold = 62.0;
                    desc = 'Gale wind warning';
                }

                alerts.push({
                    region_code: region,
                    timestamp: targetDate,
                    type: 'high_wind',
                    severity,
                    confidence: result.confidence,
                    message: `${desc}: ${val.toFixed(1)} km/h sustained wind`,
                    variable,
                    value: Number(val.toFixed(1)),
                    threshold,
                    reason: `Sustained wind speed forecast exceeds IMD threshold (${threshold} km/h).`
                });
            }
        }
    }

    return alerts;
}
