// ============================================================================
// FILE: server/routers/destaquesScanner.v27a.ts
// v28 FIX: import apiFootball diretamente + otimização para não dar timeout
// ============================================================================
import { z } from "zod";
import { publicProcedure } from "../_core/trpc";
import { apiFootball } from "../api-football";
import { buildPicksFromFixture, isGoldPick } from "../picks-builder";
import { getOddsForFixtures } from "../odds-integrator";
import { cacheManager } from "../cache-manager";

const MARKETS = ["FT_1X2", "OU_25", "BTTS", "CORNERS_O85"] as const;

export const DestaquesScannerInputV2 = z.object({
  date: z.string().optional(),
  dateRange: z.object({ from: z.string(), to: z.string() }).optional(),
  statusFilter: z.array(z.enum(["LIVE", "UPCOMING", "FINISHED"])).default(["LIVE", "UPCOMING", "FINISHED"]),
  leagueIds: z.array(z.number().int().positive()).default([]),
  sort: z.enum(["NEAREST_TIME", "EDGE", "EV", "SCORE", "MOMENTUM"]).default("NEAREST_TIME"),
  cursor: z.string().nullable().optional(),
  limit: z.number().min(10).max(200).default(50),
  finishedWindowHours: z.number().min(1).max(72).default(12),
  debug: z.boolean().optional(),
  // Compat com DestaquesScannerV2.tsx (contrato antigo)
  markets: z.array(z.string()).optional(),
  onlyGold: z.boolean().optional(),
  liveWindowHours: z.number().optional(),
  limitGold: z.number().optional(),
  limitPerMarket: z.number().optional(),
  includeLive: z.boolean().optional(),
  includeToday: z.boolean().optional(),
});

function statusGroup(short?: string): "LIVE" | "UPCOMING" | "FINISHED" {
  const s = (short ?? "").toUpperCase();
  if (["1H", "2H", "HT", "ET", "P", "LIVE", "BT"].includes(s)) return "LIVE";
  if (["FT", "AET", "PEN", "FT_PEN"].includes(s)) return "FINISHED";
  return "UPCOMING";
}

// Stub odds para quando a API não retorna
function stubOdds(): Record<string, Record<string, number | null>> {
  return {
    FT_1X2: { home: 2.5, draw: 3.5, away: 2.5 },
    OU_25: { over: 1.85, under: 2.0 },
    BTTS: { yes: 1.80, no: 2.0 },
    CORNERS_O85: { over: 1.90, under: 1.90 },
  };
}

function parseOddsFromArray(oddsArray: any[]): Record<string, Record<string, number | null>> {
  if (!Array.isArray(oddsArray) || oddsArray.length === 0) return stubOdds();
  
  const result: Record<string, Record<string, number | null>> = {};
  
  // Agrupar odds por mercado
  for (const odd of oddsArray) {
    const market = (odd.market || "").toLowerCase();
    if (market.includes("over") || market.includes("2.5")) {
      if (!result["OU_25"]) result["OU_25"] = {};
      if (market.includes("over")) result["OU_25"]["over"] = odd.odd;
      else result["OU_25"]["under"] = odd.odd;
    } else if (market.includes("btts")) {
      if (!result["BTTS"]) result["BTTS"] = {};
      if (market.includes("yes")) result["BTTS"]["yes"] = odd.odd;
      else result["BTTS"]["no"] = odd.odd;
    }
  }
  
  // Preencher faltantes com stubs
  const stubs = stubOdds();
  for (const m of MARKETS) {
    if (!result[m]) result[m] = stubs[m];
  }
  return result;
}

function parseOdds(raw: any): Record<string, Record<string, number | null>> {
  if (!raw) return stubOdds();
  const data = Array.isArray(raw) ? raw[0] : raw;
  const bookmakers = data?.bookmakers;
  if (!Array.isArray(bookmakers) || !bookmakers.length) return stubOdds();

  let bk = bookmakers.find((b: any) => b.name === "Bet365") ?? bookmakers[0];
  if (!bk?.bets) return stubOdds();

  const result: Record<string, Record<string, number | null>> = {};
  const bets = bk.bets;

  const bet1x2 = bets.find((b: any) => b.name === "Match Winner" || b.name === "1X2");
  if (bet1x2?.values) {
    result["FT_1X2"] = {};
    for (const v of bet1x2.values) {
      const odd = parseFloat(v.odd);
      if (v.value === "Home") result["FT_1X2"]["home"] = odd;
      else if (v.value === "Draw") result["FT_1X2"]["draw"] = odd;
      else if (v.value === "Away") result["FT_1X2"]["away"] = odd;
    }
  }

  const betOU = bets.find((b: any) => b.name?.includes("Over/Under") || b.name?.includes("Goals"));
  if (betOU?.values) {
    result["OU_25"] = {};
    for (const v of betOU.values) {
      const odd = parseFloat(v.odd);
      if (v.value?.includes("Over")) result["OU_25"]["over"] = odd;
      else if (v.value?.includes("Under")) result["OU_25"]["under"] = odd;
    }
  }

  const betBTTS = bets.find((b: any) => b.name?.includes("Both Teams") || b.name?.includes("BTTS"));
  if (betBTTS?.values) {
    result["BTTS"] = {};
    for (const v of betBTTS.values) {
      const odd = parseFloat(v.odd);
      if (v.value === "Yes") result["BTTS"]["yes"] = odd;
      else if (v.value === "No") result["BTTS"]["no"] = odd;
    }
  }

  // Preencher faltantes com stubs
  const stubs = stubOdds();
  for (const m of MARKETS) {
    if (!result[m] || Object.keys(result[m]).length === 0) result[m] = stubs[m];
  }
  return result;
}

/** Extrai o status short de um pick, lidando com fixture aninhado */
function getPickStatus(p: any): string {
  // pick.fixture pode ser { fixture: { status: { short } }, league, ... }
  // ou pode ser { statusShort, status: "1H", ... }
  const f = p?.fixture;
  if (!f) return "";
  // Estrutura API-Football: fixture.fixture.status.short
  if (f.fixture?.status?.short) return f.fixture.status.short;
  // Estrutura flat: fixture.statusShort
  if (f.statusShort) return f.statusShort;
  // Estrutura com status direto
  if (typeof f.status === "string") return f.status;
  if (f.status?.short) return f.status.short;
  return "";
}

export const destaquesScannerProcedure = publicProcedure
  .input(DestaquesScannerInputV2)
  .query(async ({ input }) => {
    const now = Date.now();
    const date = input.date ?? new Date().toISOString().slice(0, 10);
    const leagueSet = input.leagueIds.length ? new Set(input.leagueIds) : null;

    // 1) Buscar fixtures: live + do dia (em paralelo)
    const [liveRaw, dayRaw] = await Promise.all([
      apiFootball.getLiveFixtures().catch(() => []),
      apiFootball.getFixturesByDate(date).catch(() => []),
    ]);

    const live = Array.isArray(liveRaw) ? liveRaw : [];
    const day = Array.isArray(dayRaw) ? dayRaw : [];

    // Deduplicar + filtrar por liga
    const byId = new Map<number, any>();
    for (const f of [...live, ...day]) {
      const fid = f?.fixture?.id ?? f?.id;
      if (!fid) continue;
      const lid = f?.league?.id;
      if (leagueSet && lid && !leagueSet.has(lid)) continue;
      byId.set(fid, f);
    }

    // LIMITAR a 15 fixtures para não estourar timeout/rate limit
    // Priorizar: ao vivo primeiro, depois próximos
    let fixtures = Array.from(byId.values());
    fixtures.sort((a, b) => {
      const sa = statusGroup(a?.fixture?.status?.short);
      const sb = statusGroup(b?.fixture?.status?.short);
      const order = { LIVE: 0, UPCOMING: 1, FINISHED: 2 };
      return (order[sa] ?? 1) - (order[sb] ?? 1);
    });
    const MAX_ENRICH = 15;
    const toEnrich = fixtures.slice(0, MAX_ENRICH);

    // 2) Enriquecer com predictions + odds reais
    // Buscar odds em paralelo para todos os fixtures
    const fixtureIdsForOdds = toEnrich.map(f => f?.fixture?.id ?? f?.id).filter(Boolean);
    const oddsMapResult = await getOddsForFixtures(fixtureIdsForOdds).catch(() => new Map());

    const enrichResults = await Promise.allSettled(
      toEnrich.map(async (f) => {
        const fid = f?.fixture?.id ?? f?.id;
        try {
          const pred = await apiFootball.getFixturePredictions(fid);
          const prediction = Array.isArray(pred) ? pred[0] : pred;
          const fixtureOdds = oddsMapResult.get(fid) || [];
          const oddsMap = parseOddsFromArray(fixtureOdds);
          return { fixture: f, prediction, oddsMap };
        } catch {
          return { fixture: f, prediction: null, oddsMap: stubOdds() };
        }
      })
    );

    const enriched = enrichResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map((r) => r.value);

    // 3) Gerar picks para todos os mercados
    const allPicks: any[] = [];
    for (const e of enriched) {
      for (const market of MARKETS) {
        try {
          const built = await buildPicksFromFixture(e.fixture, market, e.prediction, e.oddsMap);
          if (Array.isArray(built) && built.length) allPicks.push(...built);
        } catch {
          // skip
        }
      }
    }

    // 4) Filtrar por status
    let filtered = allPicks;
    if (input.statusFilter.length) {
      const set = new Set(input.statusFilter);
      filtered = filtered.filter((p) => {
        const short = getPickStatus(p);
        return set.has(statusGroup(short));
      });
    }

    // 5) Ordenar
    const sorted = [...filtered];
    if (input.sort === "EDGE") {
      sorted.sort((a, b) => (b.edge ?? -999) - (a.edge ?? -999));
    } else if (input.sort === "SCORE") {
      sorted.sort((a, b) => (b.score ?? -999) - (a.score ?? -999));
    } else {
      // NEAREST_TIME default
      sorted.sort((a, b) => {
        const sa = statusGroup(getPickStatus(a));
        const sb = statusGroup(getPickStatus(b));
        const order = { LIVE: 0, UPCOMING: 1, FINISHED: 2 };
        return (order[sa] ?? 1) - (order[sb] ?? 1);
      });
    }

    // 6) Gold Picks
    const goldPicks = sorted.filter(isGoldPick).slice(0, input.limitGold ?? 18);

    // 7) Paginação com otimização
    const start = input.cursor ? Number(input.cursor) || 0 : 0;
    const pageSize = Math.min(input.limit, 50); // Máximo 50 picks por página
    const page = sorted.slice(start, start + pageSize);
    const nextCursor = start + pageSize < sorted.length ? String(start + pageSize) : null;
    const totalPages = Math.ceil(sorted.length / pageSize);
    const currentPage = Math.floor(start / pageSize) + 1;

    // 8) picksByMarket (compat)
    const picksByMarket: Record<string, any[]> = {};
    for (const m of MARKETS) {
      picksByMarket[m] = sorted.filter((p) => p.market === m).slice(0, input.limitPerMarket ?? 12);
    }

    // 9) Contagens e ligas
    const fixtureIds = new Set<number>();
    let liveCount = 0, upcomingCount = 0, finishedCount = 0;
    for (const p of sorted) {
      const fid = p.fixtureId ?? p.fixture?.fixture?.id ?? p.fixture?.id;
      if (fid && !fixtureIds.has(fid)) {
        fixtureIds.add(fid);
        const s = statusGroup(getPickStatus(p));
        if (s === "LIVE") liveCount++;
        else if (s === "UPCOMING") upcomingCount++;
        else finishedCount++;
      }
    }

    const leagueMap = new Map<number, { id: number; name: string; country?: string }>();
    for (const p of sorted) {
      const lid = p.leagueId ?? p.league?.id ?? p.fixture?.league?.id;
      if (lid && !leagueMap.has(lid)) {
        leagueMap.set(lid, {
          id: lid,
          name: p.leagueName ?? p.league?.name ?? p.fixture?.league?.name ?? `Liga ${lid}`,
          country: p.country ?? p.league?.country ?? p.fixture?.league?.country,
        });
      }
    }

    return {
      meta: {
        updatedAtISO: new Date().toISOString(),
        ...(input.debug ? {
          debug: {
            fixturesTotal: fixtures.length,
            enriched: enriched.length,
            picksBuilt: allPicks.length,
            picksFiltered: filtered.length,
            gold: goldPicks.length,
          },
        } : {}),
      },
      counts: {
        live: liveCount,
        upcoming: upcomingCount,
        finished: finishedCount,
        total: liveCount + upcomingCount + finishedCount,
      },
      availableLeagues: Array.from(leagueMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      ultraGoldPicks: goldPicks.filter((p) => (p.score ?? 0) > 50).slice(0, 5),
      goldPicks,
      picks: page,
      picksByMarket,
      nextCursor,
      pagination: {
        currentPage,
        totalPages,
        pageSize,
        totalPicks: sorted.length,
        hasNextPage: nextCursor !== null,
        hasPreviousPage: start > 0,
      },
    };
  });
