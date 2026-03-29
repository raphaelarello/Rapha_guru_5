import { useState, useMemo, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Star, Search, Volume2, VolumeX, Maximize2, Minimize2 } from "lucide-react";
import { MatchListItem } from "@/components/football/MatchListItem";
import { MatchCenterPanel } from "@/components/football/MatchCenterPanel";

type StatusFilter = "LIVE" | "UPCOMING" | "FINISHED";
type DateFilter = "today" | "tomorrow" | "yesterday";

interface SelectedMatch {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
}

export default function Jogos() {
  // Estado da UI
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("LIVE");
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [leagueFilter, setLeagueFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<SelectedMatch | null>(null);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // Queries - usar mesma rota que AoVivo
  const dashboardQuery = trpc.football.dashboardAoVivo.useQuery(undefined, {
    staleTime: 10000,
    refetchInterval: 10000,
  });

  const fixtures = dashboardQuery.data?.jogos ?? [];

  // Agrupar por liga
  const groupedByLeague = useMemo(() => {
    const groups: Record<string, typeof fixtures> = {};
    
    fixtures.forEach((fixture) => {
      const league = fixture.league?.name || "Outras";
      if (!groups[league]) groups[league] = [];
      groups[league].push(fixture);
    });

    return groups;
  }, [fixtures]);

  // Filtrar fixtures
  const filteredFixtures = useMemo(() => {
    let result = fixtures;

    // Filtro de status
    if (statusFilter === "LIVE") {
      result = result.filter((f: any) => f.fixture?.status?.short === "LIVE");
    } else if (statusFilter === "UPCOMING") {
      result = result.filter((f: any) => ["NS", "TBD", "PST"].includes(f.fixture?.status?.short || ""));
    } else if (statusFilter === "FINISHED") {
      result = result.filter((f: any) => ["FT", "AET", "PEN"].includes(f.fixture?.status?.short || ""));
    }

    // Filtro de liga
    if (leagueFilter !== "all") {
      result = result.filter((f) => f.league?.id?.toString() === leagueFilter);
    }

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.teams?.home?.name?.toLowerCase().includes(query) ||
          f.teams?.away?.name?.toLowerCase().includes(query) ||
          f.league?.name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [fixtures, statusFilter, leagueFilter, searchQuery]);

  // Ligas únicas para dropdown
  const leagues = useMemo(() => {
    const unique = new Map<number, string>();
    fixtures.forEach((f) => {
      if (f.league?.id && f.league?.name) {
        unique.set(f.league.id, f.league.name);
      }
    });
    return Array.from(unique.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [fixtures]);

  // Toggle favorito
  const toggleFavorite = useCallback((fixtureId: number) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fixtureId)) {
        newSet.delete(fixtureId);
      } else {
        newSet.add(fixtureId);
      }
      return newSet;
    });
  }, []);

  // Selecionar jogo
  const handleSelectMatch = useCallback((fixture: any) => {
    setSelectedMatch({
      fixtureId: fixture.fixture?.id,
      homeTeam: fixture.teams?.home?.name || "Time A",
      awayTeam: fixture.teams?.away?.name || "Time B",
      league: fixture.league?.name || "Liga",
    });
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* TopBar */}
      <div className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <TabsList className="grid w-auto grid-cols-3 h-8">
              <TabsTrigger value="LIVE" className="text-xs">
                Ao Vivo
              </TabsTrigger>
              <TabsTrigger value="UPCOMING" className="text-xs">
                Próximos
              </TabsTrigger>
              <TabsTrigger value="FINISHED" className="text-xs">
                Encerrados
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="tomorrow">Amanhã</SelectItem>
            </SelectContent>
          </Select>

          <Select value={leagueFilter} onValueChange={setLeagueFilter}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Todas as ligas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ligas</SelectItem>
              {leagues.map(([id, name]) => (
                <SelectItem key={id} value={id.toString()}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative w-40 h-8">
            <Search className="absolute left-2 top-2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsSoundOn(!isSoundOn)}
            className="h-8 w-8 p-0"
          >
            {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsCompactMode(!isCompactMode)}
            className="h-8 w-8 p-0"
          >
            {isCompactMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Coluna Esquerda - Lista de Jogos */}
        <div className="w-96 border-r border-border bg-card/30 overflow-y-auto flex-shrink-0">
          <div className="divide-y divide-border/50">
            {Object.entries(groupedByLeague).map(([league, matches]) => (
              <div key={league} className="border-b border-border/50">
                {/* Header da Liga */}
                <div className="sticky top-0 bg-card/80 backdrop-blur-sm px-4 py-2 flex items-center gap-2 border-b border-border/30">
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground flex-1">{league}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {matches.length}
                  </span>
                </div>

                {/* Matches */}
                <div className="divide-y divide-border/30">
                  {matches.map((fixture) => (
                    <MatchListItem
                      key={fixture.fixture?.id}
                      fixture={fixture}
                      isSelected={selectedMatch?.fixtureId === fixture.fixture?.id}
                      isFavorite={favorites.has(fixture.fixture?.id || 0)}
                      onSelect={() => handleSelectMatch(fixture)}
                      onToggleFavorite={() => toggleFavorite(fixture.fixture?.id || 0)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredFixtures.length === 0 && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>Nenhum jogo encontrado</p>
            </div>
          )}
        </div>

        {/* Coluna Direita - Match Center */}
        <div className="flex-1 overflow-y-auto bg-background">
          {selectedMatch ? (
            <MatchCenterPanel
              fixtureId={selectedMatch.fixtureId}
              homeTeam={selectedMatch.homeTeam}
              awayTeam={selectedMatch.awayTeam}
              league={selectedMatch.league}
              isCompactMode={isCompactMode}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Selecione um jogo para ver detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
