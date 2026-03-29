import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RaphaLayout from "@/components/RaphaLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AnimatedContainer,
  AnimatedCard,
  AnimatedItem,
  FloatingElement,
  PulsingElement,
  GlowingElement,
  PageTransition,
} from "@/components/AnimationOrchestrator";
import { CanvasHeatChart } from "@/components/CanvasHeatChart";
import { WebGLBackground } from "@/components/WebGLBackground";
import {
  Flame,
  TrendingUp,
  Zap,
  Target,
  Activity,
  Trophy,
  AlertCircle,
  CheckCircle,
  Users,
  ShieldAlert,
  Globe,
  BarChart3,
  Search,
  Filter,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import "../styles/glassmorphism.css";

// --- TIPOS ---
interface ProjecaoIA {
  id: number;
  liga: string;
  time1: string;
  time2: string;
  minuto: number;
  placar: string;
  gols: { prob: number; proj: string };
  cantos: { prob: number; proj: string };
  cartoes: { prob: number; proj: string };
  vitoria: { t1: number; emp: number; t2: number };
  ambosMarquem: number;
  virada: number;
  confianca: number;
  risco: "BAIXO" | "MÉDIO" | "ALTO";
}

export default function PitacosMonstruoso() {
  const [activeTab, setActiveTab] = useState("aovivo");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroRisco, setFiltroRisco] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- DADOS SIMULADOS (IA REALTIME) ---
  const projecoes = useMemo<ProjecaoIA[]>(() => [
    {
      id: 1,
      liga: "Brasileirão Série A",
      time1: "Flamengo",
      time2: "Palmeiras",
      minuto: 72,
      placar: "1 - 1",
      gols: { prob: 88, proj: "2.5+" },
      cantos: { prob: 92, proj: "10.5+" },
      cartoes: { prob: 75, proj: "5.5+" },
      vitoria: { t1: 45, emp: 35, t2: 20 },
      ambosMarquem: 95,
      virada: 42,
      confianca: 91,
      risco: "BAIXO",
    },
    {
      id: 2,
      liga: "Premier League",
      time1: "Liverpool",
      time2: "Arsenal",
      minuto: 34,
      placar: "0 - 0",
      gols: { prob: 65, proj: "1.5+" },
      cantos: { prob: 81, proj: "9.5+" },
      cartoes: { prob: 42, proj: "3.5+" },
      vitoria: { t1: 38, emp: 32, t2: 30 },
      ambosMarquem: 58,
      virada: 15,
      confianca: 74,
      risco: "MÉDIO",
    },
    {
      id: 3,
      liga: "Champions League",
      time1: "Real Madrid",
      time2: "Man City",
      minuto: 88,
      placar: "2 - 2",
      gols: { prob: 94, proj: "4.5+" },
      cantos: { prob: 68, proj: "11.5+" },
      cartoes: { prob: 89, proj: "6.5+" },
      vitoria: { t1: 33, emp: 34, t2: 33 },
      ambosMarquem: 100,
      virada: 65,
      confianca: 96,
      risco: "BAIXO",
    },
  ], []);

  const jogadoresQuentes = [
    { nome: "Vini Jr", time: "Real Madrid", probGol: 84, status: "🔥 EXPLOSIVO" },
    { nome: "Haaland", time: "Man City", probGol: 91, status: "🔥 LETAL" },
    { nome: "Pedro", time: "Flamengo", probGol: 78, status: "🌡️ QUENTE" },
  ];

  const ligasTop = [
    { nome: "Bundesliga", gols: 3.2, cantos: 10.4, vitoriaCasa: "52%" },
    { nome: "Eredivisie", gols: 3.1, cantos: 9.8, vitoriaCasa: "48%" },
    { nome: "Premier League", gols: 2.9, cantos: 10.1, vitoriaCasa: "45%" },
  ];

  // --- FILTRAGEM ---
  const filteredProjecoes = projecoes.filter(p => {
    const matchesSearch = p.time1.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.time2.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.liga.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisco = !filtroRisco || p.risco === filtroRisco;
    return matchesSearch && matchesRisco;
  });

  return (
    <RaphaLayout title="Pitacos Monstruoso - IA de Elite">
      <WebGLBackground />

      <div className="relative z-10 space-y-6 pb-20">
        {/* HEADER MONSTRUOSO */}
        <motion.div 
          className="glass-card p-6 border-0 overflow-hidden relative"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Activity className="w-32 h-32 text-blue-400 animate-pulse" />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 animate-pulse">LIVE IA v4.0</Badge>
                <span className="text-slate-400 text-xs font-mono uppercase tracking-widest">
                  {currentTime.toLocaleTimeString("pt-BR")}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                PITACOS <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">MONSTRUOSO</span>
              </h1>
              <p className="text-slate-400 font-medium">O maior e mais assertivo motor de IA do planeta.</p>
            </div>

            <div className="flex gap-3">
              <div className="glass-card px-4 py-2 bg-green-500/10 border-green-500/20">
                <p className="text-[10px] text-green-400 uppercase font-bold">Taxa de Acerto Hoje</p>
                <p className="text-2xl font-black text-white">94.2%</p>
              </div>
              <div className="glass-card px-4 py-2 bg-blue-500/10 border-blue-500/20">
                <p className="text-[10px] text-blue-400 uppercase font-bold">ROI Acumulado</p>
                <p className="text-2xl font-black text-white">+18.5%</p>
              </div>
            </div>
          </div>

          {/* BARRA DE FILTROS */}
          <div className="mt-8 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder="Buscar liga, time ou mercado..." 
                className="bg-slate-900/50 border-slate-700/50 pl-10 h-12 text-white focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {["BAIXO", "MÉDIO", "ALTO"].map(r => (
                <button
                  key={r}
                  onClick={() => setFiltroRisco(filtroRisco === r ? null : r)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    filtroRisco === r 
                    ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]" 
                    : "glass-card text-slate-400 hover:text-white"
                  }`}
                >
                  RISCO {r}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* TABS PRINCIPAIS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass-card p-1 w-full justify-start gap-1 bg-transparent border-0 flex-wrap h-auto">
            {[
              { id: "aovivo", label: "🔴 AO VIVO", icon: Activity },
              { id: "proximos", label: "📅 PRÓXIMOS", icon: Clock },
              { id: "ligas", label: "🌍 LIGAS TOP", icon: Globe },
              { id: "jogadores", label: "🏃 JOGADORES", icon: Users },
              { id: "acertos", label: "🎯 ACERTOS", icon: Target },
              { id: "telao", label: "📺 TELÃO", icon: BarChart3 },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="glass-card px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:border-0 transition-all duration-300 font-bold text-xs"
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* CONTEÚDO: AO VIVO (O MONSTRUOSO) */}
          <TabsContent value="aovivo" className="mt-6">
            <PageTransition direction="up">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* LISTA DE JOGOS */}
                <div className="xl:col-span-2 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {filteredProjecoes.map((p) => (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -5 }}
                        className="glass-card p-0 overflow-hidden border-l-4 border-l-blue-500"
                      >
                        <div className="p-4 bg-slate-900/40 flex justify-between items-center border-b border-slate-800/50">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400 uppercase">{p.liga}</Badge>
                            <span className="text-blue-400 font-black text-sm animate-pulse">{p.minuto}'</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Confiança IA</span>
                            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${p.confianca}%` }}
                                transition={{ duration: 1 }}
                              />
                            </div>
                            <span className="text-xs font-black text-white">{p.confianca}%</span>
                          </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                          {/* PLACAR E TIMES */}
                          <div className="md:col-span-4 flex justify-between items-center gap-4">
                            <div className="text-center flex-1">
                              <p className="text-sm font-black text-white truncate">{p.time1}</p>
                              <p className="text-3xl font-black text-blue-400 mt-1">{p.placar.split('-')[0]}</p>
                            </div>
                            <div className="text-slate-600 font-black">VS</div>
                            <div className="text-center flex-1">
                              <p className="text-sm font-black text-white truncate">{p.time2}</p>
                              <p className="text-3xl font-black text-purple-400 mt-1">{p.placar.split('-')[1]}</p>
                            </div>
                          </div>

                          {/* TERMÔMETROS DE PROJEÇÃO */}
                          <div className="md:col-span-5 grid grid-cols-3 gap-2">
                            {[
                              { label: "GOLS", val: p.gols, icon: Flame, color: "text-orange-400" },
                              { label: "CANTOS", val: p.cantos, icon: Zap, color: "text-yellow-400" },
                              { label: "CARTÕES", val: p.cartoes, icon: ShieldAlert, color: "text-red-400" },
                            ].map((stat, i) => (
                              <div key={i} className="glass-card p-3 bg-slate-800/30 border-0 text-center">
                                <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                                <p className="text-[9px] text-slate-500 font-bold uppercase">{stat.label}</p>
                                <p className="text-lg font-black text-white">{stat.val.proj}</p>
                                <p className={`text-[10px] font-bold ${stat.val.prob > 80 ? 'text-green-400' : 'text-slate-400'}`}>
                                  {stat.val.prob}%
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* AÇÕES E RISCO */}
                          <div className="md:col-span-3 space-y-2">
                            <div className={`text-center py-1 rounded text-[10px] font-black tracking-widest ${
                              p.risco === 'BAIXO' ? 'bg-green-500/20 text-green-400' : 
                              p.risco === 'MÉDIO' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              RISCO {p.risco}
                            </div>
                            <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-black text-xs transition-all shadow-lg shadow-blue-900/20">
                              VER ANÁLISE IA
                            </button>
                          </div>
                        </div>

                        {/* BARRA DE PROBABILIDADES 1X2 */}
                        <div className="px-6 pb-4 flex gap-1 h-1.5">
                          <div className="bg-blue-500 rounded-l-full" style={{ width: `${p.vitoria.t1}%` }} />
                          <div className="bg-slate-600" style={{ width: `${p.vitoria.emp}%` }} />
                          <div className="bg-purple-500 rounded-r-full" style={{ width: `${p.vitoria.t2}%` }} />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* SIDEBAR: INSIGHTS MONSTRUOSOS */}
                <div className="space-y-6">
                  {/* WIDGET: JOGADORES QUENTES */}
                  <AnimatedCard className="p-6 bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/20">
                    <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      JOGADORES QUENTES
                    </h3>
                    <div className="space-y-4">
                      {jogadoresQuentes.map((j, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold text-white">{j.nome}</p>
                            <p className="text-[10px] text-slate-400 uppercase">{j.time}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-orange-400">{j.probGol}%</p>
                            <p className="text-[9px] font-bold text-slate-500">{j.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AnimatedCard>

                  {/* WIDGET: CHANCE DE VIRADA */}
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      CHANCE DE VIRADA
                    </h3>
                    <div className="space-y-6">
                      {projecoes.filter(p => p.virada > 30).map((p, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-300">{p.time1} vs {p.time2}</span>
                            <span className="text-green-400">{p.virada}%</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-green-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${p.virada}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WIDGET: LIGAS MAIS LUCRATIVAS */}
                  <div className="glass-card p-6 bg-blue-600/10 border-blue-500/20">
                    <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-500" />
                      LIGAS DO DIA
                    </h3>
                    <div className="space-y-4">
                      {ligasTop.map((l, i) => (
                        <div key={i} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-black text-white">{l.nome}</span>
                            <Badge className="bg-blue-600/20 text-blue-400 border-0 text-[10px]">TOP GOLS</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-[9px] text-slate-500 font-bold">GOLS/J</p>
                              <p className="text-xs font-black text-white">{l.gols}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-500 font-bold">CANTOS</p>
                              <p className="text-xs font-black text-white">{l.cantos}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-500 font-bold">VIT. CASA</p>
                              <p className="text-xs font-black text-white">{l.vitoriaCasa}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </PageTransition>
          </TabsContent>

          {/* OUTRAS TABS (SIMULADAS PARA O DESIGN) */}
          <TabsContent value="acertos">
            <PageTransition direction="up">
              <div className="glass-card p-8 text-center space-y-4">
                <Target className="w-16 h-16 text-blue-500 mx-auto animate-bounce" />
                <h2 className="text-3xl font-black text-white">CENTRAL DE ACERTOS GRANULAR</h2>
                <p className="text-slate-400 max-w-md mx-auto">
                  Aqui você visualiza cada tópico do seu bilhete. Se pediu 9 cantos e saíram 10, nós contabilizamos o acerto individual.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="glass-card p-6 border-green-500/30 bg-green-500/5">
                    <p className="text-4xl font-black text-green-400">1.240</p>
                    <p className="text-xs font-bold text-slate-500 uppercase mt-2">Cantos Acertados</p>
                  </div>
                  <div className="glass-card p-6 border-blue-500/30 bg-blue-500/5">
                    <p className="text-4xl font-black text-blue-400">856</p>
                    <p className="text-xs font-bold text-slate-500 uppercase mt-2">Gols Projetados</p>
                  </div>
                  <div className="glass-card p-6 border-red-500/30 bg-red-500/5">
                    <p className="text-4xl font-black text-red-400">412</p>
                    <p className="text-xs font-bold text-slate-500 uppercase mt-2">Cartões Confirmados</p>
                  </div>
                </div>
              </div>
            </PageTransition>
          </TabsContent>
        </Tabs>

        {/* FOOTER DE STATUS */}
        <motion.div 
          className="fixed bottom-0 left-0 right-0 glass-card rounded-none border-t border-slate-800/50 p-3 flex justify-between items-center px-8 backdrop-blur-2xl z-50"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motor IA Ativo</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Activity className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">API-Football v3: Conectado</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-500 uppercase">Próxima Atualização em: 24s</span>
            <div className="h-4 w-[1px] bg-slate-800" />
            <span className="text-[10px] font-black text-blue-400 uppercase">v4.0.0-MONSTRUOSO</span>
          </div>
        </motion.div>
      </div>
    </RaphaLayout>
  );
}
