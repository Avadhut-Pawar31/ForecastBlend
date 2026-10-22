import { useState } from 'react';
import { ExtremeAlert } from '../types';
import { AlertTriangle, ShieldCheck, Bell, ShieldAlert } from 'lucide-react';
import './AlertsStream.css';

interface Props {
  alerts: ExtremeAlert[];
}

export default function AlertsStream({ alerts }: Props) {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const safeAlerts = alerts || [];
  const filteredAlerts = safeAlerts.filter(a => {
    if (filterSeverity === 'all') return true;
    return a.severity === filterSeverity;
  });

  const severeCount = safeAlerts.filter(a => a.severity === 'severe').length;
  const warningCount = safeAlerts.filter(a => a.severity === 'warning').length;
  const watchCount = safeAlerts.filter(a => a.severity === 'watch').length;

  return (
    <div className="alerts-stream-card">
      <div className="alerts-stream-header">
        <div className="ash-title-wrap">
          <div className="ash-badge">
            <Bell size={13} />
            <span>Threshold Detection</span>
          </div>
          <h3 className="ash-title">Meteorological Risk & Anomaly Indicators</h3>
        </div>

        {/* Severity Tabs */}
        <div className="severity-filter-tabs">
          <button
            className={`s-tab ${filterSeverity === 'all' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('all')}
          >
            All ({safeAlerts.length})
          </button>
          <button
            className={`s-tab tab-severe ${filterSeverity === 'severe' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('severe')}
          >
            Severe ({severeCount})
          </button>
          <button
            className={`s-tab tab-warning ${filterSeverity === 'warning' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('warning')}
          >
            Warning ({warningCount})
          </button>
          <button
            className={`s-tab tab-watch ${filterSeverity === 'watch' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('watch')}
          >
            Watch ({watchCount})
          </button>
        </div>
      </div>

      {/* Official Disclaimer */}
      <div className="alerts-disclaimer-box">
        <ShieldAlert size={14} className="disclaimer-icon" />
        <span>
          <strong>Operational Decision-Support System:</strong> Indicators reflect rule-based algorithmic thresholds (IMD / WMO criteria). Not an official emergency alert service.
        </span>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="empty-alerts-state">
          <ShieldCheck size={32} className="shield-icon" />
          <span className="ea-title">No Active Extreme Weather Thresholds Breached</span>
          <span className="ea-desc">All multi-model forecasts remain within normal non-extreme variance boundaries.</span>
        </div>
      ) : (
        <div className="alerts-items-list">
          {filteredAlerts.map((alert, idx) => {
            const dateStr = alert.timestamp ? new Date(alert.timestamp).toUTCString().slice(5, 22) : 'Active Cycle';
            return (
              <div key={idx} className={`alert-card severity-${alert.severity}`}>
                <div className="ac-top">
                  <div className="ac-badge-row">
                    <span className={`ac-pill pill-${alert.severity}`}>
                      <AlertTriangle size={12} />
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="ac-type font-mono">{alert.type.replace('_', ' ')}</span>
                  </div>
                  <span className="ac-time font-mono">{dateStr}</span>
                </div>

                <p className="ac-message">{alert.message}</p>

                <div className="ac-meta-row font-mono">
                  <span>Forecast Value: <strong>{alert.value}</strong></span>
                  <span>Threshold: <strong>{alert.threshold}</strong></span>
                  <span>Consensus: <strong>{(alert.confidence * 100).toFixed(0)}%</strong></span>
                </div>

                {alert.reason && (
                  <p className="ac-reason">
                    <strong>Rule Basis:</strong> {alert.reason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
