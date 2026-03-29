/**
 * LIGAS PRO
 * Logos/bandeiras + busca + standings básico
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Trophy, TrendingUp, Users } from "lucide-react";

interface Liga {
  id: number;
  nome: string;
  bandeira: string;
  logo: string;
  pais: string;
  jogosHoje: number;
  proximosJogos: number;
  times: number;
  status: "ativo" | "pausado" | "encerrado";
}

interface Time {
  posicao: number;
  nome: string;
  logo: string;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  gols: number;
  sofridos: number;
  saldo: number;
  pontos: number;
}

const mockLigas: Liga[] = [
  {
    id: 1,
    nome: "Premier League",
    bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    logo: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    pais: "Inglaterra",
    jogosHoje: 3,
    proximosJogos: 12,
    times: 20,
    status: "ativo",
  },
  {
    id: 2,
    nome: "La Liga",
    bandeira: "🇪🇸",
    logo: "🇪🇸",
    pais: "Espanha",
    jogosHoje: 2,
    proximosJogos: 10,
    times: 20,
    status: "ativo",
  },
  {
    id: 3,
    nome: "Bundesliga",
    bandeira: "🇩🇪",
    logo: "🇩🇪",
    pais: "Alemanha",
    jogosHoje: 2,
    proximosJogos: 9,
    times: 18,
    status: "ativo",
  },
  {
    id: 4,
    nome: "Serie A",
    bandeira: "🇮🇹",
    logo: "🇮🇹",
    pais: "Itália",
    jogosHoje: 2,
    proximosJogos: 10,
    times: 20,
    status: "ativo",
  },
  {
    id: 5,
    nome: "Ligue 1",
    bandeira: "🇫🇷",
    logo: "🇫🇷",
    pais: "França",
    jogosHoje: 1,
    proximosJogos: 8,
    times: 18,
    status: "ativo",
  },
  {
    id: 6,
    nome: "Championship",
    bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    logo: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    pais: "Inglaterra",
    jogosHoje: 1,
    proximosJogos: 6,
    times: 24,
    status: "ativo",
  },
];

const mockStandings: Record<number, Time[]> = {
  1: [
    {
      posicao: 1,
      nome: "Manchester City",
      logo: "🔵",
      jogos: 28,
      vitorias: 22,
      empates: 3,
      derrotas: 3,
      gols: 78,
      sofridos: 24,
      saldo: 54,
      pontos: 69,
    },
    {
      posicao: 2,
      nome: "Liverpool",
      logo: "🔴",
      jogos: 28,
      vitorias: 21,
      empates: 4,
      derrotas: 3,
      gols: 75,
      sofridos: 22,
      saldo: 53,
      pontos: 67,
    },
    {
      posicao: 3,
      nome: "Arsenal",
      logo: "🟡",
      jogos: 28,
      vitorias: 20,
      empates: 5,
      derrotas: 3,
      gols: 72,
      sofridos: 28,
      saldo: 44,
      pontos: 65,
    },
  ],
  2: [
    {
      posicao: 1,
      nome: "Real Madrid",
      logo: "⚪",
      jogos: 26,
      vitorias: 21,
      empates: 3,
      derrotas: 2,
      gols: 68,
      sofridos: 18,
      saldo: 50,
      pontos: 66,
    },
    {
      posicao: 2,
      nome: "Barcelona",
      logo: "🔵",
      jogos: 26,
      vitorias: 19,
      empates: 4,
      derrotas: 3,
      gols: 65,
      sofridos: 22,
      saldo: 43,
      pontos: 61,
    },
  ],
};

export default function LigasPRO() {
  const [selectedLiga, setSelectedLiga] = useState<Liga | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLigas = mockLigas.filter((liga) =>
    liga.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalJogos = mockLigas.reduce((sum, l) => sum + l.jogosHoje, 0);
  const totalProximos = mockLigas.reduce((sum, l) => sum + l.proximosJogos, 0);
  const totalTimes = mockLigas.reduce((sum, l) => sum + l.times, 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* HEADER */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Ligas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Principais ligas com standings e análises
          </p>
        </div>

        {/* KPIs */}
        <Grid cols={4} gap="md">
          <KPI
            label="Ligas Ativas"
            value={mockLigas.length}
            icon="🏆"
            color="info"
            trend="neutral"
          />
          <KPI
            label="Jogos Hoje"
            value={totalJogos}
            icon="⚽"
            color="success"
            trend="up"
          />
          <KPI
            label="Próximos"
            value={totalProximos}
            icon="⏰"
            color="info"
            trend="up"
          />
          <KPI
            label="Times"
            value={totalTimes}
            icon="👥"
            color="info"
            trend="neutral"
          />
        </Grid>
      </div>

      {/* BUSCA */}
      <Surface variant="flat" padding="md">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar liga..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Surface>

      {/* GRID DE LIGAS */}
      <Grid cols={3} gap="md">
        {filteredLigas.map((liga) => (
          <Surface
            key={liga.id}
            variant="outline"
            padding="lg"
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => {
              setSelectedLiga(liga);
              setIsDrawerOpen(true);
            }}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center">
                <div className="text-4xl mb-2">{liga.logo}</div>
                <h3 className="font-bold text-lg">{liga.nome}</h3>
                <p className="text-xs text-muted-foreground">{liga.pais}</p>
              </div>

              {/* Status */}
              <div className="flex justify-center">
                {liga.status === "ativo" && (
                  <Badge className="bg-green-500">Ativo</Badge>
                )}
                {liga.status === "pausado" && (
                  <Badge className="bg-yellow-500">Pausado</Badge>
                )}
                {liga.status === "encerrado" && (
                  <Badge className="bg-gray-500">Encerrado</Badge>
                )}
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                  <div className="text-lg font-bold">{liga.jogosHoje}</div>
                  <div className="text-xs text-muted-foreground">Hoje</div>
                </div>
                <div className="text-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                  <div className="text-lg font-bold">{liga.proximosJogos}</div>
                  <div className="text-xs text-muted-foreground">Próximos</div>
                </div>
                <div className="text-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                  <div className="text-lg font-bold">{liga.times}</div>
                  <div className="text-xs text-muted-foreground">Times</div>
                </div>
              </div>

              {/* Botão */}
              <Button className="w-full" variant="outline">
                Ver Detalhes
              </Button>
            </div>
          </Surface>
        ))}
      </Grid>

      {/* DRAWER DE DETALHES */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:w-96 overflow-y-auto">
          {selectedLiga && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>Detalhes da Liga</SheetTitle>
              </SheetHeader>

              {/* Header */}
              <Surface variant="flat" padding="lg" className="text-center">
                <div className="text-5xl mb-3">{selectedLiga.logo}</div>
                <h2 className="text-2xl font-bold">{selectedLiga.nome}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedLiga.pais}
                </p>
                <Badge className="mt-3 bg-green-500">
                  {selectedLiga.status}
                </Badge>
              </Surface>

              {/* Informações */}
              <Surface variant="flat" padding="md">
                <Stack gap="md">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                      <div className="text-2xl font-bold">
                        {selectedLiga.jogosHoje}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Jogos Hoje
                      </div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                      <div className="text-2xl font-bold">
                        {selectedLiga.proximosJogos}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Próximos
                      </div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                      <div className="text-2xl font-bold">
                        {selectedLiga.times}
                      </div>
                      <div className="text-xs text-muted-foreground">Times</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                      <div className="text-2xl font-bold">2024/25</div>
                      <div className="text-xs text-muted-foreground">Temporada</div>
                    </div>
                  </div>
                </Stack>
              </Surface>

              {/* Abas */}
              <Tabs defaultValue="standings" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="standings">Standings</TabsTrigger>
                  <TabsTrigger value="info">Informações</TabsTrigger>
                </TabsList>

                {/* STANDINGS */}
                <TabsContent value="standings" className="space-y-2">
                  {mockStandings[selectedLiga.id]?.map((time) => (
                    <Surface
                      key={time.posicao}
                      variant="flat"
                      padding="sm"
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center">
                          {time.posicao}
                        </Badge>
                        <span className="text-lg">{time.logo}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{time.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {time.vitorias}V {time.empates}E {time.derrotas}D
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{time.pontos}</p>
                        <p className="text-xs text-muted-foreground">
                          {time.saldo > 0 ? "+" : ""}{time.saldo}
                        </p>
                      </div>
                    </Surface>
                  ))}
                </TabsContent>

                {/* INFORMAÇÕES */}
                <TabsContent value="info" className="space-y-3">
                  <Surface variant="flat" padding="md">
                    <p className="text-sm font-semibold mb-2">Estatísticas</p>
                    <Stack gap="sm">
                      <div className="flex justify-between text-sm">
                        <span>Gols por jogo</span>
                        <span className="font-semibold">2.8</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Cartões por jogo</span>
                        <span className="font-semibold">4.2</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Escanteios por jogo</span>
                        <span className="font-semibold">8.5</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Posse média</span>
                        <span className="font-semibold">52%</span>
                      </div>
                    </Stack>
                  </Surface>

                  <Surface variant="flat" padding="md">
                    <p className="text-sm font-semibold mb-2">Próximos Jogos</p>
                    <div className="space-y-2 text-xs">
                      <p>Time A vs Time B • 15:00</p>
                      <p>Time C vs Time D • 17:30</p>
                      <p>Time E vs Time F • 20:00</p>
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
