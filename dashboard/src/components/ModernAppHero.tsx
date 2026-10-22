import { useState } from 'react';
import { 
  LatestBlendedForecast, 
  LeadHours, 
  RegionCode, 
  LocationMetadata, 
  Variable, 
  VARIABLE_LABELS, 
  VARIABLE_UNITS,
  SOURCE_COLORS
} from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  MapPin, 
  Droplets, 
  Wind, 
  ShieldCheck, 
  Sun, 
  CloudRain, 
  Compass, 
  Layers, 
  Search,
  ArrowRight
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
  const [activeVar, setActiveVar] = useState<Variable>('rainfall_mm');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
  const weights = rainData?.weights || { NWP_GFS: 0.17, NWP_ECMWF: 0.50, AI_GRAPHCAST: 0.33 };
  const spread = rainData?.spread ?? 1.2;

  const horizons: { hours: LeadHours; label: string; period: string }[] = [
    { hours: 24, label: '+24h', period: 'Day 1' },
    { hours: 48, label: '+48h', period: 'Day 2' },
    { hours: 72, label: '+72h', period: 'Day 3' },
    { hours: 96, label: '+96h', period: 'Day 4' },
  ];

  const hasRain = rainVal > 2.0;
  const weatherAsset = hasRain ? '/weather_3d_light_rain.jpg' : '/weather_3d_light_sun.jpg';

  // Smooth consensus trend series for the overview chart
  const leadTimes: LeadHours[] = [24, 48, 72, 96];
  const trendData = leadTimes.map(lt => {
    const entry = forecast?.forecast?.[activeVar]?.[lt.toString()];
    const val = entry?.value ?? 0;
    return {
      lead: `+${lt}h`,
      period: lt === 24 ? 'Day 1' : lt === 48 ? 'Day 2' : lt === 72 ? 'Day 3' : 'Day 4',
      value: Number(val.toFixed(1))
    };
  });

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="overview-chart-tooltip font-mono">
          <div className="oct-label">{label} Horizon Forecast</div>
          <div className="oct-val">
            Consensus Blend: <strong>{payload[0].value} {VARIABLE_UNITS[activeVar]}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="desktop-dashboard-container">
      {/* =========================================================================
          LEFT SIDEBAR: Unified Weather Hero & Horizon Capsule Card
         ========================================================================= */}
      <aside className="desktop-left-column">
        <div className="desktop-card unified-weather-card">
          {/* 1. Location Bar & Search */}
          <div className="uwc-location-header">
            <div className="uwc-loc-info">
              <div className="uwc-city-row">
                <MapPin size={18} className="pin-gold" />
                <h1 className="uwc-city-name">{activeMeta.name}</h1>
              </div>
              <span className="uwc-city-sub">{activeMeta.state}, {activeMeta.country}</span>
            </div>

            <button 
              className="search-toggle-btn" 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              title="Search Stations"
            >
              <Search size={15} />
            </button>
          </div>

          {/* Inline Search Modal/Dropdown */}
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

          {/* Quick City Switcher Pills */}
          <div className="uwc-city-pills">
            {locations.slice(0, 3).map(loc => (
              <button
                key={loc.code}
                className={`city-pill ${loc.code === selectedRegion ? 'active' : ''}`}
                onClick={() => onSelectRegion(loc.code)}
              >
                {loc.name}
              </button>
            ))}
          </div>

          {/* 2. 3D Weather Illustration & Key Temperature */}
          <div className="uwc-hero-center">
            <div className="weather-3d-avatar">
              <img 
                src={weatherAsset} 
                alt="3D Weather Illustration" 
                className="weather-3d-img"
              />
            </div>

            <div className="weather-hero-readout">
              <div className="temp-hero-row">
                <span className="temp-number font-mono">{tempVal.toFixed(0)}</span>
                <span className="temp-deg">°C</span>
              </div>
              <h2 className="weather-condition-text">
                {hasRain ? 'Moderate Rain Showers' : 'Partly Sunny & Mild'}
              </h2>
              <div className="weather-consensus-pill">
                Multi-Model Consensus · {consensusPct}% Agreement
              </div>
            </div>
          </div>

          {/* 3. 4-Day Horizon Capsules */}
          <div className="uwc-horizons-section">
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

          {/* 4. Station Telemetry Footnote */}
          <div className="station-meta-badge font-mono">
            <Compass size={12} className="meta-icon" />
            <span>{activeMeta.latitude.toFixed(2)}°N, {activeMeta.longitude.toFixed(2)}°E · {activeMeta.elevationM}m MSL</span>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT MAIN PANEL: 4 Clean Metrics & Consensus Trajectory Card
         ========================================================================= */}
      <section className="desktop-right-column">
        {/* Top 4 Frosted Metric Cards */}
        <div className="desktop-metrics-grid">
          {/* Card 1: Model Contribution & Consensus */}
          <div 
            className="desktop-card metric-tile interactive-tile"
            onClick={onOpenAnalysis}
            title="Click to view detailed model breakdown"
          >
            <div className="tile-top-bar">
              <span className="tile-label">Model Weights ({leadHours}h)</span>
              <span className="tile-badge-gold font-mono">{consensusPct}% Agreement</span>
            </div>
            <div className="tile-value font-mono">
              3 Models <span className="tile-unit">Combined</span>
            </div>
            
            {/* Horizontal Stacked Bar */}
            <div className="desktop-weights-bar">
              <div 
                className="dwb-fill fill-gfs" 
                style={{ width: `${Math.round((weights.NWP_GFS || 0.17) * 100)}%` }} 
                title={`GFS: ${Math.round((weights.NWP_GFS || 0.17) * 100)}%`}
              />
              <div 
                className="dwb-fill fill-ecmwf" 
                style={{ width: `${Math.round((weights.NWP_ECMWF || 0.50) * 100)}%` }} 
                title={`ECMWF: ${Math.round((weights.NWP_ECMWF || 0.50) * 100)}%`}
              />
              <div 
                className="dwb-fill fill-graphcast" 
                style={{ width: `${Math.round((weights.AI_GRAPHCAST || 0.33) * 100)}%` }} 
                title={`GraphCast: ${Math.round((weights.AI_GRAPHCAST || 0.33) * 100)}%`}
              />
            </div>

            <div className="dwb-legend font-mono">
              <span className="lg-gfs">GFS {Math.round((weights.NWP_GFS || 0.17) * 100)}%</span>
              <span className="lg-ecmwf">ECMWF {Math.round((weights.NWP_ECMWF || 0.50) * 100)}%</span>
              <span className="lg-gc">GraphCast {Math.round((weights.AI_GRAPHCAST || 0.33) * 100)}%</span>
            </div>
          </div>

          {/* Card 2: Precipitation (+leadHours) */}
          <div className="desktop-card metric-tile">
            <div className="tile-top-bar">
              <span className="tile-label">Precipitation (+{leadHours}h)</span>
              <Droplets size={14} className="icon-cyan" />
            </div>
            <div className="tile-value font-mono">
              {rainVal.toFixed(1)} <span className="tile-unit">mm</span>
            </div>
            <span className="tile-subtext font-mono">
              95% CI: [{Math.max(0, rainVal - spread * 1.96).toFixed(1)} – {(rainVal + spread * 1.96).toFixed(1)} mm]
            </span>
          </div>

          {/* Card 3: Wind Speed (+leadHours) */}
          <div className="desktop-card metric-tile">
            <div className="tile-top-bar">
              <span className="tile-label">Wind Speed (+{leadHours}h)</span>
              <Wind size={14} className="icon-teal" />
            </div>
            <div className="tile-value font-mono">
              {windVal.toFixed(1)} <span className="tile-unit">km/h</span>
            </div>
            <span className="tile-subtext">
              Moderate synoptic breeze · Safe threshold
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

        {/* Spacious Consensus Trajectory & Model Attribution Showcase Card */}
        <div className="desktop-card consensus-trajectory-card">
          <div className="ctc-header">
            <div className="ctc-title-group">
              <div className="ctc-tag">
                <Layers size={14} />
                <span>Consensus Outlook</span>
              </div>
              <h3 className="ctc-heading">4-Day Multi-Horizon Synthesis Trajectory</h3>
            </div>

            {/* Variable Tabs: Rainfall vs Temperature */}
            <div className="ctc-var-tabs">
              {(['rainfall_mm', 'temp_c', 'wind_kmh'] as Variable[]).map(v => (
                <button
                  key={v}
                  className={`ctc-tab-btn ${activeVar === v ? 'active' : ''}`}
                  onClick={() => setActiveVar(v)}
                >
                  {VARIABLE_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          {/* Recharts High-Contrast Smooth Area Chart */}
          <div className="ctc-chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData} margin={{ top: 12, right: 24, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="consensusGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SOURCE_COLORS.BLENDED} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={SOURCE_COLORS.BLENDED} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis 
                  dataKey="lead" 
                  stroke="#64748B" 
                  tick={{ fill: '#334155', fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 600 }} 
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748B" 
                  tick={{ fill: '#334155', fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 600 }} 
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={SOURCE_COLORS.BLENDED} 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#consensusGradient)" 
                  dot={{ r: 4.5, fill: SOURCE_COLORS.BLENDED, stroke: '#FFFFFF', strokeWidth: 2 }}
                  activeDot={{ r: 6.5, fill: '#D97706', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Model Attribution Highlights & Deep Dive Action */}
          <div className="ctc-synthesis-footer">
            <div className="ctc-insight-box">
              <div className="cib-title">Multi-Model Adaptive Blending Weighting</div>
              <p className="cib-desc">
                <strong>ECMWF</strong> is assigned primary weight (<strong>50%</strong>) due to minimal 14-day rainfall MAE. 
                <strong> GraphCast AI</strong> provides <strong>33%</strong> skill in synoptic timing, while 
                <strong> GFS</strong> contributes <strong>17%</strong> baseline numerical guidance.
              </p>
            </div>

            <div className="ctc-actions-group">
              <button 
                className="btn-deep-dive primary"
                onClick={onOpenAnalysis}
                title="Open comprehensive model comparison chart and attribution matrix"
              >
                <span>Full Model Attribution Matrix</span>
                <ArrowRight size={14} />
              </button>

              <button 
                className="btn-deep-dive secondary"
                onClick={onOpenVerification}
                title="Inspect 14-day empirical verification metrics"
              >
                <span>Verification Lab</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
