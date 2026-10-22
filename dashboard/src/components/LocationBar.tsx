import { useState } from 'react';
import { RegionCode, LeadHours, LocationMetadata } from '../types';
import { MapPin, Search, Compass, Calendar } from 'lucide-react';
import './LocationBar.css';

interface Props {
  selectedRegion: RegionCode;
  onSelectRegion: (r: RegionCode) => void;
  locations: LocationMetadata[];
  leadHours: LeadHours;
  onSelectLeadHours: (l: LeadHours) => void;
  issuedAt?: string;
}

export default function LocationBar({
  selectedRegion,
  onSelectRegion,
  locations,
  leadHours,
  onSelectLeadHours,
  issuedAt
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const activeMeta = locations.find(l => l.code === selectedRegion) || {
    code: selectedRegion,
    name: selectedRegion === 'PUN' ? 'Pune' : (selectedRegion === 'MUM' ? 'Mumbai' : 'Nagpur'),
    state: 'Maharashtra',
    country: 'India',
    latitude: 18.5204,
    longitude: 73.8567,
    elevationM: 560,
    climateZone: 'Semi-arid / Rain Shadow',
    description: 'Deccan plateau urban hub'
  };

  const filteredLocations = locations.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const horizonTabs: { hours: LeadHours; label: string; period: string }[] = [
    { hours: 24, label: '+24h', period: 'Day 1' },
    { hours: 48, label: '+48h', period: 'Day 2' },
    { hours: 72, label: '+72h', period: 'Day 3' },
    { hours: 96, label: '+96h', period: 'Day 4' },
  ];

  const cycleHour = issuedAt ? new Date(issuedAt).getUTCHours() : 18;
  const targetDate = issuedAt ? new Date(new Date(issuedAt).getTime() + leadHours * 3600000) : new Date(Date.now() + leadHours * 3600000);
  const targetStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false }) + ' UTC';

  return (
    <div className="location-toolbar">
      <div className="toolbar-container">
        {/* Left Section: Location Selection & Search */}
        <div className="toolbar-location-group">
          <div className="station-identity">
            <div className="station-icon-wrap">
              <MapPin size={15} />
            </div>
            <div className="station-text">
              <span className="station-name">{activeMeta.name}</span>
              <span className="station-sub">{activeMeta.state} · {activeMeta.code}</span>
            </div>
          </div>

          {/* Quick Station Pills */}
          <div className="station-pill-group">
            {locations.slice(0, 4).map(loc => (
              <button
                key={loc.code}
                className={`station-pill ${loc.code === selectedRegion ? 'pill-active' : ''}`}
                onClick={() => onSelectRegion(loc.code)}
                title={`Switch to ${loc.name} station`}
              >
                {loc.name}
              </button>
            ))}
          </div>

          {/* Compact Search Bar */}
          <div className="search-container">
            <div className="search-field">
              <Search size={13} className="search-field-icon" />
              <input
                type="text"
                placeholder="Search station..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="search-input-clean"
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>

            {isSearchFocused && searchQuery && (
              <div className="search-popover">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map(loc => (
                    <button
                      key={loc.code}
                      className="search-result-row"
                      onClick={() => {
                        onSelectRegion(loc.code);
                        setSearchQuery('');
                      }}
                    >
                      <span className="sr-name">{loc.name}</span>
                      <span className="sr-meta font-mono">{loc.code} · {loc.elevationM}m</span>
                    </button>
                  ))
                ) : (
                  <div className="search-empty-text">No stations found</div>
                )}
              </div>
            )}
          </div>

          {/* Subtle Secondary Coordinates */}
          <div className="station-coords-chip font-mono" title="Station Coordinates & Elevation">
            <Compass size={11} />
            <span>{activeMeta.latitude.toFixed(2)}°N, {activeMeta.longitude.toFixed(2)}°E · {activeMeta.elevationM}m MSL</span>
          </div>
        </div>

        {/* Right Section: Forecast Horizon Configuration */}
        <div className="toolbar-horizon-group">
          <div className="horizon-control-wrap">
            <span className="horizon-group-label">Horizon:</span>
            <div className="horizon-tabs">
              {horizonTabs.map(tab => (
                <button
                  key={tab.hours}
                  className={`horizon-tab-btn ${leadHours === tab.hours ? 'tab-active' : ''}`}
                  onClick={() => onSelectLeadHours(tab.hours)}
                  title={`View +${tab.hours}h (${tab.period}) Blended Forecast`}
                >
                  <span className="tab-hour font-mono">{tab.label}</span>
                  <span className="tab-period">{tab.period}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="horizon-meta-chip font-mono" title="Model Run Cycle & Target Verification Window">
            <Calendar size={11} />
            <span>Cycle: {cycleHour.toString().padStart(2, '0')}:00Z → Target: {targetStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
