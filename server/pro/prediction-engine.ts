/**
 * Motor de IA Preditivo - Pitacos Engine
 * Projeções de Gols, Escanteios, Cartões com IA
 * Análise histórica + realtime
 */

import { observe, inc } from "./observability/metrics";

export interface ProjecaoJogo {
  fixtureId: number;
  liga: string;
  time1: string;
  time2: string;
  minutoAtual: number;
  status: string;

  // Projeções de Gols
  golsProjetados1T: { min: number; max: number; probabilidade: number };
  golsProjetados2T: { min: number; max: number; probabilidade: number };
  golsProjetadosTotais: { min: number; max: number; probabilidade: number };

  // Projeções de Escanteios
  escanteiosProjetados1T: { min: number; max: number; probabilidade: number };
  escanteiosProjetados2T: { min: number; max: number; probabilidade: number };
  escanteiosProjetadosTotais: { min: number; max: number; probabilidade: number };

  // Projeções de Cartões
  cartoesProjetados1T: { min: number; max: number; probabilidade: number };
  cartoesProjetados2T: { min: number; max: number; probabilidade: number };
  cartoesProjetadosTotais: { min: number; max: number; probabilidade: number };

  // Análises Especiais
  probabilidadeAmbosMarquem: number;
  probabilidadeGoleada: number;
  probabilidadeVirada: number;
  probabilidadeVitoria1: number;
  probabilidadeVitoria2: number;
  probabilidadeEmpate: number;

  // Confiança Geral
  confiancaGeral: number;
  risco: "BAIXO" | "MÉDIO" | "ALTO";
  recomendacao: string;

  // Timestamp
  timestamp: Date;
}

export interface EstatisticasLiga {
  liga: string;
  mediaGolsPorJogo: number;
  mediaEscanteiosPorJogo: number;
  mediaCartoesPorJogo: number;
  taxaVitoriaCasa: number;
  taxaVitoriaVisitante: number;
  taxaAmbosMarquem: number;
  totalJogos: number;
}

export interface JogadorQuente {
  id: number;
  nome: string;
  time: string;
  liga: string;
  golsUltimos5Jogos: number;
  golsTemporada: number;
  probabilidadeGol: number;
  confianca: number;
  status: "QUENTE" | "NORMAL" | "FRIO";
}

export interface JogadorIndisciplinado {
  id: number;
  nome: string;
  time: string;
  liga: string;
  cartoesUltimos5Jogos: number;
  cartoesTemporada: number;
  probabilidadeCartao: number;
  confianca: number;
  status: "INDISCIPLINADO" | "NORMAL" | "DISCIPLINADO";
}

/**
 * Calcular projeção completa de um jogo
 */
export async function calcularProjecaoJogo(
  fixtureId: number,
  liga: string,
  time1: string,
  time2: string,
  minutoAtual: number,
  status: string,
  estatisticasAtuais: {
    golsCasa: number;
    golsFora: number;
    escanteiosCasa: number;
    escanteiosFora: number;
    cartoesCasa: number;
    cartoesFora: number;
    posseCasa: number;
    chutesGolCasa: number;
    chutesGolFora: number;
  }
): Promise<ProjecaoJogo> {
  try {
    // Estatísticas históricas (simuladas - integrar com DB real)
    const statsLiga = await obterEstatisticasLiga(liga);

    // Calcular progressão do jogo
    const progressaoJogo = minutoAtual / 90;
    const minutosRestantes = Math.max(0, 90 - minutoAtual);

    // ─── PROJEÇÕES DE GOLS ──────────────────────────────────────
    const golsProjetados1T = calcularProjecaoGols1T(
      minutoAtual,
      estatisticasAtuais.golsCasa,
      estatisticasAtuais.golsFora,
      statsLiga.mediaGolsPorJogo,
      estatisticasAtuais.chutesGolCasa,
      estatisticasAtuais.chutesGolFora
    );

    const golsProjetados2T = calcularProjecaoGols2T(
      minutoAtual,
      statsLiga.mediaGolsPorJogo,
      estatisticasAtuais.posseCasa
    );

    const golsProjetadosTotais = {
      min: Math.ceil(golsProjetados1T.min + golsProjetados2T.min),
      max: Math.ceil(golsProjetados1T.max + golsProjetados2T.max),
      probabilidade:
        (golsProjetados1T.probabilidade + golsProjetados2T.probabilidade) / 2,
    };

    // ─── PROJEÇÕES DE ESCANTEIOS ────────────────────────────────
    const escanteiosProjetados1T = calcularProjecaoEscanteios1T(
      minutoAtual,
      estatisticasAtuais.escanteiosCasa,
      estatisticasAtuais.escanteiosFora,
      statsLiga.mediaEscanteiosPorJogo
    );

    const escanteiosProjetados2T = calcularProjecaoEscanteios2T(
      minutoAtual,
      statsLiga.mediaEscanteiosPorJogo,
      estatisticasAtuais.posseCasa
    );

    const escanteiosProjetadosTotais = {
      min: Math.ceil(escanteiosProjetados1T.min + escanteiosProjetados2T.min),
      max: Math.ceil(escanteiosProjetados1T.max + escanteiosProjetados2T.max),
      probabilidade:
        (escanteiosProjetados1T.probabilidade + escanteiosProjetados2T.probabilidade) / 2,
    };

    // ─── PROJEÇÕES DE CARTÕES ───────────────────────────────────
    const cartoesProjetados1T = calcularProjecaoCartoes1T(
      minutoAtual,
      estatisticasAtuais.cartoesCasa,
      estatisticasAtuais.cartoesFora,
      statsLiga.mediaCartoesPorJogo
    );

    const cartoesProjetados2T = calcularProjecaoCartoes2T(
      minutoAtual,
      statsLiga.mediaCartoesPorJogo
    );

    const cartoesProjetadosTotais = {
      min: Math.ceil(cartoesProjetados1T.min + cartoesProjetados2T.min),
      max: Math.ceil(cartoesProjetados1T.max + cartoesProjetados2T.max),
      probabilidade:
        (cartoesProjetados1T.probabilidade + cartoesProjetados2T.probabilidade) / 2,
    };

    // ─── ANÁLISES ESPECIAIS ─────────────────────────────────────
    const probabilidadeAmbosMarquem = calcularProbabilidadeAmbosMarquem(
      golsProjetadosTotais.probabilidade,
      statsLiga.taxaAmbosMarquem
    );

    const probabilidadeGoleada = calcularProbabilidadeGoleada(
      golsProjetadosTotais.max,
      golsProjetadosTotais.probabilidade
    );

    const probabilidadeVirada = calcularProbabilidadeVirada(
      minutoAtual,
      estatisticasAtuais.golsCasa,
      estatisticasAtuais.golsFora,
      estatisticasAtuais.posseCasa,
      golsProjetados2T.probabilidade
    );

    const { probabilidadeVitoria1, probabilidadeVitoria2, probabilidadeEmpate } =
      calcularProbabilidadesResultado(
        golsProjetadosTotais.probabilidade,
        statsLiga.taxaVitoriaCasa,
        statsLiga.taxaVitoriaVisitante
      );

    // ─── CONFIANÇA GERAL ────────────────────────────────────────
    const confiancaGeral = calcularConfiancaGeral(
      golsProjetados1T.probabilidade,
      escanteiosProjetados1T.probabilidade,
      cartoesProjetados1T.probabilidade,
      minutoAtual,
      status
    );

    const risco = confiancaGeral > 75 ? "BAIXO" : confiancaGeral > 50 ? "MÉDIO" : "ALTO";

    const recomendacao = gerarRecomendacao(
      golsProjetadosTotais,
      escanteiosProjetadosTotais,
      cartoesProjetadosTotais,
      confiancaGeral,
      risco
    );

    observe("projection_calculated", 1);
    inc("projections_total");

    return {
      fixtureId,
      liga,
      time1,
      time2,
      minutoAtual,
      status,
      golsProjetados1T,
      golsProjetados2T,
      golsProjetadosTotais,
      escanteiosProjetados1T,
      escanteiosProjetados2T,
      escanteiosProjetadosTotais,
      cartoesProjetados1T,
      cartoesProjetados2T,
      cartoesProjetadosTotais,
      probabilidadeAmbosMarquem,
      probabilidadeGoleada,
      probabilidadeVirada,
      probabilidadeVitoria1,
      probabilidadeVitoria2,
      probabilidadeEmpate,
      confiancaGeral,
      risco,
      recomendacao,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("[prediction-engine] Erro ao calcular projeção:", error);
    throw error;
  }
}

/**
 * Projeção de Gols - 1º Tempo
 */
function calcularProjecaoGols1T(
  minutoAtual: number,
  golsCasa: number,
  golsFora: number,
  mediaGolsLiga: number,
  chutesGolCasa: number,
  chutesGolFora: number
): { min: number; max: number; probabilidade: number } {
  if (minutoAtual < 45) {
    // 1º tempo em andamento
    const progressao = minutoAtual / 45;
    const ritmoGols = (golsCasa + golsFora) / Math.max(1, progressao);
    const probabilidade = Math.min(100, (ritmoGols / mediaGolsLiga) * 100);

    return {
      min: Math.floor(ritmoGols * 0.8),
      max: Math.ceil(ritmoGols * 1.2),
      probabilidade,
    };
  } else {
    // 1º tempo encerrado - retornar valor real
    return {
      min: golsCasa + golsFora,
      max: golsCasa + golsFora,
      probabilidade: 100,
    };
  }
}

/**
 * Projeção de Gols - 2º Tempo
 */
function calcularProjecaoGols2T(
  minutoAtual: number,
  mediaGolsLiga: number,
  posseCasa: number
): { min: number; max: number; probabilidade: number } {
  if (minutoAtual >= 45) {
    // 2º tempo em andamento
    const progressao2T = Math.max(0, minutoAtual - 45) / 45;
    const ritmoGols2T = (mediaGolsLiga * 0.6) / Math.max(0.1, progressao2T);
    const influenciaPosseCasa = (posseCasa / 100) * 0.3;
    const probabilidade = Math.min(100, (ritmoGols2T / mediaGolsLiga) * 100 + influenciaPosseCasa * 100);

    return {
      min: Math.floor(ritmoGols2T * 0.7),
      max: Math.ceil(ritmoGols2T * 1.3),
      probabilidade,
    };
  } else {
    // 2º tempo ainda não começou
    return {
      min: Math.floor(mediaGolsLiga * 0.4),
      max: Math.ceil(mediaGolsLiga * 0.8),
      probabilidade: 60,
    };
  }
}

/**
 * Projeção de Escanteios - 1º Tempo
 */
function calcularProjecaoEscanteios1T(
  minutoAtual: number,
  escanteiosCasa: number,
  escanteiosFora: number,
  mediaEscanteiosLiga: number
): { min: number; max: number; probabilidade: number } {
  if (minutoAtual < 45) {
    const progressao = minutoAtual / 45;
    const ritmoEscanteios = (escanteiosCasa + escanteiosFora) / Math.max(0.1, progressao);
    const probabilidade = Math.min(100, (ritmoEscanteios / mediaEscanteiosLiga) * 100);

    return {
      min: Math.floor(ritmoEscanteios * 0.8),
      max: Math.ceil(ritmoEscanteios * 1.2),
      probabilidade,
    };
  } else {
    return {
      min: escanteiosCasa + escanteiosFora,
      max: escanteiosCasa + escanteiosFora,
      probabilidade: 100,
    };
  }
}

/**
 * Projeção de Escanteios - 2º Tempo
 */
function calcularProjecaoEscanteios2T(
  minutoAtual: number,
  mediaEscanteiosLiga: number,
  posseCasa: number
): { min: number; max: number; probabilidade: number } {
  if (minutoAtual >= 45) {
    const progressao2T = Math.max(0, minutoAtual - 45) / 45;
    const ritmoEscanteios2T = (mediaEscanteiosLiga * 0.5) / Math.max(0.1, progressao2T);
    const influenciaPosseCasa = (posseCasa / 100) * 0.2;
    const probabilidade = Math.min(100, (ritmoEscanteios2T / mediaEscanteiosLiga) * 100 + influenciaPosseCasa * 100);

    return {
      min: Math.floor(ritmoEscanteios2T * 0.7),
      max: Math.ceil(ritmoEscanteios2T * 1.3),
      probabilidade,
    };
  } else {
    return {
      min: Math.floor(mediaEscanteiosLiga * 0.3),
      max: Math.ceil(mediaEscanteiosLiga * 0.7),
      probabilidade: 55,
    };
  }
}

/**
 * Projeção de Cartões - 1º Tempo
 */
function calcularProjecaoCartoes1T(
  minutoAtual: number,
  cartoesCasa: number,
  cartoesFora: number,
  mediaCartoesLiga: number
): { min: number; max: number; probabilidade: number } {
  if (minutoAtual < 45) {
    const progressao = minutoAtual / 45;
    const ritmoCartoes = (cartoesCasa + cartoesFora) / Math.max(0.1, progressao);
    const probabilidade = Math.min(100, (ritmoCartoes / mediaCartoesLiga) * 100);

    return {
      min: Math.floor(ritmoCartoes * 0.8),
      max: Math.ceil(ritmoCartoes * 1.2),
      probabilidade,
    };
  } else {
    return {
      min: cartoesCasa + cartoesFora,
      max: cartoesCasa + cartoesFora,
      probabilidade: 100,
    };
  }
}

/**
 * Projeção de Cartões - 2º Tempo
 */
function calcularProjecaoCartoes2T(
  minutoAtual: number,
  mediaCartoesLiga: number
): { min: number; max: number; probabilidade: number } {
  if (minutoAtual >= 45) {
    const progressao2T = Math.max(0, minutoAtual - 45) / 45;
    const ritmoCartoes2T = (mediaCartoesLiga * 0.7) / Math.max(0.1, progressao2T);
    const probabilidade = Math.min(100, (ritmoCartoes2T / mediaCartoesLiga) * 100);

    return {
      min: Math.floor(ritmoCartoes2T * 0.7),
      max: Math.ceil(ritmoCartoes2T * 1.3),
      probabilidade,
    };
  } else {
    return {
      min: Math.floor(mediaCartoesLiga * 0.4),
      max: Math.ceil(mediaCartoesLiga * 0.8),
      probabilidade: 60,
    };
  }
}

/**
 * Probabilidade de Ambos Marcarem
 */
function calcularProbabilidadeAmbosMarquem(
  probabilidadeGols: number,
  taxaAmbosMarquemLiga: number
): number {
  return Math.min(100, (probabilidadeGols * 0.7 + taxaAmbosMarquemLiga * 0.3));
}

/**
 * Probabilidade de Goleada (3+ gols de diferença)
 */
function calcularProbabilidadeGoleada(
  maxGols: number,
  probabilidadeGols: number
): number {
  if (maxGols >= 5) return Math.min(100, probabilidadeGols * 0.8);
  if (maxGols >= 4) return Math.min(100, probabilidadeGols * 0.6);
  if (maxGols >= 3) return Math.min(100, probabilidadeGols * 0.4);
  return Math.min(100, probabilidadeGols * 0.2);
}

/**
 * Probabilidade de Virada
 */
function calcularProbabilidadeVirada(
  minutoAtual: number,
  golsCasa: number,
  golsFora: number,
  posseCasa: number,
  probabilidadeGols2T: number
): number {
  const diferenca = Math.abs(golsCasa - golsFora);
  if (diferenca === 0) return 0; // Sem virada se empate
  if (diferenca > 2) return 0; // Muito difícil com diferença > 2

  const influenciaPosseCasa = (posseCasa / 100) * 50;
  const influenciaMinuto = (minutoAtual / 90) * 20;
  const influenciaGols = probabilidadeGols2T * 30;

  return Math.min(100, influenciaPosseCasa + influenciaMinuto + influenciaGols);
}

/**
 * Probabilidades de Resultado (1x2)
 */
function calcularProbabilidadesResultado(
  probabilidadeGols: number,
  taxaVitoriaCasa: number,
  taxaVitoriaVisitante: number
): { probabilidadeVitoria1: number; probabilidadeVitoria2: number; probabilidadeEmpate: number } {
  const vitoria1 = (taxaVitoriaCasa * 0.7 + probabilidadeGols * 0.3);
  const vitoria2 = (taxaVitoriaVisitante * 0.7 + (100 - probabilidadeGols) * 0.3);
  const empate = 100 - vitoria1 - vitoria2;

  return {
    probabilidadeVitoria1: Math.min(100, vitoria1),
    probabilidadeVitoria2: Math.min(100, vitoria2),
    probabilidadeEmpate: Math.max(0, empate),
  };
}

/**
 * Confiança Geral da Projeção
 */
function calcularConfiancaGeral(
  probGols: number,
  probEscanteios: number,
  probCartoes: number,
  minutoAtual: number,
  status: string
): number {
  const mediaProb = (probGols + probEscanteios + probCartoes) / 3;
  const fatorMinuto = minutoAtual > 60 ? 1.1 : minutoAtual > 30 ? 1.0 : 0.8;
  const fatorStatus = status === "LIVE" ? 1.2 : 0.9;

  return Math.min(100, mediaProb * fatorMinuto * fatorStatus);
}

/**
 * Gerar Recomendação
 */
function gerarRecomendacao(
  gols: any,
  escanteios: any,
  cartoes: any,
  confianca: number,
  risco: string
): string {
  let recomendacao = "🎯 ";

  if (gols.probabilidade > 80) {
    recomendacao += `Muita chance de ${gols.min}-${gols.max} gols. `;
  } else if (gols.probabilidade > 60) {
    recomendacao += `Chance moderada de ${gols.min}-${gols.max} gols. `;
  }

  if (escanteios.probabilidade > 75) {
    recomendacao += `${escanteios.min}-${escanteios.max} escanteios esperados. `;
  }

  if (cartoes.probabilidade > 70) {
    recomendacao += `Jogo com ${cartoes.min}-${cartoes.max} cartões. `;
  }

  recomendacao += `Confiança: ${confianca.toFixed(1)}% | Risco: ${risco}`;

  return recomendacao;
}

/**
 * Obter Estatísticas da Liga (simulado - integrar com DB)
 */
async function obterEstatisticasLiga(liga: string): Promise<EstatisticasLiga> {
  // TODO: Integrar com banco de dados real
  const statsDefault: Record<string, EstatisticasLiga> = {
    "Brasileirão": {
      liga: "Brasileirão",
      mediaGolsPorJogo: 2.8,
      mediaEscanteiosPorJogo: 9.2,
      mediaCartoesPorJogo: 4.1,
      taxaVitoriaCasa: 48,
      taxaVitoriaVisitante: 28,
      taxaAmbosMarquem: 62,
      totalJogos: 380,
    },
    "Premier League": {
      liga: "Premier League",
      mediaGolsPorJogo: 2.9,
      mediaEscanteiosPorJogo: 10.1,
      mediaCartoesPorJogo: 3.8,
      taxaVitoriaCasa: 52,
      taxaVitoriaVisitante: 25,
      taxaAmbosMarquem: 58,
      totalJogos: 380,
    },
    "La Liga": {
      liga: "La Liga",
      mediaGolsPorJogo: 2.6,
      mediaEscanteiosPorJogo: 8.9,
      mediaCartoesPorJogo: 3.5,
      taxaVitoriaCasa: 50,
      taxaVitoriaVisitante: 26,
      taxaAmbosMarquem: 55,
      totalJogos: 380,
    },
  };

  return statsDefault[liga] || statsDefault["Brasileirão"];
}
