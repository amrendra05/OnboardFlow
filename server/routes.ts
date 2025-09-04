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
      // Transform the data to match schema expectations
      const transformedData = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        onboardingStage: "Pre-boarding" // Set default onboarding stage
      };
      
      const data = insertEmployeeSchema.parse(transformedData);
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

  // Model training endpoint
  app.post("/api/train-model", async (req, res) => {
    try {
      // Get all documents for training
      const documents = await storage.getDocuments();
      
      // Simulate model training process
      const trainingData = documents.map(doc => ({
        title: doc.title,
        content: doc.content,
        category: doc.category,
        tags: doc.tags,
      }));
      
      // In a real implementation, this would:
      // 1. Process documents for vectorization
      // 2. Update embeddings database
      // 3. Retrain or fine-tune the model
      // 4. Update model weights/parameters
      
      console.log(`Model training initiated with ${trainingData.length} documents`);
      
      res.json({ 
        message: "Model training initiated successfully",
        documentsProcessed: trainingData.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Model training error:', error);
      res.status(500).json({ 
        error: "Failed to initiate model training",
        details: error instanceof Error ? error.message : String(error)
      });
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
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required and must be a string" });
      }
      
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
      console.error('Chat error:', error);
      res.status(500).json({ 
        error: "Failed to process chat message",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Employee document upload route
  app.post("/api/employees/:id/documents", async (req, res) => {
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
        fileData,
      });

      res.json(document);
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Get employee documents route
  app.get("/api/employees/:id/documents", async (req, res) => {
    try {
      const documents = await storage.getEmployeeDocuments(req.params.id);
      res.json(documents);
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  // Get all employee documents route
  app.get("/api/employee-documents", async (req, res) => {
    try {
      const documents = await storage.getAllEmployeeDocuments();
      res.json(documents);
    } catch (error) {
      console.error('Get all documents error:', error);
      res.status(500).json({ error: "Failed to get all documents" });
    }
  });

  // Download document route
  app.get("/api/documents/:id/download", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Check if this document has associated file data
      if (document.content.includes("Content will be processed when viewing this document")) {
        // This is an uploaded file reference - for PDFs, create a simple PDF with document info
        if (document.fileType.toLowerCase() === 'pdf') {
          const fileName = `${document.title}.pdf`;
          
          // Create a simple PDF content with document information
          // This is a minimal PDF that should be safe and not trigger antivirus
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

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Content-Length', pdfContent.length.toString());
          return res.send(pdfContent);
        } else {
          return res.status(404).json({ 
            error: "File download not available",
            message: "This document is a reference to an uploaded file. File download functionality needs to be implemented to access the original file."
          });
        }
      }

      // For text-based documents, create a downloadable text file
      const fileName = `${document.title}.txt`;
      const content = document.content;
      
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'text/plain');
      res.send(content);
    } catch (error) {
      console.error('Download document error:', error);
      res.status(500).json({ error: "Failed to download document" });
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

// Enhanced AI response generator with knowledge base priority and web fallback
async function generateAIResponse(message: string, employeeId: string): Promise<string> {
  try {
    if (!process.env.GROQ_API_KEY) {
      return "I'm currently unavailable. Please contact your HR representative for assistance.";
    }

    // Step 1: Search company knowledge base first
    const relevantDocs = await storage.searchDocuments(message);
    
    let context = "";
    let hasRelevantKnowledge = false;
    
    if (relevantDocs.length > 0) {
      // More comprehensive relevance check
      const queryWords = message.toLowerCase().split(' ').filter(word => word.length > 2);
      hasRelevantKnowledge = relevantDocs.some(doc => {
        const docText = (doc.title + ' ' + doc.content).toLowerCase();
        return queryWords.some(word => docText.includes(word));
      });
      
      // Include more content from relevant documents
      context = relevantDocs
        .slice(0, 5)
        .map(doc => {
          const content = doc.content.length > 1000 ? 
            doc.content.substring(0, 1000) + '...' : 
            doc.content;
          return `Document: "${doc.title}"\nCategory: ${doc.category}\nContent: ${content}`;
        })
        .join("\n\n---\n\n");
    }

    // Step 2: If no relevant knowledge base content, search the web
    let webContext = "";
    if (!hasRelevantKnowledge) {
      try {
        const webResults = await searchWeb(message);
        if (webResults) {
          webContext = `\n\nAdditional context from web search:\n${webResults}`;
          context += webContext;
        }
      } catch (webError) {
        console.log('Web search unavailable, using knowledge base only');
      }
    }

    const systemPrompt = `You are an AI assistant for Cognizant's employee onboarding platform. You help new employees with onboarding questions, company policies, project information, and technical setup.

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

${context ? `Context from ${hasRelevantKnowledge ? 'company documents' : 'company documents and web search'}:
${context}

INSTRUCTIONS:
- Use the company documents as your PRIMARY source of information
- Quote directly from the documents when relevant
- Reference specific document titles when citing information
- If the documents contain the answer, use them instead of general knowledge
- Be specific about which document contains the information
- Keep responses informative but concise
- Always apply the Code of Ethics above in your responses` : `No specific company documents found for this question.

Guidelines:
- Be helpful, friendly, and professional
- Provide general guidance based on common industry practices
- Suggest checking the knowledge base for company-specific policies
- Recommend contacting HR for definitive company information
- Always apply the Code of Ethics above in your responses`}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error: ${response.status} - ${errorText}`);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again or contact HR for assistance.";
    
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I'm experiencing technical difficulties. Please try again in a moment or contact your HR representative for immediate assistance.";
  }
}

// Web search fallback function
async function searchWeb(query: string): Promise<string | null> {
  try {
    // Use a simple web search approach - in production you'd use a proper search API
    const searchQuery = encodeURIComponent(`${query} onboarding best practices`);
    
    // For now, return general guidance based on common patterns
    // In a real implementation, you'd integrate with a web search API
    const generalGuidance = {
      "development environment": "General development setup typically involves installing required tools, configuring version control, setting up local databases, and installing project dependencies.",
      "security": "Common security practices include using strong passwords, enabling 2FA, following company VPN policies, and keeping software updated.",
      "remote work": "Standard remote work policies often include dedicated workspace requirements, communication guidelines, and availability expectations.",
      "training": "Typical onboarding training covers company culture, role-specific skills, compliance requirements, and project-specific knowledge."
    };

    const lowerQuery = query.toLowerCase();
    for (const [key, guidance] of Object.entries(generalGuidance)) {
      if (lowerQuery.includes(key)) {
        return `General industry guidance: ${guidance}`;
      }
    }

    return null;
  } catch (error) {
    console.error('Web search error:', error);
    return null;
  }
}
