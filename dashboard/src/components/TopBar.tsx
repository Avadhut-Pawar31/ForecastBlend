import { RegionCode, REGION_NAMES } from '../types';
import { CloudRain, Play, Sun, Moon, Sparkles, Activity } from 'lucide-react';
import './TopBar.css';

interface Props {
  region: RegionCode;
  setRegion: (r: RegionCode) => void;
  lastUpdated?: string;
  onRunPipeline: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function TopBar({ region, setRegion, lastUpdated, onRunPipeline, theme, toggleTheme }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand-icon-wrapper">
          <CloudRain className="topbar-icon" size={26} />
        </div>
        <div className="brand-text">
          <div className="brand-title-row">
            <h1 className="topbar-title">ForecastBlend</h1>
            <span className="regime-badge">
              <Sparkles size={11} /> SIH 26081
            </span>
          </div>
          <span className="brand-subtitle">Multi-Model AI-NWP Blending Platform</span>
        </div>
      </div>

      <div className="topbar-center">
        <div className="region-tabs-container">
          {(Object.keys(REGION_NAMES) as RegionCode[]).map(code => (
            <button 
              key={code}
              className={`region-tab ${region === code ? 'active' : ''}`}
              onClick={() => setRegion(code)}
            >
              <span className="tab-dot" />
              {REGION_NAMES[code]}
            </button>
          ))}
        </div>
      </div>

      <div className="topbar-right">
        <div className="system-status-indicator" title="Pipeline Status: Active">
          <Activity size={14} className="pulse-icon" />
          <span className="status-text">Live Sync</span>
        </div>

        {lastUpdated && (
          <span className="last-updated">
            Updated: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}

        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="run-pipeline-btn" onClick={onRunPipeline}>
          <Play size={15} fill="currentColor" /> Run Pipeline
        </button>
      </div>
    </header>
  );
}
