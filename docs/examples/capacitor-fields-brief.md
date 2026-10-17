# Capacitor fields — fix voltage or fix charge first

Owner: `/root/hundred_mechanisms`. Original central-gap sectional plate view, aligned with an actual potential profile. This is a magnified central 4mm strip of large100×100mm plates, explicitly outside edge-fringing discussion. Plates continue past break marks; the gap's varying size and dielectric layers use one geometric scale. No decorative field wave.

Misconceptions: dielectric always reduces the field regardless of electrical boundary; isolated plates and a connected source behave identically; electric field is uniform through unlike series layers. Distinction from RC-circuit: electrostatic field, displacement and boundary conditions, not resistor-limited charging dynamics.

Sources verified: OpenStax University Physics Vol.2 8.4 https://openstax.org/books/university-physics-volume-2/pages/8-4-capacitor-with-a-dielectric and8.5 https://openstax.org/books/university-physics-volume-2/pages/8-5-molecular-model-of-a-dielectric, for dielectric polarization and free-charge constraints. Layered series model independently derived using normal D continuity.

Model: area.01m², gap2–8mm, baseline5mm/12V, vacuum epsilon8.8541878128e−12. Centered dielectric thicknessf d, epsilon_r1–6; remaining air split equally. C=epsilon0 A/[d−t+t/k], D=Q/A, Eair=D/epsilon0, Ediel=Eair/k. Potential is the continuous integral of the three local fields. Fixed voltage sets Q=CV; isolated mode holds the original212.5pC. PolarizationP=D(1−1/k) gives opposite bound surface signs. Electrical energy=.5QV equals integrated field energy density.

Six shots: opposite plate charge and potential drop; raise source voltage; separate isolated plates and compare constant field with rising voltage; compare fully filled materials at fixed Q; repeat at fixed V and see Q increase while fully-filled E stays V/d; inspect half-filled series layers and their different potential slopes. Material comparisons are separate equilibrium configurations, not a claim of a physical insertion work cycle. No mechanical force/work inferred from increasing dielectric thickness or changing permittivity.

Phone plate strip~~180px and aligned potential trace~~100px, then two compact values. Explicit connection state and current gap. Technical text≥16px; long conditions in article/explore. Sign symbols illustrate charge polarity; readings quantify charge. Field arrows indicate direction; slope and readings quantify magnitude.

Author validation: 6 model tests passed (vacuum benchmark, fixed-Q dielectric, fixed-V dielectric, isolated separation, normal D and potential continuity, integrated field energy and local potential slope). Strict component TypeScript passed. Independent browser, full playback, recorded listening and physical device:not-run. Inbound:wheatstone-bridge,rc-circuit,electromagnetic-induction (verify registered).
