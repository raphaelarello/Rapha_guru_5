/**
 * Motor de Backtesting - Análise Histórica de Padrões
 * Identifica ligas, horários e mercados com melhor desempenho histórico
 */

import { getDb } from "../db";
import { pickOutcomes, matchFeatureSnapshots } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { observe, inc } from "./observability/metrics";

export interface AnalisePadraoHistorico {
  liga: string;
  mercado: string;
  horario: string; // "MANHA" | "TARDE" | "NOITE" | "MADRUGADA"
  diasSemana: string[]; // ["SEG", "TER", "QUA", etc]
  totalOcorrencias: number;
  acertos: number;
  erros: number;
  taxaAcerto: number;
  indiceAcuraciaMedia: number;
  oddMedia: number;
  evMedio: number;
  confiancaRecomendada: number;
  tendencia: "CRESCENTE" | "ESTAVEL" | "DECRESCENTE";
  ultimosResultados: Array<{ data: string; resultado: boolean; odd: number }>;
}

export interface RelatorioBacktesting {
  periodo: { inicio: string; fim: string };
  totalPicksAnalisados: number;
  padroesMaisLucrativos: AnalisePadraoHistorico[];
  padroesMenosLucrativos: AnalisePadraoHistorico[];
  ligas: Array<{
    nome: string;
    totalPicks: number;
    taxaAcerto: number;
    lucroTotal: number;
  }>;
  mercados: Array<{
    nome: string;
    totalPicks: number;
    taxaAcerto: number;
    indiceAcuracia: number;
  }>;
  horarios: Array<{
    horario: string;
    totalPicks: number;
    taxaAcerto: number;
    lucroTotal: number;
  }>;
  recomendacoes: string[];
  timestamp: Date;
}

/**
 * Analisar padrões históricos dos últimos 30 dias
 */
export async function analisarPadroesHistoricos(
  userId: number,
  diasRetro: number = 30
): Promise<RelatorioBacktesting> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  try {
    const dataFim = new Date();
    const dataInicio = new Date(dataFim);
    dataInicio.setDate(dataInicio.getDate() - diasRetro);

    // Buscar todos os picks do período
    const picks = await db
      .select()
      .from(pickOutcomes)
      .where(
        and(
          eq(pickOutcomes.userId, userId),
          gte(pickOutcomes.createdAt, dataInicio),
          lte(pickOutcomes.createdAt, dataFim)
        )
      );

    if (picks.length === 0) {
      return {
        periodo: {
          inicio: dataInicio.toLocaleDateString("pt-BR"),
          fim: dataFim.toLocaleDateString("pt-BR"),
        },
        totalPicksAnalisados: 0,
        padroesMaisLucrativos: [],
        padroesMenosLucrativos: [],
        ligas: [],
        mercados: [],
        horarios: [],
        recomendacoes: ["Dados insuficientes para análise. Aguarde mais picks."],
        timestamp: new Date(),
      };
    }

    // Agrupar por liga + mercado + horário
    const padroes: Record<string, AnalisePadraoHistorico> = {};

    for (const pick of picks) {
      const chave = `${pick.league || "DESCONHECIDA"}|${pick.market || "DESCONHECIDO"}|${extrairHorario(pick.createdAt)}`;

      if (!padroes[chave]) {
        padroes[chave] = {
          liga: pick.league || "DESCONHECIDA",
          mercado: pick.market || "DESCONHECIDO",
          horario: extrairHorario(pick.createdAt),
          diasSemana: [],
          totalOcorrencias: 0,
          acertos: 0,
          erros: 0,
          taxaAcerto: 0,
          indiceAcuraciaMedia: 0,
          oddMedia: 0,
          evMedio: 0,
          confiancaRecomendada: 0,
          tendencia: "ESTAVEL",
          ultimosResultados: [],
        };
      }

      padroes[chave].totalOcorrencias += 1;
      if (pick.hit) {
        padroes[chave].acertos += 1;
      } else {
        padroes[chave].erros += 1;
      }

      padroes[chave].indiceAcuraciaMedia += Number(pick.brier || 0);
      padroes[chave].oddMedia += Number(pick.odd || 1);

      const diaSemana = obterDiaSemana(pick.createdAt);
      if (!padroes[chave].diasSemana.includes(diaSemana)) {
        padroes[chave].diasSemana.push(diaSemana);
      }

      padroes[chave].ultimosResultados.push({
        data: pick.createdAt.toLocaleDateString("pt-BR"),
        resultado: pick.hit || false,
        odd: Number(pick.odd || 1),
      });
    }

    // Calcular métricas finais
    for (const chave of Object.keys(padroes)) {
      const padrao = padroes[chave];
      padrao.taxaAcerto = (padrao.acertos / padrao.totalOcorrencias) * 100;
      padrao.indiceAcuraciaMedia = padrao.indiceAcuraciaMedia / padrao.totalOcorrencias;
      padrao.oddMedia = padrao.oddMedia / padrao.totalOcorrencias;
      padrao.evMedio = (padrao.taxaAcerto / 100) * padrao.oddMedia - 1;
      padrao.confiancaRecomendada = Math.min(
        95,
        Math.round(padrao.taxaAcerto + 10)
      );

      // Detectar tendência (últimos 7 vs anteriores)
      const ultimosResultados = padrao.ultimosResultados.slice(-7);
      const anterioresResultados = padrao.ultimosResultados.slice(0, -7);

      if (ultimosResultados.length > 0 && anterioresResultados.length > 0) {
        const taxaUltimos =
          (ultimosResultados.filter((r) => r.resultado).length /
            ultimosResultados.length) *
          100;
        const taxaAnteriores =
          (anterioresResultados.filter((r) => r.resultado).length /
            anterioresResultados.length) *
          100;

        if (taxaUltimos > taxaAnteriores + 10) {
          padrao.tendencia = "CRESCENTE";
        } else if (taxaUltimos < taxaAnteriores - 10) {
          padrao.tendencia = "DECRESCENTE";
        }
      }

      // Manter apenas os últimos 10 resultados
      padrao.ultimosResultados = padrao.ultimosResultados.slice(-10);
    }

    // Ordenar por taxa de acerto
    const padroesPorAcerto = Object.values(padroes)
      .filter((p) => p.totalOcorrencias >= 3) // Mínimo 3 ocorrências
      .sort((a, b) => b.taxaAcerto - a.taxaAcerto);

    // Análise por liga
    const porLiga: Record<string, any> = {};
    for (const pick of picks) {
      const liga = pick.league || "DESCONHECIDA";
      if (!porLiga[liga]) {
        porLiga[liga] = { totalPicks: 0, acertos: 0, lucro: 0 };
      }
      porLiga[liga].totalPicks += 1;
      if (pick.hit) porLiga[liga].acertos += 1;
      porLiga[liga].lucro += Number(pick.profit || 0);
    }

    const ligas = Object.entries(porLiga)
      .map(([nome, dados]: any) => ({
        nome,
        totalPicks: dados.totalPicks,
        taxaAcerto: (dados.acertos / dados.totalPicks) * 100,
        lucroTotal: dados.lucro,
      }))
      .sort((a, b) => b.lucroTotal - a.lucroTotal);

    // Análise por mercado
    const porMercado: Record<string, any> = {};
    for (const pick of picks) {
      const mercado = pick.market || "DESCONHECIDO";
      if (!porMercado[mercado]) {
        porMercado[mercado] = { totalPicks: 0, acertos: 0, brierScores: [] };
      }
      porMercado[mercado].totalPicks += 1;
      if (pick.hit) porMercado[mercado].acertos += 1;
      porMercado[mercado].brierScores.push(Number(pick.brier || 0));
    }

    const mercados = Object.entries(porMercado)
      .map(([nome, dados]: any) => ({
        nome,
        totalPicks: dados.totalPicks,
        taxaAcerto: (dados.acertos / dados.totalPicks) * 100,
        indiceAcuracia:
          dados.brierScores.reduce((a: number, b: number) => a + b, 0) /
          dados.brierScores.length,
      }))
      .sort((a, b) => b.taxaAcerto - a.taxaAcerto);

    // Análise por horário
    const porHorario: Record<string, any> = {};
    for (const pick of picks) {
      const horario = extrairHorario(pick.createdAt);
      if (!porHorario[horario]) {
        porHorario[horario] = { totalPicks: 0, acertos: 0, lucro: 0 };
      }
      porHorario[horario].totalPicks += 1;
      if (pick.hit) porHorario[horario].acertos += 1;
      porHorario[horario].lucro += Number(pick.profit || 0);
    }

    const horarios = Object.entries(porHorario)
      .map(([horario, dados]: any) => ({
        horario,
        totalPicks: dados.totalPicks,
        taxaAcerto: (dados.acertos / dados.totalPicks) * 100,
        lucroTotal: dados.lucro,
      }))
      .sort((a, b) => b.lucroTotal - a.lucroTotal);

    // Gerar recomendações
    const recomendacoes = gerarRecomendacoes(
      padroesPorAcerto,
      ligas,
      mercados,
      horarios
    );

    observe("backtesting_realizado", picks.length);
    inc("reports_generated");

    const relatorio: RelatorioBacktesting = {
      periodo: {
        inicio: dataInicio.toLocaleDateString("pt-BR"),
        fim: dataFim.toLocaleDateString("pt-BR"),
      },
      totalPicksAnalisados: picks.length,
      padroesMaisLucrativos: padroesPorAcerto.slice(0, 5),
      padroesMenosLucrativos: padroesPorAcerto.slice(-5).reverse(),
      ligas,
      mercados,
      horarios,
      recomendacoes,
      timestamp: new Date(),
    };

    return relatorio;
  } catch (error) {
    console.error("[backtesting-engine] Erro ao analisar padrões:", error);
    throw error;
  }
}

/**
 * Extrair horário do dia
 */
function extrairHorario(data: Date): string {
  const hora = data.getHours();
  if (hora >= 6 && hora < 12) return "MANHA";
  if (hora >= 12 && hora < 18) return "TARDE";
  if (hora >= 18 && hora < 24) return "NOITE";
  return "MADRUGADA";
}

/**
 * Obter dia da semana
 */
function obterDiaSemana(data: Date): string {
  const dias = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
  return dias[data.getDay()];
}

/**
 * Gerar recomendações baseadas na análise
 */
function gerarRecomendacoes(
  padroes: AnalisePadraoHistorico[],
  ligas: any[],
  mercados: any[],
  horarios: any[]
): string[] {
  const recomendacoes: string[] = [];

  // Recomendação 1: Melhor padrão
  if (padroes.length > 0 && padroes[0].taxaAcerto > 70) {
    recomendacoes.push(
      `🎯 Foco em ${padroes[0].liga} - ${padroes[0].mercado} (${padroes[0].taxaAcerto.toFixed(1)}% de acerto)`
    );
  }

  // Recomendação 2: Melhor liga
  if (ligas.length > 0 && ligas[0].taxaAcerto > 60) {
    recomendacoes.push(
      `⚽ A liga ${ligas[0].nome} tem ${ligas[0].taxaAcerto.toFixed(1)}% de acerto - Priorize!`
    );
  }

  // Recomendação 3: Melhor mercado
  if (mercados.length > 0 && mercados[0].indiceAcuracia < 0.25) {
    recomendacoes.push(
      `📊 Mercado ${mercados[0].nome} tem excelente calibração (${mercados[0].indiceAcuracia.toFixed(3)}) - Aumente confiança`
    );
  }

  // Recomendação 4: Melhor horário
  if (horarios.length > 0 && horarios[0].lucroTotal > 0) {
    recomendacoes.push(
      `⏰ Horário ${horarios[0].horario} é mais lucrativo - Concentre análise neste período`
    );
  }

  // Recomendação 5: Evitar padrão fraco
  if (padroes.length > 0) {
    const piorPadrao = padroes[padroes.length - 1];
    if (piorPadrao.taxaAcerto < 40) {
      recomendacoes.push(
        `⚠️ Evite ${piorPadrao.liga} - ${piorPadrao.mercado} (apenas ${piorPadrao.taxaAcerto.toFixed(1)}% de acerto)`
      );
    }
  }

  if (recomendacoes.length === 0) {
    recomendacoes.push("📈 Dados em fase de coleta - Mais análises em breve");
  }

  return recomendacoes;
}

/**
 * Calcular Critério de Kelly para gestão de banca
 */
export function calcularKelly(
  probabilidadeVitoria: number,
  odd: number,
  bancaTotal: number
): { percentualBanca: number; valorAposta: number; recomendacao: string } {
  // Kelly = (bp - q) / b
  // onde: b = odd - 1, p = probabilidade, q = 1 - p

  const b = odd - 1;
  const p = probabilidadeVitoria / 100;
  const q = 1 - p;

  let kelly = (b * p - q) / b;

  // Limitar Kelly entre 0 e 25% (Kelly fracionado para segurança)
  kelly = Math.max(0, Math.min(0.25, kelly));

  const percentualBanca = kelly * 100;
  const valorAposta = bancaTotal * kelly;

  let recomendacao = "";
  if (kelly === 0) {
    recomendacao = "❌ Não aposte - EV negativo";
  } else if (kelly < 0.01) {
    recomendacao = "⚠️ Aposta muito pequena - Considere passar";
  } else if (kelly < 0.05) {
    recomendacao = "📊 Aposta conservadora - Bom para iniciantes";
  } else if (kelly < 0.1) {
    recomendacao = "✅ Aposta moderada - Recomendado";
  } else {
    recomendacao = "🚀 Aposta agressiva - Para traders experientes";
  }

  return {
    percentualBanca: Math.round(percentualBanca * 100) / 100,
    valorAposta: Math.round(valorAposta * 100) / 100,
    recomendacao,
  };
}
