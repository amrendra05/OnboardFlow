import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("hr"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  department: text("department").notNull(),
  position: text("position").notNull(),
  startDate: timestamp("start_date").notNull(),
  status: text("status").notNull().default("active"),
  onboardingStage: text("onboarding_stage").notNull().default("Pre-boarding"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const onboardingProgress = pgTable("onboarding_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  stage: text("stage").notNull(), // pre-boarding, first-day, training, integration
  completionPercentage: integer("completion_percentage").notNull().default(0),
  tasks: jsonb("tasks").$type<{ id: string; name: string; completed: boolean; description?: string }[]>().notNull().default([]),
  lastUpdated: timestamp("last_updated").default(sql`now()`),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  fileType: text("file_type").notNull(),
  category: text("category").notNull(), // policies, projects, training
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id),
  message: text("message").notNull(),
  response: text("response"),
  isFromAI: boolean("is_from_ai").notNull().default(false),
  timestamp: timestamp("timestamp").default(sql`now()`),
});

export const knowledgeQueries = pgTable("knowledge_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: text("query").notNull(),
  results: jsonb("results").$type<{ id: string; title: string; relevance: number; content: string }[]>().notNull().default([]),
  employeeId: varchar("employee_id").references(() => employees.id),
  timestamp: timestamp("timestamp").default(sql`now()`),
});

export const employeeDocuments = pgTable("employee_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // resume, certificate, id_document, etc.
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  fileData: text("file_data").notNull(), // Base64 encoded file data for simplicity
  uploadedAt: timestamp("uploaded_at").default(sql`now()`),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"), // 'open' | 'in_progress' | 'blocked' | 'completed'
  priority: text("priority").notNull().default("medium"), // 'critical' | 'high' | 'medium' | 'low'
  dueDate: timestamp("due_date"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  targetEmployeeId: varchar("target_employee_id").references(() => employees.id),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  source: text("source").notNull().default("manual"), // 'manual' | 'ai'
  claimedByAgentId: text("claimed_by_agent_id"),
  claimExpiresAt: timestamp("claim_expires_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Relations
export const employeesRelations = relations(employees, ({ many }) => ({
  onboardingProgress: many(onboardingProgress),
  chatMessages: many(chatMessages),
  knowledgeQueries: many(knowledgeQueries),
  documents: many(employeeDocuments),
}));

export const onboardingProgressRelations = relations(onboardingProgress, ({ one }) => ({
  employee: one(employees, {
    fields: [onboardingProgress.employeeId],
    references: [employees.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  employee: one(employees, {
    fields: [chatMessages.employeeId],
    references: [employees.id],
  }),
}));

export const knowledgeQueriesRelations = relations(knowledgeQueries, ({ one }) => ({
  employee: one(employees, {
    fields: [knowledgeQueries.employeeId],
    references: [employees.id],
  }),
}));

export const employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeDocuments.employeeId],
    references: [employees.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignedTo: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
  }),
  targetEmployee: one(employees, {
    fields: [tasks.targetEmployeeId],
    references: [employees.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertOnboardingProgressSchema = createInsertSchema(onboardingProgress).omit({
  id: true,
  lastUpdated: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertKnowledgeQuerySchema = createInsertSchema(knowledgeQueries).omit({
  id: true,
  timestamp: true,
});

export const insertEmployeeDocumentSchema = createInsertSchema(employeeDocuments).omit({
  id: true,
  uploadedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  claimExpiresAt: true,
  claimedByAgentId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgress = z.infer<typeof insertOnboardingProgressSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type KnowledgeQuery = typeof knowledgeQueries.$inferSelect;
export type InsertKnowledgeQuery = z.infer<typeof insertKnowledgeQuerySchema>;

export type EmployeeDocument = typeof employeeDocuments.$inferSelect;
export type InsertEmployeeDocument = z.infer<typeof insertEmployeeDocumentSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
