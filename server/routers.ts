import { getSessionCookieOptions } from "./_core/cookies";
const COOKIE_NAME = "session";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { footballRouter } from "./routers/football";
import { picksRouter } from "./routers/picks";
import { pitacosExpandedRouterV2 } from "./routers/pitacos-expanded-v2";
import {
  getBotsByUserId, getBotById, createBot, updateBot, deleteBot,
  getCanaisByUserId, upsertCanal, updateCanal,
  getAlertasByUserId, createAlerta, updateAlerta,
  getBancaByUserId, upsertBanca,
  getApostasByUserId, createAposta, updateAposta,
  getPitacosByUserId, createPitaco, updatePitaco,
} from "./db";

// Mock removido - usando dados 100% reais via football.dashboardAoVivo

// Placeholder para evitar referências quebradas
function _deprecated_getMockFixtures() {
  return [
    {
      fixture: { id: 1001, status: { short: 'live', elapsed: 25 } },
      teams: {
        home: { id: 1, name: 'Manchester City', logo: 'https://media.api-sports.io/teams/50.png' },
        away: { id: 2, name: 'Liverpool', logo: 'https://media.api-sports.io/teams/51.png' }
      },
      goals: { home: 1, away: 0 },
      league: { name: 'Premier League', flag: '🇬🇧' },
      statistics: [
        {
          statistics: [
            { type: 'shots_on_goal', value: 3 },
            { type: 'shots_total', value: 8 },
            { type: 'ball_possession', value: '65' },
            { type: 'corner_kicks', value: 4 }
          ]
        },
        {
          statistics: [
            { type: 'shots_on_goal', value: 2 },
            { type: 'shots_total', value: 5 },
            { type: 'ball_possession', value: '35' },
            { type: 'corner_kicks', value: 2 }
          ]
        }
      ],
      events: [
        { type: 'Goal', team: { id: 1 }, player: { name: 'Haaland' }, time: { elapsed: 15 } },
        { type: 'Card', team: { id: 2 }, detail: 'Yellow Card', time: { elapsed: 20 } }
      ]
    },
    {
      fixture: { id: 1002, status: { short: 'live', elapsed: 42 } },
      teams: {
        home: { id: 3, name: 'Real Madrid', logo: 'https://media.api-sports.io/teams/541.png' },
        away: { id: 4, name: 'Barcelona', logo: 'https://media.api-sports.io/teams/529.png' }
      },
      goals: { home: 2, away: 1 },
      league: { name: 'La Liga', flag: '🇪🇸' },
      statistics: [
        {
          statistics: [
            { type: 'shots_on_goal', value: 5 },
            { type: 'shots_total', value: 12 },
            { type: 'ball_possession', value: '58' },
            { type: 'corner_kicks', value: 6 }
          ]
        },
        {
          statistics: [
            { type: 'shots_on_goal', value: 4 },
            { type: 'shots_total', value: 10 },
            { type: 'ball_possession', value: '42' },
            { type: 'corner_kicks', value: 3 }
          ]
        }
      ],
      events: [
        { type: 'Goal', team: { id: 3 }, player: { name: 'Benzema' }, time: { elapsed: 12 } },
        { type: 'Goal', team: { id: 3 }, player: { name: 'Vinicius' }, time: { elapsed: 28 } },
        { type: 'Goal', team: { id: 4 }, player: { name: 'Lewandowski' }, time: { elapsed: 35 } }
      ]
    },
    {
      fixture: { id: 1003, status: { short: 'live', elapsed: 67 } },
      teams: {
        home: { id: 5, name: 'Bayern Munich', logo: 'https://media.api-sports.io/teams/25.png' },
        away: { id: 6, name: 'Borussia Dortmund', logo: 'https://media.api-sports.io/teams/16.png' }
      },
      goals: { home: 3, away: 2 },
      league: { name: 'Bundesliga', flag: '🇩🇪' },
      statistics: [
        {
          statistics: [
            { type: 'shots_on_goal', value: 7 },
            { type: 'shots_total', value: 15 },
            { type: 'ball_possession', value: '62' },
            { type: 'corner_kicks', value: 5 }
          ]
        },
        {
          statistics: [
            { type: 'shots_on_goal', value: 5 },
            { type: 'shots_total', value: 12 },
            { type: 'ball_possession', value: '38' },
            { type: 'corner_kicks', value: 4 }
          ]
        }
      ],
      events: [
        { type: 'Goal', team: { id: 5 }, player: { name: 'Muller' }, time: { elapsed: 8 } },
        { type: 'Goal', team: { id: 6 }, player: { name: 'Bellingham' }, time: { elapsed: 22 } },
        { type: 'Goal', team: { id: 5 }, player: { name: 'Sane' }, time: { elapsed: 45 } },
        { type: 'Card', team: { id: 6 }, detail: 'Yellow Card', time: { elapsed: 50 } },
        { type: 'Goal', team: { id: 5 }, player: { name: 'Gnabry' }, time: { elapsed: 58 } },
        { type: 'Goal', team: { id: 6 }, player: { name: 'Akanji' }, time: { elapsed: 63 } }
      ]
    }
  ];
}

/**
 * Main application router combining all feature routers.
 */
export const appRouter = router({
  system: systemRouter,
  football: footballRouter,
  picks: picksRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Bots management
  bots: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getBotsByUserId(ctx.user.id);
      } catch (error) {
        console.error("[bots.list]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          const bot = await getBotById(input.id, ctx.user.id);
          if (!bot) throw new TRPCError({ code: "NOT_FOUND" });
          return bot;
        } catch (error) {
          console.error("[bots.getById]", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

  create: protectedProcedure
    .input(z.object({
      nome: z.string(),
      descricao: z.string().optional(),
      templateId: z.string().optional(),
      confiancaMinima: z.number().optional(),
      limiteDiario: z.number().optional(),
      canal: z.string().optional(),
    }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await createBot({
            userId: ctx.user.id,
            nome: input.nome,
            descricao: input.descricao || null,
            templateId: input.templateId || null,
            confiancaMinima: input.confiancaMinima || 70,
            limiteDiario: input.limiteDiario || 10,
            canal: input.canal || "painel",
            ativo: false,
          });
        } catch (error) {
          console.error("[bots.create]", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        tipo: z.string().optional(),
        ativo: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await updateBot(input.id, ctx.user.id, input);
        } catch (error) {
          console.error("[bots.update]", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await deleteBot(input.id, ctx.user.id);
        } catch (error) {
          console.error("[bots.delete]", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),
  }),

  // Canais (Communication channels)
  canais: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getCanaisByUserId(ctx.user.id);
      } catch (error) {
        console.error("[canais.list]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

    upsert: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        tipo: z.enum(["whatsapp_evolution", "whatsapp_zapi", "telegram", "email", "push"]),
        nome: z.string().min(1),
        ativo: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await upsertCanal({
            id: input.id,
            userId: ctx.user.id,
            tipo: input.tipo,
            nome: input.nome,
            ativo: input.ativo,
          });
        } catch (error) {
          console.error("[canais.upsert]", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        ativo: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await updateCanal(input.id, ctx.user.id, input);
        } catch (error) {
          console.error("[canais.update]", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),
  }),

  // Alertas (Alerts)
  alertas: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getAlertasByUserId(ctx.user.id);
      } catch (error) {
        console.error("[alertas.list]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

    create: protectedProcedure
      .input(z.object({
        jogo: z.string().min(1),
        mercado: z.string().min(1),
        odd: z.number().min(1),
        confianca: z.number().min(0).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await createAlerta({
            userId: ctx.user.id,
            jogo: input.jogo,
            mercado: input.mercado,
            odd: input.odd.toString(),
            confianca: input.confianca,
          });
        } catch (error) {
          console.error("[alertas.create]", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        tipo: z.string().optional(),
        condicao: z.string().optional(),
        ativo: z.boolean().optional(),
        resultado: z.enum(["pendente", "green", "red", "void"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await updateAlerta(input.id, ctx.user.id, input);
        } catch (error) {
          console.error("[alertas.update]", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),
  }),

  // Bancas (Bankroll management)
  bancas: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getBancaByUserId(ctx.user.id);
      } catch (error) {
        console.error("[bancas.get]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

    upsert: protectedProcedure
      .input(z.object({
        valorTotal: z.number().positive().optional(),
        valorAtual: z.number().positive().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await upsertBanca({
            userId: ctx.user.id,
            valorTotal: input.valorTotal?.toString(),
            valorAtual: input.valorAtual?.toString(),
          });
        } catch (error) {
          console.error("[bancas.upsert]", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),
  }),

  // Apostas (Bets)
  apostas: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getApostasByUserId(ctx.user.id);
      } catch (error) {
        console.error("[apostas.list]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

    create: protectedProcedure
      .input(z.object({
        jogo: z.string().min(1),
        mercado: z.string().min(1),
        odd: z.number().positive(),
        stake: z.number().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await createAposta({
            userId: ctx.user.id,
            jogo: input.jogo,
            mercado: input.mercado,
            odd: input.odd.toString(),
            stake: input.stake.toString(),
            resultado: "pendente",
          });
        } catch (error) {
          console.error("[apostas.create]", error);
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
          return await updateAposta(input.id, ctx.user.id, input);
        } catch (error) {
          console.error("[apostas.update]", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),
  }),

  // Pitacos (Manual analyses + Engine - Marcos 1-4)
  pitacos: pitacosExpandedRouterV2,

  // live.dashboardAoVivo REMOVIDO - frontend agora usa football.dashboardAoVivo diretamente
});

export type AppRouter = typeof appRouter;
