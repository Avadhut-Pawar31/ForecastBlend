import { useState, useRef } from 'react';
import { RegionCode, REGION_NAMES, LatestBlendedForecast, LeadHours, PipelineExecution } from '../types';
import { MapPin, Search, Play, Loader2, CloudRain, Sun, Wind } from 'lucide-react';
import './MainHero.css';

interface Props {
  region: RegionCode;
  forecast: LatestBlendedForecast | null;
  leadHours: LeadHours;
  setLeadHours: (l: LeadHours) => void;
  onRunPipeline: () => void;
  pipeline: PipelineExecution | null;
  loading: boolean;
}

export default function MainHero({
  region,
  forecast,
  leadHours,
  setLeadHours,
  onRunPipeline,
  pipeline,
  loading
}: Props) {
  const isExecuting = pipeline?.status === 'RUNNING';
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getVarVal = (varName: 'rainfall_mm' | 'temp_c' | 'wind_kmh', lead: LeadHours) => {
    const varMap = forecast?.forecast?.[varName];
    if (!varMap) return 0;
    const entry = varMap[lead.toString()] || Object.values(varMap)[0];
    return entry?.value ?? 0;
  };

  const currentTemp = getVarVal('temp_c', leadHours);
  const currentRain = getVarVal('rainfall_mm', leadHours);
  const currentWind = getVarVal('wind_kmh', leadHours);

  const leadTimes: LeadHours[] = [24, 48, 72, 96];

  // Map client X to closest lead time horizon
  const updateHorizonFromPointer = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = (clientX - rect.left) / rect.width;

    if (relativeX <= 0.25) {
      setLeadHours(24);
    } else if (relativeX <= 0.50) {
      setLeadHours(48);
    } else if (relativeX <= 0.75) {
      setLeadHours(72);
    } else {
      setLeadHours(96);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateHorizonFromPointer(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updateHorizonFromPointer(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      updateHorizonFromPointer(e.touches[0].clientX);
    }
  };

  // Other regions for floating mini cards
  const otherRegions = (['PUN', 'MUM', 'NGP'] as RegionCode[]).filter(r => r !== region);

  const getConditionText = () => {
    if (forecast?.extreme_flag) return 'Monsoon Synoptic with Heavy Blended Rainfall';
    if (currentRain > 10) return 'Heavy Rainfall Warning & Convective Activity';
    if (currentTemp > 32) return 'Warm & Sunny with Clear Skies';
    return 'Monsoon Synoptic with Partly Cloudy Skies';
  };

  const getRegionTemp = (rCode: RegionCode) => {
    if (rCode === 'MUM') return '29.5°C';
    if (rCode === 'PUN') return '28.1°C';
    return '33.2°C';
  };

  const getRegionCond = (rCode: RegionCode) => {
    if (rCode === 'MUM') return 'Heavy Rain · 85% Conf';
    if (rCode === 'PUN') return 'Monsoon · 90% Conf';
    return 'Clear Skies · 80% Conf';
  };

  // Precise 1:1 overlay coordinates (percentage left & top) on the Bezier wave path
  const getPrecisionPointerPos = (lt: LeadHours) => {
    switch (lt) {
      case 24: return { left: '12.5%', top: '48%' };
      case 48: return { left: '37.5%', top: '60%' };
      case 72: return { left: '62.5%', top: '34%' };
      case 96: return { left: '87.5%', top: '48%' };
    }
  };

  const pointerPos = getPrecisionPointerPos(leadHours);

  return (
    <div className="main-hero-panel">
      {/* Top Navigation Row matching Reference UI */}
      <div className="hero-top-row">
        <div className="hero-location-wrap">
          <MapPin size={18} className="loc-pin" />
          <span className="loc-name">{REGION_NAMES[region]}, Maharashtra, India</span>
          <span className="loc-date">({new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})</span>
        </div>

        <div className="hero-actions-wrap">
          <button className="glass-icon-btn" title="Search Location">
            <Search size={16} />
          </button>
          
          <button 
            className={`run-pipeline-glass-btn ${isExecuting ? 'running' : ''}`}
            onClick={onRunPipeline}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>Executing Pipeline...</span>
              </>
            ) : (
              <>
                <Play size={15} fill="currentColor" />
                <span>Run Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Temperature & Blended Condition Overview */}
      <div className="hero-center-content">
        <div className="hero-left-metrics">
          <div className="hero-temp-row">
            <span className="hero-temp-val">{loading ? '--' : Math.round(currentTemp)}°C</span>
            <div className="hero-temp-highlow">
              <span className="hl-pill high">H: {Math.round(currentTemp + 5)}°C</span>
              <span className="hl-pill low">L: {Math.round(currentTemp - 4)}°C</span>
            </div>
          </div>

          <h2 className="hero-condition-title">{getConditionText()}</h2>

          <p className="hero-desc-txt">
            With real-time multi-model AI (GraphCast) & physical NWP (GFS, ECMWF) inverse-error softmax blending technology, we deliver reliable, high-confidence weather forecasts for any region across India.
          </p>
        </div>

        {/* Floating Multi-Region Cards on Right */}
        <div className="hero-region-cards-col">
          <div className="region-cards-title">Multi-Station Network</div>
          <div className="region-cards-grid">
            {otherRegions.map(rCode => (
              <div key={rCode} className="floating-region-card">
                <div className="frc-header">
                  {rCode === 'MUM' ? <CloudRain size={18} className="frc-icon rain" /> : <Sun size={18} className="frc-icon sun" />}
                  <span className="frc-temp">{getRegionTemp(rCode)}</span>
                </div>
                <div className="frc-body">
                  <strong className="frc-name">{REGION_NAMES[rCode]}</strong>
                  <span className="frc-sub">{getRegionCond(rCode)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bezier Wave Path Slider with Draggable/Scrollable Precision Blue Pointer */}
      <div className="hero-trend-section">
        <div className="trend-header-row">
          <span className="trend-label">Multi-Horizon Blended Curve</span>
          <div className="metric-pill-toggles">
            <span className="metric-tag rain"><CloudRain size={12} /> {currentRain.toFixed(1)} mm</span>
            <span className="metric-tag wind"><Wind size={12} /> {currentWind.toFixed(1)} km/h</span>
          </div>
        </div>

        <div
          ref={containerRef}
          className={`bezier-trend-container ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchMove}
          onTouchMove={handleTouchMove}
        >
          {/* Days / Horizons Row */}
          <div className="horizon-labels-row">
            {leadTimes.map(lt => (
              <button
                key={lt}
                className={`horizon-tab-btn ${leadHours === lt ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setLeadHours(lt);
                }}
              >
                +{lt}h Horizon
              </button>
            ))}
          </div>

          {/* Bezier SVG Curve & Precision 1:1 Blue Pointer */}
          <div className="svg-curve-wrapper">
            <svg className="bezier-svg-path" viewBox="0 0 800 60" preserveAspectRatio="none">
              <path
                d="M 50 36 C 200 12, 300 48, 450 20 C 600 2, 700 42, 750 28"
                stroke="rgba(30, 41, 59, 0.35)"
                strokeWidth="2.5"
                fill="none"
              />
              {/* Static node markers */}
              <circle cx="100" cy="29" r="4.5" fill="#94A3B8" />
              <circle cx="300" cy="36" r="4.5" fill="#94A3B8" />
              <circle cx="500" cy="20" r="4.5" fill="#94A3B8" />
              <circle cx="700" cy="29" r="4.5" fill="#94A3B8" />
            </svg>

            {/* Precision 1:1 Crisp Circular Blue Pointer Handle */}
            <div
              className="precision-blue-pointer"
              style={{
                left: pointerPos.left,
                top: pointerPos.top
              }}
              title={`Selected +${leadHours}h Horizon`}
            >
              <div className="pointer-core-dot" />
            </div>
          </div>

          {/* Temperature Values Row below nodes */}
          <div className="horizon-values-row">
            {leadTimes.map(lt => {
              const val = Math.round(getVarVal('temp_c', lt));
              const isSelected = leadHours === lt;
              return (
                <div
                  key={lt}
                  className={`horizon-val-node ${isSelected ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLeadHours(lt);
                  }}
                >
                  <span className="node-temp">{val}°C</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
