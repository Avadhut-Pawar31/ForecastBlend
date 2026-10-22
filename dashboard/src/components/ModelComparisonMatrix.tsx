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
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { GitCompare, Eye, EyeOff, Info } from 'lucide-react';
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
    setVisibleModels(prev => ({ ...prev, [model]: !prev[model] }));
  };

  // Build time-series chart data across lead times for selected variable
  const chartData = leadTimes.map(lt => {
    const entry = forecast.forecast?.[selectedVariable]?.[lt.toString()];
    const models: Record<string, number> = (entry?.models || {}) as Record<string, number>;
    const blendedVal = entry?.value ?? 0;

    return {
      lead: `+${lt}h`,
      NWP_GFS: models.NWP_GFS ?? blendedVal,
      NWP_ECMWF: models.NWP_ECMWF ?? blendedVal,
      AI_GRAPHCAST: models.AI_GRAPHCAST ?? blendedVal,
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
        <div className="custom-comparison-tooltip font-mono">
          <span className="tooltip-lead-label">{label} Forecast Horizon</span>
          <div className="tooltip-values-list">
            {payload.map((entry: any) => (
              <div key={entry.name} className="tooltip-entry" style={{ color: entry.color }}>
                <span>{entry.name === 'BLENDED' ? 'ForecastBlend' : entry.name.replace('NWP_', '')}:</span>
                <strong>{entry.value.toFixed(1)} {VARIABLE_UNITS[selectedVariable]}</strong>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="model-comparison-matrix">
      <div className="matrix-header">
        <div className="mh-title-wrap">
          <div className="icon-pill">
            <GitCompare size={14} />
            <span>Multi-Model Disaggregation</span>
          </div>
          <h3 className="matrix-title">Individual Model Comparison vs Adaptive Blend</h3>
        </div>

        {/* Variable Selector Tabs */}
        <div className="var-selector-tabs">
          {variables.map(v => (
            <button
              key={v}
              className={`var-tab ${selectedVariable === v ? 'active' : ''}`}
              onClick={() => setSelectedVariable(v)}
            >
              {VARIABLE_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Visibility Toggles */}
      <div className="model-visibility-row">
        <span className="mvr-label">Active Forecast Layers:</span>
        <div className="mvr-toggles">
          <button
            className={`model-toggle-pill blended ${visibleModels.BLENDED ? 'visible' : 'hidden'}`}
            onClick={() => toggleModel('BLENDED')}
          >
            {visibleModels.BLENDED ? <Eye size={12} /> : <EyeOff size={12} />}
            <span className="pill-dot" style={{ backgroundColor: SOURCE_COLORS.BLENDED }} />
            <span>ForecastBlend (Consensus)</span>
          </button>

          {modelsList.map(m => (
            <button
              key={m}
              className={`model-toggle-pill ${m} ${visibleModels[m] ? 'visible' : 'hidden'}`}
              onClick={() => toggleModel(m)}
            >
              {visibleModels[m] ? <Eye size={12} /> : <EyeOff size={12} />}
              <span className="pill-dot" style={{ backgroundColor: SOURCE_COLORS[m] }} />
              <span>{m.replace('NWP_', '')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart & Table Split View */}
      <div className="matrix-split-grid">
        {/* Left: Recharts Horizon Trajectory LineChart */}
        <div className="chart-container-card">
          <div className="chart-header-row">
            <span className="chart-title">{VARIABLE_LABELS[selectedVariable]} Horizon Trajectory (+24h to +96h)</span>
            <span className="chart-unit font-mono">Unit: {VARIABLE_UNITS[selectedVariable]}</span>
          </div>

          <div className="recharts-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis 
                  dataKey="lead" 
                  stroke="#64748B" 
                  fontSize={11} 
                  fontFamily="'JetBrains Mono', monospace" 
                />
                <YAxis 
                  stroke="#64748B" 
                  fontSize={11} 
                  fontFamily="'JetBrains Mono', monospace" 
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={30}
                  wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
                />

                {visibleModels.BLENDED && (
                  <Line 
                    type="monotone" 
                    dataKey="BLENDED" 
                    name="ForecastBlend"
                    stroke={SOURCE_COLORS.BLENDED} 
                    strokeWidth={3}
                    dot={{ r: 5, fill: SOURCE_COLORS.BLENDED }} 
                  />
                )}
                {visibleModels.NWP_GFS && (
                  <Line 
                    type="monotone" 
                    dataKey="NWP_GFS" 
                    name="NWP GFS"
                    stroke={SOURCE_COLORS.NWP_GFS} 
                    strokeWidth={1.8} 
                    strokeDasharray="4 4"
                    dot={{ r: 3 }} 
                  />
                )}
                {visibleModels.NWP_ECMWF && (
                  <Line 
                    type="monotone" 
                    dataKey="NWP_ECMWF" 
                    name="NWP ECMWF"
                    stroke={SOURCE_COLORS.NWP_ECMWF} 
                    strokeWidth={1.8} 
                    dot={{ r: 3 }} 
                  />
                )}
                {visibleModels.AI_GRAPHCAST && (
                  <Line 
                    type="monotone" 
                    dataKey="AI_GRAPHCAST" 
                    name="AI GraphCast"
                    stroke={SOURCE_COLORS.AI_GRAPHCAST} 
                    strokeWidth={1.8} 
                    strokeDasharray="2 2"
                    dot={{ r: 3 }} 
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Comparative Table at Current Lead Time */}
        <div className="table-container-card">
          <div className="table-header-row">
            <span className="table-title">Lead Time +{leadHours}h Attribution</span>
            <span className="table-sub font-mono">Consensus: {blendVal.toFixed(1)} {VARIABLE_UNITS[selectedVariable]}</span>
          </div>

          <table className="comparison-table">
            <thead>
              <tr>
                <th>Model Source</th>
                <th>Type / Grid</th>
                <th>Pred</th>
                <th>Weight (w_i)</th>
                <th>Delta (Δ)</th>
              </tr>
            </thead>
            <tbody>
              {/* Blended Benchmark Row */}
              <tr className="row-blended font-mono">
                <td>
                  <span className="source-tag" style={{ color: SOURCE_COLORS.BLENDED }}>
                    ForecastBlend
                  </span>
                </td>
                <td className="meta-col">Multi-Model Ensemble</td>
                <td className="pred-col">{blendVal.toFixed(1)}</td>
                <td className="weight-col">100%</td>
                <td className="delta-col">0.0</td>
              </tr>

              {modelsList.map(m => {
                const desc = MODEL_DESCRIPTIONS[m];
                const pred = models[m] ?? blendVal;
                const wt = weights[m] || 0.33;
                const delta = pred - blendVal;
                const deltaFormatted = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);

                return (
                  <tr key={m} className={`row-model font-mono ${visibleModels[m] ? '' : 'faded'}`}>
                    <td>
                      <div className="model-name-cell">
                        <span className="cell-dot" style={{ backgroundColor: SOURCE_COLORS[m] }} />
                        <span className="cell-name">{m.replace('NWP_', '')}</span>
                      </div>
                    </td>
                    <td className="meta-col font-sans">
                      <span className="meta-org">{desc.org}</span>
                      <span className="meta-res font-mono">{desc.res}</span>
                    </td>
                    <td className="pred-col">{pred.toFixed(1)}</td>
                    <td className="weight-col">{(wt * 100).toFixed(0)}%</td>
                    <td className={`delta-col ${delta > 0 ? 'pos' : (delta < 0 ? 'neg' : '')}`}>
                      {deltaFormatted}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="table-caption font-mono">
            <Info size={12} />
            <span>Delta reflects deviation from adaptive multi-model consensus center.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
