import { useState, useMemo } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Target,
  DollarSign,
  Calendar,
  Clock,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function PitacosBacktesting() {
  const [diasRetro, setDiasRetro] = useState(30);
  const [bancaTotal, setBancaTotal] = useState(1000);
  const [confiancaSelecionada, setConfiancaSelecionada] = useState(75);

  // Queries
  const backTestingQuery = trpc.pitacos.analisarBacktesting.useQuery({
    diasRetro,
  });

  // Dados simulados para demonstração
  const padroesMaisLucrativos = useMemo(
    () => [
      {
        liga: "Brasileirão",
        mercado: "Próximo Gol",
        horario: "TARDE",
        taxaAcerto: 82,
        oddMedia: 1.85,
        evMedio: 0.52,
        confiancaRecomendada: 82,
        tendencia: "CRESCENTE",
      },
      {
        liga: "Premier League",
        mercado: "Ambos Marcam",
        horario: "NOITE",
        taxaAcerto: 78,
        oddMedia: 1.72,
        evMedio: 0.34,
        confiancaRecomendada: 78,
        tendencia: "ESTAVEL",
      },
      {
        liga: "Libertadores",
        mercado: "Mais de 2.5",
        horario: "MANHA",
        taxaAcerto: 75,
        oddMedia: 1.95,
        evMedio: 0.46,
        confiancaRecomendada: 75,
        tendencia: "CRESCENTE",
      },
    ],
    []
  );

  const ligasDesempenho = useMemo(
    () => [
      { nome: "Brasileirão", totalPicks: 45, taxaAcerto: 82, lucroTotal: 1250 },
      { nome: "Premier League", totalPicks: 38, taxaAcerto: 78, lucroTotal: 980 },
      { nome: "La Liga", totalPicks: 32, taxaAcerto: 72, lucroTotal: 650 },
      { nome: "Série B", totalPicks: 28, taxaAcerto: 65, lucroTotal: 320 },
      { nome: "Libertadores", totalPicks: 25, taxaAcerto: 75, lucroTotal: 580 },
    ],
    []
  );

  const mercadosDesempenho = useMemo(
    () => [
      { nome: "Próximo Gol", totalPicks: 52, taxaAcerto: 82, indiceAcuracia: 0.18 },
      { nome: "Ambos Marcam", totalPicks: 48, taxaAcerto: 78, indiceAcuracia: 0.22 },
      { nome: "Mais de 2.5", totalPicks: 55, taxaAcerto: 75, indiceAcuracia: 0.25 },
      { nome: "Resultado Final", totalPicks: 50, taxaAcerto: 68, indiceAcuracia: 0.32 },
      { nome: "Escanteios", totalPicks: 40, taxaAcerto: 70, indiceAcuracia: 0.28 },
    ],
    []
  );

  const horariosDesempenho = useMemo(
    () => [
      { horario: "MANHA", totalPicks: 35, taxaAcerto: 72, lucroTotal: 420 },
      { horario: "TARDE", totalPicks: 68, taxaAcerto: 80, lucroTotal: 1580 },
      { horario: "NOITE", totalPicks: 82, taxaAcerto: 76, lucroTotal: 1280 },
      { horario: "MADRUGADA", totalPicks: 15, taxaAcerto: 60, lucroTotal: 120 },
    ],
    []
  );

  // Calcular Kelly
  const kellyCalculo = useMemo(() => {
    const p = confiancaSelecionada / 100;
    const odd = 1.85; // Odd média

    const b = odd - 1;
    const q = 1 - p;
    let kelly = (b * p - q) / b;
    kelly = Math.max(0, Math.min(0.25, kelly));

    const percentual = kelly * 100;
    const valorAposta = bancaTotal * kelly;

    let recomendacao = "";
    if (kelly === 0) {
      recomendacao = "❌ Não aposte - EV negativo";
    } else if (kelly < 0.01) {
      recomendacao = "⚠️ Aposta muito pequena";
    } else if (kelly < 0.05) {
      recomendacao = "📊 Aposta conservadora";
    } else if (kelly < 0.1) {
      recomendacao = "✅ Aposta moderada";
    } else {
      recomendacao = "🚀 Aposta agressiva";
    }

    return { percentual, valorAposta, recomendacao };
  }, [confiancaSelecionada, bancaTotal]);

  const recomendacoes = [
    "🎯 Foco em Brasileirão - Próximo Gol (82% de acerto)",
    "⚽ A Premier League tem 78% de acerto - Priorize!",
    "📊 Mercado 'Próximo Gol' tem excelente calibração - Aumente confiança",
    "⏰ Horário TARDE é mais lucrativo - Concentre análise neste período",
    "⚠️ Evite apostas na MADRUGADA (apenas 60% de acerto)",
  ];

  return (
    <RaphaLayout title="Pitacos Backtesting - Análise Histórica">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">📊 Backtesting & Análise Histórica</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Identifique padrões lucrativos e otimize sua estratégia
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={diasRetro}
              onChange={(e) => setDiasRetro(Number(e.target.value))}
              className="px-3 py-2 text-sm border rounded-md bg-background"
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={14}>Últimos 14 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
          </div>
        </div>

        {/* Recomendações */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="w-5 h-5" />
              Recomendações Baseadas em Backtesting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recomendacoes.map((rec, idx) => (
                <p key={idx} className="text-sm text-green-800">
                  {rec}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Padrões Mais Lucrativos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Padrões Mais Lucrativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {padroesMaisLucrativos.map((padrao, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">
                        {padrao.liga} - {padrao.mercado}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {padrao.horario}
                      </p>
                    </div>
                    <Badge
                      variant={padrao.tendencia === "CRESCENTE" ? "default" : "secondary"}
                      className="gap-1"
                    >
                      {padrao.tendencia === "CRESCENTE" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {padrao.tendencia}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Taxa de Acerto</p>
                      <p className="text-lg font-bold text-green-600">
                        {padrao.taxaAcerto}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Odd Média</p>
                      <p className="text-lg font-bold">{padrao.oddMedia}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">EV Médio</p>
                      <p className="text-lg font-bold text-blue-600">
                        {padrao.evMedio.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Confiança</p>
                      <p className="text-lg font-bold">
                        {padrao.confiancaRecomendada}%
                      </p>
                    </div>
                  </div>

                  <Progress value={padrao.taxaAcerto} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Análise por Liga */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Desempenho por Liga
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ligasDesempenho}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="taxaAcerto" fill="#22c55e" name="Taxa de Acerto %" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {ligasDesempenho.map((liga) => (
                <div key={liga.nome} className="border rounded-lg p-3">
                  <p className="font-semibold">{liga.nome}</p>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{liga.totalPicks} picks</span>
                    <span className="text-green-600 font-semibold">
                      +R$ {liga.lucroTotal}
                    </span>
                  </div>
                  <Progress value={liga.taxaAcerto} className="mt-2 h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Análise por Mercado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Desempenho por Mercado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mercadosDesempenho}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="indiceAcuracia" fill="#ef4444" name="Índice de Acurácia" />
                </BarChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                {mercadosDesempenho.map((mercado) => (
                  <div key={mercado.nome} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-sm">{mercado.nome}</p>
                      <Badge
                        variant={
                          mercado.indiceAcuracia < 0.25 ? "default" : "secondary"
                        }
                      >
                        {mercado.indiceAcuracia.toFixed(3)}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{mercado.totalPicks} picks</span>
                      <span className="text-green-600">
                        {mercado.taxaAcerto}% acerto
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Análise por Horário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Desempenho por Horário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={horariosDesempenho}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="horario" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="lucroTotal" fill="#22c55e" name="Lucro Total (R$)" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {horariosDesempenho.map((horario) => (
                <div key={horario.horario} className="border rounded-lg p-3 text-center">
                  <p className="font-semibold text-sm">{horario.horario}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {horario.totalPicks} picks
                  </p>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    {horario.taxaAcerto}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gestão de Banca - Critério de Kelly */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <DollarSign className="w-5 h-5" />
              Gestão de Banca - Critério de Kelly
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-blue-900">
                    Banca Total (R$)
                  </label>
                  <input
                    type="number"
                    value={bancaTotal}
                    onChange={(e) => setBancaTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md mt-1 bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-blue-900">
                    Confiança do Pick (%)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={confiancaSelecionada}
                    onChange={(e) => setConfiancaSelecionada(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                  <div className="flex justify-between text-xs text-blue-700 mt-1">
                    <span>50%</span>
                    <span className="font-bold">{confiancaSelecionada}%</span>
                    <span>95%</span>
                  </div>
                </div>
              </div>

              {/* Resultado Kelly */}
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-blue-700 mb-1">Percentual da Banca (Kelly)</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {kellyCalculo.percentual.toFixed(2)}%
                  </p>
                </div>

                <div>
                  <p className="text-xs text-blue-700 mb-1">Valor Recomendado para Apostar</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {kellyCalculo.valorAposta.toFixed(2)}
                  </p>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm font-semibold text-blue-900">
                    {kellyCalculo.recomendacao}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
              <p className="text-sm text-blue-900">
                <strong>💡 Dica:</strong> O Critério de Kelly calcula o percentual ótimo da sua
                banca para maximizar crescimento exponencial enquanto minimiza risco de ruína.
                Nunca aposte mais do que Kelly recomenda!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RaphaLayout>
  );
}
