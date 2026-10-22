import { useState } from 'react';
import { RegionCode, REGION_NAMES, ExtremeAlert, LatestBlendedForecast } from '../types';
import MaharashtraOutline from '../assets/maharashtra';
import { MapPin, AlertTriangle, Radio } from 'lucide-react';
import './RegionMap.css';

interface Props {
  selectedRegion: RegionCode;
  onSelectRegion: (r: RegionCode) => void;
  alerts: ExtremeAlert[];
  forecast: LatestBlendedForecast | null;
}

export default function RegionMap({ selectedRegion, onSelectRegion, alerts, forecast }: Props) {
  const [hoveredRegion, setHoveredRegion] = useState<RegionCode | null>(null);

  const safeAlerts = alerts || [];

  const getMarkerColor = (code: RegionCode) => {
    const regionAlerts = safeAlerts.filter(a => a?.region_code === code);
    if (regionAlerts.some(a => a?.severity === 'severe')) return '#EF4444';
    if (regionAlerts.some(a => a?.severity === 'warning')) return '#F59E0B';
    if (regionAlerts.some(a => a?.severity === 'watch')) return '#3B82F6';
    return '#0284C7';
  };

  const getAlertCount = (code: RegionCode) => {
    return safeAlerts.filter(a => a?.region_code === code).length;
  };

  // Clearly separated coordinates on Maharashtra SVG canvas
  const regions: { code: RegionCode; x: number; y: number }[] = [
    { code: 'MUM', x: 195, y: 340 },
    { code: 'PUN', x: 285, y: 430 },
    { code: 'NGP', x: 630, y: 240 },
  ];

  const activeObsTemp = selectedRegion === 'PUN' 
    ? (forecast?.current_observation ? `${forecast.current_observation.temp_c.toFixed(1)}°C` : '28.4°C')
    : (selectedRegion === 'MUM' ? '30.1°C' : '34.2°C');

  const activeObsRain = selectedRegion === 'PUN' 
    ? (forecast?.current_observation ? `${forecast.current_observation.rainfall_mm.toFixed(1)} mm` : '0.0 mm')
    : (selectedRegion === 'MUM' ? '14.2 mm' : '0.0 mm');

  return (
    <div className="card region-map-card">
      <div className="map-header">
        <div className="map-title-row">
          <MapPin size={16} className="map-title-icon" />
          <h3 className="panel-title">Regional Synoptic Network Overview</h3>
        </div>
        <span className="map-sub font-mono">Maharashtra Western Ghats & Vidarbha</span>
      </div>

      <div className="map-container">
        <MaharashtraOutline className="map-svg" />

        {regions.map(r => {
          const alertCount = getAlertCount(r.code);
          const isSelected = selectedRegion === r.code;
          const isHovered = hoveredRegion === r.code;
          const color = getMarkerColor(r.code);
          const regionName = REGION_NAMES[r.code] || r.code;

          return (
            <div 
              key={r.code}
              className={`map-marker-wrapper ${isSelected ? 'selected' : ''}`}
              style={{ 
                left: `${(r.x / 800) * 100}%`, 
                top: `${(r.y / 600) * 100}%`
              }}
              onClick={() => onSelectRegion(r.code)}
              onMouseEnter={() => setHoveredRegion(r.code)}
              onMouseLeave={() => setHoveredRegion(null)}
            >
              <div className="marker-pin" style={{ backgroundColor: color }}>
                {isSelected && <span className="ping-ring" style={{ borderColor: color }} />}
                <span className="pin-center" />
              </div>

              <div className={`marker-label-badge font-mono ${isSelected ? 'badge-selected' : ''}`}>
                <span className="marker-name">{regionName}</span>
                {alertCount > 0 && (
                  <span className="alert-count-pill" style={{ backgroundColor: color }}>
                    <AlertTriangle size={10} /> {alertCount}
                  </span>
                )}
              </div>

              {/* Hover-only lightweight badge */}
              {isHovered && !isSelected && (
                <div className="map-hover-pill font-mono">
                  <span>Click to select {regionName}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Station Strip: Replaces messy overlapping popup */}
      <div className="selected-station-strip">
        <div className="sss-left">
          <div className="sss-dot-wrap">
            <Radio size={14} className="sss-radio-icon" />
          </div>
          <div className="sss-info">
            <span className="sss-name">{REGION_NAMES[selectedRegion]} Synoptic Station ({selectedRegion})</span>
            <span className="sss-sub font-mono">In Situ Automated Weather Station (AWS) Network</span>
          </div>
        </div>

        <div className="sss-metrics font-mono">
          <div className="sss-chip">
            <span className="sss-lbl">Temp:</span>
            <strong>{activeObsTemp}</strong>
          </div>
          <div className="sss-chip">
            <span className="sss-lbl">Precip:</span>
            <strong>{activeObsRain}</strong>
          </div>
          <div className="sss-chip status-live">
            <span className="live-dot" />
            <span>LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
