import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "superadmin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Bots automáticos
export const bots = mysqlTable("bots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  templateId: varchar("templateId", { length: 100 }),
  ativo: boolean("ativo").default(false).notNull(),
  confiancaMinima: int("confiancaMinima").default(70).notNull(),
  limiteDiario: int("limiteDiario").default(10).notNull(),
  totalSinais: int("totalSinais").default(0).notNull(),
  totalAcertos: int("totalAcertos").default(0).notNull(),
  regras: json("regras"),
  filtros: json("filtros"), // filtros avançados: ligas, minuto, placar, odds, etc.
  canal: varchar("canal", { length: 100 }).default("painel"),
  taxaAcerto: decimal("taxaAcerto", { precision: 5, scale: 2 }).default("0"),
  historicoPerformance: json("historicoPerformance"), // [{data: string, taxa: number}]
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bot = typeof bots.$inferSelect;
export type InsertBot = typeof bots.$inferInsert;

// Canais de notificação
export const canais = mysqlTable("canais", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tipo: mysqlEnum("tipo", ["whatsapp_evolution", "whatsapp_zapi", "telegram", "email", "push"]).notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  ativo: boolean("ativo").default(false).notNull(),
  config: json("config"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Canal = typeof canais.$inferSelect;
export type InsertCanal = typeof canais.$inferInsert;

// Alertas/Sinais gerados pelos bots
export const alertas = mysqlTable("alertas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  botId: int("botId"),
  jogo: varchar("jogo", { length: 255 }).notNull(),
  liga: varchar("liga", { length: 255 }),
  mercado: varchar("mercado", { length: 255 }).notNull(),
  odd: decimal("odd", { precision: 8, scale: 2 }).notNull(),
  ev: decimal("ev", { precision: 8, scale: 2 }),
  confianca: int("confianca").notNull(),
  motivos: json("motivos"),
  resultado: mysqlEnum("resultado", ["pendente", "green", "red", "void"]).default("pendente").notNull(),
  enviado: boolean("enviado").default(false).notNull(),
  canaisEnviados: json("canaisEnviados"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Alerta = typeof alertas.$inferSelect;
export type InsertAlerta = typeof alertas.$inferInsert;

// Banca do usuário
export const bancas = mysqlTable("bancas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  valorTotal: decimal("valorTotal", { precision: 12, scale: 2 }).default("1000.00").notNull(),
  valorAtual: decimal("valorAtual", { precision: 12, scale: 2 }).default("1000.00").notNull(),
  stopLoss: decimal("stopLoss", { precision: 5, scale: 2 }).default("20.00").notNull(),
  stopGain: decimal("stopGain", { precision: 5, scale: 2 }).default("50.00").notNull(),
  kellyFracao: decimal("kellyFracao", { precision: 3, scale: 2 }).default("0.25").notNull(),
  ativa: boolean("ativa").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Banca = typeof bancas.$inferSelect;
export type InsertBanca = typeof bancas.$inferInsert;

// Registro de apostas
export const apostas = mysqlTable("apostas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  alertaId: int("alertaId"),
  jogo: varchar("jogo", { length: 255 }).notNull(),
  mercado: varchar("mercado", { length: 255 }).notNull(),
  odd: decimal("odd", { precision: 8, scale: 2 }).notNull(),
  stake: decimal("stake", { precision: 12, scale: 2 }).notNull(),
  resultado: mysqlEnum("resultado", ["pendente", "green", "red", "void"]).default("pendente").notNull(),
  lucro: decimal("lucro", { precision: 12, scale: 2 }),
  roi: decimal("roi", { precision: 8, scale: 2 }),
  dataJogo: timestamp("dataJogo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Aposta = typeof apostas.$inferSelect;
export type InsertAposta = typeof apostas.$inferInsert;

// Pitacos (análises manuais)
export const pitacos = mysqlTable("pitacos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  jogo: varchar("jogo", { length: 255 }).notNull(),
  liga: varchar("liga", { length: 255 }),
  mercado: varchar("mercado", { length: 255 }).notNull(),
  odd: decimal("odd", { precision: 8, scale: 2 }).notNull(),
  analise: text("analise"),
  confianca: int("confianca").default(70).notNull(),
  resultado: mysqlEnum("resultado", ["pendente", "green", "red", "void"]).default("pendente").notNull(),
  // Multi-mercado: array de { tipo, label, valorPrevisto, valorReal, acertou, peso }
  mercadosPrevistos: json("mercadosPrevistos"),
  // Score de precisão calculado: 0-100 (acertos ponderados / total de mercados)
  scorePrevisao: decimal("scorePrevisao", { precision: 5, scale: 2 }),
  // Placar final real
  placarFinal: varchar("placarFinal", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pitaco = typeof pitacos.$inferSelect;
export type InsertPitaco = typeof pitacos.$inferInsert;

// Push Subscriptions (Web Push Notifications)
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PushSubscriptionRecord = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// Histórico de jogos ao vivo (termômetro de calor)
export const liveGameHistory = mysqlTable("live_game_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fixtureId: int("fixtureId").notNull(),
  jogo: varchar("jogo", { length: 255 }).notNull(),
  liga: varchar("liga", { length: 255 }),
  paisBandeira: varchar("paisBandeira", { length: 10 }),
  minuto: int("minuto"),
  golsCasa: int("golsCasa").default(0),
  golsVisit: int("golsVisit").default(0),
  scoreCalor: int("scoreCalor").default(0),
  nivelCalor: varchar("nivelCalor", { length: 20 }),
  escanteiosCasa: int("escanteiosCasa").default(0),
  escanteiosVisit: int("escanteiosVisit").default(0),
  cartoesCasa: int("cartoesCasa").default(0),
  cartoesVisit: int("cartoesVisit").default(0),
  totalSinais: int("totalSinais").default(0),
  golsOcorreram: boolean("golsOcorreram").default(false),
  placarFinal: varchar("placarFinal", { length: 20 }),
  acertouTermometro: boolean("acertouTermometro"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LiveGameHistoryRecord = typeof liveGameHistory.$inferSelect;
export type InsertLiveGameHistory = typeof liveGameHistory.$inferInsert;

// Histórico de Gold Picks (para análise de acurácia)
export const picksHistory = mysqlTable("picks_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fixtureId: int("fixtureId").notNull(),
  leagueName: varchar("leagueName", { length: 255 }),
  homeTeam: varchar("homeTeam", { length: 255 }),
  awayTeam: varchar("awayTeam", { length: 255 }),
  market: varchar("market", { length: 50 }).notNull(), // FT_1X2, OU_25, BTTS, etc
  selection: varchar("selection", { length: 100 }).notNull(), // Over 2.5, BTTS Yes, etc
  edge: decimal("edge", { precision: 8, scale: 4 }).notNull(), // % de edge
  ev: decimal("ev", { precision: 8, scale: 4 }).notNull(), // Expected Value %
  odd: decimal("odd", { precision: 8, scale: 2 }).notNull(), // Odd oferecida
  modelProb: decimal("modelProb", { precision: 5, scale: 4 }).notNull(), // Probabilidade do modelo
  confidence: int("confidence").default(0), // 0-100
  status: mysqlEnum("status", ["LIVE", "UPCOMING", "FINISHED", "CANCELLED"]).default("UPCOMING").notNull(),
  result: mysqlEnum("result", ["pending", "won", "lost", "void"]).default("pending").notNull(),
  resultDetails: json("resultDetails"), // { actualResult, finalScore, etc }
  kellyFraction: decimal("kellyFraction", { precision: 5, scale: 4 }), // f* calculado
  recommendedStake: decimal("recommendedStake", { precision: 12, scale: 2 }), // Stake recomendado
  actualStake: decimal("actualStake", { precision: 12, scale: 2 }), // Stake real (se apostado)
  profit: decimal("profit", { precision: 12, scale: 2 }), // Lucro/Prejuízo
  roi: decimal("roi", { precision: 8, scale: 2 }), // ROI %
  notificationSent: boolean("notificationSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PickHistory = typeof picksHistory.$inferSelect;
export type InsertPickHistory = typeof picksHistory.$inferInsert;

// ─── PITACOS ENGINE TABLES ───────────────────────────────────────────────

/**
 * Match Outcomes - Histórico de resultados finais de partidas
 */
export const matchOutcomes = mysqlTable("match_outcomes", {
  id: int("id").autoincrement().primaryKey(),
  fixtureId: int("fixtureId").notNull().unique(),
  leagueId: int("leagueId"),
  leagueName: varchar("leagueName", { length: 255 }),
  homeTeam: varchar("homeTeam", { length: 255 }).notNull(),
  awayTeam: varchar("awayTeam", { length: 255 }).notNull(),
  finalScore: varchar("finalScore", { length: 20 }).notNull(),
  shotsHome: int("shotsHome"),
  shotsAway: int("shotsAway"),
  sotHome: int("sotHome"),
  sotAway: int("sotAway"),
  cornersHome: int("cornersHome"),
  cornersAway: int("cornersAway"),
  possessionHome: int("possessionHome"),
  possessionAway: int("possessionAway"),
  yellowCardsHome: int("yellowCardsHome"),
  yellowCardsAway: int("yellowCardsAway"),
  redCardsHome: int("redCardsHome"),
  redCardsAway: int("redCardsAway"),
  goalOutcome: varchar("goalOutcome", { length: 50 }),
  bttsOutcome: varchar("bttsOutcome", { length: 50 }),
  ft1x2Outcome: varchar("ft1x2Outcome", { length: 50 }),
  matchDate: timestamp("matchDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchOutcome = typeof matchOutcomes.$inferSelect;
export type InsertMatchOutcome = typeof matchOutcomes.$inferInsert;

/**
 * Match Feature Snapshots - Snapshots de features em diferentes momentos
 */
export const matchFeatureSnapshots = mysqlTable("match_feature_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  fixtureId: int("fixtureId").notNull(),
  leagueName: varchar("leagueName", { length: 255 }),
  minute: int("minute").notNull(),
  status: mysqlEnum("status", ["UPCOMING", "LIVE", "FINISHED"]).notNull(),
  scoreHome: int("scoreHome").default(0),
  scoreAway: int("scoreAway").default(0),
  pressureScore: int("pressureScore"),
  pressureSide: varchar("pressureSide", { length: 20 }),
  tempoScore: int("tempoScore"),
  sotRate10m: decimal("sotRate10m", { precision: 8, scale: 2 }),
  cornersRate10m: decimal("cornersRate10m", { precision: 8, scale: 2 }),
  disciplineRisk: int("disciplineRisk"),
  goalProb: int("goalProb"),
  cornerProb: int("cornerProb"),
  cardProb: int("cardProb"),
  comebackProb: int("comebackProb"),
  comebackSide: varchar("comebackSide", { length: 20 }),
  stats: json("stats"),
  odds: json("odds"),
  reasons: json("reasons"),
  riskFlags: json("riskFlags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchFeatureSnapshot = typeof matchFeatureSnapshots.$inferSelect;
export type InsertMatchFeatureSnapshot = typeof matchFeatureSnapshots.$inferInsert;

/**
 * Odds History - Histórico de odds
 */
export const oddsHistory = mysqlTable("odds_history", {
  id: int("id").autoincrement().primaryKey(),
  fixtureId: int("fixtureId").notNull(),
  leagueName: varchar("leagueName", { length: 255 }),
  market: varchar("market", { length: 50 }).notNull(),
  selection: varchar("selection", { length: 100 }),
  oddValue: decimal("oddValue", { precision: 8, scale: 2 }),
  bookmaker: varchar("bookmaker", { length: 100 }),
  delta5m: decimal("delta5m", { precision: 8, scale: 4 }),
  stale: boolean("stale").default(false),
  updatedSecAgo: int("updatedSecAgo"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type OddsHistoryRecord = typeof oddsHistory.$inferSelect;
export type InsertOddsHistory = typeof oddsHistory.$inferInsert;

/**
 * Pick Outcomes - Avaliação de picks por tópico
 */
export const pickOutcomes = mysqlTable("pick_outcomes", {
  id: int("id").autoincrement().primaryKey(),
  pickId: int("pickId").notNull(),
  userId: int("userId").notNull(),
  fixtureId: int("fixtureId").notNull(),
  topic: varchar("topic", { length: 100 }).notNull(),
  market: varchar("market", { length: 50 }),
  selection: varchar("selection", { length: 100 }),
  hit: boolean("hit"),
  confidence: int("confidence"),
  brier: decimal("brier", { precision: 8, scale: 4 }),
  logLoss: decimal("logLoss", { precision: 8, scale: 4 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PickOutcome = typeof pickOutcomes.$inferSelect;
export type InsertPickOutcome = typeof pickOutcomes.$inferInsert;

/**
 * Tickets - Bilhetes com múltiplos tópicos
 */
export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fixtureId: int("fixtureId").notNull(),
  leagueName: varchar("leagueName", { length: 255 }),
  homeTeam: varchar("homeTeam", { length: 255 }),
  awayTeam: varchar("awayTeam", { length: 255 }),
  topicCount: int("topicCount").notNull(),
  totalOdd: decimal("totalOdd", { precision: 12, scale: 4 }),
  stake: decimal("stake", { precision: 12, scale: 2 }),
  status: mysqlEnum("status", ["PENDING", "WON", "LOST", "VOID"]).default("PENDING").notNull(),
  finalScore: varchar("finalScore", { length: 20 }),
  profit: decimal("profit", { precision: 12, scale: 2 }),
  roi: decimal("roi", { precision: 8, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

/**
 * Ticket Topics - Tópicos dentro de um bilhete
 */
export const ticketTopics = mysqlTable("ticket_topics", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  topic: varchar("topic", { length: 100 }).notNull(),
  market: varchar("market", { length: 50 }),
  selection: varchar("selection", { length: 100 }),
  odd: decimal("odd", { precision: 8, scale: 2 }),
  confidence: int("confidence"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TicketTopic = typeof ticketTopics.$inferSelect;
export type InsertTicketTopic = typeof ticketTopics.$inferInsert;

/**
 * Ticket Outcomes - Resultado de cada tópico no bilhete
 */
export const ticketOutcomes = mysqlTable("ticket_outcomes", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  topicId: int("topicId").notNull(),
  hit: boolean("hit"),
  confidence: int("confidence"),
  brier: decimal("brier", { precision: 8, scale: 4 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TicketOutcome = typeof ticketOutcomes.$inferSelect;
export type InsertTicketOutcome = typeof ticketOutcomes.$inferInsert;

/**
 * Daily Reports - Relatório gerado às 08:00
 */
export const dailyReports = mysqlTable("daily_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reportDate: timestamp("reportDate").notNull(),
  totalMatches: int("totalMatches"),
  totalPicks: int("totalPicks"),
  totalHits: int("totalHits"),
  totalMisses: int("totalMisses"),
  hitRate: decimal("hitRate", { precision: 5, scale: 2 }),
  byLeague: json("byLeague"),
  byMarket: json("byMarket"),
  topLeagues: json("topLeagues"),
  topMarkets: json("topMarkets"),
  avgConfidence: decimal("avgConfidence", { precision: 5, scale: 2 }),
  avgBrier: decimal("avgBrier", { precision: 8, scale: 4 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = typeof dailyReports.$inferInsert;

/**
 * Notifications - Histórico de notificações
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  titulo: varchar("titulo", { length: 255 }),
  mensagem: text("mensagem"),
  canais: json("canais"),
  enviado: boolean("enviado").default(false),
  lido: boolean("lido").default(false),
  fixtureId: int("fixtureId"),
  pickId: int("pickId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Hot Players - Jogadores quentes/indisciplinados
 */
export const hotPlayers = mysqlTable("hot_players", {
  id: int("id").autoincrement().primaryKey(),
  fixtureId: int("fixtureId").notNull(),
  leagueName: varchar("leagueName", { length: 255 }),
  playerName: varchar("playerName", { length: 255 }).notNull(),
  teamName: varchar("teamName", { length: 255 }),
  tipo: mysqlEnum("tipo", ["hot", "disciplined", "injured"]).notNull(),
  razao: varchar("razao", { length: 255 }),
  score: int("score"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HotPlayer = typeof hotPlayers.$inferSelect;
export type InsertHotPlayer = typeof hotPlayers.$inferInsert;

/**
 * League Season Stats - Estatísticas por liga/temporada
 */
export const leagueSeasonStats = mysqlTable("league_season_stats", {
  id: int("id").autoincrement().primaryKey(),
  leagueId: int("leagueId"),
  leagueName: varchar("leagueName", { length: 255 }).notNull(),
  season: int("season").notNull(),
  totalMatches: int("totalMatches"),
  totalGoals: int("totalGoals"),
  avgGoalsPerMatch: decimal("avgGoalsPerMatch", { precision: 5, scale: 2 }),
  avgCorners: decimal("avgCorners", { precision: 5, scale: 2 }),
  avgCards: decimal("avgCards", { precision: 5, scale: 2 }),
  ou25Rate: decimal("ou25Rate", { precision: 5, scale: 2 }),
  bttsRate: decimal("bttsRate", { precision: 5, scale: 2 }),
  predictability: decimal("predictability", { precision: 5, scale: 2 }),
  volatility: decimal("volatility", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeagueSeasonStat = typeof leagueSeasonStats.$inferSelect;
export type InsertLeagueSeasonStat = typeof leagueSeasonStats.$inferInsert;
