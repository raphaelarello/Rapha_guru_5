export interface BacktestResult {
  totalPicks: number;
  winRate: number;
  roi: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export function runBacktest(picks: any[]): BacktestResult {
  if (picks.length === 0) {
    return {
      totalPicks: 0,
      winRate: 0,
      roi: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      bestTrade: 0,
      worstTrade: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
    };
  }

  const completedPicks = picks.filter((p: any) => p.result !== "PENDING");
  const total = completedPicks.length;
  const ganhos = completedPicks.filter((p: any) => p.result === "WIN").length;
  const perdidos = completedPicks.filter((p: any) => p.result === "LOSS").length;

  const winRate = total > 0 ? ganhos / total : 0;
  const roi = completedPicks.reduce((acc: number, p: any) => acc + (p.roi || 0), 0) / total;

  // Calcular Sharpe Ratio
  const returns = completedPicks.map((p: any) => p.roi || 0);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((acc, r) => acc + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

  // Max Drawdown
  let maxDrawdown = 0;
  let runningMax = 0;
  let cumulative = 0;
  for (const pick of completedPicks) {
    cumulative += pick.roi || 0;
    if (cumulative > runningMax) runningMax = cumulative;
    const drawdown = runningMax - cumulative;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Profit Factor
  const totalWins = completedPicks
    .filter((p: any) => p.result === "WIN")
    .reduce((acc: number, p: any) => acc + (p.roi || 0), 0);
  const totalLosses = Math.abs(
    completedPicks
      .filter((p: any) => p.result === "LOSS")
      .reduce((acc: number, p: any) => acc + (p.roi || 0), 0)
  );
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;

  // Avg Win/Loss
  const wins = completedPicks.filter((p: any) => p.result === "WIN").map((p: any) => p.roi || 0);
  const losses = completedPicks.filter((p: any) => p.result === "LOSS").map((p: any) => p.roi || 0);
  const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

  // Best/Worst Trade
  const bestTrade = Math.max(...returns, 0);
  const worstTrade = Math.min(...returns, 0);

  // Consecutive Wins/Losses
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currentWins = 0;
  let currentLosses = 0;

  for (const pick of completedPicks) {
    if (pick.result === "WIN") {
      currentWins++;
      currentLosses = 0;
      maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
    } else {
      currentLosses++;
      currentWins = 0;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
    }
  }

  return {
    totalPicks: total,
    winRate,
    roi,
    sharpeRatio,
    maxDrawdown,
    profitFactor,
    avgWin,
    avgLoss,
    bestTrade,
    worstTrade,
    consecutiveWins: maxConsecutiveWins,
    consecutiveLosses: maxConsecutiveLosses,
  };
}

export function compareBacktestPeriods(
  picks: any[],
  periodDays: number = 7
): Map<string, BacktestResult> {
  const results = new Map<string, BacktestResult>();
  const now = new Date();

  for (let i = 0; i < 4; i++) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (i + 1) * periodDays);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() - i * periodDays);

    const periodPicks = picks.filter((p: any) => {
      const pickDate = new Date(p.createdAt);
      return pickDate >= startDate && pickDate <= endDate;
    });

    const period = `${startDate.toLocaleDateString("pt-BR")} - ${endDate.toLocaleDateString("pt-BR")}`;
    results.set(period, runBacktest(periodPicks));
  }

  return results;
}
