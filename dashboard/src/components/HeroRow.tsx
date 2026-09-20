import { LatestBlendedForecast, LeadHours } from '../types';
import ForecastCard from './ForecastCard';
import { AlertCircle, ShieldCheck, Clock } from 'lucide-react';
import './HeroRow.css';

interface Props {
  forecast: LatestBlendedForecast | null;
  leadHours: LeadHours;
  setLeadHours: (l: LeadHours) => void;
  loading: boolean;
}

export default function HeroRow({ forecast, leadHours, setLeadHours, loading }: Props) {
  const leadOptions: LeadHours[] = [24, 48, 72, 96];

  if (loading || !forecast) {
    return (
      <div className="hero-row-loading">
        <div className="skeleton-loader" />
        <span>Loading Forecast Blend Data...</span>
      </div>
    );
  }

  const getVarData = (varName: 'rainfall_mm' | 'temp_c' | 'wind_kmh') => {
    const varMap = forecast.forecast?.[varName];
    if (!varMap) return undefined;
    return varMap[leadHours.toString()] || Object.values(varMap)[0] || undefined;
  };

  const rainData = getVarData('rainfall_mm');
  const tempData = getVarData('temp_c');
  const windData = getVarData('wind_kmh');

  return (
    <div className="hero-row-container">
      <div className="hero-top-controls">
        <div className="hero-heading">
          <Clock size={16} className="clock-icon" />
          <span>Forecast Horizon</span>
        </div>
        <div className="lead-time-toggle">
          {leadOptions.map(l => (
            <button 
              key={l}
              className={`lead-btn ${leadHours === l ? 'active' : ''}`}
              onClick={() => setLeadHours(l)}
            >
              +{l}h Forecast
            </button>
          ))}
        </div>
      </div>

      <div className="hero-grid">
        <ForecastCard variable="rainfall_mm" data={rainData} extremeFlag={forecast.extreme_flag} />
        <ForecastCard variable="temp_c" data={tempData} extremeFlag={false} />
        <ForecastCard variable="wind_kmh" data={windData} extremeFlag={false} />
        
        <div className={`card extreme-status-card ${forecast.extreme_flag ? 'extreme' : 'normal'}`}>
          <div className="status-card-header">
            <span className="status-title">Extreme Weather Status</span>
            {forecast.extreme_flag ? (
              <AlertCircle size={22} className="alert-icon-pulse" />
            ) : (
              <ShieldCheck size={22} className="shield-icon" />
            )}
          </div>

          <div className="status-card-body">
            <div className={`status-indicator-badge ${forecast.extreme_flag ? 'active-alert' : 'all-clear'}`}>
              <span className="pulse-dot" />
              <span className="status-label">{forecast.extreme_flag ? 'ACTIVE ALERTS' : 'NORMAL CONDITIONS'}</span>
            </div>
            <p className="status-desc">
              {forecast.extreme_flag 
                ? 'Monsoon synoptic convective activity detected above threshold' 
                : 'All weather metrics within regional safety parameters'}
            </p>
          </div>

          <div className="status-card-footer">
            <span className="regime-tag">Weather Regime: Monsoon Synoptic</span>
          </div>
        </div>
      </div>
    </div>
  );
}
