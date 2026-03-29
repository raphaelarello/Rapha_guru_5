import { z } from "zod";
import { protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  processAllFinalizedMatches,
  detectPatterns,
  calculateAccumulatedROI,
} from "../pro/result-evaluator-complete";
import { inc, observe } from "../pro/observability/metrics";

export const pitacosAdvancedProcedures = {
  processResults: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const result = await processAllFinalizedMatches();
      inc("alerts_sent");
      return result;
    } catch (error) {
      console.error("[pitacos.processResults]", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  detectPatterns: protectedProcedure
    .input(z.object({ lookbackDays: z.number().default(7) }))
    .query(async ({ ctx, input }) => {
      try {
        const patterns = await detectPatterns(ctx.user.id, input.lookbackDays);
        inc("cache_hit");
        return patterns;
      } catch (error) {
        console.error("[pitacos.detectPatterns]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  getAccumulatedROI: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;

        const roi = await calculateAccumulatedROI(ctx.user.id, startDate, endDate);
        observe("accumulated_roi", roi.roi);
        inc("cache_hit");
        return roi;
      } catch (error) {
        console.error("[pitacos.getAccumulatedROI]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
};
