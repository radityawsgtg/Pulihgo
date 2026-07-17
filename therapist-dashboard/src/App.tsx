import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area, BarChart, Bar
} from 'recharts';
import './App.css';
import { fetchSessions, fetchPrescription, upsertPrescription, type DbSession } from './lib/supabase';

/* ─── Database types ─── */
interface SessionData {
  reps: number;
  peak_rom: number;
  duration_ms: number;
  pain_flag: 'none' | 'mild' | 'stopped';
  created_at: number;
}

/* ─── Inline SVG icons (avoids lucide file-handle crash on Windows) ─── */
const I = ({ d, size = 18, color = 'currentColor', style }: { d: string; size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const IconActivity   = (p: { size?: number; color?: string; style?: React.CSSProperties }) => <I d="M22 12h-4l-3 9L9 3l-3 9H2" {...p} />;
const IconCalendar   = (p: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg style={p.style} width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconClock      = (p: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg style={p.style} width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconUser       = (p: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg style={p.style} width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconDownload   = (p: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg style={p.style} width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconCheck      = (p: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg style={p.style} width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconShield     = (p: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg style={p.style} width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconHeart      = (p: { size?: number; color?: string; style?: React.CSSProperties }) => <I d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" {...p} />;
const IconSliders    = (p: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg style={p.style} width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="2" y1="14" x2="6" y2="14"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="18" y1="16" x2="22" y2="16"/>
  </svg>
);
const IconSearch = (p: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg style={p.style} width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconDots = (p: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg style={p.style} width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
  </svg>
);
const IconRefresh = (p: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg style={p.style} width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

/* ─── Real patient session data ─── */
// TODO(auth): comes from the logged-in therapist's selected patient once
// therapist/patient accounts exist. Every fetch is scoped to this one id
// until then — matches DUMMY_PATIENT_ID in pulihgo-app/src/sync/uploadSession.ts.
const PATIENT_ID = 'demo01';

/** Map one Supabase `sessions` row onto the shape the charts/tables below expect. */
function toSessionData(row: DbSession): SessionData {
  return {
    reps: row.reps,
    peak_rom: row.peak_rom,
    duration_ms: row.duration_ms,
    pain_flag: row.pain_flag,
    created_at: new Date(row.created_at).getTime(),
  };
}

/* ─── Session Schedule mock data ───
   Deliberately NOT derived from real sessions — the therapist/session-type
   names here are illustrative UI only (per the task: Session Schedule stays
   mock), decoupled from the real Supabase fetch below so it renders the same
   regardless of loading/error/empty state. */
const SCHEDULE_MOCK_TIMES = [
  Date.now() - 6 * 86400000,
  Date.now() - 5 * 86400000,
  Date.now() - 4 * 86400000,
  Date.now() - 3 * 86400000,
  Date.now() - 2 * 86400000,
];

/* ─── Journal entries ─── */
const JOURNAL = [
  { date: '17 Jul 2026', mood: 'Good',   note: 'Completed full forearm rotation set without pain. Feeling optimistic about recovery.' },
  { date: '16 Jul 2026', mood: 'Fair',    note: 'Mild discomfort during supination at high angles. Stopped after 8 reps.' },
  { date: '15 Jul 2026', mood: 'Great',   note: 'Best session so far! ROM reached 88° with no discomfort.' },
  { date: '14 Jul 2026', mood: 'Poor',    note: 'Had to stop early due to sharp pain above 90°. Will reduce ceiling.' },
  { date: '13 Jul 2026', mood: 'Good',    note: 'Steady improvement. Smoothness score improving consistently.' },
];

/* ─── Therapy exercises ─── */
const EXERCISES = [
  { name: 'Forearm Supination/Pronation', sets: 3, reps: 12, target: '80°', status: 'Active' },
  { name: 'Wrist Flexion/Extension',      sets: 2, reps: 10, target: '60°', status: 'Upcoming' },
  { name: 'Grip Strength Training',        sets: 3, reps: 15, target: 'N/A', status: 'Upcoming' },
  { name: 'Finger Dexterity Drill',        sets: 2, reps: 20, target: 'N/A', status: 'Completed' },
];

/* ─── Helper fns ─── */
const fmtDate = (ts: number) => {
  const d = new Date(ts);
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${mo[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};
const fmtDur = (ms: number) => { const s = Math.floor(ms/1000); const m = Math.floor(s/60); return m > 0 ? `${m}m ${s%60}s` : `${s%60}s`; };
const now = new Date();
const clock = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
const todayStr = now.toLocaleDateString('en-US',{ weekday:'long', day:'numeric', month:'long', year:'numeric' });

/* ─── Tabs ─── */
type Tab = 'Dashboard' | 'My Journal' | 'Therapy' | 'Reports' | 'Settings';
const TABS: Tab[] = ['Dashboard','My Journal','Therapy','Reports','Settings'];

/* ════════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [tab, setTab] = useState<Tab>('Dashboard');

  // Real session data (Reports + Dashboard KPIs) — fetched from Supabase.
  // Journal / Therapy prescriptions / Settings / Session Schedule stay mock.
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [sessionsStatus, setSessionsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setSessionsStatus('loading');
    setSessionsError(null);
    try {
      const rows = await fetchSessions(PATIENT_ID);
      setSessions(rows.map(toSessionData));
      setSessionsStatus('ready');
    } catch (e) {
      setSessionsError(e instanceof Error ? e.message : String(e));
      setSessionsStatus('error');
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Prescription — read from and written to Supabase `prescriptions`.
  // These defaults are what the form shows before the fetch lands, and if the
  // therapist has never set a prescription. They mirror the phone's offline
  // fallback so the two never disagree about what "unset" means.
  const [targetRom, setTargetRom]   = useState(80);
  const [romCeiling, setRomCeiling] = useState(90);
  const [targetReps, setTargetReps] = useState(10);
  const [exercise, setExercise]     = useState('Forearm supination/pronation');
  const [saved, setSaved]           = useState({ targetRom:80, romCeiling:90, targetReps:10, exercise:'Forearm supination/pronation' });
  const [toast, setToast]           = useState(false);
  const [valErr, setValErr]         = useState<string|null>(null);
  const [rxStatus, setRxStatus]     = useState<'loading' | 'ready' | 'error'>('loading');
  const [rxError, setRxError]       = useState<string|null>(null);
  const [saving, setSaving]         = useState(false);

  // Load the existing prescription once, so the therapist edits what is
  // actually in force rather than starting from blank defaults every visit.
  const loadPrescription = useCallback(async () => {
    setRxStatus('loading');
    setRxError(null);
    try {
      const rx = await fetchPrescription(PATIENT_ID);
      if (rx) {
        setTargetRom(rx.target_rom);
        setRomCeiling(rx.rom_ceiling);
        setTargetReps(rx.target_reps);
        // Functional form keeps `exercise` out of this callback's closure, so
        // it needs no dependency and can't go stale.
        setSaved((prev) => ({
          targetRom: rx.target_rom,
          romCeiling: rx.rom_ceiling,
          targetReps: rx.target_reps,
          exercise: prev.exercise,
        }));
      }
      // rx === null → no prescription set yet; keep the defaults above.
      setRxStatus('ready');
    } catch (e) {
      setRxError(e instanceof Error ? e.message : String(e));
      setRxStatus('error');
    }
  }, []);

  useEffect(() => {
    loadPrescription();
  }, [loadPrescription]);

  // Settings
  const [patientName, setPatientName] = useState('Budi Setiawan');
  const [darkMode, setDarkMode]       = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage]       = useState('English');

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (romCeiling <= targetRom) { setValErr('ROM ceiling must be greater than Target ROM.'); return; }
    setValErr(null);
    setSaving(true);
    setRxError(null);
    try {
      await upsertPrescription({
        patient_id: PATIENT_ID,
        target_rom: targetRom,
        rom_ceiling: romCeiling,
        target_reps: targetReps,
      });
      // Only reflect the new plan in the charts once the write actually
      // succeeded — otherwise the reference lines would promise a target the
      // patient's phone will never receive.
      setSaved({ targetRom, romCeiling, targetReps, exercise });
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } catch (err) {
      setRxError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  // Derived stats — all computed from `sessions` (real Supabase data), never
  // from SESSIONS (that constant no longer exists). Only meaningful once
  // sessionsStatus === 'ready' && sessions.length > 0; the render functions
  // below gate on that before showing these.
  const totalReps = sessions.reduce((a, s) => a + s.reps, 0);
  const avgRom    = sessions.length ? sessions.reduce((a, s) => a + s.peak_rom, 0) / sessions.length : 0;

  // Trailing 7 calendar days (today inclusive), oldest to newest — used for
  // both the Weekly Adherence KPI and the Weekly Reps Distribution bar chart.
  const weeklyReport = useMemo(() => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days: { key: string; day: string; reps: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ key: d.toDateString(), day: dayLabels[d.getDay()], reps: 0 });
    }
    for (const s of sessions) {
      const key = new Date(s.created_at).toDateString();
      const bucket = days.find((d) => d.key === key);
      if (bucket) bucket.reps += s.reps;
    }
    return days;
  }, [sessions]);

  const adherence = Math.round((weeklyReport.filter((d) => d.reps > 0).length / 7) * 100);

  // KPI sparklines, derived from the real session history (last 6 sessions).
  const recentSessions = sessions.slice(-6);
  const sparkAdherence = weeklyReport.map((d) => ({ v: d.reps }));
  const sparkAvgRom = recentSessions.map((s) => ({ v: s.peak_rom }));
  const sparkTotalDose = recentSessions.map((s) => ({ v: s.reps }));

  /* ─── Tab Content Renderers ─── */

  const renderDashboard = () => (
    <>
      <div className="sub-header">
        <div className="breadcrumb"><span className="bc-dim">Dashboard</span> <span className="bc-sep">/</span> <span className="bc-active">General</span></div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadSessions} disabled={sessionsStatus === 'loading'}>
            <IconRefresh size={13} color="rgba(255,255,255,0.75)" style={sessionsStatus === 'loading' ? { animation: 'dash-spin 0.9s linear infinite' } : undefined}/>
            Refresh
          </button>
          <div className="date-display"><IconCalendar size={13} color="rgba(255,255,255,0.5)" style={{marginRight:6}}/>{todayStr}</div>
        </div>
      </div>
      <h1 className="page-title"><span className="fw-900">Overall</span> Statistics</h1>

      <div className="grid-main">
        {/* Left: KPIs + Session table */}
        <div className="col-left">
          {sessionsStatus === 'loading' && <DataState kind="loading"/>}
          {sessionsStatus === 'error' && <DataState kind="error" message={sessionsError} onRetry={loadSessions}/>}
          {sessionsStatus === 'ready' && sessions.length === 0 && <DataState kind="empty"/>}
          {sessionsStatus === 'ready' && sessions.length > 0 && (
            <div className="kpi-row">
              <KpiCard label="Weekly Adherence" value={`${adherence}%`} change={`${weeklyReport.filter(d=>d.reps>0).length}/7 hari aktif`} changeColor="#00e676" data={sparkAdherence} gradientId="gA" color="#00e676"/>
              <KpiCard label="Avg Peak ROM" value={`${avgRom.toFixed(0)}°`} change={`dari ${sessions.length} sesi`} changeColor="#00e5ff" data={sparkAvgRom} gradientId="gB" color="#00e5ff"/>
              <KpiCard label="Total Dose" value={`${totalReps} reps`} change={`${sessions.length} sesi tercatat`} changeColor="#c084fc" data={sparkTotalDose} gradientId="gC" color="#ff5252"/>
            </div>
          )}

          <div className="glass-card session-card">
            <div className="card-top-bar">
              <h2><span className="fw-900">Session</span> Schedule</h2>
              <div className="card-actions">
                <button className="icon-btn"><IconSearch size={14} color="rgba(255,255,255,0.5)"/></button>
                <button className="icon-btn"><IconDots size={14} color="rgba(255,255,255,0.5)"/></button>
              </div>
            </div>
            <table className="sched-table">
              <thead><tr><th>Therapist</th><th>Time</th><th>Date</th><th>Session type</th></tr></thead>
              <tbody>
                {SCHEDULE_MOCK_TIMES.map((created_at, i) => (
                  <tr key={i}>
                    <td className="therapist-cell"><div className="avatar-dot"></div>Dr. {['Emily Johnson','Michael Taylor','Daniel Chang','Laura Collins','Michael Taylor'][i]}</td>
                    <td>{new Date(created_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</td>
                    <td>{new Date(created_at).toISOString().slice(0,10)}</td>
                    <td>{['Individual Therapy','Art Therapy','Stress Management','Family Counseling','Individual Therapy'][i]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: media cards */}
        <div className="col-right">
          <div className="glass-card media-card purple-glow">
            <div className="vinyl-circle"></div>
            <h3>Inner Harmony Hues</h3>
            <p className="media-sub">Take a mental voyage to inner sanctuaries</p>
            <div className="media-controls">
              <button className="ctrl-btn small">⏮</button>
              <button className="ctrl-btn play">▶</button>
              <button className="ctrl-btn small">⏭</button>
            </div>
          </div>
          <div className="glass-card download-card">
            <h3>Download your rehabilitation wellness report</h3>
            <p className="dl-sub">Full ROM trend analysis and session history</p>
            <button className="dl-btn"><IconDownload size={13} color="#fff" style={{marginRight:6}}/>Download</button>
          </div>
        </div>
      </div>
    </>
  );

  const renderJournal = () => (
    <>
      <div className="sub-header">
        <div className="breadcrumb"><span className="bc-dim">My Journal</span> <span className="bc-sep">/</span> <span className="bc-active">Entries</span></div>
        <div className="date-display"><IconCalendar size={13} color="rgba(255,255,255,0.5)" style={{marginRight:6}}/>{todayStr}</div>
      </div>
      <h1 className="page-title"><span className="fw-900">My</span> Journal</h1>

      <div className="journal-grid">
        {JOURNAL.map((j, i) => (
          <div key={i} className="glass-card journal-entry">
            <div className="je-header">
              <span className="je-date">{j.date}</span>
              <span className={`je-mood mood-${j.mood.toLowerCase()}`}>{j.mood}</span>
            </div>
            <p className="je-note">{j.note}</p>
          </div>
        ))}
        <div className="glass-card journal-new">
          <button className="new-entry-btn">+ New Entry</button>
          <p className="new-entry-hint">Record today's session experience</p>
        </div>
      </div>
    </>
  );

  const renderTherapy = () => (
    <>
      <div className="sub-header">
        <div className="breadcrumb"><span className="bc-dim">Therapy</span> <span className="bc-sep">/</span> <span className="bc-active">Exercises</span></div>
        <div className="date-display"><IconCalendar size={13} color="rgba(255,255,255,0.5)" style={{marginRight:6}}/>{todayStr}</div>
      </div>
      <h1 className="page-title"><span className="fw-900">Therapy</span> Plan</h1>

      <div className="therapy-layout">
        <div className="therapy-left">
          <div className="glass-card">
            <h2 className="card-h2"><IconHeart size={16} color="#c084fc" style={{marginRight:8}}/>Prescribed Exercises</h2>
            <table className="sched-table">
              <thead><tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Target</th><th>Status</th></tr></thead>
              <tbody>
                {EXERCISES.map((ex, i) => (
                  <tr key={i}>
                    <td className="fw-600">{ex.name}</td>
                    <td className="center">{ex.sets}</td>
                    <td className="center">{ex.reps}</td>
                    <td className="center color-cyan">{ex.target}</td>
                    <td><span className={`badge badge-${ex.status === 'Active' ? 'active' : ex.status === 'Completed' ? 'done' : 'upcoming'}`}>{ex.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="therapy-right">
          {/* Prescription form */}
          <div className="glass-card">
            <h2 className="card-h2"><IconSliders size={16} color="#c084fc" style={{marginRight:8}}/>Clinical Prescription</h2>
            <form onSubmit={onSave} className="rx-form">
              <div className="fg"><label>Exercise</label>
                <select value={exercise} onChange={e => setExercise(e.target.value)}>
                  <option>Forearm supination/pronation</option>
                </select>
              </div>
              <div className="fg-row">
                <div className="fg half"><label>Target ROM (°)</label><input type="number" value={targetRom} onChange={e => setTargetRom(+e.target.value||0)} min={1} max={180}/></div>
                <div className="fg half"><label>ROM Ceiling (°)</label><input type="number" value={romCeiling} onChange={e => setRomCeiling(+e.target.value||0)} min={1} max={180}/></div>
              </div>
              <div className="fg"><label>Reps / Session</label><input type="number" value={targetReps} onChange={e => setTargetReps(+e.target.value||0)} min={1} max={50}/></div>
              {valErr && <div className="form-err"><IconShield size={14} color="#ff5252"/><span>{valErr}</span></div>}
              {rxError && <div className="form-err"><IconShield size={14} color="#ff5252"/><span>Could not reach the database: {rxError}</span></div>}
              <button type="submit" className="rx-save" disabled={saving || rxStatus === 'loading'}>
                {saving ? 'Saving…' : rxStatus === 'loading' ? 'Loading…' : 'Update Prescription'}
              </button>
            </form>
            {toast && <div className="form-ok"><IconCheck size={14} color="#00e676"/><span>Prescription saved — the patient's phone will pick it up.</span></div>}
          </div>
        </div>
      </div>
    </>
  );

  const renderReports = () => (
    <>
      <div className="sub-header">
        <div className="breadcrumb"><span className="bc-dim">Reports</span> <span className="bc-sep">/</span> <span className="bc-active">Weekly</span></div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadSessions} disabled={sessionsStatus === 'loading'}>
            <IconRefresh size={13} color="rgba(255,255,255,0.75)" style={sessionsStatus === 'loading' ? { animation: 'dash-spin 0.9s linear infinite' } : undefined}/>
            Refresh
          </button>
          <div className="date-display"><IconCalendar size={13} color="rgba(255,255,255,0.5)" style={{marginRight:6}}/>{todayStr}</div>
        </div>
      </div>
      <h1 className="page-title"><span className="fw-900">Weekly</span> Reports</h1>

      {sessionsStatus === 'loading' && <DataState kind="loading"/>}
      {sessionsStatus === 'error' && <DataState kind="error" message={sessionsError} onRetry={loadSessions}/>}
      {sessionsStatus === 'ready' && sessions.length === 0 && <DataState kind="empty"/>}
      {sessionsStatus === 'ready' && sessions.length > 0 && (
        <div className="reports-grid">
          {/* ROM trend chart */}
          <div className="glass-card chart-card-wide">
            <h2 className="card-h2">ROM Recovery Trend</h2>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={sessions.map(s=>({...s, lbl: new Date(s.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}))} margin={{top:15,right:10,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                  <XAxis dataKey="lbl" stroke="#a0aec0" fontSize={10}/>
                  <YAxis stroke="#a0aec0" fontSize={10} domain={[0,120]}/>
                  <Tooltip contentStyle={{backgroundColor:'rgba(20,14,30,0.95)',borderColor:'rgba(255,255,255,0.08)',borderRadius:8}} labelStyle={{color:'#a0aec0'}} itemStyle={{color:'#fff'}}/>
                  <ReferenceLine y={saved.targetRom} stroke="#00e676" strokeDasharray="4 4" label={{value:`Target ${saved.targetRom}°`,fill:'#00e676',position:'top',fontSize:10}}/>
                  <ReferenceLine y={saved.romCeiling} stroke="#ff5252" strokeDasharray="4 4" label={{value:`Ceiling ${saved.romCeiling}°`,fill:'#ff5252',position:'top',fontSize:10}}/>
                  <Line type="monotone" dataKey="peak_rom" name="Peak ROM" stroke="#00e5ff" strokeWidth={3} dot={{r:4,strokeWidth:2}} activeDot={{r:6}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly bar chart */}
          <div className="glass-card chart-card-narrow">
            <h2 className="card-h2">Weekly Reps Distribution</h2>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyReport} margin={{top:10,right:10,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                  <XAxis dataKey="day" stroke="#a0aec0" fontSize={10}/>
                  <YAxis stroke="#a0aec0" fontSize={10}/>
                  <Tooltip contentStyle={{backgroundColor:'rgba(20,14,30,0.95)',borderColor:'rgba(255,255,255,0.08)',borderRadius:8}} labelStyle={{color:'#a0aec0'}} itemStyle={{color:'#fff'}}/>
                  <Bar dataKey="reps" fill="#c084fc" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Session history */}
          <div className="glass-card full-width-card">
            <div className="card-top-bar">
              <h2 className="card-h2">Session History</h2>
            </div>
            <table className="sched-table">
              <thead><tr><th>Date & Time</th><th>Exercise</th><th>Reps</th><th>Peak ROM</th><th>Duration</th><th>Status</th></tr></thead>
              <tbody>
                {sessions.map((s,i) => {
                  const over = s.peak_rom > saved.romCeiling;
                  return (
                    <tr key={i} className={s.pain_flag==='stopped'?'row-danger':over?'row-warn':''}>
                      <td className="dt-cell"><IconCalendar size={12} color="#a0aec0" style={{marginRight:6}}/>{fmtDate(s.created_at)}</td>
                      <td>Forearm supination/pronation</td>
                      <td className="center fw-700">{s.reps}</td>
                      <td className={`fw-700 ${over?'color-danger':'color-cyan'}`}>{s.peak_rom}°</td>
                      <td className="dt-cell"><IconClock size={12} color="#a0aec0" style={{marginRight:6}}/>{fmtDur(s.duration_ms)}</td>
                      <td>
                        {s.pain_flag==='stopped'&&<span className="badge badge-danger">Stopped</span>}
                        {s.pain_flag==='mild'&&<span className="badge badge-warn">Mild</span>}
                        {s.pain_flag==='none'&&!over&&<span className="badge badge-safe">Safe</span>}
                        {over&&<span className="badge badge-over">Exceeded</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );

  const renderSettings = () => (
    <>
      <div className="sub-header">
        <div className="breadcrumb"><span className="bc-dim">Settings</span> <span className="bc-sep">/</span> <span className="bc-active">General</span></div>
        <div className="date-display"><IconCalendar size={13} color="rgba(255,255,255,0.5)" style={{marginRight:6}}/>{todayStr}</div>
      </div>
      <h1 className="page-title"><span className="fw-900">Settings</span></h1>

      <div className="settings-grid">
        <div className="glass-card settings-card">
          <h2 className="card-h2"><IconUser size={16} color="#c084fc" style={{marginRight:8}}/>Patient Profile</h2>
          <div className="fg"><label>Patient Name</label><input type="text" value={patientName} onChange={e=>setPatientName(e.target.value)}/></div>
          <div className="fg"><label>Diagnosis</label><input type="text" value="Post-fracture forearm rehabilitation" readOnly/></div>
          <div className="fg"><label>Therapist</label><input type="text" value="Carl Manfred" readOnly/></div>
        </div>
        <div className="glass-card settings-card">
          <h2 className="card-h2"><IconSliders size={16} color="#c084fc" style={{marginRight:8}}/>Preferences</h2>
          <div className="toggle-row">
            <span>Dark Mode</span>
            <button className={`toggle-btn ${darkMode?'on':''}`} onClick={()=>setDarkMode(!darkMode)}><span className="toggle-knob"/></button>
          </div>
          <div className="toggle-row">
            <span>Notifications</span>
            <button className={`toggle-btn ${notifications?'on':''}`} onClick={()=>setNotifications(!notifications)}><span className="toggle-knob"/></button>
          </div>
          <div className="fg"><label>Language</label>
            <select value={language} onChange={e=>setLanguage(e.target.value)}>
              <option>English</option><option>Bahasa Indonesia</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );

  const tabContent: Record<Tab, () => React.ReactNode> = {
    Dashboard: renderDashboard,
    'My Journal': renderJournal,
    Therapy: renderTherapy,
    Reports: renderReports,
    Settings: renderSettings,
  };

  return (
    <div className="app-bg">
      {/* Animated purple background waves */}
      <div className="wave wave1"></div>
      <div className="wave wave2"></div>
      <div className="wave wave3"></div>

      {/* Frosted glass window */}
      <div className="glass-window">
        {/* Top nav bar inside the glass */}
        <header className="top-bar">
          <div className="brand"><IconActivity size={18} color="#c084fc"/><span className="brand-txt">Pulih<span className="brand-accent">Go</span></span></div>
          <nav className="pill-nav">
            {TABS.map(t => (
              <button key={t} className={`pill ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</button>
            ))}
          </nav>
          <div className="profile-area">
            <span className="clock">{clock}</span>
            <div className="v-line"></div>
            <div className="profile-info">
              <span className="p-name">Carl Manfred</span>
              <span className="p-role">Physiotherapist</span>
            </div>
            <div className="p-avatar"><IconUser size={15} color="#c084fc"/></div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {tabContent[tab]()}
        </main>

        {/* Say exactly which parts are real. The old blanket "mock dashboard,
            tidak terhubung database" is no longer true: Reports, the Dashboard
            KPIs and the Clinical Prescription form now read/write a real
            Supabase database. A wrong honesty label is still a wrong label. */}
        <footer className="glass-footer">
          <p>
            Reports, Dashboard KPI &amp; Clinical Prescription: <strong>data pasien asli</strong> (Supabase).
            {' '}My Journal, Session Schedule &amp; Prescribed Exercises: data ilustrasi.
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ─── Loading / error / empty state for real (Supabase) session data ─── */
function DataState({ kind, message, onRetry }: {
  kind: 'loading' | 'error' | 'empty';
  message?: string | null;
  onRetry?: () => void;
}) {
  if (kind === 'loading') {
    return (
      <div className="glass-card state-card">
        <div className="state-spinner" />
        <p className="state-text">Memuat data sesi dari Supabase…</p>
      </div>
    );
  }
  if (kind === 'error') {
    return (
      <div className="glass-card state-card state-card-error">
        <IconShield size={22} color="#ff5252" />
        <p className="state-text">Gagal memuat data sesi.</p>
        <p className="state-sub">{message ?? 'Terjadi kesalahan tak terduga.'}</p>
        {onRetry && <button className="btn-retry" onClick={onRetry}>Coba lagi</button>}
      </div>
    );
  }
  return (
    <div className="glass-card state-card">
      <IconActivity size={22} color="rgba(255,255,255,0.3)" />
      <p className="state-text">Belum ada sesi untuk pasien ini.</p>
      <p className="state-sub">Sesi baru akan muncul di sini setelah pasien menyelesaikan latihan di HP.</p>
    </div>
  );
}

/* ─── KPI sparkline card component ─── */
function KpiCard({ label, value, change, changeColor, data, gradientId, color }: {
  label: string; value: string; change: string; changeColor: string;
  data: {v:number}[]; gradientId: string; color: string;
}) {
  return (
    <div className="glass-card kpi-box">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <button className="icon-btn"><IconDots size={12} color="rgba(255,255,255,0.4)"/></button>
      </div>
      <span className="kpi-value">{value}</span>
      <div className="kpi-bottom">
        <span className="kpi-change" style={{color: changeColor}}>{change}</span>
        <div className="kpi-spark">
          <ResponsiveContainer width="100%" height={32}>
            <AreaChart data={data}>
              <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.35}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient></defs>
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#${gradientId})`}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
