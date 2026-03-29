
import { apiFootball } from "./api-football";
import { cacheManager } from "./cache-manager";
import { getLeagueSeasonStats, upsertLeagueSeasonStats } from "./db";

type LeagueSeasonAggregates = {
  leagueId: number;
  season: number;
  sampleSize: number;
  avgGoals: number;
  avgCorners: number | null;
  avgCards: { yellow: number | null; red: number | null };
  homeWinRate: number | null;
  awayWinRate: number | null;
  drawRate: number | null;
};

function safeNum(v: any): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const s = v.trim().replace("%", "");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickStat(stats: any[], names: string[]): number | null {
  const map = new Map<string, any>();
  for (const it of stats ?? []) map.set(String(it.type), it.value);
  for (const n of names) {
    if (map.has(n)) return safeNum(map.get(n));
  }
  return null;
}

async function computeFromFixtures(leagueId: number, season: number): Promise<LeagueSeasonAggregates> {
  // Pega amostra recente de jogos FT para reduzir custo
  const fixtures = await apiFootball.getFinishedFixturesByLeague(leagueId, season, 200);

  let n = 0;
  let goalsSum = 0;
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;

  // Corners/cards dependem de /fixtures/statistics; seria caro por fixture.
  // Estratégia: amostrar só os últimos 40 fixtures para corners/cards.
  const sampleForStats = fixtures?.slice(0, 40) ?? [];
  const cornerVals: number[] = [];
  const yellowVals: number[] = [];
  const redVals: number[] = [];

  for (const fx of fixtures ?? []) {
    const gH = Number(fx?.goals?.home ?? 0);
    const gA = Number(fx?.goals?.away ?? 0);
    if (!Number.isFinite(gH) || !Number.isFinite(gA)) continue;
    n += 1;
    goalsSum += gH + gA;
    if (gH > gA) homeWins += 1;
    else if (gA > gH) awayWins += 1;
    else draws += 1;
  }

  for (const fx of sampleForStats) {
    const fixtureId = fx?.fixture?.id;
    if (!fixtureId) continue;
    try {
      const stats = await apiFootball.getFixtureStatistics(fixtureId);
      const arr = stats?.response ?? stats ?? [];
      const home = arr?.[0]?.statistics ?? [];
      const away = arr?.[1]?.statistics ?? [];
      const cH = pickStat(home, ["Corner Kicks", "Corners"]);
      const cA = pickStat(away, ["Corner Kicks", "Corners"]);
      if (cH != null && cA != null) cornerVals.push(cH + cA);

      const events = await apiFootball.getFixtureEvents(fixtureId);
      const ev = events?.response ?? events ?? [];
      let y = 0;
      let r = 0;
      for (const e of ev ?? []) {
        const t = String(e?.type ?? "").toLowerCase();
        const d = String(e?.detail ?? "").toLowerCase();
        if (t === "card" && d.includes("yellow")) y += 1;
        if (t === "card" && d.includes("red")) r += 1;
      }
      yellowVals.push(y);
      redVals.push(r);
    } catch {
      // ignora amostras com erro
    }
  }

  const avg = (arr: number[]): number | null => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  return {
    leagueId,
    season,
    sampleSize: n,
    avgGoals: n ? goalsSum / n : 0,
    avgCorners: avg(cornerVals),
    avgCards: { yellow: avg(yellowVals), red: avg(redVals) },
    homeWinRate: n ? homeWins / n : null,
    awayWinRate: n ? awayWins / n : null,
    drawRate: n ? draws / n : null,
  };
}

/**
 * Retorna agregados por liga/temporada com cache e persistência em DB (quando disponível).
 */
export async function getOrComputeLeagueSeasonStats(input: { leagueId: number; season: number }) {
  const cacheKey = `pitacos:leagueSeason:${input.leagueId}:${input.season}`;
  const cached = cacheManager.get(cacheKey);
  if (cached) return cached;

  const fromDb = await getLeagueSeasonStats(input.leagueId, input.season);
  if (fromDb?.stats) {
    cacheManager.set(cacheKey, fromDb.stats, 6 * 60 * 60 * 1000); // 6h
    return fromDb.stats;
  }

  const stats = await computeFromFixtures(input.leagueId, input.season);
  cacheManager.set(cacheKey, stats, 6 * 60 * 60 * 1000);

  await upsertLeagueSeasonStats({
    leagueId: input.leagueId,
    season: input.season,
    stats,
  } as any);

  return stats;
}
