# PulihGo — Clinician Interview Guide

For validating the concept the way you validated SawIT — real field input before
building. Use this with a **physiotherapist** (most relevant), a **rehabilitation
physician / physiatrist**, and/or a **neurologist**.

> Goal of the interview: confirm the problem is real, learn the actual clinical
> workflow, find which metrics therapists trust, and surface safety guardrails —
> **not** to pitch. Listen more than you talk.

---

## Before you go

- Keep it to **30–40 minutes**. Prioritise sections 1–4; 5–7 if time allows.
- Ask permission to take notes / record. Don't collect any patient data.
- Bring **no solution slides**. If they ask what you're building, give one
  sentence, then return to their world.
- Record answers against your assumptions (see the checklist at the end).

**Intro script (say something like):**
> "We're students researching how upper-limb rehabilitation continues after
> patients leave the clinic. We're trying to understand the real workflow and its
> pain points before we design anything. There are no right answers — we just
> want to learn from your experience. May we take notes?"

---

## Section 1 — The rehab workflow (understand the terrain)

1. Walk me through a typical upper-limb stroke patient's journey — from admission
   to home. Where does *home* practice begin?
2. How do you prescribe home exercises today? Paper sheet, video, app?
3. What happens between appointments — how do you know what the patient actually
   did at home?
4. How often do you see a patient once they're in the outpatient/home phase?

## Section 2 — The dose & adherence problem (test the core thesis)

5. How much home practice do patients *actually* do vs. what you prescribe?
6. What are the biggest reasons home practice falls off?
7. When a patient comes back, can you tell whether they practiced? How?
8. If you could see their real practice — how many reps, how often — would that
   change how you treat them?

## Section 3 — Measurement & progress (find the metric they trust)

9. How do you measure upper-limb progress now — goniometer, Fugl-Meyer (FMA),
   ARAT, something else?
10. How long do those assessments take, and how often can you realistically do them?
11. Which single number best tells you a patient is improving?
12. Is **range of motion in degrees** a metric you'd act on? What about movement
    *smoothness* / quality?

## Section 4 — Fit & safety (define the boundaries)

13. Which upper-limb exercises do you prescribe most? Which involve *rotation*
    (shoulder rotation, forearm supination/pronation, elbow)?
14. What can go **wrong** with unsupervised home practice — compensatory
    movements, overexertion, pain, spasticity, falls?
15. What guardrails would a home tool need for you to feel it's safe?
16. Which patients would this fit — impairment level, age, phone comfort? Who
    should it *exclude*?
17. What's the caregiver's role in home practice?

## Section 5 — Adoption & the dashboard (only if time)

18. If a phone app tracked reps + ROM at home and showed you a dashboard, what
    would you want on the first screen?
19. What would make you *trust* a phone measurement enough to act on it?
20. What would stop you from recommending something like this?

## Section 6 — Value & who pays (business validation)

21. Would remote monitoring let you manage more patients, or manage them better?
22. Who would pay for a tool like this — the clinic, the patient, insurance
    (BPJS)? Is tele-rehab reimbursable here?
23. Do any tools like this already exist in your practice? What do you use / wish
    you had?

## Section 7 — Validation path (for later)

24. What evidence would a tool like this need before a clinic would adopt it?
25. Would you be open to a small pilot with a few patients? What would that
    require?

---

## Assumption checklist (fill in after each interview)

| Assumption we're betting on | Confirmed? | Notes |
|---|---|---|
| Home-practice adherence is a real, felt problem | ⬜ | |
| Therapists can't currently see what patients do at home | ⬜ | |
| ROM in degrees is a metric they'd act on | ⬜ | |
| Rotational exercises are commonly prescribed | ⬜ | |
| Unsupervised practice is safe *with* guardrails | ⬜ | |
| There's a plausible payer (clinic / BPJS) | ⬜ | |
| Target user = mild–moderate, phone-capable, subacute/chronic | ⬜ | |

**Red-flag rule:** if two clinicians independently say the *dose/adherence*
problem isn't real, or that ROM-in-degrees isn't actionable, revisit the concept
before writing more code. That's the whole point of interviewing first.
