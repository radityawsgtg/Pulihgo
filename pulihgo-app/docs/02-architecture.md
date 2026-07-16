# PulihGo — Architecture

Tech-stack flowchart, component responsibilities, and build order.

---

## System flowchart

```mermaid
flowchart TD
    subgraph Phone["📱 Patient phone — apps/mobile (React Native / Expo)"]
        SENS["Gyroscope + Accelerometer<br/>~50 Hz sampling"]
        FUSE["Sensor fusion<br/>(complementary / Madgwick)<br/>→ pitch / roll / yaw angles"]
        DSP["On-device DSP<br/>• rep detection<br/>• peak ROM (deg)<br/>• smoothness (jerk)"]
        GAME["Game + feedback layer<br/>(real-time, driven by live angle)"]
        LOCAL["Local store (offline-first)<br/>queued sessions"]
        SENS --> FUSE --> DSP --> GAME
        DSP --> LOCAL
    end

    subgraph Edge["☁️ apps/api — Hono on Cloudflare Workers"]
        AUTH["Auth (JWT)"]
        REST["REST endpoints<br/>/sessions /prescriptions /patients"]
        AUTH --> REST
    end

    subgraph Data["🗄️ Cloudflare data"]
        D1[("D1 — SQLite<br/>structured records")]
        R2[["R2 — object store<br/>raw signal blobs"]]
    end

    subgraph Web["💻 apps/dashboard — React + Vite"]
        PRESCRIBE["Prescribe exercises"]
        PROGRESS["Progress charts (Recharts)<br/>ROM trend + adherence"]
    end

    SHARED["📦 packages/shared<br/>TypeScript types shared by all"]

    LOCAL -->|"sync when online<br/>(session summary + reps)"| REST
    DSP -->|"raw time-series (optional)"| R2
    REST <--> D1
    REST -->|"signed URL"| R2
    Web <-->|"HTTPS / JSON"| REST

    SHARED -.-> Phone
    SHARED -.-> Edge
    SHARED -.-> Web

    style Phone fill:#e8f4f8,stroke:#2a7ca8
    style Edge fill:#fff3e0,stroke:#e08a00
    style Data fill:#f0e8f8,stroke:#7a4ca8
    style Web fill:#e8f8ec,stroke:#2a8a4c
    style SHARED fill:#f8f4e8,stroke:#a8862a
```

---

## Component responsibilities

### `apps/mobile` — the patient app (the hard/novel part)
- Sample gyroscope + accelerometer via `expo-sensors`.
- **Sensor fusion**: fuse both into a stable joint angle (pitch/roll/yaw). This
  is the one piece of genuinely new engineering — budget the most time here.
- **Rep detection**: segment the continuous angle stream into individual reps
  (peak-to-peak or zero-crossing of angular velocity).
- **Metrics per rep**: `peak_rom_deg`, `smoothness` (from jerk), `duration_ms`.
- **Game**: map live angle → on-screen action; give "good / further / slower" cues.
- **Offline-first**: persist a full session locally; sync later.

### `apps/api` — Hono on Cloudflare Workers
- Auth (JWT), thin REST layer.
- Write session summaries + per-rep metrics to **D1**.
- Store optional raw time-series to **R2**, keyed by `session_id`.
- Serve the dashboard's queries (patients, prescriptions, progress aggregates).

### `apps/dashboard` — React + Vite
- Therapist prescribes exercises (which, how many reps/sets, how often).
- Progress charts (Recharts): ROM-over-time line, adherence calendar, per-session drill-down.

### `packages/shared`
- The canonical TypeScript types + enums (`Exercise`, `Session`, `RepMetric`,
  `MovementType`, etc.). Every app imports from here — never redefines.

---

## Data-flow (happy path, one practice session)

```mermaid
sequenceDiagram
    participant P as Patient (mobile)
    participant L as Local store
    participant A as API (Worker)
    participant D as D1
    participant R as R2
    participant T as Therapist (dashboard)

    Note over P: Therapist has already<br/>prescribed exercises (synced)
    P->>P: Do reps — fusion + DSP compute ROM/smoothness live
    P->>L: Save session summary + per-rep metrics (offline OK)
    L-->>A: POST /sessions (when online)
    A->>D: INSERT session + movement_reps
    P-->>R: PUT raw signal blob (optional) via signed URL
    T->>A: GET /patients/:id/progress
    A->>D: SELECT rom history + adherence
    A-->>T: aggregated progress JSON
    T->>T: render ROM trend + adherence
```

---

## Build order (do not reorder)

| # | Step | Proves |
|---|------|--------|
| 1 | `packages/shared` core types | Shared contract exists |
| 2 | Mobile sensor loop → live angle on screen | **Gyroscope actually works** (kills the biggest risk first) |
| 3 | On-device rep + peak-ROM detection | We can produce the headline number |
| 4 | Smoothness metric | Movement *quality*, not just quantity |
| 5 | `api` + D1 schema + `POST /sessions` | Data persists |
| 6 | Offline queue + sync | Real-world robustness |
| 7 | Dashboard: ROM trend + adherence (seed demo data) | The therapist value + the demo cut |
| 8 | Game layer | Adherence engine + stage "wow" |

Step 8 is last on purpose: the game is polish. Steps 2–3 are the proof the whole
idea rests on — if the gyroscope can't read a clean angle, nothing else matters,
so validate it first.
