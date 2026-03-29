/* ═══════════════════════════════════════════════════════════════
   match-helpers.ts — Helpers centrais de dados, tradução pt-BR,
   carimbos de equipe e mapa de calor
   ═══════════════════════════════════════════════════════════════ */

export type TeamMini = { id?: number | null; name?: string | null; logo?: string | null };

export type EventoGol = {
  jogador: string;
  minuto: string;
  tipo?: string;
  teamLogo?: string | null;
};

export type EventoCompleto = {
  minuto: number;
  tipo: string;
  detalhe: string;
  jogador: string;
  assistencia: string;
  time: string;
  timeLogo?: string | null;
  ehCasa: boolean;
};

export type MatchSummary = {
  id: number;
  fixtureId: number;
  homeTeam?: TeamMini | null;
  awayTeam?: TeamMini | null;
  homeScore?: number | null;
  awayScore?: number | null;
  minute?: number | null;
  status?: string | null;
  statusLongo?: string | null;
  stadium?: string | null;
  league?: string | null;
  leagueLogo?: string | null;
  leagueRound?: string | null;
  countryFlag?: string | null;
  countryName?: string | null;
  date?: string | null;
  timestamp?: number | null;
  eventosResumo: {
    golsCasa: EventoGol[];
    golsFora: EventoGol[];
    amarelosCasa: number;
    amarelosFora: number;
    vermelhosCasa: number;
    vermelhosFora: number;
    eventosCompletos: EventoCompleto[];
  };
  estatisticasResumo: {
    escanteiosCasa: number;
    escanteiosFora: number;
    posseCasa: number;
    posseFora: number;
    chutesGolCasa: number;
    chutesGolFora: number;
    chutesTotaisCasa: number;
    chutesTotaisFora: number;
    ataquesCasa: number;
    ataquesFora: number;
    pressaoCasa: number;
    pressaoFora: number;
    falhasCasa: number;
    falhasFora: number;
    impedimentosCasa: number;
    impedimentosFora: number;
    passesTotaisCasa: number;
    passesTotaisFora: number;
    passesPreCasa: number;
    passesPreFora: number;
  };
  oportunidadesResumo: {
    titulo?: string;
    confianca?: number;
    urgencia?: string;
    ev?: number;
    motivo?: string;
  }[];
  formaCasa: string[];
  formaFora: string[];
  selos: string[];
  carimboCasa: string;
  carimboFora: string;
  mapaCalor: number;
};

/* ─── TRADUÇÃO DE PAÍSES E TIMES ─── */
const TRADUCAO_PAISES: Record<string, string> = {
  "Afghanistan": "Afeganistão", "Albania": "Albânia", "Algeria": "Argélia",
  "Andorra": "Andorra", "Angola": "Angola", "Argentina": "Argentina",
  "Armenia": "Armênia", "Australia": "Austrália", "Austria": "Áustria",
  "Azerbaijan": "Azerbaijão", "Bahrain": "Bahrein", "Bangladesh": "Bangladesh",
  "Belarus": "Bielorrússia", "Belgium": "Bélgica", "Benin": "Benim",
  "Bolivia": "Bolívia", "Bosnia-Herzegovina": "Bósnia-Herzegovina",
  "Botswana": "Botsuana", "Brazil": "Brasil", "Bulgaria": "Bulgária",
  "Burkina Faso": "Burkina Faso", "Burundi": "Burundi",
  "Cambodia": "Camboja", "Cameroon": "Camarões", "Canada": "Canadá",
  "Cape Verde": "Cabo Verde", "Cape Verde Islands": "Cabo Verde",
  "Central African Republic": "República Centro-Africana",
  "Chad": "Chade", "Chile": "Chile", "China": "China", "China PR": "China",
  "Colombia": "Colômbia", "Comoros": "Comores", "Congo": "Congo",
  "Congo DR": "RD Congo", "Costa Rica": "Costa Rica", "Croatia": "Croácia",
  "Cuba": "Cuba", "Curaçao": "Curaçao", "Cyprus": "Chipre",
  "Czech Republic": "República Tcheca", "Denmark": "Dinamarca",
  "Djibouti": "Djibuti", "Dominican Republic": "República Dominicana",
  "Ecuador": "Equador", "Egypt": "Egito", "El Salvador": "El Salvador",
  "England": "Inglaterra", "Equatorial Guinea": "Guiné Equatorial",
  "Eritrea": "Eritreia", "Estonia": "Estônia", "Eswatini": "Eswatini",
  "Ethiopia": "Etiópia", "Faroe Islands": "Ilhas Faroe",
  "Fiji": "Fiji", "Finland": "Finlândia", "France": "França",
  "Gabon": "Gabão", "Gambia": "Gâmbia", "Georgia": "Geórgia",
  "Germany": "Alemanha", "Ghana": "Gana", "Gibraltar": "Gibraltar",
  "Greece": "Grécia", "Grenada": "Granada", "Guatemala": "Guatemala",
  "Guinea": "Guiné", "Guinea-Bissau": "Guiné-Bissau",
  "Haiti": "Haiti", "Honduras": "Honduras", "Hong Kong": "Hong Kong",
  "Hungary": "Hungria", "Iceland": "Islândia", "India": "Índia",
  "Indonesia": "Indonésia", "Iran": "Irã", "Iraq": "Iraque",
  "Ireland": "Irlanda", "Israel": "Israel", "Italy": "Itália",
  "Ivory Coast": "Costa do Marfim", "Jamaica": "Jamaica",
  "Japan": "Japão", "Jordan": "Jordânia", "Kazakhstan": "Cazaquistão",
  "Kenya": "Quênia", "Kosovo": "Kosovo", "Kuwait": "Kuwait",
  "Kyrgyz Republic": "Quirguistão", "Kyrgyzstan": "Quirguistão",
  "Laos": "Laos", "Latvia": "Letônia", "Lebanon": "Líbano",
  "Lesotho": "Lesoto", "Liberia": "Libéria", "Libya": "Líbia",
  "Liechtenstein": "Liechtenstein", "Lithuania": "Lituânia",
  "Luxembourg": "Luxemburgo", "Macao": "Macau",
  "Madagascar": "Madagascar", "Malawi": "Malawi", "Malaysia": "Malásia",
  "Maldives": "Maldivas", "Mali": "Mali", "Malta": "Malta",
  "Mauritania": "Mauritânia", "Mauritius": "Maurício",
  "Mexico": "México", "Moldova": "Moldávia", "Mongolia": "Mongólia",
  "Montenegro": "Montenegro", "Morocco": "Marrocos",
  "Mozambique": "Moçambique", "Myanmar": "Mianmar",
  "Namibia": "Namíbia", "Nepal": "Nepal", "Netherlands": "Holanda",
  "New Caledonia": "Nova Caledônia", "New Zealand": "Nova Zelândia",
  "Nicaragua": "Nicarágua", "Niger": "Níger", "Nigeria": "Nigéria",
  "North Korea": "Coreia do Norte", "North Macedonia": "Macedônia do Norte",
  "Northern Ireland": "Irlanda do Norte", "Norway": "Noruega",
  "Oman": "Omã", "Pakistan": "Paquistão", "Palestine": "Palestina",
  "Panama": "Panamá", "Papua New Guinea": "Papua Nova Guiné",
  "Paraguay": "Paraguai", "Peru": "Peru", "Philippines": "Filipinas",
  "Poland": "Polônia", "Portugal": "Portugal", "Qatar": "Catar",
  "Romania": "Romênia", "Russia": "Rússia", "Rwanda": "Ruanda",
  "Saudi Arabia": "Arábia Saudita", "Scotland": "Escócia",
  "Senegal": "Senegal", "Serbia": "Sérvia", "Sierra Leone": "Serra Leoa",
  "Singapore": "Singapura", "Slovakia": "Eslováquia", "Slovenia": "Eslovênia",
  "Solomon Islands": "Ilhas Salomão", "Somalia": "Somália",
  "South Africa": "África do Sul", "South Korea": "Coreia do Sul",
  "South Sudan": "Sudão do Sul", "Spain": "Espanha",
  "Sri Lanka": "Sri Lanka", "St. Kitts and Nevis": "São Cristóvão e Nevis",
  "St. Lucia": "Santa Lúcia", "Sudan": "Sudão",
  "Suriname": "Suriname", "Sweden": "Suécia", "Switzerland": "Suíça",
  "Syria": "Síria", "Tahiti": "Taiti", "Taiwan": "Taiwan",
  "Tajikistan": "Tajiquistão", "Tanzania": "Tanzânia",
  "Thailand": "Tailândia", "Togo": "Togo",
  "Trinidad and Tobago": "Trinidad e Tobago",
  "Tunisia": "Tunísia", "Turkey": "Turquia", "Turkmenistan": "Turcomenistão",
  "Uganda": "Uganda", "Ukraine": "Ucrânia",
  "United Arab Emirates": "Emirados Árabes", "United States": "Estados Unidos",
  "USA": "EUA", "Uruguay": "Uruguai", "Uzbekistan": "Uzbequistão",
  "Venezuela": "Venezuela", "Vietnam": "Vietnã", "Wales": "País de Gales",
  "Yemen": "Iêmen", "Zambia": "Zâmbia", "Zimbabwe": "Zimbábue",
};

export function traduzirPais(nome: string): string {
  if (!nome) return nome;
  // Tenta tradução direta
  if (TRADUCAO_PAISES[nome]) return TRADUCAO_PAISES[nome];
  // Tenta sem sufixos de categoria (U20, U21, U23, W)
  const base = nome.replace(/\s+(U\d+|W)$/i, "").trim();
  const sufixo = nome.replace(base, "").trim();
  const sufixoMap: Record<string, string> = { "U17": "Sub-17", "U18": "Sub-18", "U19": "Sub-19", "U20": "Sub-20", "U21": "Sub-21", "U23": "Sub-23", "W": "Fem." };
  const tradBase = TRADUCAO_PAISES[base] || base;
  const tradSufixo = sufixoMap[sufixo] || sufixo;
  return tradSufixo ? `${tradBase} ${tradSufixo}` : tradBase;
}

/* ─── TRADUÇÃO PT-BR COMPLETA ─── */
const TRADUCAO_EVENTOS: Record<string, string> = {
  "Goal": "Gol", "Normal Goal": "Gol", "Own Goal": "Gol contra",
  "Penalty": "Pênalti", "Missed Penalty": "Pênalti perdido",
  "Card": "Cartão", "Yellow Card": "Cartão amarelo", "Red Card": "Cartão vermelho",
  "Second Yellow card": "Segundo amarelo", "Substitution": "Substituição",
  "subst": "Substituição", "Var": "VAR", "Goal cancelled": "Gol anulado",
  "Penalty confirmed": "Pênalti confirmado",
  "Goal Disallowed - offside": "Gol anulado - impedimento",
};

const TRADUCAO_MERCADOS: Record<string, string> = {
  "Over": "Mais de", "Under": "Menos de", "over": "Mais de", "under": "Menos de",
  "BTTS": "Ambas marcam", "btts": "Ambas marcam", "Both Teams To Score": "Ambas marcam",
  "Corners": "Escanteios", "corners": "escanteios", "Cards": "Cartões", "cards": "cartões",
  "Goals": "Gols", "goals": "gols", "Next Goal": "Próximo gol", "next goal": "Próximo gol",
  "Match Winner": "Vencedor da partida", "Double Chance": "Dupla chance",
  "Draw No Bet": "Empate anula aposta", "Half Time": "Primeiro tempo",
  "Full Time": "Tempo regulamentar", "Home": "Casa", "Away": "Fora", "Draw": "Empate",
  "Yes": "Sim", "No": "Não", "Halftime": "Intervalo",
  "First Half": "Primeiro tempo", "Second Half": "Segundo tempo",
  "Extra Time": "Prorrogação", "Penalty Shootout": "Disputa de pênaltis",
  "Match Finished": "Encerrado", "Not Started": "Não iniciado",
  "In Progress": "Em andamento", "Suspended": "Suspenso",
  "Interrupted": "Interrompido", "Postponed": "Adiado", "Cancelled": "Cancelado",
  "Abandoned": "Abandonado", "Technical Loss": "Derrota técnica", "WalkOver": "W.O.",
  "Live": "Ao vivo", "Finished": "Encerrado",
};

const TRADUCAO_STATS: Record<string, string> = {
  "Ball Possession": "Posse de bola", "Shots on Goal": "Chutes ao gol",
  "Shots off Goal": "Chutes para fora", "Total Shots": "Chutes totais",
  "Blocked Shots": "Chutes bloqueados", "Shots insidebox": "Chutes dentro da área",
  "Shots outsidebox": "Chutes fora da área", "Corner Kicks": "Escanteios",
  "Offsides": "Impedimentos", "Fouls": "Faltas", "Yellow Cards": "Cartões amarelos",
  "Red Cards": "Cartões vermelhos", "Goalkeeper Saves": "Defesas do goleiro",
  "Total passes": "Passes totais", "Passes accurate": "Passes certos",
  "Passes %": "Precisão de passes", "Dangerous Attacks": "Ataques perigosos",
  "expected_goals": "Gols esperados (xG)",
};

export function traduzir(texto: string): string {
  if (!texto) return "";
  let result = texto;
  for (const [en, pt] of Object.entries(TRADUCAO_MERCADOS)) {
    result = result.replace(new RegExp(`\\b${en}\\b`, "gi"), pt);
  }
  for (const [en, pt] of Object.entries(TRADUCAO_EVENTOS)) {
    result = result.replace(new RegExp(`\\b${en}\\b`, "gi"), pt);
  }
  return result;
}

export function traduzirEvento(tipo: string, detalhe: string): string {
  return TRADUCAO_EVENTOS[detalhe] || TRADUCAO_EVENTOS[tipo] || traduzir(detalhe || tipo || "");
}

export function traduzirStat(statName: string): string {
  return TRADUCAO_STATS[statName] || traduzir(statName);
}

export function traduzirMercado(texto?: string): string {
  if (!texto) return "Sinal detectado";
  return traduzir(texto);
}

/* ─── STATUS LEGÍVEL ─── */
export function statusLegivel(status?: string | null, minute?: number | null): string {
  const map: Record<string, string> = {
    "HT": "Intervalo", "FT": "Encerrado", "AET": "Após prorrog.",
    "PEN": "Pênaltis", "NS": "Agendado", "TBD": "A definir",
    "PST": "Adiado", "CANC": "Cancelado", "ABD": "Abandonado",
    "AWD": "W.O.", "WO": "W.O.", "SUSP": "Suspenso", "INT": "Interrompido",
    "LIVE": "Ao vivo", "1H": "1º tempo", "2H": "2º tempo",
    "ET": "Prorrogação", "BT": "Intervalo prorrog.", "P": "Pênaltis",
  };
  if (status && map[status]) return map[status];
  if (minute && minute > 0) return `${minute}'`;
  return status || "—";
}

export function isLive(status?: string | null, minute?: number | null): boolean {
  const liveStatuses = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"];
  if (status && liveStatuses.includes(status)) return true;
  if (minute && minute > 0 && !["FT", "AET", "PEN", "NS"].includes(status || "")) return true;
  return false;
}

export function isEncerrado(status?: string | null): boolean {
  return ["FT", "AET", "PEN", "AWD", "WO"].includes(status || "");
}

export function isAgendado(status?: string | null): boolean {
  return ["NS", "TBD", "PST"].includes(status || "");
}

/* ─── CARIMBOS ─── */
export function gerarCarimbo(
  gols: number, golsSofridos: number, chutesGol: number,
  posse: number, ataques: number, escanteios: number,
  amarelos: number, vermelhos: number,
): string {
  if (gols >= 3) return "🔥 Ataque matador";
  if (golsSofridos === 0 && gols > 0) return "🛡️ Defesa sólida";
  if (golsSofridos >= 3) return "⚠️ Defesa frágil";
  if (chutesGol >= 5) return "🎯 Ataque preciso";
  if (posse >= 65) return "👑 Domínio total";
  if (ataques >= 60) return "⚡ Pressão intensa";
  if (escanteios >= 6) return "🏴 Especialista em escanteio";
  if (vermelhos > 0) return "🟥 Time em crise";
  if (amarelos >= 3) return "⚠️ Indisciplinado";
  if (gols === 0 && chutesGol === 0) return "😴 Time apagado";
  if (gols === 0 && chutesGol >= 3) return "😤 Falta de pontaria";
  if (posse <= 35) return "🏃 Contra-ataque";
  return "📊 Equilibrado";
}

/* ─── MAPA DE CALOR ─── */
export function calcularMapaCalor(
  chutesGolTotal: number, escanteiosTotal: number,
  ataquesTotal: number, faltasTotal: number,
  totalGols: number, minute?: number | null,
): number {
  let temp = 30;
  temp += totalGols * 12;
  temp += chutesGolTotal * 4;
  temp += escanteiosTotal * 2;
  temp += Math.min(ataquesTotal * 0.3, 20);
  temp += faltasTotal * 0.5;
  if (minute && minute >= 75) temp += 8;
  if (minute && minute >= 85) temp += 5;
  return Math.max(0, Math.min(100, Math.round(temp)));
}

export function corMapaCalor(temp: number): string {
  if (temp >= 85) return "from-red-600 to-orange-500";
  if (temp >= 70) return "from-orange-500 to-amber-400";
  if (temp >= 55) return "from-amber-400 to-yellow-300";
  if (temp >= 40) return "from-yellow-300 to-emerald-400";
  return "from-emerald-400 to-cyan-400";
}

export function labelMapaCalor(temp: number): string {
  if (temp >= 85) return "🔥 Fervendo";
  if (temp >= 70) return "🌡️ Quente";
  if (temp >= 55) return "☀️ Morno";
  if (temp >= 40) return "🌤️ Estável";
  return "❄️ Frio";
}

/* ─── SELOS ─── */
function gerarSelos(
  chutesGolTotal: number, escanteiosTotal: number,
  diffPosse: number, totalGols: number,
): string[] {
  const tags: string[] = [];
  if (totalGols >= 4) tags.push("Chuva de gols");
  else if (totalGols >= 3) tags.push("Jogo aberto");
  if (chutesGolTotal >= 8) tags.push("Ataque arrasador");
  else if (chutesGolTotal >= 5) tags.push("Pressão ofensiva");
  if (escanteiosTotal >= 10) tags.push("Chuva de escanteios");
  else if (escanteiosTotal >= 7) tags.push("Escanteios em alta");
  if (diffPosse >= 25) tags.push("Domínio territorial");
  if (!tags.length) tags.push("Leitura operacional");
  return tags.slice(0, 3);
}

// formaPadrao REMOVIDO - usar apenas forma REAL do backend
// Se não houver forma real, retornar array vazio (não fallback aleatório)

/* ═══════════════════════════════════════════════════════════════
   resumirFixtureV2 — Aceita o novo formato do dashboardAoVivo
   que já traz statistics e events processados do backend
   ═══════════════════════════════════════════════════════════════ */
export function resumirFixtureV2(
  jogo: { fixture: any; statistics?: any; events?: any[]; oportunidades?: any[]; homeForm?: string[]; awayForm?: string[] },
): MatchSummary {
  const f = jogo.fixture;
  const st = jogo.statistics || {};
  const evts = jogo.events || [];
  const opps = jogo.oportunidades || [];

  const homeId = f?.teams?.home?.id;
  const minute = f?.fixture?.status?.elapsed ?? null;
  const totalGols = (f?.goals?.home ?? 0) + (f?.goals?.away ?? 0);

  // Processar eventos
  const golsCasa: EventoGol[] = [];
  const golsFora: EventoGol[] = [];
  let amarelosCasa = 0, amarelosFora = 0, vermelhosCasa = 0, vermelhosFora = 0;
  const eventosCompletos: EventoCompleto[] = [];

  for (const ev of evts) {
    const ehCasa = ev.teamId === homeId || ev.team === f?.teams?.home?.name;
    eventosCompletos.push({
      minuto: ev.time || 0,
      tipo: ev.type || "",
      detalhe: traduzirEvento(ev.type || "", ev.detail || ""),
      jogador: ev.player || "Desconhecido",
      assistencia: ev.assist || "",
      time: ev.team || "",
      timeLogo: null,
      ehCasa,
    });
    if (ev.type === "Goal") {
      const payload: EventoGol = {
        jogador: ev.player || "Gol",
        minuto: `${ev.time}'`,
        tipo: traduzirEvento("Goal", ev.detail || "Normal Goal"),
      };
      if (ehCasa) golsCasa.push(payload); else golsFora.push(payload);
    }
    if (ev.type === "Card") {
      const red = String(ev.detail || "").toLowerCase().includes("red");
      if (ehCasa) red ? vermelhosCasa++ : amarelosCasa++;
      else red ? vermelhosFora++ : amarelosFora++;
    }
  }

  // Stats do backend (já processadas)
  const posseCasa = parseNum(st.homePossession);
  const posseFora = parseNum(st.awayPossession);
  const chutesGolCasa = parseNum(st.homeShotsOnGoal);
  const chutesGolFora = parseNum(st.awayShotsOnGoal);
  const escanteiosCasa = parseNum(st.homeCorners);
  const escanteiosFora = parseNum(st.awayCorners);
  const ataquesCasa = parseNum(st.homeDangerousAttacks);
  const ataquesFora = parseNum(st.awayDangerousAttacks);
  const falhasCasa = parseNum(st.homeFouls);
  const falhasFora = parseNum(st.awayFouls);

  const rawStats = {
    escanteiosCasa, escanteiosFora,
    posseCasa, posseFora,
    chutesGolCasa, chutesGolFora,
    chutesTotaisCasa: parseNum(st.homeTotalShots),
    chutesTotaisFora: parseNum(st.awayTotalShots),
    ataquesCasa, ataquesFora,
    pressaoCasa: ataquesCasa > 0 ? ataquesCasa : Math.round(chutesGolCasa * 12 + posseCasa * 0.7),
    pressaoFora: ataquesFora > 0 ? ataquesFora : Math.round(chutesGolFora * 12 + posseFora * 0.7),
    falhasCasa, falhasFora,
    impedimentosCasa: parseNum(st.homeOffsides),
    impedimentosFora: parseNum(st.awayOffsides),
    passesTotaisCasa: parseNum(st.homePassesTotal),
    passesTotaisFora: parseNum(st.awayPassesTotal),
    passesPreCasa: parseNum(st.homePassesAccurate),
    passesPreFora: parseNum(st.awayPassesAccurate),
  };

  const carimboCasa = gerarCarimbo(
    f?.goals?.home ?? 0, f?.goals?.away ?? 0,
    chutesGolCasa, posseCasa, ataquesCasa, escanteiosCasa,
    amarelosCasa, vermelhosCasa,
  );
  const carimboFora = gerarCarimbo(
    f?.goals?.away ?? 0, f?.goals?.home ?? 0,
    chutesGolFora, posseFora, ataquesFora, escanteiosFora,
    amarelosFora, vermelhosFora,
  );

  const mapaCalor = calcularMapaCalor(
    chutesGolCasa + chutesGolFora,
    escanteiosCasa + escanteiosFora,
    ataquesCasa + ataquesFora,
    falhasCasa + falhasFora,
    totalGols, minute,
  );

  return {
    id: f?.fixture?.id || 0,
    fixtureId: f?.fixture?.id || 0,
    homeTeam: f?.teams?.home ? { ...f.teams.home, name: traduzirPais(f.teams.home.name || "") } : f?.teams?.home,
    awayTeam: f?.teams?.away ? { ...f.teams.away, name: traduzirPais(f.teams.away.name || "") } : f?.teams?.away,
    homeScore: f?.goals?.home ?? 0,
    awayScore: f?.goals?.away ?? 0,
    minute,
    status: f?.fixture?.status?.short ?? null,
    statusLongo: f?.fixture?.status?.long ?? null,
    stadium: f?.fixture?.venue?.name || null,
    league: f?.league?.name || null,
    leagueLogo: f?.league?.logo || null,
    leagueRound: f?.league?.round || null,
    countryFlag: f?.league?.flag || null,
    countryName: f?.league?.country || null,
    date: f?.fixture?.date || null,
    timestamp: f?.fixture?.timestamp || null,
    eventosResumo: { golsCasa, golsFora, amarelosCasa, amarelosFora, vermelhosCasa, vermelhosFora, eventosCompletos },
    estatisticasResumo: rawStats,
    oportunidadesResumo: opps.slice(0, 5).map((o: any) => ({
      titulo: traduzirMercado(o.mercado || o.titulo || o.type),
      confianca: Math.round(o.confianca ?? o.confidence ?? 62),
      urgencia: o.urgencia || "media",
      ev: o.ev ?? 0,
      motivo: o.motivo || "",
    })),
    formaCasa: (jogo.homeForm && jogo.homeForm.length > 0) ? jogo.homeForm : [],
    formaFora: (jogo.awayForm && jogo.awayForm.length > 0) ? jogo.awayForm : [],
    selos: gerarSelos(
      chutesGolCasa + chutesGolFora,
      escanteiosCasa + escanteiosFora,
      Math.abs(posseCasa - posseFora),
      totalGols,
    ),
    carimboCasa,
    carimboFora,
    mapaCalor,
  };
}

/* ─── LEGACY resumirFixture para fixture raw sem stats do backend ─── */
export function resumirFixture(fixture: any, oportunidades: any[] = []): MatchSummary {
  // Wrapper que usa o formato antigo (fixture raw com statistics embutido)
  // SEM FORMA FALLBACK - usar apenas dados reais
  return resumirFixtureV2({ fixture, oportunidades, homeForm: [], awayForm: [] });
}

/* ─── FORMA LABEL ─── */
export function formaLabel(v: string): string {
  if (v === "V") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  if (v === "E") return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  return "bg-rose-500/20 text-rose-300 border-rose-500/30";
}

export function formaTexto(v: string): string {
  if (v === "V") return "Vitória";
  if (v === "E") return "Empate";
  return "Derrota";
}

/* ─── GET CALL ─── */
export function getCall(match: MatchSummary) {
  const stats = match.estatisticasResumo || {} as any;
  const signal = match.oportunidadesResumo?.[0];
  const homePressure = stats.pressaoCasa ?? 0;
  const awayPressure = stats.pressaoFora ?? 0;
  const totalPressure = homePressure + awayPressure;
  const shots = (stats.chutesGolCasa ?? 0) + (stats.chutesGolFora ?? 0);
  const corners = (stats.escanteiosCasa ?? 0) + (stats.escanteiosFora ?? 0);
  const goals = (match.homeScore ?? 0) + (match.awayScore ?? 0);
  const confidence = Math.max(54, Math.min(96, Math.round((signal?.confianca ?? 58) + totalPressure * 0.12 + shots * 3 + corners * 1.5)));
  const ev = signal?.ev || Math.max(2.1, Math.min(18.9, Number((((confidence - 50) * 0.2) + corners * 0.35).toFixed(1))));
  const intensity = Math.max(28, Math.min(99, Math.round(totalPressure * 0.45 + shots * 5 + corners * 3 + goals * 7)));

  const call = signal?.titulo || "Mais de 1.5 gols";

  const motivos: string[] = [];
  if (shots >= 5) motivos.push("pressão alta");
  if (corners >= 6) motivos.push("escanteios em alta");
  if (goals >= 3) motivos.push("jogo aberto");
  if (totalPressure >= 80) motivos.push("ritmo forte");
  if ((stats.posseCasa ?? 0) >= 65 || (stats.posseFora ?? 0) >= 65) motivos.push("domínio territorial");
  if (!motivos.length) motivos.push("leitura operacional");
  const motivo = motivos.slice(0, 3).join(" + ");

  let summary = "Leitura operacional estável";
  if (intensity >= 85) summary = "Jogo completamente aberto";
  else if (shots >= 5) summary = "Pressão forte e entradas possíveis";
  else if (corners >= 7) summary = "Escanteios ganhando tração";
  else if (goals >= 2) summary = "Partida viva com contexto agressivo";

  let risk = "médio";
  if (intensity >= 90) risk = "baixo";
  else if (intensity < 45) risk = "alto";

  let janela = "";
  if (match.minute && match.minute >= 75) janela = "Gol nos próximos 10 min";
  else if (match.minute && match.minute >= 60) janela = "Gol nos próximos 15 min";
  else if (match.minute && match.minute >= 35 && match.minute <= 45) janela = "Gol antes do intervalo";

  return {
    call, motivo, summary, confidence, ev, intensity, risk, janela,
    hotLabel: intensity >= 82 ? "JOGO ABERTO" : intensity >= 65 ? "PRESSÃO ALTA" : "ENTRADA MONITORADA",
  };
}

/* ─── HELPERS ─── */
function parseNum(v: any): number {
  if (v === undefined || v === null) return 0;
  if (typeof v === "string") return parseFloat(v.replace("%", "")) || 0;
  return typeof v === "number" ? v : 0;
}

export function numeroStat(stats: any[] | undefined, teamIndex: number, type: string): number {
  const raw = stats?.[teamIndex]?.statistics?.find((s: any) => s.type === type)?.value;
  return parseNum(raw);
}

export function resumirEventos(fixture: any) {
  const eventos = Array.isArray(fixture?.events) ? fixture.events : [];
  const golsCasa: EventoGol[] = [];
  const golsFora: EventoGol[] = [];
  let amarelosCasa = 0, amarelosFora = 0, vermelhosCasa = 0, vermelhosFora = 0;
  const eventosCompletos: EventoCompleto[] = [];

  for (const ev of eventos) {
    const ehCasa = ev.team?.id === fixture?.teams?.home?.id;
    const minuto = ev.time?.elapsed || 0;
    const jogador = ev.player?.name || "";
    const assistencia = ev.assist?.name || "";

    eventosCompletos.push({
      minuto, tipo: ev.type || "",
      detalhe: traduzirEvento(ev.type || "", ev.detail || ""),
      jogador: jogador || "Desconhecido", assistencia,
      time: ev.team?.name || "", timeLogo: ev.team?.logo || null, ehCasa,
    });

    if (ev.type === "Goal") {
      const payload: EventoGol = {
        jogador: jogador || "Gol", minuto: `${minuto}'`,
        tipo: traduzirEvento("Goal", ev.detail || "Normal Goal"),
        teamLogo: ev.team?.logo || null,
      };
      if (ehCasa) golsCasa.push(payload); else golsFora.push(payload);
    }
    if (ev.type === "Card") {
      const red = String(ev.detail || "").toLowerCase().includes("red");
      if (ehCasa) red ? vermelhosCasa++ : amarelosCasa++;
      else red ? vermelhosFora++ : amarelosFora++;
    }
  }

  return { golsCasa, golsFora, amarelosCasa, amarelosFora, vermelhosCasa, vermelhosFora, eventosCompletos };
}

export function resumirStats(fixture: any) {
  const stats = fixture?.statistics || [];
  return {
    escanteiosCasa: numeroStat(stats, 0, "Corner Kicks"),
    escanteiosFora: numeroStat(stats, 1, "Corner Kicks"),
    posseCasa: numeroStat(stats, 0, "Ball Possession"),
    posseFora: numeroStat(stats, 1, "Ball Possession"),
    chutesGolCasa: numeroStat(stats, 0, "Shots on Goal"),
    chutesGolFora: numeroStat(stats, 1, "Shots on Goal"),
    chutesTotaisCasa: numeroStat(stats, 0, "Total Shots"),
    chutesTotaisFora: numeroStat(stats, 1, "Total Shots"),
    ataquesCasa: numeroStat(stats, 0, "Dangerous Attacks"),
    ataquesFora: numeroStat(stats, 1, "Dangerous Attacks"),
    pressaoCasa: 0, pressaoFora: 0,
    falhasCasa: numeroStat(stats, 0, "Fouls"),
    falhasFora: numeroStat(stats, 1, "Fouls"),
    impedimentosCasa: numeroStat(stats, 0, "Offsides"),
    impedimentosFora: numeroStat(stats, 1, "Offsides"),
    passesTotaisCasa: numeroStat(stats, 0, "Total passes"),
    passesTotaisFora: numeroStat(stats, 1, "Total passes"),
    passesPreCasa: numeroStat(stats, 0, "Passes accurate"),
    passesPreFora: numeroStat(stats, 1, "Passes accurate"),
  };
}
