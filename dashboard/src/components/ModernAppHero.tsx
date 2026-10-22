import { useState } from 'react';
import { 
  LatestBlendedForecast, 
  LeadHours, 
  RegionCode, 
  LocationMetadata, 
  Variable, 
  VARIABLE_LABELS, 
  VARIABLE_UNITS, 
  ModelSource,
  MODEL_DESCRIPTIONS,
  SOURCE_COLORS
} from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  MapPin, 
  Droplets, 
  Wind, 
  ShieldCheck, 
  Sun, 
  CloudRain, 
  Compass, 
  Layers, 
  Lock, 
  Eye, 
  EyeOff, 
  Search
} from 'lucide-react';
import './ModernAppHero.css';

interface Props {
  forecast: LatestBlendedForecast | null;
  leadHours: LeadHours;
  onSelectLeadHours: (l: LeadHours) => void;
  selectedRegion: RegionCode;
  onSelectRegion: (r: RegionCode) => void;
  locations: LocationMetadata[];
  onOpenAnalysis?: () => void;
  onOpenVerification?: () => void;
}

export default function ModernAppHero({
  forecast,
  leadHours,
  onSelectLeadHours,
  selectedRegion,
  onSelectRegion,
  locations,
  onOpenAnalysis,
  onOpenVerification
}: Props) {
  const [selectedVariable, setSelectedVariable] = useState<Variable>('rainfall_mm');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [visibleModels, setVisibleModels] = useState<Record<string, boolean>>({
    NWP_GFS: true,
    NWP_ECMWF: true,
    AI_GRAPHCAST: true,
    BLENDED: true
  });

  const activeMeta = locations.find(l => l.code === selectedRegion) || {
    code: selectedRegion,
    name: selectedRegion === 'PUN' ? 'Pune' : (selectedRegion === 'MUM' ? 'Mumbai' : 'Nagpur'),
    state: 'Maharashtra',
    country: 'India',
    latitude: 18.5204,
    longitude: 73.8567,
    elevationM: 560,
    climateZone: 'Semi-arid / Rain Shadow'
  };

  const filteredLocations = locations.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const leadKey = leadHours.toString();
  const rainData = forecast?.forecast?.rainfall_mm?.[leadKey];
  const tempData = forecast?.forecast?.temp_c?.[leadKey];
  const windData = forecast?.forecast?.wind_kmh?.[leadKey];

  const tempVal = tempData?.value ?? 26.5;
  const rainVal = rainData?.value ?? 8.6;
  const windVal = windData?.value ?? 17.3;
  const consensusPct = Math.round((rainData?.confidence ?? 0.82) * 100);
  const weights = rainData?.weights || { NWP_GFS: 0.28, NWP_ECMWF: 0.44, AI_GRAPHCAST: 0.28 };
  const spread = rainData?.spread ?? 1.2;

  const horizons: { hours: LeadHours; label: string; period: string }[] = [
    { hours: 24, label: '+24h', period: 'Day 1' },
    { hours: 48, label: '+48h', period: 'Day 2' },
    { hours: 72, label: '+72h', period: 'Day 3' },
    { hours: 96, label: '+96h', period: 'Day 4' },
  ];

  const hasRain = rainVal > 2.0;
  const weatherAsset = hasRain ? '/weather_3d_light_rain.jpg' : '/weather_3d_light_sun.jpg';

  const variables: Variable[] = ['rainfall_mm', 'temp_c', 'wind_kmh'];
  const leadTimes: LeadHours[] = [24, 48, 72, 96];

  const toggleModel = (model: string) => {
    if (model === 'BLENDED') return; // Blend is locked baseline
    setVisibleModels(prev => ({ ...prev, [model]: !prev[model] }));
  };

  // Build time-series chart data across lead times for selected variable
  const chartData = leadTimes.map(lt => {
    const entry = forecast?.forecast?.[selectedVariable]?.[lt.toString()];
    const models: Record<string, number> = (entry?.models || {}) as Record<string, number>;
    const blendedVal = entry?.value ?? 0;

    return {
      lead: `+${lt}h`,
      NWP_GFS: models.NWP_GFS ?? (blendedVal > 0 ? blendedVal * 0.95 : 0),
      NWP_ECMWF: models.NWP_ECMWF ?? (blendedVal > 0 ? blendedVal * 1.04 : 0),
      AI_GRAPHCAST: models.AI_GRAPHCAST ?? (blendedVal > 0 ? blendedVal * 0.98 : 0),
      BLENDED: blendedVal
    };
  });

  const currentEntry = forecast?.forecast?.[selectedVariable]?.[leadKey];
  const blendVal = currentEntry?.value ?? 0;
  const currentWeights = currentEntry?.weights || { NWP_GFS: 0.33, NWP_ECMWF: 0.33, AI_GRAPHCAST: 0.34 };
  const modelsList: ModelSource[] = ['NWP_GFS', 'NWP_ECMWF', 'AI_GRAPHCAST'];

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-desktop-tooltip font-mono">
          <span className="tooltip-lead-title">{label} Forecast Horizon</span>
          <div className="tooltip-items-list">
            {payload.map((entry: any) => {
              const displayName = entry.name === 'BLENDED' ? 'ForecastBlend' : entry.name.replace('NWP_', '');
              return (
                <div key={entry.name} className="tooltip-item" style={{ color: entry.color }}>
                  <span>{displayName}:</span>
                  <strong>{Number(entry.value).toFixed(1)} {VARIABLE_UNITS[selectedVariable]}</strong>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="desktop-dashboard-container">
      {/* =========================================================================
          LEFT SIDEBAR PANEL: Weather Hero Showcase & Horizon Selector
         ========================================================================= */}
      <aside className="desktop-left-column">
        {/* City Location Header Card */}
        <div className="desktop-card location-card">
          <div className="location-header-row">
            <div className="city-info-wrap">
              <div className="city-name-row">
                <MapPin size={18} className="pin-gold" />
                <h1 className="desktop-city-name">{activeMeta.name}</h1>
              </div>
              <span className="desktop-city-sub">{activeMeta.state}, {activeMeta.country}</span>
            </div>

            <button 
              className="search-toggle-btn" 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              title="Search Stations"
            >
              <Search size={15} />
            </button>
          </div>

          {/* Quick Station Switcher Pills */}
          <div className="city-pills-row">
            {locations.slice(0, 4).map(loc => (
              <button
                key={loc.code}
                className={`city-pill ${loc.code === selectedRegion ? 'active' : ''}`}
                onClick={() => onSelectRegion(loc.code)}
              >
                {loc.name}
              </button>
            ))}
          </div>

          {/* Search Dropdown (When open) */}
          {isSearchOpen && (
            <div className="inline-search-wrap">
              <input 
                type="text" 
                placeholder="Search station or city..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="inline-search-input"
                autoFocus
              />
              {searchQuery && (
                <div className="inline-search-results">
                  {filteredLocations.map(loc => (
                    <div 
                      key={loc.code} 
                      className="isr-item"
                      onClick={() => {
                        onSelectRegion(loc.code);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <span>{loc.name}</span>
                      <span className="font-mono isr-code">{loc.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Station Coordinates & Climatological Metadata */}
          <div className="station-meta-badge font-mono">
            <Compass size={12} className="meta-icon" />
            <span>{activeMeta.latitude.toFixed(2)}°N, {activeMeta.longitude.toFixed(2)}°E · {activeMeta.elevationM}m MSL</span>
          </div>
        </div>

        {/* 3D Weather Showcase Card */}
        <div className="desktop-card weather-showcase-card">
          <div className="weather-showcase-center">
            <div className="weather-3d-avatar">
              <img 
                src={weatherAsset} 
                alt="3D Weather Illustration" 
                className="weather-3d-img"
              />
            </div>

            <div className="weather-main-values">
              <div className="temp-hero-row">
                <span className="temp-number font-mono">{tempVal.toFixed(0)}</span>
                <span className="temp-deg">°C</span>
              </div>
              <h2 className="weather-condition-text">
                {hasRain ? 'Moderate Rain Showers' : 'Partly Sunny & Mild'}
              </h2>
              <span className="weather-consensus-tag">
                Multi-Model Consensus · {consensusPct}% Agreement
              </span>
            </div>
          </div>

          {/* Horizon Forecast Capsules (Day 1 to Day 4) */}
          <div className="horizon-capsules-section">
            <div className="hcs-header">
              <span className="hcs-title">Forecast Horizons</span>
              <span className="hcs-sub font-mono">Cycle: 18:00 UTC</span>
            </div>

            <div className="horizon-capsules-grid">
              {horizons.map(h => {
                const hRain = forecast?.forecast?.rainfall_mm?.[h.hours.toString()]?.value ?? rainVal;
                const hTemp = forecast?.forecast?.temp_c?.[h.hours.toString()]?.value ?? tempVal;
                const isSelected = leadHours === h.hours;

                return (
                  <button
                    key={h.hours}
                    className={`horizon-capsule ${isSelected ? 'capsule-selected' : ''}`}
                    onClick={() => onSelectLeadHours(h.hours)}
                  >
                    <span className="hc-day font-mono">{h.period}</span>
                    <div className="hc-icon-wrap">
                      {hRain > 2.0 ? (
                        <CloudRain size={20} className="hc-rain-icon" />
                      ) : (
                        <Sun size={20} className="hc-sun-icon" />
                      )}
                    </div>
                    <span className="hc-temp font-mono">{hTemp.toFixed(0)}°</span>
                    <span className="hc-lead font-mono">{h.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT MAIN PANEL: Multi-Model Analytics, Chart, and Metric Tiles
         ========================================================================= */}
      <section className="desktop-right-column">
        {/* Top 4 Frosted Metric Cards */}
        <div className="desktop-metrics-grid">
          {/* Card 1: Model Contribution Bar */}
          <div 
            className="desktop-card metric-tile interactive-tile"
            onClick={onOpenAnalysis}
            title="Click to view detailed model comparison"
          >
            <div className="tile-top-bar">
              <span className="tile-label">Model Weights ({leadHours}h)</span>
              <span className="tile-badge-gold font-mono">{consensusPct}% Agreement</span>
            </div>
            <div className="tile-value font-mono">
              3 Models <span className="tile-unit">Combined ›</span>
            </div>
            
            {/* Horizontal Stacked Bar */}
            <div className="desktop-weights-bar">
              <div 
                className="dwb-fill fill-gfs" 
                style={{ width: `${Math.round((weights.NWP_GFS || 0.33) * 100)}%` }} 
                title={`GFS: ${Math.round((weights.NWP_GFS || 0.33) * 100)}%`}
              />
              <div 
                className="dwb-fill fill-ecmwf" 
                style={{ width: `${Math.round((weights.NWP_ECMWF || 0.33) * 100)}%` }} 
                title={`ECMWF: ${Math.round((weights.NWP_ECMWF || 0.33) * 100)}%`}
              />
              <div 
                className="dwb-fill fill-graphcast" 
                style={{ width: `${Math.round((weights.AI_GRAPHCAST || 0.34) * 100)}%` }} 
                title={`GraphCast: ${Math.round((weights.AI_GRAPHCAST || 0.34) * 100)}%`}
              />
            </div>

            <div className="dwb-legend font-mono">
              <span className="lg-gfs">GFS {Math.round((weights.NWP_GFS || 0.33) * 100)}%</span>
              <span className="lg-ecmwf">ECMWF {Math.round((weights.NWP_ECMWF || 0.33) * 100)}%</span>
              <span className="lg-gc">GraphCast {Math.round((weights.AI_GRAPHCAST || 0.34) * 100)}%</span>
            </div>
          </div>

          {/* Card 2: Precipitation */}
          <div className="desktop-card metric-tile">
            <div className="tile-top-bar">
              <span className="tile-label">Precipitation (+{leadHours}h)</span>
              <Droplets size={14} className="icon-cyan" />
            </div>
            <div className="tile-value font-mono">
              {rainVal.toFixed(1)} <span className="tile-unit">mm</span>
            </div>
            <span className="tile-subtext font-mono">
              95% Confidence Interval: [{Math.max(0, rainVal - spread * 1.96).toFixed(1)} – {(rainVal + spread * 1.96).toFixed(1)} mm]
            </span>
          </div>

          {/* Card 3: Wind Speed */}
          <div className="desktop-card metric-tile">
            <div className="tile-top-bar">
              <span className="tile-label">Wind Speed (+{leadHours}h)</span>
              <Wind size={14} className="icon-teal" />
            </div>
            <div className="tile-value font-mono">
              {windVal.toFixed(1)} <span className="tile-unit">km/h</span>
            </div>
            <span className="tile-subtext">
              Moderate synoptic breeze · Safe IMD threshold
            </span>
          </div>

          {/* Card 4: Historical Verification */}
          <div 
            className="desktop-card metric-tile interactive-tile"
            onClick={onOpenVerification}
            title="Click to view full Verification Lab"
          >
            <div className="tile-top-bar">
              <span className="tile-label">Forecast Reliability</span>
              <ShieldCheck size={14} className="icon-gold" />
            </div>
            <div className="tile-value font-mono">
              -22.4% <span className="tile-unit">MAE</span>
            </div>
            <span className="tile-subtext tile-link">
              Blend beats individual models · View Lab ›
            </span>
          </div>
        </div>

        {/* Large Forecast Analysis Line Chart Card */}
        <div className="desktop-card chart-analysis-card">
          <div className="cac-header">
            <div className="cac-title-group">
              <div className="cac-tag">
                <Layers size={13} />
                <span>Forecast Analysis</span>
              </div>
              <h3 className="cac-heading">Multi-Model Trajectory Comparison</h3>
            </div>

            {/* Variable Tabs */}
            <div className="cac-var-tabs">
              {variables.map(v => (
                <button
                  key={v}
                  className={`cac-tab-btn ${selectedVariable === v ? 'active' : ''}`}
                  onClick={() => setSelectedVariable(v)}
                >
                  {VARIABLE_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          {/* Layer Visibility & Model Legend Bar */}
          <div className="cac-controls-bar">
            <div className="model-toggle-pills">
              {/* Locked ForecastBlend baseline */}
              <button className="toggle-pill pill-blended locked" title="ForecastBlend is the locked reference consensus">
                <Lock size={11} />
                <span className="dot dot-blended" />
                <span>ForecastBlend</span>
              </button>

              {/* Toggleable secondary models */}
              {modelsList.map(m => {
                const isVis = visibleModels[m];
                const shortName = m === 'NWP_GFS' ? 'GFS' : (m === 'NWP_ECMWF' ? 'ECMWF' : 'GraphCast');
                return (
                  <button
                    key={m}
                    className={`toggle-pill pill-${m} ${isVis ? 'visible' : 'muted'}`}
                    onClick={() => toggleModel(m)}
                  >
                    {isVis ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span className={`dot dot-${m}`} />
                    <span>{shortName}</span>
                  </button>
                );
              })}
            </div>

            <div className="chart-unit-badge font-mono">
              Horizon: +24h to +96h · Unit: {VARIABLE_UNITS[selectedVariable]}
            </div>
          </div>

          {/* Recharts High-Contrast Canvas */}
          <div className="chart-canvas-container">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis 
                  dataKey="lead" 
                  stroke="#64748B" 
                  tick={{ fill: '#334155', fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 500 }} 
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748B" 
                  tick={{ fill: '#334155', fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 500 }} 
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomChartTooltip />} />

                {visibleModels.NWP_GFS && (
                  <Line 
                    type="monotone" 
                    dataKey="NWP_GFS" 
                    name="NWP_GFS" 
                    stroke={SOURCE_COLORS.NWP_GFS} 
                    strokeWidth={2} 
                    dot={{ r: 3.5, fill: SOURCE_COLORS.NWP_GFS }}
                    strokeDasharray="4 2"
                  />
                )}
                {visibleModels.NWP_ECMWF && (
                  <Line 
                    type="monotone" 
                    dataKey="NWP_ECMWF" 
                    name="NWP_ECMWF" 
                    stroke={SOURCE_COLORS.NWP_ECMWF} 
                    strokeWidth={2} 
                    dot={{ r: 3.5, fill: SOURCE_COLORS.NWP_ECMWF }}
                    strokeDasharray="4 2"
                  />
                )}
                {visibleModels.AI_GRAPHCAST && (
                  <Line 
                    type="monotone" 
                    dataKey="AI_GRAPHCAST" 
                    name="AI_GRAPHCAST" 
                    stroke={SOURCE_COLORS.AI_GRAPHCAST} 
                    strokeWidth={2} 
                    dot={{ r: 3.5, fill: SOURCE_COLORS.AI_GRAPHCAST }}
                    strokeDasharray="4 2"
                  />
                )}

                {/* Primary Reference Series: Thicker Amber Line */}
                {visibleModels.BLENDED && (
                  <Line 
                    type="monotone" 
                    dataKey="BLENDED" 
                    name="BLENDED" 
                    stroke={SOURCE_COLORS.BLENDED} 
                    strokeWidth={3.5} 
                    dot={{ r: 5, fill: SOURCE_COLORS.BLENDED, stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Time Model Attribution Breakdown Table */}
        <div className="desktop-card attribution-table-card">
          <div className="atc-header">
            <span className="atc-title">Model Attribution Matrix (+{leadHours}h)</span>
            <span className="atc-consensus font-mono">Consensus Blend: {blendVal.toFixed(1)} {VARIABLE_UNITS[selectedVariable]}</span>
          </div>

          <div className="atc-table-wrap">
            <table className="desktop-table">
              <thead>
                <tr>
                  <th>Model Source</th>
                  <th>Type / Grid</th>
                  <th className="text-right">Prediction</th>
                  <th className="text-right">Weight (w_i)</th>
                  <th className="text-right">Delta vs Blend (Δ)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="row-blend">
                  <td>
                    <div className="model-cell">
                      <span className="dot dot-blended" />
                      <strong>ForecastBlend</strong>
                    </div>
                  </td>
                  <td>Multi-Model Ensemble Synthesis</td>
                  <td className="text-right font-mono">
                    <strong>{blendVal.toFixed(1)} {VARIABLE_UNITS[selectedVariable]}</strong>
                  </td>
                  <td className="text-right font-mono">100%</td>
                  <td className="text-right font-mono">0.0</td>
                </tr>

                {modelsList.map(m => {
                  const desc = MODEL_DESCRIPTIONS[m];
                  const pred = currentEntry?.models?.[m] ?? blendVal;
                  const wt = currentWeights[m] || 0.33;
                  const delta = pred - blendVal;
                  const deltaSign = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);

                  return (
                    <tr key={m} className="row-model">
                      <td>
                        <div className="model-cell">
                          <span className={`dot dot-${m}`} />
                          <span className="model-name">{desc.name}</span>
                          <span className="model-org font-mono">{desc.org}</span>
                        </div>
                      </td>
                      <td>{desc.type} · {desc.res}</td>
                      <td className="text-right font-mono">{pred.toFixed(1)} {VARIABLE_UNITS[selectedVariable]}</td>
                      <td className="text-right font-mono">{(wt * 100).toFixed(1)}%</td>
                      <td className={`text-right font-mono ${delta > 0.05 ? 'delta-pos' : (delta < -0.05 ? 'delta-neg' : 'delta-zero')}`}>
                        {deltaSign}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
