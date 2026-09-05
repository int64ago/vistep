# Planetary gearing — production brief

[简体中文](../zh-CN/examples/planetary-brief.md)

Status: integrated on the expansion branch, with two 174.5-second recordings; review is in progress. Part of the [50-scene expansion](../expansion-50.md).

The initial question is how a compact gearset can change speed and direction without swapping gears. Track one marked planet, its axle and a tooth on the sun. Distinguish the planet's spin from its orbit, then change which member is held stationary.

## Geometry and sources

The proposed standard 20° set has 24 sun teeth, 18 teeth on each of three planets and 60 internal-ring teeth. All use the same module. Concentricity requires `60 = 24 + 2 × 18`; equal spacing is compatible because `(24 + 60) / 3` is an integer. Adjacent planet tips have clearance.

The [KHK gear-system reference](https://khkchilun.com/gearknowledge/gear_technical_reference/gear_systems.html) supplies the assembly conditions and fixed-member arrangements. The [KHK dimension reference](https://khkchilun.com/gearknowledge/gear_technical_reference/calculation_gear_dimensions.html) distinguishes internal involute flanks, inward addenda, root depth and interference constraints. The renderer will use an actual internal tooth boundary, not an external wheel with its color inverted.

In the carrier frame, `Ns(ωs − ωc) + Nr(ωr − ωc) = 0`. The sun–planet mesh supplies planet spin. Absolute angles reconstruct all positions on a seek. Tests currently check both velocity constraints, assembly conditions, repeatable reconstruction and sampled full tooth-profile clearance against both neighbors in four lock configurations.

## Film direction

Plan eight chapters of roughly 20 seconds each. Timing will follow the actual Chinese and English recordings, within the 2–5 minute production contract.

| Chapter               | Visible change                                                                                    | Observation                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Assembly              | Separate members along the shaft, then bring their teeth and bearings into contact before turning | Sun, planets, ring and carrier have different jobs                                      |
| Spin and orbit        | Follow one marked planet and its axle while the ring is held                                      | The axle travels even though the planet spins the other way                             |
| Ring fixed            | Trace input and carrier marks through a measured turn                                             | Sun input turns 3.5 times for one carrier turn                                          |
| What “slower” buys    | Relate the two measured rotations to ideal work                                                   | Lower output speed permits higher output torque, without creating power                 |
| Sun fixed             | Exchange the stationary member and use ring input                                                 | The carrier follows at a different reduction                                            |
| Carrier fixed         | Hold the planet axles; drive the sun                                                              | Ring output reverses direction                                                          |
| Locked together       | Couple two central members                                                                        | Relative gear motion stops and the whole set turns together                             |
| Choose the constraint | Compare the three lock arrangements with the same input scale                                     | The constraint selects the behavior; one velocity alone cannot determine a free gearset |

The main object should be a shallow, open gear housing with real shaft and planet-axle connections. A soft oblique overview changes to a frontal contact view where tooth geometry matters. The carrier can separate axially only in the explicitly labeled assembly shot; rotating gears remain assembled. A narrow-screen composition stacks the object and rotation comparison, keeping teeth large enough to inspect. Optional exploration selects the fixed member and input angle. A 2D cutaway retains those controls.

Do not claim finite backlash, manufacturing accuracy, tooth stress, lubricant behavior, differential load sharing or real efficiency from this kinematic model. Root fillets remain simplified. Six numerical tests are model evidence, not a finished scene or a visual review.
