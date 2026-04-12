import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Tabela de Candidatos ELEITUS ───────────────────────────────────────────
export const candidatos = mysqlTable("candidatos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nome: varchar("nome", { length: 200 }).notNull(),
  cargo: varchar("cargo", { length: 200 }),
  partido: varchar("partido", { length: 100 }),
  videoIdleUrl: text("videoIdleUrl"),
  videoSpeakingUrl: text("videoSpeakingUrl"),
  elevenLabsVoiceId: varchar("elevenLabsVoiceId", { length: 100 }),
  conteudoRag: text("conteudoRag"),
  status: mysqlEnum("status", ["pending", "active", "inactive"]).default("pending").notNull(),
  pacote: varchar("pacote", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Candidato = typeof candidatos.$inferSelect;
export type InsertCandidato = typeof candidatos.$inferInsert;

// ─── Tabela de Interações dos Eleitores ──────────────────────────────────────
export const interacoes = mysqlTable("interacoes", {
  id: int("id").autoincrement().primaryKey(),
  candidatoId: int("candidatoId").notNull(),
  candidatoSlug: varchar("candidatoSlug", { length: 64 }),
  eleitorId: varchar("eleitorId", { length: 64 }),
  pergunta: text("pergunta").notNull(),
  resposta: text("resposta"),
  tempoRespostaMs: int("tempoRespostaMs"),
  canal: varchar("canal", { length: 50 }).default("web"),
  ipHash: varchar("ipHash", { length: 64 }),
  dispositivo: varchar("dispositivo", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Interacao = typeof interacoes.$inferSelect;
export type InsertInteracao = typeof interacoes.$inferInsert;

// ─── Tabela de Santinhos (tokens de uso único) ────────────────────────────────
export const santinhos = mysqlTable("santinhos", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 32 }).notNull().unique(),
  candidatoId: int("candidatoId").notNull(),
  candidatoSlug: varchar("candidatoSlug", { length: 64 }).notNull(),
  plano: mysqlEnum("plano", ["1min", "2min"]).notNull(),
  status: mysqlEnum("status", ["unused", "used", "expired"]).default("unused").notNull(),
  usadoEm: timestamp("usadoEm"),
  ipHash: varchar("ipHash", { length: 64 }),
  perguntasFeitas: int("perguntasFeitas").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Santinho = typeof santinhos.$inferSelect;
export type InsertSantinho = typeof santinhos.$inferInsert;