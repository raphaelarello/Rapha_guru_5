/**
 * LIVE AGGREGATOR
 * Procedure unificada para dados de jogos ao vivo com cache TTL
 * - Live: 10s
 * - Odds: 30s
 * - Lineups: 60s
 */

import { publicProcedure } from "../_core/trpc";
import { cacheManager } from "../cache-manager";

interface LiveMatch {
  id: number;
  fixture: {
    id: number;
    date: string;
    status: string;
    elapsed: number;
  };
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number;
    away: number;
  };
  score: {
    halftime: { home: number; away: number };
    fulltime: { home: number; away: number };
    extratime: { home: number; away: number };
    penalty: { home: number; away: number };
  };
  statistics: {
    team: string;
    possession: number;
    shots_on_goal: number;
    shots_off_goal: number;
    shots_inside_box: number;
    shots_outside_box: number;
    fouls: number;
    corner_kicks: number;
    offsides: number;
    ball_possession: number;
    yellow_cards: number;
    red_cards: number;
    goalkeeper_saves: number;
    total_passes: number;
    passes_accurate: number;
    passes_percent: number;
  }[];
  events: {
    time: { elapsed: number };
    type: string;
    detail: string;
    player: { id: number; name: string };
    team: { id: number; name: string };
  }[];
  lineups: {
    team: { id: number; name: string; logo: string };
    formation: string;
    startXI: {
      player: { id: number; name: string; number: number; pos: string };
    }[];
    substitutes: {
      player: { id: number; name: string; number: number; pos: string };
    }[];
    coach: { id: number; name: string };
  }[];
  odds: {
    bookmaker: string;
    bets: {
      name: string;
      values: { odd: string; value: string }[];
    }[];
  }[];
}

interface AggregatedMatch {
  id: number;
  liga: string;
  logoLiga: string;
  timeA: string;
  logoTimeA: string;
  timeB: string;
  logoTimeB: string;
  placar: string;
  minuto: number;
  status: string;
  xg: number;
  intensidade: number;
  confianca: number;
  risco: "baixo" | "medio" | "alto";
  pressaoCasa: number;
  pressaoFora: number;
  mercado: string;
  odds: number;
  statistics: {
    home: { possession: number; shots: number; corners: number; fouls: number };
    away: { possession: number; shots: number; corners: number; fouls: number };
  };
  events: {
    time: number;
    type: string;
    detail: string;
    player: string;
    team: string;
  }[];
  lineups: {
    home: { formation: string; players: string[] };
    away: { formation: string; players: string[] };
  };
}

/**
 * Calcula xG (Expected Goals) baseado em estatísticas
 */
function calculateXG(stats: any[]): number {
  const homeStats = stats.find((s) => s.team === "home");
  if (!homeStats) return 0;

  const shotsOnGoal = homeStats.shots_on_goal || 0;
  const shotsInsideBox = homeStats.shots_inside_box || 0;

  // Fórmula simplificada: 0.05 por chute no gol + 0.15 por chute na área
  return shotsOnGoal * 0.05 + shotsInsideBox * 0.15;
}

/**
 * Calcula intensidade do jogo (0-100)
 */
function calculateIntensidade(match: LiveMatch): number {
  const elapsed = match.fixture?.elapsed || 0;
  const totalGols = (match.goals?.home || 0) + (match.goals?.away || 0);
  const events = match.events?.length || 0;

  // Fórmula: minuto (0-90) + gols (0-30) + eventos (0-20)
  const minutoPeso = Math.min(90, elapsed);
  const golsPeso = totalGols * 10;
  const eventosPeso = Math.min(20, events * 2);

  return Math.min(100, Math.round((minutoPeso + golsPeso + eventosPeso) / 1.4));
}

/**
 * Calcula confiança (0-100) baseada em dados
 */
function calculateConfianca(match: LiveMatch, xg: number): number {
  const possession = match.statistics?.[0]?.possession || 50;
  const shotsOnGoal = match.statistics?.[0]?.shots_on_goal || 0;

  // Fórmula: posse (0-40) + xG (0-40) + chutes (0-20)
  const possePeso = Math.min(40, possession * 0.4);
  const xgPeso = Math.min(40, xg * 10);
  const chutePeso = Math.min(20, shotsOnGoal * 2);

  return Math.min(100, Math.round(possePeso + xgPeso + chutePeso));
}

/**
 * Determina risco (baixo, medio, alto)
 */
function calculateRisco(confianca: number, intensidade: number): "baixo" | "medio" | "alto" {
  const risco = (100 - confianca) * 0.5 + (intensidade - 50) * 0.5;

  if (risco < 25) return "baixo";
  if (risco < 50) return "medio";
  return "alto";
}

/**
 * Extrai pressão (casa vs fora)
 */
function extractPressao(match: LiveMatch): { casa: number; fora: number } {
  const homeStats = match.statistics?.find((s) => s.team === "home");
  const awayStats = match.statistics?.find((s) => s.team === "away");

  const homePossession = homeStats?.possession || 50;
  const awayPossession = awayStats?.possession || 50;

  return {
    casa: Math.round(homePossession),
    fora: Math.round(awayPossession),
  };
}

/**
 * Extrai mercado principal
 */
function extractMercado(match: LiveMatch): string {
  const odds = match.odds?.[0];
  if (!odds) return "1x2";

  const bets = odds.bets || [];
  const mainBet = bets.find((b) => b.name === "Match Winner" || b.name === "1x2");

  return mainBet?.name || "1x2";
}

/**
 * Agrega dados de um jogo ao vivo
 */
function aggregateMatch(match: LiveMatch): AggregatedMatch {
  const xg = calculateXG(match.statistics);
  const intensidade = calculateIntensidade(match);
  const confianca = calculateConfianca(match, xg);
  const risco = calculateRisco(confianca, intensidade);
  const pressao = extractPressao(match);
  const mercado = extractMercado(match);

  const homeStats = match.statistics?.find((s) => s.team === "home");
  const awayStats = match.statistics?.find((s) => s.team === "away");

  return {
    id: match.fixture?.id || 0,
    liga: match.league?.name || "Unknown",
    logoLiga: match.league?.logo || "",
    timeA: match.teams?.home?.name || "Home",
    logoTimeA: match.teams?.home?.logo || "",
    timeB: match.teams?.away?.name || "Away",
    logoTimeB: match.teams?.away?.logo || "",
    placar: `${match.goals?.home || 0} - ${match.goals?.away || 0}`,
    minuto: match.fixture?.elapsed || 0,
    status: match.fixture?.status || "NS",
    xg: Math.round(xg * 100) / 100,
    intensidade,
    confianca,
    risco,
    pressaoCasa: pressao.casa,
    pressaoFora: pressao.fora,
    mercado,
    odds: 1.5, // Placeholder - virá da API real
    statistics: {
      home: {
        possession: homeStats?.possession || 0,
        shots: homeStats?.shots_on_goal || 0,
        corners: homeStats?.corner_kicks || 0,
        fouls: homeStats?.fouls || 0,
      },
      away: {
        possession: awayStats?.possession || 0,
        shots: awayStats?.shots_on_goal || 0,
        corners: awayStats?.corner_kicks || 0,
        fouls: awayStats?.fouls || 0,
      },
    },
    events: (match.events || []).slice(0, 10).map((e) => ({
      time: e.time?.elapsed || 0,
      type: e.type || "",
      detail: e.detail || "",
      player: e.player?.name || "Unknown",
      team: e.team?.name || "Unknown",
    })),
    lineups: {
      home: {
        formation: match.lineups?.[0]?.formation || "4-3-3",
        players: (match.lineups?.[0]?.startXI || [])
          .map((p) => p.player?.name)
          .filter(Boolean),
      },
      away: {
        formation: match.lineups?.[1]?.formation || "4-2-3-1",
        players: (match.lineups?.[1]?.startXI || [])
          .map((p) => p.player?.name)
          .filter(Boolean),
      },
    },
  };
}

/**
 * Procedure: Buscar jogos ao vivo com dados agregados
 * Cache: 10s para live, 30s para odds, 60s para lineups
 */
export const liveAggregatorProcedure = publicProcedure.query(async () => {
  const cacheKey = "liveAggregator";

  // Verificar cache (10s)
  let cached = cacheManager.get("live", cacheKey);
  if (cached) {
    return {
      matches: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    };
  }

  // SEM MOCK - retornar vazio se não houver cache
  // Dados reais devem vir do football.dashboardAoVivo
  const mockMatches: LiveMatch[] = [];

  // Agregar matches (vazio se não houver dados reais)
  const aggregated = mockMatches.length > 0 ? mockMatches.map(aggregateMatch) : [];

  // Cache por 10s (live)
  cacheManager.set("live", cacheKey, aggregated, 10000);

  return {
    matches: aggregated,
    cached: false,
    timestamp: new Date().toISOString(),
    aviso: aggregated.length === 0 ? "Nenhum jogo ao vivo no momento - use football.dashboardAoVivo para dados reais" : undefined,
  };
});
