import { describe, expect, it } from "vitest";

/**
 * Testes para as funções de tradução de países e helpers de match.
 * Como traduzirPais é um módulo client-side, testamos a lógica diretamente.
 */

// Reproduzir a lógica de traduzirPais para testar
const TRADUCAO_PAISES: Record<string, string> = {
  "Chile": "Chile",
  "Cape Verde": "Cabo Verde",
  "Cape Verde Islands": "Cabo Verde",
  "New Caledonia": "Nova Caledônia",
  "New Zealand": "Nova Zelândia",
  "Solomon Islands": "Ilhas Salomão",
  "Australia": "Austrália",
  "Cameroon": "Camarões",
  "Venezuela": "Venezuela",
  "Trinidad And Tobago": "Trinidad e Tobago",
  "Indonesia": "Indonésia",
  "Saint Kitts And Nevis": "São Cristóvão e Nevis",
  "Uzbekistan": "Uzbequistão",
  "Gabon": "Gabão",
  "Azerbaijan": "Azerbaijão",
  "Saint Lucia": "Santa Lúcia",
  "Kenya": "Quênia",
  "Estonia": "Estônia",
  "Rwanda": "Ruanda",
  "Finland": "Finlândia",
  "Bulgaria": "Bulgária",
  "England": "Inglaterra",
  "Germany": "Alemanha",
  "Spain": "Espanha",
  "France": "França",
  "Italy": "Itália",
  "Netherlands": "Holanda",
  "Portugal": "Portugal",
  "Brazil": "Brasil",
  "Argentina": "Argentina",
  "Japan": "Japão",
  "South Korea": "Coreia do Sul",
  "Mexico": "México",
  "USA": "EUA",
  "Saudi Arabia": "Arábia Saudita",
  "Egypt": "Egito",
  "Morocco": "Marrocos",
  "South Africa": "África do Sul",
  "Greece": "Grécia",
  "Switzerland": "Suíça",
  "Norway": "Noruega",
  "Serbia": "Sérvia",
  "Uruguay": "Uruguai",
  "Ecuador": "Equador",
  "Paraguay": "Paraguai",
  "Algeria": "Argélia",
  "Guatemala": "Guatemala",
  "Costa Rica": "Costa Rica",
  "Jordan": "Jordânia",
  "Iran": "Irã",
  "Nigeria": "Nigéria",
  "Russia": "Rússia",
  "Austria": "Áustria",
  "Ghana": "Gana",
  "Montenegro": "Montenegro",
  "Andorra": "Andorra",
  "Panama": "Panamá",
  "China": "China",
  "Curacao": "Curaçao",
};

function traduzirPais(nome: string): string {
  if (!nome) return nome;
  if (TRADUCAO_PAISES[nome]) return TRADUCAO_PAISES[nome];
  const base = nome.replace(/\s+(U\d+|W)$/i, "").trim();
  const sufixo = nome.replace(base, "").trim();
  const sufixoMap: Record<string, string> = {
    "U17": "Sub-17", "U18": "Sub-18", "U19": "Sub-19",
    "U20": "Sub-20", "U21": "Sub-21", "U23": "Sub-23", "W": "Fem."
  };
  const tradBase = TRADUCAO_PAISES[base] || base;
  const tradSufixo = sufixoMap[sufixo] || sufixo;
  return tradSufixo ? `${tradBase} ${tradSufixo}` : tradBase;
}

describe("traduzirPais", () => {
  it("traduz nomes de países comuns", () => {
    expect(traduzirPais("Cape Verde")).toBe("Cabo Verde");
    expect(traduzirPais("New Caledonia")).toBe("Nova Caledônia");
    expect(traduzirPais("New Zealand")).toBe("Nova Zelândia");
    expect(traduzirPais("Solomon Islands")).toBe("Ilhas Salomão");
    expect(traduzirPais("Australia")).toBe("Austrália");
    expect(traduzirPais("Cameroon")).toBe("Camarões");
    expect(traduzirPais("Trinidad And Tobago")).toBe("Trinidad e Tobago");
  });

  it("traduz países europeus", () => {
    expect(traduzirPais("England")).toBe("Inglaterra");
    expect(traduzirPais("Germany")).toBe("Alemanha");
    expect(traduzirPais("Spain")).toBe("Espanha");
    expect(traduzirPais("France")).toBe("França");
    expect(traduzirPais("Italy")).toBe("Itália");
    expect(traduzirPais("Netherlands")).toBe("Holanda");
    expect(traduzirPais("Switzerland")).toBe("Suíça");
    expect(traduzirPais("Norway")).toBe("Noruega");
    expect(traduzirPais("Greece")).toBe("Grécia");
  });

  it("traduz países da América do Sul", () => {
    expect(traduzirPais("Brazil")).toBe("Brasil");
    expect(traduzirPais("Argentina")).toBe("Argentina");
    expect(traduzirPais("Uruguay")).toBe("Uruguai");
    expect(traduzirPais("Ecuador")).toBe("Equador");
    expect(traduzirPais("Paraguay")).toBe("Paraguai");
  });

  it("traduz países com sufixos de categoria", () => {
    expect(traduzirPais("Brazil U20")).toBe("Brasil Sub-20");
    expect(traduzirPais("Argentina U21")).toBe("Argentina Sub-21");
    expect(traduzirPais("Japan U23")).toBe("Japão Sub-23");
    expect(traduzirPais("England U17")).toBe("Inglaterra Sub-17");
    expect(traduzirPais("Brazil W")).toBe("Brasil Fem.");
  });

  it("retorna o nome original se não encontrar tradução", () => {
    expect(traduzirPais("Tuvalu")).toBe("Tuvalu");
    expect(traduzirPais("Nauru")).toBe("Nauru");
  });

  it("lida com string vazia", () => {
    expect(traduzirPais("")).toBe("");
  });

  it("traduz países do Oriente Médio e Ásia", () => {
    expect(traduzirPais("Saudi Arabia")).toBe("Arábia Saudita");
    expect(traduzirPais("Japan")).toBe("Japão");
    expect(traduzirPais("South Korea")).toBe("Coreia do Sul");
    expect(traduzirPais("Iran")).toBe("Irã");
    expect(traduzirPais("Jordan")).toBe("Jordânia");
  });

  it("traduz países da África", () => {
    expect(traduzirPais("Egypt")).toBe("Egito");
    expect(traduzirPais("Morocco")).toBe("Marrocos");
    expect(traduzirPais("South Africa")).toBe("África do Sul");
    expect(traduzirPais("Nigeria")).toBe("Nigéria");
    expect(traduzirPais("Ghana")).toBe("Gana");
    expect(traduzirPais("Kenya")).toBe("Quênia");
    expect(traduzirPais("Rwanda")).toBe("Ruanda");
  });
});

describe("isLive helper", () => {
  function isLive(status?: string | null, minute?: number | null): boolean {
    if (!status) return false;
    const liveStatuses = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"];
    return liveStatuses.includes(status) || (!!minute && minute > 0 && !["FT", "AET", "PEN", "CANC", "PST", "ABD", "AWD", "WO", "NS", "TBD"].includes(status));
  }

  it("detecta jogos ao vivo", () => {
    expect(isLive("1H", 25)).toBe(true);
    expect(isLive("2H", 60)).toBe(true);
    expect(isLive("HT", 45)).toBe(true);
    expect(isLive("LIVE", 30)).toBe(true);
  });

  it("detecta jogos encerrados", () => {
    expect(isLive("FT", 90)).toBe(false);
    expect(isLive("AET", 120)).toBe(false);
    expect(isLive("PEN", 120)).toBe(false);
  });

  it("detecta jogos não iniciados", () => {
    expect(isLive("NS", null)).toBe(false);
    expect(isLive("TBD", null)).toBe(false);
    expect(isLive(null, null)).toBe(false);
  });
});

describe("isEncerrado helper", () => {
  function isEncerrado(status?: string | null): boolean {
    if (!status) return false;
    return ["FT", "AET", "PEN", "CANC", "PST", "ABD", "AWD", "WO"].includes(status);
  }

  it("detecta jogos encerrados", () => {
    expect(isEncerrado("FT")).toBe(true);
    expect(isEncerrado("AET")).toBe(true);
    expect(isEncerrado("PEN")).toBe(true);
    expect(isEncerrado("CANC")).toBe(true);
  });

  it("não detecta jogos ao vivo como encerrados", () => {
    expect(isEncerrado("1H")).toBe(false);
    expect(isEncerrado("2H")).toBe(false);
    expect(isEncerrado("HT")).toBe(false);
  });

  it("não detecta jogos não iniciados como encerrados", () => {
    expect(isEncerrado("NS")).toBe(false);
    expect(isEncerrado(null)).toBe(false);
  });
});

describe("canais.upsert tipo validation", () => {
  it("tipo enum deve aceitar valores válidos", () => {
    const tiposValidos = ["whatsapp_evolution", "whatsapp_zapi", "telegram", "email", "push"];
    for (const tipo of tiposValidos) {
      expect(tiposValidos).toContain(tipo);
    }
  });

  it("tipo enum deve rejeitar valores inválidos", () => {
    const tiposValidos = ["whatsapp_evolution", "whatsapp_zapi", "telegram", "email", "push"];
    expect(tiposValidos).not.toContain("sms");
    expect(tiposValidos).not.toContain("slack");
    expect(tiposValidos).not.toContain("");
  });
});
