import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  YAxis,
  XAxis,
} from 'recharts';
import { X, ChevronRight } from 'lucide-react';
import { translateLeague } from '@/lib/league-translator';

export type HotGame = {
  fixtureId: number;
  home: string;
  away: string;
  homeLogo?: string;
  awayLogo?: string;
  league?: string;
  minute?: number;
  score?: { home: number; away: number };
  intensityNow: number;
  edge?: number;
  ev?: number;
  odds?: number;
  drivers?: {
    shotsTotal: number;
    shotsOnTarget: number;
    corners: number;
    dangerousAttacks: number;
    possession: number;
    cardsYellow: number;
    cardsRed: number;
    goals: number;
  };
  recentEvents?: Array<{ m: number; label: string }>;
};

export type IntensityPoint = {
  t: number;
  v: number;
};

type Props = {
  hotGames: HotGame[];
  intensityNow: number;
  intensitySeries: IntensityPoint[];
  selectedFixtureId?: number;

  onHotNowClick: () => void;
  onSelectGame: (fixtureId: number) => void;
  onThermometerClick?: () => void;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function formatScore(s?: { home: number; away: number }) {
  if (!s) return '—';
  return `${s.home}-${s.away}`;
}

function formatMinute(m?: number) {
  if (m == null) return '';
  return `${m}'`;
}

function heatLabel(v: number) {
  if (v >= 85) return 'INSANO';
  if (v >= 70) return 'QUENTE';
  if (v >= 50) return 'MÉDIO';
  return 'FRIO';
}

function heatEmoji(v: number) {
  if (v >= 85) return '🔥🔥';
  if (v >= 70) return '🔥';
  if (v >= 50) return '🌡️';
  return '❄️';
}

function deriveGlowClass(v: number) {
  if (v >= 85) return 'shadow-lg';
  if (v >= 70) return 'shadow-md';
  return 'shadow';
}

function HotNowCTA({ onClick, hotCount }: { onClick: () => void; hotCount: number }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur-md"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      aria-label="Ver jogos mais quentes agora"
    >
      <motion.span
        initial={{ rotate: -10 }}
        animate={{ rotate: [0, -8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className="text-lg"
      >
        🔥
      </motion.span>
      <div className="flex flex-col leading-tight text-left">
        <span className="text-sm font-semibold">Jogos mais quentes agora</span>
        <span className="text-xs opacity-80">{hotCount} em destaque • clique para filtrar</span>
      </div>
      <span className="ml-1 text-xs opacity-75">→</span>
    </motion.button>
  );
}

function HotGameCard({
  game,
  active,
  onClick,
  onMoreClick,
}: {
  game: HotGame;
  active: boolean;
  onClick: () => void;
  onMoreClick?: () => void;
}) {
  const v = clamp(game.intensityNow, 0, 100);
  const leagueTranslated = game.league ? translateLeague(game.league) : 'Competição';

  return (
    <motion.div
      className={[
        'min-w-[300px] rounded-2xl p-4 border backdrop-blur-md',
        active ? 'bg-white/12 border-white/20' : 'bg-white/8 border-white/10',
        deriveGlowClass(v),
      ].join(' ')}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Competição */}
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {leagueTranslated}
      </div>

      {/* Times com logos */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Time da casa */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {game.homeLogo ? (
            <img src={game.homeLogo} alt="" className="w-6 h-6 rounded-sm shrink-0 object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-sm bg-white/10 shrink-0" />
          )}
          <span className="text-sm font-semibold truncate">{game.home}</span>
        </div>

        {/* Placar */}
        <div className="flex items-center gap-1 text-xs">
          <span className="font-bold text-white w-6 text-center">{game.score?.home ?? '—'}</span>
          <span className="opacity-60">-</span>
          <span className="font-bold text-white w-6 text-center">{game.score?.away ?? '—'}</span>
        </div>

        {/* Time visitante */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-semibold truncate text-right">{game.away}</span>
          {game.awayLogo ? (
            <img src={game.awayLogo} alt="" className="w-6 h-6 rounded-sm shrink-0 object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-sm bg-white/10 shrink-0" />
          )}
        </div>
      </div>

      {/* Minuto e intensidade */}
      <div className="flex items-center justify-between gap-2 mb-3 text-xs">
        <span className="opacity-80">{formatMinute(game.minute)}</span>
        <div className="flex items-center gap-1">
          <span>{heatEmoji(v)}</span>
          <span className="font-bold">{v}%</span>
          <span className="opacity-70 text-[10px]">{heatLabel(v)}</span>
        </div>
      </div>

      {/* Odds/EV/Edge */}
      <div className="flex items-center gap-1 text-[10px] opacity-80 flex-wrap mb-2">
        {game.ev != null && <span className="rounded-full px-1.5 py-0.5 bg-white/10">EV {game.ev.toFixed(2)}</span>}
        {game.edge != null && <span className="rounded-full px-1.5 py-0.5 bg-white/10">Edge {(game.edge * 100).toFixed(1)}%</span>}
        {game.odds != null && <span className="rounded-full px-1.5 py-0.5 bg-white/10">Odd {game.odds.toFixed(2)}</span>}
      </div>

      {/* Botão Mais */}
      <motion.button
        type="button"
        onClick={onMoreClick}
        className="w-full flex items-center justify-center gap-1 rounded-lg px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold transition"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Mais informações
        <ChevronRight className="w-3 h-3" />
      </motion.button>
    </motion.div>
  );
}

function MatchDetailsDrawer({
  game,
  onClose,
}: {
  game: HotGame;
  onClose: () => void;
}) {
  const v = clamp(game.intensityNow, 0, 100);
  const leagueTranslated = game.league ? translateLeague(game.league) : 'Competição';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <motion.div
        className="relative w-full max-w-2xl max-h-[80vh] bg-[#0f1923] border-t border-white/10 rounded-t-3xl overflow-y-auto"
        initial={{ y: 500 }}
        animate={{ y: 0 }}
        exit={{ y: 500 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0f1923]/95 backdrop-blur">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{leagueTranslated}</div>
            <div className="text-sm font-semibold mt-1">
              {game.home} vs {game.away}
            </div>
          </div>
          <motion.button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Times e Placar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              {game.homeLogo && <img src={game.homeLogo} alt="" className="w-12 h-12 rounded-lg object-cover" />}
              <div>
                <div className="text-sm opacity-80">Casa</div>
                <div className="text-lg font-bold">{game.home}</div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold">{game.score?.home ?? '—'}</div>
              <div className="text-xs opacity-60 mt-1">{formatMinute(game.minute)}</div>
              <div className="text-3xl font-bold">{game.score?.away ?? '—'}</div>
            </div>

            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="text-right">
                <div className="text-sm opacity-80">Visitante</div>
                <div className="text-lg font-bold">{game.away}</div>
              </div>
              {game.awayLogo && <img src={game.awayLogo} alt="" className="w-12 h-12 rounded-lg object-cover" />}
            </div>
          </div>

          {/* Intensidade */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Intensidade do Jogo</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{heatEmoji(v)}</span>
                <div>
                  <div className="text-2xl font-bold">{v}%</div>
                  <div className="text-xs opacity-70">{heatLabel(v)}</div>
                </div>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500"
                initial={{ width: 0 }}
                animate={{ width: `${v}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>

          {/* Drivers de Intensidade */}
          {game.drivers && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold mb-3">Drivers de Intensidade</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-80">Chutes</span>
                  <span className="font-bold">{game.drivers.shotsTotal}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-80">Chutes no alvo</span>
                  <span className="font-bold">{game.drivers.shotsOnTarget}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-80">Escanteios</span>
                  <span className="font-bold">{game.drivers.corners}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-80">Ataques perigosos</span>
                  <span className="font-bold">{game.drivers.dangerousAttacks}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-80">Posse (%)</span>
                  <span className="font-bold">{Math.round(game.drivers.possession)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-80">Gols</span>
                  <span className="font-bold">{game.drivers.goals}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-80">Cartões amarelos</span>
                  <span className="font-bold">{game.drivers.cardsYellow}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-80">Cartões vermelhos</span>
                  <span className="font-bold text-red-400">{game.drivers.cardsRed}</span>
                </div>
              </div>
            </div>
          )}

          {/* Eventos Recentes */}
          {game.recentEvents && game.recentEvents.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold mb-3">Eventos Recentes</div>
              <div className="space-y-2">
                {game.recentEvents.slice(0, 5).map((event, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <span className="font-bold opacity-80 w-8">{event.m}'</span>
                    <span className="opacity-80">{event.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Odds */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold mb-3">Oportunidade</div>
            <div className="grid grid-cols-3 gap-3">
              {game.ev != null && (
                <div className="text-center">
                  <div className="text-xs opacity-80 mb-1">EV</div>
                  <div className="text-lg font-bold text-green-400">{game.ev.toFixed(2)}</div>
                </div>
              )}
              {game.edge != null && (
                <div className="text-center">
                  <div className="text-xs opacity-80 mb-1">Edge</div>
                  <div className="text-lg font-bold text-blue-400">{(game.edge * 100).toFixed(1)}%</div>
                </div>
              )}
              {game.odds != null && (
                <div className="text-center">
                  <div className="text-xs opacity-80 mb-1">Odd</div>
                  <div className="text-lg font-bold text-yellow-400">{game.odds.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LiveIntensityThermometer({
  intensityNow,
  series,
  onClick,
}: {
  intensityNow: number;
  series: IntensityPoint[];
  onClick?: () => void;
}) {
  const v = clamp(intensityNow, 0, 100);
  const fillPct = v;

  const chartData = useMemo(
    () =>
      (series?.length ? series : [{ t: Date.now(), v }]).map((p, idx) => ({
        x: idx,
        v: clamp(p.v, 0, 100),
      })),
    [series, v]
  );

  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="rounded-2xl border border-white/10 bg-white/6 backdrop-blur-md p-4"
      initial={false}
      animate={{ height: expanded ? 220 : 140 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Termômetro do jogo</div>
          <div className="text-xs opacity-80">Intensidade ao vivo + tendência</div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={() => {
              setExpanded((x) => !x);
              onClick?.();
            }}
            className="rounded-full px-3 py-1.5 text-xs bg-white/10 hover:bg-white/15 border border-white/10"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {expanded ? 'Fechar' : 'Detalhar'}
          </motion.button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[56px_1fr] gap-4 items-center">
        <div className="relative h-[92px] w-[40px] flex items-end justify-center">
          <div className="absolute inset-0 rounded-full bg-white/8 border border-white/10" />
          <motion.div
            className="absolute bottom-1 w-[28px] rounded-full bg-white/20"
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(6, (fillPct / 100) * 86)}px` }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            style={{ borderRadius: 999 }}
          />
          <motion.div
            className="absolute -bottom-2 h-[18px] w-[18px] rounded-full bg-white/20 border border-white/10"
            animate={{ scale: v >= 80 ? [1, 1.08, 1] : 1 }}
            transition={{ duration: 1.2, repeat: v >= 80 ? Infinity : 0 }}
          />
          <div className="absolute -right-10 bottom-0 text-xs opacity-80">
            <div className="font-bold">{v}%</div>
            <div className="text-[10px] opacity-70">{heatLabel(v)}</div>
          </div>
        </div>

        <div className="h-[92px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="x" hide />
              <YAxis domain={[0, 100]} hide />
              <ReTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const val = payload[0].value as number;
                  return (
                    <div className="rounded-xl bg-black/70 border border-white/10 px-3 py-2 text-xs">
                      <div className="font-semibold">Intensidade</div>
                      <div className="opacity-80">{Math.round(val)}%</div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="v"
                dot={false}
                strokeWidth={2.5}
                stroke="#10b981"
              />
            </LineChart>
          </ResponsiveContainer>

          <AnimatePresence>
            {expanded && (
              <motion.div
                className="mt-2 flex flex-wrap gap-2 text-[11px] opacity-85"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <span className="rounded-full px-2 py-0.5 bg-white/10 border border-white/10">
                  {v >= 80 ? 'Sinal forte: pressão alta' : 'Aguardando gatilho'}
                </span>
                <span className="rounded-full px-2 py-0.5 bg-white/10 border border-white/10">
                  Atualiza com cache live (ex: 10s)
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function LiveHotControls(props: Props) {
  const [selectedGameForDrawer, setSelectedGameForDrawer] = useState<HotGame | null>(null);

  const sortedHot = useMemo(() => {
    return [...props.hotGames].sort((a, b) => (b.intensityNow ?? 0) - (a.intensityNow ?? 0));
  }, [props.hotGames]);

  const hotCount = sortedHot.filter((g) => (g.intensityNow ?? 0) >= 70).length || sortedHot.length;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-3">
        <HotNowCTA onClick={props.onHotNowClick} hotCount={hotCount} />
        <div className="text-xs opacity-70 hidden sm:block">
          Dica: clique em "Mais informações" para detalhes completos
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {sortedHot.slice(0, 8).map((g) => (
          <HotGameCard
            key={g.fixtureId}
            game={g}
            active={props.selectedFixtureId === g.fixtureId}
            onClick={() => props.onSelectGame(g.fixtureId)}
            onMoreClick={() => setSelectedGameForDrawer(g)}
          />
        ))}
      </div>

      <LiveIntensityThermometer
        intensityNow={props.intensityNow}
        series={props.intensitySeries}
        onClick={props.onThermometerClick}
      />

      <AnimatePresence>
        {selectedGameForDrawer && (
          <MatchDetailsDrawer
            game={selectedGameForDrawer}
            onClose={() => setSelectedGameForDrawer(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
