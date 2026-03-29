/**
 * Kelly Criterion Calculator
 * Calcula o tamanho ótimo de aposta baseado em edge e odds
 * 
 * Fórmula: f* = (edge * odd - 1) / (odd - 1)
 * onde:
 * - f* é a fração ótima da banca
 * - edge é a vantagem em % (probabilidade modelo - probabilidade mercado)
 * - odd é a odd oferecida
 */

export interface KellyCalculation {
  edge: number; // % de edge (ex: 5.5)
  odd: number; // Odd oferecida (ex: 1.85)
  bankroll: number; // Banca total em R$
  kellyFraction: number; // Fração de Kelly (0.25 = 25% de Kelly)
  optimalStake: number; // Stake recomendado
  expectedValue: number; // EV esperado
  riskOfRuin: number; // Risco de falência (%)
  recommendations: string[];
}

/**
 * Calcula Kelly Criterion
 */
export function calculateKelly(
  modelProb: number, // 0-1 (ex: 0.55 = 55%)
  odd: number, // Odd oferecida (ex: 1.85)
  bankroll: number, // Banca total
  kellyFraction: number = 0.25 // Fração de Kelly (padrão 25%)
): KellyCalculation {
  // Validações
  if (modelProb <= 0 || modelProb >= 1) {
    throw new Error("Model probability deve estar entre 0 e 1");
  }
  if (odd <= 1) {
    throw new Error("Odd deve ser maior que 1");
  }
  if (bankroll <= 0) {
    throw new Error("Bankroll deve ser positivo");
  }
  if (kellyFraction <= 0 || kellyFraction > 1) {
    throw new Error("Kelly fraction deve estar entre 0 e 1");
  }

  // Calcular probabilidade do mercado (1/odd)
  const marketProb = 1 / odd;

  // Calcular edge em decimal (ex: 0.055 = 5.5%)
  const edgeDecimal = modelProb - marketProb;
  const edgePercent = edgeDecimal * 100;

  // Se edge é negativo, não apostar
  if (edgeDecimal <= 0) {
    return {
      edge: edgePercent,
      odd,
      bankroll,
      kellyFraction,
      optimalStake: 0,
      expectedValue: 0,
      riskOfRuin: 0,
      recommendations: ["Edge negativo. Não recomendado apostar."],
    };
  }

  // Fórmula de Kelly: f* = (edge * odd - 1) / (odd - 1)
  // Simplificada: f* = (p * b - q) / b
  // onde p = prob modelo, q = 1-p, b = odd - 1
  const fullKelly = (modelProb * (odd - 1) - (1 - modelProb)) / (odd - 1);

  // Aplicar fração de Kelly (ex: 25% de Kelly)
  const fractionalKelly = fullKelly * kellyFraction;

  // Calcular stake recomendado
  const optimalStake = Math.max(0, fractionalKelly * bankroll);

  // Calcular EV esperado
  const ev = modelProb * (odd - 1) - (1 - modelProb);
  const expectedValue = optimalStake * ev;

  // Calcular risco de falência (aproximado)
  // Usando fórmula simplificada: RoR ≈ e^(-2 * edge * odds * num_bets)
  // Para uma única aposta: RoR ≈ (1 - edge) / (1 + edge)
  const riskOfRuin = Math.max(0, Math.min(100, ((1 - edgeDecimal) / (1 + edgeDecimal)) * 100));

  // Gerar recomendações
  const recommendations: string[] = [];

  if (fullKelly > 0.5) {
    recommendations.push("⚠️ Kelly completo é muito agressivo (>50%). Use fração menor.");
  }

  if (edgePercent > 10) {
    recommendations.push("✅ Edge excelente (>10%). Considere aumentar a fração de Kelly.");
  } else if (edgePercent > 5) {
    recommendations.push("✅ Edge bom (5-10%). Stake recomendado é seguro.");
  } else if (edgePercent > 2) {
    recommendations.push("⚠️ Edge pequeno (<5%). Considere reduzir a fração de Kelly.");
  }

  if (riskOfRuin > 5) {
    recommendations.push(`⚠️ Risco de falência: ${riskOfRuin.toFixed(1)}%. Reduza o stake.`);
  }

  if (optimalStake > bankroll * 0.1) {
    recommendations.push("⚠️ Stake é >10% da banca. Considere reduzir para preservar capital.");
  }

  return {
    edge: edgePercent,
    odd,
    bankroll,
    kellyFraction,
    optimalStake: Math.round(optimalStake * 100) / 100, // Arredondar para 2 casas
    expectedValue: Math.round(expectedValue * 100) / 100,
    riskOfRuin: Math.round(riskOfRuin * 100) / 100,
    recommendations,
  };
}

/**
 * Calcular múltiplas apostas com Kelly
 */
export function calculateMultipleKelly(
  picks: Array<{
    modelProb: number;
    odd: number;
  }>,
  bankroll: number,
  kellyFraction: number = 0.25
): {
  picks: KellyCalculation[];
  totalStake: number;
  totalExpectedValue: number;
  totalRiskOfRuin: number;
} {
  const calculations = picks.map((pick) =>
    calculateKelly(pick.modelProb, pick.odd, bankroll, kellyFraction)
  );

  const totalStake = calculations.reduce((sum, calc) => sum + calc.optimalStake, 0);
  const totalExpectedValue = calculations.reduce((sum, calc) => sum + calc.expectedValue, 0);
  const totalRiskOfRuin = calculations.reduce((sum, calc) => sum + calc.riskOfRuin, 0) / calculations.length;

  return {
    picks: calculations,
    totalStake,
    totalExpectedValue,
    totalRiskOfRuin,
  };
}

/**
 * Calcular ROI esperado
 */
export function calculateExpectedROI(
  modelProb: number,
  odd: number,
  stake: number
): number {
  const marketProb = 1 / odd;
  const edge = modelProb - marketProb;
  const roi = (edge * odd - (1 - modelProb)) * 100;
  return Math.round(roi * 100) / 100;
}
