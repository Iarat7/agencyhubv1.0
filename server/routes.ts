import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./simpleAuth";
import { 
  insertClientSchema, 
  insertTaskSchema, 
  insertOpportunitySchema, 
  insertFinancialRecordSchema,
  insertAiStrategySchema,
  insertActivitySchema,
  insertContractSchema,
  insertProductSchema,
  insertClientProductSchema,
  insertProductSaleSchema,
  insertCalendarEventSchema
} from "@shared/schema";
import { generateMarketingStrategy, generateContentIdeas, analyzeClientPerformance } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const sessionUser = (req.session as any)?.user;
      if (!sessionUser) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      res.json(sessionUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ error: 'Erro ao fazer logout' });
        }
        res.json({ message: 'Logout realizado com sucesso' });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Erro ao fazer logout' });
    }
  });

  // Clients routes
  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const validation = insertClientSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.errors });
      }
      
      const client = await storage.createClient(validation.data);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertClientSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.errors });
      }
      
      const client = await storage.updateClient(id, validation.data);
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClient(id);
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const validation = insertTaskSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.errors });
      }
      
      const task = await storage.createTask(validation.data);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertTaskSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.errors });
      }
      
      const task = await storage.updateTask(id, validation.data);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTask(id);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Financial routes
  app.get("/api/financial", isAuthenticated, async (req, res) => {
    try {
      const records = await storage.getFinancialRecords();
      res.json(records);
    } catch (error) {
      console.error("Error fetching financial records:", error);
      res.status(500).json({ message: "Failed to fetch financial records" });
    }
  });

  app.post("/api/financial", isAuthenticated, async (req, res) => {
    try {
      const validation = insertFinancialRecordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.errors });
      }
      
      const record = await storage.createFinancialRecord(validation.data);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating financial record:", error);
      res.status(500).json({ message: "Failed to create financial record" });
    }
  });

  // Opportunities routes
  app.get("/api/opportunities", isAuthenticated, async (req, res) => {
    try {
      const opportunities = await storage.getOpportunities();
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      res.status(500).json({ message: "Failed to fetch opportunities" });
    }
  });

  app.post("/api/opportunities", isAuthenticated, async (req, res) => {
    try {
      const validation = insertOpportunitySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.errors });
      }
      
      const opportunity = await storage.createOpportunity(validation.data);
      res.status(201).json(opportunity);
    } catch (error) {
      console.error("Error creating opportunity:", error);
      res.status(500).json({ message: "Failed to create opportunity" });
    }
  });

  // AI Strategies routes
  app.get("/api/ai-strategies", isAuthenticated, async (req, res) => {
    try {
      const strategies = await storage.getAiStrategies();
      res.json(strategies);
    } catch (error) {
      console.error("Error fetching AI strategies:", error);
      res.status(500).json({ message: "Failed to fetch AI strategies" });
    }
  });

  app.post("/api/ai-strategies", isAuthenticated, async (req, res) => {
    try {
      const validation = insertAiStrategySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.errors });
      }
      
      const strategy = await storage.createAiStrategy(validation.data);
      res.status(201).json(strategy);
    } catch (error) {
      console.error("Error creating AI strategy:", error);
      res.status(500).json({ message: "Failed to create AI strategy" });
    }
  });

  // AI generation routes
  app.post("/api/ai/generate-strategy", isAuthenticated, async (req, res) => {
    try {
      const { clientName, industry, goals, budget } = req.body;
      
      if (!clientName || !industry) {
        return res.status(400).json({ message: "Client name and industry are required" });
      }

      const strategy = await generateMarketingStrategy(clientName, industry, goals, budget);
      res.json(strategy);
    } catch (error) {
      console.error("Error generating strategy:", error);
      res.status(500).json({ message: "Failed to generate strategy" });
    }
  });

  // Activities routes
  app.get("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Calendar routes
  app.get("/api/calendar/events", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate, organizer, clientId } = req.query;
      
      let events;
      if (startDate && endDate) {
        events = await storage.getCalendarEventsByDate(new Date(startDate as string), new Date(endDate as string));
      } else if (organizer) {
        events = await storage.getCalendarEventsByOrganizer(organizer as string);
      } else if (clientId) {
        events = await storage.getCalendarEventsByClient(parseInt(clientId as string));
      } else {
        events = await storage.getCalendarEvents();
      }
      
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.post("/api/calendar/events", isAuthenticated, async (req, res) => {
    try {
      const validation = insertCalendarEventSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.errors });
      }
      
      const event = await storage.createCalendarEvent(validation.data);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ message: "Failed to create calendar event" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}