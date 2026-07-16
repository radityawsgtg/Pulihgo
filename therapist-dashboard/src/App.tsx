import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { 
  Activity, 
  Clipboard, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  BarChart2, 
  Calendar, 
  Clock, 
  Sliders, 
  ShieldAlert,
  User,
  Award
} from 'lucide-react';
import './App.css';

// Database-conforming Session Interface
interface SessionData {
  reps: number;
  peak_rom: number; // in degrees
  duration_ms: number;
  pain_flag: 'none' | 'mild' | 'stopped';
  created_at: number; // timestamp
}

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

export default function App() {
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

  // Active sessions data state (can be extended)
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

  // Helper date formatter
  const formatDate = (ts: number): string => {
    const d = new Date(ts);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
  };

  // Helper duration formatter
  const formatDuration = (ms: number): string => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return m > 0 ? `${m}m ${rs}s` : `${rs}s`;
  };

  // Telemetry metric calculations
  const totalRepsCompleted = sessions.reduce((sum, s) => sum + s.reps, 0);
  const avgPeakRom = sessions.reduce((sum, s) => sum + s.peak_rom, 0) / sessions.length;
  
  // Adherence rate: let's assume 7 days in a week and therapist prescribed target runs.
  // Patient completed 7 sessions in history. Adherence represents sessions completed vs week's targets (e.g. target 6 sessions/week)
  const adherenceRate = Math.min(100, Math.round((sessions.length / 7) * 100));

  // Count warning flags
  const painHaltsCount = sessions.filter(s => s.pain_flag === 'stopped').length;
  const hyperextensionsCount = sessions.filter(s => s.peak_rom > savedPrescription.romCeiling).length;

  return (
    <div className="dashboard-container">
      {/* Header Info */}
      <header className="dashboard-header">
        <div className="header-brand">
          <Activity className="brand-icon" />
          <div>
            <h1>PulihGo Clinical Portal</h1>
            <p className="brand-subtitle">Therapist Control Panel & Analytics</p>
          </div>
        </div>
        <div className="patient-badge">
          <User className="badge-avatar-icon" />
          <div className="patient-info">
            <span className="patient-name">Budi Setiawan</span>
            <span className="patient-diagnosis">Forearm Rotation Therapy • Left Elbow</span>
          </div>
          <span className="active-tag">Active Recovery</span>
        </div>
      </header>

      {/* Main Grid Section */}
      <main className="dashboard-grid">
        
        {/* Left Column: Controls & Quick Stats */}
        <section className="left-column">
          {/* Prescription Card */}
          <div className="card prescription-card">
            <div className="card-header">
              <Sliders className="card-header-icon" />
              <h2>Active Therapy Prescription</h2>
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
                  <label htmlFor="rom-ceiling-input">ROM Ceiling limit (°)</label>
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
              <span className="input-hint">Ceiling must be greater than target ROM safety threshold.</span>

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
                  <ShieldAlert size={16} className="alert-icon" />
                  <span>{validationError}</span>
                </div>
              )}

              <button type="submit" className="save-btn">
                Update Prescription
              </button>
            </form>

            {showToast && (
              <div className="toast-success">
                <CheckCircle size={16} className="toast-icon" />
                <span>Prescription saved locally!</span>
              </div>
            )}
          </div>

          {/* Quick Metrics Grid */}
          <div className="metrics-grid">
            <div className="metric-box bg-dose">
              <Clipboard className="box-icon color-dose" />
              <div className="box-content">
                <span className="box-label">TOTAL DOSE</span>
                <span className="box-value">{totalRepsCompleted} reps</span>
                <span className="box-sub">Across {sessions.length} sessions</span>
              </div>
            </div>

            <div className="metric-box bg-adherence">
              <Award className="box-icon color-adherence" />
              <div className="box-content">
                <span className="box-label">WEEKLY ADHERENCE</span>
                <span className="box-value">{adherenceRate}%</span>
                <span className="box-sub">{sessions.length} of 7 target sessions</span>
              </div>
            </div>

            <div className="metric-box bg-avg">
              <TrendingUp className="box-icon color-avg" />
              <div className="box-content">
                <span className="box-label">AVG PEAK ROM</span>
                <span className="box-value">{avgPeakRom.toFixed(1)}°</span>
                <span className="box-sub">Target ROM set: {savedPrescription.targetRom}°</span>
              </div>
            </div>

            <div className="metric-box bg-alerts">
              <AlertTriangle className="box-icon color-alerts" />
              <div className="box-content">
                <span className="box-label">SAFETY INCIDENTS</span>
                <span className="box-value color-danger">{painHaltsCount + hyperextensionsCount}</span>
                <span className="box-sub">{painHaltsCount} Pain Holds • {hyperextensionsCount} Hyperextensions</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Progress Chart & History Table */}
        <section className="right-column">
          
          {/* Progress Chart Card */}
          <div className="card chart-card-container">
            <div className="card-header border-bottom">
              <BarChart2 className="card-header-icon" />
              <div>
                <h2>ROM Recovery Trend</h2>
                <p className="card-subtitle">Graph plots peak Range of Motion (ROM) per session against target limits</p>
              </div>
              <span className="demo-badge">DATA CONTOH / ILUSTRASI</span>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart 
                  data={sessions.map(s => ({
                    ...s,
                    dateLabel: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }))}
                  margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(142, 154, 160, 0.1)" />
                  <XAxis 
                    dataKey="dateLabel" 
                    stroke="#8e9aa0" 
                    fontSize={10} 
                    fontWeight="bold" 
                  />
                  <YAxis 
                    stroke="#8e9aa0" 
                    fontSize={10} 
                    fontWeight="bold"
                    domain={[0, 120]} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#121417', 
                      borderColor: '#1c1f22',
                      borderRadius: 8
                    }}
                    labelStyle={{ color: '#8e9aa0', fontWeight: 'bold' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  {/* Reference line for target ROM limit */}
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
                  {/* Reference line for ROM ceiling safety limit */}
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

          {/* Session History Table Card */}
          <div className="card table-card">
            <div className="card-header border-bottom">
              <Calendar className="card-header-icon" />
              <div>
                <h2>Session History Log</h2>
                <p className="card-subtitle">Detailed telemetry logs of all exercise entries completed by Budi</p>
              </div>
              <span className="demo-badge">DATA CONTOH / ILUSTRASI</span>
            </div>

            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Exercise</th>
                    <th>Reps Completed</th>
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
                          <Calendar size={13} style={{ marginRight: 6 }} className="color-icon" />
                          {formatDate(s.created_at)}
                        </td>
                        <td>Forearm supination/pronation</td>
                        <td className="text-center font-bold">{s.reps}</td>
                        <td className={`font-bold ${isExceeded ? 'color-danger' : 'color-cyan'}`}>
                          {s.peak_rom}°
                        </td>
                        <td className="cell-duration">
                          <Clock size={13} style={{ marginRight: 6 }} className="color-icon" />
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
      </main>

      {/* Footer disclaimer */}
      <footer className="dashboard-footer">
        <p>* Catatan: Halaman ini adalah demo visual portal terapis (MVP) dengan data dummy / ilustrasi terisolasi. Tidak tersambung ke database production. *</p>
      </footer>
    </div>
  );
}
