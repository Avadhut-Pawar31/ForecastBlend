import { useState } from 'react';
import { RegionCode, LeadHours, LocationMetadata, CurrentObservation } from '../types';
import { MapPin, Search, Clock, Compass, Mountain, CloudSun, AlertCircle } from 'lucide-react';
import './LocationBar.css';

interface Props {
  selectedRegion: RegionCode;
  onSelectRegion: (r: RegionCode) => void;
  locations: LocationMetadata[];
  leadHours: LeadHours;
  onSelectLeadHours: (l: LeadHours) => void;
  currentObservation?: CurrentObservation;
  issuedAt?: string;
}

export default function LocationBar({
  selectedRegion,
  onSelectRegion,
  locations,
  leadHours,
  onSelectLeadHours,
  currentObservation,
  issuedAt
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const activeMeta = locations.find(l => l.code === selectedRegion) || {
    code: selectedRegion,
    name: selectedRegion === 'PUN' ? 'Pune' : (selectedRegion === 'MUM' ? 'Mumbai' : 'Nagpur'),
    state: 'Maharashtra',
    country: 'India',
    latitude: 18.5204,
    longitude: 73.8567,
    elevationM: 560,
    climateZone: 'Semi-arid / Western Ghats Rain Shadow',
    description: 'Deccan plateau urban hub'
  };

  const filteredLocations = locations.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const leadTimes: { hours: LeadHours; label: string; desc: string }[] = [
    { hours: 24, label: '+24h', desc: 'Day 1' },
    { hours: 48, label: '+48h', desc: 'Day 2' },
    { hours: 72, label: '+72h', desc: 'Day 3' },
    { hours: 96, label: '+96h', desc: 'Day 4' },
  ];

  return (
    <div className="location-bar">
      <div className="location-bar-container">
        {/* Left Column: Location Identity & Search */}
        <div className="location-identity-col">
          <div className="location-title-row">
            <div className="pin-badge">
              <MapPin size={16} />
            </div>
            <div>
              <h2 className="location-name">{activeMeta.name}</h2>
              <span className="location-sub font-mono">
                {activeMeta.state}, {activeMeta.country} · {activeMeta.code}
              </span>
            </div>
          </div>

          {/* Quick Region Selector Pills */}
          <div className="region-pills">
            {locations.map(loc => (
              <button
                key={loc.code}
                className={`region-pill ${loc.code === selectedRegion ? 'active' : ''}`}
                onClick={() => onSelectRegion(loc.code)}
              >
                <span className="pill-code">{loc.code}</span>
                <span className="pill-name">{loc.name}</span>
              </button>
            ))}
          </div>

          {/* Location Search Bar with Autocomplete Dropdown */}
          <div className="search-wrap">
            <div className="search-input-box">
              <Search size={14} className="search-icon" />
              <input 
                type="text"
                placeholder="Search district, station or region..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                className="search-input"
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>

            {searchFocused && (
              <div className="search-dropdown">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map(loc => (
                    <button
                      key={loc.code}
                      className="dropdown-item"
                      onClick={() => {
                        onSelectRegion(loc.code);
                        setSearchQuery('');
                      }}
                    >
                      <div className="di-left">
                        <span className="di-name">{loc.name}</span>
                        <span className="di-state font-mono">{loc.state}, {loc.country}</span>
                      </div>
                      <span className="di-code font-mono">{loc.code}</span>
                    </button>
                  ))
                ) : (
                  <div className="dropdown-empty">
                    <AlertCircle size={14} />
                    <span>No meteorological stations matching "{searchQuery}"</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Geographic Coordinates & Metadata */}
          <div className="geo-metadata-row font-mono">
            <span className="meta-item" title="Geographic Coordinates">
              <Compass size={12} />
              {activeMeta.latitude.toFixed(2)}° N, {activeMeta.longitude.toFixed(2)}° E
            </span>
            <span className="meta-sep">·</span>
            <span className="meta-item" title="Elevation Above Mean Sea Level">
              <Mountain size={12} />
              {activeMeta.elevationM}m MSL
            </span>
            <span className="meta-sep">·</span>
            <span className="meta-item climate-pill" title="Climatological Regime">
              {activeMeta.climateZone}
            </span>
          </div>
        </div>

        {/* Center/Right Column: Current Ground Observation Card */}
        {currentObservation && (
          <div className="current-obs-card">
            <div className="obs-header">
              <div className="obs-badge">
                <CloudSun size={14} />
                <span>Current Observation</span>
              </div>
              <span className="obs-baseline-tag">Ground Truth</span>
            </div>

            <div className="obs-metrics-row">
              <div className="obs-metric">
                <span className="obs-val">{currentObservation.temp_c.toFixed(1)}°C</span>
                <span className="obs-label">Dry Bulb Temp</span>
              </div>
              <div className="obs-metric">
                <span className="obs-val">{currentObservation.rainfall_mm.toFixed(1)} mm</span>
                <span className="obs-label">Precip (24h)</span>
              </div>
              <div className="obs-metric">
                <span className="obs-val">{currentObservation.wind_kmh.toFixed(1)} km/h</span>
                <span className="obs-label">Surface Wind</span>
              </div>
            </div>

            <div className="obs-footer font-mono">
              <span>Station: AWS Synoptic Network</span>
              <span className="obs-time">
                {issuedAt ? new Date(issuedAt).toUTCString().slice(5, 22) : 'Real-time'}
              </span>
            </div>
          </div>
        )}

        {/* Right Column: Horizon Toggle (+24h to +96h) */}
        <div className="horizon-selector-col">
          <div className="horizon-header">
            <Clock size={14} className="horizon-icon" />
            <span className="horizon-label">Forecast Horizon</span>
          </div>

          <div className="horizon-toggle-grid">
            {leadTimes.map(lt => (
              <button
                key={lt.hours}
                className={`horizon-btn ${leadHours === lt.hours ? 'active' : ''}`}
                onClick={() => onSelectLeadHours(lt.hours)}
              >
                <span className="horizon-main">{lt.label}</span>
                <span className="horizon-sub">{lt.desc}</span>
              </button>
            ))}
          </div>

          <div className="cycle-info font-mono">
            <span>Cycle: {issuedAt ? new Date(issuedAt).toISOString().slice(11, 16) + 'Z' : 'Latest'}</span>
            <span>Horizon: +{leadHours} Hours</span>
          </div>
        </div>
      </div>
    </div>
  );
}
