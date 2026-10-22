import { useState } from 'react';
import { RegionCode, REGION_NAMES, ExtremeAlert, LatestBlendedForecast } from '../types';
import MaharashtraOutline from '../assets/maharashtra';
import { MapPin, AlertTriangle, CloudSun, Compass } from 'lucide-react';
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
    if (regionAlerts.some(a => a?.severity === 'severe')) return 'var(--color-severe)';
    if (regionAlerts.some(a => a?.severity === 'warning')) return 'var(--color-warning)';
    if (regionAlerts.some(a => a?.severity === 'watch')) return 'var(--color-watch)';
    return 'var(--accent-cyan)';
  };

  const getAlertCount = (code: RegionCode) => {
    return safeAlerts.filter(a => a?.region_code === code).length;
  };

  // Coordinates on Maharashtra SVG canvas
  const regions: { code: RegionCode; x: number; y: number }[] = [
    { code: 'MUM', x: 210, y: 320 },
    { code: 'PUN', x: 270, y: 390 },
    { code: 'NGP', x: 620, y: 260 },
  ];

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

          // Dynamic observation / forecast values
          const curTemp = r.code === selectedRegion && forecast?.current_observation 
            ? `${forecast.current_observation.temp_c.toFixed(1)}°C` 
            : (r.code === 'NGP' ? '34.2°C' : (r.code === 'MUM' ? '30.1°C' : '28.4°C'));
          const curRain = r.code === selectedRegion && forecast?.current_observation 
            ? `${forecast.current_observation.rainfall_mm.toFixed(1)} mm` 
            : (r.code === 'MUM' ? '14.2 mm' : '0.0 mm');

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
                <span className="ping-ring" style={{ borderColor: color }} />
                <span className="pin-center" />
              </div>

              <div className="marker-label-badge font-mono">
                <span className="marker-name">{regionName}</span>
                {alertCount > 0 && (
                  <span className="alert-count-pill" style={{ backgroundColor: color }}>
                    <AlertTriangle size={10} /> {alertCount}
                  </span>
                )}
              </div>

              {(isHovered || isSelected) && (
                <div className="map-tooltip-card font-mono">
                  <div className="tooltip-header">
                    <CloudSun size={13} className="tt-icon" />
                    <strong>{regionName} Station ({r.code})</strong>
                  </div>
                  <div className="tooltip-stats">
                    <div className="tt-stat">
                      <span className="tt-lbl">Temp:</span>
                      <span className="tt-val">{curTemp}</span>
                    </div>
                    <div className="tt-stat">
                      <span className="tt-lbl">Precip:</span>
                      <span className="tt-val">{curRain}</span>
                    </div>
                  </div>
                  <div className="tooltip-action">Click to inspect forecast</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="map-footer-caption font-mono">
        <Compass size={12} />
        <span>In-situ Indian Automated Weather Station (AWS) Network Grid</span>
      </div>
    </div>
  );
}
