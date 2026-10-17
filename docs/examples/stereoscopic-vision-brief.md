# Stereoscopic vision — author brief

Status: source/key shots ready, six24s bilingual chapters **draft** until integration-owner review. Author model tests are not independent visual acceptance. Full watch, phone measurement, listening, device performance and resource-failure checks not-run.

## Misconception and portfolio addition

Two views do not guarantee reliable depth: calibrated geometry and correspondence matter. Negative fixation-relative disparity is not negative world depth. Zero baseline is undetermined, not zero distance. Prerequisite: an image coordinate is a projection. Adds viewpoint geometry to `camera-lens`, distinct from `myopia-lens` optical focus and `lidar-ranging` flight time. No medical claim or individual visual-acuity prediction.

## Actual sources and model conditions

| Claim                                                                              | Actually read source                                                                                                                | Assumptions                                                      |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Slightly different eye views supply a binocular depth cue alongside monocular cues | [OpenStax Psychology2e §5.3 Vision, depth perception](https://openstax.org/books/psychology-2e/pages/5-3-vision)                    | Geometric illustration here, not a complete neural percept model |
| Rectified stereo disparity equals fB/Z and needs corresponding points              | [OpenCV Depth Map from Stereo Images, Basics and matching discussion](https://docs.opencv.org/4.x/dd/d53/tutorial_py_depthmap.html) | Known virtual focal length and baseline, aligned pinhole cameras |

The lower views are explicitly rectified virtual image planes registered to a central fixation point. They must not be called anatomical retinal positions. Raw projections are uL=f(X+B/2)/Z and uR=f(X−B/2)/Z; subtract/add half the fixation disparity to obtain registered positions. The top plan uses nonuniform scales, visibly disclosed, and exact point/eye coordinates. The code also computes physical angular disparity independently, but does not read angles from the anisotropic drawing.

Independent benchmarks: B64mm,f17mm,Z800mm,X20mm→rawL1.105mm,rawR−.255mm; inversely recover Z and lateralX. Fixation800 gives relative disparities0at800,+1.36at400,−.68at1600. ZeroB gives no reconstruction. Equal200mm depth gap farther away has smaller relative disparity. Two points atX±20,Z800 yield true800/800; crossed correspondences yield2133.33/492.31mm. These are mathematical counterexamples, not a prediction of perceived false depth. Manual matching uses current baseline/fixation/depth, including impossible-pair states displayed as undetermined.

## Independent art direction and six chapters

Pale botanical-green perspective plate with two linked instruments: a narrow plan of two viewpoints and a separately magnified pair of registered image rows. Orange target versus muted-green fixation; connecting dotted matches expose coordinate differences.

1. Common fixation gives zero registered target disparity.
2. Move target nearer, opposite row shifts yield positive relative disparity.
3. Move it farther, signed disparity reverses; reconstruct positive world depth.
4. Collapse baseline continuously, making inverse depth undetermined atzero.
5. Keep200mm gap and move both reference and target farther, showing lower geometric sensitivity.
6. Two same-depth points, then crossed assignments, change reconstructed depths without changing observations.

Phone composes a125px plan and110px registered-view block rather than shrinking the desktop. SVG labels26units and CSS16px support320px; complete-player≤740remains browser-verification target. Automatic phone hides disclosure. Need independent review of zero-baseline frame, worst-case matching/explore coordinates, correspondence overlays and all English rows. Model/control/film share one state; no own clocks or resources.
