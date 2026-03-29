"use client";

import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';
import RaphaLayout from '@/components/RaphaLayout';

const dadosEvolucao = [
  { dia: '1', gols: 12, media: 10, cartoes: 2 },
  { dia: '2', gols: 14, media: 10.5, cartoes: 1 },
  { dia: '3', gols: 11, media: 10.3, cartoes: 3 },
  { dia: '4', gols: 15, media: 10.8, cartoes: 2 },
  { dia: '5', gols: 13, media: 10.8, cartoes: 1 },
  { dia: '6', gols: 16, media: 11.3, cartoes: 2 },
  { dia: '7', gols: 18, media: 11.9, cartoes: 3 },
  { dia: '8', gols: 17, media: 12.3, cartoes: 2 },
  { dia: '9', gols: 19, media: 12.9, cartoes: 1 },
  { dia: '10', gols: 21, media: 13.6, cartoes: 2 },
  { dia: '11', gols: 20, media: 13.9, cartoes: 2 },
  { dia: '12', gols: 22, media: 14.5, cartoes: 3 },
  { dia: '13', gols: 23, media: 15.1, cartoes: 1 },
  { dia: '14', gols: 21, media: 15.2, cartoes: 2 },
  { dia: '15', gols: 24, media: 15.8, cartoes: 2 },
  { dia: '16', gols: 25, media: 16.4, cartoes: 3 },
  { dia: '17', gols: 23, media: 16.5, cartoes: 1 },
  { dia: '18', gols: 26, media: 17.1, cartoes: 2 },
  { dia: '19', gols: 27, media: 17.7, cartoes: 2 },
  { dia: '20', gols: 28, media: 18.3, cartoes: 3 },
  { dia: '21', gols: 26, media: 18.4, cartoes: 1 },
  { dia: '22', gols: 29, media: 19, cartoes: 2 },
  { dia: '23', gols: 30, media: 19.6, cartoes: 2 },
  { dia: '24', gols: 28, media: 19.7, cartoes: 3 },
  { dia: '25', gols: 31, media: 20.3, cartoes: 1 },
  { dia: '26', gols: 32, media: 20.9, cartoes: 2 },
  { dia: '27', gols: 30, media: 21, cartoes: 2 },
  { dia: '28', gols: 33, media: 21.6, cartoes: 3 },
  { dia: '29', gols: 34, media: 22.2, cartoes: 1 },
  { dia: '30', gols: 35, media: 22.8, cartoes: 2 },
];

const previsoes = [
  { jogo: '1', previsao: 36, confianca: 85 },
  { jogo: '2', previsao: 37, confianca: 82 },
  { jogo: '3', previsao: 35, confianca: 78 },
  { jogo: '4', previsao: 38, confianca: 80 },
  { jogo: '5', previsao: 39, confianca: 75 },
];

export default function Estatisticas() {
  const [periodo, setPeriodo] = useState('30');
  const [liga, setLiga] = useState('todas');

  const dadosFiltrados = useMemo(() => {
    const dias = parseInt(periodo);
    return dadosEvolucao.slice(-dias);
  }, [periodo]);

  const estatisticas = useMemo(() => {
    const total = dadosFiltrados.reduce((sum, d) => sum + d.gols, 0);
    const media = (total / dadosFiltrados.length).toFixed(2);
    const maximo = Math.max(...dadosFiltrados.map(d => d.gols));
    const minimo = Math.min(...dadosFiltrados.map(d => d.gols));
    const tendencia = dadosFiltrados[dadosFiltrados.length - 1].gols - dadosFiltrados[0].gols > 0 ? 'alta' : 'baixa';
    return { total, media, maximo, minimo, tendencia };
  }, [dadosFiltrados]);

  return (
    <RaphaLayout title="Estatísticas" subtitle="Painel avançado com evolução, comparativos e leitura visual premium.">
      <div className="space-y-5">
        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#0f1923] px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Total Gols</p>
            <span className="text-2xl font-black text-white">{estatisticas.total}</span>
            <p className="text-[10px] text-slate-600">Últimos {periodo} dias</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0f1923] px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Média</p>
            <span className="text-2xl font-black text-blue-400">{estatisticas.media}</span>
            <p className="text-[10px] text-slate-600">Gols/dia</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0f1923] px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Máximo</p>
            <span className="text-2xl font-black text-emerald-400">{estatisticas.maximo}</span>
            <p className="text-[10px] text-slate-600">Melhor dia</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0f1923] px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Tendência</p>
            <div className="flex items-center gap-1.5">
              {estatisticas.tendencia === 'alta'
                ? <TrendingUp className="h-5 w-5 text-emerald-400" />
                : <TrendingDown className="h-5 w-5 text-red-400" />}
              <span className="text-lg font-black text-white capitalize">{estatisticas.tendencia}</span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0f1923] px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filtros:</span>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-40 border-white/10 bg-white/[0.04] text-white"><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={liga} onValueChange={setLiga}>
            <SelectTrigger className="w-40 border-white/10 bg-white/[0.04] text-white"><SelectValue placeholder="Liga" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Ligas</SelectItem>
              <SelectItem value="premier">Premier League</SelectItem>
              <SelectItem value="laliga">La Liga</SelectItem>
              <SelectItem value="serie-a">Série A</SelectItem>
            </SelectContent>
          </Select>
          <button className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08]">
            <Download className="h-3.5 w-3.5" /> Exportar PDF
          </button>
        </div>

        {/* Gráficos */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/[0.08] bg-[#0f1923] p-4">
            <div className="mb-3 flex items-center gap-2 border-b border-white/[0.06] pb-2">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Evolução de Gols</h3>
              <span className="ml-auto text-[10px] text-slate-600">Últimos {periodo} dias</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={dadosFiltrados}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dia" stroke="#475569" tick={{ fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1923', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="gols" fill="#3b82f6" name="Gols" radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="media" stroke="#10b981" name="Média" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0f1923] p-4">
            <div className="mb-3 flex items-center gap-2 border-b border-white/[0.06] pb-2">
              <Target className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Evolução de Cartões</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dadosFiltrados}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dia" stroke="#475569" tick={{ fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1923', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="cartoes" fill="#f59e0b" name="Cartões" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Previsões */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0f1923] p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-white/[0.06] pb-2">
            <TrendingUp className="h-4 w-4 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Previsões Próximos 5 Jogos</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={previsoes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="jogo" stroke="#475569" tick={{ fontSize: 10 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f1923', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="previsao" fill="#8b5cf6" name="Previsão de Gols" radius={[3, 3, 0, 0]} />
              <Bar dataKey="confianca" fill="#06b6d4" name="Confiança %" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0f1923] p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-white/[0.06] pb-2">
            <BarChart3 className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Detalhes Diários</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Dia</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Gols</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Média</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cartões</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Variação</th>
                </tr>
              </thead>
              <tbody>
                {dadosFiltrados.map((item, idx) => {
                  const anterior = idx > 0 ? dadosFiltrados[idx - 1].gols : item.gols;
                  const variacao = item.gols - anterior;
                  return (
                    <tr key={idx} className="border-b border-white/[0.04] transition hover:bg-white/[0.03]">
                      <td className="px-3 py-2 text-xs text-white">Dia {item.dia}</td>
                      <td className="px-3 py-2 text-xs font-bold text-blue-400">{item.gols}</td>
                      <td className="px-3 py-2 text-xs text-emerald-400">{item.media.toFixed(1)}</td>
                      <td className="px-3 py-2 text-xs text-amber-400">{item.cartoes}</td>
                      <td className={`px-3 py-2 text-xs font-bold ${variacao > 0 ? 'text-emerald-400' : variacao < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {variacao > 0 ? '+' : ''}{variacao}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RaphaLayout>
  );
}
