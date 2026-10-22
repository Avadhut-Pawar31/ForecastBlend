import { useState } from 'react';
import { RegionCode, LeadHours } from './types';
import { useForecasts } from './hooks/useForecasts';

import HeaderNav from './components/HeaderNav';
import LocationBar from './components/LocationBar';
import BlendedForecastHero from './components/BlendedForecastHero';
import ModelComparisonMatrix from './components/ModelComparisonMatrix';
import VerificationLab from './components/VerificationLab';
import WeightMapPanel from './components/WeightMapPanel';
import RegionMap from './components/RegionMap';
import WeatherInsightsPanel from './components/WeatherInsightsPanel';
import AlertsStream from './components/AlertsStream';
import PipelineConsole from './components/PipelineConsole';

import './App.css';

export default function App() {
  const [region, setRegion] = useState<RegionCode>('PUN');
  const [leadHours, setLeadHours] = useState<LeadHours>(24);
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
    climateZone: 'Semi-arid / Western Ghats Rain Shadow',
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
      />

      {/* 2. Interactive Location & Horizon Bar */}
      <LocationBar 
        selectedRegion={region}
        onSelectRegion={setRegion}
        locations={locations}
        leadHours={leadHours}
        onSelectLeadHours={setLeadHours}
        currentObservation={forecast?.current_observation}
        issuedAt={forecast?.issued_at}
      />

      {/* 3. Main Operational Dashboard Container */}
      <main className="main-content-wrapper">
        {error && (
          <div className="global-error-banner font-mono">
            <span>[DATA RETRIEVAL NOTICE] {error}. Using calibrated synoptic reanalysis fixtures.</span>
          </div>
        )}

        {/* Console Drawer (When Toggled) */}
        {showConsole && (
          <section className="console-drawer-section">
            <PipelineConsole 
              pipeline={pipeline} 
              onTrigger={runPipeline}
              onClose={() => setShowConsole(false)}
            />
          </section>
        )}

        {/* Blended Forecast Primary Hero */}
        <BlendedForecastHero 
          forecast={forecast}
          leadHours={leadHours}
          loading={loading}
        />

        {/* Model Comparison Matrix */}
        <ModelComparisonMatrix 
          forecast={forecast}
          leadHours={leadHours}
        />

        {/* Empirical Verification Lab */}
        <VerificationLab 
          backtest={backtest}
          verificationSummary={verification}
        />

        {/* Two-Column Analytics Layout */}
        <div className="two-column-analytics-grid">
          {/* Column A: Adaptive Weights & Regional Synoptic Map */}
          <div className="col-stack">
            <WeightMapPanel 
              weights={weights}
              leadHours={leadHours}
            />
            <RegionMap 
              selectedRegion={region}
              onSelectRegion={setRegion}
              alerts={alerts}
              forecast={forecast}
            />
          </div>

          {/* Column B: Automated Weather Insights & Alert Stream */}
          <div className="col-stack">
            <WeatherInsightsPanel 
              insights={insights}
              regionName={activeMeta.name}
            />
            <AlertsStream 
              alerts={alerts}
            />
          </div>
        </div>
      </main>

      {/* 4. Professional Engineering Footer */}
      <footer className="platform-footer">
        <div className="footer-container">
          <div className="footer-left">
            <span className="footer-brand font-mono">ForecastBlend Platform</span>
            <p className="footer-desc">
              Operational Multi-Model Meteorological Synthesis Engine integrating NOAA Global Forecast System (GFS), ECMWF Integrated Forecasting System (IFS), and Google DeepMind GraphCast.
            </p>
          </div>

          <div className="footer-center font-mono">
            <span>Methodology: Regularized Inverse-MAE Softmax with Laplace Shrinkage</span>
            <span>Target Region: Maharashtra Sub-Basins (Pune, Mumbai, Nagpur)</span>
          </div>

          <div className="footer-right font-mono">
            <span className="footer-disclaimer">
              Advisory Decision-Support Only · Civil protection authorities should consult official alerts published by the India Meteorological Department (IMD).
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
