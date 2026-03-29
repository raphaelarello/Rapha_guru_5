import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock data - em produção, viria da API-Football
const mockAgendados = [
  {
    id: 1,
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga',
    date: new Date(2026, 2, 28, 16, 0),
    stadium: 'Santiago Bernabéu',
    homeForm: 'VVVEV',
    awayForm: 'VEVVV',
  },
  {
    id: 2,
    homeTeam: 'Manchester City',
    awayTeam: 'Liverpool',
    league: 'Premier League',
    date: new Date(2026, 2, 28, 15, 0),
    stadium: 'Etihad Stadium',
    homeForm: 'VVVVV',
    awayForm: 'VVEVV',
  },
  {
    id: 3,
    homeTeam: 'PSG',
    awayTeam: 'Marseille',
    league: 'Ligue 1',
    date: new Date(2026, 2, 29, 20, 0),
    stadium: 'Parc des Princes',
    homeForm: 'VVVEV',
    awayForm: 'EVVEV',
  },
  {
    id: 4,
    homeTeam: 'Bayern Munich',
    awayTeam: 'Borussia Dortmund',
    league: 'Bundesliga',
    date: new Date(2026, 2, 29, 18, 30),
    stadium: 'Allianz Arena',
    homeForm: 'VVVVV',
    awayForm: 'VVVEV',
  },
  {
    id: 5,
    homeTeam: 'Flamengo',
    awayTeam: 'Palmeiras',
    league: 'Brasileirão',
    date: new Date(2026, 2, 30, 19, 0),
    stadium: 'Maracanã',
    homeForm: 'VVEVV',
    awayForm: 'VVVVV',
  },
  {
    id: 6,
    homeTeam: 'Benfica',
    awayTeam: 'Porto',
    league: 'Primeira Liga',
    date: new Date(2026, 3, 1, 20, 30),
    stadium: 'Estádio da Luz',
    homeForm: 'VVVEV',
    awayForm: 'VEVVV',
  },
];

type FilterDate = 'hoje' | 'amanha' | 'semana' | 'todos';

export function JogosAgendados() {
  const [filterDate, setFilterDate] = useState<FilterDate>('hoje');
  const [filterLeague, setFilterLeague] = useState<string>('todas');

  const today = startOfDay(new Date());

  const filteredJogos = useMemo(() => {
    let filtered = mockAgendados;

    // Filtrar por data
    if (filterDate !== 'todos') {
      const startDate = today;
      let endDate = today;

      if (filterDate === 'amanha') {
        startDate.setDate(startDate.getDate() + 1);
        endDate = new Date(startDate);
      } else if (filterDate === 'semana') {
        endDate = addDays(today, 7);
      }

      filtered = filtered.filter((jogo) => {
        const jogoDate = startOfDay(jogo.date);
        return jogoDate >= startDate && jogoDate <= endDate;
      });
    }

    // Filtrar por liga
    if (filterLeague !== 'todas') {
      filtered = filtered.filter((jogo) => jogo.league === filterLeague);
    }

    return filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filterDate, filterLeague]);

  const leagues = Array.from(new Set(mockAgendados.map((j) => j.league)));

  const getFormColor = (result: string) => {
    switch (result) {
      case 'V':
        return 'bg-green-500';
      case 'E':
        return 'bg-yellow-500';
      case 'D':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Jogos Agendados</h1>
        <p className="text-sm text-muted-foreground mt-2">Próximas partidas com análise de forma e oportunidades</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterDate === 'hoje' ? 'default' : 'outline'}
          onClick={() => setFilterDate('hoje')}
          className="text-sm"
        >
          📅 Hoje
        </Button>
        <Button
          variant={filterDate === 'amanha' ? 'default' : 'outline'}
          onClick={() => setFilterDate('amanha')}
          className="text-sm"
        >
          📅 Amanhã
        </Button>
        <Button
          variant={filterDate === 'semana' ? 'default' : 'outline'}
          onClick={() => setFilterDate('semana')}
          className="text-sm"
        >
          📅 Semana
        </Button>
        <Button
          variant={filterDate === 'todos' ? 'default' : 'outline'}
          onClick={() => setFilterDate('todos')}
          className="text-sm"
        >
          📅 Todos
        </Button>

        <div className="ml-auto">
          <select
            value={filterLeague}
            onChange={(e) => setFilterLeague(e.target.value)}
            className="px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
          >
            <option value="todas">Todas as Ligas</option>
            {leagues.map((league) => (
              <option key={league} value={league}>
                {league}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Jogos */}
      <div className="space-y-3">
        {filteredJogos.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Nenhum jogo encontrado para este período</p>
          </Card>
        ) : (
          filteredJogos.map((jogo) => (
            <Card key={jogo.id} className="p-4 hover:bg-muted/50 cursor-pointer transition">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                {/* Data e Hora */}
                <div className="text-sm">
                  <div className="font-semibold text-foreground">
                    {format(jogo.date, 'HH:mm', { locale: ptBR })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(jogo.date, 'EEEE', { locale: ptBR })}
                  </div>
                </div>

                {/* Times */}
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{jogo.homeTeam}</span>
                      <div className="flex gap-1">
                        {jogo.homeForm.split('').map((result, i) => (
                          <div
                            key={i}
                            className={`w-5 h-5 rounded text-xs flex items-center justify-center font-bold text-white ${getFormColor(result)}`}
                          >
                            {result}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-center">vs</div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{jogo.awayTeam}</span>
                      <div className="flex gap-1">
                        {jogo.awayForm.split('').map((result, i) => (
                          <div
                            key={i}
                            className={`w-5 h-5 rounded text-xs flex items-center justify-center font-bold text-white ${getFormColor(result)}`}
                          >
                            {result}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liga e Estádio */}
                <div className="text-sm">
                  <div className="font-semibold text-foreground">{jogo.league}</div>
                  <div className="text-xs text-muted-foreground">{jogo.stadium}</div>
                </div>

                {/* Botão */}
                <div className="flex justify-end">
                  <Button variant="default" size="sm" className="w-full md:w-auto">
                    Ver Análise
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Resumo */}
      <Card className="p-4 bg-muted/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-foreground">{filteredJogos.length}</div>
            <div className="text-xs text-muted-foreground">Jogos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{leagues.length}</div>
            <div className="text-xs text-muted-foreground">Ligas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">
              {filteredJogos.reduce((sum, j) => {
                const homeWins = j.homeForm.split('').filter((r) => r === 'V').length;
                const awayWins = j.awayForm.split('').filter((r) => r === 'V').length;
                return sum + homeWins + awayWins;
              }, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Vitórias Recentes</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
