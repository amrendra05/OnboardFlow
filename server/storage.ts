import {
  users,
  employees,
  onboardingProgress,
  documents,
  chatMessages,
  knowledgeQueries,
  employeeDocuments,
  type User,
  type InsertUser,
  type Employee,
  type InsertEmployee,
  type OnboardingProgress,
  type InsertOnboardingProgress,
  type Document,
  type InsertDocument,
  type ChatMessage,
  type InsertChatMessage,
  type KnowledgeQuery,
  type InsertKnowledgeQuery,
  type EmployeeDocument,
  type InsertEmployeeDocument,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Employee management
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployees(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee>;

  // Onboarding progress
  getOnboardingProgress(employeeId: string): Promise<OnboardingProgress | undefined>;
  createOnboardingProgress(progress: InsertOnboardingProgress): Promise<OnboardingProgress>;
  updateOnboardingProgress(employeeId: string, updates: Partial<InsertOnboardingProgress>): Promise<OnboardingProgress>;
  getOnboardingStats(): Promise<{ activeOnboarding: number; avgCompletionRate: number }>;

  // Document management
  getDocuments(): Promise<Document[]>;
  getDocumentsByCategory(category: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  searchDocuments(query: string): Promise<Document[]>;

  // Chat messages
  getChatMessages(employeeId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Knowledge queries
  createKnowledgeQuery(query: InsertKnowledgeQuery): Promise<KnowledgeQuery>;
  getRecentQueries(limit?: number): Promise<KnowledgeQuery[]>;

  // Employee documents
  createEmployeeDocument(document: InsertEmployeeDocument): Promise<EmployeeDocument>;
  getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]>;
  getAllEmployeeDocuments(): Promise<EmployeeDocument[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(insertEmployee).returning();
    return employee;
  }

  async updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee> {
    const [employee] = await db.update(employees).set(updates).where(eq(employees.id, id)).returning();
    return employee;
  }

  async getOnboardingProgress(employeeId: string): Promise<OnboardingProgress | undefined> {
    const [progress] = await db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.employeeId, employeeId));
    return progress || undefined;
  }

  async createOnboardingProgress(insertProgress: InsertOnboardingProgress): Promise<OnboardingProgress> {
    const [progress] = await db.insert(onboardingProgress).values({
      ...insertProgress,
      tasks: insertProgress.tasks || []
    }).returning();
    return progress;
  }

  async updateOnboardingProgress(
    employeeId: string,
    updates: Partial<InsertOnboardingProgress>
  ): Promise<OnboardingProgress> {
    const [progress] = await db
      .update(onboardingProgress)
      .set({ 
        ...updates,
        tasks: updates.tasks || undefined,
        lastUpdated: sql`now()` 
      })
      .where(eq(onboardingProgress.employeeId, employeeId))
      .returning();
    return progress;
  }

  async getOnboardingStats(): Promise<{ activeOnboarding: number; avgCompletionRate: number }> {
    const activeCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(onboardingProgress)
      .where(sql`completion_percentage < 100`);

    const avgCompletion = await db
      .select({ avg: sql<number>`avg(completion_percentage)` })
      .from(onboardingProgress);

    return {
      activeOnboarding: activeCount[0]?.count || 0,
      avgCompletionRate: Math.round(avgCompletion[0]?.avg || 0),
    };
  }

  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.updatedAt));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getDocumentsByCategory(category: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.category, category));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values({
      ...insertDocument,
      tags: insertDocument.tags || []
    }).returning();
    return document;
  }

  async searchDocuments(query: string): Promise<Document[]> {
    // Split query into keywords for better search
    const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    
    if (keywords.length === 0) {
      return [];
    }

    // Build search conditions for each keyword
    const searchConditions = keywords.map(keyword => 
      or(
        like(documents.title, `%${keyword}%`),
        like(documents.content, `%${keyword}%`)
      )
    );

    return await db
      .select()
      .from(documents)
      .where(or(...searchConditions))
      .orderBy(desc(documents.updatedAt));
  }

  async getChatMessages(employeeId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.employeeId, employeeId))
      .orderBy(chatMessages.timestamp);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }

  async createKnowledgeQuery(insertQuery: InsertKnowledgeQuery): Promise<KnowledgeQuery> {
    const [query] = await db.insert(knowledgeQueries).values({
      ...insertQuery,
      results: insertQuery.results || []
    }).returning();
    return query;
  }

  async getRecentQueries(limit: number = 10): Promise<KnowledgeQuery[]> {
    return await db
      .select()
      .from(knowledgeQueries)
      .orderBy(desc(knowledgeQueries.timestamp))
      .limit(limit);
  }

  async createEmployeeDocument(insertDocument: InsertEmployeeDocument): Promise<EmployeeDocument> {
    const [document] = await db.insert(employeeDocuments).values(insertDocument).returning();
    return document;
  }

  async getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]> {
    return await db
      .select()
      .from(employeeDocuments)
      .where(eq(employeeDocuments.employeeId, employeeId))
      .orderBy(desc(employeeDocuments.uploadedAt));
  }

  async getAllEmployeeDocuments(): Promise<EmployeeDocument[]> {
    return await db
      .select()
      .from(employeeDocuments)
      .orderBy(desc(employeeDocuments.uploadedAt));
  }
}

export const storage = new DatabaseStorage();
