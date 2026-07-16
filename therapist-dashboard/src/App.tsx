import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import './App.css';

// Database-conforming Session Interface
interface SessionData {
  reps: number;
  peak_rom: number; // in degrees
  duration_ms: number;
  pain_flag: 'none' | 'mild' | 'stopped';
  created_at: number; // timestamp
}

// Simple, high-performance SVG Icons to avoid Windows OS resource handle leaks
const Icon = ({ name, size = 16, className = "", style = {} }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) => {
  switch (name) {
    case 'activity':
      return (
        <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case 'check-circle':
      return (
        <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'bar-chart':
      return (
        <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case 'calendar':
      return (
        <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'clock':
      return (
        <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'sliders':
      return (
        <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="2" y1="14" x2="6" y2="14" />
          <line x1="10" y1="8" x2="14" y2="8" />
          <line x1="18" y1="16" x2="22" y2="16" />
        </svg>
      );
    case 'shield-alert':
      return (
        <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case 'user':
      return (
        <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'download':
      return (
        <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    default:
      return null;
  }
};

// Initial dummy session data conforming to database shape
const INITIAL_SESSIONS: SessionData[] = [
  {
    reps: 6,
    peak_rom: 55,
    duration_ms: 45000,
    pain_flag: 'none',
    created_at: Date.now() - 6 * 24 * 3600 * 1000,
  },
  {
    reps: 8,
    peak_rom: 62,
    duration_ms: 55000,
    pain_flag: 'mild',
    created_at: Date.now() - 5 * 24 * 3600 * 1000,
  },
  {
    reps: 10,
    peak_rom: 70,
    duration_ms: 72000,
    pain_flag: 'none',
    created_at: Date.now() - 4 * 24 * 3600 * 1000,
  },
  {
    reps: 10,
    peak_rom: 88,
    duration_ms: 68000,
    pain_flag: 'none',
    created_at: Date.now() - 3 * 24 * 3600 * 1000,
  },
  {
    reps: 5,
    peak_rom: 96, // Exceeded ceiling warning limit (e.g. limit is 90)
    duration_ms: 32000,
    pain_flag: 'stopped', // Stopped for pain warning!
    created_at: Date.now() - 2 * 24 * 3600 * 1000,
  },
  {
    reps: 12,
    peak_rom: 82,
    duration_ms: 88000,
    pain_flag: 'none',
    created_at: Date.now() - 1 * 24 * 3600 * 1000,
  },
  {
    reps: 12,
    peak_rom: 85,
    duration_ms: 85000,
    pain_flag: 'none',
    created_at: Date.now() - 4 * 3600 * 1000,
  }
];

// Sparkline dummy progressions matching each KPI
const SPARKLINE_ADHERENCE = [
  { value: 30 }, { value: 45 }, { value: 50 }, { value: 65 }, { value: 75 }, { value: 85 }
];
const SPARKLINE_ROM = [
  { value: 55 }, { value: 62 }, { value: 70 }, { value: 88 }, { value: 96 }, { value: 85 }
];
const SPARKLINE_DOSE = [
  { value: 6 }, { value: 8 }, { value: 10 }, { value: 10 }, { value: 5 }, { value: 12 }
];

export default function App() {
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<string>('Dashboard');

  // Prescription input states
  const [targetRom, setTargetRom] = useState<number>(80);
  const [romCeiling, setRomCeiling] = useState<number>(90);
  const [targetReps, setTargetReps] = useState<number>(10);
  const [exercise, setExercise] = useState<string>('Forearm supination/pronation');

  // Form submission feedback states
  const [savedPrescription, setSavedPrescription] = useState({
    targetRom: 80,
    romCeiling: 90,
    targetReps: 10,
    exercise: 'Forearm supination/pronation'
  });
  const [showToast, setShowToast] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Active sessions data state
  const [sessions] = useState<SessionData[]>(INITIAL_SESSIONS);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (romCeiling <= targetRom) {
      setValidationError('ROM ceiling must be strictly greater than the target ROM safety threshold.');
      return;
    }
    setValidationError(null);
    setSavedPrescription({
      targetRom,
      romCeiling,
      targetReps,
      exercise
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Date utilities
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formatDate = (ts: number): string => {
    const d = new Date(ts);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
  };

  const formatDuration = (ms: number): string => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return m > 0 ? `${m}m ${rs}s` : `${rs}s`;
  };

  // Telemetry metric calculations
  const totalRepsCompleted = sessions.reduce((sum, s) => sum + s.reps, 0);
  const avgPeakRom = sessions.reduce((sum, s) => sum + s.peak_rom, 0) / sessions.length;
  const adherenceRate = Math.min(100, Math.round((sessions.length / 7) * 100));

  return (
    <div className="dashboard-container">
      {/* Decorative background swirls */}
      <div className="bg-gradient-swirl top-swirl"></div>
      <div className="bg-gradient-swirl bottom-swirl"></div>

      {/* Header Panel */}
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="brand-logo-wrapper">
            <Icon name="activity" className="brand-icon" />
          </div>
          <span className="brand-name">MindWise <span className="brand-divider">/</span> <span className="brand-subname">Clinical</span></span>
        </div>

        {/* Center Pill Nav Bar */}
        <nav className="pill-navigation">
          {['Dashboard', 'My Journal', 'Therapy', 'Reports', 'Settings'].map((tab) => (
            <button 
              key={tab}
              className={`nav-pill-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Right Session / Profile Area */}
        <div className="profile-session-area">
          <span className="current-clock">18:29</span>
          <div className="vertical-divider"></div>
          <div className="user-profile-widget">
            <div className="profile-details">
              <span className="profile-name">Carl Manfred</span>
              <span className="profile-role">Physiotherapist</span>
            </div>
            <div className="profile-avatar">
              <Icon name="user" size={16} style={{ color: '#c084fc' }} />
            </div>
          </div>
        </div>
      </header>

      {/* Sub-header Breadcrumbs & Meta info */}
      <div className="subheader-section">
        <div className="breadcrumb-trail">
          <span className="crumb-inactive">Dashboard</span>
          <span className="crumb-separator">/</span>
          <span className="crumb-active">General</span>
        </div>
        <div className="calendar-indicator">
          <Icon name="calendar" size={13} style={{ marginRight: 6 }} />
          <span>{formattedToday}</span>
        </div>
      </div>

      <h1 className="dashboard-title">Overall Statistics</h1>

      {/* Dashboard Main Matrix Grid */}
      <main className="dashboard-grid">
        
        {/* Left Column: KPI Metric Cards & Session Schedule */}
        <section className="left-column">
          
          {/* KPI Sparkline row */}
          <div className="kpi-cards-row">
            {/* KPI 1: Adherence */}
            <div className="kpi-card glassmorphic">
              <div className="kpi-meta">
                <span className="kpi-label">Weekly Adherence</span>
                <span className="kpi-value">{adherenceRate}%</span>
                <span className="kpi-change text-green">+20% this month</span>
              </div>
              <div className="kpi-sparkline">
                <ResponsiveContainer width="100%" height={36}>
                  <AreaChart data={SPARKLINE_ADHERENCE}>
                    <defs>
                      <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e676" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#00e676" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#00e676" strokeWidth={2} fillOpacity={1} fill="url(#colorGreen)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* KPI 2: ROM */}
            <div className="kpi-card glassmorphic">
              <div className="kpi-meta">
                <span className="kpi-label">Avg Peak ROM</span>
                <span className="kpi-value">{avgPeakRom.toFixed(0)}°</span>
                <span className="kpi-change text-green">+8° this month</span>
              </div>
              <div className="kpi-sparkline">
                <ResponsiveContainer width="100%" height={36}>
                  <AreaChart data={SPARKLINE_ROM}>
                    <defs>
                      <linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#00e5ff" strokeWidth={2} fillOpacity={1} fill="url(#colorCyan)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* KPI 3: Dose */}
            <div className="kpi-card glassmorphic">
              <div className="kpi-meta">
                <span className="kpi-label">Total Dose</span>
                <span className="kpi-value">{totalRepsCompleted} reps</span>
                <span className="kpi-change text-danger">-2% this week</span>
              </div>
              <div className="kpi-sparkline">
                <ResponsiveContainer width="100%" height={36}>
                  <AreaChart data={SPARKLINE_DOSE}>
                    <defs>
                      <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff5252" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ff5252" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#ff5252" strokeWidth={2} fillOpacity={1} fill="url(#colorRed)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Session History Table Card */}
          <div className="card table-card glassmorphic">
            <div className="card-header border-bottom">
              <div className="header-title-wrapper">
                <Icon name="calendar" className="card-header-icon" />
                <div>
                  <h2>Session History Log</h2>
                  <p className="card-subtitle">Detailed telemetry logs of all exercises completed by Budi Setiawan</p>
                </div>
              </div>
              <span className="demo-badge">DATA CONTOH / ILUSTRASI</span>
            </div>

            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Exercise</th>
                    <th>Reps</th>
                    <th>Peak ROM</th>
                    <th>Duration</th>
                    <th>Safety Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, idx) => {
                    const isExceeded = s.peak_rom > savedPrescription.romCeiling;
                    return (
                      <tr 
                        key={idx} 
                        className={
                          s.pain_flag === 'stopped' 
                            ? 'row-danger' 
                            : (isExceeded ? 'row-warning' : '')
                        }
                      >
                        <td className="cell-datetime">
                          <Icon name="calendar" size={12} style={{ marginRight: 6, color: '#a0aec0' }} />
                          {formatDate(s.created_at)}
                        </td>
                        <td>Forearm supination/pronation</td>
                        <td className="text-center font-bold">{s.reps}</td>
                        <td className={`font-bold ${isExceeded ? 'color-danger' : 'color-cyan'}`}>
                          {s.peak_rom}°
                        </td>
                        <td className="cell-duration">
                          <Icon name="clock" size={12} style={{ marginRight: 6, color: '#a0aec0' }} />
                          {formatDuration(s.duration_ms)}
                        </td>
                        <td>
                          {s.pain_flag === 'stopped' && (
                            <span className="badge badge-danger">Stopped for Pain</span>
                          )}
                          {s.pain_flag === 'mild' && (
                            <span className="badge badge-warning">Mild Discomfort</span>
                          )}
                          {s.pain_flag === 'none' && !isExceeded && (
                            <span className="badge badge-success">Safe Sweeps</span>
                          )}
                          {isExceeded && (
                            <span className="badge badge-danger-outline">Ceiling Exceeded</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right Column: Prescription Control & ROM Recovery Trend */}
        <section className="right-column">
          
          {/* ROM Recovery Trend Chart Card */}
          <div className="card chart-card-container glassmorphic">
            <div className="card-header border-bottom">
              <Icon name="bar-chart" className="card-header-icon" />
              <div>
                <h2>ROM Recovery Trend</h2>
                <p className="card-subtitle">Plots peak Range of Motion (ROM) per session against target limits</p>
              </div>
              <span className="demo-badge">DATA CONTOH / ILUSTRASI</span>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart 
                  data={sessions.map(s => ({
                    ...s,
                    dateLabel: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }))}
                  margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis 
                    dataKey="dateLabel" 
                    stroke="#a0aec0" 
                    fontSize={10} 
                    fontWeight="bold" 
                  />
                  <YAxis 
                    stroke="#a0aec0" 
                    fontSize={10} 
                    fontWeight="bold"
                    domain={[0, 120]} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(30, 24, 43, 0.95)', 
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderRadius: 8
                    }}
                    labelStyle={{ color: '#a0aec0', fontWeight: 'bold' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <ReferenceLine 
                    y={savedPrescription.targetRom} 
                    stroke="#00e676" 
                    strokeDasharray="4 4"
                    label={{ 
                      value: `Target: ${savedPrescription.targetRom}°`, 
                      fill: '#00e676', 
                      position: 'top',
                      fontSize: 10,
                      fontWeight: 'bold'
                    }} 
                  />
                  <ReferenceLine 
                    y={savedPrescription.romCeiling} 
                    stroke="#ff5252" 
                    strokeDasharray="4 4"
                    label={{ 
                      value: `Ceiling: ${savedPrescription.romCeiling}°`, 
                      fill: '#ff5252', 
                      position: 'top',
                      fontSize: 10,
                      fontWeight: 'bold'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="peak_rom" 
                    name="Peak ROM" 
                    stroke="#00e5ff" 
                    strokeWidth={3} 
                    dot={{ r: 5, strokeWidth: 2 }}
                    activeDot={{ r: 7 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-legend">
              <div className="legend-marker">
                <span className="dot dot-cyan"></span>
                <span>Peak ROM Achieved (°)</span>
              </div>
              <div className="legend-marker">
                <span className="line-dash line-green"></span>
                <span>Target ROM Limit</span>
              </div>
              <div className="legend-marker">
                <span className="line-dash line-red"></span>
                <span>Safety Ceiling Limit</span>
              </div>
            </div>
          </div>

          {/* Therapist Prescription Form Control (Upper Right widget style) */}
          <div className="card prescription-card glassmorphic">
            <div className="card-header border-bottom">
              <Icon name="sliders" className="card-header-icon" />
              <div>
                <h2>Clinical Prescription</h2>
                <p className="card-subtitle">Modify Budi's rehabilitation threshold limits</p>
              </div>
            </div>
            
            <form onSubmit={handleSave} className="prescription-form">
              <div className="form-group">
                <label htmlFor="exercise-select">Select Prescribed Exercise</label>
                <select 
                  id="exercise-select"
                  value={exercise} 
                  onChange={(e) => setExercise(e.target.value)}
                >
                  <option value="Forearm supination/pronation">Forearm supination/pronation</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="target-rom-input">Target ROM (°)</label>
                  <input 
                    id="target-rom-input"
                    type="number" 
                    value={targetRom} 
                    onChange={(e) => setTargetRom(parseInt(e.target.value) || 0)}
                    min="1" 
                    max="180"
                  />
                </div>
                <div className="form-group flex-1">
                  <label htmlFor="rom-ceiling-input">ROM Ceiling (°)</label>
                  <input 
                    id="rom-ceiling-input"
                    type="number" 
                    value={romCeiling} 
                    onChange={(e) => setRomCeiling(parseInt(e.target.value) || 0)}
                    min="1" 
                    max="180"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="target-reps-input">Target Repetitions per Session</label>
                <input 
                  id="target-reps-input"
                  type="number" 
                  value={targetReps} 
                  onChange={(e) => setTargetReps(parseInt(e.target.value) || 0)}
                  min="1" 
                  max="50"
                />
              </div>

              {validationError && (
                <div className="error-alert">
                  <Icon name="shield-alert" size={15} className="alert-icon" />
                  <span>{validationError}</span>
                </div>
              )}

              <button type="submit" className="save-btn">
                Update Prescription
              </button>
            </form>

            {showToast && (
              <div className="toast-success">
                <Icon name="check-circle" size={15} className="toast-icon" />
                <span>Prescription updated successfully!</span>
              </div>
            )}
          </div>

          {/* Download Reports Resource (Lower Right full-bleed media look) */}
          <div className="card download-report-card glassmorphic">
            <div className="report-card-overlay">
              <div className="report-card-content">
                <h3>Download clinical report</h3>
                <p>Export all historical forearm rehabilitation telemetry metrics as an official PDF report.</p>
                <button className="download-pill-btn">
                  <Icon name="download" size={14} style={{ marginRight: 6 }} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer disclaimer */}
      <footer className="dashboard-footer">
        <p>* Catatan: Halaman ini adalah demo visual portal terapis (MVP) dengan data dummy / ilustrasi terisolasi. Tidak tersambung ke database production. *</p>
      </footer>
    </div>
  );
}
