import { WeightMapEntry, LeadHours } from '../types';
import { Sliders, Cpu, Cloud, Brain } from 'lucide-react';
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
        <h2 className="panel-title">
          <Sliders size={18} className="title-icon" />
          Model Weight Distribution (Inverse-MAE Softmax)
        </h2>
        <span className="formula-badge">w_i = (1/MAE_i) / Σ(1/MAE_j)</span>
      </div>

      <div className="weight-legend-grid">
        {sources.map(s => {
          const Icon = s.icon;
          const rawWt = activeEntry?.weights?.[s.key as keyof typeof activeEntry.weights] ?? 0.33;
          const val = (rawWt * 100).toFixed(0);
          return (
            <div key={s.key} className="legend-card" style={{ borderColor: `${s.color}30` }}>
              <div className="legend-top">
                <span className="legend-dot" style={{ backgroundColor: s.color }} />
                <span className="legend-name">{s.label}</span>
                <Icon size={14} className="legend-icon" style={{ color: s.color }} />
              </div>
              <div className="legend-bottom">
                <span className="legend-wt-val" style={{ color: s.color }}>{val}%</span>
                <span className="legend-sub">weight at +{leadHours}h</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="weight-bars-container">
        {leadTimes.map(lt => {
          const entry = safeWeights.find(w => w.lead_hours === lt);
          if (!entry) return null;
          const isSelected = lt === leadHours;

          return (
            <div key={lt} className={`weight-row ${isSelected ? 'active' : ''}`}>
              <div className="wr-lead-col">
                <span className="wr-lead-pill">+{lt}h</span>
              </div>
              <div className="wr-bar-track">
                {sources.map(s => {
                  const rawWt = entry.weights?.[s.key as keyof typeof entry.weights] ?? 0.33;
                  const val = rawWt * 100;
                  return (
                    <div 
                      key={s.key} 
                      className="wr-segment"
                      style={{ width: `${val}%`, backgroundColor: s.color }}
                      title={`${s.label}: ${val.toFixed(1)}%`}
                    >
                      {val >= 16 && (
                        <span className="segment-label">{val.toFixed(0)}%</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
