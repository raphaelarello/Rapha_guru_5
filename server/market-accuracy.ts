export interface MarketStats {
  market: string;
  total: number;
  ganhos: number;
  perdidos: number;
  pendentes: number;
  winRate: number;
  roi: number;
  edgeMedian: number;
  evMedian: number;
}

export function calculateMarketAccuracy(picks: any[]): MarketStats[] {
  const marketMap = new Map<string, any[]>();

  // Agrupar picks por mercado
  for (const pick of picks) {
    const market = pick.market || "Desconhecido";
    if (!marketMap.has(market)) {
      marketMap.set(market, []);
    }
    marketMap.get(market)!.push(pick);
  }

  // Calcular stats por mercado
  const stats: MarketStats[] = [];

  for (const [market, marketPicks] of marketMap.entries()) {
    const total = marketPicks.length;
    const ganhos = marketPicks.filter((p: any) => p.result === "WIN").length;
    const perdidos = marketPicks.filter((p: any) => p.result === "LOSS").length;
    const pendentes = marketPicks.filter((p: any) => p.result === "PENDING").length;

    const winRate = total > 0 ? ganhos / total : 0;
    const roi = marketPicks.reduce((acc: number, p: any) => acc + (p.roi || 0), 0) / total;
    const edgeMedian = marketPicks.reduce((acc: number, p: any) => acc + (p.edge || 0), 0) / total;
    const evMedian = marketPicks.reduce((acc: number, p: any) => acc + (p.ev || 0), 0) / total;

    stats.push({
      market,
      total,
      ganhos,
      perdidos,
      pendentes,
      winRate,
      roi,
      edgeMedian,
      evMedian,
    });
  }

  // Ordenar por win rate descendente
  return stats.sort((a, b) => b.winRate - a.winRate);
}

export function getBestMarket(picks: any[]): MarketStats | null {
  const stats = calculateMarketAccuracy(picks);
  return stats.length > 0 ? stats[0] : null;
}

export function getWorstMarket(picks: any[]): MarketStats | null {
  const stats = calculateMarketAccuracy(picks);
  return stats.length > 0 ? stats[stats.length - 1] : null;
}
