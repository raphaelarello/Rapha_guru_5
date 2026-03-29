// Mapeamento de times para URLs de logos (usando API pública)
export const getTeamLogoUrl = (teamName: string | undefined | null): string => {
  // Validação defensiva
  if (!teamName || typeof teamName !== 'string') return '';
  
  const teamLower = teamName.toLowerCase().trim();
  
  // Mapeamento manual dos times mais comuns
  const logoMap: Record<string, string> = {
    // Premier League
    'manchester united': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_badge.png',
    'manchester city': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    'liverpool': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    'arsenal': 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    'chelsea': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
    'tottenham': 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
    
    // La Liga
    'real madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    'barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%282009%E2%80%93present%29.svg',
    'atletico madrid': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid.svg',
    
    // Serie A
    'juventus': 'https://upload.wikimedia.org/wikipedia/en/0/05/Juventus_FC_2012_logo.svg',
    'ac milan': 'https://upload.wikimedia.org/wikipedia/en/d/d0/AC_Milan.svg',
    'inter milan': 'https://upload.wikimedia.org/wikipedia/en/0/05/Inter_Milan.svg',
    
    // Bundesliga
    'bayern munich': 'https://upload.wikimedia.org/wikipedia/en/1/1f/FC_Bayern_Munich_logo_%282017%29.svg',
    'borussia dortmund': 'https://upload.wikimedia.org/wikipedia/en/6/67/Borussia_Dortmund_logo.svg',
  };
  
  return logoMap[teamLower] || '';
};

export const getLeagueLogoUrl = (leagueName: string | undefined | null): string => {
  // Validação defensiva
  if (!leagueName || typeof leagueName !== 'string') return '';
  
  const leagueLower = leagueName.toLowerCase().trim();
  
  const logoMap: Record<string, string> = {
    'premier league': 'https://upload.wikimedia.org/wikipedia/en/f/f9/Premier_League_Logo.svg',
    'la liga': 'https://upload.wikimedia.org/wikipedia/en/8/8d/La_Liga.svg',
    'bundesliga': 'https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg',
    'serie a': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Serie_A_logo_%282010-2016%29.svg',
    'ligue 1': 'https://upload.wikimedia.org/wikipedia/en/4/47/Ligue_1_logo.svg',
    'série a brasil': 'https://upload.wikimedia.org/wikipedia/pt/1/1a/CBF_Serie_A.svg',
  };
  
  return logoMap[leagueLower] || '';
};
