import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, ChevronRight } from 'lucide-react';

export type HotGameMini = {
  fixtureId: number;
  home: string;
  away: string;
  homeLogo?: string;
  awayLogo?: string;
  minute?: number;
  score?: { home: number; away: number };
  intensityNow: number;
  odds?: number;
  updatedAgo?: string;
  edge?: number;
  ev?: number;
  confidence?: number;
};

interface HotNowProProps {
  hotGames: HotGameMini[];
  onSelectGame: (fixtureId: number) => void;
  onCTAClick: () => void;
}

function heatColor(v: number) {
  if (v >= 85) return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (v >= 70) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  if (v >= 50) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
}

function HotGameMiniCard({
  game,
  onClick,
}: {
  game: HotGameMini;
  onClick: () => void;
}) {
  const v = Math.min(100, Math.max(0, game.intensityNow));

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="min-w-[180px] rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] hover:border-white/20 p-2 text-left transition"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Times + Placar - Linha 1 */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {game.homeLogo && (
            <img src={game.homeLogo} alt="" className="w-3.5 h-3.5 rounded-sm shrink-0 object-cover" />
          )}
          <span className="text-xs font-semibold truncate">{game.home}</span>
        </div>
        <span className="text-xs font-bold text-slate-200">{game.score?.home ?? '—'}</span>
      </div>

      {/* Times + Placar - Linha 2 */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-xs font-semibold truncate">{game.away}</span>
          {game.awayLogo && (
            <img src={game.awayLogo} alt="" className="w-3.5 h-3.5 rounded-sm shrink-0 object-cover" />
          )}
        </div>
        <span className="text-xs font-bold text-slate-200">{game.score?.away ?? '—'}</span>
      </div>

      {/* Minuto + Intensidade */}
      <div className="flex items-center justify-between gap-1 mb-1.5 text-[10px]">
        <span className="text-slate-400">{game.minute ? `${game.minute}'` : 'Prep'}</span>
        <span className={`font-bold px-1.5 py-0.5 rounded border ${heatColor(v)}`}>
          {v}%
        </span>
      </div>

      {/* Grid 2x2: Odds, Edge, EV, Confiança */}
      <div className="grid grid-cols-2 gap-1 text-[9px] mb-1">
        {game.odds && (
          <div className="bg-white/5 rounded px-1 py-0.5 text-center">
            <div className="text-slate-500">Odd</div>
            <div className="font-bold text-cyan-400">{game.odds.toFixed(2)}</div>
          </div>
        )}
        {game.edge && (
          <div className="bg-white/5 rounded px-1 py-0.5 text-center">
            <div className="text-slate-500">Edge</div>
            <div className={`font-bold ${game.edge > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(game.edge * 100).toFixed(0)}%
            </div>
          </div>
        )}
        {game.ev && (
          <div className="bg-white/5 rounded px-1 py-0.5 text-center">
            <div className="text-slate-500">EV</div>
            <div className={`font-bold ${game.ev > 1 ? 'text-green-400' : 'text-red-400'}`}>
              {game.ev.toFixed(2)}
            </div>
          </div>
        )}
        {game.confidence && (
          <div className="bg-white/5 rounded px-1 py-0.5 text-center">
            <div className="text-slate-500">Conf</div>
            <div className="font-bold text-yellow-400">{(game.confidence * 100).toFixed(0)}%</div>
          </div>
        )}
      </div>

      {game.updatedAgo && (
        <div className="text-[8px] text-slate-500 text-center">{game.updatedAgo}</div>
      )}
    </motion.button>
  );
}

export function HotNowPro({ hotGames, onSelectGame, onCTAClick }: HotNowProProps) {
  const sortedHot = useMemo(
    () => [...hotGames].sort((a, b) => (b.intensityNow ?? 0) - (a.intensityNow ?? 0)),
    [hotGames]
  );

  const topHot = sortedHot.slice(0, 8);
  const hotCount = sortedHot.filter((g) => (g.intensityNow ?? 0) >= 70).length;

  return (
    <div className="space-y-2">
      {/* CTA Grande */}
      <motion.button
        type="button"
        onClick={onCTAClick}
        className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 hover:border-red-500/50 transition"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-lg"
          >
            🔥
          </motion.span>
          <div className="text-left">
            <div className="text-sm font-bold text-white">Jogos mais quentes agora</div>
            <div className="text-xs text-red-300">{hotCount} em destaque • clique para filtrar</div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-red-400 shrink-0" />
      </motion.button>

      {/* Carrossel Top 8 - Compacto */}
      {topHot.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {topHot.map((game) => (
            <HotGameMiniCard
              key={game.fixtureId}
              game={game}
              onClick={() => onSelectGame(game.fixtureId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
