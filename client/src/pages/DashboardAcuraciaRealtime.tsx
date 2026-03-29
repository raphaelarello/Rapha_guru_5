import React, { useMemo, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Download } from "lucide-react";

export default function DashboardAcuraciaRealtime() {
  const [stats, setStats] = useState<any>(null);

  // Fetch picks history com auto-refresh
  const query = trpc.picks.getPicksHistory.useQuery(
    {},
    {
      refetchInterval: 10_000, // Atualizar a cada 10s
      staleTime: 5_000,
    }
  );

  // Calcular stats em tempo real
  useEffect(() => {
    if (!query.data?.picks) return;

    const picks = query.data.picks;
    const total = picks.length;
    const ganhos = picks.filter((p: any) => p.result === "WIN").length;
    const perdidos = picks.filter((p: any) => p.result === "LOSS").length;
    const pendentes = picks.filter((p: any) => p.result === "PENDING").length;

    const winRate = total > 0 ? ((ganhos / total) * 100).toFixed(1) : "0.0";
    const roi = picks.reduce((acc: number, p: any) => acc + (p.roi || 0), 0).toFixed(2);
    const edgeMedian = picks.length > 0 
      ? (picks.reduce((acc: number, p: any) => acc + (p.edge || 0), 0) / picks.length * 100).toFixed(2)
      : "0.0";

    const goldPicks = picks.filter((p: any) => p.edge > 0.1).length;
    const avgOdd = picks.length > 0
      ? (picks.reduce((acc: number, p: any) => acc + (p.odd || 0), 0) / picks.length).toFixed(2)
      : "0.0";

    setStats({
      total,
      ganhos,
      perdidos,
      pendentes,
      winRate,
      roi,
      edgeMedian,
      goldPicks,
      avgOdd,
    });
  }, [query.data?.picks]);

  const handleExportCSV = () => {
    if (!query.data?.picks) return;

    const picks = query.data.picks;
    const headers = ["ID", "Fixture", "Mercado", "Seleção", "Edge", "EV", "Odd", "Resultado", "ROI", "Data"];
    const rows = picks.map((p: any) => [
      p.id || "",
      p.fixtureId || "",
      p.market || "",
      p.selection || "",
      (p.edge * 100).toFixed(2) + "%",
      (p.ev * 100).toFixed(2) + "%",
      p.odd?.toFixed(2) || "",
      p.result || "PENDING",
      (p.roi * 100).toFixed(2) + "%",
      new Date(p.createdAt).toLocaleDateString("pt-BR"),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `picks-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-400">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard de Acurácia</h1>
          <p className="text-gray-400 text-sm">Análise em tempo real dos seus picks</p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Download size={16} />
          Exportar CSV
        </Button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Picks */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Total de Picks</p>
          <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Todos os tempos</p>
        </Card>

        {/* Win Rate */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Taxa de Acerto</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-green-400">{stats?.winRate || "0"}%</p>
            <TrendingUp size={16} className="text-green-400" />
          </div>
          <p className="text-xs text-gray-500 mt-1">{stats?.ganhos || 0} ganhos</p>
        </Card>

        {/* ROI */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <p className="text-xs text-gray-400 mb-1">ROI Total</p>
          <p className={`text-2xl font-bold ${parseFloat(stats?.roi || "0") >= 0 ? "text-green-400" : "text-red-400"}`}>
            {stats?.roi || "0"}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Retorno sobre investimento</p>
        </Card>

        {/* Edge Médio */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Edge Médio</p>
          <p className="text-2xl font-bold text-blue-400">{stats?.edgeMedian || "0"}%</p>
          <p className="text-xs text-gray-500 mt-1">Vantagem média</p>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Gold Picks</p>
          <p className="text-2xl font-bold text-yellow-400">{stats?.goldPicks || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Edge &gt; 10%</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Odd Médio</p>
          <p className="text-2xl font-bold text-purple-400">{stats?.avgOdd || "0"}</p>
          <p className="text-xs text-gray-500 mt-1">Cotação média</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Perdidos</p>
          <p className="text-2xl font-bold text-red-400">{stats?.perdidos || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Picks perdidos</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-500">{stats?.pendentes || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Aguardando resultado</p>
        </Card>
      </div>

      {/* Tabela de Picks */}
      <Card className="p-4 bg-gray-800/50 border-gray-700 overflow-x-auto">
        <h2 className="text-lg font-bold text-white mb-3">Histórico de Picks</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 px-2 text-gray-400">Fixture</th>
              <th className="text-left py-2 px-2 text-gray-400">Mercado</th>
              <th className="text-right py-2 px-2 text-gray-400">Edge</th>
              <th className="text-right py-2 px-2 text-gray-400">EV</th>
              <th className="text-right py-2 px-2 text-gray-400">Odd</th>
              <th className="text-center py-2 px-2 text-gray-400">Resultado</th>
              <th className="text-right py-2 px-2 text-gray-400">ROI</th>
            </tr>
          </thead>
          <tbody>
            {query.data?.picks?.slice(0, 10).map((pick: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/30">
                <td className="py-2 px-2 text-white text-xs">{pick.fixtureId}</td>
                <td className="py-2 px-2 text-gray-300 text-xs">{pick.market}</td>
                <td className="py-2 px-2 text-right text-blue-400 text-xs">{(pick.edge * 100).toFixed(2)}%</td>
                <td className="py-2 px-2 text-right text-green-400 text-xs">{(pick.ev * 100).toFixed(2)}%</td>
                <td className="py-2 px-2 text-right text-purple-400 text-xs">{pick.odd?.toFixed(2)}</td>
                <td className="py-2 px-2 text-center">
                  <Badge
                    className={`text-xs ${
                      pick.result === "WIN"
                        ? "bg-green-900/50 text-green-400"
                        : pick.result === "LOSS"
                          ? "bg-red-900/50 text-red-400"
                          : "bg-yellow-900/50 text-yellow-400"
                    }`}
                  >
                    {pick.result || "PENDING"}
                  </Badge>
                </td>
                <td className={`py-2 px-2 text-right text-xs font-bold ${parseFloat(pick.roi) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {(pick.roi * 100).toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
