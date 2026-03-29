/**
 * Cache Manager - Otimização agressiva de performance
 * Implementa cache em múltiplas camadas com TTL adaptativo
 */

interface CacheConfig {
  ttl: number; // milliseconds
  maxSize?: number; // max entries
  compress?: boolean;
}

const CACHE_CONFIGS = {
  liveFixtures: { ttl: 10 * 1000, maxSize: 100 }, // 10s - muda frequentemente
  jogosHoje: { ttl: 30 * 1000, maxSize: 500 }, // 30s - menos frequente
  destaquesScanner: { ttl: 60 * 1000, maxSize: 200 }, // 60s - pode ser mais antigo
  standings: { ttl: 5 * 60 * 1000, maxSize: 100 }, // 5min - raramente muda
  teams: { ttl: 24 * 60 * 60 * 1000, maxSize: 500 }, // 24h - estático
  players: { ttl: 24 * 60 * 60 * 1000, maxSize: 1000 }, // 24h - estático
};

class CacheManager {
  private caches: Map<string, Map<string, { data: any; expires: number }>> = new Map();
  private stats = { hits: 0, misses: 0, evictions: 0 };

  set(namespace: string, key: string, value: any, ttl?: number) {
    if (!this.caches.has(namespace)) {
      this.caches.set(namespace, new Map());
    }

    const cache = this.caches.get(namespace)!;
    const config = CACHE_CONFIGS[namespace as keyof typeof CACHE_CONFIGS];
    const actualTtl = ttl || config?.ttl || 60000;

    // Evict if cache is full
    if (config?.maxSize && cache.size >= config.maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
        this.stats.evictions++;
      }
    }

    cache.set(key, {
      data: value,
      expires: Date.now() + actualTtl,
    });
  }

  get(namespace: string, key: string): any | null {
    const cache = this.caches.get(namespace);
    if (!cache) {
      this.stats.misses++;
      return null;
    }

    const entry = cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expires) {
      cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  clear(namespace?: string) {
    if (namespace) {
      this.caches.delete(namespace);
    } else {
      this.caches.clear();
    }
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + "%" : "0%",
      totalCaches: this.caches.size,
      totalEntries: Array.from(this.caches.values()).reduce((sum, cache) => sum + cache.size, 0),
    };
  }
}

export const cacheManager = new CacheManager();

/**
 * Payload Reduction - Remove campos desnecessários
 */
export function reduceFixturePayload(fixture: any) {
  return {
    id: fixture.fixture.id,
    date: fixture.fixture.date,
    status: fixture.fixture.status.short,
    venue: fixture.fixture.venue?.name,
    city: fixture.fixture.venue?.city,
    league: {
      id: fixture.league.id,
      name: fixture.league.name,
      logo: fixture.league.logo,
    },
    home: {
      id: fixture.teams.home.id,
      name: fixture.teams.home.name,
      logo: fixture.teams.home.logo,
    },
    away: {
      id: fixture.teams.away.id,
      name: fixture.teams.away.name,
      logo: fixture.teams.away.logo,
    },
    goals: fixture.goals,
    score: fixture.score,
    events: fixture.events?.slice(0, 20) || [], // Limit events
    statistics: fixture.statistics || [],
  };
}

export function reduceLeaguePayload(league: any) {
  return {
    id: league.league.id,
    name: league.league.name,
    logo: league.league.logo,
    country: league.league.country,
  };
}

export function reduceTeamPayload(team: any) {
  return {
    id: team.team.id,
    name: team.team.name,
    logo: team.team.logo,
  };
}
