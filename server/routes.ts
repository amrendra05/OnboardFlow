import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertDocumentSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Employee routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
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

  app.post("/api/employees", async (req, res) => {
    try {
      const data = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(data);
      
      // Create initial onboarding progress
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
          { id: "team-intro", name: "Team introductions", completed: false },
        ],
      });

      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid employee data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create employee" });
    }
  });

  // Onboarding progress routes
  app.get("/api/employees/:id/progress", async (req, res) => {
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

  app.patch("/api/employees/:id/progress", async (req, res) => {
    try {
      const updates = req.body;
      const progress = await storage.updateOnboardingProgress(req.params.id, updates);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update onboarding progress" });
    }
  });

  app.get("/api/onboarding/stats", async (req, res) => {
    try {
      const stats = await storage.getOnboardingStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch onboarding stats" });
    }
  });

  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const { category, search } = req.query;
      
      let documents;
      if (search) {
        documents = await storage.searchDocuments(search as string);
      } else if (category) {
        documents = await storage.getDocumentsByCategory(category as string);
      } else {
        documents = await storage.getDocuments();
      }
      
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", async (req, res) => {
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

  // Chat routes
  app.get("/api/employees/:id/chat", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/employees/:id/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      // Save user message
      const userMessage = await storage.createChatMessage({
        employeeId: req.params.id,
        message,
        isFromAI: false,
      });

      // Generate AI response using open source LLM
      const aiResponse = await generateAIResponse(message, req.params.id);
      
      const aiMessage = await storage.createChatMessage({
        employeeId: req.params.id,
        message: aiResponse,
        isFromAI: true,
      });

      res.json({ userMessage, aiMessage });
    } catch (error) {
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Knowledge search route
  app.post("/api/knowledge/search", async (req, res) => {
    try {
      const { query, employeeId } = req.body;
      
      // Search documents
      const documents = await storage.searchDocuments(query);
      
      // Create mock relevance scores and format results
      const results = documents.slice(0, 10).map((doc, index) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content.substring(0, 200) + "...",
        relevance: Math.max(95 - index * 5, 60), // Mock relevance scoring
        category: doc.category,
        fileType: doc.fileType,
      }));

      // Save the query
      await storage.createKnowledgeQuery({
        query,
        results,
        employeeId,
      });

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to search knowledge base" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// AI response generator using Groq open source LLM
async function generateAIResponse(message: string, employeeId: string): Promise<string> {
  try {
    if (!process.env.GROQ_API_KEY) {
      return "I'm currently unavailable. Please contact your HR representative for assistance.";
    }

    // Search for relevant documents to provide context
    const relevantDocs = await storage.searchDocuments(message);
    
    // Create context from relevant documents
    const context = relevantDocs
      .slice(0, 3)
      .map(doc => `Document: ${doc.title}\nContent: ${doc.content.substring(0, 500)}...`)
      .join("\n\n");

    const systemPrompt = `You are an AI assistant for Cognizant's employee onboarding platform. You help new employees with onboarding questions, company policies, project information, and technical setup.

Context from company documents:
${context}

Guidelines:
- Be helpful, friendly, and professional
- Provide specific, actionable advice
- Reference company documents when relevant
- If you don't know something, suggest they check the knowledge base or contact HR
- Keep responses concise but informative`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile', // Fast, high-quality open source model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again or contact HR for assistance.";
    
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I'm experiencing technical difficulties. Please try again in a moment or contact your HR representative for immediate assistance.";
  }
}
