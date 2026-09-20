import { RegionCode, REGION_NAMES, ExtremeAlert } from '../types';
import { CloudRain, Sparkles, MapPin, AlertCircle, ShieldCheck, ChevronRight, Activity, Globe } from 'lucide-react';
import './SidebarPanel.css';

interface Props {
  region: RegionCode;
  setRegion: (r: RegionCode) => void;
  alerts: ExtremeAlert[];
  lastUpdated?: string;
}

export default function SidebarPanel({ region, setRegion, alerts, lastUpdated }: Props) {
  const safeAlerts = alerts || [];
  const activeAlertCount = safeAlerts.length;
  const isExtreme = safeAlerts.some(a => a.severity === 'severe' || a.severity === 'warning');

  return (
    <aside className="sidebar-glass-panel">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-icon">
          <CloudRain size={24} className="logo-svg" />
        </div>
        <div className="brand-title-wrap">
          <h1 className="brand-title">ForecastBlend</h1>
          <span className="brand-badge">
            <Sparkles size={10} /> SIH 26081
          </span>
        </div>
      </div>

      {/* Status Alert Card matching reference image */}
      <div className={`sidebar-status-card ${isExtreme ? 'warning-glow' : 'normal-glow'}`}>
        <div className="status-top-row">
          <span className="status-label-text">Status</span>
          <span className={`status-pill-badge ${isExtreme ? 'severe' : 'normal'}`}>
            <span className="pulse-dot" />
            {isExtreme ? 'Extreme Warning' : 'Normal Conditions'}
          </span>
        </div>

        <div className="status-chart-preview">
          <div className="status-stat-group">
            <span className="status-change-txt">↑ 23.8% Skill Score</span>
            <div className="status-badge-floating">
              {isExtreme ? <AlertCircle size={14} /> : <ShieldCheck size={14} />}
              <span>{isExtreme ? 'Alert Triggered' : 'Optimal Blend'}</span>
            </div>
          </div>
          {/* Bezier sparkline mini chart */}
          <svg className="mini-status-svg" viewBox="0 0 160 45" fill="none">
            <path
              d="M 5 35 Q 40 32, 80 20 T 155 8"
              stroke={isExtreme ? '#F59E0B' : '#3B82F6'}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="155" cy="8" r="4" fill="#FFFFFF" className="sparkline-dot" />
          </svg>
        </div>

        <div className="status-footer-link">
          <span>{activeAlertCount > 0 ? `${activeAlertCount} Severe Alerts Active` : 'Monsoon Synoptic Regime'}</span>
          <ChevronRight size={14} />
        </div>
      </div>

      {/* Region Selector Section */}
      <div className="sidebar-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <Globe size={15} className="section-icon" />
            <span>Select Region</span>
          </div>
          <span className="live-indicator">LIVE</span>
        </div>

        {/* Region Map Graphic Card */}
        <div className="region-graphic-card">
          <div className="globe-ring">
            <MapPin size={22} className="globe-pin" />
          </div>
          <div className="region-name-display">
            <strong>{REGION_NAMES[region]}</strong>
            <span>Maharashtra, India</span>
          </div>
        </div>

        {/* Region Selector Pills */}
        <div className="region-pill-list">
          {(Object.keys(REGION_NAMES) as RegionCode[]).map(code => (
            <button
              key={code}
              className={`region-select-pill ${region === code ? 'active' : ''}`}
              onClick={() => setRegion(code)}
            >
              <span className="pill-dot" />
              <span className="pill-text">{REGION_NAMES[code]}</span>
              <span className="pill-code">{code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live System Info */}
      <div className="sidebar-system-footer">
        <div className="system-live-badge">
          <Activity size={13} className="activity-icon" />
          <span>Inverse-MAE Engine Active</span>
        </div>
        {lastUpdated && (
          <span className="system-update-time">
            Last Synced: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </aside>
  );
}
