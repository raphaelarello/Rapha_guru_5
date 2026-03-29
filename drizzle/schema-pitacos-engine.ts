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

/**
 * Match Outcomes - Histórico de resultados finais de partidas
 * Usado para calibração de modelos e análise de acurácia
 */
export const matchOutcomes = mysqlTable("match_outcomes", {
  id: int("id").autoincrement().primaryKey(),
  fixtureId: int("fixtureId").notNull().unique(),
  leagueId: int("leagueId"),
  leagueName: varchar("leagueName", { length: 255 }),
  homeTeam: varchar("homeTeam", { length: 255 }).notNull(),
  awayTeam: varchar("awayTeam", { length: 255 }).notNull(),
  finalScore: varchar("finalScore", { length: 20 }).notNull(), // "2-1"
  
  // Estatísticas finais
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
  
  // Mercados finais
  goalOutcome: varchar("goalOutcome", { length: 50 }), // "OVER_25", "UNDER_25"
  bttsOutcome: varchar("bttsOutcome", { length: 50 }), // "YES", "NO"
  ft1x2Outcome: varchar("ft1x2Outcome", { length: 50 }), // "HOME", "DRAW", "AWAY"
  
  matchDate: timestamp("matchDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchOutcome = typeof matchOutcomes.$inferSelect;
export type InsertMatchOutcome = typeof matchOutcomes.$inferInsert;

/**
 * Match Feature Snapshots - Snapshots de features em diferentes momentos
 * Usado para análise em tempo real e treinamento de modelos
 */
export const matchFeatureSnapshots = mysqlTable("match_feature_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  fixtureId: int("fixtureId").notNull(),
  leagueName: varchar("leagueName", { length: 255 }),
  minute: int("minute").notNull(),
  status: mysqlEnum("status", ["UPCOMING", "LIVE", "FINISHED"]).notNull(),
  
  // Score atual
  scoreHome: int("scoreHome").default(0),
  scoreAway: int("scoreAway").default(0),
  
  // Features calculadas
  pressureScore: int("pressureScore"), // 0-100
  pressureSide: varchar("pressureSide", { length: 20 }), // "home", "away", "balanced"
  tempoScore: int("tempoScore"), // 0-100
  sotRate10m: decimal("sotRate10m", { precision: 8, scale: 2 }),
  cornersRate10m: decimal("cornersRate10m", { precision: 8, scale: 2 }),
  disciplineRisk: int("disciplineRisk"), // 0-100
  
  // Next 10 probabilities
  goalProb: int("goalProb"), // 0-100
  cornerProb: int("cornerProb"), // 0-100
  cardProb: int("cardProb"), // 0-100
  
  // Comeback probability
  comebackProb: int("comebackProb"), // 0-100
  comebackSide: varchar("comebackSide", { length: 20 }), // "home", "away", "balanced"
  
  // Raw stats
  stats: json("stats"), // CoreStats
  odds: json("odds"), // OddsMarket[]
  reasons: json("reasons"), // string[]
  riskFlags: json("riskFlags"), // string[]
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchFeatureSnapshot = typeof matchFeatureSnapshots.$inferSelect;
export type InsertMatchFeatureSnapshot = typeof matchFeatureSnapshots.$inferInsert;

/**
 * Odds History - Histórico de odds para análise de movimento
 */
export const oddsHistory = mysqlTable("odds_history", {
  id: int("id").autoincrement().primaryKey(),
  fixtureId: int("fixtureId").notNull(),
  leagueName: varchar("leagueName", { length: 255 }),
  market: varchar("market", { length: 50 }).notNull(), // "OU_25", "BTTS", "FT_1X2"
  
  // Odds por seleção
  selection: varchar("selection", { length: 100 }),
  oddValue: decimal("oddValue", { precision: 8, scale: 2 }),
  bookmaker: varchar("bookmaker", { length: 100 }),
  
  // Movimento
  delta5m: decimal("delta5m", { precision: 8, scale: 4 }),
  stale: boolean("stale").default(false),
  updatedSecAgo: int("updatedSecAgo"),
  
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type OddsHistoryRecord = typeof oddsHistory.$inferSelect;
export type InsertOddsHistory = typeof oddsHistory.$inferInsert;

/**
 * Picks History (expandido) - Histórico de picks com avaliação
 */
export const picksHistoryExpanded = mysqlTable("picks_history_expanded", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fixtureId: int("fixtureId").notNull(),
  leagueName: varchar("leagueName", { length: 255 }),
  homeTeam: varchar("homeTeam", { length: 255 }),
  awayTeam: varchar("awayTeam", { length: 255 }),
  
  // Múltiplos mercados
  markets: json("markets"), // [{ market, selection, odd, confidence, edge, ev }]
  
  // Avaliação
  status: mysqlEnum("status", ["LIVE", "UPCOMING", "FINISHED", "CANCELLED"]).default("UPCOMING").notNull(),
  result: mysqlEnum("result", ["pending", "won", "lost", "void"]).default("pending").notNull(),
  
  // Score e calibração
  confidenceScore: int("confidenceScore"), // 0-100
  riskScore: int("riskScore"), // 0-100
  
  // Resultado final
  finalScore: varchar("finalScore", { length: 20 }),
  resultDetails: json("resultDetails"),
  
  // Lucro/prejuízo
  profit: decimal("profit", { precision: 12, scale: 2 }),
  roi: decimal("roi", { precision: 8, scale: 2 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PickHistoryExpanded = typeof picksHistoryExpanded.$inferSelect;
export type InsertPickHistoryExpanded = typeof picksHistoryExpanded.$inferInsert;

/**
 * Pick Outcomes - Avaliação de picks por tópico
 */
export const pickOutcomes = mysqlTable("pick_outcomes", {
  id: int("id").autoincrement().primaryKey(),
  pickId: int("pickId").notNull(),
  userId: int("userId").notNull(),
  fixtureId: int("fixtureId").notNull(),
  
  // Tópico/mercado
  topic: varchar("topic", { length: 100 }).notNull(), // "GOAL_NEXT10", "CORNERS_OU_9_5", etc
  market: varchar("market", { length: 50 }),
  selection: varchar("selection", { length: 100 }),
  
  // Resultado
  hit: boolean("hit"), // acertou ou errou
  confidence: int("confidence"), // 0-100
  
  // Calibração
  brier: decimal("brier", { precision: 8, scale: 4 }), // (confidence/100 - hit)^2
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
  
  // Composição
  topicCount: int("topicCount").notNull(),
  totalOdd: decimal("totalOdd", { precision: 12, scale: 4 }),
  stake: decimal("stake", { precision: 12, scale: 2 }),
  
  // Status
  status: mysqlEnum("status", ["PENDING", "WON", "LOST", "VOID"]).default("PENDING").notNull(),
  
  // Resultado
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
  
  // Resultado
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
  
  // Resumo do dia
  totalMatches: int("totalMatches"),
  totalPicks: int("totalPicks"),
  totalHits: int("totalHits"),
  totalMisses: int("totalMisses"),
  hitRate: decimal("hitRate", { precision: 5, scale: 2 }),
  
  // Por liga
  byLeague: json("byLeague"), // [{ league, matches, hits, rate }]
  
  // Por mercado
  byMarket: json("byMarket"), // [{ market, total, hits, rate }]
  
  // Top performers
  topLeagues: json("topLeagues"),
  topMarkets: json("topMarkets"),
  
  // Calibração
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
  
  // Conteúdo
  tipo: varchar("tipo", { length: 50 }).notNull(), // "pick", "alert", "report"
  titulo: varchar("titulo", { length: 255 }),
  mensagem: text("mensagem"),
  
  // Canais
  canais: json("canais"), // ["web", "email", "telegram", "whatsapp"]
  
  // Status
  enviado: boolean("enviado").default(false),
  lido: boolean("lido").default(false),
  
  // Metadata
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
  
  // Tipo
  tipo: mysqlEnum("tipo", ["hot", "disciplined", "injured"]).notNull(),
  
  // Razão
  razao: varchar("razao", { length: 255 }),
  
  // Métrica
  score: int("score"), // 0-100
  
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
  
  // Agregados
  totalMatches: int("totalMatches"),
  totalGoals: int("totalGoals"),
  avgGoalsPerMatch: decimal("avgGoalsPerMatch", { precision: 5, scale: 2 }),
  avgCorners: decimal("avgCorners", { precision: 5, scale: 2 }),
  avgCards: decimal("avgCards", { precision: 5, scale: 2 }),
  
  // Mercados
  ou25Rate: decimal("ou25Rate", { precision: 5, scale: 2 }), // % de Over 2.5
  bttsRate: decimal("bttsRate", { precision: 5, scale: 2 }), // % de BTTS
  
  // Previsibilidade
  predictability: decimal("predictability", { precision: 5, scale: 2 }), // 0-100
  volatility: decimal("volatility", { precision: 5, scale: 2 }), // 0-100
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeagueSeasonStat = typeof leagueSeasonStats.$inferSelect;
export type InsertLeagueSeasonStat = typeof leagueSeasonStats.$inferInsert;
