# Excavator — from oil flow to a closed linkage

[简体中文](../zh-CN/examples/excavator-brief.md) · [Production guide](../creating-a-scene.md)

## Question and direction

How does a cylinder's straight push lift and curl a bucket? Follow its two attachment pins, then the connected links. The turning point separates two often-confused quantities: pressure supplies the force required by load and leverage; flow determines ideal speed once the load can be moved.

The apparatus is an original teaching assembly with twin boom cylinders, a stick cylinder and a bucket four-bar linkage. It is not a reconstruction of the Cat 303.5 or any other named machine. Warm yellow painted steel, exposed metal rods, visible clevises and a restrained dark chassis make the connections readable. A cylinder/circuit section replaces the complete machine when oil paths are the subject. The main visual carries one observation; optional formulas and controls unfold separately.

## Seven directed chapters

The recovered draft had a 175-second timeline. After the revised bilingual speech was measured, both tracks share a **176-second, seven-chapter film**; the holding/relief chapter takes 26 seconds. The director reads the measured shared timeline rather than assuming every chapter lasts 25 seconds. These windows record the current audio metadata, not playback or listening acceptance; see the [review record](../qa-excavator.md).

| Measured window | Observation                                        | Model and composition                                                                                                                             |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–25 s          | First curl the bucket, then raise the boom.        | Fixed links move about shared pins; extending the bucket cylinder curls the bucket inward. Establish the complete machine.                        |
| 25–50 s         | Supply enters one chamber while the other drains.  | Show the piston, rod and two oil ports. Keep supply and return paths connected through the directional valve.                                     |
| 50–75 s         | A straight push produces joint torque.             | The same cylinder pin positions determine the perpendicular lever arm as boom pose changes. Return to the assembly.                               |
| 75–100 s        | More load requires more pressure.                  | Hold the geometry and vary the equivalent payload; compare required pressure with that same load.                                                 |
| 100–125 s       | More flow makes each piston move faster.           | Total boom flow divides equally between two identical cylinders. The single-cylinder section integrates Qtotal/(2A) over actual chapter time.     |
| 125–151 s       | Holding differs from an attempted overloaded lift. | First close actuator ports and destroke the ideal pump. Then renew the lift command and show pump-side relief while lifting stops.                |
| 151–176 s       | The bucket closes through a connected four-bar.    | Follow the extending bucket-cylinder rod into the solved rocker/link joint. A deliberate local view retains the bucket tip and every linkage pin. |

Phone composition selects the current machine or section rather than stacking both. Readouts remain in CSS pixels beneath the selected view. Close-up bounds must cover the full curl range. The 2D runtime fallback must retain the same linkage, cylinder direction and hydraulic state. Startup capability rejection remains a separate static-content path.

## Model contract

- Distances are metres, angles radians, force newtons, pressure pascals, and supplied flow is converted from L/min to m³/s. Physical housings, rods, link lengths and pin locations are shared by model, renderer, fallback and cover.
- Curl means inward bucket rotation. Its cylinder extends as curl increases; the two short-link lengths remain fixed. Closure alone does not validate the direction of the mechanism.
- For one ideal single-rod cylinder, extension-positive force is `pcap A − prod (A − Arod)`, with gauge pressures and no friction. A single `Δp A` expression does not cover unequal chamber areas in general.
- The lifting calculation assumes two equal boom cylinders, equal flow division, negligible losses and zero return backpressure: `Ftotal = 2pA`, `v = Qtotal/(2A)`. Equal sharing is this model's assumption, not a universal excavator property.
- Required pressure follows `2 prequired A d = Σ(mgx)`. The pin-derived force line supplies d; the rendered geometry and equivalent load locations supply gravity moments. Required pressure and pressure capped at the chosen 24 MPa ceiling are different values.
- Manual pose controls compare static geometry and loads; they do not integrate an operator's lift command. The displayed ideal extension speed is calculated from boom supply flow. The integrated cylinder section represents one boom cylinder, not whole-machine dynamic motion.
- During ideal moving operation, hydraulic and total actuator power agree. With the pump flowing through relief and cylinders stopped, `pQ` is pump-side input, while actuator mechanical power is zero. Do not label all pump flow as useful cylinder flow.
- Closed-port holding and renewed overloaded lifting are distinct valve states. Main supply relief cannot protect an already isolated cylinder chamber. Ideal pump destroking and trapped-oil holding simplify the load-sensing, metering, leakage and dedicated load-holding hardware of real machines.

Omitted effects include inertia, friction, oil compressibility, leakage, soil forces, slew/travel, structural deformation and whole-machine stability. The 24 MPa ceiling and 0–9000 kg equivalent-load control illustrate a limit; they are not a lifting chart, working load rating or maintenance schematic.

## Bilingual content and integration

The articles retain `understand`, `try` and `deeper` anchors; route-level language navigation is generated by the site. Speech names the piston, valve, cylinder or linkage instead of a desktop-only left/right position. Chapter 6 must name the renewed lift command after holding; chapter 7 must say that the bucket cylinder extends to curl the bucket. Only the integration owner updates the canonical narration, translation dictionary and generated recordings/manifests.

The prior draft was recovered from Git tree `3115a26af695c9e6d34050ec291df7fa5deacd08`; its ten frozen source hashes match the locally retained earlier review. That identifies the starting material. Earlier tests, sampled runtime and browser observations do not validate the revised bucket direction, valve state or new speech. This brief records no new visual, listening, physical-device or release acceptance.

## Primary sources and what they support

- [Komatsu, Development of Oil Passage Integrated Cylinder, 2021, section 2.6 and Fig. 3](https://www.komatsu.jp/en/-/media/home/aboutus/innovation/technology/techreport/2021/en/174e04.pdf?hash=C3ED84F6F844EB21E05470C1C93A2BD1&rev=-1): cap-end supply extends the rod and moves the bucket toward digging; rod-end supply retracts it toward dumping.
- [Parker, Mobile Cylinder Products and Application Guide, HY18-1000, engineering data](https://www.parker.com/content/dam/Parker-com/Literature/Industrial-Cylinder/cylinder/cat/english/Parker_Mobile_Cylinder_Products_Catalog_HY18-1000.pdf): effective cylinder area, force and flow/velocity relationships.
- [Parker, L90LS directional control valve](https://www.parker.com/content/dam/Parker-com/Literature/Mobile-Controls---Europe/Literature-Files-MCDE/HY17-8504-UK_L90.pdf): load sensing, closed-center actuator paths, metering, leakage and distinct main/port relief functions. The scene is a simplified explanatory circuit, not this valve's schematic.
- [Bosch Rexroth, A-VBC-90-SX check and metering valve, RE 18309-04](https://apps.boschrexroth.com/products/compact-hydraulics/ch-catalog/pdf/084796XYZ_RE18309-04.pdf): dedicated boom-cylinder load holding, controlled lowering and overload/shock protection.
- [Caterpillar, 303.5 hydraulic excavator](https://h-cpc.cat.com/cmms/v2?cid=406&f=product&gid=154&it=product&lid=en&nc=1&pid=752011&sc=P420): a manufacturer's machine-level distinction between pump flow and equipment pressure. The illustrated machine geometry, twin cylinders and variable-pump assumption are not specifications copied from this model.

Source text was checked on 2026-09-06. No manufacturer images, meshes or document text are reproduced in the scene.
