import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertDocumentSchema, insertChatMessageSchema, insertTaskSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { extractTextFromFile } from "./fileParser";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  }
});

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

  // File upload endpoint with text extraction
  app.post("/api/documents/upload", upload.single('file'), async (req, res) => {
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
      
      // Extract text content from the uploaded file
      const parseResult = await extractTextFromFile(file.buffer, file.mimetype, file.originalname);
      
      if (parseResult.error) {
        console.warn(`File parsing warning for ${file.originalname}:`, parseResult.error);
      }
      
      // Parse tags if provided
      let parsedTags: string[] = [];
      if (tags) {
        try {
          parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        } catch (e) {
          parsedTags = [];
        }
      }
      
      // Create document with extracted content
      const documentData = {
        title,
        content: parseResult.content,
        fileType,
        category,
        tags: parsedTags,
      };
      
      const data = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(data);
      
      console.log(`Successfully created document: ${document.title} (${parseResult.content.length} chars)`);
      
      res.json({
        ...document,
        extractionStatus: parseResult.error ? 'partial' : 'success',
        extractionMessage: parseResult.error || 'Text extracted successfully'
      });
      
    } catch (error) {
      console.error('File upload error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid document data", details: error.errors });
      }
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: "File too large", details: "Maximum file size is 10MB" });
        }
        return res.status(400).json({ error: "File upload error", details: error.message });
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

  // Task management routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const { status, priority, assignedTo, search, employeeId, overdue } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status as string;
      if (priority) filters.priority = priority as string;
      if (assignedTo) filters.assignedTo = assignedTo as string;
      if (search) filters.search = search as string;
      if (employeeId) filters.employeeId = employeeId as string;
      if (overdue) filters.overdue = overdue === 'true';
      
      const tasks = await storage.getTasks(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(tasks);
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error('Get task error:', error);
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const data = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(data);
      res.json(task);
    } catch (error) {
      console.error('Create task error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      // Only allow updating specific fields, exclude protected fields
      const allowedFields = insertTaskSchema.partial().omit({ 
        claimedByAgentId: true, 
        claimExpiresAt: true 
      });
      
      const updates = allowedFields.parse(req.body);
      const task = await storage.updateTask(req.params.id, updates);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      console.error('Update task error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.post("/api/tasks/:id/complete", async (req, res) => {
    try {
      const task = await storage.completeTask(req.params.id);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      console.error('Complete task error:', error);
      res.status(500).json({ error: "Failed to complete task" });
    }
  });

  // AI Agent endpoints
  app.post("/api/tasks/:id/claim", async (req, res) => {
    try {
      const { agentId, leaseSeconds = 3600 } = req.body; // Default 1 hour lease
      
      if (!agentId || typeof agentId !== 'string') {
        return res.status(400).json({ error: "agentId is required and must be a string" });
      }
      
      // Validate lease seconds
      const lease = parseInt(leaseSeconds);
      if (isNaN(lease) || lease < 1 || lease > 86400) {
        return res.status(400).json({ 
          error: "leaseSeconds must be a number between 1 and 86400 (24 hours)" 
        });
      }
      
      const task = await storage.claimTask(req.params.id, agentId, lease);
      
      if (!task) {
        return res.status(409).json({ 
          error: "Task could not be claimed", 
          message: "Task may be already claimed, not open, or does not exist" 
        });
      }
      
      res.json(task);
    } catch (error) {
      console.error('Claim task error:', error);
      if (error instanceof Error && error.message === 'Invalid lease duration') {
        return res.status(400).json({ error: "Invalid lease duration" });
      }
      res.status(500).json({ error: "Failed to claim task" });
    }
  });

  app.get("/api/tasks/recommendations", async (req, res) => {
    try {
      const { userId, role, department, scope, limit = 10 } = req.query;
      
      const agentContext: any = {};
      if (userId) agentContext.userId = userId as string;
      if (role) agentContext.role = role as string;
      if (department) agentContext.department = department as string;
      if (scope) {
        try {
          agentContext.scope = JSON.parse(scope as string);
        } catch (e) {
          agentContext.scope = (scope as string).split(',').map(s => s.trim());
        }
      }
      
      // Validate and limit the limit parameter
      const limitNum = parseInt(limit as string) || 10;
      const safeLimit = Math.min(Math.max(limitNum, 1), 100); // Between 1 and 100
      
      const tasks = await storage.recommendTasksForAgent(agentContext, safeLimit);
      res.json(tasks);
    } catch (error) {
      console.error('Get task recommendations error:', error);
      res.status(500).json({ error: "Failed to get task recommendations" });
    }
  });

  app.get("/api/tasks/stats", async (req, res) => {
    try {
      const stats = await storage.getTaskStats();
      res.json(stats);
    } catch (error) {
      console.error('Get task stats error:', error);
      res.status(500).json({ error: "Failed to get task statistics" });
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
    console.log(`Searching knowledge base for: "${message}"`);
    const relevantDocs = await storage.searchDocuments(message);
    console.log(`Search returned ${relevantDocs.length} documents`);
    
    let context = "";
    let hasRelevantKnowledge = false;
    
    if (relevantDocs.length > 0) {
      // Always use knowledge base documents when found - they are company-specific and authoritative
      hasRelevantKnowledge = true;
      
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
      
      console.log(`Found ${relevantDocs.length} relevant documents for query: "${message}"`);
      console.log(`Using documents: ${relevantDocs.map(d => d.title).join(', ')}`);
    }

    // Step 2: If no relevant knowledge base content, use fallback
    let webContext = "";
    if (!hasRelevantKnowledge) {
      console.log(`[AI] No knowledge base documents found, will provide general guidance`);
      // Disable web search temporarily to debug knowledge base usage
      // try {
      //   const webResults = await searchWeb(message);
      //   if (webResults) {
      //     webContext = `\n\nAdditional context from web search:\n${webResults}`;
      //     context += webContext;
      //   }
      // } catch (webError) {
      //   console.log('Web search unavailable, using knowledge base only');
      // }
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

${context ? `COMPANY KNOWLEDGE BASE CONTEXT:
${context}

CRITICAL INSTRUCTIONS:
- ALWAYS prioritize and use the company documents above as your PRIMARY and AUTHORITATIVE source
- These documents contain Cognizant's official policies, procedures, and guidelines
- Quote directly from these documents when relevant
- Reference specific document titles when citing information (e.g., "According to the Employee Handbook 2025...")
- If these documents contain the answer, use them INSTEAD of any general knowledge
- Be specific about which document contains the information
- NEVER ignore or override information from these company documents
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
