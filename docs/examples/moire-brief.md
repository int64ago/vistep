# Moiré patterns — author brief

Status: source/key shots ready, six24s chapters **draft** pending integration-owner browser review. Author tests do not certify visual acceptance. Full playback, phone/device performance, listening and resource failure not-run.

## Misconceptions and editorial role

Coarse pitch is not the difference of fine pitches. Pattern motion is not magnified material motion. This geometric overlay does not require optical wave coherence. A zero difference vector gives no finite coarse period, not zero period. Builds a spatial-beat bridge from `wave-interference` and distinguishes geometric overlay from `sampling-aliasing` and wave `diffraction-grating`. Prerequisite: a repeated pattern has cycles per distance.

## Actual primary teaching source

[University of Iowa Physics,3B50.40Moiré Transparencies](https://instructional-resources.physics.uiowa.edu/3b5040-moire-transparencies) was read for the real demonstration: moving a second patterned transparency over a fixed one yields a visible large front. No source image or supplied pattern is copied. The spatial-frequency formulas below are independently derived for our explicit sinusoidal transmission model, not attributed to an unread research PDF. A PMC research search encountered a later browser challenge; its mathematical sections are not claimed as read.

## Model and independent oracles

Define T1=(1+cosA)/2,T2=(1+cosB)/2 and multiply. Product-to-sum identity independently verifies the difference term cos(A−B)/8 alongside original and sum terms. q1=(1/p1,0),q2=(cosθ,sinθ)/p2. Independent benchmarks: same-direction p1p2/|p2−p1| gives44mm for4/4.4;84mm for4/4.2. Equal-pitch rotation gives p/[2sin(θ/2)]. Translating the second layer by1mm at4/4.4 moves a tagged fine crest+1mm and a tagged difference crest−10mm; another full p2 repeats intensity. Equal aligned gratings keep fine modulation but have constant slow term and null finite period. All transmissions bounded0–1.

Canvas uses a fixed90mm physical field. Its aspect ratio matches its SVG contour overlay; the phone and desktop get independent field heights. Per-column/row trigonometric addition removes per-pixel cosine overhead. No animation loop: FilmContext or controls drive updates. Slow-only mode is mutually exclusive with single-layer mode. Second-layer controls disappear in single-layer mode to avoid inert inputs. Absolute grey encoding is illustrative, not calibrated optical intensity.

## Independent visual direction and six causal shots

A soft slate printed-transparency table: original fine modulation remains visible inside broad geometric bands. A narrow registered central slice makes the slow component measurable without replacing the object by numbers.

1. One grating and its true fine-period transmission slice.
2. Overlay4.4mm layer: product gains44mm slow component.
3. Bring pitches closer: coarse bands widen and slice frequency falls.
4. Same pitch, rotate2→12degrees: vector difference changes coarse direction/spacing.
5. Translate second layer0→4.4mm: actual fine phase contour and difference peak separate in motion, not independent animation.
6. Identical aligned gratings: fine pattern remains, isolated difference becomes constant.

Phone uses its own340×210ratio field, roughly150–195px at320/390,32px slice and CSS16px labels. Automatic phone hides extended details. Full-player≤740remains browser target. Need review all6frames, marker contour alignment, no clipped phase peak, slider boundaries and Canvas performance. Canvas failure leaves a visible status, curve and period. The still cover samples the same transmission model in300vertical strips; no decorative envelope is painted in.
