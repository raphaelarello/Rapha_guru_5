import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

export type IntensityPoint = {
  t: number;
  v: number;
};

interface ThermometerProProps {
  intensityNow: number;
  intensitySeries: IntensityPoint[];
  onThermometerClick?: () => void;
  isHigh?: boolean;
}

function getThermColor(v: number) {
  if (v >= 85) return 'from-red-600 to-red-400';
  if (v >= 70) return 'from-orange-600 to-orange-400';
  if (v >= 50) return 'from-yellow-600 to-yellow-400';
  return 'from-blue-600 to-blue-400';
}

function getThermBg(v: number) {
  if (v >= 85) return 'bg-red-500/10';
  if (v >= 70) return 'bg-orange-500/10';
  if (v >= 50) return 'bg-yellow-500/10';
  return 'bg-blue-500/10';
}

export function ThermometerPro({
  intensityNow,
  intensitySeries,
  onThermometerClick,
  isHigh = false,
}: ThermometerProProps) {
  const v = Math.min(100, Math.max(0, intensityNow));

  const chartData = useMemo(() => {
    return intensitySeries
      .slice(-60)
      .map((p) => ({
        t: p.t,
        v: Math.min(100, Math.max(0, p.v)),
      }));
  }, [intensitySeries]);

  return (
    <motion.button
      type="button"
      onClick={onThermometerClick}
      className={`w-full rounded-lg border border-white/10 p-4 ${getThermBg(v)} hover:border-white/20 transition`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      animate={isHigh ? { boxShadow: '0 0 12px rgba(239, 68, 68, 0.3)' } : {}}
    >
      {/* Header */}
      <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">
        Intensidade do Jogo
      </div>

      {/* Gauge + Número */}
      <div className="flex items-end gap-4 mb-3">
        {/* Termômetro Vertical */}
        <div className="flex flex-col-reverse items-center gap-1">
          <div className="w-6 h-24 rounded-full border border-white/20 bg-white/5 overflow-hidden flex flex-col-reverse">
            <motion.div
              className={`w-full bg-gradient-to-t ${getThermColor(v)} rounded-full`}
              animate={{ height: `${v}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-[10px] text-slate-500">0%</div>
          <div className="text-[10px] text-slate-500">100%</div>
        </div>

        {/* Número Grande */}
        <motion.div
          className="text-right"
          key={v}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
        >
          <div className={`text-4xl font-black ${getThermColor(v).split(' ')[1]}`}>
            {Math.round(v)}
          </div>
          <div className="text-xs text-slate-500">%</div>
        </motion.div>
      </div>

      {/* Sparkline */}
      {chartData.length > 1 && (
        <div className="h-12 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f1923',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  fontSize: '11px',
                }}
                formatter={(value) => [`${Math.round(value as number)}%`, 'Intensidade']}
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke={
                  v >= 85
                    ? '#f87171'
                    : v >= 70
                      ? '#fb923c'
                      : v >= 50
                        ? '#facc15'
                        : '#60a5fa'
                }
                dot={false}
                isAnimationActive={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Micro-animação se >80% */}
      {v > 80 && (
        <motion.div
          className="mt-3 text-xs font-semibold text-red-400 text-center"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          ⚠️ Jogo em destaque
        </motion.div>
      )}

      {/* Dica */}
      <div className="mt-3 text-[10px] text-slate-500 text-center">
        Clique para ver detalhes
      </div>
    </motion.button>
  );
}
