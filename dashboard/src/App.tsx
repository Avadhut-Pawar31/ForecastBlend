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
            <ModelComparisonMatrix 
              forecast={forecast}
              leadHours={leadHours}
            />
          </div>
        )}

        {/* View 3: Empirical Verification Lab */}
        {activeView === 'verification' && (
          <div className="view-fade-in sub-view-wrap">
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
    </div>
  );
}
