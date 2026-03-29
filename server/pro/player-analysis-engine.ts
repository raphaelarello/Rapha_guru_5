/**
 * Motor de Análise de Jogadores - Pitacos Engine
 * Identifica jogadores quentes (gols) e indisciplinados (cartões)
 */

import { observe, inc } from "./observability/metrics";

export interface JogadorQuente {
  id: number;
  nome: string;
  time: string;
  liga: string;
  posicao: string;
  golsUltimos5Jogos: number;
  golsTemporada: number;
  mediaGolsPorJogo: number;
  probabilidadeGol: number;
  confianca: number;
  status: "🔥 MUITO QUENTE" | "🌡️ QUENTE" | "❄️ FRIO";
  tendencia: "↑ CRESCENTE" | "→ ESTÁVEL" | "↓ DECRESCENTE";
  ultimosResultados: Array<{ data: string; gols: number; minuto?: number }>;
  timestamp: Date;
}

export interface JogadorIndisciplinado {
  id: number;
  nome: string;
  time: string;
  liga: string;
  posicao: string;
  cartoesUltimos5Jogos: number;
  cartoesTemporada: number;
  mediaCartoesPorJogo: number;
  probabilidadeCartao: number;
  confianca: number;
  status: "🔴 MUITO INDISCIPLINADO" | "🟡 INDISCIPLINADO" | "🟢 DISCIPLINADO";
  tendencia: "↑ PIORANDO" | "→ ESTÁVEL" | "↓ MELHORANDO";
  ultimosResultados: Array<{ data: string; cartoes: number; minuto?: number }>;
  timestamp: Date;
}

export interface AnaliseDuranteJogo {
  fixtureId: number;
  minutoAtual: number;
  jogadoresQuentes: JogadorQuente[];
  jogadoresIndisciplinados: JogadorIndisciplinado[];
  timeComMaisPressao: string;
  timeComMaisCartoes: string;
  jogadorMaisQuente: JogadorQuente | null;
  jogadorMaisIndisciplinado: JogadorIndisciplinado | null;
}

/**
 * Analisar jogadores quentes (maior chance de gol)
 */
export async function analisarJogadoresQuentes(
  liga: string,
  timeId: number,
  ultimosJogos: Array<{ data: string; gols: number; minuto?: number }> = []
): Promise<JogadorQuente[]> {
  try {
    // TODO: Integrar com banco de dados real da API-Football
    // Por enquanto, retornar dados simulados

    const jogadoresSimulados: JogadorQuente[] = [
      {
        id: 1,
        nome: "Vinícius Júnior",
        time: "Real Madrid",
        liga: "La Liga",
        posicao: "Ala",
        golsUltimos5Jogos: 4,
        golsTemporada: 18,
        mediaGolsPorJogo: 0.45,
        probabilidadeGol: 82,
        confianca: 88,
        status: "🔥 MUITO QUENTE",
        tendencia: "↑ CRESCENTE",
        ultimosResultados: [
          { data: "2024-03-20", gols: 1, minuto: 35 },
          { data: "2024-03-15", gols: 1, minuto: 67 },
          { data: "2024-03-10", gols: 1, minuto: 42 },
          { data: "2024-03-05", gols: 1, minuto: 78 },
          { data: "2024-02-28", gols: 0 },
        ],
        timestamp: new Date(),
      },
      {
        id: 2,
        nome: "Neymar",
        time: "Al-Hilal",
        liga: "Saudi Pro League",
        posicao: "Ala",
        golsUltimos5Jogos: 3,
        golsTemporada: 14,
        mediaGolsPorJogo: 0.35,
        probabilidadeGol: 75,
        confianca: 82,
        status: "🌡️ QUENTE",
        tendencia: "→ ESTÁVEL",
        ultimosResultados: [
          { data: "2024-03-20", gols: 1, minuto: 28 },
          { data: "2024-03-15", gols: 0 },
          { data: "2024-03-10", gols: 1, minuto: 55 },
          { data: "2024-03-05", gols: 1, minuto: 71 },
          { data: "2024-02-28", gols: 0 },
        ],
        timestamp: new Date(),
      },
      {
        id: 3,
        nome: "Mbappé",
        time: "Paris Saint-Germain",
        liga: "Ligue 1",
        posicao: "Atacante",
        golsUltimos5Jogos: 5,
        golsTemporada: 22,
        mediaGolsPorJogo: 0.55,
        probabilidadeGol: 88,
        confianca: 92,
        status: "🔥 MUITO QUENTE",
        tendencia: "↑ CRESCENTE",
        ultimosResultados: [
          { data: "2024-03-20", gols: 2, minuto: 18 },
          { data: "2024-03-15", gols: 1, minuto: 45 },
          { data: "2024-03-10", gols: 1, minuto: 62 },
          { data: "2024-03-05", gols: 1, minuto: 81 },
          { data: "2024-02-28", gols: 0 },
        ],
        timestamp: new Date(),
      },
    ];

    observe("players_analyzed", jogadoresSimulados.length);
    inc("analysis_total");

    return jogadoresSimulados;
  } catch (error) {
    console.error("[player-analysis] Erro ao analisar jogadores quentes:", error);
    throw error;
  }
}

/**
 * Analisar jogadores indisciplinados (maior chance de cartão)
 */
export async function analisarJogadoresIndisciplinados(
  liga: string,
  timeId: number,
  ultimosJogos: Array<{ data: string; cartoes: number; minuto?: number }> = []
): Promise<JogadorIndisciplinado[]> {
  try {
    // TODO: Integrar com banco de dados real da API-Football

    const jogadoresSimulados: JogadorIndisciplinado[] = [
      {
        id: 101,
        nome: "Sergio Ramos",
        time: "Sevilla",
        liga: "La Liga",
        posicao: "Zagueiro",
        cartoesUltimos5Jogos: 2,
        cartoesTemporada: 8,
        mediaCartoesPorJogo: 0.2,
        probabilidadeCartao: 72,
        confianca: 85,
        status: "🔴 MUITO INDISCIPLINADO",
        tendencia: "↑ PIORANDO",
        ultimosResultados: [
          { data: "2024-03-20", cartoes: 1, minuto: 67 },
          { data: "2024-03-15", cartoes: 0 },
          { data: "2024-03-10", cartoes: 1, minuto: 42 },
          { data: "2024-03-05", cartoes: 0 },
          { data: "2024-02-28", cartoes: 0 },
        ],
        timestamp: new Date(),
      },
      {
        id: 102,
        nome: "Pepe",
        time: "Porto",
        liga: "Primeira Liga",
        posicao: "Zagueiro",
        cartoesUltimos5Jogos: 1,
        cartoesTemporada: 6,
        mediaCartoesPorJogo: 0.15,
        probabilidadeCartao: 65,
        confianca: 78,
        status: "🟡 INDISCIPLINADO",
        tendencia: "→ ESTÁVEL",
        ultimosResultados: [
          { data: "2024-03-20", cartoes: 0 },
          { data: "2024-03-15", cartoes: 1, minuto: 55 },
          { data: "2024-03-10", cartoes: 0 },
          { data: "2024-03-05", cartoes: 0 },
          { data: "2024-02-28", cartoes: 0 },
        ],
        timestamp: new Date(),
      },
      {
        id: 103,
        nome: "Neymar",
        time: "Al-Hilal",
        liga: "Saudi Pro League",
        posicao: "Ala",
        cartoesUltimos5Jogos: 2,
        cartoesTemporada: 7,
        mediaCartoesPorJogo: 0.175,
        probabilidadeCartao: 68,
        confianca: 82,
        status: "🟡 INDISCIPLINADO",
        tendencia: "↑ PIORANDO",
        ultimosResultados: [
          { data: "2024-03-20", cartoes: 1, minuto: 38 },
          { data: "2024-03-15", cartoes: 0 },
          { data: "2024-03-10", cartoes: 1, minuto: 71 },
          { data: "2024-03-05", cartoes: 0 },
          { data: "2024-02-28", cartoes: 0 },
        ],
        timestamp: new Date(),
      },
    ];

    observe("indisciplined_players_analyzed", jogadoresSimulados.length);
    inc("analysis_total");

    return jogadoresSimulados;
  } catch (error) {
    console.error("[player-analysis] Erro ao analisar jogadores indisciplinados:", error);
    throw error;
  }
}

/**
 * Analisar jogadores durante o jogo (realtime)
 */
export async function analisarJogadoresDuranteJogo(
  fixtureId: number,
  minutoAtual: number,
  time1: string,
  time2: string
): Promise<AnaliseDuranteJogo> {
  try {
    const jogadoresQuentes = await analisarJogadoresQuentes("Liga", 1);
    const jogadoresIndisciplinados = await analisarJogadoresIndisciplinados("Liga", 1);

    // Filtrar apenas jogadores dos times em jogo
    const jogadoresQuentes_Filtrados = jogadoresQuentes.filter(
      (j) => j.time === time1 || j.time === time2
    );
    const jogadoresIndisciplinados_Filtrados = jogadoresIndisciplinados.filter(
      (j) => j.time === time1 || j.time === time2
    );

    // Encontrar o mais quente e mais indisciplinado
    const jogadorMaisQuente = jogadoresQuentes_Filtrados.length > 0
      ? jogadoresQuentes_Filtrados.reduce((a, b) => 
          a.probabilidadeGol > b.probabilidadeGol ? a : b
        )
      : null;

    const jogadorMaisIndisciplinado = jogadoresIndisciplinados_Filtrados.length > 0
      ? jogadoresIndisciplinados_Filtrados.reduce((a, b) =>
          a.probabilidadeCartao > b.probabilidadeCartao ? a : b
        )
      : null;

    observe("realtime_analysis", 1);

    return {
      fixtureId,
      minutoAtual,
      jogadoresQuentes: jogadoresQuentes_Filtrados,
      jogadoresIndisciplinados: jogadoresIndisciplinados_Filtrados,
      timeComMaisPressao: minutoAtual > 60 ? time1 : time2,
      timeComMaisCartoes: jogadorMaisIndisciplinado?.time || time1,
      jogadorMaisQuente,
      jogadorMaisIndisciplinado,
    };
  } catch (error) {
    console.error("[player-analysis] Erro ao analisar jogo:", error);
    throw error;
  }
}

/**
 * Calcular probabilidade de gol de um jogador
 */
export function calcularProbabilidadeGol(jogador: JogadorQuente): number {
  const mediaGols = jogador.mediaGolsPorJogo;
  const tendencia = jogador.tendencia === "↑ CRESCENTE" ? 1.2 : jogador.tendencia === "↓ DECRESCENTE" ? 0.8 : 1.0;
  const status = jogador.status === "🔥 MUITO QUENTE" ? 1.3 : jogador.status === "🌡️ QUENTE" ? 1.1 : 0.7;

  return Math.min(100, (mediaGols * 100 * tendencia * status));
}

/**
 * Calcular probabilidade de cartão de um jogador
 */
export function calcularProbabilidadeCartao(jogador: JogadorIndisciplinado): number {
  const mediaCartoes = jogador.mediaCartoesPorJogo;
  const tendencia = jogador.tendencia === "↑ PIORANDO" ? 1.2 : jogador.tendencia === "↓ MELHORANDO" ? 0.8 : 1.0;
  const status = jogador.status === "🔴 MUITO INDISCIPLINADO" ? 1.3 : jogador.status === "🟡 INDISCIPLINADO" ? 1.1 : 0.5;

  return Math.min(100, (mediaCartoes * 100 * tendencia * status));
}

/**
 * Gerar recomendação de aposta em jogador
 */
export function gerarRecomendacaoJogador(jogador: JogadorQuente | JogadorIndisciplinado, tipo: "gol" | "cartao"): string {
  if (tipo === "gol") {
    const j = jogador as JogadorQuente;
    if (j.probabilidadeGol > 80) {
      return `🔥 ${j.nome} está MUITO QUENTE! ${j.probabilidadeGol}% de chance de gol. Recomendado!`;
    } else if (j.probabilidadeGol > 60) {
      return `🌡️ ${j.nome} está quente. ${j.probabilidadeGol}% de chance de gol.`;
    } else {
      return `❄️ ${j.nome} está frio. Apenas ${j.probabilidadeGol}% de chance.`;
    }
  } else {
    const j = jogador as JogadorIndisciplinado;
    if (j.probabilidadeCartao > 75) {
      return `🔴 ${j.nome} está MUITO INDISCIPLINADO! ${j.probabilidadeCartao}% de chance de cartão.`;
    } else if (j.probabilidadeCartao > 60) {
      return `🟡 ${j.nome} está indisciplinado. ${j.probabilidadeCartao}% de chance de cartão.`;
    } else {
      return `🟢 ${j.nome} está disciplinado. Apenas ${j.probabilidadeCartao}% de chance.`;
    }
  }
}
