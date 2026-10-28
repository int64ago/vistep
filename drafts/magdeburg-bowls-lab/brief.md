# Steel bowls: from pressure to a force on each half

Original PEP Elective 3 p.42 review problem: burning paper heats one steel bowl, rapidly close the second, pour water over the exterior, then five people per side finally pull the halves apart. Preserve four chapter IDs and the complete e3-magdeburg-bowls teaching window. No pump replaces this textbook setup.

## Visible causal chain

1. Hot sealing: same-scale green outside and brown inside surface-normal force arrows, equal pressure and zero axial gas resultant. Bowl shell, rim, welded hooks and ropes stay connected.
2. Sealed cooling: fixed amount and volume imply p/T constant in Kelvin. Outside pressure is unchanged; inside arrows shorten. Vertical components cancel; opposite inward resultants on the two halves grow to about 1000 N. The projected mouth is πr², not curved 2πr².
3. Increasing equal pulls: each half has its own applied pull and inward gas resultant; contact balances the remaining inward force until the rim releases. Five people at 200 N mean 1000 N on each side, never 2000 N on one half. First gap is a threshold state, not a solved trajectory.
4. Matched prediction: hold 15 °C and 800 N per side. Intentionally release the seal; flow markers enter at the seam only during pressure equalization. Gas amount changes. Inside pressure rises while outside pressure remains; at equal pressure all surface arrows remain, their axial resultants cancel, and the same pull separates the bowls. Show sealed reference and current force together.

## Geometry, model and limits

Independent model exports analytic projected-area forces, signed gas closing force, rim contact, opening excess, inverse seal temperature and prescribed quasi-static equilibration. Director is a pure function of chapter/progress; no scene timers. Pressure arrow directions follow the same shell normals and both pressure arrow magnitudes share a scale. Pull, gas-resultant and contact arrows share one force scale; pressure surface arrows have their own pressure scale. Physical values are shown explicitly.

Default ambient 100 kPa, diameter20 cm, seal149.5 °C, cooled15 °C: outside axial3141.59 N, inside2141.84 N, difference999.75 N. Rounded values are teaching estimates. Finite input handling, impossible inverse rejection, independent hemisphere integration, signed normals, temperature law, r² scaling, critical equality, contact balance and monotonic matched equilibration are tested. Fixed n/V applies only before air entry. Combustion composition, condensation, seal adhesion/friction, deformation and flow-rate dynamics are omitted. Each manual change constructs a new matched trial; it does not reverse physical air entry.

## Presentation and interaction

Steel cross-section is the main visual, with surface arrows and explicit per-half/per-side forces. Desktop and320px layouts use full-size16px text; no diagram text is shrunk. Under-figure equation becomes the sealed/current matched comparison only in the prediction chapter. Main Watch hides long assumptions; Explore offers temperature, each-side pull, equilibration and two matched-trial actions. All three inputs plus chapter/setup/cooling/prediction/gap/phase are captured on the first unedited Explore and restored after Watch/replay, with tests.

## Sources and evidence

Read original full textbook PDF text around printed p.42 (including preceding ideal-gas review problems), preserved at artifacts/teaching-principles/batch-23/physics/textbook.txt. Primary sources: OpenStax University Physics Vol1 §14.1 (pressure forces normal to surfaces); OpenStax Chemistry2e §9.2 (fixed-volume pressure–Kelvin relation). Projection result independently derived by integrating p cos(theta) over the hemisphere. Avoided a university demo page's inconsistent example force rather than copying its arithmetic.

Speech c0 retained exactly, c1–3 revised after desktop/320 decisive-frame actual image review; measured134 s with all8bilingual source segments independently transcribed. Current candidate evidence under batch-23/physics/checks; evidence scope is silent isolated actual Showcase with full site CSS. Measured word timing is checked in timing-review.json; final built routes, native full play and listening remain separate until recorded by root. No subjective listening or physical-device performance claimed.

Measured director anchors: c0 seal by4.8 s; c1 cooling0.8–10.8 s; c2 pull rises9.2–16 s to marginal balance, then crosses the threshold22.5–23.2 s and opens by24 s; c3 stays sealed through8.8 s and equalizes9.2–15.7 s. Smooth transitions and exact critical equality have boundary tests. New66timestamp frames passed, six actually viewed.
