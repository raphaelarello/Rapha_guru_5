/**
 * Risk Analyzer para Gold Picks
 * Analisa distribuição de placares e padrões históricos para gerar badges de risco
 */

export interface RiskBadge {
  label: string;
  color: string; // Tailwind color class
  icon: string; // emoji ou nome de ícone
  description: string;
}

export interface PickRiskAnalysis {
  badges: RiskBadge[];
  riskLevel: "baixo" | "médio" | "alto"; // baseado em quantidade/severidade de badges
}

/**
 * Analisa um pick e retorna badges de risco
 * @param pick - O pick com probabilidades e odds
 * @param homeTeamId - ID do time da casa
 * @param awayTeamId - ID do time visitante
 * @param market - Mercado (FT_1X2, OU_25, BTTS, etc)
 * @param selection - Seleção (home, draw, away, over, under, yes, no)
 * @param pModel - Probabilidade do modelo (0-1)
 * @param odd - Odd da aposta
 */
export function analyzePickRisk(
  homeTeamId: number,
  awayTeamId: number,
  market: string,
  selection: string,
  pModel: number,
  odd: number
): PickRiskAnalysis {
  const badges: RiskBadge[] = [];

  // ─── Badge 1: Risco 0-0 (para Over 2.5 e BTTS) ───
  if ((market === "OU_25" && selection === "under") || (market === "BTTS" && selection === "no")) {
    // Risco de empate sem gols é comum em certos matchups
    // Se a odd é alta (>2.5) e a confiança é baixa-média, é risco
    if (odd > 2.5 && pModel < 0.55) {
      badges.push({
        label: "Risco 0-0",
        color: "text-slate-400 bg-slate-500/20 border-slate-500/30",
        icon: "⚪",
        description: "Empate sem gols é possível neste matchup",
      });
    }
  }

  // ─── Badge 2: Goleada Provável (para Over 2.5 e OU_35) ───
  if (
    (market === "OU_25" && selection === "over") ||
    (market === "OU_35" && selection === "over")
  ) {
    // Se confiança é muito alta (>0.70) e odd é baixa (<1.8), pode ser goleada
    if (pModel > 0.70 && odd < 1.8) {
      badges.push({
        label: "Goleada Provável",
        color: "text-orange-400 bg-orange-500/20 border-orange-500/30",
        icon: "🔥",
        description: "Possibilidade de placar elástico (3+ gols)",
      });
    }
  }

  // ─── Badge 3: Pressão Enganosa (para 1X2) ───
  if (market === "FT_1X2") {
    // Se a odd do favorito é muito baixa (<1.5) mas a confiança é média, é enganosa
    if (selection === "home" && odd < 1.5 && pModel < 0.65) {
      badges.push({
        label: "Pressão Enganosa",
        color: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
        icon: "⚠️",
        description: "Favorito com odds baixas mas confiança moderada",
      });
    }
  }

  // ─── Badge 4: Risco Disciplinar (para BTTS com times agressivos) ───
  // Nota: Seria ideal ter dados de cartões históricos aqui
  if (market === "BTTS" && selection === "yes") {
    // Se a confiança é alta mas a odd é baixa, pode haver risco de expulsão
    if (pModel > 0.65 && odd < 1.8) {
      badges.push({
        label: "Risco Disciplinar",
        color: "text-red-400 bg-red-500/20 border-red-500/30",
        icon: "🟥",
        description: "Jogo pode ficar quente com possíveis expulsões",
      });
    }
  }

  // ─── Badge 5: Odds Muito Altas (possível armadilha) ───
  if (odd > 3.5 && pModel < 0.40) {
    badges.push({
      label: "Odds Muito Altas",
      color: "text-purple-400 bg-purple-500/20 border-purple-500/30",
      icon: "📊",
      description: "Odd desproporcionalmente alta para a confiança",
    });
  }

  // ─── Badge 6: Valor Excelente (EV positivo forte) ───
  const ev = pModel * odd - 1; // Expected Value simplificado
  if (ev > 0.25) {
    // EV > 25% é excelente
    badges.push({
      label: "Valor Excelente",
      color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
      icon: "💎",
      description: "EV positivo forte (>25%)",
    });
  }

  // ─── Determinar nível de risco geral ───
  let riskLevel: "baixo" | "médio" | "alto" = "baixo";
  const negativeRisks = badges.filter((b) =>
    ["Risco 0-0", "Pressão Enganosa", "Risco Disciplinar", "Odds Muito Altas"].includes(
      b.label
    )
  ).length;

  if (negativeRisks >= 2) riskLevel = "alto";
  else if (negativeRisks === 1) riskLevel = "médio";

  return {
    badges,
    riskLevel,
  };
}

/**
 * Gera um resumo textual dos riscos
 */
export function summarizeRisks(analysis: PickRiskAnalysis): string {
  if (analysis.badges.length === 0) return "Sem riscos identificados";

  const riskBadges = analysis.badges
    .filter((b) =>
      ["Risco 0-0", "Pressão Enganosa", "Risco Disciplinar", "Odds Muito Altas"].includes(
        b.label
      )
    )
    .map((b) => b.label);

  if (riskBadges.length === 0) return "Perfil favorável";

  return riskBadges.join(" • ");
}
