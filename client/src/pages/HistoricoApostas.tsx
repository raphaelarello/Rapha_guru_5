import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Download } from "lucide-react";

export default function HistoricoApostas() {
  const { data: picks, isLoading } = trpc.picks.getPicksHistory.useQuery(
    {},
    { refetchInterval: 30_000 }
  );

  const stats = useMemo(() => {
    if (!picks || picks.length === 0) {
      return {
        total: 0,
        ganhos: 0,
        perdidos: 0,
        winRate: 0,
        roi: 0,
        edgeMedia: 0,
        evMedia: 0,
        oddMedia: 0,
        kellyMedia: 0,
      };
    }

    const ganhos = picks.filter((p) => p.result === "WIN").length;
    const perdidos = picks.filter((p) => p.result === "LOSS").length;
    const winRate = (ganhos / picks.length) * 100;
    const roi = picks.reduce((sum, p) => sum + (p.roi || 0), 0) / picks.length;
    const edgeMedia = picks.reduce((sum, p) => sum + (p.edge || 0), 0) / picks.length;
    const evMedia = picks.reduce((sum, p) => sum + (p.ev || 0), 0) / picks.length;
    const oddMedia = picks.reduce((sum, p) => sum + (p.odd || 0), 0) / picks.length;
    const kellyMedia = picks.reduce((sum, p) => sum + (p.kellyPercentage || 0), 0) / picks.length;

    return {
      total: picks.length,
      ganhos,
      perdidos,
      winRate,
      roi,
      edgeMedia,
      evMedia,
      oddMedia,
      kellyMedia,
    };
  }, [picks]);

  const handleExportCSV = () => {
    if (!picks || picks.length === 0) return;

    const headers = [
      "Data",
      "Jogo",
      "Mercado",
      "Seleção",
      "Edge",
      "EV",
      "Odd",
      "Kelly",
      "Stake",
      "Resultado",
      "ROI",
    ];

    const rows = picks.map((p) => [
      new Date(p.createdAt).toLocaleDateString("pt-BR"),
      `${p.homeTeam} vs ${p.awayTeam}`,
      p.market,
      p.selection,
      `${(p.edge * 100).toFixed(2)}%`,
      `${(p.ev * 100).toFixed(2)}%`,
      p.odd.toFixed(2),
      `${(p.kellyPercentage * 100).toFixed(2)}%`,
      `R$ ${p.recommendedStake?.toFixed(2) || "0.00"}`,
      p.result || "PENDENTE",
      `${(p.roi * 100).toFixed(2)}%`,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-apostas-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Histórico de Apostas</h1>
        <p className="text-gray-400">Análise completa de performance dos seus picks</p>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-900 to-blue-800 border-blue-500">
            <p className="text-gray-300 text-sm">Total de Picks</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-900 to-green-800 border-green-500">
            <p className="text-gray-300 text-sm">Ganhos</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-green-400">{stats.ganhos}</p>
              <TrendingUp size={20} className="text-green-400" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-red-900 to-red-800 border-red-500">
            <p className="text-gray-300 text-sm">Perdidos</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-red-400">{stats.perdidos}</p>
              <TrendingDown size={20} className="text-red-400" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-900 to-purple-800 border-purple-500">
            <p className="text-gray-300 text-sm">Win Rate</p>
            <p className="text-3xl font-bold text-purple-400">{stats.winRate.toFixed(1)}%</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-500">
            <p className="text-gray-300 text-sm">ROI Médio</p>
            <p className={`text-3xl font-bold ${stats.roi >= 0 ? "text-yellow-400" : "text-red-400"}`}>
              {(stats.roi * 100).toFixed(2)}%
            </p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-cyan-900 to-cyan-800 border-cyan-500">
            <p className="text-gray-300 text-sm">Edge Médio</p>
            <p className="text-3xl font-bold text-cyan-400">{(stats.edgeMedia * 100).toFixed(2)}%</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-pink-900 to-pink-800 border-pink-500">
            <p className="text-gray-300 text-sm">EV Médio</p>
            <p className="text-3xl font-bold text-pink-400">{(stats.evMedia * 100).toFixed(2)}%</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-900 to-orange-800 border-orange-500">
            <p className="text-gray-300 text-sm">Odd Médio</p>
            <p className="text-3xl font-bold text-orange-400">{stats.oddMedia.toFixed(2)}</p>
          </Card>
        </div>
      )}

      {/* Export Button */}
      <Button
        onClick={handleExportCSV}
        className="w-full bg-green-600 hover:bg-green-700 gap-2"
      >
        <Download size={20} />
        Exportar para CSV
      </Button>

      {/* Picks Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-400">Carregando histórico...</p>
        </div>
      ) : picks && picks.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Jogo</th>
                <th className="px-4 py-3 text-left">Mercado</th>
                <th className="px-4 py-3 text-center">Edge</th>
                <th className="px-4 py-3 text-center">EV</th>
                <th className="px-4 py-3 text-center">Odd</th>
                <th className="px-4 py-3 text-center">Kelly</th>
                <th className="px-4 py-3 text-center">Resultado</th>
                <th className="px-4 py-3 text-center">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {picks.map((pick, idx) => (
                <tr key={idx} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    {new Date(pick.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    {pick.homeTeam} vs {pick.awayTeam}
                  </td>
                  <td className="px-4 py-3">{pick.market}</td>
                  <td className="px-4 py-3 text-center text-blue-400">
                    {(pick.edge * 100).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-center text-green-400">
                    {(pick.ev * 100).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-center">{pick.odd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center text-yellow-400">
                    {(pick.kellyPercentage * 100).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        pick.result === "WIN"
                          ? "bg-green-900 text-green-400"
                          : pick.result === "LOSS"
                          ? "bg-red-900 text-red-400"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {pick.result || "PENDENTE"}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-center font-semibold ${
                      (pick.roi || 0) >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {((pick.roi || 0) * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Nenhum pick salvo ainda</p>
        </div>
      )}
    </div>
  );
}
