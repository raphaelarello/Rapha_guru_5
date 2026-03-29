import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RaphaLayout from "@/components/RaphaLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AnimatedContainer,
  AnimatedCard,
  AnimatedItem,
  AnimatedTab,
  FloatingElement,
  PulsingElement,
  GlowingElement,
  CascadeAnimation,
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
} from "lucide-react";
import "../styles/glassmorphism.css";

export default function PitacosNivelAAA() {
  const [activeTab, setActiveTab] = useState("hoje");
  const [selectedGame, setSelectedGame] = useState<number | null>(null);

  // Dados de pressão para Canvas
  const dadosPressao = useMemo(
    () => [
      { time: "00:00", value: 20 },
      { time: "15:00", value: 45 },
      { time: "30:00", value: 62 },
      { time: "45:00", value: 78 },
      { time: "60:00", value: 85 },
      { time: "75:00", value: 92 },
      { time: "90:00", value: 88 },
    ],
    []
  );

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
      },
    ],
    []
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const cardHoverVariants = {
    hover: {
      scale: 1.08,
      rotateY: 5,
      boxShadow: "0 25px 50px rgba(14, 165, 233, 0.4)",
      transition: { duration: 0.3 },
    },
    tap: {
      scale: 0.95,
    },
  };

  return (
    <RaphaLayout title="Pitacos - Nível AAA">
      {/* WebGL Background Ultra-Sofisticado */}
      <WebGLBackground />

      <div className="relative z-10 space-y-8">
        {/* Header com Animação Orquestrada */}
        <motion.div
          className="glass-card p-8 border-0 backdrop-blur-xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="space-y-4">
            <motion.h1
              className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 8, repeat: Infinity }}
            >
              ⚡ PITACOS NÍVEL AAA
            </motion.h1>
            <motion.p variants={itemVariants} className="text-slate-300 text-lg">
              A Experiência Visual Mais Avançada do Mercado
            </motion.p>
          </motion.div>

          {/* KPI Cards com Animação */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
          >
            {[
              { label: "ROI Hoje", value: "+14.7%", color: "from-green-600 to-green-400" },
              { label: "Acertos", value: "32/35", color: "from-blue-600 to-blue-400" },
              { label: "Jogos Ao Vivo", value: "12", color: "from-purple-600 to-purple-400" },
            ].map((kpi, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`glass-card px-6 py-4 bg-gradient-to-br ${kpi.color}/20 border-0`}
              >
                <p className="text-xs text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                <motion.p
                  className="text-3xl font-black mt-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {kpi.value}
                </motion.p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Tabs com Animação de Transição */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <TabsList className="glass-card p-1 w-full justify-start gap-1 bg-transparent border-0 flex-wrap">
              {[
                { id: "hoje", label: "📅 Hoje" },
                { id: "aovivo", label: "🔴 Ao Vivo" },
                { id: "pressao", label: "🔥 Pressão" },
                { id: "performance", label: "📈 Performance" },
              ].map((tab) => (
                <motion.div key={tab.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <TabsTrigger
                    value={tab.id}
                    className="glass-card px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:border-0 transition-all duration-300"
                  >
                    {tab.label}
                  </TabsTrigger>
                </motion.div>
              ))}
            </TabsList>
          </motion.div>

          {/* TAB: HOJE */}
          <TabsContent value="hoje">
            <PageTransition direction="up">
              <AnimatedContainer staggerDelay={0.1}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: "Jogos Hoje", value: "12", icon: Trophy },
                    { label: "Picks Recomendados", value: "8", icon: Target },
                    { label: "Oportunidades Altas", value: "3", icon: Zap },
                  ].map((card, idx) => (
                    <AnimatedItem key={idx}>
                      <motion.div
                        variants={cardHoverVariants}
                        whileHover="hover"
                        whileTap="tap"
                        className="glass-card glass-card-interactive p-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-slate-400 text-sm">{card.label}</p>
                            <motion.p
                              className="text-4xl font-black text-white mt-2"
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                            >
                              {card.value}
                            </motion.p>
                          </div>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          >
                            <card.icon className="w-8 h-8 text-blue-400" />
                          </motion.div>
                        </div>
                      </motion.div>
                    </AnimatedItem>
                  ))}
                </div>
              </AnimatedContainer>
            </PageTransition>
          </TabsContent>

          {/* TAB: AO VIVO */}
          <TabsContent value="aovivo">
            <PageTransition direction="up">
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-3 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {jogosAoVivo.map((jogo, idx) => (
                  <motion.div
                    key={jogo.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, y: -10 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedGame(selectedGame === jogo.id ? null : jogo.id)}
                    className="cursor-pointer"
                  >
                    <div className="glass-card glass-card-interactive p-6 h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase">{jogo.liga}</p>
                          <p className="text-sm text-slate-300 mt-1">{jogo.minuto}'</p>
                        </div>
                        <PulsingElement intensity={0.15}>
                          <div className="badge-animated badge-danger">{jogo.heatScore}%</div>
                        </PulsingElement>
                      </div>

                      <div className="flex justify-between items-center py-4 border-y border-slate-700/50">
                        <div className="text-center flex-1">
                          <p className="text-sm font-semibold text-slate-300">{jogo.time1}</p>
                          <motion.p
                            className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mt-1"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity, delay: idx * 0.3 }}
                          >
                            {jogo.score1}
                          </motion.p>
                        </div>
                        <div className="px-4 text-slate-500 font-bold">-</div>
                        <div className="text-center flex-1">
                          <p className="text-sm font-semibold text-slate-300">{jogo.time2}</p>
                          <motion.p
                            className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-1"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity, delay: idx * 0.3 }}
                          >
                            {jogo.score2}
                          </motion.p>
                        </div>
                      </div>

                      <AnimatePresence>
                        {selectedGame === jogo.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-slate-700/50 space-y-2"
                          >
                            <div className="grid grid-cols-3 gap-2">
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </PageTransition>
          </TabsContent>

          {/* TAB: PRESSÃO (Canvas) */}
          <TabsContent value="pressao">
            <PageTransition direction="up">
              <motion.div
                className="glass-card p-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                  Pressão em Tempo Real (Canvas Animado)
                </h3>
                <CanvasHeatChart
                  data={dadosPressao}
                  width={800}
                  height={300}
                  color="#0ea5e9"
                  glowColor="#22c55e"
                />
              </motion.div>
            </PageTransition>
          </TabsContent>

          {/* TAB: PERFORMANCE */}
          <TabsContent value="performance">
            <PageTransition direction="up">
              <AnimatedContainer staggerDelay={0.15}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "Taxa de Acerto", value: "91.4%", trend: "↑ +2.3%" },
                    { title: "ROI Acumulado", value: "+R$ 1.250", trend: "↑ +14.7%" },
                    { title: "Índice de Acurácia", value: "0.18", trend: "↓ -0.05" },
                    { title: "Sharpe Ratio", value: "2.45", trend: "↑ +0.32" },
                  ].map((metric, idx) => (
                    <AnimatedItem key={idx}>
                      <GlowingElement color="rgba(14, 165, 233, 0.5)">
                        <motion.div
                          className="glass-card p-6 bg-gradient-to-br from-slate-800 to-slate-900"
                          whileHover={{ scale: 1.05 }}
                        >
                          <p className="text-slate-400 text-sm">{metric.title}</p>
                          <motion.p
                            className="text-3xl font-black text-white mt-2"
                            animate={{ opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {metric.value}
                          </motion.p>
                          <p className="text-xs text-green-400 mt-2">{metric.trend}</p>
                        </motion.div>
                      </GlowingElement>
                    </AnimatedItem>
                  ))}
                </div>
              </AnimatedContainer>
            </PageTransition>
          </TabsContent>
        </Tabs>

        {/* Footer com Animação */}
        <motion.div
          className="glass-card p-6 text-center text-slate-400 text-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <motion.p
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🚀 Pitacos Engine v3.0 | Nível AAA | WebGL + Canvas + Framer Motion + Lottie
          </motion.p>
          <p className="mt-2 text-xs">
            Integrado com API-Football v3 | Atualizado em tempo real
          </p>
        </motion.div>
      </div>
    </RaphaLayout>
  );
}
