import { createClient, RedisClientType } from 'redis';

class RedisManager {
  private client: RedisClientType | null = null;
  private connected = false;

  /**
   * Conectar ao Redis
   * Se Redis não estiver disponível, funciona em modo fallback (memória)
   */
  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = createClient({ url: redisUrl });

      this.client.on('error', (err) => {
        console.error('[Redis] Erro:', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('[Redis] Conectado');
        this.connected = true;
      });

      await this.client.connect();
      this.connected = true;
    } catch (error) {
      console.warn('[Redis] Não disponível, usando fallback em memória:', error);
      this.connected = false;
    }
  }

  /**
   * Obter valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.connected || !this.client) return null;

    try {
      const value = await this.client.get(key);
      if (value) {
        console.log(`[Redis] HIT: ${key}`);
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      console.error(`[Redis] Erro ao obter ${key}:`, error);
      return null;
    }
  }

  /**
   * Definir valor no cache com TTL
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 60): Promise<void> {
    if (!this.connected || !this.client) return;

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      console.log(`[Redis] SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      console.error(`[Redis] Erro ao definir ${key}:`, error);
    }
  }

  /**
   * Deletar chave
   */
  async delete(key: string): Promise<void> {
    if (!this.connected || !this.client) return;

    try {
      await this.client.del(key);
      console.log(`[Redis] DEL: ${key}`);
    } catch (error) {
      console.error(`[Redis] Erro ao deletar ${key}:`, error);
    }
  }

  /**
   * Limpar todas as chaves
   */
  async clear(): Promise<void> {
    if (!this.connected || !this.client) return;

    try {
      await this.client.flushDb();
      console.log('[Redis] Cache limpo');
    } catch (error) {
      console.error('[Redis] Erro ao limpar cache:', error);
    }
  }

  /**
   * Obter informações de status
   */
  async getStatus(): Promise<{ connected: boolean; info?: string }> {
    if (!this.connected || !this.client) {
      return { connected: false };
    }

    try {
      const info = await this.client.info();
      return { connected: true, info };
    } catch (error) {
      return { connected: false };
    }
  }

  /**
   * Desconectar
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
      console.log('[Redis] Desconectado');
    }
  }
}

export const redisManager = new RedisManager();

// Inicializar Redis na inicialização do servidor
if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
  redisManager.connect().catch(console.error);
}
