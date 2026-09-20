import { useState, useEffect } from 'react';
import './App.css';
import { RegionCode, LeadHours } from './types';
import { useForecasts } from './hooks/useForecasts';

import SidebarPanel from './components/SidebarPanel';
import MainHero from './components/MainHero';
import HeroRow from './components/HeroRow';
import WeightMapPanel from './components/WeightMapPanel';
import RegionMap from './components/RegionMap';
import SkillChart from './components/SkillChart';
import AlertsFeed from './components/AlertsFeed';
import PipelineStatus from './components/PipelineStatus';

function App() {
  const [region, setRegion] = useState<RegionCode>('PUN');
  const [leadHours, setLeadHours] = useState<LeadHours>(24);
  const [theme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const { forecast, weights, alerts, backtest, pipeline, setPipeline, loading, runPipeline } = useForecasts(region, leadHours);

  return (
    <div className="app-container">
      {/* Background Atmosphere Image Layer */}
      <div className="bg-atmosphere-overlay" />

      {/* Main Glass Workspace */}
      <div className="workspace-wrapper">
        {/* Top Featured Row: Sidebar Panel + Main Weather Hero (Matching Reference UI) */}
        <section className="top-featured-row">
          <SidebarPanel 
            region={region}
            setRegion={setRegion}
            alerts={alerts}
            lastUpdated={forecast?.issued_at}
          />
          <MainHero 
            region={region}
            forecast={forecast}
            leadHours={leadHours}
            setLeadHours={setLeadHours}
            onRunPipeline={runPipeline}
            pipeline={pipeline}
            loading={loading}
          />
        </section>

        {/* Analytics & Multi-Model Breakdown Section */}
        <section className="analytics-section">
          <div className="analytics-section-title">
            <span>Multi-Model AI-NWP Blending Analytics & Benchmarks</span>
          </div>

          <HeroRow 
            forecast={forecast} 
            leadHours={leadHours} 
            setLeadHours={setLeadHours} 
            loading={loading}
          />
          
          <div className="dashboard-grid top-grid">
            <WeightMapPanel weights={weights} leadHours={leadHours} />
            <RegionMap 
              selectedRegion={region} 
              onSelectRegion={setRegion}
              alerts={alerts}
            />
          </div>
          
          <SkillChart backtest={backtest} />
          
          <div className="dashboard-grid bottom-grid">
            <AlertsFeed alerts={alerts} />
            <PipelineStatus pipeline={pipeline} setPipeline={setPipeline} />
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
