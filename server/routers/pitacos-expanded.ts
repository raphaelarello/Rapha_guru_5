/**
 * Expanded Pitacos Router - Adiciona procedures do Pitacos Engine ao router existente
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getPitacosByUserId, createPitaco, updatePitaco } from "../db";

export const pitacosExpandedRouter = router({
  // Procedures originais
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getPitacosByUserId(ctx.user.id);
    } catch (error) {
      console.error("[pitacos.list]", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  create: protectedProcedure
    .input(z.object({
      jogo: z.string().min(1),
      mercado: z.string().min(1),
      odd: z.number().min(1),
      analise: z.string().min(1),
      confianca: z.number().min(0).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await createPitaco({
          userId: ctx.user.id,
          jogo: input.jogo,
          mercado: input.mercado,
          odd: input.odd.toString(),
          analise: input.analise,
          confianca: input.confianca,
          resultado: "pendente",
        });
      } catch (error) {
        console.error("[pitacos.create]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      resultado: z.enum(["pendente", "green", "red", "void"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await updatePitaco(input.id, ctx.user.id, input);
      } catch (error) {
        console.error("[pitacos.update]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // ─── PITACOS ENGINE PROCEDURES ───────────────────────────────────────────

  /**
   * Aba "Hoje" - Jogos do dia com pré-jogo e relatório 08:00
   */
  getTodayGames: protectedProcedure
    .input(z.object({
      date: z.string().optional(),
      status: z.enum(["upcoming", "live", "finished"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // TODO: Implementar com aggregateForPitacos
        return {
          status: "development",
          message: "Aba Hoje - Em desenvolvimento",
          date: input.date || new Date().toISOString().split("T")[0],
        };
      } catch (error) {
        console.error("[pitacos.getTodayGames]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Aba "Ao Vivo" - Atualização a cada 30s com termômetro
   */
  getLiveGames: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // TODO: Implementar com aggregateForPitacos + heat score
        return {
          status: "development",
          message: "Aba Ao Vivo - Em desenvolvimento",
          limit: input.limit,
        };
      } catch (error) {
        console.error("[pitacos.getLiveGames]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Aba "Ligas" - Rankings por liga
   */
  getLeagueRankings: protectedProcedure
    .input(z.object({
      metric: z.enum(["goals", "corners", "cards", "homeWin", "awayWin", "predictability"]),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // TODO: Implementar com leagueSeasonStats
        return {
          status: "development",
          message: "Aba Ligas - Em desenvolvimento",
          metric: input.metric,
        };
      } catch (error) {
        console.error("[pitacos.getLeagueRankings]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Aba "Jogadores" - Quentes e indisciplinados
   */
  getHotPlayers: protectedProcedure
    .input(z.object({
      tipo: z.enum(["hot", "disciplined", "injured"]),
      limit: z.number().default(15),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // TODO: Implementar com hotPlayers table
        return {
          status: "development",
          message: "Aba Jogadores - Em desenvolvimento",
          tipo: input.tipo,
        };
      } catch (error) {
        console.error("[pitacos.getHotPlayers]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Aba "Acurácia" - Hits/misses por tópico, liga, mês, minuto
   */
  getAccuracyMetrics: protectedProcedure
    .input(z.object({
      groupBy: z.enum(["topic", "league", "month", "minute"]),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // TODO: Implementar com pickOutcomes
        return {
          status: "development",
          message: "Aba Acurácia - Em desenvolvimento",
          groupBy: input.groupBy,
        };
      } catch (error) {
        console.error("[pitacos.getAccuracyMetrics]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Aba "Telão" - Modo TV com widgets auto-rotate
   */
  getScreenData: protectedProcedure
    .input(z.object({
      widget: z.enum(["live", "accuracy", "leagues", "players", "tickets"]),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // TODO: Implementar com diferentes widgets
        return {
          status: "development",
          message: "Telão - Em desenvolvimento",
          widget: input.widget,
        };
      } catch (error) {
        console.error("[pitacos.getScreenData]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Criar bilhete multi-tópico
   */
  createTicket: protectedProcedure
    .input(z.object({
      fixtureId: z.number(),
      leagueName: z.string(),
      homeTeam: z.string(),
      awayTeam: z.string(),
      topics: z.array(
        z.object({
          topic: z.string(),
          market: z.string(),
          selection: z.string(),
          odd: z.number(),
          confidence: z.number(),
        })
      ),
      stake: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // TODO: Implementar com tickets table
        const totalOdd = input.topics.reduce((acc, t) => acc * t.odd, 1);
        return {
          status: "development",
          message: "Bilhete criado - Em desenvolvimento",
          topicCount: input.topics.length,
          totalOdd,
        };
      } catch (error) {
        console.error("[pitacos.createTicket]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Avaliar bilhete multi-tópico
   */
  evaluateTicket: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      finalScore: z.string(),
      outcomes: z.array(
        z.object({
          topicId: z.number(),
          hit: z.boolean(),
        })
      ),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // TODO: Implementar com ticketOutcomes
        const hitCount = input.outcomes.filter((o) => o.hit).length;
        return {
          status: "development",
          message: "Bilhete avaliado - Em desenvolvimento",
          hitCount,
          totalTopics: input.outcomes.length,
        };
      } catch (error) {
        console.error("[pitacos.evaluateTicket]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Gerar relatório 08:00
   */
  generateDailyReport: protectedProcedure
    .input(z.object({
      date: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // TODO: Implementar com dailyReports
        return {
          status: "development",
          message: "Relatório 08:00 - Em desenvolvimento",
          date: input.date || new Date().toISOString().split("T")[0],
        };
      } catch (error) {
        console.error("[pitacos.generateDailyReport]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Calcular confidence e risk score dinâmicos
   */
  calculateScores: protectedProcedure
    .input(z.object({
      league: z.string(),
      market: z.string(),
      minute: z.number(),
      oddsStale: z.boolean(),
      baseConfidence: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Cálculo dinâmico simples (será expandido)
        let riskScore = (100 - input.baseConfidence) * 0.3;
        if (input.minute > 75) riskScore += 15;
        if (input.minute > 85) riskScore += 10;
        if (input.oddsStale) riskScore += 20;

        riskScore = Math.min(100, riskScore);
        const confidenceScore = Math.max(0, input.baseConfidence - riskScore * 0.5);

        return {
          confidenceScore: Math.round(confidenceScore),
          riskScore: Math.round(riskScore),
          flags: input.oddsStale ? ["ODD_DESATUALIZADA"] : [],
          recommendation:
            confidenceScore > 70 && riskScore < 30
              ? "✅ LOW RISK"
              : confidenceScore > 50 && riskScore < 50
                ? "⚠️ MEDIUM RISK"
                : "❌ HIGH RISK",
        };
      } catch (error) {
        console.error("[pitacos.calculateScores]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
