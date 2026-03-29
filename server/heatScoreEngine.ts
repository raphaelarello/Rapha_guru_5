/**
 * ENGINE DE INTENSIDADE "AO VIVO" BASEADA EM:
 * - Estatísticas snapshot (shots, SOT, corners, dangerous attacks, possession)
 * - Eventos (gols, cartões, pênalti, VAR)
 *
 * Funciona com snapshots periódicos (ex: a cada 10s).
 * Mantém estado por fixture pra calcular deltas e tendências.
 */

export type ApiFootballStatisticItem = { type: string; value: number | string | null };
export type ApiFootballTeamStats = {
  team: { id: number; name: string };
  statistics: ApiFootballStatisticItem[];
};

export type ApiFootballEvent = {
  time: { elapsed: number | null; extra: number | null };
  team?: { id: number; name: string };
  player?: { id: number; name: string };
  assist?: { id: number; name: string };
  type: string;
  detail: string;
  comments?: string | null;
};

export type FixtureLiveSnapshot = {
  fixtureId: number;
  nowTs: number;
  minute: number;
  stats: ApiFootballTeamStats[];
  events: ApiFootballEvent[];
};

export type HeatDrivers = {
  shotsTotal: number;
  shotsOnTarget: number;
  corners: number;
  dangerousAttacks: number;
  possession: number;
  cardsYellow: number;
  cardsRed: number;
  goals: number;
};

export type HeatOutput = {
  fixtureId: number;
  minute: number;
  intensityNow: number;
  drivers: HeatDrivers;
  reasons: string[];
  seriesPoint: { t: number; v: number };
  recentEvents: Array<{ m: number; label: string }>;
};

type FixtureState = {
  lastTs: number;
  lastMinute: number;
  lastDrivers: HeatDrivers | null;
  emaIntensity: number;
  spikeEnergy: number;
  lastEventKeySet: Set<string>;
};

export type HeatConfig = {
  emaAlpha: number;
  spikeDecayPerMin: number;
  maxSeriesPoints: number;
  wRateShots: number;
  wRateSOT: number;
  wRateCorners: number;
  wRateDanger: number;
  wLevelSOT: number;
  wLevelDanger: number;
  spikeGoal: number;
  spikeRed: number;
  spikePenalty: number;
  spikeVar: number;
  spikeYellow: number;
  spikeSub: number;
};

export const DEFAULT_HEAT_CONFIG: HeatConfig = {
  emaAlpha: 0.35,
  spikeDecayPerMin: 0.55,
  maxSeriesPoints: 60,
  wRateShots: 1.2,
  wRateSOT: 2.2,
  wRateCorners: 1.1,
  wRateDanger: 1.8,
  wLevelSOT: 0.7,
  wLevelDanger: 0.6,
  spikeGoal: 18,
  spikeRed: 22,
  spikePenalty: 14,
  spikeVar: 10,
  spikeYellow: 5,
  spikeSub: 3,
};

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

function safeNumber(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return 0;
    const pct = s.endsWith('%') ? s.slice(0, -1) : s;
    const n = Number(pct);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function pickStat(statistics: ApiFootballStatisticItem[], names: string[]): number {
  const map = new Map(statistics.map((x) => [x.type, x.value]));
  for (const name of names) {
    if (map.has(name)) return safeNumber(map.get(name));
  }
  return 0;
}

export function normalizeDrivers(stats: ApiFootballTeamStats[], events: ApiFootballEvent[]): HeatDrivers {
  const a = stats?.[0]?.statistics ?? [];
  const b = stats?.[1]?.statistics ?? [];

  const shotsA = pickStat(a, ['Total Shots', 'Shots Total']);
  const shotsB = pickStat(b, ['Total Shots', 'Shots Total']);
  const sotA = pickStat(a, ['Shots on Goal', 'Shots On Goal']);
  const sotB = pickStat(b, ['Shots on Goal', 'Shots On Goal']);
  const cornersA = pickStat(a, ['Corner Kicks', 'Corners']);
  const cornersB = pickStat(b, ['Corner Kicks', 'Corners']);
  const dangerA = pickStat(a, ['Dangerous Attacks']);
  const dangerB = pickStat(b, ['Dangerous Attacks']);
  const possA = pickStat(a, ['Ball Possession']);
  const possB = pickStat(b, ['Ball Possession']);

  const cardsYellow = events.reduce((acc, e) => {
    if (e.type?.toLowerCase() === 'card' && e.detail?.toLowerCase().includes('yellow')) return acc + 1;
    return acc;
  }, 0);

  const cardsRed = events.reduce((acc, e) => {
    if (e.type?.toLowerCase() === 'card' && e.detail?.toLowerCase().includes('red')) return acc + 1;
    return acc;
  }, 0);

  const goals = events.reduce((acc, e) => {
    if (e.type?.toLowerCase() === 'goal') return acc + 1;
    return acc;
  }, 0);

  return {
    shotsTotal: shotsA + shotsB,
    shotsOnTarget: sotA + sotB,
    corners: cornersA + cornersB,
    dangerousAttacks: dangerA + dangerB,
    possession: clamp((possA + possB) / 2, 0, 100),
    cardsYellow,
    cardsRed,
    goals,
  };
}

function eventKey(fixtureId: number, e: ApiFootballEvent): string {
  const m = e.time?.elapsed ?? 0;
  const x = e.time?.extra ?? 0;
  const t = `${e.type}|${e.detail}|${m}+${x}|${e.team?.id ?? ''}|${e.player?.id ?? e.player?.name ?? ''}`;
  return `${fixtureId}:${t}`;
}

function summarizeRecentEvents(events: ApiFootballEvent[], max = 6): Array<{ m: number; label: string }> {
  const sorted = [...(events ?? [])].sort((a, b) => {
    const am = (a.time?.elapsed ?? 0) * 100 + (a.time?.extra ?? 0);
    const bm = (b.time?.elapsed ?? 0) * 100 + (b.time?.extra ?? 0);
    return bm - am;
  });

  return sorted.slice(0, max).map((e) => {
    const m = (e.time?.elapsed ?? 0) + ((e.time?.extra ?? 0) ? e.time.extra! / 100 : 0);
    const label = `${e.type}: ${e.detail}`;
    return { m: Math.floor(m), label };
  });
}

function computeSpikes(
  fixtureId: number,
  state: FixtureState,
  events: ApiFootballEvent[],
  cfg: HeatConfig
): { spikeAdded: number; reasons: string[] } {
  let added = 0;
  const reasons: string[] = [];

  for (const e of events ?? []) {
    const key = eventKey(fixtureId, e);
    if (state.lastEventKeySet.has(key)) continue;
    state.lastEventKeySet.add(key);

    const type = (e.type ?? '').toLowerCase();
    const detail = (e.detail ?? '').toLowerCase();

    if (type === 'goal') {
      added += cfg.spikeGoal;
      reasons.push('Gol recente');
      continue;
    }

    if (type === 'card' && detail.includes('red')) {
      added += cfg.spikeRed;
      reasons.push('Cartão vermelho');
      continue;
    }

    if (type === 'card' && detail.includes('yellow')) {
      added += cfg.spikeYellow;
      reasons.push('Cartão amarelo');
      continue;
    }

    if (detail.includes('penalty')) {
      added += cfg.spikePenalty;
      reasons.push('Pênalti/risco');
      continue;
    }

    if (type.includes('var') || detail.includes('var')) {
      added += cfg.spikeVar;
      reasons.push('VAR');
      continue;
    }

    if (type.includes('subst')) {
      added += cfg.spikeSub;
      continue;
    }
  }

  return { spikeAdded: added, reasons: Array.from(new Set(reasons)).slice(0, 3) };
}

function perMinuteRate(curr: number, prev: number, minutesDelta: number): number {
  if (minutesDelta <= 0) return 0;
  return (curr - prev) / minutesDelta;
}

function baseIntensityFromDrivers(d: HeatDrivers, cfg: HeatConfig): number {
  const level =
    cfg.wLevelSOT * clamp(d.shotsOnTarget / 8, 0, 1) +
    cfg.wLevelDanger * clamp(d.dangerousAttacks / 80, 0, 1);
  return level * 40;
}

function rateIntensity(curr: HeatDrivers, prev: HeatDrivers, minutesDelta: number, cfg: HeatConfig): number {
  const rShots = perMinuteRate(curr.shotsTotal, prev.shotsTotal, minutesDelta);
  const rSot = perMinuteRate(curr.shotsOnTarget, prev.shotsOnTarget, minutesDelta);
  const rCorners = perMinuteRate(curr.corners, prev.corners, minutesDelta);
  const rDanger = perMinuteRate(curr.dangerousAttacks, prev.dangerousAttacks, minutesDelta);

  const sShots = clamp(rShots / 3.5, 0, 1);
  const sSot = clamp(rSot / 1.2, 0, 1);
  const sCorners = clamp(rCorners / 0.8, 0, 1);
  const sDanger = clamp(rDanger / 18, 0, 1);

  const weighted =
    cfg.wRateShots * sShots +
    cfg.wRateSOT * sSot +
    cfg.wRateCorners * sCorners +
    cfg.wRateDanger * sDanger;

  return clamp(weighted, 0, 10) * 6;
}

function decaySpikeEnergy(spikeEnergy: number, minutesDelta: number, cfg: HeatConfig): number {
  if (minutesDelta <= 0) return spikeEnergy;
  const decay = Math.pow(cfg.spikeDecayPerMin, minutesDelta);
  return spikeEnergy * decay;
}

export class HeatScoreEngine {
  private readonly cfg: HeatConfig;
  private readonly states = new Map<number, FixtureState>();
  private seriesHistory = new Map<number, Array<{ t: number; v: number }>>();

  constructor(cfg?: Partial<HeatConfig>) {
    this.cfg = { ...DEFAULT_HEAT_CONFIG, ...(cfg ?? {}) };
  }

  ingest(snapshot: FixtureLiveSnapshot): HeatOutput {
    const { fixtureId, nowTs, minute, stats, events } = snapshot;

    const state =
      this.states.get(fixtureId) ??
      ({
        lastTs: nowTs,
        lastMinute: minute,
        lastDrivers: null,
        emaIntensity: 15,
        spikeEnergy: 0,
        lastEventKeySet: new Set(),
      } as FixtureState);

    const drivers = normalizeDrivers(stats, events);
    const minutesDelta = Math.max(0, minute - state.lastMinute);

    let baseIntensity = baseIntensityFromDrivers(drivers, this.cfg);

    if (state.lastDrivers) {
      const rateIntensityVal = rateIntensity(drivers, state.lastDrivers, minutesDelta, this.cfg);
      baseIntensity += rateIntensityVal;
    }

    const { spikeAdded, reasons: spikeReasons } = computeSpikes(fixtureId, state, events, this.cfg);
    state.spikeEnergy = decaySpikeEnergy(state.spikeEnergy, minutesDelta, this.cfg) + spikeAdded;

    const combined = baseIntensity + state.spikeEnergy;
    const intensityNow = clamp(combined, 0, 100);

    state.emaIntensity = state.emaIntensity * (1 - this.cfg.emaAlpha) + intensityNow * this.cfg.emaAlpha;
    const smoothedIntensity = clamp(state.emaIntensity, 0, 100);

    const series = this.seriesHistory.get(fixtureId) ?? [];
    series.push({ t: nowTs, v: smoothedIntensity });
    if (series.length > this.cfg.maxSeriesPoints) {
      series.shift();
    }
    this.seriesHistory.set(fixtureId, series);

    state.lastTs = nowTs;
    state.lastMinute = minute;
    state.lastDrivers = drivers;
    this.states.set(fixtureId, state);

    const recentEvents = summarizeRecentEvents(events);

    return {
      fixtureId,
      minute,
      intensityNow: Math.round(smoothedIntensity),
      drivers,
      reasons: spikeReasons,
      seriesPoint: { t: nowTs, v: Math.round(smoothedIntensity) },
      recentEvents,
    };
  }

  getSeriesHistory(fixtureId: number): Array<{ t: number; v: number }> {
    return this.seriesHistory.get(fixtureId) ?? [];
  }

  reset(fixtureId: number) {
    this.states.delete(fixtureId);
    this.seriesHistory.delete(fixtureId);
  }
}
