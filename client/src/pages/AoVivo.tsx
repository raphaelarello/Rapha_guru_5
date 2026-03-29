import { useState, useMemo, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import RaphaLayout from '@/components/RaphaLayout';
import { CompactTraderCard, type CompactTraderCardModel } from '@/components/live/CompactTraderCard';
import { resumirFixtureV2 } from '@/components/live/match-helpers';
import { AlertCircle, Filter, Loader2, WifiOff, Flame, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

type StatusFilter = 'todos' | 'ao-vivo' | 'proximos' | 'encerrados' | 'hot';

export default function AoVivo() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [ligaFilter, setLigaFilter] = useState<string>('todas');
  const [showFilters, setShowFilters] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [updateBadge, setUpdateBadge] = useState(false);

  const query = trpc.football.dashboardAoVivo.useQuery(undefined, {
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    retry: 2,
  });

  // Real-time updates
  useRealtimeUpdates((update) => {
    if (update.type === 'goal' || update.type === 'red_card' || update.type === 'odd_move') {
      setLastUpdate(new Date());
      setUpdateBadge(true);
      setTimeout(() => setUpdateBadge(false), 2000);
      query.refetch();
    }
  });

  // Transforma dados do backend para MatchSummary
  const jogos = useMemo(() => {
    const raw = query.data?.jogos || [];
    return raw.map((jogo: any) => {
      try {
        return resumirFixtureV2({
          fixture: jogo.fixture,
          statistics: jogo.statistics,
          events: jogo.events,
          oportunidades: jogo.oportunidades,
          homeForm: jogo.homeForm,
          awayForm: jogo.awayForm,
        });
      } catch (e) {
        console.warn('[AoVivo] Erro ao resumir fixture:', e);
        return null;
      }
    }).filter(Boolean);
  }, [query.data]);

  // Extrair ligas únicas
  const ligas = useMemo(() => {
    const uniqueLigas = [...new Set(jogos.map((j: any) => j.league).filter(Boolean))];
    return uniqueLigas.sort();
  }, [jogos]);

  // Determinar se jogo é "hot" (movimentado)
  const isJogoHot = (jogo: any) => {
    const totalGols = (jogo.homeScore || 0) + (jogo.awayScore || 0);
    const totalCartoes = (jogo.eventosResumo?.amarelosCasa || 0) + (jogo.eventosResumo?.amarelosFora || 0) +
                         (jogo.eventosResumo?.vermelhosCasa || 0) + (jogo.eventosResumo?.vermelhosFora || 0);
    const totalSOT = (jogo.estatisticasResumo?.chutesGolCasa || 0) + (jogo.estatisticasResumo?.chutesGolFora || 0);
    const totalChutes = (jogo.estatisticasResumo?.chutesTotaisCasa || 0) + (jogo.estatisticasResumo?.chutesTotaisFora || 0);
    return totalGols >= 3 || totalCartoes >= 4 || totalSOT >= 8 || totalChutes >= 15;
  };

  const hotCount = useMemo(() => jogos.filter(isJogoHot).length, [jogos]);

  // Filtrar jogos
  const jogosFiltrados = useMemo(() => {
    return jogos.filter((jogo: any) => {
      // Filtro de status
      let statusMatch = true;
      if (statusFilter === 'ao-vivo') {
        const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'];
        statusMatch = liveStatuses.includes(jogo.status || '') || (jogo.minute && jogo.minute > 0 && !['FT', 'AET', 'PEN', 'NS'].includes(jogo.status || ''));
      } else if (statusFilter === 'proximos') {
        statusMatch = ['NS', 'TBD', 'PST'].includes(jogo.status || '');
      } else if (statusFilter === 'encerrados') {
        statusMatch = ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(jogo.status || '');
      } else if (statusFilter === 'hot') {
        statusMatch = isJogoHot(jogo);
      }

      // Filtro de liga
      const ligaMatch = ligaFilter === 'todas' || jogo.league === ligaFilter;

      return statusMatch && ligaMatch;
    });
  }, [jogos, statusFilter, ligaFilter]);

  const statusButtons: { key: StatusFilter; label: string; icon?: any; count?: number }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'ao-vivo', label: '🔴 Ao Vivo' },
    { key: 'proximos', label: '⏳ Próximos' },
    { key: 'encerrados', label: '✓ Encerrados' },
  ];

  return (
    <RaphaLayout>
      <div className="p-4 space-y-4 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Ao Vivo</h1>
            <p className="text-sm text-gray-400 mt-1">
              {query.isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Carregando jogos reais...
                </span>
              ) : query.isError ? (
                <span className="flex items-center gap-2 text-red-400">
                  <WifiOff className="w-3 h-3" />
                  Erro ao carregar dados
                </span>
              ) : (
                <>
                  {jogosFiltrados.length} jogo{jogosFiltrados.length !== 1 ? 's' : ''}
                  {statusFilter !== 'todos' && ` (${jogos.length} total)`}
                  {' '}&bull; Auto-refresh 15s
                  {updateBadge && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 animate-pulse">
                      Atualizado agora
                    </span>
                  )}
                  {query.data?.ultimaAtualizacao && (
                    <span className="text-gray-500 ml-1">
                      &bull; {new Date(query.data.ultimaAtualizacao).toLocaleTimeString('pt-BR')}
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Botão Atualizar */}
          <Button
            onClick={() => query.refetch()}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RotateCcw size={16} /> Atualizar
          </Button>

          {/* Botão JOGOS HOT */}
          <button
            onClick={() => setStatusFilter(statusFilter === 'hot' ? 'todos' : 'hot')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm transition-all ${
              statusFilter === 'hot'
                ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-105"
                : "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border border-orange-500/30 hover:border-orange-500/50 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]"
            }`}
          >
            <Flame className="w-5 h-5" />
            JOGOS HOT
            {hotCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                statusFilter === 'hot' ? "bg-white/20 text-white" : "bg-orange-500/30 text-orange-300"
              }`}>{hotCount}</span>
            )}
          </button>
        </div>

        {/* Barra de Filtros (sempre visível) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          {statusButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === key
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:border-white/[0.15] hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}

          {/* Separador */}
          <div className="w-px h-6 bg-white/[0.1] mx-1" />

          {/* Liga dropdown */}
          <select
            value={ligaFilter}
            onChange={(e) => setLigaFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold bg-white/[0.04] border border-white/[0.08] rounded-lg text-white hover:border-cyan-500/40 transition cursor-pointer min-w-[160px]"
          >
            <option value="todas">🏆 Todas as Ligas</option>
            {ligas.map((liga: any) => (
              <option key={liga} value={liga}>{liga}</option>
            ))}
          </select>

          {/* Limpar filtros */}
          {(statusFilter !== 'todos' || ligaFilter !== 'todas') && (
            <button
              onClick={() => { setStatusFilter('todos'); setLigaFilter('todas'); }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition"
            >
              <X className="w-3 h-3" />
              Limpar
            </button>
          )}
        </div>

        {/* Loading State */}
        {query.isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 mx-auto text-cyan-500 animate-spin mb-3" />
            <p className="text-sm text-gray-400">Buscando jogos ao vivo da API-Football...</p>
          </div>
        )}

        {/* Error State */}
        {query.isError && (
          <div className="text-center py-12">
            <WifiOff className="w-8 h-8 mx-auto text-red-500 mb-3" />
            <p className="text-sm text-red-400 mb-2">Erro ao carregar dados da API-Football</p>
            <Button variant="outline" size="sm" onClick={() => query.refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!query.isLoading && !query.isError && jogosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-8 h-8 mx-auto text-gray-500 mb-2" />
            <p className="text-sm text-gray-400">
              {jogos.length === 0
                ? 'Nenhum jogo ao vivo no momento'
                : statusFilter === 'hot'
                  ? 'Nenhum jogo movimentado no momento'
                  : 'Nenhum jogo encontrado com estes filtros'}
            </p>
            {jogos.length > 0 && (
              <button
                onClick={() => { setStatusFilter('todos'); setLigaFilter('todas'); }}
                className="mt-2 text-xs text-cyan-400 hover:underline"
              >
                Ver todos os jogos
              </button>
            )}
          </div>
        )}

        {/* ═══ GRID 2 COLUNAS ═══ */}
        {jogosFiltrados.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {jogosFiltrados.map((jogo: any) => {
              const cardModel: CompactTraderCardModel = {
                leagueName: jogo.league || 'Liga',
                leagueFlagEmoji: jogo.countryFlag || '',
                liveBadge: ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(jogo.status),
                homeName: jogo.homeTeam?.name || 'Casa',
                awayName: jogo.awayTeam?.name || 'Fora',
                homeLogoUrl: jogo.homeTeam?.logo,
                awayLogoUrl: jogo.awayTeam?.logo,
                minute: jogo.minute || 0,
                scoreHome: jogo.homeScore || 0,
                scoreAway: jogo.awayScore || 0,
                next10Home: { goal: 45, corner: 35, card: 25 },
                next10Away: { goal: 40, corner: 30, card: 20 },
                stats: {
                  corners: { home: jogo.estatisticasResumo?.escanteiosCasa || 0, away: jogo.estatisticasResumo?.escanteiosFora || 0 },
                  yellow: { home: jogo.eventosResumo?.amarelosCasa || 0, away: jogo.eventosResumo?.amarelosFora || 0 },
                  red: { home: jogo.eventosResumo?.vermelhosCasa || 0, away: jogo.eventosResumo?.vermelhosFora || 0 },
                  shots: { home: jogo.estatisticasResumo?.chutesTotaisCasa || 0, away: jogo.estatisticasResumo?.chutesTotaisFora || 0 },
                  sot: { home: jogo.estatisticasResumo?.chutesGolCasa || 0, away: jogo.estatisticasResumo?.chutesGolFora || 0 },
                  possession: { home: jogo.estatisticasResumo?.posseCasa || 0, away: jogo.estatisticasResumo?.posseFora || 0 },
                  dangerous: { home: jogo.estatisticasResumo?.ataquesCasa || 0, away: jogo.estatisticasResumo?.ataquesFora || 0 },
                },
                pressureLabel: (jogo.estatisticasResumo?.pressaoCasa || 0) > (jogo.estatisticasResumo?.pressaoFora || 0) ? 'Casa Alta' : 'Fora Alta',
                pressureDrivers: `Escanteios ${jogo.estatisticasResumo?.escanteiosCasa || 0}-${jogo.estatisticasResumo?.escanteiosFora || 0}`,
                oddsPrimary: { label: 'OU1.5 OVER', odd: 1.78, delta5m: 0.03, updatedSecAgo: 15 },
                oddsSecondary: { label: 'BTTS YES', odd: 1.92, book: 'Bet365' },
                decision: { ev: 0.12, edgePct: 6.4, pModel: 0.63, pMarket: 0.58 },
                events: (jogo.eventosResumo?.eventosCompletos || []).slice(0, 3).map((evt: any) => ({
                  minute: evt.minuto,
                  type: evt.tipo === 'Gol' ? 'GOAL' : evt.tipo === 'Cartão Vermelho' ? 'RED' : evt.tipo === 'Cartão Amarelo' ? 'YELLOW' : 'VAR',
                  player: evt.jogador,
                  teamSide: evt.ehCasa ? 'home' : 'away',
                })),
              };
              return <CompactTraderCard key={jogo.fixtureId || jogo.id} m={cardModel} match={jogo} />;
            })}
          </div>
        )}
      </div>
    </RaphaLayout>
  );
}
