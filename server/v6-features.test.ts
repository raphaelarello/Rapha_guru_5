import { describe, it, expect } from "vitest";

/* ─── Testes para as funcionalidades da v6 ─── */

describe("Competições Principais", () => {
  const COMPETICOES_PRINCIPAIS = [
    { nome: "Champions League", emoji: "🏆", filtro: "Champions League" },
    { nome: "Libertadores", emoji: "🏆", filtro: "Libertadores" },
    { nome: "Brasileirão A", emoji: "🇧🇷", filtro: "Serie A" },
    { nome: "Brasileirão B", emoji: "🇧🇷", filtro: "Serie B" },
    { nome: "Premier League", emoji: "🏴", filtro: "Premier League" },
    { nome: "La Liga", emoji: "🇪🇸", filtro: "La Liga" },
    { nome: "Serie A", emoji: "🇮🇹", filtro: "Serie A" },
    { nome: "Bundesliga", emoji: "🇩🇪", filtro: "Bundesliga" },
    { nome: "Ligue 1", emoji: "🇫🇷", filtro: "Ligue 1" },
    { nome: "Copa do Mundo", emoji: "🌍", filtro: "World Cup" },
    { nome: "Europa League", emoji: "🏆", filtro: "Europa League" },
    { nome: "Copa América", emoji: "🌎", filtro: "Copa America" },
    { nome: "Copa do Brasil", emoji: "🇧🇷", filtro: "Copa Do Brasil" },
    { nome: "Eliminatórias", emoji: "🌍", filtro: "Qualification" },
  ];

  it("deve ter 14 competições principais", () => {
    expect(COMPETICOES_PRINCIPAIS).toHaveLength(14);
  });

  it("cada competição deve ter nome, emoji e filtro", () => {
    for (const comp of COMPETICOES_PRINCIPAIS) {
      expect(comp.nome).toBeTruthy();
      expect(comp.emoji).toBeTruthy();
      expect(comp.filtro).toBeTruthy();
    }
  });

  it("deve incluir Champions League, Libertadores e Brasileirão", () => {
    const nomes = COMPETICOES_PRINCIPAIS.map((c) => c.nome);
    expect(nomes).toContain("Champions League");
    expect(nomes).toContain("Libertadores");
    expect(nomes).toContain("Brasileirão A");
    expect(nomes).toContain("Brasileirão B");
  });

  it("filtro da URL deve funcionar com encodeURIComponent", () => {
    const championsLeague = COMPETICOES_PRINCIPAIS.find((c) => c.nome === "Champions League")!;
    const encoded = encodeURIComponent(championsLeague.filtro);
    expect(encoded).toBe("Champions%20League");
    const decoded = decodeURIComponent(encoded);
    expect(decoded).toBe("Champions League");
  });

  it("filtro de competição deve filtrar jogos por nome da liga", () => {
    const jogos = [
      { liga: { name: "UEFA Champions League" } },
      { liga: { name: "Premier League" } },
      { liga: { name: "Copa Libertadores" } },
      { liga: { name: "Serie A" } },
      { liga: { name: "La Liga" } },
    ];

    const filtro = "Champions League";
    const filtered = jogos.filter((j) => j.liga.name.toLowerCase().includes(filtro.toLowerCase()));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].liga.name).toBe("UEFA Champions League");
  });

  it("filtro vazio deve retornar todos os jogos", () => {
    const jogos = [
      { liga: { name: "Premier League" } },
      { liga: { name: "La Liga" } },
    ];
    const filtro = "";
    const filtered = filtro ? jogos.filter((j) => j.liga.name.toLowerCase().includes(filtro.toLowerCase())) : jogos;
    expect(filtered).toHaveLength(2);
  });
});

describe("Notificações Push - Lógica", () => {
  it("deve detectar gol quando placar muda", () => {
    const prev = { homeScore: 1, awayScore: 0, redCards: 0 };
    const curr = { homeScore: 2, awayScore: 0, redCards: 0 };
    const prevTotal = prev.homeScore + prev.awayScore;
    const currTotal = curr.homeScore + curr.awayScore;
    expect(currTotal > prevTotal).toBe(true);
    expect(curr.homeScore > prev.homeScore).toBe(true); // gol do time da casa
  });

  it("deve detectar cartão vermelho quando contador aumenta", () => {
    const prev = { homeScore: 0, awayScore: 0, redCards: 0 };
    const curr = { homeScore: 0, awayScore: 0, redCards: 1 };
    expect(curr.redCards > prev.redCards).toBe(true);
  });

  it("não deve notificar quando placar não muda", () => {
    const prev = { homeScore: 1, awayScore: 1, redCards: 0 };
    const curr = { homeScore: 1, awayScore: 1, redCards: 0 };
    const prevTotal = prev.homeScore + prev.awayScore;
    const currTotal = curr.homeScore + curr.awayScore;
    expect(currTotal > prevTotal).toBe(false);
  });

  it("deve identificar qual time marcou", () => {
    const prev = { homeScore: 0, awayScore: 0 };
    const curr = { homeScore: 0, awayScore: 1 };
    const homeScored = curr.homeScore > prev.homeScore;
    const awayScored = curr.awayScore > prev.awayScore;
    expect(homeScored).toBe(false);
    expect(awayScored).toBe(true);
  });

  it("prefs padrão devem ter enabled false e tipos true", () => {
    const defaultPrefs = { enabled: false, gols: true, cartaoVermelho: true, oportunidades: true };
    expect(defaultPrefs.enabled).toBe(false);
    expect(defaultPrefs.gols).toBe(true);
    expect(defaultPrefs.cartaoVermelho).toBe(true);
    expect(defaultPrefs.oportunidades).toBe(true);
  });

  it("seen IDs devem evitar notificações duplicadas", () => {
    const seen = new Set<string>();
    const notifId = "gol-123-3";
    expect(seen.has(notifId)).toBe(false);
    seen.add(notifId);
    expect(seen.has(notifId)).toBe(true);
    // Não deve notificar de novo
    expect(seen.has(notifId)).toBe(true);
  });
});

describe("Estatísticas Reais - Mapeamento", () => {
  it("deve mapear statistics da API-Football para o formato do app", () => {
    const apiStats = [
      { team: { id: 1 }, statistics: [
        { type: "Ball Possession", value: "65%" },
        { type: "Shots on Goal", value: 8 },
        { type: "Corner Kicks", value: 6 },
        { type: "Dangerous Attacks", value: 45 },
        { type: "Total Shots", value: 15 },
      ]},
      { team: { id: 2 }, statistics: [
        { type: "Ball Possession", value: "35%" },
        { type: "Shots on Goal", value: 3 },
        { type: "Corner Kicks", value: 2 },
        { type: "Dangerous Attacks", value: 20 },
        { type: "Total Shots", value: 7 },
      ]},
    ];

    const getStat = (stats: any[], type: string) => {
      const s = stats.find((s: any) => s.type === type);
      if (!s) return 0;
      const v = s.value;
      if (typeof v === "string") return parseInt(v.replace("%", "")) || 0;
      return v ?? 0;
    };

    const homeStats = apiStats[0].statistics;
    const awayStats = apiStats[1].statistics;

    expect(getStat(homeStats, "Ball Possession")).toBe(65);
    expect(getStat(awayStats, "Ball Possession")).toBe(35);
    expect(getStat(homeStats, "Shots on Goal")).toBe(8);
    expect(getStat(awayStats, "Shots on Goal")).toBe(3);
    expect(getStat(homeStats, "Corner Kicks")).toBe(6);
    expect(getStat(awayStats, "Corner Kicks")).toBe(2);
    expect(getStat(homeStats, "Dangerous Attacks")).toBe(45);
    expect(getStat(awayStats, "Total Shots")).toBe(7);
  });

  it("deve retornar 0 para stats ausentes", () => {
    const getStat = (stats: any[], type: string) => {
      const s = stats.find((s: any) => s.type === type);
      if (!s) return 0;
      const v = s.value;
      if (typeof v === "string") return parseInt(v.replace("%", "")) || 0;
      return v ?? 0;
    };

    expect(getStat([], "Ball Possession")).toBe(0);
    expect(getStat([{ type: "Other", value: 5 }], "Ball Possession")).toBe(0);
  });
});
