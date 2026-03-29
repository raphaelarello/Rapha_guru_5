import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Target, Shield } from 'lucide-react';

export type MatchEvent = {
  m: number;
  label: string;
};

export type MatchDrivers = {
  shotsTotal?: number;
  shotsOnTarget?: number;
  corners?: number;
  dangerousAttacks?: number;
  possession?: number;
  cardsYellow?: number;
  cardsRed?: number;
  goals?: number;
};

export type DrawerMatch = {
  fixtureId: number;
  home: string;
  away: string;
  homeLogo?: string;
  awayLogo?: string;
  league: string;
  minute?: number;
  score: { home: number; away: number };
  intensityNow: number;
  odds?: number;
  updatedAgo?: string;
  pModel?: number;
  pMarket?: number;
  edge?: number;
  ev?: number;
  drivers: MatchDrivers;
  recentEvents: MatchEvent[];
};

interface DrawerProProps {
  match: DrawerMatch | null;
  isOpen: boolean;
  onClose: () => void;
}

function getIntensityColor(v: number) {
  if (v >= 85) return 'text-red-400';
  if (v >= 70) return 'text-orange-400';
  if (v >= 50) return 'text-yellow-400';
  return 'text-blue-400';
}

export function DrawerPro({ match, isOpen, onClose }: DrawerProProps) {
  if (!match) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Drawer */}
          <motion.div
            className="fixed inset-y-0 right-0 z-50 w-full lg:w-96 bg-[#0a0f18] border-l border-white/10 overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0a0f18]/95 backdrop-blur border-b border-white/10 p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-400 mb-1">{match.league}</div>
                <div className="flex items-center gap-2 min-w-0">
                  {match.homeLogo && (
                    <img src={match.homeLogo} alt="" className="w-5 h-5 rounded-sm shrink-0 object-cover" />
                  )}
                  <span className="text-sm font-bold truncate">{match.home}</span>
                  <span className="text-sm font-bold text-slate-400">vs</span>
                  <span className="text-sm font-bold truncate">{match.away}</span>
                  {match.awayLogo && (
                    <img src={match.awayLogo} alt="" className="w-5 h-5 rounded-sm shrink-0 object-cover" />
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-3">
              {/* Placar + Minuto + Intensidade */}
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                <div className="text-center">
                  <div className="text-2xl font-black">{match.score.home}</div>
                  <div className="text-xs text-slate-500">{match.home}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-slate-400 mb-1">
                    {match.minute ? `${match.minute}'` : 'Prep'}
                  </div>
                  <div className={`text-lg font-bold ${getIntensityColor(match.intensityNow)}`}>
                    {Math.round(match.intensityNow)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black">{match.score.away}</div>
                  <div className="text-xs text-slate-500">{match.away}</div>
                </div>
              </div>

              {/* HUD: Odd + P_Model/P_Market + Edge/EV */}
              <div className="grid grid-cols-4 gap-2 bg-white/5 rounded-lg p-2">
                {match.odds && (
                  <div className="text-center">
                    <div className="text-xs text-slate-500">Odd</div>
                    <div className="text-sm font-bold text-cyan-400">{match.odds.toFixed(2)}</div>
                  </div>
                )}
                {match.pModel && (
                  <div className="text-center">
                    <div className="text-xs text-slate-500">P Model</div>
                    <div className="text-sm font-bold text-blue-400">{(match.pModel * 100).toFixed(0)}%</div>
                  </div>
                )}
                {match.edge && (
                  <div className="text-center">
                    <div className="text-xs text-slate-500">Edge</div>
                    <div className={`text-sm font-bold ${match.edge > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(match.edge * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
                {match.ev && (
                  <div className="text-center">
                    <div className="text-xs text-slate-500">EV</div>
                    <div className={`text-sm font-bold ${match.ev > 1 ? 'text-green-400' : 'text-red-400'}`}>
                      {match.ev.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Drivers: Shots, Corners, Possession, etc */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase">Drivers do Jogo</div>
                <div className="grid grid-cols-3 gap-2">
                  {match.drivers.shotsTotal && (
                    <div className="bg-white/5 rounded p-2 text-center">
                      <Target className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                      <div className="text-xs text-slate-500">Chutes</div>
                      <div className="text-sm font-bold">{match.drivers.shotsTotal}</div>
                    </div>
                  )}
                  {match.drivers.shotsOnTarget && (
                    <div className="bg-white/5 rounded p-2 text-center">
                      <Target className="w-4 h-4 mx-auto mb-1 text-yellow-400" />
                      <div className="text-xs text-slate-500">SOT</div>
                      <div className="text-sm font-bold text-yellow-400">{match.drivers.shotsOnTarget}</div>
                    </div>
                  )}
                  {match.drivers.corners && (
                    <div className="bg-white/5 rounded p-2 text-center">
                      <Shield className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                      <div className="text-xs text-slate-500">Escanteios</div>
                      <div className="text-sm font-bold">{match.drivers.corners}</div>
                    </div>
                  )}
                  {match.drivers.possession && (
                    <div className="bg-white/5 rounded p-2 text-center">
                      <TrendingUp className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                      <div className="text-xs text-slate-500">Posse</div>
                      <div className="text-sm font-bold text-cyan-400">{match.drivers.possession}%</div>
                    </div>
                  )}
                  {match.drivers.dangerousAttacks && (
                    <div className="bg-white/5 rounded p-2 text-center">
                      <TrendingUp className="w-4 h-4 mx-auto mb-1 text-red-400" />
                      <div className="text-xs text-slate-500">Ataques</div>
                      <div className="text-sm font-bold text-red-400">{match.drivers.dangerousAttacks}</div>
                    </div>
                  )}
                  {(match.drivers.cardsYellow || match.drivers.cardsRed) && (
                    <div className="bg-white/5 rounded p-2 text-center">
                      <div className="text-xs text-slate-500">Cartões</div>
                      <div className="text-sm font-bold">
                        {match.drivers.cardsYellow ? `🟨${match.drivers.cardsYellow}` : ''}
                        {match.drivers.cardsRed ? ` 🟥${match.drivers.cardsRed}` : ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline: Últimos 6 eventos */}
              {match.recentEvents.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Eventos Recentes</div>
                  <div className="space-y-1">
                    {match.recentEvents.slice(0, 6).map((evt, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-white/5 rounded p-2">
                        <span className="font-bold text-slate-400 w-8">{evt.m}'</span>
                        <span className="text-slate-300">{evt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              {match.updatedAgo && (
                <div className="text-xs text-slate-500 text-center pt-2 border-t border-white/10">
                  Atualizado há {match.updatedAgo}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
