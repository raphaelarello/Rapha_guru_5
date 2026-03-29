import axios, { AxiosInstance } from "axios";

/**
 * Serviço de integração com API-Football v3.3
 * Gerencia requisições, cache e rate limiting
 */

const API_KEY = process.env.API_FOOTBALL_KEY || "3d65c1d86af5cf41505092eb69471f41";
const API_BASE_URL = "https://v3.football.api-sports.io";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const RATE_LIMIT_DELAY = 100; // ms entre requisições

interface CacheEntry {
  data: any;
  timestamp: number;
}

class APIFootballService {
  private client: AxiosInstance;
  private cache: Map<string, CacheEntry> = new Map();
  private lastRequestTime: number = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "x-apisports-key": API_KEY,
      },
      timeout: 10000,
    });
  }

  /**
   * Processa fila de requisições com rate limiting
   */
  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
          await new Promise(resolve =>
            setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
          );
        }
        try {
          await request();
        } catch (error) {
          console.error("[APIFootball] Queue error:", error);
        }
        this.lastRequestTime = Date.now();
      }
    }
    this.isProcessingQueue = false;
  }

  /**
   * Faz requisição com cache e rate limiting
   */
  private async request<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    const cacheKey = `${endpoint}:${JSON.stringify(params || {})}`;

    // Verifica cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const response = await this.client.get<any>(endpoint, { params });
          const data = response.data.response;
          
          // Armazena em cache
          this.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
          });

          resolve(data);
        } catch (error) {
          console.error(`[APIFootball] Error on ${endpoint}:`, error);
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  /**
   * Limpa cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Obtém estatísticas de cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        age: Date.now() - value.timestamp,
      })),
    };
  }

  // ===== ENDPOINTS =====

  /**
   * Obtém jogos em tempo real
   */
  async getLiveFixtures() {
    return this.request("/fixtures", { live: "all" });
  }

  /**
   * Obtém jogos por data
   */
  async getFixturesByDate(date: string, timezone = "America/Sao_Paulo") {
    return this.request("/fixtures", { date, timezone });
  }

  /**
   * Obtém jogos por liga e temporada
   */
  async getFixturesByLeague(league: number, season: number) {
    return this.request("/fixtures", { league, season });
  }

  /**
   * Obtém jogo específico
   */
  async getFixtureById(fixtureId: number) {
    return this.request("/fixtures", { id: fixtureId });
  }

  /**
   * Obtém eventos de um jogo
   */
  async getFixtureEvents(fixtureId: number) {
    return this.request("/fixtures/events", { fixture: fixtureId });
  }

  /**
   * Obtém estatísticas de um jogo
   */
  async getFixtureStatistics(fixtureId: number) {
    return this.request("/fixtures/statistics", { fixture: fixtureId });
  }

  /**
   * Obtém escalações de um jogo
   */
  async getFixtureLineups(fixtureId: number) {
    return this.request("/fixtures/lineups", { fixture: fixtureId });
  }

  /**
   * Obtém previsões de um jogo
   */
  async getFixturePredictions(fixtureId: number) {
    return this.request("/predictions", { fixture: fixtureId });
  }

  /**
   * Obtém tabela de classificação
   */
  async getStandings(league: number, season: number) {
    return this.request("/standings", { league, season });
  }

  /**
   * Obtém últimos N jogos de um time
   */
  async getTeamLastFixtures(teamId: number, last = 5) {
    return this.request("/fixtures", { team: teamId, last });
  }

  /**
   * Obtém times
   */
  async getTeams(params?: {
    id?: number;
    name?: string;
    league?: number;
    country?: string;
    season?: number;
  }) {
    return this.request("/teams", params);
  }

  /**
   * Obtém jogadores
   */
  async getPlayers(params?: {
    id?: number;
    search?: string;
    team?: number;
    league?: number;
    season?: number;
  }) {
    return this.request("/players", params);
  }

  /**
   * Obtém artilheiros
   */
  async getTopScorers(league: number, season: number) {
    return this.request("/players/topscorers", { league, season });
  }

  /**
   * Obtém lesões
   */
  async getInjuries(params?: {
    league?: number;
    season?: number;
    team?: number;
    player?: number;
    fixture?: number;
    date?: string;
  }) {
    return this.request("/injuries", params);
  }

  /**
   * Obtém odds em tempo real
   */
  async getOdds(fixtureId: number, params?: {
    bookmaker?: string;
    bet?: string;
  }) {
    return this.request("/odds", { fixture: fixtureId, ...params });
  }

  /**
   * Obtém odds pré-jogo
   */
  async getPreMatchOdds(fixtureId: number, params?: {
    bookmaker?: string;
    bet?: string;
  }) {
    return this.request("/odds/prematch", { fixture: fixtureId, ...params });
  }

  /**
   * Obtém ligas
   */
  async getLeagues(params?: {
    id?: number;
    name?: string;
    country?: string;
    type?: string;
    current?: boolean;
    season?: number;
  }) {
    return this.request("/leagues", params);
  }

  /**
   * Obtém países
   */
  async getCountries() {
    return this.request("/countries");
  }

  /**
   * Obtém técnicos
   */
  async getCoaches(params?: {
    id?: number;
    team?: number;
  }) {
    return this.request("/coachs", params);
  }

  /**
   * Obtém transferências
   */
  async getTransfers(params?: {
    player?: number;
    team?: number;
  }) {
    return this.request("/transfers", params);
  }

  /**
   * Obtém troféus
   */
  async getTrophies(params?: {
    player?: number;
    coach?: number;
  }) {
    return this.request("/trophies", params);
  }

  /**
   * Obtém jogadores suspensos
   */
  async getSidelined(params?: {
    player?: number;
    team?: number;
    league?: number;
    season?: number;
  }) {
    return this.request("/sidelined", params);
  }

  /**
   * Obtém status da API
   */
  async getStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/status`, {
        headers: {
          "x-apisports-key": API_KEY,
        },
      });
      return response.data;
    } catch (error) {
      console.error("[APIFootball] Status error:", error);
      throw error;
    }
  }

  /**
   * Busca times por nome
   */
  async searchTeams(query: string) {
    return this.makeRequest(`/teams?search=${encodeURIComponent(query)}`);
  }

  /**
   * Busca ligas por nome
   */
  async searchLeagues(query: string) {
    return this.makeRequest(`/leagues?search=${encodeURIComponent(query)}`);
  }

  /**
   * Busca jogos por times ou liga
   */
  async searchFixtures(query: string, date?: string) {
    const dateParam = date ? `&date=${date}` : '';
    return this.makeRequest(`/fixtures?search=${encodeURIComponent(query)}${dateParam}`);
  }
}

// Exporta instância única
export const apiFootball = new APIFootballService();
