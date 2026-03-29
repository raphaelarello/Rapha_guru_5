import React, { useEffect, useState, useCallback } from 'react';
import { Bell, AlertTriangle, Zap, TrendingUp, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface Alerta {
  id: string;
  tipo: 'gold_pick' | 'high_edge' | 'high_ev' | 'market_shift';
  titulo: string;
  descricao: string;
  urgencia: 'critica' | 'alta' | 'media' | 'baixa';
  timestamp: number;
  dados: {
    mercado?: string;
    edge?: number;
    ev?: number;
    odd?: number;
    homeTeam?: string;
    awayTeam?: string;
    confianca?: number;
  };
}

export function AlertasTempoReal() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [visivel, setVisivel] = useState(false);
  const [lido, setLido] = useState(new Set<string>());

  // Simula alertas em tempo real (em produção, viria de WebSocket ou polling)
  useEffect(() => {
    const interval = setInterval(() => {
      // Gera alerta aleatório para demonstração
      if (Math.random() > 0.7) {
        const novoAlerta: Alerta = {
          id: `alerta-${Date.now()}`,
          tipo: 'gold_pick',
          titulo: '⚡ Gold Pick Detectado!',
          descricao: 'Oportunidade com edge > 10% e EV > 25%',
          urgencia: 'critica',
          timestamp: Date.now(),
          dados: {
            mercado: 'Over 2.5',
            edge: 12.5,
            ev: 28.3,
            odd: 1.85,
            homeTeam: 'Time A',
            awayTeam: 'Time B',
            confianca: 87,
          },
        };
        setAlertas((prev) => [novoAlerta, ...prev].slice(0, 10));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const removerAlerta = useCallback((id: string) => {
    setAlertas((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const marcarComoLido = useCallback((id: string) => {
    setLido((prev) => new Set([...prev, id]));
  }, []);

  const naoLidos = alertas.filter((a) => !lido.has(a.id)).length;

  const getCorUrgencia = (urgencia: string) => {
    switch (urgencia) {
      case 'critica':
        return 'border-red-500/50 bg-red-500/5';
      case 'alta':
        return 'border-orange-500/50 bg-orange-500/5';
      case 'media':
        return 'border-yellow-500/50 bg-yellow-500/5';
      default:
        return 'border-blue-500/50 bg-blue-500/5';
    }
  };

  const getIconeUrgencia = (urgencia: string) => {
    switch (urgencia) {
      case 'critica':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'alta':
        return <Zap className="w-5 h-5 text-orange-500" />;
      case 'media':
        return <TrendingUp className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botão Flutuante */}
      <button
        onClick={() => setVisivel(!visivel)}
        className="relative mb-4 p-3 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
      >
        <Bell className="w-6 h-6" />
        {naoLidos > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
            {naoLidos}
          </span>
        )}
      </button>

      {/* Painel de Alertas */}
      {visivel && (
        <div className="absolute bottom-16 right-0 w-96 max-h-96 overflow-y-auto rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-sm shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 p-4 border-b border-white/10 bg-slate-800/50 flex items-center justify-between">
            <h3 className="font-semibold text-white">Alertas em Tempo Real</h3>
            <button
              onClick={() => setVisivel(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Lista de Alertas */}
          {alertas.length === 0 ? (
            <div className="p-8 text-center text-white/50">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum alerta no momento</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`p-4 border-l-4 ${getCorUrgencia(alerta.urgencia)} cursor-pointer hover:bg-white/5 transition-colors`}
                  onClick={() => marcarComoLido(alerta.id)}
                >
                  {/* Cabeçalho */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getIconeUrgencia(alerta.urgencia)}
                      <div>
                        <p className="font-semibold text-white text-sm">{alerta.titulo}</p>
                        <p className="text-xs text-white/60">
                          {new Date(alerta.timestamp).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removerAlerta(alerta.id);
                      }}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-white/60" />
                    </button>
                  </div>

                  {/* Descrição */}
                  <p className="text-xs text-white/70 mb-3">{alerta.descricao}</p>

                  {/* Dados */}
                  {alerta.dados && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {alerta.dados.homeTeam && (
                        <div className="bg-white/5 rounded p-2">
                          <p className="text-white/60">Jogo</p>
                          <p className="text-white font-semibold">
                            {alerta.dados.homeTeam} vs {alerta.dados.awayTeam}
                          </p>
                        </div>
                      )}
                      {alerta.dados.mercado && (
                        <div className="bg-white/5 rounded p-2">
                          <p className="text-white/60">Mercado</p>
                          <p className="text-white font-semibold">{alerta.dados.mercado}</p>
                        </div>
                      )}
                      {alerta.dados.edge !== undefined && (
                        <div className="bg-white/5 rounded p-2">
                          <p className="text-white/60">Edge</p>
                          <p className="text-green-400 font-semibold">{alerta.dados.edge.toFixed(1)}%</p>
                        </div>
                      )}
                      {alerta.dados.ev !== undefined && (
                        <div className="bg-white/5 rounded p-2">
                          <p className="text-white/60">EV</p>
                          <p className="text-green-400 font-semibold">{alerta.dados.ev.toFixed(1)}%</p>
                        </div>
                      )}
                      {alerta.dados.odd && (
                        <div className="bg-white/5 rounded p-2">
                          <p className="text-white/60">Odd</p>
                          <p className="text-white font-semibold">{alerta.dados.odd.toFixed(2)}</p>
                        </div>
                      )}
                      {alerta.dados.confianca && (
                        <div className="bg-white/5 rounded p-2">
                          <p className="text-white/60">Confiança</p>
                          <p className="text-blue-400 font-semibold">{alerta.dados.confianca}%</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
