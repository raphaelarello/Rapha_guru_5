import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';

export const performanceRouter = router({
  // Obter métricas gerais de performance
  getMetrics: protectedProcedure
    .input(z.object({
      period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
      minConfidence: z.number().min(0).max(100).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // Mock data - em produção, viria do banco de dados
      const metrics = {
        roi: 12.5,
        totalBets: 145,
        wins: 89,
        losses: 56,
        winRate: 61.4,
        avgOdd: 2.15,
        totalProfit: 1250,
        sharpeRatio: 1.85,
        maxDrawdown: -8.5,
        profitFactor: 2.3,
      };

      return metrics;
    }),

  // Performance por mercado
  getMarketPerformance: protectedProcedure
    .input(z.object({
      period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
    }))
    .query(async ({ ctx, input }) => {
      // Mock data
      const markets = [
        { market: '1X2', roi: 15.2, bets: 45, winRate: 64.4, wins: 29, losses: 16 },
        { market: 'Mais 2.5', roi: 10.8, bets: 38, winRate: 58.2, wins: 22, losses: 16 },
        { market: 'Menos 2.5', roi: 9.5, bets: 35, winRate: 57.1, wins: 20, losses: 15 },
        { market: 'Ambos Marcam', roi: 12.3, bets: 27, winRate: 63.0, wins: 17, losses: 10 },
      ];

      return markets;
    }),

  // Performance por liga
  getLeaguePerformance: protectedProcedure
    .input(z.object({
      period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
    }))
    .query(async ({ ctx, input }) => {
      // Mock data
      const leagues = [
        { league: 'Premier League', roi: 14.2, bets: 42, winRate: 66.7, wins: 28, losses: 14 },
        { league: 'La Liga', roi: 11.5, bets: 35, winRate: 62.9, wins: 22, losses: 13 },
        { league: 'Serie A', roi: 10.3, bets: 32, winRate: 59.4, wins: 19, losses: 13 },
        { league: 'Bundesliga', roi: 13.8, bets: 28, winRate: 64.3, wins: 18, losses: 10 },
        { league: 'Ligue 1', roi: 9.2, bets: 8, winRate: 50.0, wins: 4, losses: 4 },
      ];

      return leagues;
    }),

  // Curva de lucro diária
  getProfitCurve: protectedProcedure
    .input(z.object({
      period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
    }))
    .query(async ({ ctx, input }) => {
      // Mock data - lucro acumulado por dia
      const days = 30;
      const profitCurve = Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        profit: Math.floor(Math.random() * 200 - 50 + i * 5), // Trend positivo
        cumulative: Math.floor((i + 1) * 40 + Math.random() * 100),
      }));

      return profitCurve;
    }),

  // Distribuição de wins/losses por período
  getWinLossDistribution: protectedProcedure
    .input(z.object({
      period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
    }))
    .query(async ({ ctx, input }) => {
      // Mock data
      const distribution = {
        wins: 89,
        losses: 56,
        winRate: 61.4,
        avgWin: 18.5,
        avgLoss: -12.3,
        largestWin: 125.5,
        largestLoss: -85.2,
        consecutiveWins: 7,
        consecutiveLosses: 3,
      };

      return distribution;
    }),

  // Heatmap de performance por liga e mercado
  getPerformanceHeatmap: protectedProcedure
    .input(z.object({
      period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
    }))
    .query(async ({ ctx, input }) => {
      // Mock data - ROI por liga x mercado
      const heatmap = [
        { league: 'Premier League', '1X2': 18.2, 'Mais 2.5': 12.5, 'Menos 2.5': 10.8, 'Ambos Marcam': 15.3 },
        { league: 'La Liga', '1X2': 14.5, 'Mais 2.5': 10.2, 'Menos 2.5': 8.5, 'Ambos Marcam': 12.1 },
        { league: 'Serie A', '1X2': 12.3, 'Mais 2.5': 9.5, 'Menos 2.5': 7.2, 'Ambos Marcam': 10.5 },
        { league: 'Bundesliga', '1X2': 16.8, 'Mais 2.5': 11.5, 'Menos 2.5': 9.8, 'Ambos Marcam': 14.2 },
        { league: 'Ligue 1', '1X2': 10.2, 'Mais 2.5': 7.5, 'Menos 2.5': 5.8, 'Ambos Marcam': 8.5 },
      ];

      return heatmap;
    }),
});
