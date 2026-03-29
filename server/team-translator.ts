import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache por 1 hora

interface TeamInfo {
  id: number;
  name: string;
  namePortuguese: string;
  logo: string;
}

// Mapeamento manual de times mais comuns para português
const TEAM_TRANSLATIONS: Record<string, string> = {
  // Premier League
  'Manchester United': 'Manchester United',
  'Manchester City': 'Manchester City',
  'Liverpool': 'Liverpool',
  'Arsenal': 'Arsenal',
  'Chelsea': 'Chelsea',
  'Tottenham': 'Tottenham',
  'Brighton': 'Brighton',
  'Aston Villa': 'Aston Villa',
  'Newcastle': 'Newcastle',
  'Fulham': 'Fulham',
  
  // La Liga
  'Real Madrid': 'Real Madrid',
  'Barcelona': 'Barcelona',
  'Atletico Madrid': 'Atlético Madrid',
  'Sevilla': 'Sevilla',
  'Villarreal': 'Villarreal',
  'Real Sociedad': 'Real Sociedad',
  'Girona': 'Girona',
  'Valencia': 'Valência',
  
  // Serie A
  'Juventus': 'Juventus',
  'AC Milan': 'AC Milan',
  'Inter Milan': 'Inter de Milão',
  'Napoli': 'Napoli',
  'Roma': 'Roma',
  'Lazio': 'Lazio',
  'Fiorentina': 'Fiorentina',
  'Atalanta': 'Atalanta',
  
  // Bundesliga
  'Bayern Munich': 'Bayern de Munique',
  'Borussia Dortmund': 'Borussia Dortmund',
  'Bayer Leverkusen': 'Bayer Leverkusen',
  'RB Leipzig': 'RB Leipzig',
  'Schalke 04': 'Schalke 04',
  'Cologne': 'Colônia',
  'Eintracht Frankfurt': 'Eintracht Frankfurt',
  
  // Ligue 1
  'Paris Saint-Germain': 'Paris Saint-Germain',
  'Marseille': 'Marselha',
  'Lyon': 'Lyon',
  'Lille': 'Lille',
  'Monaco': 'Mônaco',
  'Nice': 'Nice',
  'Rennes': 'Rennes',
  'Strasbourg': 'Estrasburgo',
  
  // Série A Brasil
  'Flamengo': 'Flamengo',
  'Palmeiras': 'Palmeiras',
  'São Paulo': 'São Paulo',
  'Corinthians': 'Corinthians',
  'Botafogo': 'Botafogo',
  'Vasco da Gama': 'Vasco da Gama',
  'Cruzeiro': 'Cruzeiro',
  'Atlético Mineiro': 'Atlético Mineiro',
  'Grêmio': 'Grêmio',
  'Internacional': 'Internacional',
  'Benfica': 'Benfica',
  'Porto': 'Porto',
  'Sporting': 'Sporting',
};

export const getTeamNamePortuguese = (englishName: string): string => {
  // Verificar cache primeiro
  const cached = cache.get<string>(`team:${englishName}`);
  if (cached) return cached;
  
  // Usar mapeamento manual
  const portuguese = TEAM_TRANSLATIONS[englishName] || englishName;
  
  // Salvar no cache
  cache.set(`team:${englishName}`, portuguese);
  
  return portuguese;
};

export const translateTeamNames = (homeTeam: string, awayTeam: string) => {
  return {
    homeTeamPortuguese: getTeamNamePortuguese(homeTeam),
    awayTeamPortuguese: getTeamNamePortuguese(awayTeam),
  };
};
