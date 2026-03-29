/**
 * AO VIVO PRO
 * Tela densa de jogos ao vivo com Hot Now cards, filtros, drawer
 */

import React, { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Surface,
  Pill,
  KPI,
  TeamChip,
  SectionTitle,
  Skeleton,
  Toast,
  Grid,
  Stack,
} from "@/components/ui/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Filter,
  X,
} from "lucide-react";

interface Match {
  id: number;
  liga: string;
  timeA: string;
  timeB: string;
  placar: string;
  minuto: number;
  xg: number;
  intensidade: number;
  confianca: number;
  risco: "baixo" | "medio" | "alto";
  status: "ao-vivo" | "proximo" | "encerrado";
  pressaoCasa: number;
  pressaoFora: number;
  mercado: string;
  estadio: string;
}

const mockMatches: Match[] = [
  {
    id: 1,
    liga: "Premier League",
    timeA: "Time A",
    timeB: "Time B",
    placar: "1 - 0",
    minuto: 25,
    xg: 1.2,
    intensidade: 65,
    confianca: 75,
    risco: "baixo",
    status: "ao-vivo",
    pressaoCasa: 55,
    pressaoFora: 45,
    mercado: "1x2",
    estadio: "Estádio A",
  },
  {
    id: 2,
    liga: "La Liga",
    timeA: "Time C",
    timeB: "Time D",
    placar: "2 - 1",
    minuto: 45,
    xg: 1.8,
    intensidade: 72,
    confianca: 82,
    risco: "medio",
    status: "ao-vivo",
    pressaoCasa: 60,
    pressaoFora: 40,
    mercado: "Mais de 1.5 gols",
    estadio: "Estádio B",
  },
  {
    id: 3,
    liga: "Bundesliga",
    timeA: "Time E",
    timeB: "Time F",
    placar: "0 - 0",
    minuto: 65,
    xg: 0.9,
    intensidade: 58,
    confianca: 62,
    risco: "alto",
    status: "ao-vivo",
    pressaoCasa: 48,
    pressaoFora: 52,
    mercado: "Menos de 2.5 gols",
    estadio: "Estádio C",
  },
  {
    id: 4,
    liga: "Serie A",
    timeA: "Time G",
    timeB: "Time H",
    placar: "1 - 1",
    minuto: 30,
    xg: 1.5,
    intensidade: 70,
    confianca: 78,
    risco: "medio",
    status: "ao-vivo",
    pressaoCasa: 52,
    pressaoFora: 48,
    mercado: "Empate",
    estadio: "Estádio D",
  },
];

export default function AoVivoPRO() {
  const [status, setStatus] = useState<"ao-vivo" | "proximo" | "encerrado">(
    "ao-vivo"
  );
  const [liga, setLiga] = useState<string>("todas");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filtrar matches
  const filteredMatches = useMemo(() => {
    return mockMatches.filter((m) => {
      const statusMatch = m.status === status;
      const ligaMatch = liga === "todas" || m.liga.toLowerCase().includes(liga.toLowerCase());
      return statusMatch && ligaMatch;
    });
  }, [status, liga]);

  // Auto-refresh a cada 10s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      // Aqui virá a chamada real da API
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const ligas = ["todas", ...new Set(mockMatches.map((m) => m.liga))];
  const totalAoVivo = mockMatches.filter((m) => m.status === "ao-vivo").length;
  const totalOportunidades = mockMatches.filter(
    (m) => m.confianca >= 75
  ).length;
  const totalAlertas = mockMatches.filter((m) => m.risco === "alto").length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* HEADER COM KPIs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ao Vivo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Todos os jogos com filtros de liga, data e status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Pill
              variant={autoRefresh ? "success" : "default"}
              size="sm"
              icon={autoRefresh ? "🔄" : "⏸"}
            >
              {autoRefresh ? "Auto-refresh 10s" : "Pausado"}
            </Pill>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Pausar" : "Retomar"}
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <Grid cols={4} gap="md">
          <KPI
            label="Ao Vivo"
            value={totalAoVivo}
            icon="🔴"
            color="danger"
            trend="up"
          />
          <KPI
            label="Oportunidades"
            value={totalOportunidades}
            icon="🎯"
            color="success"
            trend="up"
          />
          <KPI
            label="Alertas"
            value={totalAlertas}
            icon="⚠️"
            color="warning"
            trend="neutral"
          />
          <KPI
            label="Total"
            value={mockMatches.length}
            icon="📊"
            color="info"
            trend="neutral"
          />
        </Grid>
      </div>

      {/* FILTROS */}
      <Surface variant="flat" padding="md">
        <Stack direction="row" gap="md" align="center">
          {/* Status */}
          <div className="flex gap-2">
            <Button
              variant={status === "ao-vivo" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus("ao-vivo")}
              className="gap-2"
            >
              <Flame className="w-4 h-4" />
              🔴 Ao Vivo
            </Button>
            <Button
              variant={status === "proximo" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus("proximo")}
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              ⏰ Próximos
            </Button>
            <Button
              variant={status === "encerrado" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus("encerrado")}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              ✓ Encerrados
            </Button>
          </div>

          {/* Liga */}
          <Select value={liga} onValueChange={setLiga}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ligas.map((l) => (
                <SelectItem key={l} value={l}>
                  {l === "todas" ? "Todas as Ligas" : l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Data */}
          <Input type="date" className="w-40" />

          {/* Resumo */}
          <div className="ml-auto text-sm text-muted-foreground">
            {filteredMatches.length} jogos encontrados • Auto-refresh 10s
          </div>
        </Stack>
      </Surface>

      {/* TABELA DE JOGOS */}
      {filteredMatches.length === 0 ? (
        <Surface variant="flat" padding="lg" className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto opacity-50 mb-4" />
          <p className="text-muted-foreground">
            Nenhum jogo encontrado com estes filtros
          </p>
        </Surface>
      ) : (
        <div className="space-y-3">
          {/* Header da Tabela */}
          <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
            <div className="col-span-3">Liga</div>
            <div className="col-span-2">Placar</div>
            <div className="col-span-1">Min</div>
            <div className="col-span-1">xG</div>
            <div className="col-span-1">Int</div>
            <div className="col-span-1">Conf</div>
            <div className="col-span-1">Risco</div>
            <div className="col-span-1">Status</div>
          </div>

          {/* Linhas */}
          {filteredMatches.map((match) => (
            <Surface
              key={match.id}
              variant="outline"
              padding="md"
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => {
                setSelectedMatch(match);
                setIsDrawerOpen(true);
              }}
            >
              <div className="grid grid-cols-12 gap-3 items-center">
                {/* Liga */}
                <div className="col-span-3">
                  <div className="font-semibold text-sm">{match.liga}</div>
                  <div className="text-xs text-muted-foreground">
                    {match.timeA} vs {match.timeB}
                  </div>
                </div>

                {/* Placar */}
                <div className="col-span-2">
                  <div className="text-lg font-bold">{match.placar}</div>
                </div>

                {/* Minuto */}
                <div className="col-span-1 text-sm font-medium">
                  {match.minuto}'
                </div>

                {/* xG */}
                <div className="col-span-1 text-sm">
                  {match.xg.toFixed(1)}
                </div>

                {/* Intensidade */}
                <div className="col-span-1 text-sm">
                  {match.intensidade}°
                </div>

                {/* Confiança */}
                <div className="col-span-1">
                  <Pill
                    variant={
                      match.confianca >= 80
                        ? "success"
                        : match.confianca >= 70
                          ? "warning"
                          : "default"
                    }
                    size="sm"
                  >
                    {match.confianca}%
                  </Pill>
                </div>

                {/* Risco */}
                <div className="col-span-1">
                  <Pill
                    variant={
                      match.risco === "alto"
                        ? "danger"
                        : match.risco === "medio"
                          ? "warning"
                          : "success"
                    }
                    size="sm"
                  >
                    {match.risco}
                  </Pill>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  {match.status === "ao-vivo" && (
                    <Pill variant="danger" size="sm">
                      🔴 AO VIVO
                    </Pill>
                  )}
                  {match.status === "proximo" && (
                    <Pill variant="info" size="sm">
                      ⏰ Próximo
                    </Pill>
                  )}
                  {match.status === "encerrado" && (
                    <Pill variant="default" size="sm">
                      ✓ Encerrado
                    </Pill>
                  )}
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}

      {/* DRAWER DE DETALHES */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:w-96">
          {selectedMatch && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>Detalhes da Partida</SheetTitle>
              </SheetHeader>

              {/* Placar Grande */}
              <Surface variant="flat" padding="lg" className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedMatch.liga}
                </p>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-2">
                      {selectedMatch.timeA}
                    </p>
                    <p className="text-3xl font-bold">
                      {selectedMatch.placar.split(" - ")[0]}
                    </p>
                  </div>
                  <div className="text-center">
                    <Badge variant="destructive" className="mb-2">
                      {selectedMatch.minuto}' AO VIVO
                    </Badge>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-semibold text-sm mb-2">
                      {selectedMatch.timeB}
                    </p>
                    <p className="text-3xl font-bold">
                      {selectedMatch.placar.split(" - ")[1]}
                    </p>
                  </div>
                </div>
              </Surface>

              {/* Abas */}
              <Tabs defaultValue="resumo" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="resumo">Resumo</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="lineups">Lineups</TabsTrigger>
                </TabsList>

                {/* RESUMO */}
                <TabsContent value="resumo" className="space-y-4">
                  <Surface variant="flat" padding="md">
                    <Stack gap="sm">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Mercado
                        </span>
                        <span className="font-semibold">
                          {selectedMatch.mercado}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Risco
                        </span>
                        <Pill
                          variant={
                            selectedMatch.risco === "alto"
                              ? "danger"
                              : selectedMatch.risco === "medio"
                                ? "warning"
                                : "success"
                          }
                          size="sm"
                        >
                          {selectedMatch.risco}
                        </Pill>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Intensidade
                        </span>
                        <span className="font-semibold">
                          {selectedMatch.intensidade}°
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Confiança
                        </span>
                        <span className="font-semibold">
                          {selectedMatch.confianca}%
                        </span>
                      </div>
                    </Stack>
                  </Surface>

                  {/* Pressão */}
                  <Surface variant="flat" padding="md">
                    <p className="text-sm font-semibold mb-3">Pressão</p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Casa</span>
                          <span>{selectedMatch.pressaoCasa}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${selectedMatch.pressaoCasa}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Fora</span>
                          <span>{selectedMatch.pressaoFora}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{
                              width: `${selectedMatch.pressaoFora}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Surface>
                </TabsContent>

                {/* STATS */}
                <TabsContent value="stats" className="space-y-4">
                  <Surface variant="flat" padding="md">
                    <Stack gap="sm">
                      <div className="flex justify-between">
                        <span>xG</span>
                        <span className="font-semibold">
                          {selectedMatch.xg.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Posse</span>
                        <span className="font-semibold">55% vs 45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Escanteios</span>
                        <span className="font-semibold">3 vs 2</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cartões</span>
                        <span className="font-semibold">🟨1 vs 🟨0</span>
                      </div>
                    </Stack>
                  </Surface>
                </TabsContent>

                {/* TIMELINE */}
                <TabsContent value="timeline" className="space-y-2">
                  <Surface variant="flat" padding="md">
                    <p className="text-sm">25' - Gol: {selectedMatch.timeA}</p>
                  </Surface>
                  <Surface variant="flat" padding="md">
                    <p className="text-sm">15' - Cartão Amarelo: Jogador</p>
                  </Surface>
                </TabsContent>

                {/* LINEUPS */}
                <TabsContent value="lineups" className="space-y-2">
                  <Surface variant="flat" padding="md">
                    <p className="text-sm font-semibold mb-2">
                      {selectedMatch.timeA} - 4-3-3
                    </p>
                    <p className="text-xs text-muted-foreground">
                      GK: Goleiro | DEF: 4 | MID: 3 | ATK: 3
                    </p>
                  </Surface>
                  <Surface variant="flat" padding="md">
                    <p className="text-sm font-semibold mb-2">
                      {selectedMatch.timeB} - 4-2-3-1
                    </p>
                    <p className="text-xs text-muted-foreground">
                      GK: Goleiro | DEF: 4 | MID: 2 | ATK: 3
                    </p>
                  </Surface>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
