import { useState, useEffect, useMemo } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Flame, TrendingUp, Users, BarChart3, Zap, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

type TelaAtiva = "jogos" | "ligas" | "acuracia" | "oportunidades" | "relatorio";

export default function PitacosTelao() {
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>("jogos");
  const [autoRotate, setAutoRotate] = useState(true);
  const [contador, setContador] = useState(0);

  // Queries
  const jogosAoVivoQuery = trpc.pitacos.getLiveGames.useQuery(
    { limit: 20 },
    { refetchInterval: 30000 }
  );

  const rankingsQuery = trpc.pitacos.getLeagueRankings.useQuery({
    metric: "goals",
    limit: 20,
  });

  const acuraciaQuery = trpc.pitacos.getAccuracyMetrics.useQuery({
    groupBy: "topic",
  });

  const roiQuery = trpc.pitacos.getAccumulatedROI.useQuery();

  // Auto-rotate entre telas a cada 30 segundos
  useEffect(() => {
    if (!autoRotate) return;

    const interval = setInterval(() => {
      setContador((prev) => (prev + 1) % 5);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRotate]);

  // Mapear contador para tela ativa
  useEffect(() => {
    const telas: TelaAtiva[] = ["jogos", "ligas", "acuracia", "oportunidades", "relatorio"];
    setTelaAtiva(telas[contador]);
  }, [contador]);

  // Dados simulados para gráficos
  const dadosAcuracia = useMemo(
    () => [
      { mercado: "Próximo Gol", indice: 0.18, acertos: 45, total: 52 },
      { mercado: "Mais de 2.5", indice: 0.22, acertos: 38, total: 55 },
      { mercado: "Ambos Marcam", indice: 0.25, acertos: 32, total: 48 },
      { mercado: "Resultado Final", indice: 0.28, acertos: 28, total: 50 },
      { mercado: "Goleada", indice: 0.35, acertos: 12, total: 40 },
    ],
    []
  );

  const dadosROI = useMemo(
    () => [
      { data: "01/01", roi: 2.5, lucro: 150 },
      { data: "05/01", roi: 5.2, lucro: 380 },
      { data: "10/01", roi: 8.1, lucro: 620 },
      { data: "15/01", roi: 6.8, lucro: 510 },
      { data: "20/01", roi: 10.5, lucro: 850 },
      { data: "25/01", roi: 12.3, lucro: 1020 },
      { data: "31/01", roi: 14.7, lucro: 1250 },
    ],
    []
  );

  const distribuicaoMercados = useMemo(
    () => [
      { nome: "Próximo Gol", valor: 25, cor: "#ef4444" },
      { nome: "Mais de 2.5", valor: 22, cor: "#f97316" },
      { nome: "Ambos Marcam", valor: 18, cor: "#eab308" },
      { nome: "Resultado Final", valor: 20, cor: "#22c55e" },
      { nome: "Escanteios", valor: 10, cor: "#0ea5e9" },
      { nome: "Cartões", valor: 5, cor: "#8b5cf6" },
    ],
    []
  );

  const oportunidadesAltas = useMemo(
    () => [
      {
        id: 1,
        time1: "Flamengo",
        time2: "Vasco",
        mercado: "Próximo Gol",
        confianca: 87,
        odd: 1.95,
        pressao: 82,
      },
      {
        id: 2,
        time1: "São Paulo",
        time2: "Corinthians",
        mercado: "Ambos Marcam",
        confianca: 84,
        odd: 1.72,
        pressao: 78,
      },
      {
        id: 3,
        time1: "Palmeiras",
        time2: "Santos",
        mercado: "Mais de 2.5",
        confianca: 81,
        odd: 1.88,
        pressao: 75,
      },
    ],
    []
  );

  const relatorioMatinal = useMemo(
    () => ({
      dataRelatorio: new Date().toLocaleDateString("pt-BR"),
      totalPicks: 124,
      acertos: 107,
      taxaAcerto: 86.3,
      lucroTotal: 1250.5,
      roiTotal: 14.7,
      bilhetesGanhos: 18,
      bilhetesPerididos: 3,
      padraoDestaque: "Próximo Gol em Primeiros 10 Minutos",
      confiancaPadrao: 78,
      proximasLigas: ["Brasileirão", "Copa do Brasil", "Libertadores"],
    }),
    []
  );

  const CartaoJogo = ({ snapshot }: { snapshot: any }) => {
    const obterCorPressao = (score: number) => {
      if (score > 75) return "bg-red-600";
      if (score > 50) return "bg-orange-500";
      return "bg-blue-500";
    };

    const obterLabelPressao = (score: number) => {
      if (score > 75) return "🔥 MUITO QUENTE";
      if (score > 50) return "🌡️ QUENTE";
      return "❄️ FRIO";
    };

    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 text-white border border-slate-700">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-slate-400">{snapshot.leagueName}</p>
            <p className="text-xs text-slate-500">{snapshot.minute}'</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {snapshot.status === "LIVE" ? "🔴 AO VIVO" : "⏰ PRÓXIMO"}
          </Badge>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="text-center flex-1">
            <p className="text-lg font-bold">{snapshot.homeName}</p>
            <p className="text-4xl font-bold text-green-400">{snapshot.scoreHome}</p>
          </div>
          <div className="px-4 text-center">
            <p className="text-2xl font-bold text-slate-400">-</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-lg font-bold">{snapshot.awayName}</p>
            <p className="text-4xl font-bold text-green-400">{snapshot.scoreAway}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">{obterLabelPressao(snapshot.heatScore)}</span>
              <span className="text-sm font-bold">{snapshot.heatScore}%</span>
            </div>
            <Progress value={Math.min(100, snapshot.heatScore)} className="h-3" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs text-slate-400">Pressão</p>
              <p className="text-xl font-bold">{snapshot.pressureScore}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Risco</p>
              <p className="text-xl font-bold text-yellow-400">
                {snapshot.riskFlags?.length > 0 ? snapshot.riskFlags[0] : "BAIXO"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">📺 TELÃO PITACOS</h1>
            <p className="text-sm text-slate-400">Terminal Trader em Tempo Real</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400">Tela Atual</p>
              <p className="text-lg font-bold">{contador + 1}/5</p>
            </div>
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                autoRotate
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              <Zap className="w-4 h-4" />
              {autoRotate ? "AUTO" : "MANUAL"}
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="p-6 h-[calc(100vh-100px)] overflow-hidden">
        {/* TELA 1: JOGOS AO VIVO */}
        {telaAtiva === "jogos" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Flame className="w-6 h-6" />
              Jogos Ao Vivo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)] overflow-y-auto">
              {jogosAoVivoQuery.data?.snapshots?.slice(0, 9).map((snapshot) => (
                <CartaoJogo key={snapshot.fixtureId} snapshot={snapshot} />
              ))}
            </div>
          </div>
        )}

        {/* TELA 2: RANKINGS DE LIGAS */}
        {telaAtiva === "ligas" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Rankings de Ligas
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-xl font-bold mb-4">Gols por Liga</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rankingsQuery.data || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="league" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    <Bar dataKey="totalGoals" fill="#22c55e" name="Gols" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-xl font-bold mb-4">Distribuição de Mercados</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distribuicaoMercados}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ nome, valor }) => `${nome} ${valor}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valor"
                    >
                      {distribuicaoMercados.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TELA 3: ACURÁCIA */}
        {telaAtiva === "acuracia" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Índice de Acurácia por Mercado
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dadosAcuracia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="mercado" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    <Bar dataKey="indice" fill="#ef4444" name="Índice de Acurácia" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">Detalhes por Mercado</h3>
                <div className="space-y-4">
                  {dadosAcuracia.map((item) => (
                    <div key={item.mercado} className="border-b border-slate-700 pb-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold">{item.mercado}</p>
                        <Badge
                          variant={item.indice < 0.25 ? "default" : "secondary"}
                          className="text-sm"
                        >
                          {item.indice.toFixed(3)}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm text-slate-400 mb-2">
                        <span>Acertos: {item.acertos}/{item.total}</span>
                        <span>Taxa: {((item.acertos / item.total) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={(item.acertos / item.total) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TELA 4: OPORTUNIDADES ALTAS */}
        {telaAtiva === "oportunidades" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6" />
              Oportunidades de Alta Confiança
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)] overflow-y-auto">
              {oportunidadesAltas.map((oportunidade) => (
                <div
                  key={oportunidade.id}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 border-2 border-green-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-slate-400">{oportunidade.mercado}</p>
                      <p className="text-lg font-bold">{oportunidade.time1} vs {oportunidade.time2}</p>
                    </div>
                    <Badge className="bg-green-600 text-white">{oportunidade.confianca}%</Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Confiança</p>
                      <Progress value={oportunidade.confianca} className="h-2" />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-1">Pressão do Jogo</p>
                      <Progress value={oportunidade.pressao} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="bg-slate-700 rounded p-2">
                        <p className="text-xs text-slate-400">Odd</p>
                        <p className="text-lg font-bold text-green-400">{oportunidade.odd}</p>
                      </div>
                      <div className="bg-slate-700 rounded p-2">
                        <p className="text-xs text-slate-400">EV</p>
                        <p className="text-lg font-bold text-blue-400">
                          {((oportunidade.confianca / 100) * oportunidade.odd - 1).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TELA 5: RELATÓRIO MATINAL */}
        {telaAtiva === "relatorio" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">📋 Relatório Matinal - {relatorioMatinal.dataRelatorio}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)] overflow-y-auto">
              {/* Resumo Geral */}
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-xl font-bold mb-4">Resumo de Performance</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400">Total de Picks</p>
                    <p className="text-3xl font-bold">{relatorioMatinal.totalPicks}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Acertos</p>
                    <p className="text-3xl font-bold text-green-400">{relatorioMatinal.acertos}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Taxa de Acerto</p>
                    <Progress value={relatorioMatinal.taxaAcerto} className="h-3" />
                    <p className="text-lg font-bold mt-2">{relatorioMatinal.taxaAcerto}%</p>
                  </div>
                </div>
              </div>

              {/* Resultados Financeiros */}
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-xl font-bold mb-4">Resultados Financeiros</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400">Lucro Total</p>
                    <p className="text-3xl font-bold text-green-400">R$ {relatorioMatinal.lucroTotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">ROI</p>
                    <p className="text-3xl font-bold text-green-400">{relatorioMatinal.roiTotal}%</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-green-900 rounded p-3">
                      <p className="text-xs text-green-300">Bilhetes Ganhos</p>
                      <p className="text-2xl font-bold">{relatorioMatinal.bilhetesGanhos}</p>
                    </div>
                    <div className="bg-red-900 rounded p-3">
                      <p className="text-xs text-red-300">Bilhetes Perdidos</p>
                      <p className="text-2xl font-bold">{relatorioMatinal.bilhetesPerididos}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Padrão Destaque */}
              <div className="bg-slate-800 rounded-lg p-6 border border-blue-700 lg:col-span-2">
                <h3 className="text-xl font-bold mb-4">🎯 Padrão em Destaque</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold">{relatorioMatinal.padraoDestaque}</p>
                    <p className="text-sm text-slate-400 mt-2">Padrão com maior confiança detectado</p>
                  </div>
                  <Badge className="bg-blue-600 text-white text-lg px-4 py-2">
                    {relatorioMatinal.confiancaPadrao}%
                  </Badge>
                </div>
              </div>

              {/* Próximas Ligas */}
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 lg:col-span-2">
                <h3 className="text-xl font-bold mb-4">⚽ Próximas Ligas em Foco</h3>
                <div className="flex gap-4">
                  {relatorioMatinal.proximasLigas.map((liga) => (
                    <Badge key={liga} className="bg-slate-700 text-white px-4 py-2 text-sm">
                      {liga}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé com Indicador de Tela */}
      <div className="bg-slate-900 border-t border-slate-700 p-3 flex justify-center gap-2">
        {["Jogos", "Ligas", "Acurácia", "Oportunidades", "Relatório"].map((label, idx) => (
          <button
            key={idx}
            onClick={() => setContador(idx)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              contador === idx
                ? "bg-green-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
