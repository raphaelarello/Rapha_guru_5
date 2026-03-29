import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { wsManager } from "../websocket";
import { redisManager } from "../redis-manager";

// Adicionar timeout para conexões Redis
const REDIS_CONNECT_TIMEOUT = 2000; // 2 segundos

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Inicializar WebSocket
  wsManager.initialize(server);
  
  // Conectar ao Redis (não-bloqueante - fire and forget)
  redisManager.connect().catch((err) => {
    console.warn('[Redis] Falha ao conectar (usando fallback em memória):', err.message);
  });
  
  // Aumentar timeout global para 30s
  server.setTimeout(30 * 1000);
  server.keepAliveTimeout = 65 * 1000;
  
  // Configure body parser com limite maior
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Middleware para logging de performance
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 1000) {
        console.log(`[SLOW] ${req.method} ${req.path} - ${duration}ms`);
      }
      // Emitir métrica de performance via WebSocket
      if (duration > 5000) {
        wsManager.broadcast('admin', {
          type: 'stats_update',
          data: { path: req.path, duration, method: req.method },
          timestamp: Date.now(),
        });
      }
    });
    next();
  });
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Em produção, sempre usar a porta especificada
  // Em desenvolvimento, tentar portas alternativas
  let port = parseInt(process.env.PORT || "3000");
  
  if (process.env.NODE_ENV === "development") {
    port = await findAvailablePort(port);
    if (port !== parseInt(process.env.PORT || "3000")) {
      console.log(`Port ${process.env.PORT || "3000"} is busy, using port ${port} instead`);
    }
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    console.log(`WebSocket disponível em ws://0.0.0.0:${port}`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM recebido, encerrando...');
    wsManager.close();
    try {
      await redisManager.disconnect();
    } catch (err) {
      console.warn('Erro ao desconectar Redis:', err);
    }
    process.exit(0);
  });
}

startServer().catch((error) => {
  console.error('Erro CRÍTICO ao iniciar servidor:', error);
  // Não sair imediatamente - dar tempo para debug
  setTimeout(() => process.exit(1), 5000);
});
