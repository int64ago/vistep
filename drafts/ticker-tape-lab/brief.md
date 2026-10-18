# Ticker tape: one record becomes a prediction

Owner: teaching_subject_fit. This is a substantial revision using the repository scene skill. Product source is limited to the TickerTapeLab component, independent model/tests, its stylesheet and bilingual MDX. Root owns registry, curriculum, shared captions/timing, translations and audio. Existing cover geometry still imports the preserved tape model API; no cover files changed.

The opening asks why gaps can grow when the ticking stays steady. The misconception is that wide gaps alone mean acceleration. Two uniform records first show the counterexample. The tracked object is one paper record: original 50 Hz sample IDs remain attached when grouped, aligned and converted into interval velocities. Cart and free-fall single-chapter curriculum windows each carry a complete acquisition → equal-time evidence → inference → prediction chain.

Five chapter IDs and four textbook selections stay unchanged: timer; average + instant; cart; fall. The requested next-point predictions use only three previously revealed positions. Dashed future strips are conditional predictions; solid marks are subsequently generated model data. Neither is called an independent real experiment.

## Direction and responsive composition

A warm paper strip, ink points and restrained colored interval identities carry the explanation. A fixed needle and a moving paper attachment establish acquisition. Later shots give the available area to paper measurements, aligned intervals or a velocity plot rather than permanently stacking every view. The transformation into aligned strips preserves original point IDs. Time orientation is explicitly marked in analysis; the physical tape's old marks travel away from the fixed needle.

The SVG coordinate width follows measured CSS pixels, so 16-unit text stays 16 px. Cart travel, rail, hanging mass and pulley tangents are rederived for phone and desktop widths; phone travel is not a shrunken desktop picture. Vertical fall uses its own composition. Both mass comparisons share a physical scale. Interval and velocity comparisons retain fixed physical scales when acceleration changes.

CSS uses only ticker-tape-* scene names. Phone caption spacing is scoped to `.showcase[data-slug='ticker-tape-lab']`; no other scene is affected. A final production stylesheet review remains necessary because author dev review cannot establish CSS bundle order.

## Scientific contract

- One 50 Hz acquisition interval is 0.02 s; five intervals require six points.
- A finite interval gives average velocity. The cubic velocity path prevents accidental universal midpoint equality. The shrinking symmetric estimate uses whole recorded ticks; its smallest span is 0.04 s and retains a nonzero error versus the analytical instantaneous value.
- For prescribed constant acceleration, midpoint interval velocities form a straight v–t line. Equal-time displacement increments give aT²; the prediction helper accepts only three equally timed finite samples.
- Cart benchmark: v0=0.12 m/s, a=0.60 m/s², T=0.10 s; interval distances1.5,2.1,2.7,3.3,3.9 cm. Next x(.5)=0.135 m.
- Drop benchmark: g=9.8 m/s²; intervals4.9,14.7,24.5,34.3 cm. Next x(.4)=0.784 m. Mass independence assumes negligible air/tape resistance, not a universal claim about arbitrary falling objects.
- The cart motion is kinematically prescribed. Geometry conserves rope length and shares cart/hanger displacement; no T=mg approximation is introduced. Real force inference belongs to the separate Newton scene.
- Real frequency, ruler uncertainty, unclear initial marks and repeated recordings remain in progressive disclosure and the articles, rather than driving the film.

## Sources

Primary curriculum: supplied PEP Required Book1, printed pp18,22–23,36–38,48–49. Full text checked; extracts saved at `artifacts/teaching-principles/ticker-tape-ready/textbook-pages.txt`. Printed p38 explicitly discusses cutting equal-time strips into a velocity plot; p48 asks about acceleration and changed mass.

Web-verified primary sources: IOP `https://spark.iop.org/ticker-timers-investigating-speed`; OpenStax University Physics1 §§3.2 and3.3. Links and the claim mapping are in the bilingual articles and principle-first packet. No stock media or external apparatus images are used.

## Evidence and remaining work

The independent model suite has19 passing tests: numerical benchmarks, equal-time validation, finite-resolution counterexample, identity preservation, deterministic seeks, finite inputs, staged measurement, endpoint hold, contact at50Hz acquisition instants and rope invariants at widths240/264/334/640. Scoped TypeScript checks pass. The six scene classes appear only in this component/stylesheet; the CSS prefix report is saved under `artifacts/teaching-principles/ticker-check/`.

Author browser evidence is separated by revision. Review01 exposed excessive whole-player height with old shared captions. Review02 could not mount the shared EnglishExperiment because the dev server mixed JSX runtimes; root recovered the server, and no pass is claimed for that attempt. Review03 used real new captions and exposed a long English prediction label. Review04 has96 successful paused cases at320/390/1100 in both languages after the layout correction. Review05 adds36 targeted samples for the staged average reading and actual striker contact. Review06 was interrupted by a development reload. Review07 exposed a screenshot race: one capture showed a reload after its DOM measurements had passed. Review08 replaces that supplement with44 stable cases, checking chapter/time/mount again after every screenshot; all pass without retries and the six owned product/test source hashes stay unchanged. It includes the precise gap-count label, acquisition dot count and prediction-row spacing. These are paused-keyframe checks, not complete playback.

Actual UI checking at320px covers14 exploration views in both languages at range minima/maxima, reveal/reset, both timer mechanisms and both average-interval choices:64 recorded states. All four curriculum routes in both languages initialized the correct chapter and apparatus; returning from watch to exploration preserved the user's later choice. Reports and images are in `ticker-controls-02/`.

The complete phone player is at most477px high with the real longest caption, transport and closed chapter selector. On320×568, positioning its top90px below the viewport top leaves its bottom at567px. Both languages retain at least16px text and44px controls.390px layouts also fit. Final source-bound screenshot paths and any remaining limitations are in the packet/acceptance record.

Root has independently inspected selected cart, graph and free-fall images. Author inspection is not independent acceptance. Actual measured narration, word-to-shot recalibration, static build/CSS bundle order, continuous final playback, human listening, physical-phone performance and deployment remain separate root acceptance steps. No audio has been generated by the scene owner.
