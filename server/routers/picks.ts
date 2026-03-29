/**
 * Picks Router - tRPC procedures para histórico de picks, Kelly Criterion, e notificações
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { savePickHistory, getPicksHistoryByUserId, getPicksStats, updatePickHistory } from "../db";
import { calculateKelly, calculateExpectedROI } from "../kelly-calculator";
import { notifyGoldPick, notifyHighOpportunity } from "../push-notifications";

export const picksRouter = router({
  /**
   * Exportar histórico de picks em CSV
   */
  exportCSV: protectedProcedure
    .query(async ({ ctx }) => {
      const picks = await getPicksHistoryByUserId(ctx.user.id);
      
      // Gerar CSV
      const headers = ["Data", "Time", "Mercado", "Seleção", "Edge", "EV", "Odd", "Stake", "Resultado", "ROI"];
      const rows = picks.map(p => [
        new Date(p.createdAt).toLocaleDateString('pt-BR'),
        `${p.homeTeam} vs ${p.awayTeam}`,
        p.market,
        p.selection,
        ((Number(p.edge) ?? 0) * 100).toFixed(2),
        ((Number(p.ev) ?? 0) * 100).toFixed(2),
        Number(p.odd).toFixed(2),
        (Number(p.recommendedStake) ?? 0).toFixed(2),
        p.result || "PENDENTE",
        ((Number(p.roi) ?? 0) * 100).toFixed(2),
      ]);
      
      const csv = [
        headers.join(","),
        ...rows.map(r => r.map(v => `"${v}"`).join(","))
      ].join("\n");
      
      return { csv };
    }),

  /**
   * Recuperar histórico de picks do usuário
   */
  getPicksHistory: protectedProcedure
    .query(async ({ ctx }) => {
      return await getPicksHistoryByUserId(ctx.user.id);
    }),
  /**
   * Salvar um pick no histórico
   */
  savePick: protectedProcedure
    .input(z.object({
      fixtureId: z.number(),
      leagueName: z.string().optional(),
      homeTeam: z.string(),
      awayTeam: z.string(),
      market: z.string(),
      selection: z.string(),
      edge: z.number(), // em decimal (ex: 0.055 = 5.5%)
      ev: z.number(), // em decimal (ex: 0.15 = 15%)
      odd: z.number(),
      modelProb: z.number(), // 0-1
      confidence: z.number().default(0),
      status: z.enum(["LIVE", "UPCOMING", "FINISHED", "CANCELLED"]).default("UPCOMING"),
      bankroll: z.number().optional(), // para calcular Kelly
      kellyFraction: z.number().default(0.25),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Calcular Kelly Criterion
        const kelly = calculateKelly(input.modelProb, input.odd, input.bankroll || 1000, input.kellyFraction);
        
        // Salvar no banco
        const pick = await savePickHistory({
          userId: ctx.user.id,
          fixtureId: input.fixtureId,
          leagueName: input.leagueName,
          homeTeam: input.homeTeam,
          awayTeam: input.awayTeam,
          market: input.market,
          selection: input.selection,
          edge: String(input.edge),
          ev: String(input.ev),
          odd: String(input.odd),
          modelProb: String(input.modelProb),
          confidence: input.confidence,
          status: input.status,
          kellyFraction: String(input.kellyFraction),
          recommendedStake: String(kelly.optimalStake),
          result: "pending",
        });

        // Enviar notificação se for Gold Pick
        if (input.edge > 0.05) {
          await notifyGoldPick(ctx.user.id, {
            homeTeam: input.homeTeam,
            awayTeam: input.awayTeam,
            market: input.market,
            selection: input.selection,
            edge: input.edge * 100,
            ev: input.ev * 100,
            odd: input.odd,
            confidence: input.confidence,
          });
        }

        return { success: true, pick, kelly };
      } catch (error) {
        console.error("[picks.savePick]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Obter histórico de picks do usuário
   */
  getHistory: protectedProcedure
    .input(z.object({
      limit: z.number().default(100),
      market: z.string().optional(),
      status: z.enum(["LIVE", "UPCOMING", "FINISHED", "CANCELLED", "pending", "won", "lost"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        let picks = await getPicksHistoryByUserId(ctx.user.id, input.limit);

        // Filtrar por mercado
        if (input.market) {
          picks = picks.filter(p => p.market === input.market);
        }

        // Filtrar por status
        if (input.status) {
          picks = picks.filter(p => p.status === input.status || p.result === input.status);
        }

        return picks;
      } catch (error) {
        console.error("[picks.getHistory]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Obter estatísticas de picks
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const stats = await getPicksStats(ctx.user.id);
        return stats;
      } catch (error) {
        console.error("[picks.getStats]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Atualizar resultado de um pick
   */
  updateResult: protectedProcedure
    .input(z.object({
      pickId: z.number(),
      result: z.enum(["won", "lost", "void"]),
      profit: z.number().optional(),
      roi: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const pick = await updatePickHistory(input.pickId, ctx.user.id, {
          result: input.result,
          profit: input.profit ? String(input.profit) : null,
          roi: input.roi ? String(input.roi) : null,
        });

        return { success: true, pick };
      } catch (error) {
        console.error("[picks.updateResult]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  /**
   * Calcular Kelly Criterion para um pick
   */
  calculateKelly: publicProcedure
    .input(z.object({
      modelProb: z.number().min(0).max(1),
      odd: z.number().min(1.01),
      bankroll: z.number().min(1),
      kellyFraction: z.number().default(0.25),
    }))
    .query(async ({ input }) => {
      try {
        const kelly = calculateKelly(input.modelProb, input.odd, input.bankroll, input.kellyFraction);
        return kelly;
      } catch (error) {
        console.error("[picks.calculateKelly]", error);
        throw new TRPCError({ code: "BAD_REQUEST", message: (error as Error).message });
      }
    }),

  /**
   * Calcular ROI esperado
   */
  calculateROI: publicProcedure
    .input(z.object({
      modelProb: z.number().min(0).max(1),
      odd: z.number().min(1.01),
      stake: z.number().min(1),
    }))
    .query(async ({ input }) => {
      try {
        const roi = calculateExpectedROI(input.modelProb, input.odd, input.stake);
        return { roi, expectedProfit: (roi / 100) * input.stake };
      } catch (error) {
        console.error("[picks.calculateROI]", error);
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
    }),
});
