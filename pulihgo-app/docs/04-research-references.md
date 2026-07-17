# PulihGo — Research References

Every clinical or technical claim in the pitch traces to a source here. Two
buckets: **clinical grounding** (why stroke home-rehab is broken) and
**technical feasibility** (why a phone gyroscope can do the job). Paraphrase
these in slides — don't quote at length.

---

## A. Clinical grounding (the problem is real)

**[C1] Aboobacker et al. (2025).** *Life after stroke from survivors'
perspective: a descriptive cross-sectional study.* Clinical Epidemiology and
Global Health, 33, 102001. (Open access, CC BY-NC-ND.)
- ~13.7 million new strokes globally per year; ~87% of stroke deaths in low- and
  middle-income countries.
- Quality of life correlates positively with **self-efficacy** (rs ≈ 0.53) and
  **functional ability** (rs ≈ 0.52), and negatively with **perceived caregiver
  dependence** (rs ≈ −0.25).
- Survivors showed low self-efficacy scores → recommends empowerment-style,
  nurse-led rehabilitation support.
- **Use for:** the "confidence/self-efficacy drives outcomes" pillar and the
  global-burden opening stat.

**[C2] Li, S. (2023).** *Stroke Recovery Is a Journey: Prediction and Potentials
of Motor Recovery after a Stroke from a Practical Perspective.* Life, 13(2), 2061.
- ~7 million US stroke survivors; ~133 million worldwide.
- More than 80% of hospitalized stroke patients have some hemiparesis.
- **Proportional recovery**: most survivors regain ~70% of their recoverable
  motor function by ~3 months — a defined early window.
- Motor recovery needs **intensive, repetitive, task-specific** practice; dose
  matters.
- Real-world therapy is under-dosed: typical US **outpatient** sessions ~36
  min/day with only ~**12 purposeful movements**; inpatient ~39 min/day.
- **Home-based robot/VR training is feasible to supplement** outpatient therapy.
- Spasticity develops in up to ~97% of moderate–severe survivors (safety consideration).
- **Use for:** the dose gap (your core wedge), the neuroplasticity window, and
  "home practice must fill the gap."

**[C3] American Stroke Association (2019).** *Life After Stroke: Our Path
Forward — A Guide for Patients and Caregivers.*
- Neuroplasticity is highest in roughly the **first 3 months**; gains after come
  slower.
- ASA recommends ~**3 hours of therapy, 5 days/week** for eligible inpatients —
  a bar home practice rarely approaches.
- **Balance training** is recommended for fall-risk patients.
- Recovery commonly spans **3–12 months and beyond**; survivors must keep
  self-directed practice going after discharge.
- **Use for:** the "window + must continue at home" framing and caregiver context.

> **Combined clinical thesis:** high-dose repetition in a ~3-month window drives
> recovery [C2, C3]; real sessions deliver a fraction of the needed dose [C2];
> home practice is meant to fill the gap but is unguided and invisible; and
> visible progress raises the self-efficacy that itself predicts better QoL [C1].

---

## B. Technical feasibility (a phone gyroscope can do this)

**[T1] Milošević & Jovanov (2016).** *Validation of smartphone gyroscopes for
mobile biofeedback applications.* Personal and Ubiquitous Computing.
- A calibrated smartphone gyroscope tracks angular motion to within ~0.4°–1.2° —
  sufficient for biofeedback.
- **Use for:** "the sensor is accurate enough to guide/measure rehab angles."

**[T2] GetMyROM validation (2019).** *Validity and reliability of a smartphone
inclinometer app for measuring passive upper-limb range of motion in a stroke
population.*
- Smartphone ROM measurement matched a gold-standard digital inclinometer with
  excellent test–retest reliability (ICC ≈ 0.84–0.93).
- **Use for:** "we can replace the clinic goniometer."

**[T3] Web-based upper-limb home rehab using a smartwatch + ML (JMIR, 2020;
PMC7380903).**
- Accelerometer + gyroscope fused ML model reached ~99.8% activity-classification
  accuracy (vs ~98% accel-only); gyroscope alone still ~96%.
- Home-monitored group showed better retention/adherence than control.
- **Use for:** "fuse both sensors" + the adherence argument + gyroscope carries
  real signal on its own.

**[T4] Mobile game-based / AR upper-limb stroke rehab (PMC5931529; PMC7495251).**
- Phone/tablet sensor-driven rehab games captured pitch/roll/yaw during
  rotational exercises (forearm rotation, shoulder internal/external rotation);
  patients found the games motivating and engaging.
- **Use for:** the gamification-for-adherence pillar and the "rotational
  exercises = gyroscope" mapping.

**[T5] Active clinical trials** (ClinicalTrials.gov NCT06190795, NCT06787729).
- Smartphone/wearable-sensor upper-limb home rehab is an active, funded research
  direction.
- **Use for:** "this is a live field, not a toy idea."

**[T6] Behnoush et al. (2016).** *Smartphone and Universal Goniometer for
Measurement of Elbow Joint Motions: A Comparative Study.* Asian Journal of
Sports Medicine.
- 60 volunteers, ages 22–72. Smartphone inclinometer inter-rater reliability
  for elbow flexion: ICC 0.95 (vs. ICC 0.77 for a universal goniometer);
  absolute agreement between the two tools: ICC 0.84.
- Conclusion: a smartphone is a viable substitute for a goniometer for elbow
  ROM measurement.
- Broader confirmation: a systematic review of clinically-accessible
  smartphone ROM apps (Pourahmadi et al., 2019, PLOS ONE) found adequate
  intra-/inter-rater reliability and validity across joints including the
  elbow when benchmarked against goniometers/inclinometers.
- **Use for:** justifying **elbow flexion/extension** as the second MVP
  exercise — same forearm strap as feature 5, same single-sensor honesty
  rule (feature 5's rationale), now with its own direct validation instead
  of borrowing T1/T2's general upper-limb framing.

---

## C. How to cite responsibly

- Paraphrase; don't paste paragraphs from any source into slides or the app.
- Attribute stats to the reference tag (e.g. "≈12 purposeful movements per
  outpatient session [C2]").
- The ASA guide [C3] and paper [C1] are patient/education and open-access
  materials — still paraphrase and attribute; don't reproduce their layout.
- If you add a claim, add its source here first. No source → not in the pitch
  (see `AGENTS.md` guardrail #2).
