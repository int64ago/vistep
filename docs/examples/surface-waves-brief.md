# Surface waves — author production brief

Status: source package, six 24-second draft cues (144 seconds). Model tests and authored geometric checks only; independent browser review, playback, phone hardware, listening and failure QA remain with integrator. Do not call author self-review independent acceptance.

## Question and distinct place

Misconception: a visible crest carries the same water all the way forward, every depth moves equally, or energy must travel at crest speed. Prerequisites: wavelength, period, section and velocity. Related `wave-interference` introduces addition; this scene adds finite-depth gravity-wave dispersion and parcel kinematics. `vortex-ring` compares another separation between a propagating pattern and material motion. `hydrostatic-pressure` supplies water-depth context but is not a travelling-wave model.

## Primary reading and claim ledger

Actually read MIT Marine Hydrodynamics [Lecture 20](https://ocw.mit.edu/courses/2-20-marine-hydrodynamics-13-021-spring-2005/5d48a5937971d973fd8ca90c051a83f8_lecture20.pdf), §§6.2–6.3, pp.3–12, and [Lecture 21](https://ocw.mit.edu/courses/2-20-marine-hydrodynamics-13-021-spring-2005/b9fe0992f1502e0c704359a2f7ecc56c_lecture21.pdf), §§6.4–6.6, pp.5–8. The first gives linear boundary conditions, dispersion, depth dependence and first-order orbits; the second derives two-mode beat envelopes, derivative group speed and energy flux. These claims assume uniform depth, inviscid irrotational incompressible gravity waves, small amplitude, no current or surface tension. Source text extraction contains a typo near its early amplitude sketch; use later explicit H=2A and derivation, not that isolated line.

Closed ellipses only describe first-order mean-position integration. Do not deny Stokes drift. Depth variation compares separate uniform domains; it is not a shoaling calculation and does not conserve a single entering wave frequency. Surface and local-orbit views have independently enlarged displacement scales.

## Independent oracles and counterexamples

Six model tests check deep and shallow analytical limits; an exact tanh(log(3)/2)=1/2 benchmark at k=1; bed impermeability; numerical time derivatives of surface and parcel motion; the linear dynamic free-surface boundary; orbital ellipse identity and first-order closure; exponential deep-water decay; derivative group speed against a numerical k derivative; exact two-mode envelope peak position; zero amplitude and invalid domains. Counterexamples: zero vertical motion at the bed while horizontal motion persists; zero amplitude with unchanged allowed phase speed; deep group speed near half phase speed versus shallow near equality. Two-mode readouts use Δω/Δk and averaged carrier speed, not falsely label a finite separation as the derivative limit.

## Art direction and causal sequence

A blue waterline engraving, independent local orbit magnifier, gold material marker and a depth rail. No rigid vessel or random particle drift. First four chapters use an 18-metre-wide surface window; the orbit panel has its own fixed displacement scale. Gold crest and parcel markers are distinct objects. The last two chapters replace the orbit with two component strips and their computed sum, with an actual moving beat-envelope line and carrier-phase point.

1. Advancing crest versus local first-order parcel orbit.
2. Observation level descends; deep orbital magnitude decays.
3. Shallower uniform water; bed condition flattens the orbit.
4. Longer wavelengths travel faster in deep water; amplitude does not set linear speed.
5. Exact two-mode beat: internal phase outruns the envelope.
6. Long-wave shallow water: envelope and carrier speeds nearly coincide.

Desktop 760×330 viewBox, bounded max-width980; phone separately arranged 340×280 with 222 CSS-px stage. All explanatory text is DOM16px, not scaled SVG. Largest exploration orbit: A=.06m,h=.6m,λ=12m gives horizontal radius≈.197m; phone×620 fits x≈68…312 around190, y within stage. Time≤3s keeps tracked crest within the18m window. Controls are collapsed until exploration, min44px buttons, shared clock and no owned resources. Target complete phone player≤740px remains to be measured by integration owner.
