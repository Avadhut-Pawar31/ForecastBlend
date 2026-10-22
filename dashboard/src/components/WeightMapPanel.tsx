import { WeightMapEntry, LeadHours } from '../types';
import { Sliders, Cpu, Cloud, Brain, Info } from 'lucide-react';
import './WeightMapPanel.css';

interface Props {
  weights: WeightMapEntry[];
  leadHours: LeadHours;
}

export default function WeightMapPanel({ weights, leadHours }: Props) {
  const sources = [
    { key: 'NWP_GFS', label: 'NWP GFS', icon: Cloud, color: 'var(--color-gfs)' },
    { key: 'NWP_ECMWF', label: 'NWP ECMWF', icon: Cpu, color: 'var(--color-ecmwf)' },
    { key: 'AI_GRAPHCAST', label: 'AI GraphCast', icon: Brain, color: 'var(--color-graphcast)' },
  ];

  const leadTimes: LeadHours[] = [24, 48, 72, 96];
  const safeWeights = weights || [];
  const activeEntry = safeWeights.find(w => w.lead_hours === leadHours);

  return (
    <div className="card weight-panel">
      <div className="panel-header-row">
        <div className="phr-left">
          <Sliders size={16} className="title-icon" />
          <h3 className="panel-title">Adaptive Weight Distribution by Horizon</h3>
        </div>
        <span className="formula-badge font-mono">w_i ∝ 1/(MAE_i + ε)</span>
      </div>

      <div className="weight-legend-grid">
        {sources.map(s => {
          const Icon = s.icon;
          const rawWt = activeEntry?.weights?.[s.key as keyof typeof activeEntry.weights] ?? 0.33;
          const val = (rawWt * 100).toFixed(0);
          return (
            <div key={s.key} className="legend-card" style={{ borderColor: `${s.color}35` }}>
              <div className="legend-top">
                <span className="legend-dot" style={{ backgroundColor: s.color }} />
                <span className="legend-name">{s.label}</span>
                <Icon size={13} className="legend-icon" style={{ color: s.color }} />
              </div>
              <div className="legend-bottom font-mono">
                <span className="legend-wt-val" style={{ color: s.color }}>{val}%</span>
                <span className="legend-sub">at +{leadHours}h</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="weight-bars-container font-mono">
        {leadTimes.map(lt => {
          const entry = safeWeights.find(w => w.lead_hours === lt);
          if (!entry) return null;
          const isSelected = lt === leadHours;

          const gfs = (entry.weights?.NWP_GFS ?? 0.33) * 100;
          const ecmwf = (entry.weights?.NWP_ECMWF ?? 0.33) * 100;
          const graphcast = (entry.weights?.AI_GRAPHCAST ?? 0.34) * 100;

          return (
            <div key={lt} className={`weight-row ${isSelected ? 'active' : ''}`}>
              <div className="wr-lead-col">
                <span className="wr-lead-tag">+{lt}h</span>
              </div>

              <div className="wr-bar-track">
                <div 
                  className="wr-bar-fill gfs" 
                  style={{ width: `${gfs}%` }}
                  title={`GFS: ${gfs.toFixed(1)}%`}
                />
                <div 
                  className="wr-bar-fill ecmwf" 
                  style={{ width: `${ecmwf}%` }}
                  title={`ECMWF: ${ecmwf.toFixed(1)}%`}
                />
                <div 
                  className="wr-bar-fill graphcast" 
                  style={{ width: `${graphcast}%` }}
                  title={`GraphCast: ${graphcast.toFixed(1)}%`}
                />
              </div>

              <div className="wr-values-col">
                <span className="wv-gfs" style={{ color: 'var(--color-gfs)' }}>{gfs.toFixed(0)}%</span>
                <span className="wv-ecmwf" style={{ color: 'var(--color-ecmwf)' }}>{ecmwf.toFixed(0)}%</span>
                <span className="wv-graphcast" style={{ color: 'var(--color-graphcast)' }}>{graphcast.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="wp-footer font-mono">
        <Info size={12} />
        <span>GraphCast weights dominant at +24h; ECMWF and GFS gain weight at +72h to +96h.</span>
      </div>
    </div>
  );
}
