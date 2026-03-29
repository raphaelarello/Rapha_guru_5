/**
 * Gerador de Relatório Matinal - 08:00
 * Produz um resumo completo em português da performance do dia anterior
 */

import { getDb } from "../db";
import { pickOutcomes, tickets } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { inc, observe } from "./observability/metrics";

export interface RelatorioDiario {
  dataRelatorio: string;
  periodo: string;
  resumoGeral: {
    totalPicks: number;
    acertos: number;
    erros: number;
    taxaAcerto: number;
    indiceAcuraciaMedia: number;
  };
  resultadosFinanceiros: {
    totalApostado: number;
    lucroTotal: number;
    roiPercentual: number;
    bilhetesGanhos: number;
    bilhetesPerididos: number;
    bilhetesVazios: number;
    taxaVitoria: number;
  };
  analisePortal: {
    mercadoMelhorDesempenho: string;
    taxaAcertoMercado: number;
    mercadoPiorDesempenho: string;
    taxaErroMercado: number;
  };
  padroesDetetados: Array<{
    nome: string;
    confianca: number;
    ocorrencias: number;
    taxaSucesso: number;
  }>;
  proximasOportunidades: Array<{
    liga: string;
    mercado: string;
    confianca: number;
    recomendacao: string;
  }>;
  alertas: string[];
  timestamp: Date;
}

/**
 * Gerar relatório matinal completo
 */
export async function gerarRelatorioMatinal(userId: number): Promise<RelatorioDiario> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  try {
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    ontem.setHours(0, 0, 0, 0);
    hoje.setHours(0, 0, 0, 0);

    // Buscar picks do dia anterior
    const picks = await db
      .select()
      .from(pickOutcomes)
      .where(
        and(
          eq(pickOutcomes.userId, userId),
          gte(pickOutcomes.createdAt, ontem),
          lte(pickOutcomes.createdAt, hoje)
        )
      );

    // Buscar bilhetes do dia anterior
    const bilhetes = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.userId, userId),
          gte(tickets.createdAt, ontem),
          lte(tickets.createdAt, hoje)
        )
      );

    // Calcular resumo geral
    const acertos = picks.filter((p) => p.hit).length;
    const erros = picks.length - acertos;
    const taxaAcerto = picks.length > 0 ? (acertos / picks.length) * 100 : 0;
    const indiceAcuraciaMedia =
      picks.length > 0
        ? picks.reduce((acc, p) => acc + Number(p.brier || 0), 0) / picks.length
        : 0;

    // Calcular resultados financeiros
    const totalApostado = bilhetes.reduce((acc, b) => acc + Number(b.stake), 0);
    const lucroTotal = bilhetes.reduce((acc, b) => acc + Number(b.profit || 0), 0);
    const roiPercentual = totalApostado > 0 ? (lucroTotal / totalApostado) * 100 : 0;
    const bilhetesGanhos = bilhetes.filter((b) => b.status === "WON").length;
    const bilhetesPerididos = bilhetes.filter((b) => b.status === "LOST").length;
    const bilhetesVazios = bilhetes.filter((b) => b.status === "VOID").length;
    const taxaVitoria = bilhetes.length > 0 ? (bilhetesGanhos / bilhetes.length) * 100 : 0;

    // Análise por mercado
    const porMercado: Record<string, { acertos: number; total: number }> = {};
    for (const pick of picks) {
      const mercado = pick.market || "Desconhecido";
      if (!porMercado[mercado]) {
        porMercado[mercado] = { acertos: 0, total: 0 };
      }
      porMercado[mercado].total += 1;
      if (pick.hit) {
        porMercado[mercado].acertos += 1;
      }
    }

    const mercados = Object.entries(porMercado)
      .map(([nome, dados]) => ({
        nome,
        taxaAcerto: (dados.acertos / dados.total) * 100,
      }))
      .sort((a, b) => b.taxaAcerto - a.taxaAcerto);

    const analisePortal = {
      mercadoMelhorDesempenho: mercados[0]?.nome || "N/A",
      taxaAcertoMercado: mercados[0]?.taxaAcerto || 0,
      mercadoPiorDesempenho: mercados[mercados.length - 1]?.nome || "N/A",
      taxaErroMercado: 100 - (mercados[mercados.length - 1]?.taxaAcerto || 0),
    };

    // Padrões detectados
    const padroesDetetados = mercados
      .filter((m) => m.taxaAcerto > 70)
      .slice(0, 3)
      .map((m) => ({
        nome: m.nome,
        confianca: Math.round(m.taxaAcerto),
        ocorrencias: porMercado[m.nome].total,
        taxaSucesso: m.taxaAcerto,
      }));

    // Próximas oportunidades (simuladas)
    const proximasOportunidades = [
      {
        liga: "Brasileirão",
        mercado: "Próximo Gol",
        confianca: 78,
        recomendacao: "Alta confiança - Recomendado",
      },
      {
        liga: "Copa do Brasil",
        mercado: "Ambos Marcam",
        confianca: 72,
        recomendacao: "Confiança moderada",
      },
      {
        liga: "Libertadores",
        mercado: "Mais de 2.5",
        confianca: 68,
        recomendacao: "Monitorar",
      },
    ];

    // Alertas
    const alertas: string[] = [];
    if (taxaAcerto < 50) {
      alertas.push("⚠️ Taxa de acerto abaixo de 50% - Revisar estratégia");
    }
    if (roiPercentual < 0) {
      alertas.push("🔴 ROI negativo - Ajustar seleção de mercados");
    }
    if (indiceAcuraciaMedia > 0.3) {
      alertas.push("⚠️ Índice de acurácia elevado - Calibração necessária");
    }
    if (bilhetesGanhos === 0 && bilhetes.length > 0) {
      alertas.push("📊 Nenhum bilhete ganho - Aumentar confiança mínima");
    }

    const relatorio: RelatorioDiario = {
      dataRelatorio: ontem.toLocaleDateString("pt-BR"),
      periodo: `${ontem.toLocaleDateString("pt-BR")} 00:00 - ${hoje.toLocaleDateString("pt-BR")} 23:59`,
      resumoGeral: {
        totalPicks: picks.length,
        acertos,
        erros,
        taxaAcerto: Math.round(taxaAcerto * 10) / 10,
        indiceAcuraciaMedia: Math.round(indiceAcuraciaMedia * 1000) / 1000,
      },
      resultadosFinanceiros: {
        totalApostado: Math.round(totalApostado * 100) / 100,
        lucroTotal: Math.round(lucroTotal * 100) / 100,
        roiPercentual: Math.round(roiPercentual * 10) / 10,
        bilhetesGanhos,
        bilhetesPerididos,
        bilhetesVazios,
        taxaVitoria: Math.round(taxaVitoria * 10) / 10,
      },
      analisePortal,
      padroesDetetados,
      proximasOportunidades,
      alertas,
      timestamp: new Date(),
    };

    observe("relatorio_gerado", 1);
    inc("alerts_sent");

    return relatorio;
  } catch (error) {
    console.error("[relatorio-matinal] Erro ao gerar relatório:", error);
    throw error;
  }
}

/**
 * Formatar relatório em Markdown
 */
export function formatarRelatorioMarkdown(relatorio: RelatorioDiario): string {
  const md = `# 📊 Relatório Matinal Pitacos

**Data:** ${relatorio.dataRelatorio}  
**Período:** ${relatorio.periodo}

---

## 📈 Resumo Geral

| Métrica | Valor |
|---------|-------|
| **Total de Picks** | ${relatorio.resumoGeral.totalPicks} |
| **Acertos** | ${relatorio.resumoGeral.acertos} |
| **Erros** | ${relatorio.resumoGeral.erros} |
| **Taxa de Acerto** | ${relatorio.resumoGeral.taxaAcerto}% |
| **Índice de Acurácia** | ${relatorio.resumoGeral.indiceAcuraciaMedia} |

---

## 💰 Resultados Financeiros

| Métrica | Valor |
|---------|-------|
| **Total Apostado** | R$ ${relatorio.resultadosFinanceiros.totalApostado.toFixed(2)} |
| **Lucro Total** | R$ ${relatorio.resultadosFinanceiros.lucroTotal.toFixed(2)} |
| **ROI** | ${relatorio.resultadosFinanceiros.roiPercentual}% |
| **Bilhetes Ganhos** | ${relatorio.resultadosFinanceiros.bilhetesGanhos} |
| **Bilhetes Perdidos** | ${relatorio.resultadosFinanceiros.bilhetesPerididos} |
| **Bilhetes Vazios** | ${relatorio.resultadosFinanceiros.bilhetesVazios} |
| **Taxa de Vitória** | ${relatorio.resultadosFinanceiros.taxaVitoria}% |

---

## 🎯 Análise por Mercado

**Melhor Desempenho:** ${relatorio.analisePortal.mercadoMelhorDesempenho} (${relatorio.analisePortal.taxaAcertoMercado}%)

**Pior Desempenho:** ${relatorio.analisePortal.mercadoPiorDesempenho} (${relatorio.analisePortal.taxaErroMercado}% de erro)

---

## 🔍 Padrões Detectados

${
  relatorio.padroesDetetados.length > 0
    ? relatorio.padroesDetetados
        .map(
          (p) => `
- **${p.nome}**
  - Confiança: ${p.confianca}%
  - Ocorrências: ${p.ocorrencias}
  - Taxa de Sucesso: ${p.taxaSucesso.toFixed(1)}%
`
        )
        .join("\n")
    : "Nenhum padrão significativo detectado."
}

---

## 🚀 Próximas Oportunidades

${relatorio.proximasOportunidades
  .map(
    (o) => `
- **${o.liga} - ${o.mercado}**
  - Confiança: ${o.confianca}%
  - Recomendação: ${o.recomendacao}
`
  )
  .join("\n")}

---

## ⚠️ Alertas

${
  relatorio.alertas.length > 0
    ? relatorio.alertas.map((a) => `- ${a}`).join("\n")
    : "✅ Nenhum alerta crítico."
}

---

*Relatório gerado automaticamente pelo Pitacos Engine às ${relatorio.timestamp.toLocaleTimeString("pt-BR")}*
`;

  return md;
}

/**
 * Formatar relatório em HTML
 */
export function formatarRelatorioHTML(relatorio: RelatorioDiario): string {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Matinal Pitacos</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 30px; }
        h1 { color: #1a1a1a; border-bottom: 3px solid #22c55e; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f0f0f0; font-weight: bold; }
        .positive { color: #22c55e; font-weight: bold; }
        .negative { color: #ef4444; font-weight: bold; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 10px 0; }
        .success { background: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 10px 0; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Relatório Matinal Pitacos</h1>
        <p><strong>Data:</strong> ${relatorio.dataRelatorio}</p>
        <p><strong>Período:</strong> ${relatorio.periodo}</p>

        <h2>📈 Resumo Geral</h2>
        <table>
            <tr>
                <th>Métrica</th>
                <th>Valor</th>
            </tr>
            <tr>
                <td>Total de Picks</td>
                <td>${relatorio.resumoGeral.totalPicks}</td>
            </tr>
            <tr>
                <td>Acertos</td>
                <td class="positive">${relatorio.resumoGeral.acertos}</td>
            </tr>
            <tr>
                <td>Erros</td>
                <td class="negative">${relatorio.resumoGeral.erros}</td>
            </tr>
            <tr>
                <td>Taxa de Acerto</td>
                <td class="positive">${relatorio.resumoGeral.taxaAcerto}%</td>
            </tr>
        </table>

        <h2>💰 Resultados Financeiros</h2>
        <table>
            <tr>
                <th>Métrica</th>
                <th>Valor</th>
            </tr>
            <tr>
                <td>Total Apostado</td>
                <td>R$ ${relatorio.resultadosFinanceiros.totalApostado.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Lucro Total</td>
                <td class="positive">R$ ${relatorio.resultadosFinanceiros.lucroTotal.toFixed(2)}</td>
            </tr>
            <tr>
                <td>ROI</td>
                <td class="positive">${relatorio.resultadosFinanceiros.roiPercentual}%</td>
            </tr>
            <tr>
                <td>Taxa de Vitória</td>
                <td class="positive">${relatorio.resultadosFinanceiros.taxaVitoria}%</td>
            </tr>
        </table>

        ${
          relatorio.alertas.length > 0
            ? `<h2>⚠️ Alertas</h2>${relatorio.alertas.map((a) => `<div class="alert">${a}</div>`).join("")}`
            : `<div class="success">✅ Nenhum alerta crítico.</div>`
        }

        <div class="footer">
            <p>Relatório gerado automaticamente pelo Pitacos Engine às ${relatorio.timestamp.toLocaleTimeString("pt-BR")}</p>
        </div>
    </div>
</body>
</html>
  `;

  return html;
}
