/**
 * MATCH CENTER PRO
 * Stats + Events + Lineups + Jogadores Quentes/Indisciplinados + Alertas
 */

import React, { useState, useEffect } from "react";
import {
  Surface,
  Pill,
  KPI,
  SectionTitle,
  Grid,
  Stack,
} from "@/components/ui/design-system";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Flame, TrendingUp, Users, Clock, Zap } from "lucide-react";

interface Alerta {
  id: number;
  tipo: "gol" | "cartao" | "odd" | "pressao";
  minuto: number;
  mensagem: string;
  urgencia: "baixa" | "media" | "alta";
}

interface Evento {
  minuto: number;
  tipo: "gol" | "cartao" | "escanteio" | "falta" | "substituicao";
  time: string;
  jogador: string;
  detalhe: string;
}

interface Jogador {
  nome: string;
  numero: number;
  posicao: string;
  gols: number;
  cartoes: number;
  passes: number;
  passes_acertos: number;
  chutes: number;
  dribles: number;
  quente: boolean;
  indisciplinado: boolean;
}

const mockAlertas: Alerta[] = [
  {
    id: 1,
    tipo: "gol",
    minuto: 25,
    mensagem: "⚽ GOL! Time A marcou",
    urgencia: "alta",
  },
  {
    id: 2,
    tipo: "cartao",
    minuto: 15,
    mensagem: "🟨 Cartão amarelo para Jogador B",
    urgencia: "media",
  },
  {
    id: 3,
    tipo: "pressao",
    minuto: 20,
    mensagem: "📈 Pressão aumentou para 65%",
    urgencia: "media",
  },
  {
    id: 4,
    tipo: "odd",
    minuto: 18,
    mensagem: "💰 Odd de Over 2.5 caiu para 1.55",
    urgencia: "baixa",
  },
];

const mockEventos: Evento[] = [
  {
    minuto: 25,
    tipo: "gol",
    time: "Time A",
    jogador: "Jogador A",
    detalhe: "Pênalti",
  },
  {
    minuto: 15,
    tipo: "cartao",
    time: "Time B",
    jogador: "Jogador B",
    detalhe: "Cartão Amarelo",
  },
  {
    minuto: 10,
    tipo: "escanteio",
    time: "Time A",
    jogador: "-",
    detalhe: "Escanteio",
  },
  {
    minuto: 5,
    tipo: "falta",
    time: "Time B",
    jogador: "Jogador C",
    detalhe: "Falta tática",
  },
];

const mockJogadoresQuentes: Jogador[] = [
  {
    nome: "Jogador A",
    numero: 10,
    posicao: "Atacante",
    gols: 1,
    cartoes: 0,
    passes: 18,
    passes_acertos: 15,
    chutes: 4,
    dribles: 3,
    quente: true,
    indisciplinado: false,
  },
  {
    nome: "Jogador D",
    numero: 7,
    posicao: "Meia",
    gols: 0,
    cartoes: 0,
    passes: 25,
    passes_acertos: 22,
    chutes: 2,
    dribles: 5,
    quente: true,
    indisciplinado: false,
  },
];

const mockJogadoresIndisciplinados: Jogador[] = [
  {
    nome: "Jogador B",
    numero: 4,
    posicao: "Defensor",
    gols: 0,
    cartoes: 1,
    passes: 15,
    passes_acertos: 12,
    chutes: 0,
    dribles: 1,
    quente: false,
    indisciplinado: true,
  },
  {
    nome: "Jogador E",
    numero: 8,
    posicao: "Meia",
    gols: 0,
    cartoes: 1,
    passes: 20,
    passes_acertos: 16,
    chutes: 1,
    dribles: 2,
    quente: false,
    indisciplinado: true,
  },
];

export default function MatchCenterPRO() {
  const [alertas, setAlertas] = useState<Alerta[]>(mockAlertas);
  const [minutoAtual, setMinutoAtual] = useState(25);

  // Simular atualização de minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setMinutoAtual((prev) => (prev < 90 ? prev + 1 : prev));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* HEADER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Match Center</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Análise completa do jogo em tempo real
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{minutoAtual}'</div>
            <Badge className="bg-red-500 animate-pulse">AO VIVO</Badge>
          </div>
        </div>

        {/* PLACAR */}
        <Surface variant="elevated" padding="lg" className="text-center">
          <div className="grid grid-cols-3 gap-4 items-center">
            <div>
              <p className="text-lg font-bold">Time A</p>
              <p className="text-4xl">🔵</p>
            </div>
            <div>
              <p className="text-5xl font-bold">1 - 0</p>
              <p className="text-sm text-muted-foreground">{minutoAtual}'</p>
            </div>
            <div>
              <p className="text-lg font-bold">Time B</p>
              <p className="text-4xl">🔴</p>
            </div>
          </div>
        </Surface>

        {/* KPIs */}
        <Grid cols={4} gap="md">
          <KPI
            label="Posse"
            value="55% vs 45%"
            icon="⚽"
            color="info"
            trend="neutral"
          />
          <KPI
            label="xG"
            value="1.2 vs 0.8"
            icon="📊"
            color="success"
            trend="up"
          />
          <KPI
            label="Intensidade"
            value="65°"
            icon="🔥"
            color="warning"
            trend="up"
          />
          <KPI
            label="Confiança"
            value="78%"
            icon="✅"
            color="success"
            trend="up"
          />
        </Grid>
      </div>

      {/* ALERTAS EM TEMPO REAL */}
      <Surface variant="flat" padding="md" className="bg-red-50 dark:bg-red-950 border-l-4 border-l-red-500">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="font-semibold text-red-900 dark:text-red-100">
              Alertas em Tempo Real
            </p>
            <div className="space-y-1">
              {alertas.slice(0, 3).map((alerta) => (
                <div
                  key={alerta.id}
                  className="text-sm flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded"
                >
                  <span>{alerta.mensagem}</span>
                  <Badge
                    variant={
                      alerta.urgencia === "alta"
                        ? "destructive"
                        : alerta.urgencia === "media"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs"
                  >
                    {alerta.minuto}'
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Surface>

      {/* ABAS */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="quentes">🔥 Quentes</TabsTrigger>
          <TabsTrigger value="indisciplinados">⚠️ Indisciplina</TabsTrigger>
          <TabsTrigger value="lineups">Escalações</TabsTrigger>
        </TabsList>

        {/* TIMELINE */}
        <TabsContent value="timeline" className="space-y-3">
          {mockEventos.map((evento, idx) => (
            <Surface key={idx} variant="flat" padding="md">
              <div className="flex items-start gap-3">
                <div className="text-center flex-shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {evento.minuto}'
                  </Badge>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {evento.tipo === "gol" && <span className="text-lg">⚽</span>}
                    {evento.tipo === "cartao" && <span className="text-lg">🟨</span>}
                    {evento.tipo === "escanteio" && <span className="text-lg">🚩</span>}
                    {evento.tipo === "falta" && <span className="text-lg">⚠️</span>}
                    <span className="font-semibold">{evento.jogador}</span>
                    <span className="text-xs text-muted-foreground">
                      ({evento.time})
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {evento.detalhe}
                  </p>
                </div>
              </div>
            </Surface>
          ))}
        </TabsContent>

        {/* STATS */}
        <TabsContent value="stats" className="space-y-4">
          <Surface variant="flat" padding="md">
            <p className="font-semibold mb-3">Posse de Bola</p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Time A</span>
                  <span className="font-bold">55%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded h-2">
                  <div
                    className="bg-blue-500 h-2 rounded"
                    style={{ width: "55%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Time B</span>
                  <span className="font-bold">45%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded h-2">
                  <div
                    className="bg-red-500 h-2 rounded"
                    style={{ width: "45%" }}
                  ></div>
                </div>
              </div>
            </div>
          </Surface>

          <Grid cols={2} gap="md">
            <Surface variant="flat" padding="md">
              <p className="text-sm text-muted-foreground mb-2">Chutes</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Time A</span>
                  <span className="font-bold">8 (3)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Time B</span>
                  <span className="font-bold">5 (2)</span>
                </div>
              </div>
            </Surface>

            <Surface variant="flat" padding="md">
              <p className="text-sm text-muted-foreground mb-2">Escanteios</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Time A</span>
                  <span className="font-bold">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Time B</span>
                  <span className="font-bold">2</span>
                </div>
              </div>
            </Surface>

            <Surface variant="flat" padding="md">
              <p className="text-sm text-muted-foreground mb-2">Cartões</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Time A</span>
                  <span className="font-bold">0🟨 0🟥</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Time B</span>
                  <span className="font-bold">1🟨 0🟥</span>
                </div>
              </div>
            </Surface>

            <Surface variant="flat" padding="md">
              <p className="text-sm text-muted-foreground mb-2">Faltas</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Time A</span>
                  <span className="font-bold">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Time B</span>
                  <span className="font-bold">4</span>
                </div>
              </div>
            </Surface>
          </Grid>
        </TabsContent>

        {/* JOGADORES QUENTES */}
        <TabsContent value="quentes" className="space-y-3">
          <SectionTitle
            title="🔥 Jogadores em Forma"
            subtitle="Desempenho excepcional no jogo"
            icon={Flame}
          />
          {mockJogadoresQuentes.map((jogador) => (
            <Surface
              key={jogador.numero}
              variant="flat"
              padding="md"
              className="border-l-4 border-l-orange-500"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">
                      #{jogador.numero} {jogador.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {jogador.posicao}
                    </p>
                  </div>
                  <Badge className="bg-orange-500">Quente</Badge>
                </div>
                <Grid cols={4} gap="sm">
                  <div className="text-center p-1 bg-slate-100 dark:bg-slate-800 rounded">
                    <p className="text-lg font-bold">{jogador.gols}</p>
                    <p className="text-xs">Gols</p>
                  </div>
                  <div className="text-center p-1 bg-slate-100 dark:bg-slate-800 rounded">
                    <p className="text-lg font-bold">{jogador.chutes}</p>
                    <p className="text-xs">Chutes</p>
                  </div>
                  <div className="text-center p-1 bg-slate-100 dark:bg-slate-800 rounded">
                    <p className="text-lg font-bold">{jogador.dribles}</p>
                    <p className="text-xs">Dribles</p>
                  </div>
                  <div className="text-center p-1 bg-slate-100 dark:bg-slate-800 rounded">
                    <p className="text-lg font-bold">
                      {Math.round(
                        (jogador.passes_acertos / jogador.passes) * 100
                      )}
                      %
                    </p>
                    <p className="text-xs">Acerto</p>
                  </div>
                </Grid>
              </div>
            </Surface>
          ))}
        </TabsContent>

        {/* INDISCIPLINADOS */}
        <TabsContent value="indisciplinados" className="space-y-3">
          <SectionTitle
            title="⚠️ Risco Disciplinar"
            subtitle="Jogadores com cartões ou comportamento arriscado"
            icon={AlertCircle}
          />
          {mockJogadoresIndisciplinados.map((jogador) => (
            <Surface
              key={jogador.numero}
              variant="flat"
              padding="md"
              className="border-l-4 border-l-red-500"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">
                      #{jogador.numero} {jogador.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {jogador.posicao}
                    </p>
                  </div>
                  <Badge className="bg-red-500">
                    {jogador.cartoes} 🟨
                  </Badge>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400">
                  ⚠️ Alto risco de segundo cartão
                </p>
              </div>
            </Surface>
          ))}
        </TabsContent>

        {/* ESCALAÇÕES */}
        <TabsContent value="lineups" className="space-y-4">
          <Surface variant="flat" padding="md">
            <p className="font-semibold mb-3">Time A (4-3-3)</p>
            <div className="space-y-2 text-sm">
              <p>🥅 Goleiro</p>
              <p>🛡️ Defensor 1 • Defensor 2 • Defensor 3 • Defensor 4</p>
              <p>🎯 Meia 1 • Meia 2 • Meia 3</p>
              <p>⚽ Atacante 1 • Atacante 2 • Atacante 3</p>
            </div>
          </Surface>

          <Surface variant="flat" padding="md">
            <p className="font-semibold mb-3">Time B (4-2-3-1)</p>
            <div className="space-y-2 text-sm">
              <p>🥅 Goleiro</p>
              <p>🛡️ Defensor 1 • Defensor 2 • Defensor 3 • Defensor 4</p>
              <p>🎯 Volante 1 • Volante 2</p>
              <p>⚽ Meia 1 • Meia 2 • Meia 3</p>
              <p>🔴 Atacante</p>
            </div>
          </Surface>
        </TabsContent>
      </Tabs>
    </div>
  );
}
