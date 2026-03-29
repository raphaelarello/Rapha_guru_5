/**
 * Motor de Valor Esperado (EV+) e Matriz de Pesos Dinâmica - Pitacos Engine
 * Compara Projeções da IA com Odds Reais para encontrar lucro matemático
 * Ajusta pesos de análise por liga individualmente
 */

import { observe, inc } from "./observability/metrics";

export interface MatrizPesos {
  liga: string;
  pesoAtaquesPerigosos: number;
  pesoChutesGol: number;
  pesoPosseBola: number;
  pesoEscanteios: number;
  pesoHistoricoH2H: number;
  fatorTempo: number; // Peso maior para eventos recentes (ex: últimos 10 min)
}

export interface OportunidadeEV {
  fixtureId: number;
  liga: string;
  jogo: string;
  mercado: string;
  probabilidadeIA: number; // Ex: 80%
  oddCasa: number; // Ex: 1.50
  oddJusta: number; // 1 / (probabilidadeIA / 100) -> Ex: 1.25
  valorEsperado: number; // (Probabilidade * Odd) - 1 -> Ex: (0.8 * 1.5) - 1 = +0.20 (20%)
  status: "VALOR_MONSTRUOSO" | "VALOR_ALTO" | "VALOR_NEUTRO" | "SEM_VALOR";
  recomendacao: string;
}

/**
 * Matriz de Pesos Customizada por Liga (IA aprende e ajusta aqui)
 */
const MATRIZ_PESOS_LIGAS: Record<string, MatrizPesos> = {
  "Brasileirão Série A": {
    liga: "Brasileirão Série A",
    pesoAtaquesPerigosos: 0.65, // No Brasil, ataques perigosos convertem mais em gols
    pesoChutesGol: 1.8,
    pesoPosseBola: 0.3,
    pesoEscanteios: 1.2,
    pesoHistoricoH2H: 0.5,
    fatorTempo: 1.4
  },
  "Premier League": {
    liga: "Premier League",
    pesoAtaquesPerigosos: 0.45,
    pesoChutesGol: 2.2, // Na Inglaterra, chutes a gol são o driver principal
    pesoPosseBola: 0.6,
    pesoEscanteios: 1.5,
    pesoHistoricoH2H: 0.4,
    fatorTempo: 1.2
  },
  "La Liga": {
    liga: "La Liga",
    pesoAtaquesPerigosos: 0.5,
    pesoChutesGol: 1.9,
    pesoPosseBola: 0.8, // Na Espanha, posse de bola é mais correlacionada com vitória
    pesoEscanteios: 1.1,
    pesoHistoricoH2H: 0.6,
    fatorTempo: 1.1
  },
  "DEFAULT": {
    liga: "Geral",
    pesoAtaquesPerigosos: 0.5,
    pesoChutesGol: 2.0,
    pesoPosseBola: 0.5,
    pesoEscanteios: 1.3,
    pesoHistoricoH2H: 0.5,
    fatorTempo: 1.2
  }
};

/**
 * Calcular Valor Esperado (EV+) de uma oportunidade
 */
export function calcularEV(
  fixtureId: number,
  liga: string,
  jogo: string,
  mercado: string,
  probabilidadeIA: number,
  oddCasa: number
): OportunidadeEV {
  const oddJusta = 100 / probabilidadeIA;
  const valorEsperado = (probabilidadeIA / 100) * oddCasa - 1;

  let status: OportunidadeEV["status"] = "SEM_VALOR";
  if (valorEsperado > 0.15) status = "VALOR_MONSTRUOSO";
  else if (valorEsperado > 0.05) status = "VALOR_ALTO";
  else if (valorEsperado > 0) status = "VALOR_NEUTRO";

  const recomendacao = status === "VALOR_MONSTRUOSO" 
    ? `🔥 OPORTUNIDADE MONSTRUOSA! A IA projeta ${probabilidadeIA}% de chance, mas a casa está pagando odd ${oddCasa}. Lucro matemático de ${(valorEsperado * 100).toFixed(1)}%!`
    : status === "VALOR_ALTO"
    ? `✅ Valor detectado. Lucro esperado de ${(valorEsperado * 100).toFixed(1)}%.`
    : `❌ Sem valor matemático no momento.`;

  observe("ev_calculated", valorEsperado);
  if (status === "VALOR_MONSTRUOSO") inc("monstrous_value_found");

  return {
    fixtureId,
    liga,
    jogo,
    mercado,
    probabilidadeIA,
    oddCasa,
    oddJusta,
    valorEsperado,
    status,
    recomendacao
  };
}

/**
 * Obter Pesos Dinâmicos para uma Liga
 */
export function obterPesosLiga(liga: string): MatrizPesos {
  return MATRIZ_PESOS_LIGAS[liga] || MATRIZ_PESOS_LIGAS["DEFAULT"];
}

/**
 * Ajustar Pesos da Liga baseado em Acertos (IA Learning)
 */
export function ajustarPesosIA(liga: string, acerto: boolean, fatorErro: number): void {
  const pesos = obterPesosLiga(liga);
  
  if (!acerto) {
    // Se errou, reduz levemente o peso do fator que mais influenciou o erro
    pesos.pesoAtaquesPerigosos *= (1 - fatorErro * 0.01);
    pesos.pesoChutesGol *= (1 - fatorErro * 0.01);
    console.log(`[IA LEARNING] Ajustando pesos da liga ${liga} devido a erro de calibração.`);
  } else {
    // Se acertou com folga, reforça os pesos
    pesos.pesoChutesGol *= 1.005;
    console.log(`[IA LEARNING] Reforçando pesos da liga ${liga} após acerto de alta confiança.`);
  }
  
  observe("weights_adjusted", 1);
}
