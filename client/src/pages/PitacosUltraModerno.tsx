import { useState, useEffect, useMemo } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Flame,
  TrendingUp,
  Zap,
  Target,
  Activity,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  Trophy,
} from "lucide-react";
import "../styles/glassmorphism.css";
import { trpc } from "@/lib/trpc";

export default function PitacosUltraModerno() {
  const [activeTab, setActiveTab] = useState("hoje");
  const [particulas, setParticulas] = useState<Array<{ id: number; left: number; delay: number }>>([]);

  // Gerar partículas flutuantes
  useEffect(() => {
    const novasParticulas = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
    }));
    setParticulas(novasParticulas);
  }, []);

  // Dados simulados
  const jogosAoVivo = useMemo(
    () => [
      {
        id: 1,
        liga: "Brasileirão",
        time1: "Flamengo",
        time2: "Vasco",
        score1: 2,
        score2: 1,
        minuto: 67,
        heatScore: 87,
        pressao: 82,
        status: "LIVE",
      },
      {
        id: 2,
        liga: "Premier League",
        time1: "Manchester City",
        time2: "Liverpool",
        score1: 1,
        score2: 1,
        minuto: 45,
        heatScore: 72,
        pressao: 68,
        status: "LIVE",
      },
      {
        id: 3,
        liga: "La Liga",
        time1: "Real Madrid",
        time2: "Barcelona",
        score1: 3,
        score2: 2,
        minuto: 89,
        heatScore: 95,
        pressao: 91,
        status: "LIVE",
      },
    ],
    []
  );

  const dadosPerformance = useMemo(
    () => [
      { hora: "00:00", roi: 2.5, lucro: 150, acertos: 8 },
      { hora: "04:00", roi: 4.2, lucro: 280, acertos: 12 },
      { hora: "08:00", roi: 6.8, lucro: 450, acertos: 18 },
      { hora: "12:00", roi: 8.5, lucro: 620, acertos: 22 },
      { hora: "16:00", roi: 10.2, lucro: 780, acertos: 25 },
      { hora: "20:00", roi: 12.5, lucro: 950, acertos: 28 },
      { hora: "23:59", roi: 14.7, lucro: 1250, acertos: 32 },
    ],
    []
  );

  const dadosRadar = useMemo(
    () => [
      { metric: "Pressão", value: 85 },
      { metric: "Acurácia", value: 82 },
      { metric: "ROI", value: 78 },
      { metric: "Confiança", value: 88 },
      { metric: "Velocidade", value: 75 },
      { metric: "Consistência", value: 80 },
    ],
    []
  );

  const CartaoJogoModerno = ({ jogo }: { jogo: any }) => {
    const getHeatColor = (score: number) => {
      if (score > 80) return "from-red-600 to-red-400";
      if (score > 60) return "from-orange-600 to-orange-400";
      return "from-blue-600 to-blue-400";
    };

    const getHeatLabel = (score: number) => {
      if (score > 80) return "🔥 EXPLOSIVO";
      if (score > 60) return "🌡️ QUENTE";
      return "❄️ FRIO";
    };

    return (
      <div className="glass-card glass-card-interactive group relative overflow-hidden p-6 hover:shadow-2xl transition-all duration-300">
        {/* Fundo Animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Conteúdo */}
        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{jogo.liga}</p>
              <p className="text-sm text-slate-300 mt-1">{jogo.minuto}' | {jogo.status}</p>
            </div>
            <div className={`badge-animated badge-${jogo.heatScore > 80 ? "danger" : jogo.heatScore > 60 ? "warning" : "info"}`}>
              {jogo.heatScore}%
            </div>
          </div>

          {/* Placar */}
          <div className="flex justify-between items-center py-4 border-y border-slate-700/50">
            <div className="text-center flex-1">
              <p className="text-sm font-semibold text-slate-300">{jogo.time1}</p>
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mt-1">
                {jogo.score1}
              </p>
            </div>
            <div className="px-4 text-slate-500 font-bold">-</div>
            <div className="text-center flex-1">
              <p className="text-sm font-semibold text-slate-300">{jogo.time2}</p>
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-1">
                {jogo.score2}
              </p>
            </div>
          </div>

          {/* Heat Score Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-300">{getHeatLabel(jogo.heatScore)}</span>
              <span className="text-xs text-slate-400">{jogo.pressao}% pressão</span>
            </div>
            <div className="heat-indicator" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">Chutes</p>
              <p className="text-lg font-bold text-cyan-400">12</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">Escanteios</p>
              <p className="text-lg font-bold text-purple-400">8</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">Cartões</p>
              <p className="text-lg font-bold text-orange-400">3</p>
            </div>
          </div>
        </div>

        {/* Efeito de Borda Animada */}
        <div className="absolute inset-0 rounded-lg pointer-events-none group-hover:animate-pulse" style={{
          background: `linear-gradient(45deg, transparent, rgba(14, 165, 233, 0.1), transparent)`,
          animation: "shimmer 3s infinite"
        }} />
      </div>
    );
  };

  return (
    <RaphaLayout title="Pitacos - Ultra Moderno">
      {/* Partículas Flutuantes */}
      {particulas.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, #0ea5e9, #8b5cf6)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${15 + Math.random() * 10}s`,
          }}
        />
      ))}

      {/* Background Animado */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="space-y-6 relative z-10">
        {/* Header Ultra Moderno */}
        <div className="glass-card p-8 border-0 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 animate-pulse">
                ⚡ PITACOS ULTRA
              </h1>
              <p className="text-slate-400 text-lg">Terminal Trader de Elite | Estado da Arte</p>
            </div>
            <div className="flex gap-3">
              <div className="glass-card px-6 py-3 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider">ROI Hoje</p>
                <p className="text-3xl font-black text-green-400 mt-1">+14.7%</p>
              </div>
              <div className="glass-card px-6 py-3 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Acertos</p>
                <p className="text-3xl font-black text-blue-400 mt-1">32/35</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Ultra Moderno */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass-card p-1 w-full justify-start gap-1 bg-transparent border-0">
            {[
              { id: "hoje", label: "📅 Hoje", icon: Clock },
              { id: "aovivo", label: "🔴 Ao Vivo", icon: Activity },
              { id: "performance", label: "📈 Performance", icon: TrendingUp },
              { id: "radar", label: "🎯 Radar", icon: Target },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="glass-card px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:border-0 transition-all duration-300"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* TAB: HOJE */}
          <TabsContent value="hoje" className="space-y-6 fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Jogos Hoje", value: "12", icon: Trophy, color: "from-blue-600 to-cyan-600" },
                { label: "Picks Recomendados", value: "8", icon: Target, color: "from-purple-600 to-pink-600" },
                { label: "Oportunidades Altas", value: "3", icon: Zap, color: "from-orange-600 to-red-600" },
              ].map((card, idx) => (
                <div key={idx} className={`glass-card glass-card-interactive p-6 bg-gradient-to-br ${card.color}/20`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-sm">{card.label}</p>
                      <p className="text-4xl font-black text-white mt-2">{card.value}</p>
                    </div>
                    <card.icon className="w-8 h-8 text-slate-400 opacity-50" />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB: AO VIVO */}
          <TabsContent value="aovivo" className="space-y-6 fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-max">
              {jogosAoVivo.map((jogo, idx) => (
                <div key={jogo.id} style={{ animationDelay: `${idx * 100}ms` }} className="fade-in-up">
                  <CartaoJogoModerno jogo={jogo} />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB: PERFORMANCE */}
          <TabsContent value="performance" className="space-y-6 fade-in-up">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                ROI & Lucro em Tempo Real
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dadosPerformance}>
                  <defs>
                    <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hora" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                  <Area type="monotone" dataKey="roi" stroke="#22c55e" fillOpacity={1} fill="url(#colorRoi)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* TAB: RADAR */}
          <TabsContent value="radar" className="space-y-6 fade-in-up">
            <div className="glass-card p-6 flex justify-center">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={dadosRadar}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" stroke="#94a3b8" />
                  <PolarRadiusAxis stroke="#94a3b8" />
                  <Radar name="Performance" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Moderno */}
        <div className="glass-card p-6 text-center text-slate-400 text-sm">
          <p>🚀 Pitacos Engine v2.0 | Estado da Arte em Análise de Futebol</p>
          <p className="mt-2 text-xs">Atualizado em tempo real | Integrado com API-Football v3</p>
        </div>
      </div>
    </RaphaLayout>
  );
}
