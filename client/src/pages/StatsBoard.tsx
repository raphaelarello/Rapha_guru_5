import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, BarChart3, Download } from "lucide-react";
export const StatsBoard: React.FC = () => {
  const meQuery = trpc.auth.me.useQuery();
  const user = meQuery.data;
  const statsQuery = trpc.picks.getPicksStats.useQuery(undefined, { enabled: !!user });
  const historyQuery = trpc.picks.getPicksHistory.useQuery(undefined, { enabled: !!user });
  const exportMutation = trpc.picks.exportCSV.useMutation();

  const stats = useMemo(() => {
    if (!statsQuery.data) return null;
    return statsQuery.data;
  }, [statsQuery.data]);

  const handleExport = async () => {
    try {
      const result = await exportMutation.mutateAsync();
      // Trigger download
      const element = document.createElement("a");
      element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(result.csv));
      element.setAttribute("download", `picks_${new Date().toISOString().split('T')[0]}.csv`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error("Erro ao exportar:", err);
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Carregando estatísticas...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Dashboard de Estatísticas</h1>
        <Button onClick={handleExport} disabled={exportMutation.isPending} className="gap-2">
          <Download size={18} />
          {exportMutation.isPending ? "Exportando..." : "Exportar CSV"}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-900 to-blue-800 border-blue-500">
          <p className="text-gray-300 text-sm">Total de Picks</p>
          <p className="text-3xl font-bold text-white">{stats.totalPicks}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-900 to-green-800 border-green-500">
          <p className="text-gray-300 text-sm flex items-center gap-2">
            <TrendingUp size={16} /> Win Rate
          </p>
          <p className="text-3xl font-bold text-green-400">{(stats.winRate * 100).toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-1">{stats.wins}W / {stats.losses}L</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-900 to-purple-800 border-purple-500">
          <p className="text-gray-300 text-sm">ROI</p>
          <p className={`text-3xl font-bold ${stats.roi >= 0 ? "text-green-400" : "text-red-400"}`}>
            {(stats.roi * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">Retorno sobre investimento</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-900 to-orange-800 border-orange-500">
          <p className="text-gray-300 text-sm">Edge Médio</p>
          <p className="text-3xl font-bold text-orange-400">{(stats.avgEdge * 100).toFixed(2)}%</p>
          <p className="text-xs text-gray-400 mt-1">Vantagem estatística</p>
        </Card>
      </div>

      {/* Distribuição de Resultados */}
      <Card className="p-6 border-blue-500/30">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 size={20} /> Distribuição de Resultados
        </h2>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">Vencedores</span>
              <span className="text-green-400 font-semibold">{stats.wins}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(stats.wins / stats.totalPicks) * 100}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">Perdedores</span>
              <span className="text-red-400 font-semibold">{stats.losses}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(stats.losses / stats.totalPicks) * 100}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">Pendentes</span>
              <span className="text-yellow-400 font-semibold">{stats.pending}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(stats.pending / stats.totalPicks) * 100}%` }} />
            </div>
          </div>
        </div>
      </Card>

      {/* Histórico de Picks */}
      <Card className="p-6 border-blue-500/30">
        <h2 className="text-xl font-bold text-white mb-4">Histórico de Picks</h2>
        {historyQuery.data && historyQuery.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400">Time</th>
                  <th className="text-left p-2 text-gray-400">Mercado</th>
                  <th className="text-left p-2 text-gray-400">Edge</th>
                  <th className="text-left p-2 text-gray-400">EV</th>
                  <th className="text-left p-2 text-gray-400">Odd</th>
                  <th className="text-left p-2 text-gray-400">Resultado</th>
                  <th className="text-left p-2 text-gray-400">ROI</th>
                </tr>
              </thead>
              <tbody>
                {historyQuery.data.slice(0, 10).map((pick, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-900/50">
                    <td className="p-2 text-white">{pick.homeTeam} vs {pick.awayTeam}</td>
                    <td className="p-2 text-gray-300">{pick.market}</td>
                    <td className="p-2 text-orange-400">{((pick.edge ?? 0) * 100).toFixed(1)}%</td>
                    <td className="p-2 text-blue-400">{((pick.ev ?? 0) * 100).toFixed(1)}%</td>
                    <td className="p-2 text-green-400">{pick.odd.toFixed(2)}</td>
                    <td className="p-2">
                      {pick.result === "WIN" && <span className="text-green-400 font-bold">✓ Ganho</span>}
                      {pick.result === "LOSS" && <span className="text-red-400 font-bold">✗ Perdido</span>}
                      {pick.result === "PENDING" && <span className="text-yellow-400">⏳ Pendente</span>}
                    </td>
                    <td className={`p-2 font-bold ${(pick.roi ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {((pick.roi ?? 0) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">Nenhum pick salvo ainda</p>
        )}
      </Card>
    </div>
  );
};

export default StatsBoard;
