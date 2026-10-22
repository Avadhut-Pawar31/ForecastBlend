import { Activity, CloudRain, ExternalLink, RefreshCw, Sparkles, Terminal } from 'lucide-react';
import './HeaderNav.css';

interface Props {
  onRefresh: () => void;
  loading: boolean;
  pipelineRunning: boolean;
  onOpenPipelineModal: () => void;
}

export default function HeaderNav({ onRefresh, loading, pipelineRunning, onOpenPipelineModal }: Props) {
  const currentTime = new Date().toUTCString();

  return (
    <header className="header-nav">
      <div className="nav-container">
        {/* Brand Group */}
        <div className="brand-group">
          <div className="brand-icon">
            <CloudRain size={22} className="logo-svg" />
          </div>
          <div className="brand-text">
            <div className="title-row">
              <span className="brand-name">ForecastBlend</span>
              <span className="version-tag">v1.2</span>
              <span className="badge-sih">
                <Sparkles size={10} /> SIH 26081
              </span>
            </div>
            <p className="brand-subtitle">Adaptive AI–NWP Multi-Model Weather Intelligence Platform</p>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div className="nav-actions">
          <div className="status-indicator">
            <span className={`pulse-dot ${pipelineRunning ? 'running' : 'healthy'}`} />
            <span className="status-label">
              {pipelineRunning ? 'Pipeline Running' : 'Operational · Multi-Model Consensus'}
            </span>
          </div>

          <div className="time-display font-mono" title="UTC System Synchronization Time">
            <Activity size={13} className="time-icon" />
            <span>{currentTime.slice(17, 22)} UTC</span>
          </div>

          <button 
            className="nav-btn pipeline-btn"
            onClick={onOpenPipelineModal}
            title="Inspect Pipeline Execution Console"
          >
            <Terminal size={14} />
            <span>Pipeline Console</span>
          </button>

          <button 
            className={`nav-btn refresh-btn ${loading ? 'loading' : ''}`}
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Meteorological Data"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <a 
            href="https://github.com/Avadhut-Pawar31/ForecastBlend" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="nav-btn github-btn"
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
