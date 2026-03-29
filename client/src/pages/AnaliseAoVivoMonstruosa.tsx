import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RaphaLayout from "@/components/RaphaLayout";
import {
  AnimatedContainer,
  AnimatedCard,
  FloatingElement,
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
  ShieldAlert,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  Info,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import "../styles/glassmorphism.css";

export default function AnaliseAoVivoMonstruosa() {
  const [heatScore, setHeatScore] = useState(82);
  const [minuto, setMinuto] = useState(78);
  const [placar, setPlacar] = useState("1 - 1");

  // Simulação de atualização realtime
  useEffect(() => {
    const timer = setInterval(() => {
      setHeatScore(prev => Math.min(100, prev + (Math.random() > 0.5 ? 1 : -1)));
      if (Math.random() > 0.95) setMinuto(m => m + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <RaphaLayout title="Análise Monstruosa Realtime">
      <WebGLBackground />
      
      <div className="relative z-10 max-w-6xl mx-auto space-y-8 pb-24">
        {/* HEADER DO JOGO */}
        <PageTransition direction="down">
          <div className="glass-card p-8 border-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Activity className="w-48 h-48 text-blue-400 animate-pulse" />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
              <div className="text-center md:text-left space-y-2">
                <Badge className="bg-red-600 animate-pulse mb-2">🔴 AO VIVO - ELITE</Badge>
                <h2 className="text-sm font-black text-slate-400 tracking-widest uppercase">Brasileirão Série A</h2>
                <div className="flex items-center gap-6 justify-center md:justify-start">
                  <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">FLAMENGO</h1>
                  <div className="text-3xl font-black text-slate-600">VS</div>
                  <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">PALMEIRAS</h1>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-tighter">
                  {placar}
                </div>
                <div className="flex items-center gap-2 px-4 py-1 bg-blue-600/20 rounded-full border border-blue-500/30">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-xl font-black text-blue-400">{minuto}'</span>
                </div>
              </div>
            </div>
          </div>
        </PageTransition>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* COLUNA ESQUERDA: HEAT SCORE & GRÁFICO */}
          <div className="lg:col-span-8 space-y-8">
            <AnimatedCard className="p-8 bg-gradient-to-br from-slate-900/80 to-blue-900/20 border-blue-500/20">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    <Flame className="w-6 h-6 text-orange-500" />
                    HEAT SCORE MONSTRUOSO
                  </h3>
                  <p className="text-slate-400 font-medium">Índice de pressão ofensiva em tempo real</p>
                </div>
                <div className="text-right">
                  <span className={`text-6xl font-black tracking-tighter ${heatScore > 80 ? 'text-orange-500 animate-pulse' : 'text-blue-400'}`}>
                    {heatScore}%
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-600 via-orange-500 to-red-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${heatScore}%` }}
                    transition={{ type: "spring", stiffness: 50 }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-shimmer" />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-card p-4 bg-slate-900/50 border-0 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Ataques Perigosos</p>
                    <p className="text-2xl font-black text-white">18</p>
                    <p className="text-[10px] text-green-400 font-bold flex items-center justify-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> +12%
                    </p>
                  </div>
                  <div className="glass-card p-4 bg-slate-900/50 border-0 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Chutes a Gol</p>
                    <p className="text-2xl font-black text-white">5</p>
                    <p className="text-[10px] text-green-400 font-bold flex items-center justify-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> +2
                    </p>
                  </div>
                  <div className="glass-card p-4 bg-slate-900/50 border-0 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Posse (Ataque)</p>
                    <p className="text-2xl font-black text-white">72%</p>
                    <p className="text-[10px] text-blue-400 font-bold uppercase">Dominante</p>
                  </div>
                </div>
              </div>

              {/* GRÁFICO CANVAS DE PRESSÃO */}
              <div className="mt-8 h-64 w-full glass-card bg-slate-950/50 border-0 overflow-hidden relative">
                <CanvasHeatChart />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Pressure Stream</span>
                </div>
              </div>
            </AnimatedCard>

            {/* PROJEÇÕES DE IA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "PRÓXIMO GOL", val: "FLAMENGO", prob: 88, icon: Target, color: "text-blue-400", bg: "bg-blue-500/10" },
                { label: "OVER 2.5 GOLS", val: "SIM", prob: 75, icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10" },
                { label: "OVER 10.5 CANTOS", val: "SIM", prob: 94, icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10" },
              ].map((proj, i) => (
                <AnimatedCard key={i} className={`p-6 border-0 ${proj.bg}`}>
                  <proj.icon className={`w-8 h-8 mb-4 ${proj.color}`} />
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{proj.label}</p>
                  <p className="text-2xl font-black text-white mt-1">{proj.val}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Confiança IA</span>
                    <span className={`text-lg font-black ${proj.color}`}>{proj.prob}%</span>
                  </div>
                  <Progress value={proj.prob} className="h-1 mt-2 bg-slate-800" />
                </AnimatedCard>
              ))}
            </div>
          </div>

          {/* COLUNA DIREITA: VALOR ESPERADO & RADAR */}
          <div className="lg:col-span-4 space-y-8">
            {/* WIDGET: VALOR ESPERADO (EV+) */}
            <GlowingElement color="rgba(34, 197, 94, 0.2)">
              <div className="glass-card p-8 bg-green-500/5 border-green-500/20 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <TrendingUp className="w-32 h-32 text-green-500" />
                </div>
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-400" />
                  VALOR MONSTRUOSO
                </h3>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Odd da Casa</span>
                    <span className="text-2xl font-black text-white">1.85</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Odd Justa (IA)</span>
                    <span className="text-2xl font-black text-green-400">1.14</span>
                  </div>
                  <div className="pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-black text-slate-300 uppercase">Lucro Matemático</span>
                      <span className="text-3xl font-black text-green-400">+62.8%</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      A odd oferecida pela casa está absurdamente desajustada em relação à pressão real de campo detectada pela IA.
                    </p>
                  </div>
                  <button className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-green-900/20 uppercase tracking-widest">
                    Aproveitar Agora
                  </button>
                </div>
              </div>
            </GlowingElement>

            {/* RADAR DE JOGADORES */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                RADAR DE JOGADORES
              </h3>
              <div className="space-y-6">
                {[
                  { nome: "Pedro", time: "Flamengo", prob: 84, status: "🔥 EXPLOSIVO", color: "text-orange-400" },
                  { nome: "Arrascaeta", time: "Flamengo", prob: 78, status: "🌡️ QUENTE", color: "text-blue-400" },
                  { nome: "Gustavo Gómez", time: "Palmeiras", prob: 65, status: "🔴 CARTÃO", color: "text-red-400" },
                ].map((j, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-slate-900/40 rounded-xl border border-slate-800/50 hover:border-blue-500/30 transition-all">
                    <div>
                      <p className="text-sm font-black text-white">{j.nome}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{j.time}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black ${j.color}`}>{j.prob}%</p>
                      <p className="text-[9px] font-black text-slate-600 uppercase">{j.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ALERTA DE IA */}
            <div className="glass-card p-6 bg-red-600/10 border-red-500/20 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 animate-pulse" />
              <div>
                <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-1">Alerta Crítico IA</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pressão do Flamengo atingiu nível crítico (92%). Probabilidade de gol nos próximos 5 minutos é de **88%**.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER DE STATUS */}
      <div className="fixed bottom-0 left-0 right-0 glass-card rounded-none border-t border-slate-800/50 p-4 flex justify-between items-center px-12 backdrop-blur-3xl z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IA v4.0 Soberana Ativa</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Info className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Última Atualização: Agora</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-500 uppercase">Sincronizado com API-Football v3</span>
          <ChevronRight className="w-4 h-4 text-slate-700" />
          <span className="text-[10px] font-black text-blue-400 uppercase">v4.0.0-MONSTRUOSO</span>
        </div>
      </div>
    </RaphaLayout>
  );
}

function Users(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
