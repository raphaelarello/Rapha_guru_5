/**
 * Football API Client - Integração com API-Football.com v3
 * Gerencia requisições, cache, rate limiting e transformação de dados
 */

// Use native fetch (Node 18+)
import { inc, observe } from "../pro/observability/metrics";

const API_BASE_URL = "https://api-football-v3.p.rapidapi.com/v3";
const API_KEY = process.env.FOOTBALL_API_KEY || "";
const API_HOST = "api-football-v3.p.rapidapi.com";

// Cache em memória com TTL
const cache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL = 30_000; // 30 segundos

/**
 * Fazer requisição à API com retry logic
 */
async function fetchFromAPI(endpoint: string, params?: Record<string, any>): Promise<any> {
  if (!API_KEY) {
    throw new Error("FOOTBALL_API_KEY não configurada");
  }

  const cacheKey = `${endpoint}:${JSON.stringify(params || {})}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    inc("cache_hit");
    return cached.data;
  }

  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  let retries = 3;
  let lastError: Error | null = null;

  while (retries > 0) {
    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "x-rapidapi-key": API_KEY,
          "x-rapidapi-host": API_HOST,
        },
      });

      if (response.status === 429) {
        // Rate limited
        inc("api_errors");
        const retryAfter = parseInt(response.headers.get("retry-after") || "60");
        console.warn(`[football-api] Rate limited. Retry after ${retryAfter}s`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        retries--;
        continue;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Cachear resultado
      cache.set(cacheKey, {
        data,
        expiresAt: Date.now() + CACHE_TTL,
      });

      inc("api_calls");
      return data;
    } catch (error) {
      lastError = error as Error;
      retries--;
      if (retries > 0) {
        const delay = (3 - retries) * 1000;
        console.warn(`[football-api] Retry in ${delay}ms:`, error);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  inc("api_errors");
  throw lastError || new Error("Failed to fetch from API after retries");
}

/**
 * Buscar jogos ao vivo
 */
export async function fetchLiveMatches(): Promise<any[]> {
  try {
    const response = await fetchFromAPI("/fixtures", { live: "all" });
    const fixtures = response.response || [];

    observe("live_matches_count", fixtures.length);
    return fixtures;
  } catch (error) {
    console.error("[football-api] Error fetching live matches:", error);
    return [];
  }
}

/**
 * Buscar jogos de um dia específico
 */
export async function fetchMatchesByDate(date: string): Promise<any[]> {
  try {
    const response = await fetchFromAPI("/fixtures", { date });
    const fixtures = response.response || [];

    observe("matches_by_date_count", fixtures.length);
    return fixtures;
  } catch (error) {
    console.error("[football-api] Error fetching matches by date:", error);
    return [];
  }
}

/**
 * Buscar estatísticas de um jogo
 */
export async function fetchMatchStatistics(fixtureId: number): Promise<any> {
  try {
    const response = await fetchFromAPI("/fixtures/statistics", { fixture: fixtureId });
    return response.response || {};
  } catch (error) {
    console.error(`[football-api] Error fetching statistics for fixture ${fixtureId}:`, error);
    return {};
  }
}

/**
 * Buscar eventos de um jogo (gols, cartões, etc)
 */
export async function fetchMatchEvents(fixtureId: number): Promise<any[]> {
  try {
    const response = await fetchFromAPI("/fixtures/events", { fixture: fixtureId });
    return response.response || [];
  } catch (error) {
    console.error(`[football-api] Error fetching events for fixture ${fixtureId}:`, error);
    return [];
  }
}

/**
 * Buscar odds de um jogo
 */
export async function fetchMatchOdds(fixtureId: number): Promise<any[]> {
  try {
    const response = await fetchFromAPI("/odds", { fixture: fixtureId });
    return response.response || [];
  } catch (error) {
    console.error(`[football-api] Error fetching odds for fixture ${fixtureId}:`, error);
    return [];
  }
}

/**
 * Buscar jogos finalizados (FT)
 */
export async function fetchFinalizedMatches(date: string): Promise<any[]> {
  try {
    const response = await fetchFromAPI("/fixtures", { date, status: "FT" });
    const fixtures = response.response || [];

    observe("finalized_matches_count", fixtures.length);
    return fixtures;
  } catch (error) {
    console.error("[football-api] Error fetching finalized matches:", error);
    return [];
  }
}

/**
 * Buscar informações de uma liga
 */
export async function fetchLeagueInfo(leagueId: number): Promise<any> {
  try {
    const response = await fetchFromAPI("/leagues", { id: leagueId });
    return response.response?.[0] || {};
  } catch (error) {
    console.error(`[football-api] Error fetching league info for ${leagueId}:`, error);
    return {};
  }
}

/**
 * Buscar informações de um time
 */
export async function fetchTeamInfo(teamId: number): Promise<any> {
  try {
    const response = await fetchFromAPI("/teams", { id: teamId });
    return response.response?.[0] || {};
  } catch (error) {
    console.error(`[football-api] Error fetching team info for ${teamId}:`, error);
    return {};
  }
}

/**
 * Limpar cache (útil para testes)
 */
export function clearCache(): void {
  cache.clear();
  console.log("[football-api] Cache cleared");
}

/**
 * Obter status do cache
 */
export function getCacheStatus(): { size: number; entries: string[] } {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()),
  };
}

/**
 * Transformar fixture da API em RealtimeSnapshot
 */
export function transformFixtureToSnapshot(fixture: any, stats?: any): any {
  const home = fixture.teams?.home;
  const away = fixture.teams?.away;
  const goals = fixture.goals;
  const status = fixture.fixture?.status;

  // Calcular Heat Score baseado em estatísticas reais
  let heatScore = 50; // Default
  if (stats && stats.length >= 2) {
    const homeStats = stats[0]?.statistics || [];
    const awayStats = stats[1]?.statistics || [];

    const homeShots = homeStats.find((s: any) => s.type === "Shots on Goal")?.value || 0;
    const awayShots = awayStats.find((s: any) => s.type === "Shots on Goal")?.value || 0;
    const homeCorners = homeStats.find((s: any) => s.type === "Corner Kicks")?.value || 0;
    const awayCorners = awayStats.find((s: any) => s.type === "Corner Kicks")?.value || 0;

    const totalPressure = (homeShots + awayShots) * 2 + (homeCorners + awayCorners) * 1.5;
    const minute = fixture.fixture?.status === "LIVE" ? fixture.fixture?.elapsed || 45 : 45;
    heatScore = Math.min(100, Math.round((totalPressure / Math.max(1, minute)) * 10));
  }

  // Calcular Pressure Score
  const pressureScore = Math.round(Math.random() * 100); // TODO: Implementar lógica real

  return {
    fixtureId: fixture.fixture?.id,
    leagueName: fixture.league?.name,
    homeName: home?.name,
    awayName: away?.name,
    minute: fixture.fixture?.elapsed || 0,
    status: status === "LIVE" ? "LIVE" : status === "NS" ? "UPCOMING" : "FINISHED",
    scoreHome: goals?.home || 0,
    scoreAway: goals?.away || 0,
    heatScore,
    heatLevel:
      heatScore > 75 ? "🔥 MUITO QUENTE" : heatScore > 50 ? "🌡️ QUENTE" : "❄️ FRIO",
    pressureScore,
    next10: {}, // TODO: Implementar lógica de Next10
    riskFlags: [],
    lastUpdate: Date.now(),
  };
}

/**
 * Transformar fixture finalizado em MatchResult
 */
export function transformFixtureToMatchResult(fixture: any): any {
  const goals = fixture.goals;
  const status = fixture.fixture?.status;

  return {
    fixtureId: fixture.fixture?.id,
    homeTeam: fixture.teams?.home?.name,
    awayTeam: fixture.teams?.away?.name,
    finalScore: `${goals?.home || 0}-${goals?.away || 0}`,
    homeGoals: goals?.home || 0,
    awayGoals: goals?.away || 0,
    status: status === "FT" ? "FT" : status === "AET" ? "AET" : "PEN",
    timestamp: new Date(fixture.fixture?.date),
  };
}
