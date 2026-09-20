import { useState } from 'react';
import { ExtremeAlert, REGION_NAMES } from '../types';
import { AlertTriangle, ShieldCheck, Bell } from 'lucide-react';
import './AlertsFeed.css';

interface Props {
  alerts: ExtremeAlert[];
}

export default function AlertsFeed({ alerts }: Props) {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'all') return true;
    return a.severity === filterSeverity;
  });

  return (
    <div className="card alerts-card">
      <div className="alerts-header">
        <h2 className="panel-title">
          <Bell size={18} className="alerts-title-icon" />
          Extreme Weather Alert Stream
        </h2>

        <div className="alerts-filter-tabs">
          <button 
            className={`filter-tab ${filterSeverity === 'all' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('all')}
          >
            All ({alerts.length})
          </button>
          <button 
            className={`filter-tab ${filterSeverity === 'severe' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('severe')}
          >
            Severe
          </button>
          <button 
            className={`filter-tab ${filterSeverity === 'warning' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('warning')}
          >
            Warning
          </button>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="no-alerts-state">
          <ShieldCheck size={36} className="all-clear-icon" />
          <p className="no-alerts-title">All Meteorological Thresholds Normal</p>
          <p className="no-alerts-desc">No severe weather flags triggered in current blend cycle</p>
        </div>
      ) : (
        <div className="alerts-list">
          {filteredAlerts.map((a, i) => (
            <div key={i} className={`alert-item severity-${a.severity}`}>
              <div className="alert-severity-badge">
                <AlertTriangle size={16} />
              </div>
              
              <div className="alert-content">
                <div className="alert-meta-row">
                  <span className="alert-region">{REGION_NAMES[a.region_code]}</span>
                  <span className="alert-time">
                    {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <p className="alert-msg">{a.message}</p>
                
                <div className="alert-footer">
                  <span className="alert-type-pill">{a.type.replace('_', ' ')}</span>
                  <span className="alert-conf-badge">
                    Confidence: {Math.round(a.confidence <= 1 ? a.confidence * 100 : a.confidence)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
