import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp, AlertTriangle, Zap } from "lucide-react";

export default function DashboardAcuracia() {
  const { data: picks, isLoading } = trpc.picks.getPicksHistory.useQuery(
    {},
    { refetchInterval: 30_000 }
  );

  const analysis = useMemo(() => {
    if (!picks || picks.length === 0) {
      return {
        totalPicks: 0,
        winRate: 0,
        roiTotal: 0,
        edgeMedia: 0,
        evMedia: 0,
        goldPicksAccuracy: 0,
        bestMarket: "N/A",
        worstMarket: "N/A",
        consecutiveWins: 0,
        consecutiveLosses: 0,
        profitByMarket: {},
      };
    }

    const ganhos = picks.filter((p) => p.result === "WIN").length;
    const winRate = (ganhos / picks.length) * 100;
    const roiTotal = picks.reduce((sum, p) => sum + (p.roi || 0), 0);
    const edgeMedia = picks.reduce((sum, p) => sum + (p.edge || 0), 0) / picks.length;
    const evMedia = picks.reduce((sum, p) => sum + (p.ev || 0), 0) / picks.length;

    // Gold Picks accuracy
    const goldPicks = picks.filter((p) => (p.edge || 0) > 0.1);
    const goldWins = goldPicks.filter((p) => p.result === "WIN").length;
    const goldPicksAccuracy = goldPicks.length > 0 ? (goldWins / goldPicks.length) * 100 : 0;

    // Best/Worst market
    const profitByMarket: Record<string, number> = {};
    picks.forEach((p) => {
      if (!profitByMarket[p.market]) profitByMarket[p.market] = 0;
      profitByMarket[p.market] += p.roi || 0;
    });

    const bestMarket = Object.entries(profitByMarket).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";
    const worstMarket = Object.entries(profitByMarket).sort(([, a], [, b]) => a - b)[0]?.[0] || "N/A";

    // Consecutive wins/losses
    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;

    picks.forEach((p) => {
      if (p.result === "WIN") {
        consecutiveWins++;
        consecutiveLosses = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
      } else if (p.result === "LOSS") {
        consecutiveLosses++;
        consecutiveWins = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
      }
    });

    return {
      totalPicks: picks.length,
      winRate,
      roiTotal,
      edgeMedia,
      evMedia,
      goldPicksAccuracy,
      bestMarket,
      worstMarket,
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses,
      profitByMarket,
    };
  }, [picks]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard de Acurácia</h1>
        <p className="text-gray-400">Análise profunda da performance do seu modelo de picks</p>
      </div>

      {/* Main Stats */}
      {!isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 bg-gradient-to-br from-blue-900 to-blue-800 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm mb-1">Total de Picks</p>
                  <p className="text-4xl font-bold text-white">{analysis.totalPicks}</p>
                </div>
                <TrendingUp size={32} className="text-blue-400 opacity-50" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-900 to-green-800 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm mb-1">Win Rate</p>
                  <p className="text-4xl font-bold text-green-400">{analysis.winRate.toFixed(1)}%</p>
                </div>
                <TrendingUp size={32} className="text-green-400 opacity-50" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm mb-1">ROI Total</p>
                  <p className={`text-4xl font-bold ${analysis.roiTotal >= 0 ? "text-yellow-400" : "text-red-400"}`}>
                    {(analysis.roiTotal * 100).toFixed(1)}%
                  </p>
                </div>
                <Zap size={32} className="text-yellow-400 opacity-50" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-900 to-purple-800 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm mb-1">Gold Picks Accuracy</p>
                  <p className="text-4xl font-bold text-purple-400">{analysis.goldPicksAccuracy.toFixed(1)}%</p>
                </div>
                <AlertTriangle size={32} className="text-purple-400 opacity-50" />
              </div>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <p className="text-gray-400 text-sm mb-2">Edge Médio</p>
              <p className="text-3xl font-bold text-blue-400">{(analysis.edgeMedia * 100).toFixed(2)}%</p>
            </Card>

            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <p className="text-gray-400 text-sm mb-2">EV Médio</p>
              <p className="text-3xl font-bold text-green-400">{(analysis.evMedia * 100).toFixed(2)}%</p>
            </Card>

            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <p className="text-gray-400 text-sm mb-2">Melhor Sequência</p>
              <p className="text-3xl font-bold text-yellow-400">{analysis.consecutiveWins} vitórias</p>
            </Card>
          </div>

          {/* Market Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-500/50">
              <h3 className="text-lg font-bold text-white mb-4">🏆 Melhor Mercado</h3>
              <p className="text-2xl font-bold text-green-400">{analysis.bestMarket}</p>
              <p className="text-sm text-gray-400 mt-2">
                ROI: {((analysis.profitByMarket[analysis.bestMarket] || 0) * 100).toFixed(2)}%
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-900/30 to-red-800/30 border-red-500/50">
              <h3 className="text-lg font-bold text-white mb-4">⚠️ Pior Mercado</h3>
              <p className="text-2xl font-bold text-red-400">{analysis.worstMarket}</p>
              <p className="text-sm text-gray-400 mt-2">
                ROI: {((analysis.profitByMarket[analysis.worstMarket] || 0) * 100).toFixed(2)}%
              </p>
            </Card>
          </div>

          {/* Insights */}
          <Card className="p-6 bg-gray-800/50 border-gray-700 space-y-3">
            <h3 className="text-lg font-bold text-white">📊 Insights</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>✓ Win Rate de {analysis.winRate.toFixed(1)}% indica {analysis.winRate > 50 ? "modelo lucrativo" : "modelo com desafios"}</li>
              <li>✓ Edge médio de {(analysis.edgeMedia * 100).toFixed(2)}% está {analysis.edgeMedia > 0.05 ? "acima" : "abaixo"} do esperado</li>
              <li>✓ Gold Picks com {analysis.goldPicksAccuracy.toFixed(1)}% de acurácia - {analysis.goldPicksAccuracy > 60 ? "excelente" : "precisa melhorar"}</li>
              <li>✓ Melhor sequência: {analysis.consecutiveWins} vitórias consecutivas</li>
            </ul>
          </Card>
        </>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-400">Carregando análise...</p>
        </div>
      )}
    </div>
  );
}
