import { Activity, CloudRain, ExternalLink, RefreshCw, Terminal, CheckCircle2, AlertCircle, Sun, LineChart, ShieldCheck, Map } from 'lucide-react';
import './HeaderNav.css';

interface Props {
  onRefresh: () => void;
  loading: boolean;
  pipelineRunning: boolean;
  onOpenPipelineModal: () => void;
  lastUpdated?: string;
  hasError?: boolean;
  activeView?: 'overview' | 'analysis' | 'verification' | 'map' | 'insights';
  onSelectView?: (view: 'overview' | 'analysis' | 'verification' | 'map' | 'insights') => void;
}

export default function HeaderNav({ 
  onRefresh, 
  loading, 
  pipelineRunning, 
  onOpenPipelineModal,
  lastUpdated,
  hasError = false,
  activeView = 'overview',
  onSelectView
}: Props) {
  const formattedUpdate = lastUpdated 
    ? new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false }) + ' UTC'
    : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false }) + ' UTC';

  return (
    <header className="header-nav">
      <div className="nav-container">
        {/* Left: Brand Group */}
        <div className="brand-group">
          <div className="brand-logo">
            <CloudRain size={20} className="logo-icon" />
          </div>
          <div className="brand-titles">
            <div className="brand-name-row">
              <span className="brand-name">ForecastBlend</span>
              <span className="version-pill">v1.2</span>
            </div>
            <span className="brand-subtitle">Multi-Model Weather Intelligence</span>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        {onSelectView && (
          <nav className="desktop-header-tabs" aria-label="Desktop Views">
            <button 
              className={`header-tab-btn ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => onSelectView('overview')}
            >
              <Sun size={14} />
              <span>Weather</span>
            </button>
            <button 
              className={`header-tab-btn ${activeView === 'analysis' ? 'active' : ''}`}
              onClick={() => onSelectView('analysis')}
            >
              <LineChart size={14} />
              <span>Analysis</span>
            </button>
            <button 
              className={`header-tab-btn ${activeView === 'verification' ? 'active' : ''}`}
              onClick={() => onSelectView('verification')}
            >
              <ShieldCheck size={14} />
              <span>Verification</span>
            </button>
            <button 
              className={`header-tab-btn ${activeView === 'map' ? 'active' : ''}`}
              onClick={() => onSelectView('map')}
            >
              <Map size={14} />
              <span>Stations</span>
            </button>
          </nav>
        )}

        {/* Right: Operational Status & Controls */}
        <div className="nav-actions">
          {/* Real System Health Indicator */}
          <div className={`health-status-badge ${hasError ? 'status-error' : (pipelineRunning ? 'status-running' : 'status-healthy')}`}>
            {hasError ? (
              <>
                <AlertCircle size={12} className="status-icon" />
                <span className="status-text">Degraded · Backup Mode</span>
              </>
            ) : pipelineRunning ? (
              <>
                <span className="pulse-dot running" />
                <span className="status-text">Pipeline Executing</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={12} className="status-icon" />
                <span className="status-text">Operational · Multi-Model Consensus</span>
              </>
            )}
          </div>

          {/* Data Freshness Timestamp */}
          <div className="timestamp-badge font-mono" title="Latest Ingestion Cycle Timestamp">
            <Activity size={12} className="meta-icon" />
            <span>Updated: {formattedUpdate}</span>
          </div>

          {/* Action Buttons with Consistent Sizing */}
          <button 
            className="action-btn"
            onClick={onOpenPipelineModal}
            title="Inspect Data Pipeline and Model Ingestion Stages"
          >
            <Terminal size={13} />
            <span>Pipeline Console</span>
          </button>

          <button 
            className={`action-btn ${loading ? 'btn-loading' : ''}`}
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Meteorological Ingestion and Blending"
          >
            <RefreshCw size={13} className={loading ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>

          <a 
            href="https://github.com/Avadhut-Pawar31/ForecastBlend" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="action-btn github-action-btn"
            title="View Source on GitHub"
          >
            <span>GitHub</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </header>
  );
}
