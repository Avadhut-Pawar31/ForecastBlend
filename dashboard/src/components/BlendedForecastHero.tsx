import { useState } from 'react';
import { LatestBlendedForecast, LeadHours, Variable, VARIABLE_LABELS, VARIABLE_UNITS, ModelSource } from '../types';
import { Droplets, Thermometer, Wind, HelpCircle, Layers, CheckCircle2, ShieldAlert } from 'lucide-react';
import './BlendedForecastHero.css';

interface Props {
  forecast: LatestBlendedForecast | null;
  leadHours: LeadHours;
  loading: boolean;
}

export default function BlendedForecastHero({ forecast, leadHours, loading }: Props) {
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  if (loading || !forecast) {
    return (
      <div className="blended-hero-loading">
        <div className="skeleton-line title" />
        <div className="skeleton-grid" />
      </div>
    );
  }

  const variables: Variable[] = ['rainfall_mm', 'temp_c', 'wind_kmh'];
  const leadKey = leadHours.toString();

  const getVarIcon = (v: Variable) => {
    switch(v) {
      case 'rainfall_mm': return <Droplets size={20} className="icon-rain" />;
      case 'temp_c': return <Thermometer size={20} className="icon-temp" />;
      case 'wind_kmh': return <Wind size={20} className="icon-wind" />;
    }
  };

  return (
    <section className="blended-forecast-hero">
      <div className="hero-section-header">
        <div className="hsh-left">
          <div className="blend-pill">
            <Layers size={13} />
            <span>Optimal Multi-Model Synthesis</span>
          </div>
          <h2 className="section-heading">Operational Consensus Forecast (+{leadHours}h)</h2>
        </div>

        <div className="hsh-right">
          <button 
            className="formula-explainer-btn"
            onClick={() => setShowFormulaModal(!showFormulaModal)}
            title="Inspect Blending Methodology and Weighting Formula"
          >
            <span className="font-mono formula-snippet">w_i ∝ 1/(MAE_i + ε) + λ/M</span>
            <HelpCircle size={14} />
          </button>
        </div>
      </div>

      {/* Formula Explanation Popover */}
      {showFormulaModal && (
        <div className="formula-explanation-box">
          <div className="feb-header">
            <h4>Regularized Inverse-MAE Softmax Weighting Methodology</h4>
            <button className="feb-close-btn" onClick={() => setShowFormulaModal(false)}>×</button>
          </div>
          <p className="feb-desc">
            ForecastBlend combines predictions from NOAA GFS, ECMWF IFS, and DeepMind GraphCast using measured historical Mean Absolute Error (MAE) evaluated over a 14-day rolling verification window.
          </p>
          <div className="feb-formula-card font-mono">
            B(t) = ∑ w_i · F_i(t) &nbsp;&nbsp;|&nbsp;&nbsp; w_i = (1 - λ) · [ (1 / (MAE_i + ε)) / ∑ (1 / (MAE_j + ε)) ] + λ · (1 / M)
          </div>
          <ul className="feb-points">
            <li><strong>Zero Lookahead Bias:</strong> Verification window strictly excludes observations occurring after the forecast issue time.</li>
            <li><strong>Laplace Shrinkage (λ = 0.15):</strong> Protects against sample noise by pulling weights gently toward an equal-weight baseline (1/M).</li>
            <li><strong>Ensemble Spread (σ):</strong> Standard deviation of model predictions quantifies physical atmospheric disagreement.</li>
          </ul>
        </div>
      )}

      {/* Primary Variable Cards Grid */}
      <div className="variable-cards-grid">
        {variables.map(v => {
          const varMap = forecast.forecast?.[v] || {};
          const entry = varMap[leadKey] || Object.values(varMap)[0];
          const val = entry?.value ?? 0;
          const conf = entry?.confidence ?? 0.75;
          const spread = entry?.spread ?? 0;
          const uncert = entry?.uncertaintyRange || { min: val, max: val };
          const weights = entry?.weights || { NWP_GFS: 0.33, NWP_ECMWF: 0.33, AI_GRAPHCAST: 0.34 };
          const models: Record<string, number> = (entry?.models || {}) as Record<string, number>;

          const agreementPct = Math.round(conf * 100);
          const agreementColor = agreementPct >= 80 ? 'high' : (agreementPct >= 65 ? 'medium' : 'low');

          return (
            <div key={v} className={`var-card var-${v}`}>
              <div className="vc-top-row">
                <div className="vc-icon-wrap">{getVarIcon(v)}</div>
                <div className="vc-title-group">
                  <span className="vc-label">{VARIABLE_LABELS[v]}</span>
                  <span className="vc-horizon-tag font-mono">+{leadHours}h Lead</span>
                </div>
                <div className={`vc-agreement-pill ${agreementColor}`} title="Statistical Model Agreement Index">
                  <span>{agreementPct}% Consensus</span>
                </div>
              </div>

              {/* Main Numeric Display */}
              <div className="vc-value-row">
                <span className="vc-main-number font-mono">{val.toFixed(1)}</span>
                <span className="vc-unit">{VARIABLE_UNITS[v]}</span>
              </div>

              {/* 95% Uncertainty Range */}
              <div className="vc-uncertainty-row font-mono">
                <span className="uncert-label">95% Range:</span>
                <span className="uncert-bounds">
                  [{uncert.min.toFixed(1)} – {uncert.max.toFixed(1)} {VARIABLE_UNITS[v]}]
                </span>
                <span className="uncert-spread" title="Ensemble Standard Deviation (Spread)">
                  (±{spread.toFixed(1)})
                </span>
              </div>

              {/* Contributing Model Weights Bar */}
              <div className="vc-weights-section">
                <div className="ws-header">
                  <span className="ws-label">Adaptive Blend Contribution</span>
                  <span className="ws-active-sources font-mono">3 Models</span>
                </div>

                <div className="ws-bar-track">
                  {(['NWP_GFS', 'NWP_ECMWF', 'AI_GRAPHCAST'] as ModelSource[]).map(m => {
                    const wt = weights[m] || 0.33;
                    const pct = (wt * 100).toFixed(0);
                    return (
                      <div 
                        key={m} 
                        className={`ws-bar-segment seg-${m}`} 
                        style={{ width: `${pct}%` }}
                        title={`${m}: ${(wt * 100).toFixed(1)}% weight (Pred: ${(models[m] ?? val).toFixed(1)} ${VARIABLE_UNITS[v]})`}
                      />
                    );
                  })}
                </div>

                {/* Model Value Breakdown Chips */}
                <div className="ws-chips-row font-mono">
                  {(['NWP_GFS', 'NWP_ECMWF', 'AI_GRAPHCAST'] as ModelSource[]).map(m => {
                    const wt = weights[m] || 0.33;
                    const modelVal = models[m] ?? val;
                    const shortName = m === 'NWP_GFS' ? 'GFS' : (m === 'NWP_ECMWF' ? 'ECMWF' : 'GraphCast');
                    return (
                      <div key={m} className={`ws-chip chip-${m}`}>
                        <span className="chip-name">{shortName}</span>
                        <span className="chip-val">{modelVal.toFixed(1)}</span>
                        <span className="chip-wt">({(wt * 100).toFixed(0)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Atmospheric Consensus Summary Note */}
      <div className="consensus-summary-bar">
        <div className="csb-left">
          {forecast.extreme_flag ? (
            <ShieldAlert size={16} className="alert-badge-icon" />
          ) : (
            <CheckCircle2 size={16} className="normal-badge-icon" />
          )}
          <span>
            {forecast.extreme_flag 
              ? 'Multi-model extreme weather conditions flagged within active forecast cycle.' 
              : 'All meteorological variables remain within standard seasonal variance envelopes.'}
          </span>
        </div>
        <div className="csb-right font-mono">
          <span>Optimization Target: Minimized Trailing Root-Mean-Square Error (RMSE)</span>
        </div>
      </div>
    </section>
  );
}
