import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { destaquesScannerProcedure } from "./destaquesScanner.v27a";
import { TRPCError } from "@trpc/server";
import { apiFootball } from "../api-football";
import { cacheManager, reduceFixturePayload } from "../cache-manager";
import { redisManager } from "../redis-manager";
import { wsManager } from "../websocket";;
function parsePercentStr(v: any): number {
  if (typeof v !== "string") return 0;
  const n = Number(v.replace("%", "").trim());
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n / 100));
}

function parseNumberStr(v: any): number {
  if (v == null) return 0;
  const n = Number(String(v).replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
}

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function poissonPMF(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function scorelineMatrix(lambdaHome: number, lambdaAway: number, maxGoals = 6): number[][] {
  const mat: number[][] = [];
  for (let h = 0; h <= maxGoals; h++) {
    const row: number[] = [];
    for (let a = 0; a <= maxGoals; a++) {
      row.push(poissonPMF(h, lambdaHome) * poissonPMF(a, lambdaAway));
    }
    mat.push(row);
  }
  const sum = mat.flat().reduce((acc, x) => acc + x, 0);
  const norm = sum > 0 ? 1 / sum : 1;
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) mat[h][a] *= norm;
  }
  return mat;
}

function deriveFromMatrix(mat: number[][]) {
  const maxGoals = mat.length - 1;
  let p00 = mat[0]?.[0] ?? 0;
  let pOver25 = 0;
  let pBTTS = 0;
  let pHomeWinBy3Plus = 0;
  let pAwayWinBy3Plus = 0;

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const p = mat[h][a];
      if (h + a >= 3) pOver25 += p;
      if (h >= 1 && a >= 1) pBTTS += p;
      if (h - a >= 3) pHomeWinBy3Plus += p;
      if (a - h >= 3) pAwayWinBy3Plus += p;
    }
  }

  const top: Array<{ home: number; away: number; p: number }> = [];
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) top.push({ home: h, away: a, p: mat[h][a] });
  }
  top.sort((x, y) => y.p - x.p);

  return { p00, pOver25, pBTTS, pHomeWinBy3Plus, pAwayWinBy3Plus, scorelineTop: top.slice(0, 6) };
}

function estimateLambdasFromPredictions(pred: any): { home: number; away: number } {
  // Uses API-Football predictions.teams.*.last_5.goals.{for,against}.average
  const hFor = parseNumberStr(pred?.teams?.home?.last_5?.goals?.for?.average);
  const hAgainst = parseNumberStr(pred?.teams?.home?.last_5?.goals?.against?.average);
  const aFor = parseNumberStr(pred?.teams?.away?.last_5?.goals?.for?.average);
  const aAgainst = parseNumberStr(pred?.teams?.away?.last_5?.goals?.against?.average);

  const hAtt = parsePercentStr(pred?.teams?.home?.last_5?.att);
  const hDef = parsePercentStr(pred?.teams?.home?.last_5?.def);
  const aAtt = parsePercentStr(pred?.teams?.away?.last_5?.att);
  const aDef = parsePercentStr(pred?.teams?.away?.last_5?.def);

  let lambdaHome = 0.55 * hFor + 0.45 * aAgainst;
  let lambdaAway = 0.55 * aFor + 0.45 * hAgainst;

  lambdaHome *= clamp(0.85 + (hAtt - 0.5) * 0.6, 0.7, 1.3);
  lambdaHome *= clamp(1.05 - (aDef - 0.5) * 0.5, 0.7, 1.3);

  lambdaAway *= clamp(0.85 + (aAtt - 0.5) * 0.6, 0.7, 1.3);
  lambdaAway *= clamp(1.05 - (hDef - 0.5) * 0.5, 0.7, 1.3);

  return { home: clamp(lambdaHome, 0.15, 3.2), away: clamp(lambdaAway, 0.15, 3.2) };
}


export const footballRouter = router({
  // ===== FIXTURES (JOGOS) =====
  
  liveFixtures: publicProcedure.query(async () => {
    try {
      const cached = cacheManager.get("liveFixtures", "all");
      if (cached) return cached;

      const fixtures = await apiFootball.getLiveFixtures();
      const reduced = (fixtures as any[]).map(reduceFixturePayload);
      cacheManager.set("liveFixtures", "all", reduced, 10000); // 10s cache
      return reduced;
    } catch (error) {
      console.error("[football.liveFixtures]", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  fixturesByDate: publicProcedure
    .input(z.object({
      date: z.string(),
      timezone: z.string().default("America/Sao_Paulo"),
    }))
    .query(async ({ input }) => {
      try {
        const cacheKey = `${input.date}:${input.timezone}`;
        const cached = cacheManager.get("jogosHoje", cacheKey);
        if (cached) return cached;

        const fixtures = await apiFootball.getFixturesByDate(input.date, input.timezone);
        const reduced = (fixtures as any[]).map(reduceFixturePayload);
        cacheManager.set("jogosHoje", cacheKey, reduced, 30000); // 30s cache
        return reduced;
      } catch (error) {
        console.error("[football.fixturesByDate]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  fixturesByLeague: publicProcedure
    .input(z.object({
      league: z.number(),
      season: z.number(),
    }))
    .query(async ({ input }) => {
      try {
        return await apiFootball.getFixturesByLeague(input.league, input.season);
      } catch (error) {
        console.error("[football.fixturesByLeague]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  fixtureById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        const cacheKey = `${input.id}`;
        const cached = cacheManager.get("fixtureById", cacheKey);
        if (cached) return cached;

        const result = await apiFootball.getFixtureById(input.id);
        const fixture = (result as any[])[0];
        const reduced = reduceFixturePayload(fixture);
        cacheManager.set("fixtureById", cacheKey, reduced, 60000); // 60s cache
        return reduced;
      } catch (error) {
        console.error("[football.fixtureById]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  fixtureEvents: publicProcedure
    .input(z.object({ fixtureId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await apiFootball.getFixtureEvents(input.fixtureId);
      } catch (error) {
        console.error("[football.fixtureEvents]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  fixtureStatistics: publicProcedure
    .input(z.object({ fixtureId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await apiFootball.getFixtureStatistics(input.fixtureId);
      } catch (error) {
        console.error("[football.fixtureStatistics]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  fixtureLineups: publicProcedure
    .input(z.object({ fixtureId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await apiFootball.getFixtureLineups(input.fixtureId);
      } catch (error) {
        console.error("[football.fixtureLineups]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  fixturePredictions: publicProcedure
    .input(z.object({ fixtureId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await apiFootball.getFixturePredictions(input.fixtureId);
      } catch (error) {
        console.error("[football.fixturePredictions]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  fixtureOdds: publicProcedure
    .input(z.object({ fixtureId: z.number() }))
    .query(async ({ input }) => {
      try {
        const odds = await apiFootball.getOdds(input.fixtureId);
        if (!odds || odds.length === 0) return { bookmakers: [] };
        return { bookmakers: odds };
      } catch (error) {
        console.error("[football.fixtureOdds]", error);
        return { bookmakers: [] };
      }
    }),

  // ===== STANDINGS (TABELAS) =====

  standings: publicProcedure
    .input(z.object({
      league: z.number(),
      season: z.number(),
    }))
    .query(async ({ input }) => {
      try {
        return await apiFootball.getStandings(input.league, input.season);
      } catch (error) {
        console.error("[football.standings]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // ===== TEAMS (TIMES) =====

  teams: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string().optional(),
      league: z.number().optional(),
      country: z.string().optional(),
      season: z.number().optional(),
    }).partial())
    .query(async ({ input }) => {
      try {
        return await apiFootball.getTeams(input);
      } catch (error) {
        console.error("[football.teams]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // ===== PLAYERS (JOGADORES) =====

  players: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      search: z.string().optional(),
      team: z.number().optional(),
      league: z.number().optional(),
      season: z.number().optional(),
    }).partial())
    .query(async ({ input }) => {
      try {
        return await apiFootball.getPlayers(input);
      } catch (error) {
        console.error("[football.players]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  topScorers: publicProcedure
    .input(z.object({
      league: z.number(),
      season: z.number(),
    }))
    .query(async ({ input }) => {
      try {
        return await apiFootball.getTopScorers(input.league, input.season);
      } catch (error) {
        console.error("[football.topScorers]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // ===== INJURIES (LESÕES) =====

  injuries: publicProcedure
    .input(z.object({
      league: z.number().optional(),
      season: z.number().optional(),
      team: z.number().optional(),
      player: z.number().optional(),
      fixture: z.number().optional(),
      date: z.string().optional(),
    }).partial())
    .query(async ({ input }) => {
      try {
        return await apiFootball.getInjuries(input);
      } catch (error) {
        console.error("[football.injuries]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // ===== ODDS (COTAÇÕES) =====

  odds: publicProcedure
    .input(z.object({
      fixtureId: z.number(),
      bookmaker: z.string().optional(),
      bet: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        return await apiFootball.getOdds(input.fixtureId, {
          bookmaker: input.bookmaker,
          bet: input.bet,
        });
      } catch (error) {
        console.error("[football.odds]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  preMatchOdds: publicProcedure
    .input(z.object({
      fixtureId: z.number(),
      bookmaker: z.string().optional(),
      bet: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        return await apiFootball.getPreMatchOdds(input.fixtureId, {
          bookmaker: input.bookmaker,
          bet: input.bet,
        });
      } catch (error) {
        console.error("[football.preMatchOdds]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // ===== LEAGUES (LIGAS) =====

  leagues: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string().optional(),
      country: z.string().optional(),
      type: z.string().optional(),
      current: z.boolean().optional(),
      season: z.number().optional(),
    }).partial())
    .query(async ({ input }) => {
      try {
        return await apiFootball.getLeagues(input);
      } catch (error) {
        console.error("[football.leagues]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // ===== COUNTRIES (PAÍSES) =====

  countries: publicProcedure.query(async () => {
    try {
      return await apiFootball.getCountries();
    } catch (error) {
      console.error("[football.countries]", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  // ===== COACHES (TÉCNICOS) =====

  coaches: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      team: z.number().optional(),
    }).partial())
    .query(async ({ input }) => {
      try {
        return await apiFootball.getCoaches(input);
      } catch (error) {
        console.error("[football.coaches]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // ===== TRANSFERS (TRANSFERÊNCIAS) =====

  transfers: publicProcedure
    .input(z.object({
      player: z.number().optional(),
      team: z.number().optional(),
    }).partial())
    .query(async ({ input }) => {
      try {
        return await apiFootball.getTransfers(input);
      } catch (error) {
        console.error("[football.transfers]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // ===== TROPHIES (TROFÉUS) =====

  trophies: publicProcedure
    .input(z.object({
      player: z.number().optional(),
      coach: z.number().optional(),
    }).partial())
    .query(async ({ input }) => {
      try {
        return await apiFootball.getTrophies(input);
      } catch (error) {
        console.error("[football.trophies]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // ===== SIDELINED (SUSPENSOS) =====

  sidelined: publicProcedure
    .input(z.object({
      player: z.number().optional(),
      team: z.number().optional(),
      league: z.number().optional(),
      season: z.number().optional(),
    }).partial())
    .query(async ({ input }) => {
      try {
        return await apiFootball.getSidelined(input);
      } catch (error) {
        console.error("[football.sidelined]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // ===== DASHBOARD AO VIVO =====

  dashboardAoVivo: publicProcedure.query(async () => {
    try {
      // Tentar Redis primeiro, depois fallback para memória
      const cacheKey = 'dashboardAoVivo';
      let cached = await redisManager.get(cacheKey);
      if (cached) {
        console.log('[CACHE HIT - Redis] dashboardAoVivo');
        return cached;
      }
      
      cached = cacheManager.get(cacheKey);
      if (cached) {
        console.log('[CACHE HIT - Memory] dashboardAoVivo');
        return cached;
      }
      
      const liveFixtures = await apiFootball.getLiveFixtures() as any[];
      
      // OTIMIZAÇÃO: Limita a top 10 jogos para evitar timeout
      const topFixtures = (liveFixtures || []).slice(0, 10);
      
      // Busca statistics e events de cada jogo em paralelo
      const jogos = await Promise.all(topFixtures.map(async (f: any) => {
        const fixtureId = f.fixture?.id;
        const totalGols = (f.goals?.home ?? 0) + (f.goals?.away ?? 0);
        const elapsed = f.fixture?.status?.elapsed ?? 0;
        
        // Busca stats e events em paralelo
        let stats: any[] = [];
        let events: any[] = [];
        try {
          const [statsData, eventsData] = await Promise.all([
            apiFootball.getFixtureStatistics(fixtureId) as Promise<any[]>,
            apiFootball.getFixtureEvents(fixtureId) as Promise<any[]>,
          ]);
          stats = statsData || [];
          events = eventsData || [];
        } catch (e) {
          // Se falhar, continua sem stats/events
        }

        const homeStats = stats?.[0]?.statistics || [];
        const awayStats = stats?.[1]?.statistics || [];
        const getStat = (s: any[], type: string) => {
          const stat = s.find((x: any) => x.type === type);
          return stat?.value ?? 0;
        };

        // Gera oportunidades baseadas em contexto do jogo
        const oportunidades: any[] = [];
        if (totalGols >= 2) {
          oportunidades.push({
            mercado: `Mais de ${totalGols + 0.5} gols`,
            confianca: Math.min(95, 60 + totalGols * 8 + (elapsed > 60 ? 10 : 0)),
            urgencia: totalGols >= 3 ? 'critica' : 'alta',
            ev: Number((totalGols * 1.2 + 2).toFixed(1)),
            motivo: `${totalGols} gols em ${elapsed}min`,
          });
        }
        if (elapsed >= 70 && totalGols <= 1) {
          oportunidades.push({
            mercado: 'Menos de 2.5 gols',
            confianca: Math.min(92, 65 + (90 - elapsed)),
            urgencia: 'alta',
            ev: 3.5,
            motivo: `Apenas ${totalGols} gol(s) aos ${elapsed}min`,
          });
        }
        if (elapsed >= 30 && elapsed <= 75) {
          oportunidades.push({
            mercado: 'Pr\u00f3ximo gol',
            confianca: Math.min(88, 55 + totalGols * 5),
            urgencia: 'media',
            ev: 2.8,
            motivo: `Jogo aberto aos ${elapsed}min`,
          });
        }

        // Buscar forma real dos times via últimos 5 jogos
        const homeId = f.teams?.home?.id;
        const awayId = f.teams?.away?.id;
        let homeForm: string[] = [];
        let awayForm: string[] = [];
        try {
          const [homeLastRaw, awayLastRaw] = await Promise.all([
            homeId ? apiFootball.getTeamLastFixtures(homeId, 5) as Promise<any[]> : Promise.resolve([]),
            awayId ? apiFootball.getTeamLastFixtures(awayId, 5) as Promise<any[]> : Promise.resolve([]),
          ]);
          const calcForm = (fixtures: any[], teamId: number) => {
            if (!fixtures || !Array.isArray(fixtures)) return [];
            return fixtures.slice(0, 5).map((fx: any) => {
              const isHome = fx.teams?.home?.id === teamId;
              const myGoals = isHome ? fx.goals?.home : fx.goals?.away;
              const theirGoals = isHome ? fx.goals?.away : fx.goals?.home;
              if (myGoals == null || theirGoals == null) return 'E';
              if (myGoals > theirGoals) return 'V';
              if (myGoals < theirGoals) return 'D';
              return 'E';
            });
          };
          homeForm = calcForm(homeLastRaw as any[], homeId);
          awayForm = calcForm(awayLastRaw as any[], awayId);
        } catch (e) {
          // Se falhar, forma fica vazia
        }

        return {
          fixture: f,
          homeForm,
          awayForm,
          statistics: {
            homePossession: getStat(homeStats, 'Ball Possession'),
            awayPossession: getStat(awayStats, 'Ball Possession'),
            homeShotsOnGoal: getStat(homeStats, 'Shots on Goal'),
            awayShotsOnGoal: getStat(awayStats, 'Shots on Goal'),
            homeTotalShots: getStat(homeStats, 'Total Shots'),
            awayTotalShots: getStat(awayStats, 'Total Shots'),
            homeCorners: getStat(homeStats, 'Corner Kicks'),
            awayCorners: getStat(awayStats, 'Corner Kicks'),
            homeDangerousAttacks: getStat(homeStats, 'Dangerous Attacks'),
            awayDangerousAttacks: getStat(awayStats, 'Dangerous Attacks'),
            homeFouls: getStat(homeStats, 'Fouls'),
            awayFouls: getStat(awayStats, 'Fouls'),
            homeOffsides: getStat(homeStats, 'Offsides'),
            awayOffsides: getStat(awayStats, 'Offsides'),
            homeYellowCards: getStat(homeStats, 'Yellow Cards'),
            awayYellowCards: getStat(awayStats, 'Yellow Cards'),
            homeRedCards: getStat(homeStats, 'Red Cards'),
            awayRedCards: getStat(awayStats, 'Red Cards'),
            homePassesAccurate: getStat(homeStats, 'Passes accurate'),
            awayPassesAccurate: getStat(awayStats, 'Passes accurate'),
            homePassesTotal: getStat(homeStats, 'Total passes'),
            awayPassesTotal: getStat(awayStats, 'Total passes'),
          },
          events: (events || []).map((e: any) => ({
            time: e.time?.elapsed,
            extra: e.time?.extra,
            type: e.type,
            detail: e.detail,
            player: e.player?.name,
            assist: e.assist?.name,
            team: e.team?.name,
            teamId: e.team?.id,
          })),
          oportunidades,
        };
      }));

      const result = {
        totalJogos: jogos.length,
        totalOportunidades: jogos.reduce((acc: number, j: any) => acc + j.oportunidades.length, 0),
        jogos,
        ultimaAtualizacao: new Date().toISOString(),
      };
      
      // Cache por 30 segundos (Redis + Memory)
      await redisManager.set(cacheKey, result, 30);
      cacheManager.set(cacheKey, result, 30);
      
      // Broadcast para clientes WebSocket
      wsManager.broadcast('ao-vivo', {
        type: 'fixture_update',
        data: result,
        timestamp: Date.now(),
      });
      
      return result;
    } catch (error) {
      console.error("[football.dashboardAoVivo]", error);
      return {
        totalJogos: 0,
        totalOportunidades: 0,
        jogos: [],
        ultimaAtualizacao: new Date().toISOString(),
      };
    }
  }),

  // ===== CENTRAL DE ALERTAS =====

  centralAlertas: publicProcedure.query(async () => {
    try {
      const liveFixtures = await apiFootball.getLiveFixtures() as any[];
      
      // Gera alertas no formato que o RaphaLayout espera:
      // { fixtureId, prioridade, titulo, resumo, liga, timestamp }
      const alertas = (liveFixtures || [])
        .filter((f: any) => {
          const totalGols = (f.goals?.home ?? 0) + (f.goals?.away ?? 0);
          const elapsed = f.fixture?.status?.elapsed ?? 0;
          return totalGols >= 2 || elapsed >= 75;
        })
        .map((f: any) => {
          const totalGols = (f.goals?.home ?? 0) + (f.goals?.away ?? 0);
          const elapsed = f.fixture?.status?.elapsed ?? 0;
          let prioridade = 'normal';
          let titulo = '';
          let resumo = '';
          
          if (totalGols >= 4) {
            prioridade = 'critica';
            titulo = `Goleada: ${totalGols} gols!`;
            resumo = `${f.teams?.home?.name} ${f.goals?.home} x ${f.goals?.away} ${f.teams?.away?.name} (${elapsed}')`;
          } else if (totalGols >= 2) {
            prioridade = 'alta';
            titulo = `${totalGols} gols no jogo`;
            resumo = `${f.teams?.home?.name} ${f.goals?.home} x ${f.goals?.away} ${f.teams?.away?.name} (${elapsed}')`;
          } else if (elapsed >= 75) {
            prioridade = 'normal';
            titulo = 'Reta final';
            resumo = `${f.teams?.home?.name} ${f.goals?.home} x ${f.goals?.away} ${f.teams?.away?.name} (${elapsed}')`;
          }

          return {
            fixtureId: f.fixture?.id,
            prioridade,
            titulo,
            resumo,
            liga: f.league?.name || '',
            timestamp: new Date().toISOString(),
          };
        })
        .slice(0, 10);

      return alertas;
    } catch (error) {
      console.error("[football.centralAlertas]", error);
      return [];
    }
  }),

  // ===== RADAR JOGO =====

  radarJogo: publicProcedure
    .input(z.object({ fixtureId: z.number() }))
    .query(async ({ input }) => {
      try {
        const [fixtureData, statsData, eventsData] = await Promise.all([
          apiFootball.getFixtureById(input.fixtureId) as Promise<any[]>,
          apiFootball.getFixtureStatistics(input.fixtureId) as Promise<any[]>,
          apiFootball.getFixtureEvents(input.fixtureId) as Promise<any[]>,
        ]);

        const fixture = fixtureData?.[0];
        if (!fixture) return null;

        // Processa estatísticas
        const homeStats = statsData?.[0]?.statistics || [];
        const awayStats = statsData?.[1]?.statistics || [];
        
        const getStat = (stats: any[], type: string) => {
          const stat = stats.find((s: any) => s.type === type);
          return stat?.value ?? 0;
        };

        return {
          fixture: {
            id: fixture.fixture?.id,
            status: fixture.fixture?.status?.short,
            elapsed: fixture.fixture?.status?.elapsed || 0,
            date: fixture.fixture?.date,
          },
          homeTeam: {
            name: fixture.teams?.home?.name || 'TBD',
            logo: fixture.teams?.home?.logo || '',
            score: fixture.goals?.home ?? 0,
          },
          awayTeam: {
            name: fixture.teams?.away?.name || 'TBD',
            logo: fixture.teams?.away?.logo || '',
            score: fixture.goals?.away ?? 0,
          },
          league: {
            name: fixture.league?.name || '',
            logo: fixture.league?.logo || '',
            round: fixture.league?.round || '',
          },
          stats: {
            homePossession: getStat(homeStats, 'Ball Possession'),
            awayPossession: getStat(awayStats, 'Ball Possession'),
            homeShotsOnGoal: getStat(homeStats, 'Shots on Goal'),
            awayShotsOnGoal: getStat(awayStats, 'Shots on Goal'),
            homeCorners: getStat(homeStats, 'Corner Kicks'),
            awayCorners: getStat(awayStats, 'Corner Kicks'),
            homeDangerousAttacks: getStat(homeStats, 'Dangerous Attacks'),
            awayDangerousAttacks: getStat(awayStats, 'Dangerous Attacks'),
            homeTotalShots: getStat(homeStats, 'Total Shots'),
            awayTotalShots: getStat(awayStats, 'Total Shots'),
          },
          events: (eventsData || []).map((e: any) => ({
            time: e.time?.elapsed,
            type: e.type,
            detail: e.detail,
            player: e.player?.name,
            team: e.team?.name,
          })),
          pressao: (() => {
            const homeDA = getStat(homeStats, 'Dangerous Attacks') || 0;
            const awayDA = getStat(awayStats, 'Dangerous Attacks') || 0;
            const total = homeDA + awayDA;
            return total > 0 ? Math.round((homeDA / total) * 100) : 50;
          })(),
        };
      } catch (error) {
        console.error("[football.radarJogo]", error);
        return null;
      }
    }),

  // ===== JOGOS HOJE =====

  jogosHoje: publicProcedure
    .input(z.object({ date: z.string().optional() }).optional())
    .query(async ({ input }) => {
      try {
        const today = input?.date || new Date().toISOString().split('T')[0];
        const fixtures = await apiFootball.getFixturesByDate(today) as any[];
        
        // Agrupa por liga
        const ligasMap = new Map<string, any>();
        (fixtures || []).forEach((f: any) => {
          const ligaKey = `${f.league?.id}`;
          if (!ligasMap.has(ligaKey)) {
            ligasMap.set(ligaKey, {
              id: f.league?.id,
              name: f.league?.name || '',
              logo: f.league?.logo || '',
              country: f.league?.country || '',
              flag: f.league?.flag || '',
              jogos: [],
            });
          }
          ligasMap.get(ligaKey).jogos.push({
            id: f.fixture?.id,
            date: f.fixture?.date,
            status: f.fixture?.status?.short || 'NS',
            elapsed: f.fixture?.status?.elapsed,
            homeTeam: f.teams?.home?.name || 'TBD',
            awayTeam: f.teams?.away?.name || 'TBD',
            homeLogo: f.teams?.home?.logo || '',
            awayLogo: f.teams?.away?.logo || '',
            homeScore: f.goals?.home,
            awayScore: f.goals?.away,
            venue: f.fixture?.venue?.name || 'TBD',
            city: f.fixture?.venue?.city || '',
            homeForm: f.teams?.home?.form?.split('').reverse() || [],
            awayForm: f.teams?.away?.form?.split('').reverse() || [],
          });
        });

        return {
          total: fixtures?.length || 0,
          ligas: Array.from(ligasMap.values()),
          data: today,
        };
      } catch (error) {
        console.error("[football.jogosHoje]", error);
        return { total: 0, ligas: [], data: new Date().toISOString().split('T')[0] };
      }
    }),


  searchLeagues: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      try {
        const leagues = await apiFootball.searchLeagues(input.query);
        return leagues || [];
      } catch (error) {
        console.error("[football.searchLeagues]", error);
        return [];
      }
    }),

  searchFixtures: publicProcedure
    .input(z.object({ query: z.string().min(1), date: z.string().optional() }))
    .query(async ({ input }) => {
      try {
        const fixtures = await apiFootball.searchFixtures(input.query, input.date);
        return fixtures || [];
      } catch (error) {
        console.error("[football.searchFixtures]", error);
        return [];
      }
    }),

  // ===== STATUS =====

  status: publicProcedure.query(async () => {
    try {
      return await apiFootball.getStatus();
    } catch (error) {
      console.error("[football.status]", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  // ===== JOGOS TAB (Nova aba) =====
  getFixturesByDate: publicProcedure
    .input(z.object({
      date: z.enum(["today", "tomorrow", "yesterday"]),
    }))
    .query(async ({ input }) => {
      try {
        const today = new Date();
        let targetDate = new Date(today);
        
        if (input.date === "tomorrow") {
          targetDate.setDate(today.getDate() + 1);
        } else if (input.date === "yesterday") {
          targetDate.setDate(today.getDate() - 1);
        }
        
        const dateStr = targetDate.toISOString().split('T')[0];
        const cacheKey = `jogos:${dateStr}`;
        const cached = cacheManager.get("jogos", cacheKey);
        if (cached) return cached;

        const fixtures = await apiFootball.getFixturesByDate(dateStr, "America/Sao_Paulo");
        const reduced = (fixtures as any[]).map(reduceFixturePayload);
        cacheManager.set("jogos", cacheKey, reduced, 30000);
        return reduced;
      } catch (error) {
        console.error("[football.getFixturesByDate]", error);
        return [];
      }
    }),

  getFixtureDetails: publicProcedure
    .input(z.object({
      fixtureId: z.number(),
    }))
    .query(async ({ input }) => {
      try {
        const cacheKey = `details:${input.fixtureId}`;
        const cached = cacheManager.get("fixtureDetails", cacheKey);
        if (cached) return cached;

        const result = await apiFootball.getFixtureById(input.fixtureId);
        const fixture = (result as any[])[0];
        
        if (!fixture) throw new Error("Fixture not found");
        
        const enriched = {
          ...fixture,
          events: fixture.events || [],
          statistics: fixture.statistics || [],
          lineups: fixture.lineups || [],
          players: fixture.players || [],
          odds: fixture.odds || [],
        };

        cacheManager.set("fixtureDetails", cacheKey, enriched, 10000);
        return enriched;
      } catch (error) {
        console.error("[football.getFixtureDetails]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // ===== DESTAQUES SCANNER (Centralizado) =====
  // ===== DESTAQUES SCANNER v27a (HOTFIX) =====
  destaquesScanner: destaquesScannerProcedure,

});
