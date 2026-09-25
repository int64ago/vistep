/**
 * Teaching model of international roaming: identity parsing (ITU-T E.212 / 3GPP TS 23.003),
 * automatic PLMN selection order (TS 23.122 §4.4.3.1.1), EPS AKA with real MILENAGE
 * (TS 33.102 §6.3, TS 33.401 §6.1, TS 35.206), location registration (TS 29.272),
 * roaming data paths (TS 23.401 §4.2.2) and mobile-terminated call routing (TS 23.018).
 * All identities are fictional: MCC 001/MNC 01 is the 3GPP test network code; MCC 002 is used
 * here as an invented visited country. K and OP are the public TS 35.208 test set 1 values.
 */
import {
  deriveKasme,
  milenage,
  mrBitDistance,
  mrBytes,
  mrFlipBit,
  mrHex,
  mrXor,
  plmnIdBytes,
  type Bytes,
} from './mobile-roaming-milenage';

// ---------------- identities ----------------
export type Plmn = { mcc: string; mnc: string };
export const plmnCode = (p: Plmn) => `${p.mcc}-${p.mnc}`;
export const MR_HOME: Plmn = { mcc: '001', mnc: '01' };
export const MR_MSIN = '0123456789';
export const MR_IMSI = `${MR_HOME.mcc}${MR_HOME.mnc}${MR_MSIN}`;

export type ImsiParts = { mcc: string; mnc: string; msin: string };
/**
 * The IMSI alone does not say whether the MNC has 2 or 3 digits: the SIM's administrative data
 * (EF_AD) states it, and a visited network knows it from its roaming partner table.
 */
export function mrParseImsi(imsi: string, mncDigits: 2 | 3): ImsiParts {
  if (!/^\d{6,15}$/.test(imsi)) throw new RangeError('IMSI must have 6 to 15 decimal digits');
  if (mncDigits !== 2 && mncDigits !== 3) throw new RangeError('MNC has 2 or 3 digits');
  if (imsi.length < 3 + mncDigits + 1) throw new RangeError('IMSI too short for its MNC');
  return {
    mcc: imsi.slice(0, 3),
    mnc: imsi.slice(3, 3 + mncDigits),
    msin: imsi.slice(3 + mncDigits),
  };
}
/** Diameter home realm derived from the IMSI (TS 23.003 §19.2): the visited network routes by it. */
export function mrHomeRealm(p: Plmn) {
  if (!/^\d{3}$/.test(p.mcc) || !/^\d{2,3}$/.test(p.mnc)) throw new RangeError('Invalid PLMN');
  return `epc.mnc${p.mnc.padStart(3, '0')}.mcc${p.mcc}.3gppnetwork.org`;
}

// ---------------- network selection ----------------
export type VisitedOperator = {
  id: 'A' | 'B' | 'C';
  plmn: Plmn;
  /** Illustrative received reference-signal power at the airport, dBm. */
  rsrpDbm: number;
  /** Whether this operator has a roaming agreement with the home operator. */
  agreement: boolean;
};
export const MR_VISITED: VisitedOperator[] = [
  { id: 'A', plmn: { mcc: '002', mnc: '01' }, rsrpDbm: -97, agreement: true },
  { id: 'B', plmn: { mcc: '002', mnc: '02' }, rsrpDbm: -90, agreement: true },
  { id: 'C', plmn: { mcc: '002', mnc: '03' }, rsrpDbm: -79, agreement: false },
];
/** Operator-controlled PLMN selector list on the SIM (EF_OPLMNwAcT), in priority order. */
export const MR_SIM_PREFERRED = ['002-01', '002-02'];
/** TS 23.122: an E-UTRAN cell is "high quality" when RSRP ≥ −110 dBm. */
export const MR_HIGH_QUALITY_DBM = -110;

export type SelectionReason = 'home' | 'preferred' | 'high-quality' | 'other';
export type Attempt = {
  operator: VisitedOperator;
  reason: SelectionReason;
  rank: number;
  result: 'accepted' | 'no-agreement' | 'roaming-barred';
};
export type Selection = {
  homeFound: boolean;
  candidates: { operator: VisitedOperator; reason: SelectionReason; rank?: number }[];
  attempts: Attempt[];
  registered: VisitedOperator | null;
  /** Without registration the phone keeps limited service: emergency calls only. */
  limitedService: boolean;
};

/**
 * Automatic mode: HPLMN first, then SIM preference lists in priority order, then other
 * high-quality networks, then the rest by decreasing signal (TS 23.122 §4.4.3.1.1). The standard
 * orders the high-quality group randomly; this model sorts it by signal to stay deterministic.
 * A rejected PLMN is added to the forbidden list and the next candidate is tried.
 * Manual mode tries only the chosen operator.
 */
export function mrSelectNetwork(options: {
  found?: VisitedOperator[];
  preferred?: string[];
  manual?: VisitedOperator['id'] | null;
  roamingEnabled?: boolean;
}): Selection {
  const found = options.found ?? MR_VISITED,
    preferred = options.preferred ?? MR_SIM_PREFERRED,
    roamingEnabled = options.roamingEnabled ?? true;
  for (const o of found)
    if (!Number.isFinite(o.rsrpDbm)) throw new RangeError('Signal must be finite');
  const homeFound = found.some((o) => plmnCode(o.plmn) === plmnCode(MR_HOME));
  const listed = preferred
    .map((code, i) => ({ operator: found.find((o) => plmnCode(o.plmn) === code), rank: i + 1 }))
    .filter((x): x is { operator: VisitedOperator; rank: number } => !!x.operator)
    .map((x) => ({ ...x, reason: 'preferred' as const }));
  const rest = found
    .filter((o) => !listed.some((l) => l.operator === o))
    .sort((a, b) => b.rsrpDbm - a.rsrpDbm)
    .map((operator) => ({
      operator,
      reason: (operator.rsrpDbm >= MR_HIGH_QUALITY_DBM
        ? 'high-quality'
        : 'other') as SelectionReason,
    }));
  const candidates: Selection['candidates'] = [...listed, ...rest];
  const tried = options.manual
    ? candidates.filter((c) => c.operator.id === options.manual)
    : candidates;
  const attempts: Attempt[] = [];
  let registered: VisitedOperator | null = null;
  for (const [i, c] of tried.entries()) {
    const result: Attempt['result'] = !c.operator.agreement
      ? 'no-agreement'
      : roamingEnabled
        ? 'accepted'
        : 'roaming-barred';
    attempts.push({ operator: c.operator, reason: c.reason, rank: i + 1, result });
    if (result === 'accepted') {
      registered = c.operator;
      break;
    }
  }
  return { homeFound, candidates, attempts, registered, limitedService: !registered };
}

// ---------------- authentication (EPS AKA with MILENAGE) ----------------
export const MR_KEY = mrBytes('465b5ce8b199b49faa5f0a2ee238a6bc');
export const MR_OP = mrBytes('cdc202d5123e20f62b6d676ac72cb318');
export const MR_RAND = mrBytes('23553cbe9637a89d218ae64dae47bf35');
export const MR_SQN = mrBytes('ff9bb4d0b607');
/** TS 35.208 test value. Its first bit is 1, which is also the EPS "AMF separation bit" that
 * TS 33.401 requires in vectors for E-UTRAN, so the same value serves the 4G story. */
export const MR_AMF = mrBytes('b9b9');
/** Highest sequence number the SIM has already accepted. */
export const MR_SQN_MS = mrBytes('ff9bb4d0b5e7');
/** An older vector recorded earlier: same subscriber, used sequence number. */
export const MR_OLD_RAND = mrBytes('c00d603103dcee52c4478119494202e8');
export const MR_OLD_SQN = mrBytes('ff9bb4d0b5c7');
/** TS 33.102 Annex C: accept only SQN within Δ above the highest accepted value. */
export const MR_SQN_DELTA = 2 ** 28;

export type Tamper = 'none' | 'key' | 'rand' | 'replay';
export type AuthVector = { rand: Bytes; autn: Bytes; xres: Bytes; kasme: Bytes; sqn: Bytes };
export type AkaRun = {
  tamper: Tamper;
  keyBit: number;
  serving: Plmn;
  vector: AuthVector;
  /** What actually reaches the phone. */
  received: { rand: Bytes; autn: Bytes };
  simKey: Bytes;
  sim: {
    ak: Bytes;
    sqn: Bytes;
    xmac: Bytes;
    mac: Bytes;
    macOk: boolean;
    sqnFresh: boolean;
    res: Bytes;
    auts: Bytes | null;
    /** Highest sequence number the SIM had already accepted. */
    sqnMs: Bytes;
  };
  /** RES compared against XRES by the visited network, as if the phone answered anyway. */
  resMatches: boolean;
  resBitDistance: number;
  outcome: 'success' | 'mac-failure' | 'sync-failure' | 'res-mismatch';
};
const sqnValue = (b: Bytes) => b.reduce((n, v) => n * 256 + v, 0);

/** Home network: RAND, AUTN = SQN⊕AK ‖ AMF ‖ MAC, XRES and K_ASME bound to the serving network. */
export function mrMakeVector(key: Bytes, rand: Bytes, sqn: Bytes, serving: Plmn): AuthVector {
  const f = milenage({ k: key, rand, sqn, amf: MR_AMF, op: MR_OP });
  const concealed = mrXor(sqn, f.ak);
  return {
    rand,
    sqn,
    autn: Uint8Array.from([...concealed, ...MR_AMF, ...f.macA]),
    xres: f.res,
    kasme: deriveKasme(f.ck, f.ik, plmnIdBytes(serving.mcc, serving.mnc), concealed),
  };
}

export function mrRunAka(options: {
  tamper?: Tamper;
  keyBit?: number;
  serving?: Plmn;
  simSqn?: Bytes;
}): AkaRun {
  const tamper = options.tamper ?? 'none',
    keyBit = options.keyBit ?? 0,
    serving = options.serving ?? MR_VISITED[0].plmn,
    sqnMs = options.simSqn ?? MR_SQN_MS;
  if (!['none', 'key', 'rand', 'replay'].includes(tamper)) throw new RangeError('Unknown tamper');
  if (!Number.isInteger(keyBit) || keyBit < 0 || keyBit > 127)
    throw new RangeError('Key bit 0–127');
  const vector =
    tamper === 'replay'
      ? mrMakeVector(MR_KEY, MR_OLD_RAND, MR_OLD_SQN, serving)
      : mrMakeVector(MR_KEY, MR_RAND, MR_SQN, serving);
  // A fake base station flipping one RAND bit on the way; AUTN left intact.
  const rand = tamper === 'rand' ? mrFlipBit(vector.rand, 77) : vector.rand;
  const simKey = tamper === 'key' ? mrFlipBit(MR_KEY, keyBit) : MR_KEY;
  const f = milenage({ k: simKey, rand, sqn: new Uint8Array(6), amf: MR_AMF, op: MR_OP });
  const sqn = mrXor(vector.autn.slice(0, 6), f.ak);
  const mac = vector.autn.slice(8, 16);
  const xmac = milenage({ k: simKey, rand, sqn, amf: vector.autn.slice(6, 8), op: MR_OP }).macA;
  const macOk = mrHex(xmac) === mrHex(mac);
  const diff = sqnValue(sqn) - sqnValue(sqnMs);
  const sqnFresh = diff > 0 && diff <= MR_SQN_DELTA;
  // Resynchronisation token: AUTS = SQN_MS⊕AK* ‖ MAC-S, with a dummy all-zero AMF (TS 33.102 §6.3.3).
  const resync = milenage({ k: simKey, rand, sqn: sqnMs, amf: new Uint8Array(2), op: MR_OP });
  const auts =
    macOk && !sqnFresh ? Uint8Array.from([...mrXor(sqnMs, resync.akStar), ...resync.macS]) : null;
  const res = f.res;
  const resMatches = mrHex(res) === mrHex(vector.xres);
  const outcome: AkaRun['outcome'] = !macOk
    ? 'mac-failure'
    : !sqnFresh
      ? 'sync-failure'
      : resMatches
        ? 'success'
        : 'res-mismatch';
  return {
    tamper,
    keyBit,
    serving,
    vector,
    received: { rand, autn: vector.autn },
    simKey,
    sim: { ak: f.ak, sqn, xmac, mac, macOk, sqnFresh, res, auts, sqnMs },
    resMatches,
    resBitDistance: mrBitDistance(res, vector.xres),
    outcome,
  };
}

// ---------------- location registration ----------------
export type HomeRecord = {
  imsi: string;
  servingPlmn: Plmn;
  mmeHost: string;
  vlr: string;
  profile: { dataRoaming: boolean; voice: boolean; apn: string };
};
export const mrMmeHost = (p: Plmn) =>
  `mmec01.mmegi8001.mme.epc.mnc${p.mnc.padStart(3, '0')}.mcc${p.mcc}.3gppnetwork.org`;
export const MR_RECORD_BEFORE: HomeRecord = {
  imsi: MR_IMSI,
  servingPlmn: MR_HOME,
  mmeHost: mrMmeHost(MR_HOME),
  vlr: 'VLR 001-01',
  profile: { dataRoaming: true, voice: true, apn: 'internet' },
};
/**
 * Update Location (S6a ULR/ULA): the HSS stores the new serving MME, sends Cancel Location to the
 * old one, and returns the subscription profile. A subscription without roaming is refused
 * (Experimental-Result DIAMETER_ERROR_ROAMING_NOT_ALLOWED, 5004).
 */
export function mrUpdateLocation(record: HomeRecord, serving: Plmn, roamingEnabled = true) {
  if (!roamingEnabled)
    return { accepted: false as const, result: 5004, record, cancelled: null, profile: null };
  const next: HomeRecord = {
    ...record,
    servingPlmn: serving,
    mmeHost: mrMmeHost(serving),
    vlr: `VLR ${plmnCode(serving)}`,
  };
  return {
    accepted: true as const,
    result: 2001,
    record: next,
    cancelled: record.mmeHost === next.mmeHost ? null : record.mmeHost,
    profile: record.profile,
  };
}

// ---------------- data routes and latency ----------------
export type Breakout = 'home-routed' | 'local-breakout';
export type Destination = 'local' | 'home';
/** Stated teaching assumptions for the latency estimate (not measurements). */
export const MR_PATH = {
  /** Light in silica fibre: c / 1.468 ≈ 204 km per millisecond. */
  fibreKmPerMs: 299_792.458 / 1.468 / 1000,
  /** Cables do not follow the great circle. */
  routeFactor: 1.4,
  /** Radio access plus the visited core, round trip. */
  radioRttMs: 25,
  /** Fixed forwarding allowance per gateway or exchange crossed, per round trip (no queuing modelled). */
  nodeRttMs: 2,
  /** Distance from a gateway to a server in the same country. */
  domesticKm: 60,
  defaultDistanceKm: 8000,
  minDistanceKm: 300,
  maxDistanceKm: 16000,
};
export type RouteLeg = {
  id: 'radio' | 'ipx' | 'internet-abroad' | 'domestic';
  km: number;
  rttMs: number;
};
export type DataRoute = {
  breakout: Breakout;
  destination: Destination;
  distanceKm: number;
  legs: RouteLeg[];
  nodes: string[];
  rttMs: number;
  publicAddress: string;
  addressCountry: 'home' | 'visited';
};

export function mrDataRoute(
  breakout: Breakout,
  destination: Destination,
  distanceKm = MR_PATH.defaultDistanceKm,
): DataRoute {
  if (
    !Number.isFinite(distanceKm) ||
    distanceKm < MR_PATH.minDistanceKm ||
    distanceKm > MR_PATH.maxDistanceKm
  )
    throw new RangeError('Distance outside the model range');
  const rtt = (km: number) => (2 * km * MR_PATH.routeFactor) / MR_PATH.fibreKmPerMs;
  const leg = (id: RouteLeg['id'], km: number): RouteLeg => ({ id, km, rttMs: rtt(km) });
  const legs: RouteLeg[] = [{ id: 'radio', km: 0, rttMs: MR_PATH.radioRttMs }];
  let nodes: string[];
  if (breakout === 'home-routed') {
    // Visited SGW —S8 GTP tunnel over IPX→ home PGW, then out to the Internet at home.
    legs.push(leg('ipx', distanceKm));
    legs.push(
      destination === 'local'
        ? leg('internet-abroad', distanceKm)
        : leg('domestic', MR_PATH.domesticKm),
    );
    nodes = ['SGW', 'IPX', 'PGW'];
  } else {
    legs.push(
      destination === 'local'
        ? leg('domestic', MR_PATH.domesticKm)
        : leg('internet-abroad', distanceKm),
    );
    nodes = ['SGW', 'PGW'];
  }
  const rttMs = legs.reduce((s, l) => s + l.rttMs, 0) + nodes.length * MR_PATH.nodeRttMs;
  return {
    breakout,
    destination,
    distanceKm,
    legs,
    nodes,
    rttMs,
    // RFC 5737 documentation address blocks stand in for the two gateways' address pools.
    publicAddress: breakout === 'home-routed' ? '198.51.100.23' : '203.0.113.45',
    addressCountry: breakout === 'home-routed' ? 'home' : 'visited',
  };
}

// ---------------- mobile-terminated call ----------------
export type Caller = 'home' | 'visited';
export type CallStep = {
  id: 'dial' | 'sri' | 'prn' | 'msrn' | 'route' | 'page';
  from: Lane;
  to: Lane;
  international: boolean;
};
/** Ladder lanes: phone, visited network, international exchange, home network. */
export type Lane = 0 | 1 | 2 | 3;
/** Illustrative mobile station roaming number from the visited network's numbering range. */
export const MR_MSRN = '555 0142';
/**
 * Circuit-switched basic call handling (TS 23.018): the number belongs to the home network, so the
 * gateway MSC there asks the HLR, which asks the visited VLR for a temporary roaming number.
 * Without optimal routing, a caller in the visited country is routed via home and back.
 */
export function mrCallRoute(caller: Caller) {
  const steps: CallStep[] = [
    { id: 'dial', from: caller === 'home' ? 3 : 1, to: 3, international: caller === 'visited' },
    { id: 'sri', from: 3, to: 3, international: false },
    { id: 'prn', from: 3, to: 1, international: true },
    { id: 'msrn', from: 1, to: 3, international: true },
    { id: 'route', from: 3, to: 1, international: true },
    { id: 'page', from: 1, to: 0, international: false },
  ];
  const voiceLegs = [
    {
      from: caller === 'home' ? 'home-caller' : 'visited-caller',
      to: 'home-gmsc',
      international: caller === 'visited',
    },
    { from: 'home-gmsc', to: 'visited-msc', international: true },
  ];
  return {
    caller,
    steps,
    voiceLegs,
    internationalVoiceLegs: voiceLegs.filter((l) => l.international).length,
  };
}
