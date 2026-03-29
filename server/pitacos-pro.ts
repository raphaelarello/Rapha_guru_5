import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { apiFootball } from "./api-football";
import { cacheManager } from "./cache-manager";
import { listUserProjections, upsertUserProjections, updateUserProjection, type PitacoProjection } from "./pitacos-history-store";
import { getOrComputeLeagueSeasonStats } from "./pitacos-league-season";
import { getSeasonPlayerLeaders, getLiveFixturePlayersSignals } from "./pitacos-players";

type TeamSide = "home" | "away";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}


async function getCachedAnytimeScorerOdds(fixtureId: number): Promise<Record<string, number>> {
  const key = `pitacos:anytimeScorerOdds:${fixtureId}`;
  const cached = cacheManager.get(key);
  if (cached) return cached as any;
  const odds = await apiFootball.getAnytimeScorerOddsLive(fixtureId).catch(() => ({}));
  cacheManager.set(key, odds, 30);
  return odds;
}


type MarketOddsSnapshot = {
  ou25?: { over?: number; under?: number; book?: string; updatedSecAgo?: number };
  btts?: { yes?: number; no?: number; book?: string; updatedSecAgo?: number };
  ft1x2?: { home?: number; draw?: number; away?: number; book?: string; updatedSecAgo?: number };
};

function impliedProb(odd?: number) {
  if (!odd || !Number.isFinite(odd) || odd <= 1) return null;
  return 1 / odd;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function calibrateProb(pModel?: number | null, pMarket?: number | null, wMarket = 0.55) {
  if (pModel == null || !Number.isFinite(pModel)) return pMarket == null ? null : clamp01(pMarket);
  if (pMarket == null || !Number.isFinite(pMarket)) return clamp01(pModel);
  const wM = Math.max(0, Math.min(1, wMarket));
  return clamp01(wM * pMarket + (1 - wM) * pModel);
}

function calcEV(p: number | null, odd?: number) {
  if (p == null || odd == null || !Number.isFinite(odd) || odd <= 1) return null;
  return p * odd - 1;
}

function bestFromValues(values: any[], wanted: string[]) {
  let best: { odd: number; label: string } | null = null;
  for (const v of values ?? []) {
    const label = String(v?.value ?? v?.label ?? "");
    const odd = Number(v?.odd ?? v?.oddValue ?? v?.valueOdd);
    if (!wanted.includes(label)) continue;
    if (!Number.isFinite(odd) || odd <= 1) continue;
    if (!best || odd > best.odd) best = { odd, label };
  }
  return best;
}

function extractMarketOddsSnapshot(raw: any): MarketOddsSnapshot {
  const snap: MarketOddsSnapshot = {};
  const resp = raw?.response ?? raw ?? [];
  const first = Array.isArray(resp) ? resp[0] : resp;
  const bookmakers = first?.bookmakers ?? [];
  // Iterate all bookmakers and pick best odds by market
  for (const bm of bookmakers) {
    const bookName = bm?.name ? String(bm.name) : undefined;
    const bets = bm?.bets ?? [];
    for (const bet of bets) {
      const betName = String(bet?.name ?? "").toLowerCase();
      const values = bet?.values ?? [];

      // OU 2.5
      if (betName.includes("over/under") || betName.includes("goals over/under") || betName.includes("goals") && betName.includes("over")) {
        // Find line 2.5 by matching "Over 2.5"/"Under 2.5" or "Mais de 2.5"/"Menos de 2.5"
        const over = bestFromValues(values, ["Over 2.5", "Mais de 2.5", "Over2.5", "Mais 2.5"]);
        const under = bestFromValues(values, ["Under 2.5", "Menos de 2.5", "Under2.5", "Menos 2.5"]);
        if (over?.odd) {
          if (!snap.ou25?.over || over.odd > snap.ou25.over) snap.ou25 = { ...(snap.ou25 ?? {}), over: over.odd, book: bookName };
        }
        if (under?.odd) {
          if (!snap.ou25?.under || under.odd > snap.ou25.under) snap.ou25 = { ...(snap.ou25 ?? {}), under: under.odd, book: bookName };
        }
      }

      // BTTS
      if (betName.includes("both teams to score") || betName.includes("btts")) {
        const yes = bestFromValues(values, ["Yes", "Sim"]);
        const no = bestFromValues(values, ["No", "Não"]);
        if (yes?.odd) {
          if (!snap.btts?.yes || yes.odd > snap.btts.yes) snap.btts = { ...(snap.btts ?? {}), yes: yes.odd, book: bookName };
        }
        if (no?.odd) {
          if (!snap.btts?.no || no.odd > snap.btts.no) snap.btts = { ...(snap.btts ?? {}), no: no.odd, book: bookName };
        }
      }

      // 1X2
      if (betName.includes("match winner") || betName.includes("1x2") || betName.includes("winner")) {
        const home = bestFromValues(values, ["Home", "1"]);
        const draw = bestFromValues(values, ["Draw", "X"]);
        const away = bestFromValues(values, ["Away", "2"]);
        if (home?.odd) {
          if (!snap.ft1x2?.home || home.odd > snap.ft1x2.home) snap.ft1x2 = { ...(snap.ft1x2 ?? {}), home: home.odd, book: bookName };
        }
        if (draw?.odd) {
          if (!snap.ft1x2?.draw || draw.odd > snap.ft1x2.draw) snap.ft1x2 = { ...(snap.ft1x2 ?? {}), draw: draw.odd, book: bookName };
        }
        if (away?.odd) {
          if (!snap.ft1x2?.away || away.odd > snap.ft1x2.away) snap.ft1x2 = { ...(snap.ft1x2 ?? {}), away: away.odd, book: bookName };
        }
      }
    }
  }
  return snap;
}

async function getOddsSnapshotCached(fixtureId: number): Promise<MarketOddsSnapshot> {
  const key = `pitacosPro:oddsSnap:${fixtureId}`;
  const cached = cacheManager.get(key);
  if (cached) return cached as any;
  const raw = await apiFootball.getOddsLive(fixtureId).catch(() => null);
  const snap = extractMarketOddsSnapshot(raw);
  // best-effort "updatedSecAgo"
  const updatedSecAgo = 15; // API does not always provide per market timestamp; use tick cadence
  if (snap.ou25) snap.ou25.updatedSecAgo = updatedSecAgo;
  if (snap.btts) snap.btts.updatedSecAgo = updatedSecAgo;
  if (snap.ft1x2) snap.ft1x2.updatedSecAgo = updatedSecAgo;
  cacheManager.set(key, snap, 30);
  return snap;
}
function computeComebackChance(input: {
  minute: number;
  scoreHome: number;
  scoreAway: number;
  pressureSide?: "home" | "away" | "balanced";
  next10GoalProb?: number; // 0..100 (geral)
  oddsMoveBoost?: number; // 0..1 (opcional)
}): { side: "home" | "away" | null; prob: number } {
  const { minute, scoreHome, scoreAway } = input;
  const diff = scoreHome - scoreAway;
  if (diff === 0) return { side: null, prob: 0 };

  const trailing: "home" | "away" = diff < 0 ? "home" : "away";
  const deficit = Math.abs(diff);

  // Base: quanto menor o déficit e quanto mais tempo sobra, maior a chance
  const timeFactor = clamp(1 - minute / 95, 0, 1);
  const deficitFactor = deficit === 1 ? 1 : deficit === 2 ? 0.55 : 0.25;

  const pressureBoost = input.pressureSide && input.pressureSide === trailing ? 0.25 : 0;
  const next10Boost = input.next10GoalProb != null ? clamp(input.next10GoalProb / 100, 0, 1) * 0.35 : 0;
  const oddsBoost = input.oddsMoveBoost != null ? clamp(input.oddsMoveBoost, 0, 1) * 0.2 : 0;

  const raw = (0.15 + timeFactor * 0.55) * deficitFactor + pressureBoost + next10Boost + oddsBoost;
  const prob = Math.round(clamp(raw, 0, 0.95) * 100);

  return { side: trailing, prob };
}


function safeNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    const pct = s.endsWith("%") ? s.slice(0, -1) : s;
    const n = Number(pct);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickStat(stats: any[], names: string[]): number | null {
  const map = new Map<string, unknown>();
  for (const it of stats ?? []) {
    if (it?.type) map.set(String(it.type), it.value);
  }
  for (const name of names) {
    if (map.has(name)) return safeNumber(map.get(name));
  }
  return null;
}

function extractMiniStats(statisticsResponse: any): {
  corners?: { home: number; away: number };
  shots?: { home: number; away: number };
  sot?: { home: number; away: number };
  possession?: { home: number; away: number };
  dangerousAttacks?: { home: number; away: number } | null;
} {
  const arr = statisticsResponse?.response ?? statisticsResponse ?? [];
  const home = arr?.[0]?.statistics ?? [];
  const away = arr?.[1]?.statistics ?? [];
  const cornersH = pickStat(home, ["Corner Kicks", "Corners"]);
  const cornersA = pickStat(away, ["Corner Kicks", "Corners"]);
  const shotsH = pickStat(home, ["Total Shots", "Shots Total"]);
  const shotsA = pickStat(away, ["Total Shots", "Shots Total"]);
  const sotH = pickStat(home, ["Shots on Goal", "Shots On Goal"]);
  const sotA = pickStat(away, ["Shots on Goal", "Shots On Goal"]);
  const possH = pickStat(home, ["Ball Possession"]);
  const possA = pickStat(away, ["Ball Possession"]);
  const dangH = pickStat(home, ["Dangerous Attacks"]);
  const dangA = pickStat(away, ["Dangerous Attacks"]);

  const out: any = {};
  if (cornersH != null && cornersA != null) out.corners = { home: cornersH, away: cornersA };
  if (shotsH != null && shotsA != null) out.shots = { home: shotsH, away: shotsA };
  if (sotH != null && sotA != null) out.sot = { home: sotH, away: sotA };
  if (possH != null && possA != null) out.possession = { home: possH, away: possA };
  if (dangH != null && dangA != null) out.dangerousAttacks = { home: dangH, away: dangA };
  else out.dangerousAttacks = null;
  return out;
}

function extractRelevantEvents(eventsResponse: any): Array<{
  minute: number;
  type: "GOAL" | "YELLOW" | "RED" | "VAR" | "PENALTY";
  player: string;
  side: TeamSide;
}> {
  const arr = eventsResponse?.response ?? eventsResponse ?? [];
  const out: any[] = [];

  for (const e of arr ?? []) {
    const type = String(e?.type ?? "").toLowerCase();
    const detail = String(e?.detail ?? "").toLowerCase();
    const m = Number(e?.time?.elapsed ?? 0);
    const player = String(e?.player?.name ?? "").trim() || "—";
    const teamId = e?.team?.id;
    // side is not always known here; caller can map teamId to home/away
    const side: TeamSide = "home";
    if (type === "goal") {
      out.push({ minute: m, type: "GOAL", player, side, teamId });
      continue;
    }
    if (type === "card") {
      if (detail.includes("red")) out.push({ minute: m, type: "RED", player, side, teamId });
      else if (detail.includes("yellow")) out.push({ minute: m, type: "YELLOW", player, side, teamId });
      continue;
    }
    if (type.includes("var") || detail.includes("var")) {
      out.push({ minute: m, type: "VAR", player, side, teamId });
      continue;
    }
    if (detail.includes("penalty")) {
      out.push({ minute: m, type: "PENALTY", player, side, teamId });
    }
  }

  // newest first
  out.sort((a, b) => b.minute - a.minute);
  return out.slice(0, 15).map(({ teamId, ...rest }) => rest);
}

function extractPredictions(predictionsResponse: any): {
  homeWin?: number; draw?: number; awayWin?: number;
  over25?: number; btts?: number;
} {
  const res0 = (predictionsResponse?.response ?? predictionsResponse ?? [])?.[0];
  const preds = res0?.predictions ?? res0 ?? {};
  const percent = preds?.percent ?? {};
  const winners = preds?.winner ?? {};
  // API-Football often provides percent for "home", "draw", "away" in percent strings
  const home = safeNumber(percent?.home);
  const draw = safeNumber(percent?.draw);
  const away = safeNumber(percent?.away);

  // Some plans provide "goals" section; we fallback to heuristics
  let over25: number | undefined;
  let btts: number | undefined;

  const goals = preds?.goals ?? res0?.predictions?.goals;
  // If string like "1.8" expected goals
  const homeGoals = safeNumber(goals?.home);
  const awayGoals = safeNumber(goals?.away);
  if (homeGoals != null && awayGoals != null) {
    const mu = homeGoals + awayGoals;
    // Poisson approx P(total >= 3)
    const p0 = Math.exp(-mu);
    const p1 = p0 * mu;
    const p2 = p1 * mu / 2;
    over25 = clamp(1 - (p0 + p1 + p2), 0, 1) * 100;
    // BTTS approx: (1-e^{-h})(1-e^{-a})
    btts = (1 - Math.exp(-homeGoals)) * (1 - Math.exp(-awayGoals)) * 100;
  }

  return {
    homeWin: home != null ? clamp(home, 0, 100) : undefined,
    draw: draw != null ? clamp(draw, 0, 100) : undefined,
    awayWin: away != null ? clamp(away, 0, 100) : undefined,
    over25,
    btts,
  };
}

function deriveNext10FromLive(miniStats: any, minute: number): { goal: number; corner: number; card: number; why: string[] } {
  const sot = (miniStats?.sot?.home ?? 0) + (miniStats?.sot?.away ?? 0);
  const shots = (miniStats?.shots?.home ?? 0) + (miniStats?.shots?.away ?? 0);
  const corners = (miniStats?.corners?.home ?? 0) + (miniStats?.corners?.away ?? 0);
  const dang = miniStats?.dangerousAttacks ? (miniStats.dangerousAttacks.home + miniStats.dangerousAttacks.away) : 0;

  // crude scaling by game phase
  const phase = minute < 30 ? 0.9 : minute < 60 ? 1.0 : 1.05;

  const goal = clamp((sot * 7 + shots * 2 + dang * 0.15) * 0.6 * phase, 0, 95);
  const corner = clamp((corners * 4 + shots * 1.5 + dang * 0.08) * 0.55 * phase, 0, 90);
  const card = clamp((shots * 1.2 + dang * 0.06) * 0.35 * phase, 0, 70);

  const why: string[] = [];
  if (sot >= 6) why.push("SOT alto");
  if (dang >= 70) why.push("Ataques perigosos altos");
  if (corners >= 8) why.push("Escanteios subindo");
  if (!why.length) why.push("Ritmo moderado");
  return { goal, corner, card, why: why.slice(0, 3) };
}

function computeLeagueInsights(fixtures: any[]): Array<any> {
  const byLeague = new Map<number, any>();
  for (const f of fixtures) {
    const league = f?.league;
    const leagueId = Number(league?.id ?? 0);
    if (!leagueId) continue;
    if (!byLeague.has(leagueId)) {
      byLeague.set(leagueId, {
        leagueId,
        name: league?.name ?? "—",
        country: league?.country ?? "—",
        logo: league?.logo ?? null,
        flag: league?.flag ?? null,
        matches: 0,
        goals: 0,
        homeWins: 0,
        awayWins: 0,
        draws: 0,
      });
    }
    const agg = byLeague.get(leagueId);
    agg.matches += 1;
    const goalsH = Number(f?.goals?.home ?? 0);
    const goalsA = Number(f?.goals?.away ?? 0);
    agg.goals += goalsH + goalsA;
    if (goalsH > goalsA) agg.homeWins += 1;
    else if (goalsA > goalsH) agg.awayWins += 1;
    else agg.draws += 1;
  }

  return Array.from(byLeague.values()).map((x) => ({
    leagueId: x.leagueId,
    name: x.name,
    country: x.country,
    logo: x.logo,
    flag: x.flag,
    matches: x.matches,
    avgGoalsPerMatch: x.matches ? x.goals / x.matches : 0,
    homeWinRate: x.matches ? x.homeWins / x.matches : 0,
    awayWinRate: x.matches ? x.awayWins / x.matches : 0,
    drawRate: x.matches ? x.draws / x.matches : 0,
  })).sort((a, b) => b.avgGoalsPerMatch - a.avgGoalsPerMatch);
}

export const pitacosProRouter = router({
  dashboard: protectedProcedure
    .input(z.object({
      date: z.string().optional(),
      statusFilter: z.array(z.enum(["LIVE", "UPCOMING", "FINISHED"])).default(["LIVE", "UPCOMING"]),
      leagueIds: z.array(z.number().int().positive()).default([]),
      limit: z.number().min(10).max(200).default(120),
    }))
    .query(async ({ input }) => {
      try {
        const date = input.date ?? new Date().toISOString().slice(0, 10);
        const cacheKey = `pitacosPro:dashboard:${date}:${input.statusFilter.join(",")}:${input.leagueIds.join(",")}:${input.limit}`;
        const cached = cacheManager.get(cacheKey);
        if (cached) return cached;

        const fixturesResp = await apiFootball.getFixturesByDate(date);
        const fixtures = (fixturesResp?.response ?? fixturesResp ?? []).slice(0, input.limit);

        const filtered = fixtures.filter((f: any) => {
          const status = String(f?.fixture?.status?.short ?? "");
          const mapped =
            status === "FT" ? "FINISHED"
              : ["1H", "2H", "HT", "ET", "P", "LIVE"].includes(status) ? "LIVE"
                : "UPCOMING";
          if (!input.statusFilter.includes(mapped as any)) return false;
          if (input.leagueIds.length) {
            const leagueId = Number(f?.league?.id ?? 0);
            return input.leagueIds.includes(leagueId);
          }
          return true;
        });

        const leagueInsights = computeLeagueInsights(filtered);

        // For LIVE games, pull stats/events for top N only (cost control)
        const liveFixtures = filtered.filter((f: any) => {
          const status = String(f?.fixture?.status?.short ?? "");
          return ["1H", "2H", "HT", "ET", "P", "LIVE"].includes(status);
        });

        const topLive = liveFixtures.slice(0, 25); // cap
        const enriched = await Promise.all(topLive.map(async (f: any) => {
          const fixtureId = Number(f?.fixture?.id);
          const minute = Number(f?.fixture?.status?.elapsed ?? 0);
          const statsKey = `pitacosPro:stats:${fixtureId}`;
          const eventsKey = `pitacosPro:events:${fixtureId}`;
          const predsKey = `pitacosPro:preds:${fixtureId}`;

          const statsCached = cacheManager.get(statsKey);
          const eventsCached = cacheManager.get(eventsKey);
          const predsCached = cacheManager.get(predsKey);

          const oddsSnapKey = `pitacosPro:oddsSnap:${fixtureId}`;
          const oddsSnapCached = cacheManager.get(oddsSnapKey);

          const [stats, events, preds, oddsSnap] = await Promise.all([
            statsCached ?? apiFootball.getFixtureStatistics(fixtureId),
            eventsCached ?? apiFootball.getFixtureEvents(fixtureId),
            predsCached ?? apiFootball.getFixturePredictions(fixtureId),
            oddsSnapCached ?? getOddsSnapshotCached(fixtureId),
          ]);

          cacheManager.set(statsKey, stats, 10_000);
          cacheManager.set(eventsKey, events, 10_000);
          cacheManager.set(predsKey, preds, 60_000);
          cacheManager.set(oddsSnapKey, oddsSnap, 30_000);

          const miniStats = extractMiniStats(stats);
          const relevantEvents = extractRelevantEvents(events);

          const pred = extractPredictions(preds);
          const next10 = deriveNext10FromLive(miniStats, minute);

          const homeTeamId = Number(f?.teams?.home?.id ?? 0);
          const awayTeamId = Number(f?.teams?.away?.id ?? 0);

          const danger = miniStats?.dangerousAttacks;
          const sotH = miniStats?.sot?.home ?? 0;
          const sotA = miniStats?.sot?.away ?? 0;
          const pressureSide: "home" | "away" | "balanced" =
            danger && danger.home != null && danger.away != null && Math.abs((danger.home ?? 0) - (danger.away ?? 0)) >= 10
              ? ((danger.home ?? 0) > (danger.away ?? 0) ? "home" : "away")
              : Math.abs(sotH - sotA) >= 2
                ? (sotH > sotA ? "home" : "away")
                : "balanced";

          const livePlayers = (homeTeamId && awayTeamId)
            ? await getLiveFixturePlayersSignals({ fixtureId, homeTeamId, awayTeamId, scorerOddsByPlayer: await getCachedAnytimeScorerOdds(fixtureId) })
            : { topHot: [], topRisk: [] };

          const scoreHome = Number(f?.goals?.home ?? 0);
          const scoreAway = Number(f?.goals?.away ?? 0);
          const comeback = computeComebackChance({
            minute,
            scoreHome,
            scoreAway,
            pressureSide,
            next10GoalProb: next10.goal,
          });

          const pModelOver25 = pred?.over25 != null ? pred.over25 / 100 : null;
          const pModelBttsYes = pred?.btts != null ? pred.btts / 100 : null;
          const pModelHome = pred?.homeWin != null ? pred.homeWin / 100 : null;
          const pModelDraw = pred?.draw != null ? pred.draw / 100 : null;
          const pModelAway = pred?.awayWin != null ? pred.awayWin / 100 : null;

          const pMarketOver25 = impliedProb(oddsSnap?.ou25?.over);
          const pMarketBttsYes = impliedProb(oddsSnap?.btts?.yes);
          const pMarketHome = impliedProb(oddsSnap?.ft1x2?.home);
          const pMarketDraw = impliedProb(oddsSnap?.ft1x2?.draw);
          const pMarketAway = impliedProb(oddsSnap?.ft1x2?.away);

          const pCalOver25 = calibrateProb(pModelOver25, pMarketOver25);
          const pCalBttsYes = calibrateProb(pModelBttsYes, pMarketBttsYes);
          const pCalHome = calibrateProb(pModelHome, pMarketHome);
          const pCalDraw = calibrateProb(pModelDraw, pMarketDraw);
          const pCalAway = calibrateProb(pModelAway, pMarketAway);

          const markets = {
            ou25: oddsSnap?.ou25?.over ? {
              label: "Gols Mais de 2.5",
              selection: "Mais de 2.5",
              odd: oddsSnap.ou25.over,
              book: oddsSnap.ou25.book,
              updatedSecAgo: oddsSnap.ou25.updatedSecAgo,
              p_model: pModelOver25,
              p_market: pMarketOver25,
              p_cal: pCalOver25,
              edge: (pCalOver25 != null && pMarketOver25 != null) ? (pCalOver25 - pMarketOver25) : null,
              ev: calcEV(pCalOver25, oddsSnap.ou25.over),
            } : null,
            btts: oddsSnap?.btts?.yes ? {
              label: "Ambas Marcam",
              selection: "Sim",
              odd: oddsSnap.btts.yes,
              book: oddsSnap.btts.book,
              updatedSecAgo: oddsSnap.btts.updatedSecAgo,
              p_model: pModelBttsYes,
              p_market: pMarketBttsYes,
              p_cal: pCalBttsYes,
              edge: (pCalBttsYes != null && pMarketBttsYes != null) ? (pCalBttsYes - pMarketBttsYes) : null,
              ev: calcEV(pCalBttsYes, oddsSnap.btts.yes),
            } : null,
            ft1x2: oddsSnap?.ft1x2 ? {
              label: "Resultado Final",
              selections: {
                home: oddsSnap.ft1x2.home ? { odd: oddsSnap.ft1x2.home, p_model: pModelHome, p_market: pMarketHome, p_cal: pCalHome, ev: calcEV(pCalHome, oddsSnap.ft1x2.home) } : null,
                draw: oddsSnap.ft1x2.draw ? { odd: oddsSnap.ft1x2.draw, p_model: pModelDraw, p_market: pMarketDraw, p_cal: pCalDraw, ev: calcEV(pCalDraw, oddsSnap.ft1x2.draw) } : null,
                away: oddsSnap.ft1x2.away ? { odd: oddsSnap.ft1x2.away, p_model: pModelAway, p_market: pMarketAway, p_cal: pCalAway, ev: calcEV(pCalAway, oddsSnap.ft1x2.away) } : null,
              },
              book: oddsSnap.ft1x2.book,
              updatedSecAgo: oddsSnap.ft1x2.updatedSecAgo,
            } : null,
          };


          return {
            fixtureId,
            statusShort: f?.fixture?.status?.short ?? "—",
            minute,
            league: {
              id: f?.league?.id,
              name: f?.league?.name,
              country: f?.league?.country,
              logo: f?.league?.logo,
              flag: f?.league?.flag,
            },
            teams: {
              home: { id: f?.teams?.home?.id, name: f?.teams?.home?.name, logo: f?.teams?.home?.logo },
              away: { id: f?.teams?.away?.id, name: f?.teams?.away?.name, logo: f?.teams?.away?.logo },
            },
            score: { home: f?.goals?.home ?? 0, away: f?.goals?.away ?? 0 },
            miniStats,
            relevantEvents,
            markets,
            projections: {
              win: { home: pred.homeWin, draw: pred.draw, away: pred.awayWin },
              over25: pred.over25,
              btts: pred.btts,
              next10,
              firstHalfGoalProb: minute <= 45 ? clamp(next10.goal + 10, 0, 95) : undefined,
              secondHalfGoalProb: minute > 45 ? clamp(next10.goal + 10, 0, 95) : undefined,
            },
            pressure: { side: pressureSide },
            players: livePlayers,
            comeback,
          };
        }));

        const out = {
          date,
          generatedAt: new Date().toISOString(),
          leagueInsights,
          live: enriched,
          fixturesCount: filtered.length,
        };

        cacheManager.set(cacheKey, out, 30_000);
        return out;
      } catch (err) {
        console.error("[pitacosPro.dashboard]", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  dailyReport: protectedProcedure
    .input(z.object({
      date: z.string(),
      leagueIds: z.array(z.number().int().positive()).default([]),
      limit: z.number().min(10).max(200).default(80),
      // thresholds for "pitacos do dia"
      over25Min: z.number().min(0).max(100).default(62),
      bttsMin: z.number().min(0).max(100).default(58),
      winMin: z.number().min(0).max(100).default(60),
    }))
    .mutation(async ({ input, ctx }) => {
      const { date, leagueIds, limit, over25Min, bttsMin, winMin } = input;
      const userKey = String(ctx.user.id);

      const fixturesResp = await apiFootball.getFixturesByDate(date);
      const fixtures = fixturesResp?.response ?? fixturesResp ?? [];
      const upcoming = (fixtures ?? [])
        .filter((f: any) => String(f?.fixture?.status?.short ?? "").toUpperCase() === "NS")
        .filter((f: any) => !leagueIds.length || leagueIds.includes(Number(f?.league?.id ?? 0)))
        .slice(0, limit);

      // Build projections: prefer API-Football predictions if available; fallback to league heuristics.
      const projections: PitacoProjection[] = [];
      for (const f of upcoming) {
        const fixtureId = Number(f?.fixture?.id ?? 0);
        if (!fixtureId) continue;

        let probs: PitacoProjection["probs"] = {};
        try {
          const pred = await apiFootball.getFixturePredictions(fixtureId);
          const parsed = extractPredictions(pred);
          probs = {
            homeWin: parsed.homeWin,
            draw: parsed.draw,
            awayWin: parsed.awayWin,
            over25: parsed.over25,
            btts: parsed.btts,
          };
        } catch {
          // ignore, fallback below
        }

        // fallback if missing: use league avg goals from today's sample
        if (probs.over25 == null || probs.btts == null || probs.homeWin == null || probs.awayWin == null || probs.draw == null) {
          // cheap league inference: if avgGoals high => higher over/btts
          const goalsH = Number(f?.goals?.home ?? 0);
          const goalsA = Number(f?.goals?.away ?? 0);
          const mu = Math.max(1.6, Math.min(3.4, (goalsH + goalsA) || 2.4));
          const p0 = Math.exp(-mu);
          const p1 = p0 * mu;
          const p2 = (p1 * mu) / 2;
          probs.over25 = probs.over25 ?? clamp((1 - (p0 + p1 + p2)) * 100, 0, 95);
          probs.btts = probs.btts ?? clamp(((1 - Math.exp(-mu / 2)) ** 2) * 100, 0, 90);
          probs.homeWin = probs.homeWin ?? 36;
          probs.draw = probs.draw ?? 28;
          probs.awayWin = probs.awayWin ?? 36;
        }

        projections.push({
          fixtureId,
          date,
          leagueId: Number(f?.league?.id ?? 0) || undefined,
          leagueName: f?.league?.name ?? undefined,
          country: f?.league?.country ?? null,
          teams: { home: f?.teams?.home?.name ?? "—", away: f?.teams?.away?.name ?? "—" },
          startTime: f?.fixture?.date ?? null,
          probs,
          thresholds: { over25Min, bttsMin, winMin },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await upsertUserProjections(userKey, projections);

      // Return "pitacos do dia" ranked
      const ranked = [...projections].sort((a, b) => {
        const aScore = (a.probs.over25 ?? 0) + (a.probs.btts ?? 0) + Math.max(a.probs.homeWin ?? 0, a.probs.awayWin ?? 0) * 0.6;
        const bScore = (b.probs.over25 ?? 0) + (b.probs.btts ?? 0) + Math.max(b.probs.homeWin ?? 0, b.probs.awayWin ?? 0) * 0.6;
        return bScore - aScore;
      });

      return {
        generatedAt: new Date().toISOString(),
        count: projections.length,
        pitacosDoDia: ranked.slice(0, 30),
      };
    }),

  evaluateHistory: protectedProcedure
    .input(z.object({
      // evaluate all unfinished projections for this date (or all if omitted)
      date: z.string().optional(),
      limit: z.number().min(10).max(200).default(120),
    }))
    .mutation(async ({ input, ctx }) => {
      const userKey = String(ctx.user.id);
      const all = await listUserProjections(userKey);
      const filtered = input.date ? all.filter((p) => p.date === input.date) : all;
      const pending = filtered.filter((p) => !p.actual).slice(0, input.limit);

      const updated: number[] = [];

      for (const p of pending) {
        try {
          const fx = await apiFootball.getFixtureById(p.fixtureId);
          const f0 = (fx?.response ?? fx ?? [])?.[0];
          const short = String(f0?.fixture?.status?.short ?? "").toUpperCase();
          if (short !== "FT" && short !== "AET" && short !== "PEN") continue;

          const scoreHome = Number(f0?.goals?.home ?? 0);
          const scoreAway = Number(f0?.goals?.away ?? 0);
          const totalGoals = scoreHome + scoreAway;

          const actualWinner = scoreHome > scoreAway ? "HOME" : scoreAway > scoreHome ? "AWAY" : "DRAW";
          const actualBtts = scoreHome > 0 && scoreAway > 0;
          const actualOver25 = totalGoals >= 3;

          // corners from statistics
          let cornersTotal: number | null = null;
          try {
            const stats = await apiFootball.getFixtureStatistics(p.fixtureId);
            const mini = extractMiniStats(stats);
            if (mini.corners) cornersTotal = mini.corners.home + mini.corners.away;
          } catch {}

          // cards from events
          let cardsTotal: number | null = null;
          try {
            const ev = await apiFootball.getFixtureEvents(p.fixtureId);
            const arr = ev?.response ?? ev ?? [];
            let c = 0;
            for (const e of arr ?? []) {
              const type = String(e?.type ?? "").toLowerCase();
              if (type === "card") c += 1;
            }
            cardsTotal = c;
          } catch {}

          // Evaluate metrics based on thresholds
          const metrics: any = {};
          if ((p.probs.over25 ?? 0) >= (p.thresholds.over25Min ?? 0)) metrics.OVER_25 = actualOver25;
          if ((p.probs.btts ?? 0) >= (p.thresholds.bttsMin ?? 0)) metrics.BTTS = actualBtts;

          const hw = p.probs.homeWin ?? 0;
          const aw = p.probs.awayWin ?? 0;
          const dr = p.probs.draw ?? 0;
          const best = Math.max(hw, aw, dr);
          if (best >= (p.thresholds.winMin ?? 0)) {
            if (best === hw) metrics.HOME_WIN = actualWinner === "HOME";
            else if (best === aw) metrics.AWAY_WIN = actualWinner === "AWAY";
            else metrics.DRAW = actualWinner === "DRAW";
          }

          // Score
          const vals = Object.values(metrics) as boolean[];
          const score = vals.length ? (vals.filter(Boolean).length / vals.length) * 100 : undefined;

          await updateUserProjection(userKey, p.fixtureId, {
            actual: {
              finishedAt: new Date().toISOString(),
              scoreHome,
              scoreAway,
              btts: actualBtts,
              over25: actualOver25,
              winner: actualWinner,
              cornersTotal,
              cardsTotal,
            },
            evaluation: { metrics, score },
          });

          updated.push(p.fixtureId);
        } catch (err) {
          console.warn("[pitacosPro.evaluateHistory] failed", p.fixtureId, err);
        }
      }

      return { updatedCount: updated.length, updatedFixtureIds: updated };
    }),

  accuracyDashboard: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      leagueIds: z.array(z.number().int().positive()).default([]),
    }))
    .query(async ({ input, ctx }) => {
      const userKey = String(ctx.user.id);
      const all = await listUserProjections(userKey);
      const inRange = all.filter((p) => {
        if (input.dateFrom && p.date < input.dateFrom) return false;
        if (input.dateTo && p.date > input.dateTo) return false;
        if (input.leagueIds.length && p.leagueId && !input.leagueIds.includes(p.leagueId)) return false;
        return true;
      });

      const evaluated = inRange.filter((p) => p.evaluation?.metrics && p.actual);

      const metricsAgg: Record<string, { total: number; hits: number }> = {};
      const leagueAgg: Record<string, { leagueName: string; total: number; hits: number; avgScore: number }> = {};

      for (const p of evaluated) {
        const ms = p.evaluation?.metrics ?? {};
        for (const [k, v] of Object.entries(ms)) {
          if (!metricsAgg[k]) metricsAgg[k] = { total: 0, hits: 0 };
          metricsAgg[k].total += 1;
          if (v) metricsAgg[k].hits += 1;
        }

        const lid = String(p.leagueId ?? "0");
        if (!leagueAgg[lid]) leagueAgg[lid] = { leagueName: p.leagueName ?? "—", total: 0, hits: 0, avgScore: 0 };
        leagueAgg[lid].total += 1;
        if ((p.evaluation?.score ?? 0) >= 50) leagueAgg[lid].hits += 1;
        leagueAgg[lid].avgScore += p.evaluation?.score ?? 0;
      }

      const metrics = Object.entries(metricsAgg).map(([k, v]) => ({
        metric: k,
        total: v.total,
        hits: v.hits,
        hitRate: v.total ? v.hits / v.total : 0,
      })).sort((a, b) => b.hitRate - a.hitRate);

      const leagues = Object.entries(leagueAgg).map(([leagueId, v]) => ({
        leagueId: Number(leagueId),
        leagueName: v.leagueName,
        total: v.total,
        hitRate: v.total ? v.hits / v.total : 0,
        avgScore: v.total ? v.avgScore / v.total : 0,
      })).sort((a, b) => b.avgScore - a.avgScore);

      return {
        totalPredictions: inRange.length,
        evaluatedPredictions: evaluated.length,
        metrics,
        leagues,
        recent: evaluated.slice(-50),
      };
    }),

  leagueSeasonStats: protectedProcedure
    .input(z.object({
      leagueId: z.number().int().positive(),
      season: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      return await getOrComputeLeagueSeasonStats({ leagueId: input.leagueId, season: input.season });
    }),

  seasonPlayerLeaders: protectedProcedure
    .input(z.object({
      leagueId: z.number().int().positive(),
      season: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      return await getSeasonPlayerLeaders({ leagueId: input.leagueId, season: input.season });
    }),

  accuracyByMonth: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const userKey = (ctx as any)?.user?.id ?? "anon";
      const all = await listUserProjections(String(userKey));
      const from = input?.dateFrom ? new Date(input.dateFrom) : null;
      const to = input?.dateTo ? new Date(input.dateTo) : null;

      const buckets = new Map<string, { total: number; scoreSum: number; greens: number; reds: number }>();

      for (const p of all) {
        const created = new Date(p.createdAt);
        if (from && created < from) continue;
        if (to && created > to) continue;
        const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
        const b = buckets.get(key) ?? { total: 0, scoreSum: 0, greens: 0, reds: 0 };
        b.total += 1;
        const score = Number(p.evaluation?.score ?? 0);
        b.scoreSum += Number.isFinite(score) ? score : 0;
        if (p.evaluation?.result === "green") b.greens += 1;
        if (p.evaluation?.result === "red") b.reds += 1;
        buckets.set(key, b);
      }

      const out = Array.from(buckets.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, b]) => ({
          month,
          total: b.total,
          avgScore: b.total ? b.scoreSum / b.total : 0,
          greens: b.greens,
          reds: b.reds,
        }));

      return out;
    }),


  listHistory: protectedProcedure
    .input(z.object({ date: z.string().optional(), limit: z.number().min(10).max(500).default(200) }))
    .query(async ({ input, ctx }) => {
      const userKey = String(ctx.user.id);
      const all = await listUserProjections(userKey);
      const filtered = input.date ? all.filter((p) => p.date === input.date) : all;
      const sorted = [...filtered].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      return { count: filtered.length, items: sorted.slice(0, input.limit) };
    }),

});




// -------------------- Global daily report (no user session) --------------------
// Stores to .data via pitacos-history-store (works without DB).
// Runs daily at 08:00 server local time.

function isFinishedFixtureShort(short: string): boolean {
  return ["FT", "AET", "PEN"].includes(short);
}

export async function runGlobalDailyPitacosReport(dateISO: string): Promise<void> {
  const userKey = "global";
  const limit = 160;

  const fixturesResp = await apiFootball.getFixturesByDate(dateISO);
  const upcoming = (fixturesResp ?? [])
    .filter((f: any) => String(f?.fixture?.status?.short ?? "") === "NS")
    .slice(0, limit);

  const projections: PitacoProjection[] = [];
  for (const f of upcoming) {
    const fixtureId = Number(f?.fixture?.id ?? 0);
    if (!fixtureId) continue;

    let probs: PitacoProjection["probs"] = {};
    try {
      const pred = await apiFootball.getFixturePredictions(fixtureId);
      const parsed = extractPredictions(pred);
      probs = {
        homeWin: parsed.homeWin,
        draw: parsed.draw,
        awayWin: parsed.awayWin,
        over25: parsed.over25,
        btts: parsed.btts,
      };
    } catch {
      probs = {};
    }

    projections.push({
      fixtureId,
      date: dateISO,
      leagueId: Number(f?.league?.id ?? 0) || undefined,
      leagueName: f?.league?.name ?? undefined,
      country: f?.league?.country ?? null,
      teams: { home: f?.teams?.home?.name ?? "—", away: f?.teams?.away?.name ?? "—" },
      startTime: f?.fixture?.date ?? null,
      probs,
      thresholds: { over25Min: 62, bttsMin: 58, winMin: 60 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  await upsertUserProjections(userKey, projections);
}

async function computeCornersTotal(fixtureId: number): Promise<number | null> {
  try {
    const statsResp = await apiFootball.getFixtureStatistics(fixtureId);
    const stats = Array.isArray(statsResp) ? statsResp : (statsResp as any)?.response ?? [];
    const get = (arr: any[], label: string) => {
      const it = arr.find((x: any) => String(x?.type ?? "") === label);
      const v = it?.value;
      if (v == null) return 0;
      if (typeof v === "number") return v;
      const n = Number(String(v).replace("%", ""));
      return Number.isFinite(n) ? n : 0;
    };
    const home = stats?.[0]?.statistics ?? [];
    const away = stats?.[1]?.statistics ?? [];
    const total = get(home, "Corner Kicks") + get(away, "Corner Kicks");
    return Number.isFinite(total) ? total : null;
  } catch {
    return null;
  }
}

async function computeCardsTotal(fixtureId: number): Promise<number | null> {
  try {
    const evResp = await apiFootball.getFixtureEvents(fixtureId);
    const ev = Array.isArray(evResp) ? evResp : (evResp as any)?.response ?? [];
    return ev.filter((e: any) => String(e?.type ?? "").toLowerCase() === "card").length;
  } catch {
    return null;
  }
}

export async function evaluateGlobalPitacosHistory(): Promise<void> {
  const userKey = "global";
  const all = await listUserProjections(userKey);
  if (!all.length) return;

  for (const p of all) {
    if (p.actual?.finishedAt) continue;

    const fixtureId = p.fixtureId;
    const fixtureResp = await apiFootball.getFixtureById(fixtureId);
    const fixture = Array.isArray(fixtureResp) ? fixtureResp[0] : (fixtureResp as any)?.response?.[0];
    if (!fixture) continue;

    const short = String(fixture?.fixture?.status?.short ?? "");
    if (!isFinishedFixtureShort(short)) continue;

    const scoreHome = Number(fixture?.goals?.home ?? 0);
    const scoreAway = Number(fixture?.goals?.away ?? 0);
    const totalGoals = scoreHome + scoreAway;

    const actualOver25 = totalGoals >= 3;
    const actualBtts = scoreHome >= 1 && scoreAway >= 1;
    const actualWinner: "HOME" | "DRAW" | "AWAY" =
      scoreHome > scoreAway ? "HOME" : scoreAway > scoreHome ? "AWAY" : "DRAW";

    const cornersTotal = await computeCornersTotal(fixtureId);
    const cardsTotal = await computeCardsTotal(fixtureId);

    const metrics: Partial<Record<PitacoMetric, boolean>> = {};
    if (p.probs?.over25 != null) metrics.OVER_25 = actualOver25 === (Number(p.probs.over25) >= (p.thresholds?.over25Min ?? 60));
    if (p.probs?.btts != null) metrics.BTTS = actualBtts === (Number(p.probs.btts) >= (p.thresholds?.bttsMin ?? 55));

    if (p.probs?.homeWin != null && p.probs?.draw != null && p.probs?.awayWin != null) {
      const max = Math.max(Number(p.probs.homeWin), Number(p.probs.draw), Number(p.probs.awayWin));
      const predWinner = max === Number(p.probs.homeWin) ? "HOME" : max === Number(p.probs.awayWin) ? "AWAY" : "DRAW";
      metrics.HOME_WIN = predWinner === "HOME" && actualWinner === "HOME";
      metrics.DRAW = predWinner === "DRAW" && actualWinner === "DRAW";
      metrics.AWAY_WIN = predWinner === "AWAY" && actualWinner === "AWAY";
    }

    const vals = Object.values(metrics) as boolean[];
    const score = vals.length ? (vals.filter(Boolean).length / vals.length) * 100 : undefined;

    await updateUserProjection(userKey, fixtureId, {
      actual: {
        finishedAt: new Date().toISOString(),
        scoreHome,
        scoreAway,
        btts: actualBtts,
        over25: actualOver25,
        winner: actualWinner,
        cornersTotal,
        cardsTotal,
      },
      evaluation: { metrics, score },
      updatedAt: new Date().toISOString(),
    });
  }
}
