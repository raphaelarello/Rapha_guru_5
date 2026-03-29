/**
 * DESTAQUES PRO
 * Grid premium de oportunidades + UltraGold Top 5 + Compare
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Flame, TrendingUp, AlertCircle, Target, Zap } from "lucide-react";

interface Destaque {
  id: number;
  titulo: string;
  descricao: string;
  confianca: number;
  ev: number;
  risco: "baixo" | "medio" | "alto";
  mercado: string;
  odds: number;
  tipo: "entrada-forte" | "entrada-valor" | "pressao" | "escanteios" | "disciplina";
  liga: string;
  timeA: string;
  timeB: string;
  placar: string;
  minuto: number;
  motivo: string;
  fortalece: string[];
  enfraquece: string[];
  janela: string;
}

const mockDestaques: Destaque[] = [
  {
    id: 1,
    titulo: "Over 2.5 Gols",
    descricao: "Premier League • Time A vs Time B",
    confianca: 88,
    ev: 1.25,
    risco: "baixo",
    mercado: "Mais de 2.5 gols",
    odds: 1.65,
    tipo: "entrada-forte",
    liga: "Premier League",
    timeA: "Time A",
    timeB: "Time B",
    placar: "1 - 0",
    minuto: 25,
    motivo: "88% Over 2.5 • pressão alta + defesa vulnerável + ritmo forte",
    fortalece: ["Posse 55%", "xG 1.2", "3 chutes no gol", "Intensidade 65°"],
    enfraquece: ["Goleiro em forma", "Defesa compacta"],
    janela: "Próximos 10 min",
  },
  {
    id: 2,
    titulo: "Gol Time A",
    descricao: "La Liga • Time C vs Time D",
    confianca: 82,
    ev: 1.15,
    risco: "medio",
    mercado: "Gol Time A",
    odds: 1.85,
    tipo: "entrada-valor",
    liga: "La Liga",
    timeA: "Time C",
    timeB: "Time D",
    placar: "2 - 1",
    minuto: 45,
    motivo: "82% Gol • ataque em ritmo + defesa cansada",
    fortalece: ["Posse 60%", "xG 1.8", "5 chutes", "Pressão 60%"],
    enfraquece: ["Defensor suspenso"],
    janela: "Próximos 15 min",
  },
  {
    id: 3,
    titulo: "Escanteio Próximo",
    descricao: "Bundesliga • Time E vs Time F",
    confianca: 75,
    ev: 1.08,
    risco: "medio",
    mercado: "Escanteio",
    odds: 1.45,
    tipo: "escanteios",
    liga: "Bundesliga",
    timeA: "Time E",
    timeB: "Time F",
    placar: "0 - 0",
    minuto: 65,
    motivo: "75% Escanteio • 3 escanteios nos últimos 10 min",
    fortalece: ["Ritmo acelerado", "Pressão lateral", "Defesa alta"],
    enfraquece: ["Defesa bem posicionada"],
    janela: "Próximos 5 min",
  },
  {
    id: 4,
    titulo: "Cartão Amarelo",
    descricao: "Serie A • Time G vs Time H",
    confianca: 72,
    ev: 1.05,
    risco: "alto",
    mercado: "Cartão Amarelo",
    odds: 1.55,
    tipo: "disciplina",
    liga: "Serie A",
    timeA: "Time G",
    timeB: "Time H",
    placar: "1 - 1",
    minuto: 30,
    motivo: "72% Cartão • 2 faltas em 5 min + árbitro rigoroso",
    fortalece: ["Árbitro rigoroso", "Ritmo acelerado", "Tensão no jogo"],
    enfraquece: ["Jogador com 1 cartão"],
    janela: "Próximos 8 min",
  },
  {
    id: 5,
    titulo: "Momento de Pressão",
    descricao: "Ligue 1 • Time I vs Time J",
    confianca: 80,
    ev: 1.20,
    risco: "medio",
    mercado: "Gol nos próximos 10 min",
    odds: 2.10,
    tipo: "pressao",
    liga: "Ligue 1",
    timeA: "Time I",
    timeB: "Time J",
    placar: "0 - 0",
    minuto: 35,
    motivo: "80% Gol • pressão máxima + defesa vulnerável",
    fortalece: ["Pressão 70%", "xG 1.5", "Ritmo forte"],
    enfraquece: ["Goleiro em forma"],
    janela: "Próximos 10 min",
  },
];

const tipoConfig = {
  "entrada-forte": { label: "Entrada Forte", color: "bg-green-500" },
  "entrada-valor": { label: "Entrada de Valor", color: "bg-blue-500" },
  pressao: { label: "Momento de Pressão", color: "bg-orange-500" },
  escanteios: { label: "Cenário de Escanteios", color: "bg-purple-500" },
  disciplina: { label: "Risco Disciplinar", color: "bg-red-500" },
};

export default function DestaquesPRO() {
  const [selectedDestaque, setSelectedDestaque] = useState<Destaque | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>("todos");

  const filteredDestaques = mockDestaques.filter((d) =>
    filterTipo === "todos" ? true : d.tipo === filterTipo
  );

  const ultraGold = mockDestaques.slice(0, 5);
  const totalConfianca = Math.round(
    mockDestaques.reduce((sum, d) => sum + d.confianca, 0) / mockDestaques.length
  );
  const totalEV = (
    mockDestaques.reduce((sum, d) => sum + d.ev, 0) / mockDestaques.length
  ).toFixed(2);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* HEADER */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Destaques</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gold Picks + mercados + médias de times/jogadores
          </p>
        </div>

        {/* KPIs */}
        <Grid cols={4} gap="md">
          <KPI
            label="Picks Ativos"
            value={mockDestaques.length}
            icon="🎯"
            color="success"
            trend="up"
          />
          <KPI
            label="Confiança Média"
            value={`${totalConfianca}%`}
            icon="📊"
            color="info"
            trend="up"
          />
          <KPI
            label="EV Médio"
            value={totalEV}
            icon="💰"
            color="success"
            trend="up"
          />
          <KPI
            label="Taxa de Acerto"
            value="68%"
            icon="✅"
            color="success"
            trend="up"
          />
        </Grid>
      </div>

      {/* ULTRA GOLD TOP 5 */}
      <Surface variant="elevated" padding="lg">
        <SectionTitle
          title="🔥 UltraGold Top 5"
          subtitle="Oportunidades premium com maior confiança"
          icon={Flame}
        />

        <div className="space-y-3">
          {ultraGold.map((destaque, idx) => (
            <Surface
              key={destaque.id}
              variant="flat"
              padding="md"
              className="border-l-4 border-l-yellow-500 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => {
                setSelectedDestaque(destaque);
                setIsDrawerOpen(true);
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-yellow-500">#{idx + 1}</Badge>
                    <span className="font-bold text-lg">{destaque.titulo}</span>
                    <Pill
                      variant={
                        destaque.confianca >= 85
                          ? "success"
                          : destaque.confianca >= 75
                            ? "warning"
                            : "default"
                      }
                      size="sm"
                    >
                      {destaque.confianca}%
                    </Pill>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {destaque.descricao}
                  </p>
                  <p className="text-sm font-medium text-yellow-600">
                    💡 {destaque.motivo}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold">{destaque.odds}</div>
                  <div className="text-xs text-muted-foreground">Odds</div>
                  <div className="mt-2">
                    <Pill variant="success" size="sm">
                      EV {destaque.ev}
                    </Pill>
                  </div>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      </Surface>

      {/* FILTROS */}
      <Surface variant="flat" padding="md">
        <Stack direction="row" gap="md" align="center">
          <span className="text-sm font-semibold">Filtrar por tipo:</span>
          <Button
            variant={filterTipo === "todos" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterTipo("todos")}
          >
            Todos ({mockDestaques.length})
          </Button>
          {Object.entries(tipoConfig).map(([key, config]) => (
            <Button
              key={key}
              variant={filterTipo === key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterTipo(key)}
            >
              {config.label}
            </Button>
          ))}
        </Stack>
      </Surface>

      {/* GRID DE DESTAQUES */}
      <Grid cols={3} gap="md">
        {filteredDestaques.map((destaque) => (
          <Surface
            key={destaque.id}
            variant="outline"
            padding="md"
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => {
              setSelectedDestaque(destaque);
              setIsDrawerOpen(true);
            }}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Badge
                    className={`${tipoConfig[destaque.tipo as keyof typeof tipoConfig].color} mb-2`}
                  >
                    {
                      tipoConfig[destaque.tipo as keyof typeof tipoConfig]
                        .label
                    }
                  </Badge>
                  <h3 className="font-bold text-sm">{destaque.titulo}</h3>
                </div>
              </div>

              {/* Descrição */}
              <p className="text-xs text-muted-foreground">
                {destaque.descricao}
              </p>

              {/* Motivo */}
              <p className="text-xs font-medium bg-slate-100 dark:bg-slate-800 p-2 rounded">
                💡 {destaque.motivo}
              </p>

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                  <div className="text-lg font-bold">{destaque.confianca}%</div>
                  <div className="text-xs text-muted-foreground">Confiança</div>
                </div>
                <div className="text-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                  <div className="text-lg font-bold">{destaque.odds}</div>
                  <div className="text-xs text-muted-foreground">Odds</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Pill
                  variant={
                    destaque.risco === "baixo"
                      ? "success"
                      : destaque.risco === "medio"
                        ? "warning"
                        : "danger"
                  }
                  size="sm"
                >
                  {destaque.risco}
                </Pill>
                <span className="text-xs font-semibold text-green-600">
                  EV {destaque.ev}
                </span>
              </div>
            </div>
          </Surface>
        ))}
      </Grid>

      {/* DRAWER DE DETALHES */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:w-96">
          {selectedDestaque && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>Análise Completa</SheetTitle>
              </SheetHeader>

              {/* Header */}
              <Surface variant="flat" padding="lg">
                <div className="space-y-3">
                  <div>
                    <Badge
                      className={`${tipoConfig[selectedDestaque.tipo as keyof typeof tipoConfig].color} mb-2`}
                    >
                      {
                        tipoConfig[selectedDestaque.tipo as keyof typeof tipoConfig]
                          .label
                      }
                    </Badge>
                    <h2 className="text-2xl font-bold">
                      {selectedDestaque.titulo}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedDestaque.descricao}
                  </p>
                  <p className="text-sm font-medium">
                    💡 {selectedDestaque.motivo}
                  </p>
                </div>
              </Surface>

              {/* Métricas */}
              <Surface variant="flat" padding="md">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {selectedDestaque.confianca}%
                    </div>
                    <div className="text-xs text-muted-foreground">Confiança</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {selectedDestaque.odds}
                    </div>
                    <div className="text-xs text-muted-foreground">Odds</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {selectedDestaque.ev}
                    </div>
                    <div className="text-xs text-muted-foreground">EV</div>
                  </div>
                  <div className="text-center">
                    <Pill
                      variant={
                        selectedDestaque.risco === "baixo"
                          ? "success"
                          : selectedDestaque.risco === "medio"
                            ? "warning"
                            : "danger"
                      }
                      size="sm"
                    >
                      {selectedDestaque.risco}
                    </Pill>
                  </div>
                </div>
              </Surface>

              {/* Abas */}
              <Tabs defaultValue="fortalece" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="fortalece">Fortalece</TabsTrigger>
                  <TabsTrigger value="enfraquece">Enfraquece</TabsTrigger>
                </TabsList>

                <TabsContent value="fortalece" className="space-y-2">
                  {selectedDestaque.fortalece.map((item, idx) => (
                    <Surface
                      key={idx}
                      variant="flat"
                      padding="sm"
                      className="flex items-center gap-2 border-l-4 border-l-green-500"
                    >
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{item}</span>
                    </Surface>
                  ))}
                </TabsContent>

                <TabsContent value="enfraquece" className="space-y-2">
                  {selectedDestaque.enfraquece.map((item, idx) => (
                    <Surface
                      key={idx}
                      variant="flat"
                      padding="sm"
                      className="flex items-center gap-2 border-l-4 border-l-red-500"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm">{item}</span>
                    </Surface>
                  ))}
                </TabsContent>
              </Tabs>

              {/* Janela */}
              <Surface variant="flat" padding="md" className="bg-yellow-50 dark:bg-yellow-950">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-semibold">Janela de Oportunidade</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedDestaque.janela}
                    </p>
                  </div>
                </div>
              </Surface>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
