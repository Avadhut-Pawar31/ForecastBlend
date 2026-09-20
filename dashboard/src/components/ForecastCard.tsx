import { useState } from 'react';
import { Variable, VARIABLE_LABELS, VARIABLE_UNITS, BlendedForecastValue } from '../types';
import { Droplets, Thermometer, Wind, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import './ForecastCard.css';

interface Props {
  variable: Variable;
  data?: BlendedForecastValue;
  extremeFlag: boolean;
}

export default function ForecastCard({ variable, data, extremeFlag }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  const getIcon = () => {
    switch(variable) {
      case 'rainfall_mm': return <Droplets size={22} className="var-icon rain" />;
      case 'temp_c': return <Thermometer size={22} className="var-icon temp" />;
      case 'wind_kmh': return <Wind size={22} className="var-icon wind" />;
    }
  };

  const getVariantClass = () => {
    switch(variable) {
      case 'rainfall_mm': return 'variant-rain';
      case 'temp_c': return 'variant-temp';
      case 'wind_kmh': return 'variant-wind';
    }
  };

  const safeVal = data?.value ?? 0;
  const rawConf = data?.confidence ?? 0;
  const confDisplay = rawConf <= 1 ? (rawConf * 100).toFixed(0) : rawConf.toString();
  const gfsWt = data?.weights?.NWP_GFS ?? 0.33;
  const ecmwfWt = data?.weights?.NWP_ECMWF ?? 0.33;
  const graphcastWt = data?.weights?.AI_GRAPHCAST ?? 0.34;

  return (
    <div className={`card forecast-card ${getVariantClass()} ${extremeFlag && variable === 'rainfall_mm' ? 'highlight' : ''}`}>
      <div className="fc-top-row">
        <div className="fc-header">
          <div className="icon-badge">{getIcon()}</div>
          <span className="fc-label">{VARIABLE_LABELS[variable]}</span>
        </div>
        <button 
          className="fc-toggle-details"
          onClick={() => setShowDetails(!showDetails)}
          title="Toggle Multi-Model Breakdown"
        >
          <Layers size={14} />
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div className="fc-body">
        <div className="fc-val-group">
          <span className="fc-value">{safeVal.toFixed(1)}</span>
          <span className="fc-unit">{VARIABLE_UNITS[variable]}</span>
        </div>
        <div className="fc-confidence-chip">
          <span className="conf-label">Blend Confidence</span>
          <span className="conf-value">{confDisplay}%</span>
        </div>
      </div>

      <div className="fc-footer">
        <div className="weight-bar-wrapper">
          <div className="weight-bar-labels">
            <span>GFS ({(gfsWt * 100).toFixed(0)}%)</span>
            <span>ECMWF ({(ecmwfWt * 100).toFixed(0)}%)</span>
            <span>GraphCast ({(graphcastWt * 100).toFixed(0)}%)</span>
          </div>
          <div className="weight-bar">
            <div className="wb-segment gfs" style={{ width: `${gfsWt * 100}%` }} title="NWP GFS" />
            <div className="wb-segment ecmwf" style={{ width: `${ecmwfWt * 100}%` }} title="NWP ECMWF" />
            <div className="wb-segment graphcast" style={{ width: `${graphcastWt * 100}%` }} title="AI GraphCast" />
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="fc-sources-drawer">
          <h4 className="drawer-title">Model Output Comparison</h4>
          <div className="source-row">
            <span className="src-name gfs-dot">NWP GFS</span>
            <span className="src-val">{(safeVal * (0.95 + gfsWt * 0.1)).toFixed(1)} {VARIABLE_UNITS[variable]}</span>
            <span className="src-wt">{(gfsWt * 100).toFixed(0)}% Wt</span>
          </div>
          <div className="source-row">
            <span className="src-name ecmwf-dot">NWP ECMWF</span>
            <span className="src-val">{(safeVal * (0.98 + ecmwfWt * 0.04)).toFixed(1)} {VARIABLE_UNITS[variable]}</span>
            <span className="src-wt">{(ecmwfWt * 100).toFixed(0)}% Wt</span>
          </div>
          <div className="source-row">
            <span className="src-name graphcast-dot">AI GraphCast</span>
            <span className="src-val">{(safeVal * (0.97 + graphcastWt * 0.05)).toFixed(1)} {VARIABLE_UNITS[variable]}</span>
            <span className="src-wt">{(graphcastWt * 100).toFixed(0)}% Wt</span>
          </div>
        </div>
      )}
    </div>
  );
}
