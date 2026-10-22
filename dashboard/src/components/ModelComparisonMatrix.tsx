import { useState } from 'react';
import { 
  LatestBlendedForecast, 
  LeadHours, 
  Variable, 
  VARIABLE_LABELS, 
  VARIABLE_UNITS, 
  ModelSource, 
  MODEL_DESCRIPTIONS, 
  SOURCE_COLORS 
} from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Layers, Eye, EyeOff, Lock } from 'lucide-react';
import './ModelComparisonMatrix.css';

interface Props {
  forecast: LatestBlendedForecast | null;
  leadHours: LeadHours;
}

export default function ModelComparisonMatrix({ forecast, leadHours }: Props) {
  const [selectedVariable, setSelectedVariable] = useState<Variable>('rainfall_mm');
  const [visibleModels, setVisibleModels] = useState<Record<string, boolean>>({
    NWP_GFS: true,
    NWP_ECMWF: true,
    AI_GRAPHCAST: true,
    BLENDED: true
  });

  if (!forecast) return null;

  const variables: Variable[] = ['rainfall_mm', 'temp_c', 'wind_kmh'];
  const leadTimes: LeadHours[] = [24, 48, 72, 96];

  const toggleModel = (model: string) => {
    // Prevent accidental hiding of the primary blended forecast reference series
    if (model === 'BLENDED') return;
    setVisibleModels(prev => ({ ...prev, [model]: !prev[model] }));
  };

  // Build time-series chart data across lead times for selected variable
  const chartData = leadTimes.map(lt => {
    const entry = forecast.forecast?.[selectedVariable]?.[lt.toString()];
    const models: Record<string, number> = (entry?.models || {}) as Record<string, number>;
    const blendedVal = entry?.value ?? 0;

    // Use actual model values or realistic offset when model values match blend
    const gfsVal = models.NWP_GFS ?? blendedVal;
    const ecmwfVal = models.NWP_ECMWF ?? blendedVal;
    const gcVal = models.AI_GRAPHCAST ?? blendedVal;

    return {
      lead: `+${lt}h`,
      NWP_GFS: gfsVal,
      NWP_ECMWF: ecmwfVal,
      AI_GRAPHCAST: gcVal,
      BLENDED: blendedVal
    };
  });

  // Current lead time entry for tabular comparison
  const currentEntry = forecast.forecast?.[selectedVariable]?.[leadHours.toString()] || 
                       Object.values(forecast.forecast?.[selectedVariable] || {})[0];
  const blendVal = currentEntry?.value ?? 0;
  const weights = currentEntry?.weights || { NWP_GFS: 0.33, NWP_ECMWF: 0.33, AI_GRAPHCAST: 0.34 };
  const models: Record<string, number> = (currentEntry?.models || {}) as Record<string, number>;

  const modelsList: ModelSource[] = ['NWP_GFS', 'NWP_ECMWF', 'AI_GRAPHCAST'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-analysis-tooltip font-mono">
          <span className="tooltip-horizon-header">{label} Horizon Forecast</span>
          <div className="tooltip-rows-list">
            {payload.map((entry: any) => {
              const displayName = entry.name === 'BLENDED' ? 'ForecastBlend' : entry.name.replace('NWP_', '');
              return (
                <div key={entry.name} className="tooltip-item-row" style={{ color: entry.color }}>
                  <span className="tooltip-item-name">{displayName}:</span>
                  <strong className="tooltip-item-val">{Number(entry.value).toFixed(1)} {VARIABLE_UNITS[selectedVariable]}</strong>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="forecast-analysis-section">
      {/* Section Header */}
      <div className="analysis-header-row">
        <div className="analysis-title-group">
          <div className="section-tag-pill">
            <Layers size={13} />
            <span>Forecast Analysis</span>
          </div>
          <h2 className="analysis-main-heading">Multi-Model Comparison & Attribution</h2>
        </div>

        {/* Variable Selector Tabs */}
        <div className="analysis-var-tabs">
          {variables.map(v => (
            <button
              key={v}
              className={`analysis-var-btn ${selectedVariable === v ? 'btn-active' : ''}`}
              onClick={() => setSelectedVariable(v)}
            >
              {VARIABLE_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Control & Layer Visibility Bar */}
      <div className="analysis-controls-bar">
        <div className="visibility-toggles-group">
          <span className="vt-label">Forecast Series:</span>
          
          {/* Blend is primary reference */}
          <button
            className="model-toggle-pill pill-blended active-locked"
            title="ForecastBlend is the locked reference series"
          >
            <Lock size={11} className="lock-icon" />
            <span className="dot-indicator dot-blended" />
            <span className="pill-title">ForecastBlend (Consensus)</span>
          </button>

          {/* Secondary Individual Models */}
          {modelsList.map(m => {
            const isVisible = visibleModels[m];
            const shortName = m === 'NWP_GFS' ? 'GFS' : (m === 'NWP_ECMWF' ? 'ECMWF' : 'GraphCast');
            return (
              <button
                key={m}
                className={`model-toggle-pill pill-${m} ${isVisible ? 'is-visible' : 'is-muted'}`}
                onClick={() => toggleModel(m)}
                title={`Toggle ${shortName} visibility on chart`}
              >
                {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                <span className={`dot-indicator dot-${m}`} />
                <span className="pill-title">{shortName}</span>
              </button>
            );
          })}
        </div>

        <div className="chart-horizon-info font-mono">
          <span>Horizon: +24h to +96h · Unit: {VARIABLE_UNITS[selectedVariable]}</span>
        </div>
      </div>

      {/* Large Multi-Model Comparison Chart */}
      <div className="analysis-chart-card">
        <div className="chart-canvas-wrap">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2D42" vertical={false} />
              <XAxis 
                dataKey="lead" 
                stroke="#64748B" 
                tick={{ fill: '#9BAEC6', fontSize: 12, fontFamily: 'JetBrains Mono' }} 
                axisLine={{ stroke: '#2B3A50' }}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748B" 
                tick={{ fill: '#9BAEC6', fontSize: 12, fontFamily: 'JetBrains Mono' }} 
                axisLine={{ stroke: '#2B3A50' }}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Individual Models */}
              {visibleModels.NWP_GFS && (
                <Line 
                  type="monotone" 
                  dataKey="NWP_GFS" 
                  name="NWP_GFS" 
                  stroke={SOURCE_COLORS.NWP_GFS} 
                  strokeWidth={2} 
                  dot={{ r: 3.5, fill: SOURCE_COLORS.NWP_GFS }}
                  strokeDasharray="4 2"
                />
              )}
              {visibleModels.NWP_ECMWF && (
                <Line 
                  type="monotone" 
                  dataKey="NWP_ECMWF" 
                  name="NWP_ECMWF" 
                  stroke={SOURCE_COLORS.NWP_ECMWF} 
                  strokeWidth={2} 
                  dot={{ r: 3.5, fill: SOURCE_COLORS.NWP_ECMWF }}
                  strokeDasharray="4 2"
                />
              )}
              {visibleModels.AI_GRAPHCAST && (
                <Line 
                  type="monotone" 
                  dataKey="AI_GRAPHCAST" 
                  name="AI_GRAPHCAST" 
                  stroke={SOURCE_COLORS.AI_GRAPHCAST} 
                  strokeWidth={2} 
                  dot={{ r: 3.5, fill: SOURCE_COLORS.AI_GRAPHCAST }}
                  strokeDasharray="4 2"
                />
              )}

              {/* Primary Reference Blend Line (Prominent & Thicker) */}
              {visibleModels.BLENDED && (
                <Line 
                  type="monotone" 
                  dataKey="BLENDED" 
                  name="BLENDED" 
                  stroke={SOURCE_COLORS.BLENDED} 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: SOURCE_COLORS.BLENDED, stroke: '#0B1120', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Attribution Table */}
      <div className="analysis-table-card">
        <div className="table-card-header">
          <span className="tch-title">Lead Time +{leadHours}h Attribution Breakdown</span>
          <span className="tch-consensus font-mono">Consensus Blend: {blendVal.toFixed(1)} {VARIABLE_UNITS[selectedVariable]}</span>
        </div>

        <div className="table-scroll-container">
          <table className="attribution-table">
            <thead>
              <tr>
                <th className="th-model">Model Source</th>
                <th className="th-type">Type / Resolution</th>
                <th className="th-pred">Prediction</th>
                <th className="th-weight">Contribution (w_i)</th>
                <th className="th-delta">Delta vs Consensus (Δ)</th>
              </tr>
            </thead>
            <tbody>
              {/* ForecastBlend Baseline Row */}
              <tr className="row-blend-consensus">
                <td className="td-model">
                  <div className="model-name-cell">
                    <span className="dot-indicator dot-blended" />
                    <strong>ForecastBlend</strong>
                  </div>
                </td>
                <td className="td-type">Multi-Model Ensemble Synthesis</td>
                <td className="td-pred font-mono">
                  <strong>{blendVal.toFixed(1)} {VARIABLE_UNITS[selectedVariable]}</strong>
                </td>
                <td className="td-weight font-mono">100%</td>
                <td className="td-delta font-mono">0.0</td>
              </tr>

              {/* Contributing Models Rows */}
              {modelsList.map(m => {
                const desc = MODEL_DESCRIPTIONS[m];
                const pred = models[m] ?? blendVal;
                const wt = weights[m] || 0.33;
                const delta = pred - blendVal;
                const deltaSign = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);

                return (
                  <tr key={m} className="row-model-item">
                    <td className="td-model">
                      <div className="model-name-cell">
                        <span className={`dot-indicator dot-${m}`} />
                        <span>{desc.name}</span>
                        <span className="model-org-tag font-mono">{desc.org}</span>
                      </div>
                    </td>
                    <td className="td-type">{desc.type} · {desc.res}</td>
                    <td className="td-pred font-mono">{pred.toFixed(1)} {VARIABLE_UNITS[selectedVariable]}</td>
                    <td className="td-weight font-mono">
                      <div className="weight-cell-wrap">
                        <div className="weight-cell-bar">
                          <div 
                            className={`wcb-fill fill-${m}`} 
                            style={{ width: `${Math.round(wt * 100)}%` }} 
                          />
                        </div>
                        <span>{(wt * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className={`td-delta font-mono ${delta > 0.05 ? 'delta-high' : (delta < -0.05 ? 'delta-low' : 'delta-even')}`}>
                      {deltaSign}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
