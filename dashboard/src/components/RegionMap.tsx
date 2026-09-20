import { useState } from 'react';
import { RegionCode, REGION_NAMES, ExtremeAlert } from '../types';
import MaharashtraOutline from '../assets/maharashtra';
import { MapPin, AlertTriangle, CloudSun } from 'lucide-react';
import './RegionMap.css';

interface Props {
  selectedRegion: RegionCode;
  onSelectRegion: (r: RegionCode) => void;
  alerts: ExtremeAlert[];
}

export default function RegionMap({ selectedRegion, onSelectRegion, alerts }: Props) {
  const [hoveredRegion, setHoveredRegion] = useState<RegionCode | null>(null);

  const regions: { code: RegionCode; x: number; y: number; temp: string; rain: string }[] = [
    { code: 'MUM', x: 210, y: 320, temp: '30.2°C', rain: '24.5mm' },
    { code: 'PUN', x: 270, y: 390, temp: '29.1°C', rain: '18.2mm' },
    { code: 'NGP', x: 620, y: 260, temp: '33.4°C', rain: '5.1mm' },
  ];

  const safeAlerts = alerts || [];

  const getMarkerColor = (code: RegionCode) => {
    const regionAlerts = safeAlerts.filter(a => a?.region_code === code);
    if (regionAlerts.some(a => a?.severity === 'severe')) return 'var(--color-severe)';
    if (regionAlerts.some(a => a?.severity === 'warning')) return 'var(--color-warning)';
    if (regionAlerts.some(a => a?.severity === 'watch')) return 'var(--color-watch)';
    return 'var(--primary-blue)';
  };

  const getAlertCount = (code: RegionCode) => {
    return safeAlerts.filter(a => a?.region_code === code).length;
  };

  return (
    <div className="card region-map-card">
      <div className="map-header">
        <h2 className="panel-title">
          <MapPin size={18} className="map-title-icon" />
          Regional Meteorological Overview
        </h2>
        <span className="map-sub">Interactive Maharashtra Network</span>
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
                <span className="ping-ring" style={{ borderColor: color }} />
                <span className="pin-center" />
              </div>

              <div className="marker-label-badge">
                <span className="marker-name">{regionName}</span>
                {alertCount > 0 && (
                  <span className="alert-count-pill" style={{ backgroundColor: color }}>
                    <AlertTriangle size={10} /> {alertCount}
                  </span>
                )}
              </div>

              {(isHovered || isSelected) && (
                <div className="map-tooltip-card">
                  <div className="tooltip-header">
                    <CloudSun size={14} className="tt-icon" />
                    <strong>{regionName} Station</strong>
                  </div>
                  <div className="tooltip-stats">
                    <div className="tt-stat">
                      <span className="tt-lbl">Temp: </span>
                      <span className="tt-val">{r.temp}</span>
                    </div>
                    <div className="tt-stat">
                      <span className="tt-lbl">Rain: </span>
                      <span className="tt-val">{r.rain}</span>
                    </div>
                  </div>
                  <div className="tooltip-action">Click to view forecast</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
