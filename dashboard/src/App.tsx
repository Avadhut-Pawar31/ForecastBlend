import { useState } from 'react';
import { RegionCode, LeadHours } from './types';
import { useForecasts } from './hooks/useForecasts';

import HeaderNav from './components/HeaderNav';
import ModernAppHero from './components/ModernAppHero';
import ModelComparisonMatrix from './components/ModelComparisonMatrix';
import VerificationLab from './components/VerificationLab';
import WeightMapPanel from './components/WeightMapPanel';
import RegionMap from './components/RegionMap';
import WeatherInsightsPanel from './components/WeatherInsightsPanel';
import AlertsStream from './components/AlertsStream';
import PipelineConsole from './components/PipelineConsole';

import { CloudSun, LineChart, ShieldCheck, Map, Terminal, X } from 'lucide-react';
import './App.css';

type ActiveView = 'overview' | 'analysis' | 'verification' | 'map' | 'insights';

export default function App() {
  const [region, setRegion] = useState<RegionCode>('PUN');
  const [leadHours, setLeadHours] = useState<LeadHours>(24);
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [showConsole, setShowConsole] = useState(false);

  const {
    locations,
    forecast,
    weights,
    alerts,
    backtest,
    insights,
    verification,
    pipeline,
    loading,
    error,
    runPipeline,
    refetch
  } = useForecasts(region, leadHours);

  const activeMeta = locations.find(l => l.code === region) || {
    code: region,
    name: region === 'PUN' ? 'Pune' : (region === 'MUM' ? 'Mumbai' : 'Nagpur'),
    state: 'Maharashtra',
    country: 'India',
    latitude: 18.5204,
    longitude: 73.8567,
    elevationM: 560,
    climateZone: 'Semi-arid / Rain Shadow',
    description: 'Deccan plateau urban hub'
  };

  return (
    <div className="forecast-blend-app">
      {/* 1. Header Navigation */}
      <HeaderNav 
        onRefresh={refetch}
        loading={loading}
        pipelineRunning={pipeline?.status === 'RUNNING'}
        onOpenPipelineModal={() => setShowConsole(prev => !prev)}
        lastUpdated={forecast?.issued_at}
        hasError={!!error}
        activeView={activeView}
        onSelectView={setActiveView}
      />

      {/* 2. Main Workspace */}
      <main className="main-content-wrapper">
        {error && (
          <div className="global-error-banner font-mono">
            <span>[NOTICE] Serving calibrated in-situ baseline fixtures.</span>
          </div>
        )}

        {/* Pipeline Console Drawer */}
        {showConsole && (
          <section className="console-drawer-section">
            <PipelineConsole 
              pipeline={pipeline} 
              onTrigger={runPipeline}
              onClose={() => setShowConsole(false)}
            />
          </section>
        )}

        {/* Primary View: Modern 3D Weather Hero (Matching Reference Design) */}
        {activeView === 'overview' && (
          <div className="view-fade-in">
            <ModernAppHero 
              forecast={forecast}
              leadHours={leadHours}
              onSelectLeadHours={setLeadHours}
              selectedRegion={region}
              onSelectRegion={setRegion}
              locations={locations}
              onOpenAnalysis={() => setActiveView('analysis')}
              onOpenVerification={() => setActiveView('verification')}
            />
          </div>
        )}

        {/* View 2: Multi-Model Forecast Analysis */}
        {activeView === 'analysis' && (
          <div className="view-fade-in sub-view-wrap">
            <div className="view-header-row">
              <span className="view-back-btn" onClick={() => setActiveView('overview')}>
                ← Back to Weather Overview
              </span>
              <button className="view-close-icon" onClick={() => setActiveView('overview')}>
                <X size={16} />
              </button>
            </div>
            <ModelComparisonMatrix 
              forecast={forecast}
              leadHours={leadHours}
            />
          </div>
        )}

        {/* View 3: Empirical Verification Lab */}
        {activeView === 'verification' && (
          <div className="view-fade-in sub-view-wrap">
            <div className="view-header-row">
              <span className="view-back-btn" onClick={() => setActiveView('overview')}>
                ← Back to Weather Overview
              </span>
              <button className="view-close-icon" onClick={() => setActiveView('overview')}>
                <X size={16} />
              </button>
            </div>
            <VerificationLab 
              backtest={backtest}
              verificationSummary={verification}
              leadHours={leadHours}
            />
          </div>
        )}

        {/* View 4: Synoptic Station Map & Weights */}
        {activeView === 'map' && (
          <div className="view-fade-in sub-view-wrap">
            <div className="view-header-row">
              <span className="view-back-btn" onClick={() => setActiveView('overview')}>
                ← Back to Weather Overview
              </span>
              <button className="view-close-icon" onClick={() => setActiveView('overview')}>
                <X size={16} />
              </button>
            </div>
            <div className="two-column-analytics-grid">
              <RegionMap 
                selectedRegion={region}
                onSelectRegion={setRegion}
                alerts={alerts}
                forecast={forecast}
              />
              <WeightMapPanel 
                weights={weights}
                leadHours={leadHours}
              />
            </div>
          </div>
        )}

        {/* View 5: Automated Insights & Alerts */}
        {activeView === 'insights' && (
          <div className="view-fade-in sub-view-wrap">
            <div className="view-header-row">
              <span className="view-back-btn" onClick={() => setActiveView('overview')}>
                ← Back to Weather Overview
              </span>
              <button className="view-close-icon" onClick={() => setActiveView('overview')}>
                <X size={16} />
              </button>
            </div>
            <div className="two-column-analytics-grid">
              <WeatherInsightsPanel 
                insights={insights}
                regionName={activeMeta.name}
              />
              <AlertsStream 
                alerts={alerts}
              />
            </div>
          </div>
        )}
      </main>

      {/* 3. Floating Bottom Navigation Pill (Like the reference mobile app bottom bar) */}
      <nav className="floating-bottom-nav">
        <div className="bottom-nav-pill">
          <button
            className={`b-nav-item ${activeView === 'overview' ? 'nav-active' : ''}`}
            onClick={() => setActiveView('overview')}
            title="Weather Forecast Overview"
          >
            <CloudSun size={18} />
            <span className="b-nav-label">Weather</span>
          </button>

          <button
            className={`b-nav-item ${activeView === 'analysis' ? 'nav-active' : ''}`}
            onClick={() => setActiveView('analysis')}
            title="Multi-Model Trajectories & Comparison"
          >
            <LineChart size={18} />
            <span className="b-nav-label">Analysis</span>
          </button>

          <button
            className={`b-nav-item ${activeView === 'verification' ? 'nav-active' : ''}`}
            onClick={() => setActiveView('verification')}
            title="Historical Accuracy & Verification Lab"
          >
            <ShieldCheck size={18} />
            <span className="b-nav-label">Verification</span>
          </button>

          <button
            className={`b-nav-item ${activeView === 'map' ? 'nav-active' : ''}`}
            onClick={() => setActiveView('map')}
            title="Maharashtra Synoptic Station Network"
          >
            <Map size={18} />
            <span className="b-nav-label">Stations</span>
          </button>

          <button
            className={`b-nav-item ${showConsole ? 'nav-active' : ''}`}
            onClick={() => setShowConsole(prev => !prev)}
            title="Inspect Pipeline Execution Console"
          >
            <Terminal size={18} />
            <span className="b-nav-label">Pipeline</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
