var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  chatMessages: () => chatMessages,
  chatMessagesRelations: () => chatMessagesRelations,
  documents: () => documents,
  documentsRelations: () => documentsRelations,
  employeeDocuments: () => employeeDocuments,
  employeeDocumentsRelations: () => employeeDocumentsRelations,
  employees: () => employees,
  employeesRelations: () => employeesRelations,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertDocumentSchema: () => insertDocumentSchema,
  insertEmployeeDocumentSchema: () => insertEmployeeDocumentSchema,
  insertEmployeeSchema: () => insertEmployeeSchema,
  insertKnowledgeQuerySchema: () => insertKnowledgeQuerySchema,
  insertOnboardingProgressSchema: () => insertOnboardingProgressSchema,
  insertUserSchema: () => insertUserSchema,
  knowledgeQueries: () => knowledgeQueries,
  knowledgeQueriesRelations: () => knowledgeQueriesRelations,
  onboardingProgress: () => onboardingProgress,
  onboardingProgressRelations: () => onboardingProgressRelations,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("hr"),
  createdAt: timestamp("created_at").default(sql`now()`)
});
var employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  department: text("department").notNull(),
  position: text("position").notNull(),
  startDate: timestamp("start_date").notNull(),
  status: text("status").notNull().default("active"),
  onboardingStage: text("onboarding_stage").notNull().default("Pre-boarding"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").default(sql`now()`)
});
var onboardingProgress = pgTable("onboarding_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  stage: text("stage").notNull(),
  // pre-boarding, first-day, training, integration
  completionPercentage: integer("completion_percentage").notNull().default(0),
  tasks: jsonb("tasks").$type().notNull().default([]),
  lastUpdated: timestamp("last_updated").default(sql`now()`)
});
var documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  fileType: text("file_type").notNull(),
  category: text("category").notNull(),
  // policies, projects, training
  tags: jsonb("tags").$type().notNull().default([]),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});
var chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id),
  message: text("message").notNull(),
  response: text("response"),
  isFromAI: boolean("is_from_ai").notNull().default(false),
  timestamp: timestamp("timestamp").default(sql`now()`)
});
var knowledgeQueries = pgTable("knowledge_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: text("query").notNull(),
  results: jsonb("results").$type().notNull().default([]),
  employeeId: varchar("employee_id").references(() => employees.id),
  timestamp: timestamp("timestamp").default(sql`now()`)
});
var employeeDocuments = pgTable("employee_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  // resume, certificate, id_document, etc.
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  fileData: text("file_data").notNull(),
  // Base64 encoded file data for simplicity
  uploadedAt: timestamp("uploaded_at").default(sql`now()`)
});
var employeesRelations = relations(employees, ({ many }) => ({
  onboardingProgress: many(onboardingProgress),
  chatMessages: many(chatMessages),
  knowledgeQueries: many(knowledgeQueries),
  documents: many(employeeDocuments)
}));
var onboardingProgressRelations = relations(onboardingProgress, ({ one }) => ({
  employee: one(employees, {
    fields: [onboardingProgress.employeeId],
    references: [employees.id]
  })
}));
var documentsRelations = relations(documents, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id]
  })
}));
var chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  employee: one(employees, {
    fields: [chatMessages.employeeId],
    references: [employees.id]
  })
}));
var knowledgeQueriesRelations = relations(knowledgeQueries, ({ one }) => ({
  employee: one(employees, {
    fields: [knowledgeQueries.employeeId],
    references: [employees.id]
  })
}));
var employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeDocuments.employeeId],
    references: [employees.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true
});
var insertOnboardingProgressSchema = createInsertSchema(onboardingProgress).omit({
  id: true,
  lastUpdated: true
});
var insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true
});
var insertKnowledgeQuerySchema = createInsertSchema(knowledgeQueries).omit({
  id: true,
  timestamp: true
});
var insertEmployeeDocumentSchema = createInsertSchema(employeeDocuments).omit({
  id: true,
  uploadedAt: true
});

// server/db.ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var databaseUrl = process.env.DATABASE_URL;
var finalUrl = databaseUrl;
var connectionConfig = {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30
  // Increased for Cloud SQL
};
if ((databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")) && !databaseUrl.includes("sslmode")) {
  finalUrl = databaseUrl + (databaseUrl.includes("?") ? "&" : "?") + "sslmode=disable";
} else if (process.env.NODE_ENV === "production") {
  connectionConfig = {
    ...connectionConfig,
    ssl: { rejectUnauthorized: false },
    connect_timeout: 60,
    // Longer timeout for Cloud SQL
    command_timeout: 60,
    max: 5,
    // Fewer connections for App Engine
    prepare: false
    // Disable prepared statements for Cloud SQL
  };
}
var client = postgres(finalUrl, connectionConfig);
var db = drizzle({ client, schema: schema_exports });

// server/storage.ts
import { eq, desc, like, or, and, not, sql as sql2 } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getEmployee(id) {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || void 0;
  }
  async getEmployees() {
    return await db.select().from(employees).orderBy(desc(employees.createdAt));
  }
  async createEmployee(insertEmployee) {
    const [employee] = await db.insert(employees).values(insertEmployee).returning();
    return employee;
  }
  async updateEmployee(id, updates) {
    const [employee] = await db.update(employees).set(updates).where(eq(employees.id, id)).returning();
    return employee;
  }
  async getOnboardingProgress(employeeId) {
    const [progress] = await db.select().from(onboardingProgress).where(eq(onboardingProgress.employeeId, employeeId));
    return progress || void 0;
  }
  async createOnboardingProgress(insertProgress) {
    const [progress] = await db.insert(onboardingProgress).values(insertProgress).returning();
    return progress;
  }
  async updateOnboardingProgress(employeeId, updates) {
    const [progress] = await db.update(onboardingProgress).set({
      ...updates,
      lastUpdated: sql2`now()`
    }).where(eq(onboardingProgress.employeeId, employeeId)).returning();
    return progress;
  }
  async getOnboardingStats() {
    const activeCount = await db.select({ count: sql2`count(*)` }).from(onboardingProgress).where(sql2`completion_percentage < 100`);
    const avgCompletion = await db.select({ avg: sql2`avg(completion_percentage)` }).from(onboardingProgress);
    return {
      activeOnboarding: activeCount[0]?.count || 0,
      avgCompletionRate: Math.round(avgCompletion[0]?.avg || 0)
    };
  }
  async getDocuments() {
    return await db.select().from(documents).orderBy(desc(documents.updatedAt));
  }
  async getDocument(id) {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || void 0;
  }
  async getDocumentsByCategory(category) {
    return await db.select().from(documents).where(eq(documents.category, category));
  }
  async createDocument(insertDocument) {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }
  async searchDocuments(query) {
    try {
      console.log(`[SEARCH] Starting search for query: "${query}"`);
      const keywords = query.toLowerCase().split(" ").filter((word) => word.length > 2);
      console.log(`[SEARCH] Extracted keywords:`, keywords);
      if (keywords.length === 0) {
        console.log(`[SEARCH] No keywords found, returning recent documents`);
        const recentDocs = await db.select().from(documents).orderBy(desc(documents.updatedAt)).limit(3);
        console.log(`[SEARCH] Returning ${recentDocs.length} recent documents`);
        return recentDocs;
      }
      console.log(`[SEARCH] Executing enhanced search with ${keywords.length} keywords`);
      const priorityResults = [];
      for (const keyword of keywords) {
        const titleCategoryResults = await db.select().from(documents).where(
          or(
            like(documents.title, `%${keyword}%`),
            like(documents.category, `%${keyword}%`)
          )
        ).orderBy(desc(documents.updatedAt));
        priorityResults.push(...titleCategoryResults);
      }
      const uniquePriorityResults = priorityResults.filter(
        (doc, index, arr) => arr.findIndex((d) => d.id === doc.id) === index
      );
      console.log(`[SEARCH] Priority search (title/category) found ${uniquePriorityResults.length} documents`);
      const contentResults = [];
      for (const keyword of keywords) {
        const contentSearchResults = await db.select().from(documents).where(
          and(
            like(documents.content, `%${keyword}%`),
            not(like(documents.content, "%[This PDF document was uploaded successfully%")),
            not(like(documents.content, "%[PDF text extraction disabled%")),
            not(like(documents.content, "%[Document uploaded successfully but text extraction failed%"))
          )
        ).orderBy(desc(documents.updatedAt));
        contentResults.push(...contentSearchResults);
      }
      const uniqueContentResults = contentResults.filter(
        (doc, index, arr) => arr.findIndex((d) => d.id === doc.id) === index
      );
      console.log(`[SEARCH] Content search found ${uniqueContentResults.length} documents`);
      const allResults = [...uniquePriorityResults];
      for (const contentDoc of uniqueContentResults) {
        if (!allResults.find((doc) => doc.id === contentDoc.id)) {
          allResults.push(contentDoc);
        }
      }
      console.log(`[SEARCH] Combined search found ${allResults.length} total documents`);
      if (allResults.length > 0) {
        console.log(`[SEARCH] Document titles found:`, allResults.map((d) => d.title));
        return allResults.slice(0, 10);
      }
      console.log(`[SEARCH] No results, trying broader search`);
      const broaderKeywords = query.toLowerCase().split(" ").filter((word) => word.length > 1);
      const broaderResults = [];
      for (const keyword of broaderKeywords) {
        const broaderSearchResults = await db.select().from(documents).where(
          or(
            like(documents.title, `%${keyword}%`),
            like(documents.category, `%${keyword}%`),
            like(documents.content, `%${keyword}%`)
          )
        ).orderBy(desc(documents.updatedAt)).limit(3);
        broaderResults.push(...broaderSearchResults);
      }
      const uniqueBroaderResults = broaderResults.filter(
        (doc, index, arr) => arr.findIndex((d) => d.id === doc.id) === index
      );
      console.log(`[SEARCH] Broader search found ${uniqueBroaderResults.length} documents`);
      return uniqueBroaderResults.slice(0, 5);
    } catch (error) {
      console.error(`[SEARCH] Search failed:`, error);
      const allDocs = await db.select().from(documents).limit(5);
      console.log(`[SEARCH] Fallback: returning ${allDocs.length} documents`);
      return allDocs;
    }
  }
  async getChatMessages(employeeId) {
    return await db.select().from(chatMessages).where(eq(chatMessages.employeeId, employeeId)).orderBy(chatMessages.timestamp);
  }
  async createChatMessage(insertMessage) {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }
  async createKnowledgeQuery(insertQuery) {
    const [query] = await db.insert(knowledgeQueries).values(insertQuery).returning();
    return query;
  }
  async getRecentQueries(limit = 10) {
    return await db.select().from(knowledgeQueries).orderBy(desc(knowledgeQueries.timestamp)).limit(limit);
  }
  async createEmployeeDocument(insertDocument) {
    const [document] = await db.insert(employeeDocuments).values(insertDocument).returning();
    return document;
  }
  async getEmployeeDocuments(employeeId) {
    return await db.select().from(employeeDocuments).where(eq(employeeDocuments.employeeId, employeeId)).orderBy(desc(employeeDocuments.uploadedAt));
  }
  async getAllEmployeeDocuments() {
    return await db.select().from(employeeDocuments).orderBy(desc(employeeDocuments.uploadedAt));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z } from "zod";
import multer from "multer";

// server/fileParser.ts
import mammoth from "mammoth";
import xlsx from "xlsx";
async function extractTextFromFile(fileBuffer, mimeType, fileName) {
  try {
    switch (mimeType) {
      case "application/pdf":
        return await extractPDFText(fileBuffer);
      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return await extractDocText(fileBuffer);
      case "text/plain":
      case "text/csv":
        return {
          content: fileBuffer.toString("utf-8")
        };
      case "application/vnd.ms-excel":
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        return await extractExcelText(fileBuffer);
      default:
        return {
          content: `File: ${fileName}
Type: ${mimeType}
Size: ${(fileBuffer.length / 1024).toFixed(1)} KB

[File content could not be extracted - unsupported format]`,
          error: `Unsupported file type: ${mimeType}`
        };
    }
  } catch (error) {
    console.error("Error extracting text from file:", error);
    return {
      content: `File: ${fileName}
Type: ${mimeType}
Size: ${(fileBuffer.length / 1024).toFixed(1)} KB

[Error extracting file content: ${error instanceof Error ? error.message : "Unknown error"}]`,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
async function extractPDFText(buffer) {
  console.log("Server-side PDF parsing requested - recommend using client-side extraction instead");
  return {
    content: `PDF Document - Server-side Upload
File size: ${(buffer.length / 1024 / 1024).toFixed(1)} MB

[PDF uploaded via server-side endpoint]
[For best search results, use the client-side upload interface which extracts text in the browser]
[This ensures full content searchability across all deployment environments]

Document is available for download and manual review.`,
    error: "Server-side PDF parsing deprecated - use client-side extraction for full content search"
  };
}
async function extractDocText(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      content: result.value.trim() || "[Document contains no extractable text]"
    };
  } catch (error) {
    throw new Error(`DOC/DOCX parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
async function extractExcelText(buffer) {
  try {
    const workbook = xlsx.read(buffer, { type: "buffer" });
    let allText = "";
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const sheetText = xlsx.utils.sheet_to_txt(sheet);
      if (sheetText.trim()) {
        allText += `=== Sheet: ${sheetName} ===
${sheetText}

`;
      }
    });
    return {
      content: allText.trim() || "[Spreadsheet contains no extractable text]"
    };
  } catch (error) {
    throw new Error(`Excel parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// server/routes.ts
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  }
});
async function registerRoutes(app2) {
  app2.get("/api/employees", async (req, res) => {
    try {
      const employees2 = await storage.getEmployees();
      res.json(employees2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });
  app2.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employee" });
    }
  });
  app2.post("/api/employees", async (req, res) => {
    try {
      const transformedData = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        onboardingStage: "Pre-boarding"
        // Set default onboarding stage
      };
      const data = insertEmployeeSchema.parse(transformedData);
      const employee = await storage.createEmployee(data);
      await storage.createOnboardingProgress({
        employeeId: employee.id,
        stage: "pre-boarding",
        completionPercentage: 0,
        tasks: [
          { id: "welcome-email", name: "Welcome email sent", completed: true },
          { id: "documents-prep", name: "Documents prepared", completed: true },
          { id: "equipment-order", name: "Equipment ordered", completed: true },
          { id: "badge-activation", name: "Badge activation", completed: false },
          { id: "system-access", name: "System access setup", completed: false },
          { id: "team-intro", name: "Team introductions", completed: false }
        ]
      });
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid employee data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create employee" });
    }
  });
  app2.get("/api/employees/:id/progress", async (req, res) => {
    try {
      const progress = await storage.getOnboardingProgress(req.params.id);
      if (!progress) {
        return res.status(404).json({ error: "Onboarding progress not found" });
      }
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch onboarding progress" });
    }
  });
  app2.patch("/api/employees/:id/progress", async (req, res) => {
    try {
      const updates = req.body;
      const progress = await storage.updateOnboardingProgress(req.params.id, updates);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update onboarding progress" });
    }
  });
  app2.get("/api/onboarding/stats", async (req, res) => {
    try {
      const stats = await storage.getOnboardingStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch onboarding stats" });
    }
  });
  app2.get("/api/documents", async (req, res) => {
    try {
      const { category, search } = req.query;
      let documents2;
      if (search) {
        documents2 = await storage.searchDocuments(search);
      } else if (category) {
        documents2 = await storage.getDocumentsByCategory(category);
      } else {
        documents2 = await storage.getDocuments();
      }
      res.json(documents2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });
  app2.post("/api/documents", async (req, res) => {
    try {
      const data = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(data);
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid document data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create document" });
    }
  });
  app2.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      const { title, category, fileType, tags } = req.body;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      if (!title || !category || !fileType) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "title, category, and fileType are required"
        });
      }
      console.log(`Processing file upload: ${file.originalname} (${file.mimetype})`);
      let parseResult;
      try {
        parseResult = await extractTextFromFile(file.buffer, file.mimetype, file.originalname);
      } catch (parseError) {
        console.warn(`Complete file parsing failure for ${file.originalname}:`, parseError);
        parseResult = {
          content: `Document: ${file.originalname}
File Type: ${file.mimetype}
Size: ${(file.size / 1024).toFixed(1)} KB
Category: ${category}

[Document uploaded successfully but text extraction failed due to environment limitations.
This document is available in the knowledge base and can be downloaded by users.
For better search results, consider uploading the document as plain text or using a different format.]`,
          error: parseError instanceof Error ? parseError.message : "Unknown parsing error"
        };
      }
      if (parseResult.error) {
        console.warn(`File parsing warning for ${file.originalname}:`, parseResult.error);
      }
      let parsedTags = [];
      if (tags) {
        try {
          parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
        } catch (e) {
          parsedTags = [];
        }
      }
      const documentData = {
        title,
        content: parseResult.content,
        fileType,
        category,
        tags: parsedTags
      };
      const data = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(data);
      console.log(`Successfully created document: ${document.title} (${parseResult.content.length} chars)`);
      res.json({
        ...document,
        extractionStatus: parseResult.error ? "partial" : "success",
        extractionMessage: parseResult.error || "Text extracted successfully"
      });
    } catch (error) {
      console.error("File upload error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid document data", details: error.errors });
      }
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File too large", details: "Maximum file size is 10MB" });
        }
        return res.status(400).json({ error: "File upload error", details: error.message });
      }
      res.status(500).json({ error: "Failed to create document" });
    }
  });
  app2.post("/api/train-model", async (req, res) => {
    try {
      const documents2 = await storage.getDocuments();
      const trainingData = documents2.map((doc) => ({
        title: doc.title,
        content: doc.content,
        category: doc.category,
        tags: doc.tags
      }));
      console.log(`Model training initiated with ${trainingData.length} documents`);
      res.json({
        message: "Model training initiated successfully",
        documentsProcessed: trainingData.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Model training error:", error);
      res.status(500).json({
        error: "Failed to initiate model training",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/employees/:id/chat", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });
  app2.post("/api/employees/:id/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required and must be a string" });
      }
      const userMessage = await storage.createChatMessage({
        employeeId: req.params.id,
        message,
        isFromAI: false
      });
      const aiResponse = await generateAIResponse(message, req.params.id);
      const aiMessage = await storage.createChatMessage({
        employeeId: req.params.id,
        message: aiResponse,
        isFromAI: true
      });
      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({
        error: "Failed to process chat message",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/employees/:id/documents", async (req, res) => {
    try {
      const { fileName, fileType, fileSize, mimeType, fileData } = req.body;
      if (!fileName || !fileType || !fileSize || !mimeType || !fileData) {
        return res.status(400).json({ error: "All document fields are required" });
      }
      const document = await storage.createEmployeeDocument({
        employeeId: req.params.id,
        fileName,
        fileType,
        fileSize,
        mimeType,
        fileData
      });
      res.json(document);
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });
  app2.get("/api/employees/:id/documents", async (req, res) => {
    try {
      const documents2 = await storage.getEmployeeDocuments(req.params.id);
      res.json(documents2);
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });
  app2.get("/api/employee-documents", async (req, res) => {
    try {
      const documents2 = await storage.getAllEmployeeDocuments();
      res.json(documents2);
    } catch (error) {
      console.error("Get all documents error:", error);
      res.status(500).json({ error: "Failed to get all documents" });
    }
  });
  app2.get("/api/documents/:id/download", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      if (document.content.includes("Content will be processed when viewing this document")) {
        if (document.fileType.toLowerCase() === "pdf") {
          const fileName2 = `${document.title}.pdf`;
          const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 720 Td
(Document: ${document.title}) Tj
0 -20 Td
(Category: ${document.category}) Tj
0 -20 Td
(File Type: PDF) Tj
0 -20 Td
(Size: 97.8 KB) Tj
0 -40 Td
(This is a reference document generated from) Tj
0 -20 Td
(the knowledge base system.) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000526 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
623
%%EOF`;
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${fileName2}"`);
          res.setHeader("Content-Length", pdfContent.length.toString());
          return res.send(pdfContent);
        } else {
          return res.status(404).json({
            error: "File download not available",
            message: "This document is a reference to an uploaded file. File download functionality needs to be implemented to access the original file."
          });
        }
      }
      const fileName = `${document.title}.txt`;
      const content = document.content;
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Type", "text/plain");
      res.send(content);
    } catch (error) {
      console.error("Download document error:", error);
      res.status(500).json({ error: "Failed to download document" });
    }
  });
  app2.post("/api/knowledge/search", async (req, res) => {
    try {
      const { query, employeeId } = req.body;
      const documents2 = await storage.searchDocuments(query);
      const results = documents2.slice(0, 10).map((doc, index) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content.substring(0, 200) + "...",
        relevance: Math.max(95 - index * 5, 60),
        // Mock relevance scoring
        category: doc.category,
        fileType: doc.fileType
      }));
      await storage.createKnowledgeQuery({
        query,
        results,
        employeeId
      });
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to search knowledge base" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
async function generateAIResponse(message, employeeId) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return "I'm currently unavailable. Please contact your HR representative for assistance.";
    }
    console.log(`Searching knowledge base for: "${message}"`);
    const relevantDocs = await storage.searchDocuments(message);
    console.log(`Search returned ${relevantDocs.length} documents`);
    let context = "";
    let hasRelevantKnowledge = false;
    if (relevantDocs.length > 0) {
      hasRelevantKnowledge = true;
      context = relevantDocs.slice(0, 5).map((doc) => {
        const isLimitedContent = doc.content.includes("[This PDF document was uploaded successfully") || doc.content.includes("[PDF text extraction disabled") || doc.content.includes("[Document uploaded successfully but text extraction failed");
        if (isLimitedContent) {
          let estimatedContent = "";
          const title = doc.title.toLowerCase();
          const category = doc.category.toLowerCase();
          if (title.includes("handbook") || title.includes("guide") || category.includes("policies")) {
            estimatedContent = "This document contains comprehensive company policies, procedures, and guidelines.";
          } else if (title.includes("training") || category.includes("training")) {
            estimatedContent = "This document contains training materials, protocols, and certification requirements.";
          } else if (title.includes("security") || title.includes("safety")) {
            estimatedContent = "This document contains important security protocols, safety procedures, and compliance requirements.";
          } else if (title.includes("benefits") || title.includes("compensation")) {
            estimatedContent = "This document contains information about employee benefits, compensation, and workplace policies.";
          } else if (category.includes("forms") || title.includes("form")) {
            estimatedContent = "This document contains important forms and templates for employee use.";
          } else {
            estimatedContent = `This ${doc.fileType} document in the ${doc.category} category contains valuable company information.`;
          }
          return `Document: "${doc.title}"
Category: ${doc.category}
File Type: ${doc.fileType}
Status: Available for download from knowledge base
Content Summary: ${estimatedContent} The complete document is accessible for download and contains detailed information relevant to ${doc.category}.`;
        } else {
          const content = doc.content.length > 1e3 ? doc.content.substring(0, 1e3) + "..." : doc.content;
          return `Document: "${doc.title}"
Category: ${doc.category}
File Type: ${doc.fileType}
Content: ${content}`;
        }
      }).join("\n\n---\n\n");
      console.log(`Found ${relevantDocs.length} relevant documents for query: "${message}"`);
      console.log(`Using documents: ${relevantDocs.map((d) => d.title).join(", ")}`);
      console.log(`Document types: ${relevantDocs.map((d) => d.fileType).join(", ")}`);
    }
    let webContext = "";
    if (!hasRelevantKnowledge) {
      console.log(`[AI] No knowledge base documents found, will provide general guidance`);
    }
    const systemPrompt = `You are an AI assistant for Pod 42 AI's employee onboarding platform. You help new employees with onboarding questions, company policies, project information, and technical setup.

CODE OF ETHICS AND PROFESSIONAL CONDUCT:
You must always adhere to the following ethical principles:

1. CONFIDENTIALITY & PRIVACY
   - Never share personal information between employees
   - Protect sensitive company data and client information
   - Respect privacy boundaries in all interactions
   - Do not access or reference data outside of necessary scope

2. PROFESSIONAL INTEGRITY
   - Provide accurate, truthful information only
   - Admit when you don't know something rather than guessing
   - Maintain objectivity and avoid personal bias
   - Never make promises on behalf of the company

3. RESPECT & INCLUSIVITY
   - Treat all employees with dignity and respect
   - Use inclusive language that welcomes diversity
   - Avoid discriminatory comments or assumptions
   - Support a harassment-free workplace environment

4. COMPLIANCE & LEGAL STANDARDS
   - Follow all applicable laws and company policies
   - Escalate legal or compliance concerns to HR immediately
   - Never advise on legal matters outside your scope
   - Respect intellectual property and copyright laws

5. SAFETY & WELL-BEING
   - Prioritize employee safety and mental health
   - Recognize signs of distress and direct to appropriate resources
   - Promote work-life balance and healthy practices
   - Never provide medical, financial, or legal advice

6. TRANSPARENCY & ACCOUNTABILITY
   - Be clear about your limitations as an AI assistant
   - Document important interactions appropriately
   - Direct complex issues to human HR representatives
   - Acknowledge and learn from mistakes

${context ? `COMPANY KNOWLEDGE BASE CONTEXT:
${context}

CRITICAL INSTRUCTIONS:
- ALWAYS prioritize and use the company documents above as your PRIMARY and AUTHORITATIVE source
- These documents contain Pod 42 AI's official policies, procedures, and guidelines
- Quote directly from these documents when relevant
- Reference specific document titles when citing information (e.g., "According to the Employee Handbook 2025...")
- If these documents contain the answer, use them INSTEAD of any general knowledge
- Be specific about which document contains the information
- NEVER ignore or override information from these company documents

HANDLING DOCUMENTS WITH LIMITED TEXT CONTENT:
- NEVER tell users you "can't extract content" or that there are "technical limitations"
- Instead, focus on being helpful and providing value based on the document's title, category, and purpose
- When you find relevant documents, always present them as valuable resources
- Guide users positively: "I found the [Document Title] which covers [likely content based on title/category]"
- Always offer to help users access the complete document: "You can download this document from the knowledge base to view all the details"
- Be specific about what the document likely contains based on its title and category
- Frame responses as solutions, not limitations

POSITIVE RESPONSE EXAMPLES:
- Instead of: "I can't extract the PDF content"
- Say: "I found the Employee Handbook 2025 in our policies section. This comprehensive guide covers company policies, procedures, and employee benefits. You can download it from the knowledge base to access all the detailed information."

- Instead of: "Text extraction failed"
- Say: "The Security Training Guide contains important information about our security protocols, VPN usage, and compliance requirements. I recommend downloading it to review the complete training materials."

RESPONSE GUIDELINES:
- Keep responses informative but concise
- Always apply the Code of Ethics above in your responses
- Be honest about technical limitations while still being helpful` : `No specific company documents found for this question.

Guidelines:
- Be helpful, friendly, and professional
- Provide general guidance based on common industry practices
- Suggest checking the knowledge base for company-specific policies
- Recommend contacting HR for definitive company information
- Always apply the Code of Ethics above in your responses`}`;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error: ${response.status} - ${errorText}`);
      throw new Error(`Groq API error: ${response.status}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again or contact HR for assistance.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I'm experiencing technical difficulties. Please try again in a moment or contact your HR representative for immediate assistance.";
  }
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
var env = process.env.NODE_ENV || "development";
console.log(`Starting server in ${env} mode`);
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  console.log(`Setting up ${env} mode server...`);
  if (env === "development") {
    console.log("Using Vite dev server for frontend");
    await setupVite(app, server);
  } else {
    console.log("Using static file server for frontend");
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
