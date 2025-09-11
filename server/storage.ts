import {
  users,
  employees,
  onboardingProgress,
  documents,
  chatMessages,
  knowledgeQueries,
  employeeDocuments,
  tasks,
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
  type Task,
  type InsertTask,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or, sql, and, lt, isNull, isNotNull } from "drizzle-orm";

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

  // Task management
  getTasks(filters?: { status?: string; priority?: string; assignedTo?: string; search?: string; employeeId?: string; overdue?: boolean }): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task>;
  completeTask(id: string): Promise<Task>;
  claimTask(id: string, agentId: string, leaseSeconds: number): Promise<Task | null>;
  recommendTasksForAgent(agentContext: { userId?: string; role?: string; department?: string; scope?: string[] }, limit?: number): Promise<Task[]>;
  getTaskStats(): Promise<{ total: number; open: number; inProgress: number; completed: number; overdue: number }>;
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
    const [progress] = await db.insert(onboardingProgress).values(insertProgress).returning();
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
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }

  async searchDocuments(query: string): Promise<Document[]> {
    try {
      console.log(`[SEARCH] Starting search for query: "${query}"`);
      
      // Split query into keywords for better search
      const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
      console.log(`[SEARCH] Extracted keywords:`, keywords);
      
      if (keywords.length === 0) {
        console.log(`[SEARCH] No keywords found, returning recent documents`);
        // If no keywords, return some recent documents to provide context
        const recentDocs = await db
          .select()
          .from(documents)
          .orderBy(desc(documents.updatedAt))
          .limit(3);
        console.log(`[SEARCH] Returning ${recentDocs.length} recent documents`);
        return recentDocs;
      }

      // Use simpler LIKE search to avoid SQL syntax issues
      const searchConditions = keywords.map(keyword => 
        or(
          like(documents.title, `%${keyword}%`),
          like(documents.content, `%${keyword}%`),
          like(documents.category, `%${keyword}%`)
        )
      );

      console.log(`[SEARCH] Executing search with ${searchConditions.length} conditions`);
      const results = await db
        .select()
        .from(documents)
        .where(or(...searchConditions))
        .orderBy(desc(documents.updatedAt));

      console.log(`[SEARCH] Found ${results.length} documents`);

      // If no exact matches, try broader search with shorter keywords
      if (results.length === 0 && keywords.length > 0) {
        console.log(`[SEARCH] No results, trying broader search`);
        const broaderKeywords = query.toLowerCase().split(' ').filter(word => word.length > 1);
        const broaderConditions = broaderKeywords.map(keyword => 
          or(
            like(documents.title, `%${keyword}%`),
            like(documents.content, `%${keyword}%`),
            like(documents.category, `%${keyword}%`)
          )
        );

        const broaderResults = await db
          .select()
          .from(documents)
          .where(or(...broaderConditions))
          .orderBy(desc(documents.updatedAt))
          .limit(5);
        
        console.log(`[SEARCH] Broader search found ${broaderResults.length} documents`);
        return broaderResults;
      }

      if (results.length > 0) {
        console.log(`[SEARCH] Document titles found:`, results.map(d => d.title));
      }
      
      return results;
    } catch (error) {
      console.error(`[SEARCH] Search failed:`, error);
      // Fallback: return all documents if search fails
      const allDocs = await db.select().from(documents).limit(5);
      console.log(`[SEARCH] Fallback: returning ${allDocs.length} documents`);
      return allDocs;
    }
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
    const [query] = await db.insert(knowledgeQueries).values(insertQuery).returning();
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

  // Task management methods
  async getTasks(filters?: { status?: string; priority?: string; assignedTo?: string; search?: string; employeeId?: string; overdue?: boolean }): Promise<Task[]> {
    let query = db.select().from(tasks);
    
    if (filters) {
      const conditions = [];
      
      if (filters.status) {
        conditions.push(eq(tasks.status, filters.status));
      }
      
      if (filters.priority) {
        conditions.push(eq(tasks.priority, filters.priority));
      }
      
      if (filters.assignedTo) {
        conditions.push(eq(tasks.assignedTo, filters.assignedTo));
      }
      
      if (filters.employeeId) {
        conditions.push(eq(tasks.targetEmployeeId, filters.employeeId));
      }
      
      if (filters.overdue) {
        conditions.push(and(
          isNotNull(tasks.dueDate),
          lt(tasks.dueDate, sql`now()`),
          sql`status != 'completed'`
        ));
      }
      
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        conditions.push(or(
          like(tasks.title, searchTerm),
          like(tasks.description, searchTerm)
        ));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }
    
    return await query.orderBy(desc(tasks.updatedAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ 
        ...updates,
        updatedAt: sql`now()` 
      })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async completeTask(id: string): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ 
        status: 'completed',
        updatedAt: sql`now()` 
      })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async claimTask(id: string, agentId: string, leaseSeconds: number): Promise<Task | null> {
    try {
      // Validate lease seconds for security
      if (leaseSeconds <= 0 || leaseSeconds > 86400) { // Max 24 hours
        throw new Error('Invalid lease duration');
      }
      
      const [task] = await db
        .update(tasks)
        .set({ 
          claimedByAgentId: agentId,
          claimExpiresAt: sql`now() + (${leaseSeconds} || ' seconds')::interval`,
          updatedAt: sql`now()` 
        })
        .where(
          and(
            eq(tasks.id, id),
            eq(tasks.status, 'open'),
            or(
              isNull(tasks.claimExpiresAt),
              lt(tasks.claimExpiresAt, sql`now()`)
            )
          )
        )
        .returning();
      
      return task || null;
    } catch (error) {
      console.error('Error claiming task:', error);
      return null;
    }
  }

  async recommendTasksForAgent(agentContext: { userId?: string; role?: string; department?: string; scope?: string[] }, limit: number = 10): Promise<Task[]> {
    // Get available tasks (open status and not claimed or claim expired)
    const availableTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.status, 'open'),
          or(
            isNull(tasks.claimExpiresAt),
            lt(tasks.claimExpiresAt, sql`now()`)
          )
        )
      )
      .orderBy(desc(tasks.updatedAt));

    // Score tasks based on priority, due date, and relevance
    const scoredTasks = availableTasks.map(task => {
      let score = 0;
      
      // Priority scoring
      switch (task.priority) {
        case 'critical': score += 100; break;
        case 'high': score += 70; break;
        case 'medium': score += 40; break;
        case 'low': score += 10; break;
      }
      
      // Due date urgency
      if (task.dueDate) {
        const hoursUntilDue = (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntilDue < 0) {
          score += 60; // Overdue
        } else {
          score += Math.max(50 - hoursUntilDue, 0);
        }
      }
      
      // Relevance scoring
      if (agentContext.userId && task.assignedTo === agentContext.userId) {
        score += 100;
      }
      
      return { task, score };
    });

    // Sort by score and return top tasks
    return scoredTasks
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.task);
  }

  async getTaskStats(): Promise<{ total: number; open: number; inProgress: number; completed: number; overdue: number }> {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        open: sql<number>`count(*) filter (where status = 'open')`,
        inProgress: sql<number>`count(*) filter (where status = 'in_progress')`,
        completed: sql<number>`count(*) filter (where status = 'completed')`,
        overdue: sql<number>`count(*) filter (where due_date < now() and status != 'completed')`
      })
      .from(tasks);

    return {
      total: stats?.total || 0,
      open: stats?.open || 0,
      inProgress: stats?.inProgress || 0,
      completed: stats?.completed || 0,
      overdue: stats?.overdue || 0,
    };
  }
}

export const storage = new DatabaseStorage();
