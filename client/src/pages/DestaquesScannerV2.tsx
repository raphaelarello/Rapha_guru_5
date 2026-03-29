import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { PickCard } from "@/components/PickCard";
import { AlertTriangle, Zap, Filter, X, ChevronDown, Wifi, WifiOff } from "lucide-react";
import { useWebSocket } from "@/lib/websocket";
import { useState, useEffect, useMemo, useCallback } from "react";

interface Pick {
  id?: string;
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  market: string;
  selection: string;
  edge: number;
  ev: number;
  odd: number;
  modelProb: number;
  confidence?: number;
  status: "AO_VIVO" | "PROXIMO" | "ENCERRADO";
  statusGroup?: string;
  minute?: number;
}

const LIGAS_FIXAS = [
  { id: 39, nome: "Premier League" },
  { id: 140, nome: "La Liga" },
  { id: 78, nome: "Bundesliga" },
  { id: 135, nome: "Serie A" },
  { id: 61, nome: "Ligue 1" },
  { id: 71, nome: "Série A Brasil" },
];

const MERCADOS = [
  { id: "1X2", nome: "1X2" },
  { id: "under", nome: "Menos 2.5" },
  { id: "over", nome: "Mais 2.5" },
  { id: "btts", nome: "Ambos Marcam" },
];

export default function DestaquesScannerV2() {
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<number[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [onlyGold, setOnlyGold] = useState(false);
  const [minEdge, setMinEdge] = useState(0);
  const [minEV, setMinEV] = useState(0);
  const [minConfidence, setMinConfidence] = useState(0);
  const [minOdds, setMinOdds] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string[]>(['AO_VIVO', 'PROXIMO']);
  const [bankroll, setBankroll] = useState(1000);
  const [showFilters, setShowFilters] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [realtimeUpdates, setRealtimeUpdates] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Carregar favoritos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('destaquesScanner_favorites');
    if (saved) {
      try {
        setFavorites(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Erro ao carregar favoritos:', e);
      }
    }
  }, []);

  // Salvar favoritos no localStorage
  const toggleFavorite = (pickId: string) => {
    setFavorites((prev) => {
      const updated = new Set(prev);
      if (updated.has(pickId)) {
        updated.delete(pickId);
      } else {
        updated.add(pickId);
      }
      localStorage.setItem('destaquesScanner_favorites', JSON.stringify(Array.from(updated)));
      return updated;
    });
  };

  // WebSocket para atualizações em tempo real
  useWebSocket('ao-vivo', (update) => {
    if (update.type === 'fixture_update') {
      setWsConnected(true);
      setRealtimeUpdates((prev) => [
        {
          ...update.data,
          isRealtime: true,
          timestamp: update.timestamp,
        },
        ...prev.slice(0, 4),
      ]);
    }
  });

  // Fetch picks com cache agressivo
  const query = trpc.football.destaquesScanner.useQuery(
    {
      leagueIds: selectedLeagueIds.length > 0 ? selectedLeagueIds : undefined,
      markets: markets.length > 0 ? markets : undefined,
      onlyGold: onlyGold || undefined,
      limit: 50,
      sort: "EDGE",
    },
    {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchInterval: 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
      retry: 2,
    }
  );

  // Filter picks com filtros avançados
  const filteredPicks = useMemo(() => {
    if (!query.data?.picks) return [];

    let picks = query.data.picks.filter((p) => {
      // Validação defensiva: garantir que edge e ev são números
      const edge = typeof p.edge === 'number' ? p.edge : Number(p.edge ?? 0);
      const ev = typeof p.ev === 'number' ? p.ev : Number(p.ev ?? 0);
      const confidence = typeof p.confidence === 'number' ? p.confidence : Number(p.confidence ?? 0);
      const odd = typeof p.odd === 'number' ? p.odd : Number(p.odd ?? 1.5);
      
      // Se edge/ev > 1, assumir que é percentual (ex: 12.5 = 12.5%)
      // Se edge/ev <= 1, assumir que é decimal (ex: 0.125 = 12.5%)
      const edgeNormalized = edge > 1 ? edge / 100 : edge;
      const evNormalized = ev > 1 ? ev / 100 : ev;
      
      const edgeOk = edgeNormalized >= minEdge / 100;
      const evOk = evNormalized >= minEV / 100;
      const confidenceOk = confidence >= minConfidence;
      const oddsOk = odd >= minOdds;
      const statusOk = statusFilter.length === 0 || statusFilter.includes(p.status || 'PROXIMO');
      
      return edgeOk && evOk && confidenceOk && oddsOk && statusOk;
    });

    // Filtrar por favoritos se ativado
    if (showFavoritesOnly) {
      picks = picks.filter((p) => favorites.has(p.id || `${p.fixtureId}-${p.market}`));
    }

    return picks;
  }, [query.data?.picks, minEdge, minEV, minConfidence, minOdds, statusFilter, showFavoritesOnly, favorites]);

  // Debug: logar primeiro pick para validar formato
  useEffect(() => {
    if (query.data?.picks?.[0]) {
      console.log('[DestaquesScannerV2] Primeiro pick:', query.data.picks[0]);
      console.log('[DestaquesScannerV2] Total picks:', query.data.picks.length);
      console.log('[DestaquesScannerV2] Picks filtrados:', filteredPicks.length);
      console.log('[DestaquesScannerV2] Edge (tipo):', typeof query.data.picks[0].edge, query.data.picks[0].edge);
      console.log('[DestaquesScannerV2] EV (tipo):', typeof query.data.picks[0].ev, query.data.picks[0].ev);
    }
  }, [query.data?.picks, filteredPicks]);

  // Combinar picks com atualizações em tempo real
  const allPicks = useMemo(() => {
    return [...filteredPicks];
  }, [filteredPicks]);

  // Group by status
  const groupedPicks = useMemo(() => {
    const groups: Record<string, Pick[]> = {
      LIVE: [],
      UPCOMING: [],
      FINISHED: [],
    };

    filteredPicks.forEach((p) => {
      const status = p.statusGroup || "UPCOMING";
      if (status in groups) {
        groups[status as keyof typeof groups].push(p);
      }
    });

    return groups;
  }, [filteredPicks]);

  const toggleLeague = useCallback((leagueId: number) => {
    setSelectedLeagueIds((prev) =>
      prev.includes(leagueId) ? prev.filter((id) => id !== leagueId) : [...prev, leagueId]
    );
  }, []);

  const toggleMarket = useCallback((market: string) => {
    setMarkets((prev) =>
      prev.includes(market) ? prev.filter((m) => m !== market) : [...prev, market]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedLeagueIds([]);
    setMarkets([]);
    setOnlyGold(false);
    setMinEdge(0);
    setMinEV(0);
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Destaques Scanner</h1>
        <p className="text-gray-400 text-sm">Gold Picks + mercados + médias de times/jogadores</p>
      </div>

      {/* Compact Filter Bar */}
      <Card className="p-3 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Quick Stats */}
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="bg-blue-900/30">
              Ligas: {selectedLeagueIds.length > 0 ? selectedLeagueIds.length : "Todas"}
            </Badge>
            <Badge variant="outline" className="bg-purple-900/30">
              Mercados: {markets.length > 0 ? markets.length : "Todos"}
            </Badge>
            {onlyGold && <Badge className="bg-yellow-600">Apenas Gold</Badge>}
          </div>

          {/* Toggle Filters */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <Filter size={16} />
            {showFilters ? "Ocultar" : "Filtros"}
            <ChevronDown size={16} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </Button>

          {/* Clear Button */}
          {(selectedLeagueIds.length > 0 || markets.length > 0 || onlyGold || minEdge > 0 || minEV > 0) && (
            <Button onClick={handleClearFilters} variant="ghost" size="sm" className="gap-1 text-red-400 hover:text-red-300">
              <X size={16} />
              Limpar
            </Button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-700 space-y-3">
            {/* Ligas Dropdown */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Ligas</label>
              <div className="flex flex-wrap gap-1">
                {LIGAS_FIXAS.map((liga) => (
                  <Button
                    key={`liga-${liga.id}`}
                    onClick={() => toggleLeague(liga.id)}
                    size="sm"
                    className={`text-xs h-7 ${
                      selectedLeagueIds.includes(liga.id)
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    {liga.nome}
                  </Button>
                ))}
              </div>
            </div>

            {/* Mercados Dropdown */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Mercados</label>
              <div className="flex flex-wrap gap-1">
                {MERCADOS.map((mercado) => (
                  <Button
                    key={`market-${mercado.id}`}
                    onClick={() => toggleMarket(mercado.id)}
                    size="sm"
                    className={`text-xs h-7 ${
                      markets.includes(mercado.id)
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    {mercado.nome}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sliders Row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Margem Mín: {minEdge.toFixed(1)}%</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={minEdge}
                  onChange={(e) => setMinEdge(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Valor Esperado Mín: {minEV.toFixed(1)}%</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="0.5"
                  value={minEV}
                  onChange={(e) => setMinEV(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Bankroll & Gold */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Capital: R$ {bankroll.toFixed(0)}</label>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={bankroll}
                  onChange={(e) => setBankroll(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => setOnlyGold(!onlyGold)}
                  className={`w-full h-8 text-xs gap-1 ${
                    onlyGold ? "bg-yellow-600 hover:bg-yellow-700" : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <Zap size={14} />
                  {onlyGold ? "Apenas Gold" : "Todos"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Results */}
      {query.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-400">Carregando picks...</p>
        </div>
      ) : filteredPicks.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle size={32} className="mx-auto mb-3 text-yellow-500 opacity-50" />
          <p className="text-gray-400">Nenhum pick encontrado com os filtros selecionados</p>
        </div>
      ) : (
        <>
          {/* Live Picks */}
          {groupedPicks.LIVE.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Ao Vivo ({groupedPicks.LIVE.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedPicks.LIVE.map((pick, idx) => {
                  const pickId = pick.id || `${pick.fixtureId}-${pick.market}`;
                  return (
                    <PickCard
                      key={idx}
                      pick={pick}
                      bankroll={bankroll}
                      isFavorite={favorites.has(pickId)}
                      onToggleFavorite={() => toggleFavorite(pickId)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Picks */}
          {groupedPicks.UPCOMING.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Próximos ({groupedPicks.UPCOMING.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedPicks.UPCOMING.map((pick, idx) => {
                  const pickId = pick.id || `${pick.fixtureId}-${pick.market}`;
                  return (
                    <PickCard
                      key={idx}
                      pick={pick}
                      bankroll={bankroll}
                      isFavorite={favorites.has(pickId)}
                      onToggleFavorite={() => toggleFavorite(pickId)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Finished Picks */}
          {groupedPicks.FINISHED.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Encerrados ({groupedPicks.FINISHED.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedPicks.FINISHED.map((pick, idx) => {
                  const pickId = pick.id || `${pick.fixtureId}-${pick.market}`;
                  return (
                    <PickCard
                      key={idx}
                      pick={pick}
                      bankroll={bankroll}
                      isFavorite={favorites.has(pickId)}
                      onToggleFavorite={() => toggleFavorite(pickId)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
