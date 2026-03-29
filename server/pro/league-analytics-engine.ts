/**
 * Motor de Análise de Ligas - Pitacos Engine
 * Estatísticas agregadas por liga, ranking de azarões, pressão, etc
 */

import { observe, inc } from "./observability/metrics";

export interface EstatisticasLiga {
  liga: string;
  pais: string;
  mediaGolsPorJogo: number;
  mediaEscanteiosPorJogo: number;
  mediaCartoesPorJogo: number;
  taxaVitoriaCasa: number;
  taxaVitoriaVisitante: number;
  taxaEmpate: number;
  taxaAmbosMarquem: number;
  totalJogos: number;
  totalGols: number;
  totalEscanteios: number;
  totalCartoes: number;
  goleadasPorCento: number;
  viradosPorCento: number;
  timestamp: Date;
}

export interface TimeRanking {
  posicao: number;
  time: string;
  liga: string;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldoGols: number;
  mediaGolsPorJogo: number;
  pressaoAtual: number;
  tendencia: "↑ CRESCENTE" | "→ ESTÁVEL" | "↓ DECRESCENTE";
  status: "🔥 QUENTE" | "🌡️ NORMAL" | "❄️ FRIO";
}

export interface AzaraoAnalise {
  time: string;
  liga: string;
  posicaoAtual: number;
  probabilidadeAcesso: number;
  probabilidadeCampeao: number;
  probabilidadeQueda: number;
  ultimosResultados: string[];
  tendencia: "↑ CRESCENTE" | "→ ESTÁVEL" | "↓ DECRESCENTE";
  recomendacao: string;
}

export interface RankingLiga {
  liga: string;
  times: TimeRanking[];
  topGoleiros: Array<{ nome: string; gols: number; time: string }>;
  topAssistentes: Array<{ nome: string; assistencias: number; time: string }>;
  timeComMaisGols: { time: string; gols: number };
  timeComMenosGols: { time: string; gols: number };
  timeComMaisCartoes: { time: string; cartoes: number };
  timeComMaisEscanteios: { time: string; escanteios: number };
  timestamp: Date;
}

/**
 * Obter estatísticas completas de uma liga
 */
export async function obterEstatisticasLiga(liga: string): Promise<EstatisticasLiga> {
  try {
    // TODO: Integrar com banco de dados real da API-Football

    const ligas: Record<string, EstatisticasLiga> = {
      "Brasileirão": {
        liga: "Brasileirão",
        pais: "Brasil",
        mediaGolsPorJogo: 2.8,
        mediaEscanteiosPorJogo: 9.2,
        mediaCartoesPorJogo: 4.1,
        taxaVitoriaCasa: 48,
        taxaVitoriaVisitante: 28,
        taxaEmpate: 24,
        taxaAmbosMarquem: 62,
        totalJogos: 380,
        totalGols: 1064,
        totalEscanteios: 3496,
        totalCartoes: 1558,
        goleadasPorCento: 18,
        viradosPorCento: 12,
        timestamp: new Date(),
      },
      "Premier League": {
        liga: "Premier League",
        pais: "Inglaterra",
        mediaGolsPorJogo: 2.9,
        mediaEscanteiosPorJogo: 10.1,
        mediaCartoesPorJogo: 3.8,
        taxaVitoriaCasa: 52,
        taxaVitoriaVisitante: 25,
        taxaEmpate: 23,
        taxaAmbosMarquem: 58,
        totalJogos: 380,
        totalGols: 1102,
        totalEscanteios: 3838,
        totalCartoes: 1444,
        goleadasPorCento: 20,
        viradosPorCento: 14,
        timestamp: new Date(),
      },
      "La Liga": {
        liga: "La Liga",
        pais: "Espanha",
        mediaGolsPorJogo: 2.6,
        mediaEscanteiosPorJogo: 8.9,
        mediaCartoesPorJogo: 3.5,
        taxaVitoriaCasa: 50,
        taxaVitoriaVisitante: 26,
        taxaEmpate: 24,
        taxaAmbosMarquem: 55,
        totalJogos: 380,
        totalGols: 988,
        totalEscanteios: 3382,
        totalCartoes: 1330,
        goleadasPorCento: 16,
        viradosPorCento: 11,
        timestamp: new Date(),
      },
      "Serie A": {
        liga: "Serie A",
        pais: "Itália",
        mediaGolsPorJogo: 2.4,
        mediaEscanteiosPorJogo: 8.5,
        mediaCartoesPorJogo: 3.9,
        taxaVitoriaCasa: 49,
        taxaVitoriaVisitante: 27,
        taxaEmpate: 24,
        taxaAmbosMarquem: 52,
        totalJogos: 380,
        totalGols: 912,
        totalEscanteios: 3230,
        totalCartoes: 1482,
        goleadasPorCento: 14,
        viradosPorCento: 10,
        timestamp: new Date(),
      },
      "Ligue 1": {
        liga: "Ligue 1",
        pais: "França",
        mediaGolsPorJogo: 2.7,
        mediaEscanteiosPorJogo: 9.0,
        mediaCartoesPorJogo: 3.6,
        taxaVitoriaCasa: 51,
        taxaVitoriaVisitante: 26,
        taxaEmpate: 23,
        taxaAmbosMarquem: 60,
        totalJogos: 380,
        totalGols: 1026,
        totalEscanteios: 3420,
        totalCartoes: 1368,
        goleadasPorCento: 17,
        viradosPorCento: 12,
        timestamp: new Date(),
      },
    };

    observe("league_stats_retrieved", 1);
    return ligas[liga] || ligas["Brasileirão"];
  } catch (error) {
    console.error("[league-analytics] Erro ao obter estatísticas da liga:", error);
    throw error;
  }
}

/**
 * Obter ranking completo de uma liga
 */
export async function obterRankingLiga(liga: string): Promise<RankingLiga> {
  try {
    // TODO: Integrar com banco de dados real da API-Football

    const timesSimulados: TimeRanking[] = [
      {
        posicao: 1,
        time: "Flamengo",
        liga: "Brasileirão",
        pontos: 72,
        jogos: 28,
        vitorias: 22,
        empates: 6,
        derrotas: 0,
        golsPro: 68,
        golsContra: 18,
        saldoGols: 50,
        mediaGolsPorJogo: 2.43,
        pressaoAtual: 85,
        tendencia: "↑ CRESCENTE",
        status: "🔥 QUENTE",
      },
      {
        posicao: 2,
        time: "Palmeiras",
        liga: "Brasileirão",
        pontos: 68,
        jogos: 28,
        vitorias: 20,
        empates: 8,
        derrotas: 0,
        golsPro: 62,
        golsContra: 22,
        saldoGols: 40,
        mediaGolsPorJogo: 2.21,
        pressaoAtual: 72,
        tendencia: "→ ESTÁVEL",
        status: "🌡️ NORMAL",
      },
      {
        posicao: 3,
        time: "São Paulo",
        liga: "Brasileirão",
        pontos: 64,
        jogos: 28,
        vitorias: 19,
        empates: 7,
        derrotas: 2,
        golsPro: 58,
        golsContra: 28,
        saldoGols: 30,
        mediaGolsPorJogo: 2.07,
        pressaoAtual: 65,
        tendencia: "→ ESTÁVEL",
        status: "🌡️ NORMAL",
      },
      {
        posicao: 4,
        time: "Botafogo",
        liga: "Brasileirão",
        pontos: 60,
        jogos: 28,
        vitorias: 18,
        empates: 6,
        derrotas: 4,
        golsPro: 54,
        golsContra: 32,
        saldoGols: 22,
        mediaGolsPorJogo: 1.93,
        pressaoAtual: 58,
        tendencia: "↓ DECRESCENTE",
        status: "❄️ FRIO",
      },
    ];

    observe("league_ranking_retrieved", 1);

    return {
      liga,
      times: timesSimulados,
      topGoleiros: [
        { nome: "Gabigol", gols: 18, time: "Flamengo" },
        { nome: "Dudu", gols: 16, time: "Palmeiras" },
        { nome: "Calleri", gols: 14, time: "São Paulo" },
      ],
      topAssistentes: [
        { nome: "Arrascaeta", assistencias: 12, time: "Flamengo" },
        { nome: "Veiga", assistencias: 11, time: "Palmeiras" },
        { nome: "Erick", assistencias: 9, time: "São Paulo" },
      ],
      timeComMaisGols: { time: "Flamengo", gols: 68 },
      timeComMenosGols: { time: "Botafogo", gols: 54 },
      timeComMaisCartoes: { time: "Botafogo", cartoes: 42 },
      timeComMaisEscanteios: { time: "Flamengo", escanteios: 124 },
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("[league-analytics] Erro ao obter ranking:", error);
    throw error;
  }
}

/**
 * Analisar azarões (times com chance de acesso/queda)
 */
export async function analisarAzaroes(liga: string): Promise<AzaraoAnalise[]> {
  try {
    const azaroes: AzaraoAnalise[] = [
      {
        time: "Atlético Goianiense",
        liga: "Brasileirão",
        posicaoAtual: 18,
        probabilidadeAcesso: 35,
        probabilidadeCampeao: 2,
        probabilidadeQueda: 65,
        ultimosResultados: ["V", "D", "D", "E", "D"],
        tendencia: "↓ DECRESCENTE",
        recomendacao: "⚠️ Risco de queda. Evitar apostas em vitória.",
      },
      {
        time: "Cuiabá",
        liga: "Brasileirão",
        posicaoAtual: 17,
        probabilidadeAcesso: 28,
        probabilidadeCampeao: 1,
        probabilidadeQueda: 72,
        ultimosResultados: ["D", "D", "E", "D", "D"],
        tendencia: "↓ DECRESCENTE",
        recomendacao: "🔴 Risco crítico. Considerar apenas gols altos.",
      },
      {
        time: "Juventude",
        liga: "Brasileirão",
        posicaoAtual: 16,
        probabilidadeAcesso: 42,
        probabilidadeCampeao: 3,
        probabilidadeQueda: 58,
        ultimosResultados: ["V", "E", "D", "E", "V"],
        tendencia: "→ ESTÁVEL",
        recomendacao: "⚡ Pode surpreender. Odds altas em vitória.",
      },
    ];

    observe("underdogs_analyzed", azaroes.length);
    inc("analysis_total");

    return azaroes;
  } catch (error) {
    console.error("[league-analytics] Erro ao analisar azarões:", error);
    throw error;
  }
}

/**
 * Calcular chance de virada baseado em pressão
 */
export function calcularChanceVirada(
  timePerdendo: TimeRanking,
  timeVencendo: TimeRanking,
  minutoAtual: number,
  pressaoAtual: number
): number {
  const diferenca = Math.abs(timePerdendo.pontos - timeVencendo.pontos);
  if (diferenca > 10) return 0; // Muito difícil com grande diferença

  const fatorPressao = (pressaoAtual / 100) * 50;
  const fatorMinuto = ((90 - minutoAtual) / 90) * 30;
  const fatorHistorico = (timePerdendo.mediaGolsPorJogo / 3) * 20;

  return Math.min(100, fatorPressao + fatorMinuto + fatorHistorico);
}

/**
 * Gerar ranking de pressão em tempo real
 */
export async function gerarRankingPressao(liga: string): Promise<Array<{
  posicao: number;
  time: string;
  pressao: number;
  status: string;
  recomendacao: string;
}>> {
  try {
    const ranking = await obterRankingLiga(liga);

    const rankingPressao = ranking.times
      .sort((a, b) => b.pressaoAtual - a.pressaoAtual)
      .map((time, idx) => ({
        posicao: idx + 1,
        time: time.time,
        pressao: time.pressaoAtual,
        status: time.pressaoAtual > 75 ? "🔥 MUITO QUENTE" : time.pressaoAtual > 50 ? "🌡️ QUENTE" : "❄️ FRIO",
        recomendacao:
          time.pressaoAtual > 75
            ? "✅ Ótima oportunidade para gols"
            : time.pressaoAtual > 50
            ? "⚡ Chance moderada"
            : "❌ Evitar apostas em gols",
      }));

    observe("pressure_ranking_generated", 1);
    return rankingPressao;
  } catch (error) {
    console.error("[league-analytics] Erro ao gerar ranking de pressão:", error);
    throw error;
  }
}

/**
 * Comparar estatísticas de duas ligas
 */
export async function compararLigas(liga1: string, liga2: string): Promise<{
  liga1: EstatisticasLiga;
  liga2: EstatisticasLiga;
  comparacao: Record<string, { vencedor: string; diferenca: string }>;
}> {
  try {
    const stats1 = await obterEstatisticasLiga(liga1);
    const stats2 = await obterEstatisticasLiga(liga2);

    const comparacao = {
      mediaGols: {
        vencedor: stats1.mediaGolsPorJogo > stats2.mediaGolsPorJogo ? liga1 : liga2,
        diferenca: `${Math.abs(stats1.mediaGolsPorJogo - stats2.mediaGolsPorJogo).toFixed(2)} gols/jogo`,
      },
      mediaEscanteios: {
        vencedor: stats1.mediaEscanteiosPorJogo > stats2.mediaEscanteiosPorJogo ? liga1 : liga2,
        diferenca: `${Math.abs(stats1.mediaEscanteiosPorJogo - stats2.mediaEscanteiosPorJogo).toFixed(2)} escanteios/jogo`,
      },
      mediaCartoes: {
        vencedor: stats1.mediaCartoesPorJogo > stats2.mediaCartoesPorJogo ? liga1 : liga2,
        diferenca: `${Math.abs(stats1.mediaCartoesPorJogo - stats2.mediaCartoesPorJogo).toFixed(2)} cartões/jogo`,
      },
      vitoriaCasa: {
        vencedor: stats1.taxaVitoriaCasa > stats2.taxaVitoriaCasa ? liga1 : liga2,
        diferenca: `${Math.abs(stats1.taxaVitoriaCasa - stats2.taxaVitoriaCasa).toFixed(1)}%`,
      },
      ambosMarquem: {
        vencedor: stats1.taxaAmbosMarquem > stats2.taxaAmbosMarquem ? liga1 : liga2,
        diferenca: `${Math.abs(stats1.taxaAmbosMarquem - stats2.taxaAmbosMarquem).toFixed(1)}%`,
      },
    };

    observe("leagues_compared", 1);
    return { liga1: stats1, liga2: stats2, comparacao };
  } catch (error) {
    console.error("[league-analytics] Erro ao comparar ligas:", error);
    throw error;
  }
}
