/**
 * Tradutor de nomes de competições (ligas) para português
 * Cobre principais competições internacionais e brasileiras
 */

const LEAGUE_TRANSLATIONS: Record<string, string> = {
  // Principais ligas nacionais
  "Premier League": "Premier League",
  "La Liga": "La Liga",
  "Serie A": "Série A",
  "Ligue 1": "Ligue 1",
  "Bundesliga": "Bundesliga",
  "Primeira Liga": "Primeira Liga",
  "Eredivisie": "Eredivisie",
  "Serie A TIM": "Série A",
  "LaLiga EA Sports": "La Liga",
  "Premier League 2": "Premier League 2",

  // Ligas brasileiras
  "Campeonato Brasileiro": "Campeonato Brasileiro",
  "Série A": "Série A",
  "Série B": "Série B",
  "Série C": "Série C",
  "Série D": "Série D",

  // Copas internacionais
  "UEFA Champions League": "Liga dos Campeões",
  "Champions League": "Liga dos Campeões",
  "UEFA Europa League": "Liga Europa",
  "Europa League": "Liga Europa",
  "UEFA Conference League": "Conference League",
  "Conference League": "Conference League",
  "UEFA Super Cup": "Supercopa da UEFA",
  "Super Cup": "Supercopa",

  // Copas nacionais
  "FA Cup": "Copa da Inglaterra",
  "Carabao Cup": "Copa da Liga Inglesa",
  "Copa del Rey": "Copa do Rei",
  "Coppa Italia": "Copa da Itália",
  "Coupe de France": "Copa da França",
  "DFB-Pokal": "Copa da Alemanha",
  "KNVB Cup": "Copa da Holanda",
  "Taça de Portugal": "Taça de Portugal",
  "Copa do Brasil": "Copa do Brasil",
  "Taça Brasil": "Taça Brasil",

  // Seleções e torneios internacionais
  "FIFA World Cup": "Copa do Mundo",
  "World Cup": "Copa do Mundo",
  "UEFA Euro": "Eurocopa",
  "Euro": "Eurocopa",
  "Copa America": "Copa América",
  "Copa del Pacifico": "Copa do Pacífico",
  "African Cup of Nations": "Copa Africana de Nações",
  "AFC Asian Cup": "Copa Asiática",
  "CONCACAF Gold Cup": "Ouro Cup CONCACAF",
  "OFC Nations Cup": "Copa das Nações OFC",

  // Torneios de seleções sub-20, sub-17, etc
  "FIFA U-20 World Cup": "Copa do Mundo Sub-20",
  "U-20 World Cup": "Copa do Mundo Sub-20",
  "FIFA U-17 World Cup": "Copa do Mundo Sub-17",
  "U-17 World Cup": "Copa do Mundo Sub-17",
  "UEFA U-21 Championship": "Campeonato Europeu Sub-21",
  "U-21 Championship": "Campeonato Sub-21",
  "UEFA U-19 Championship": "Campeonato Europeu Sub-19",
  "U-19 Championship": "Campeonato Sub-19",
  "UEFA U-17 Championship": "Campeonato Europeu Sub-17",
  "U-17 Championship": "Campeonato Sub-17",

  // Qualificações
  "World Cup qualification": "Qualificação Copa do Mundo",
  "Euro qualification": "Qualificação Eurocopa",
  "UEFA Euro qualification": "Qualificação Eurocopa",
  "Copa America qualification": "Qualificação Copa América",
  "African Cup of Nations qualification": "Qualificação Copa Africana",
  "AFC Asian Cup qualification": "Qualificação Copa Asiática",

  // Torneios amistosos e pré-temporada
  "International Friendly": "Amistoso Internacional",
  "Friendly": "Amistoso",
  "Pre-Season": "Pré-Temporada",
  "Club Friendly": "Amistoso de Clube",

  // Torneios de clubes
  "Copa Libertadores": "Copa Libertadores",
  "Copa Sudamericana": "Copa Sul-Americana",
  "Recopa Sudamericana": "Recopa Sul-Americana",
  "CONCACAF Champions League": "Liga dos Campeões CONCACAF",
  "AFC Champions League": "Liga dos Campeões AFC",
  "CAF Champions League": "Liga dos Campeões CAF",
  "OFC Champions League": "Liga dos Campeões OFC",

  // Torneios regionais
  "Copa del Nordeste": "Copa do Nordeste",
  "Campeonato Carioca": "Campeonato Carioca",
  "Campeonato Paulista": "Campeonato Paulista",
  "Campeonato Mineiro": "Campeonato Mineiro",
  "Campeonato Gaúcho": "Campeonato Gaúcho",
  "Campeonato Baiano": "Campeonato Baiano",
  "Campeonato Pernambucano": "Campeonato Pernambucano",
  "Campeonato Catarinense": "Campeonato Catarinense",
  "Campeonato Paranaense": "Campeonato Paranaense",
  "Campeonato Goiano": "Campeonato Goiano",
  "Campeonato Mato-Grossense": "Campeonato Mato-Grossense",
  "Campeonato Acreano": "Campeonato Acreano",
  "Campeonato Amazonense": "Campeonato Amazonense",
  "Campeonato Amapaense": "Campeonato Amapaense",
  "Campeonato Roraimense": "Campeonato Roraimense",
  "Campeonato Tocantinense": "Campeonato Tocantinense",
  "Campeonato Maranhense": "Campeonato Maranhense",
  "Campeonato Piauiense": "Campeonato Piauiense",
  "Campeonato Cearense": "Campeonato Cearense",
  "Campeonato Paraibano": "Campeonato Paraibano",
  "Campeonato Potiguar": "Campeonato Potiguar",
  "Campeonato Sergipano": "Campeonato Sergipano",
  "Campeonato Alagoano": "Campeonato Alagoano",
  "Campeonato Espírito-Santense": "Campeonato Espírito-Santense",

  // Outros
  "Supercopa": "Supercopa",
  "Supercup": "Supercopa",
  "Community Shield": "Community Shield",
  "Charity Shield": "Charity Shield",
  "Trophée des Champions": "Troféu dos Campeões",
};

/**
 * Traduz o nome de uma liga/competição para português
 * Se não encontrar tradução, retorna o nome original
 */
export function translateLeague(leagueName: string | null | undefined): string {
  if (!leagueName) return "Competição";

  // Tenta busca exata primeiro
  if (LEAGUE_TRANSLATIONS[leagueName]) {
    return LEAGUE_TRANSLATIONS[leagueName];
  }

  // Tenta busca parcial (case-insensitive)
  const lower = leagueName.toLowerCase();
  for (const [key, value] of Object.entries(LEAGUE_TRANSLATIONS)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Retorna original se não encontrar
  return leagueName;
}

/**
 * Traduz múltiplas ligas
 */
export function translateLeagues(leagueNames: (string | null | undefined)[]): string[] {
  return leagueNames.map(translateLeague);
}
