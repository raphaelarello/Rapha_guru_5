import { apiFootball } from "../api-football";
import { cacheManager } from "../cache-manager";
import { inc } from "./observability/metrics";
import { computeFeatures, type CoreStats, type OddsMarket } from "./features";

export type AggregatedFixture = {
  fixtureId: number;
  leagueId?: number;
  leagueName?: string;
  leagueLogo?: string;
  country?: string;
  homeName: string;
  awayName: string;
  homeLogo?: string;
  awayLogo?: string;
  minute: number;
  status: "LIVE" | "UPCOMING" | "FINISHED";
  scoreHome: number;
  scoreAway: number;
  stats?: CoreStats;
  odds?: OddsMarket[];
  features?: ReturnType<typeof computeFeatures>;
  eventsRelevant?: Array<{ minute: number; type: string; player?: string; side?: "home" | "away" }>;
};

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

function isLiveStatus(s: string | undefined): boolean {
  const v = (s ?? "").toUpperCase();
  return v === "LIVE" || v === "1H" || v === "2H" || v === "HT" || v === "ET";
}

function normalizeStatus(f: any): AggregatedFixture["status"] {
  const st = f?.fixture?.status?.short;
  if (isLiveStatus(st)) return "LIVE";
  if (st === "FT" || st === "AET" || st === "PEN") return "FINISHED";
  return "UPCOMING";
}

function safeInt(n: any, d = 0): number {
  return typeof n === "number" && Number.isFinite(n) ? Math.trunc(n) : d;
}

async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cacheManager.get(key);
  if (hit) {
    inc("cache_hit");
    return hit as T;
  }
  inc("cache_miss");
  const v = await fn();
  cacheManager.set(key, v, ttlMs);
  return v;
}

export async function getDayFixtures(date: string): Promise<any[]> {
  return cached(`agg:fixtures:${date}`, 30_000, async () => {
    inc("api_calls");
    return await apiFootball.getFixturesByDate(date);
  });
}

export async function getLiveFixtures(): Promise<any[]> {
  return cached(`agg:fixtures:live`, 10_000, async () => {
    inc("api_calls");
    return await apiFootball.getLiveFixtures();
  });
}

export async function aggregateFixtureDetails(fixtureId: number): Promise<Partial<AggregatedFixture>> {
  // stats/events/odds: best effort with cache
  const [stats, events, oddsLive] = await Promise.all([
    cached(`agg:stats:${fixtureId}`, 10_000, async () => {
      inc("api_calls");
      return await apiFootball.getFixtureStatistics(fixtureId);
    }).catch((e) => {
      inc("api_errors");
      return null;
    }),
    cached(`agg:events:${fixtureId}`, 10_000, async () => {
      inc("api_calls");
      return await apiFootball.getFixtureEvents(fixtureId);
    }).catch((e) => {
      inc("api_errors");
      return [];
    }),
    cached(`agg:odds:${fixtureId}`, 30_000, async () => {
      inc("api_calls");
      return await apiFootball.getOddsLive({ fixtureIds: [fixtureId], markets: ["OU_25", "BTTS", "FT_1X2"] });
    }).catch((e) => {
      inc("api_errors");
      return [];
    }),
  ]);

  const core: CoreStats = {
    minute: 0,
    scoreHome: 0,
    scoreAway: 0,
  };

  // Extract some stats if available from your existing helper shapes
  // stats is whatever apiFootball returns; keep defensive
  try {
    const homeStats = Array.isArray(stats) ? stats?.[0]?.statistics ?? [] : [];
    const awayStats = Array.isArray(stats) ? stats?.[1]?.statistics ?? [] : [];
    const pick = (arr: any[], type: string): any => arr.find((x) => x.type === type)?.value;

    const shotsHome = Number(pick(homeStats, "Total Shots") ?? pick(homeStats, "Shots Total") ?? 0);
    const shotsAway = Number(pick(awayStats, "Total Shots") ?? pick(awayStats, "Shots Total") ?? 0);
    const sotHome = Number(pick(homeStats, "Shots on Goal") ?? pick(homeStats, "Shots On Goal") ?? 0);
    const sotAway = Number(pick(awayStats, "Shots on Goal") ?? pick(awayStats, "Shots On Goal") ?? 0);
    const cornersHome = Number(pick(homeStats, "Corner Kicks") ?? pick(homeStats, "Corners") ?? 0);
    const cornersAway = Number(pick(awayStats, "Corner Kicks") ?? pick(awayStats, "Corners") ?? 0);
    const possHomeRaw = pick(homeStats, "Ball Possession");
    const possAwayRaw = pick(awayStats, "Ball Possession");
    const toPct = (v: any) => Number(String(v ?? "0").replace("%", "")) || 0;

    core.shotsHome = safeInt(shotsHome);
    core.shotsAway = safeInt(shotsAway);
    core.sotHome = safeInt(sotHome);
    core.sotAway = safeInt(sotAway);
    core.cornersHome = safeInt(cornersHome);
    core.cornersAway = safeInt(cornersAway);
    core.possessionHome = safeInt(toPct(possHomeRaw));
    core.possessionAway = safeInt(toPct(possAwayRaw));
  } catch {}

  // events relevant
  const relevant = (events ?? [])
    .filter((e: any) => {
      const t = String(e.type ?? "").toLowerCase();
      const d = String(e.detail ?? "").toLowerCase();
      return t === "goal" || (t === "card" && (d.includes("red") || d.includes("yellow"))) || t.includes("var") || d.includes("penalty");
    })
    .slice(-15)
    .reverse()
    .map((e: any) => ({
      minute: safeInt(e.time?.elapsed) + (safeInt(e.time?.extra) ? 1 : 0),
      type: String(e.type ?? "").toUpperCase(),
      player: e.player?.name,
      side: undefined as any,
    }));

  // odds normalize (best effort)
  const odds: OddsMarket[] = [];
  const firstOdds = Array.isArray(oddsLive) ? oddsLive?.[0] : null;
  if (firstOdds?.markets) {
    for (const m of firstOdds.markets) {
      const mk = String(m.marketKey ?? m.key ?? "");
      if (!["OU_25", "BTTS", "FT_1X2"].includes(mk)) continue;
      const out: OddsMarket = { key: mk as any };
      for (const s of m.selections ?? []) {
        const code = String(s.selectionCode ?? "").toUpperCase();
        const odd = Number(s.odd);
        if (!Number.isFinite(odd) || odd <= 1) continue;
        if (mk === "OU_25") {
          if (code.includes("OVER")) out.over = odd;
          if (code.includes("UNDER")) out.under = odd;
        }
        if (mk === "BTTS") {
          if (code.includes("YES")) out.yes = odd;
          if (code.includes("NO")) out.no = odd;
        }
        if (mk === "FT_1X2") {
          if (code.includes("HOME")) out.home = odd;
          if (code.includes("DRAW")) out.draw = odd;
          if (code.includes("AWAY")) out.away = odd;
        }
        out.bookmaker = s.bookmaker ?? out.bookmaker;
      }
      out.updatedSecAgo = firstOdds.lastUpdatedAt ? Math.max(0, nowSec() - Math.floor(new Date(firstOdds.lastUpdatedAt).getTime() / 1000)) : undefined;
      out.stale = (out.updatedSecAgo ?? 0) > 60;
      odds.push(out);
    }
  }

  return {
    stats: core,
    odds,
    features: computeFeatures({ stats: core, odds }),
    eventsRelevant: relevant,
  };
}

export async function aggregateForPitacos(date: string, limitLiveDetails = 30): Promise<AggregatedFixture[]> {
  const fixtures = await getDayFixtures(date);
  const items: AggregatedFixture[] = fixtures.map((f: any) => {
    const fixtureId = safeInt(f.fixture?.id);
    return {
      fixtureId,
      leagueId: safeInt(f.league?.id, undefined as any),
      leagueName: f.league?.name,
      leagueLogo: f.league?.logo,
      country: f.league?.country,
      homeName: f.teams?.home?.name ?? "Casa",
      awayName: f.teams?.away?.name ?? "Fora",
      homeLogo: f.teams?.home?.logo,
      awayLogo: f.teams?.away?.logo,
      minute: safeInt(f.fixture?.status?.elapsed, 0),
      status: normalizeStatus(f),
      scoreHome: safeInt(f.goals?.home, 0),
      scoreAway: safeInt(f.goals?.away, 0),
    };
  });

  // Enrich LIVE fixtures (cap)
  const live = items.filter((x) => x.status === "LIVE").slice(0, limitLiveDetails);
  const enriched = await Promise.all(live.map(async (x) => ({ fixtureId: x.fixtureId, d: await aggregateFixtureDetails(x.fixtureId) })));
  const map = new Map(enriched.map((e) => [e.fixtureId, e.d]));
  return items.map((x) => {
    const d = map.get(x.fixtureId);
    if (!d) return x;
    const stats = d.stats ? { ...d.stats, minute: x.minute, scoreHome: x.scoreHome, scoreAway: x.scoreAway } : undefined;
    const odds = d.odds;
    const features = stats ? computeFeatures({ stats, odds }) : d.features;
    return { ...x, stats, odds, features, eventsRelevant: d.eventsRelevant };
  });
}
