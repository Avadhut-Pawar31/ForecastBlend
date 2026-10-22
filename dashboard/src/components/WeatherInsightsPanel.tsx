import { WeatherInsight } from '../types';
import { Lightbulb, AlertTriangle, Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import './WeatherInsightsPanel.css';

interface Props {
  insights: WeatherInsight[];
  regionName: string;
}

export default function WeatherInsightsPanel({ insights, regionName }: Props) {
  if (!insights || insights.length === 0) {
    return (
      <div className="insights-panel-card empty">
        <CheckCircle2 size={16} className="text-emerald" />
        <span>No anomalous synoptic deviations detected for {regionName}. Meteorological trajectory normal.</span>
      </div>
    );
  }

  const getSeverityIcon = (sev: 'info' | 'advisory' | 'alert') => {
    switch (sev) {
      case 'alert': return <AlertTriangle size={15} className="insight-icon alert" />;
      case 'advisory': return <Info size={15} className="insight-icon advisory" />;
      case 'info': return <Lightbulb size={15} className="insight-icon info" />;
    }
  };

  return (
    <section className="weather-insights-panel">
      <div className="insights-header">
        <div className="ih-title-group">
          <div className="ih-badge">
            <Lightbulb size={13} />
            <span>Rule-Based Synthesis</span>
          </div>
          <h3 className="ih-title">Automated Meteorological Insights · {regionName}</h3>
        </div>

        {/* Clear Disclaimer Tag */}
        <div className="official-disclaimer-pill" title="Advisory Guidance Disclaimer">
          <ShieldCheck size={13} />
          <span>Informational Advisory (Refer to IMD for Official Warnings)</span>
        </div>
      </div>

      <div className="insights-grid">
        {insights.map(item => (
          <div key={item.id} className={`insight-card severity-${item.severity}`}>
            <div className="ic-header">
              <div className="ic-badge-title">
                {getSeverityIcon(item.severity)}
                <span className="ic-title">{item.title}</span>
              </div>
              <span className="ic-horizon font-mono">+{item.leadHours}h Horizon</span>
            </div>

            <p className="ic-summary">{item.summary}</p>

            <div className="ic-evidence-box font-mono">
              <span className="eb-label">Supporting Evidence:</span>
              <span className="eb-content">{item.supportingData}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
