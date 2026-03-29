/**
 * JOGOS HOJE PRO
 * Agrupado por liga + cards compactos + drawer
 */

import React, { useState } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, Users, TrendingUp } from "lucide-react";

interface Jogo {
  id: number;
  liga: string;
  logoLiga: string;
  timeA: string;
  logoTimeA: string;
  timeB: string;
  logoTimeB: string;
  hora: string;
  horario: string;
  estadio: string;
  arbitro: string;
  xg: number;
  intensidade: number;
  confianca: number;
  mercado: string;
  odds: number;
  status: "proximo" | "adiado" | "suspenso";
}

const mockJogos: Jogo[] = [
  {
    id: 1,
    liga: "Premier League",
    logoLiga: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    timeA: "Time A",
    logoTimeA: "🔵",
    timeB: "Time B",
    logoTimeB: "🔴",
    hora: "15:00",
    horario: "em 2 horas",
    estadio: "Estádio A",
    arbitro: "Árbitro 1",
    xg: 1.5,
    intensidade: 72,
    confianca: 78,
    mercado: "Over 2.5",
    odds: 1.65,
    status: "proximo",
  },
  {
    id: 2,
    liga: "Premier League",
    logoLiga: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    timeA: "Time C",
    logoTimeA: "⚪",
    timeB: "Time D",
    logoTimeB: "🟡",
    hora: "17:30",
    horario: "em 4 horas",
    estadio: "Estádio B",
    arbitro: "Árbitro 2",
    xg: 1.2,
    intensidade: 65,
    confianca: 72,
    mercado: "1x2",
    odds: 1.85,
    status: "proximo",
  },
  {
    id: 3,
    liga: "La Liga",
    logoLiga: "🇪🇸",
    timeA: "Time E",
    logoTimeA: "🔵",
    timeB: "Time F",
    logoTimeB: "🟢",
    hora: "16:00",
    horario: "em 3 horas",
    estadio: "Estádio C",
    arbitro: "Árbitro 3",
    xg: 1.8,
    intensidade: 80,
    confianca: 85,
    mercado: "Gol Time E",
    odds: 2.10,
    status: "proximo",
  },
  {
    id: 4,
    liga: "La Liga",
    logoLiga: "🇪🇸",
    timeA: "Time G",
    logoTimeA: "🟣",
    timeB: "Time H",
    logoTimeB: "🟠",
    hora: "18:00",
    horario: "em 5 horas",
    estadio: "Estádio D",
    arbitro: "Árbitro 4",
    xg: 1.3,
    intensidade: 68,
    confianca: 75,
    mercado: "Empate",
    odds: 3.50,
    status: "proximo",
  },
  {
    id: 5,
    liga: "Bundesliga",
    logoLiga: "🇩🇪",
    timeA: "Time I",
    logoTimeA: "🟡",
    timeB: "Time J",
    logoTimeB: "⚫",
    hora: "19:30",
    horario: "em 6 horas",
    estadio: "Estádio E",
    arbitro: "Árbitro 5",
    xg: 1.6,
    intensidade: 75,
    confianca: 80,
    mercado: "Over 1.5",
    odds: 1.45,
    status: "proximo",
  },
];

export default function JogosHojePRO() {
  const [selectedJogo, setSelectedJogo] = useState<Jogo | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Agrupar por liga
  const jogosPorLiga = mockJogos.reduce(
    (acc, jogo) => {
      if (!acc[jogo.liga]) acc[jogo.liga] = [];
      acc[jogo.liga].push(jogo);
      return acc;
    },
    {} as Record<string, Jogo[]>
  );

  const totalJogos = mockJogos.length;
  const totalProximos = mockJogos.filter((j) => j.status === "proximo").length;
  const confiancaMedia = Math.round(
    mockJogos.reduce((sum, j) => sum + j.confianca, 0) / mockJogos.length
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* HEADER */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Jogos Hoje</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Todos os jogos agrupados por liga com análises
          </p>
        </div>

        {/* KPIs */}
        <Grid cols={4} gap="md">
          <KPI
            label="Total de Jogos"
            value={totalJogos}
            icon="⚽"
            color="info"
            trend="neutral"
          />
          <KPI
            label="Próximos"
            value={totalProximos}
            icon="⏰"
            color="info"
            trend="up"
          />
          <KPI
            label="Confiança Média"
            value={`${confiancaMedia}%`}
            icon="📊"
            color="success"
            trend="up"
          />
          <KPI
            label="Oportunidades"
            value={mockJogos.filter((j) => j.confianca >= 75).length}
            icon="🎯"
            color="success"
            trend="up"
          />
        </Grid>
      </div>

      {/* JOGOS POR LIGA */}
      <div className="space-y-8">
        {Object.entries(jogosPorLiga).map(([liga, jogos]) => (
          <div key={liga} className="space-y-4">
            <SectionTitle
              title={liga}
              subtitle={`${jogos.length} jogo${jogos.length > 1 ? "s" : ""}`}
              icon={Clock}
            />

            <div className="space-y-3">
              {jogos.map((jogo) => (
                <Surface
                  key={jogo.id}
                  variant="outline"
                  padding="md"
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => {
                    setSelectedJogo(jogo);
                    setIsDrawerOpen(true);
                  }}
                >
                  <div className="grid grid-cols-12 gap-3 items-center">
                    {/* Hora */}
                    <div className="col-span-1">
                      <div className="font-bold text-sm">{jogo.hora}</div>
                      <div className="text-xs text-muted-foreground">
                        {jogo.horario}
                      </div>
                    </div>

                    {/* Times */}
                    <div className="col-span-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-lg">{jogo.logoTimeA}</span>
                          <span className="text-sm font-semibold truncate">
                            {jogo.timeA}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">vs</span>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="text-sm font-semibold truncate">
                            {jogo.timeB}
                          </span>
                          <span className="text-lg">{jogo.logoTimeB}</span>
                        </div>
                      </div>
                    </div>

                    {/* Estádio */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{jogo.estadio}</span>
                      </div>
                    </div>

                    {/* Métricas */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        <Pill variant="info" size="sm">
                          {jogo.intensidade}°
                        </Pill>
                        <Pill
                          variant={
                            jogo.confianca >= 80
                              ? "success"
                              : jogo.confianca >= 70
                                ? "warning"
                                : "default"
                          }
                          size="sm"
                        >
                          {jogo.confianca}%
                        </Pill>
                      </div>
                    </div>

                    {/* Mercado */}
                    <div className="col-span-2">
                      <div className="text-right">
                        <div className="font-bold text-sm">{jogo.odds}</div>
                        <div className="text-xs text-muted-foreground">
                          {jogo.mercado}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      {jogo.status === "proximo" && (
                        <Badge variant="outline">Próximo</Badge>
                      )}
                      {jogo.status === "adiado" && (
                        <Badge variant="secondary">Adiado</Badge>
                      )}
                      {jogo.status === "suspenso" && (
                        <Badge variant="destructive">Suspenso</Badge>
                      )}
                    </div>
                  </div>
                </Surface>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* DRAWER DE DETALHES */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:w-96">
          {selectedJogo && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>Detalhes do Jogo</SheetTitle>
              </SheetHeader>

              {/* Header */}
              <Surface variant="flat" padding="lg">
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {selectedJogo.liga}
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-lg font-bold">{selectedJogo.timeA}</p>
                      <p className="text-3xl">{selectedJogo.logoTimeA}</p>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline">{selectedJogo.hora}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedJogo.horario}
                      </p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-lg font-bold">{selectedJogo.timeB}</p>
                      <p className="text-3xl">{selectedJogo.logoTimeB}</p>
                    </div>
                  </div>
                </div>
              </Surface>

              {/* Informações */}
              <Surface variant="flat" padding="md">
                <Stack gap="sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Estádio
                    </span>
                    <span className="font-semibold">{selectedJogo.estadio}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Árbitro
                    </span>
                    <span className="font-semibold">{selectedJogo.arbitro}</span>
                  </div>
                </Stack>
              </Surface>

              {/* Abas */}
              <Tabs defaultValue="analise" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="analise">Análise</TabsTrigger>
                  <TabsTrigger value="odds">Odds</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                </TabsList>

                {/* ANÁLISE */}
                <TabsContent value="analise" className="space-y-4">
                  <Surface variant="flat" padding="md">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                        <div className="text-lg font-bold">
                          {selectedJogo.xg.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">xG</div>
                      </div>
                      <div className="text-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                        <div className="text-lg font-bold">
                          {selectedJogo.intensidade}°
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Intensidade
                        </div>
                      </div>
                      <div className="text-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                        <div className="text-lg font-bold">
                          {selectedJogo.confianca}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Confiança
                        </div>
                      </div>
                      <div className="text-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                        <div className="text-lg font-bold">
                          {selectedJogo.odds}
                        </div>
                        <div className="text-xs text-muted-foreground">Odds</div>
                      </div>
                    </div>
                  </Surface>

                  <Surface variant="flat" padding="md">
                    <p className="text-sm font-semibold mb-2">Mercado Principal</p>
                    <Badge className="bg-blue-500">{selectedJogo.mercado}</Badge>
                  </Surface>
                </TabsContent>

                {/* ODDS */}
                <TabsContent value="odds" className="space-y-3">
                  <Surface variant="flat" padding="md">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Vitória {selectedJogo.timeA}</span>
                        <span className="font-bold">1.85</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Empate</span>
                        <span className="font-bold">3.50</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vitória {selectedJogo.timeB}</span>
                        <span className="font-bold">2.10</span>
                      </div>
                    </div>
                  </Surface>

                  <Surface variant="flat" padding="md">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Over 2.5 Gols</span>
                        <span className="font-bold">1.65</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Under 2.5 Gols</span>
                        <span className="font-bold">2.20</span>
                      </div>
                    </div>
                  </Surface>
                </TabsContent>

                {/* HISTÓRICO */}
                <TabsContent value="historico" className="space-y-3">
                  <Surface variant="flat" padding="md">
                    <p className="text-sm font-semibold mb-2">
                      {selectedJogo.timeA}
                    </p>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p>Últimos 5: V-V-E-D-V (3 vitórias)</p>
                      <p>Gols: 12 em 5 jogos (2.4/jogo)</p>
                      <p>Posse: 58% média</p>
                    </div>
                  </Surface>

                  <Surface variant="flat" padding="md">
                    <p className="text-sm font-semibold mb-2">
                      {selectedJogo.timeB}
                    </p>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p>Últimos 5: V-E-D-V-E (2 vitórias)</p>
                      <p>Gols: 8 em 5 jogos (1.6/jogo)</p>
                      <p>Posse: 42% média</p>
                    </div>
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
