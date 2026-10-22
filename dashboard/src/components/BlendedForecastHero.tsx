import { useState } from 'react';
import { LatestBlendedForecast, LeadHours, Variable, VARIABLE_LABELS, VARIABLE_UNITS, ModelSource } from '../types';
import { Droplets, Thermometer, Wind, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';
import './BlendedForecastHero.css';

interface Props {
  forecast: LatestBlendedForecast | null;
  leadHours: LeadHours;
  loading: boolean;
}

export default function BlendedForecastHero({ forecast, leadHours, loading }: Props) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  if (loading || !forecast) {
    return (
      <div className="forecast-summary-loading">
        <div className="summary-skeleton-card" />
        <div className="summary-skeleton-card" />
        <div className="summary-skeleton-card" />
      </div>
    );
  }

  const variables: Variable[] = ['rainfall_mm', 'temp_c', 'wind_kmh'];
  const leadKey = leadHours.toString();

  const getVarIcon = (v: Variable) => {
    switch(v) {
      case 'rainfall_mm': return <Droplets size={18} className="var-icon-rain" />;
      case 'temp_c': return <Thermometer size={18} className="var-icon-temp" />;
      case 'wind_kmh': return <Wind size={18} className="var-icon-wind" />;
    }
  };

  const modelLabels: Record<ModelSource, string> = {
    NWP_GFS: 'GFS',
    NWP_ECMWF: 'ECMWF',
    AI_GRAPHCAST: 'GraphCast'
  };

  return (
    <section className="forecast-summary-section">
      <div className="summary-section-header">
        <div className="ssh-title-group">
          <h2 className="summary-main-title">Consensus Forecast Summary (+{leadHours}h)</h2>
          <span className="summary-sub-caption">Multi-model adaptive ensemble synthesis</span>
        </div>

        <div className="ssh-meta">
          {forecast.extreme_flag ? (
            <div className="extreme-indicator-pill extreme-alert">
              <ShieldAlert size={13} />
              <span>Advisory Threshold Exceeded</span>
            </div>
          ) : (
            <div className="extreme-indicator-pill extreme-normal">
              <CheckCircle2 size={13} />
              <span>Within Normal Variance Bounds</span>
            </div>
          )}
        </div>
      </div>

      {/* 3 Balanced Analytical Cards */}
      <div className="forecast-cards-grid">
        {variables.map(v => {
          const varData = forecast.forecast[v] || {};
          const currentVal = varData[leadKey] || {
            value: 0,
            confidence: 0.8,
            weights: { NWP_GFS: 0.33, NWP_ECMWF: 0.33, AI_GRAPHCAST: 0.34 },
            spread: 0,
            uncertaintyRange: { min: 0, max: 0 }
          };

          const val = currentVal.value;
          const weights = currentVal.weights || { NWP_GFS: 0.33, NWP_ECMWF: 0.33, AI_GRAPHCAST: 0.34 };
          const spread = currentVal.spread ?? 0;
          const uncert = currentVal.uncertaintyRange;
          const hasValidUncertainty = uncert && spread > 0.1 && (uncert.max - uncert.min > 0.1);
          const consensusPct = Math.round((currentVal.confidence || 0.8) * 100);

          return (
            <div key={v} className="forecast-card">
              {/* Card Header */}
              <div className="card-top-bar">
                <div className="card-identity">
                  {getVarIcon(v)}
                  <span className="card-var-title">{VARIABLE_LABELS[v]}</span>
                </div>
                <div className="card-lead-badge font-mono">
                  <span>+{leadHours}h</span>
                </div>
              </div>

              {/* Numerical Focal Point */}
              <div className="card-metric-hero">
                <span className="metric-number font-mono">{val.toFixed(1)}</span>
                <span className="metric-unit">{VARIABLE_UNITS[v]}</span>
              </div>

              {/* Prediction Interval or Agreement Status */}
              <div className="card-uncertainty-status">
                {hasValidUncertainty ? (
                  <div className="valid-interval-row font-mono">
                    <span className="interval-tag">95% Interval:</span>
                    <span className="interval-range">
                      {uncert.min.toFixed(1)} – {uncert.max.toFixed(1)} {VARIABLE_UNITS[v]}
                    </span>
                    <span className="interval-spread">(±{spread.toFixed(1)})</span>
                  </div>
                ) : (
                  <div className="subtle-agreement-row">
                    <span className="agreement-dot" />
                    <span className="agreement-text">
                      High inter-model consensus ({consensusPct}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Compact Contributing Model Weights Bar */}
              <div className="card-weights-wrapper">
                <div className="weights-label-row">
                  <span className="weights-section-title">Model Contribution</span>
                  <div className="weights-info-trigger" 
                    onMouseEnter={() => setActiveTooltip(v)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <Info size={11} className="info-icon" />
                    {activeTooltip === v && (
                      <div className="weights-tooltip">
                        Weights reflect empirical skill (inverse trailing MAE), describing each model's share in the blend.
                      </div>
                    )}
                  </div>
                </div>

                {/* Stacked Horizontal Bar */}
                <div className="model-stacked-track" role="img" aria-label="Contributing model weights distribution">
                  {(['NWP_GFS', 'NWP_ECMWF', 'AI_GRAPHCAST'] as ModelSource[]).map(m => {
                    const wt = weights[m] || 0.33;
                    const pct = Math.round(wt * 100);
                    return (
                      <div
                        key={m}
                        className={`bar-segment seg-${m}`}
                        style={{ width: `${pct}%` }}
                        title={`${modelLabels[m]}: ${pct}% weight in blend`}
                      />
                    );
                  })}
                </div>

                {/* Accessible Clean Legend Text */}
                <div className="weights-legend-row font-mono">
                  {(['NWP_GFS', 'NWP_ECMWF', 'AI_GRAPHCAST'] as ModelSource[]).map(m => {
                    const wt = weights[m] || 0.33;
                    const pct = Math.round(wt * 100);
                    return (
                      <div key={m} className="legend-item">
                        <span className={`legend-dot dot-${m}`} />
                        <span className="legend-name">{modelLabels[m]}</span>
                        <span className="legend-pct">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
