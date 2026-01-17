import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { 
  insertAssessmentSchema, 
  insertDocumentSchema, 
  insertSafeguardSchema,
  insertCriterionSchema,
  insertChangeHistorySchema,
  insertFindingSchema,
  insertTeamMemberSchema
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Team Members
  app.get("/api/team-members", async (req, res) => {
    try {
      const members = await storage.getAllTeamMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.post("/api/team-members", async (req, res) => {
    try {
      const data = insertTeamMemberSchema.parse(req.body);
      const member = await storage.createTeamMember(data);
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ error: "Invalid team member data" });
    }
  });

  // Assessments
  app.get("/api/assessments", async (req, res) => {
    try {
      const assessments = await storage.getAllAssessments();
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  app.get("/api/assessments/:id", async (req, res) => {
    try {
      const assessment = await storage.getAssessment(req.params.id);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assessment" });
    }
  });

  app.post("/api/assessments", async (req, res) => {
    try {
      const data = insertAssessmentSchema.parse(req.body);
      const assessment = await storage.createAssessment(data);
      res.status(201).json(assessment);
    } catch (error) {
      res.status(400).json({ error: "Invalid assessment data" });
    }
  });

  app.patch("/api/assessments/:id", async (req, res) => {
    try {
      const assessment = await storage.updateAssessment(req.params.id, req.body);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      res.status(400).json({ error: "Failed to update assessment" });
    }
  });

  // Documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const data = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(data);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ error: "Invalid document data" });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.updateDocument(req.params.id, req.body);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(400).json({ error: "Failed to update document" });
    }
  });

  app.post("/api/documents/:id/lock", async (req, res) => {
    try {
      const { lockedBy } = req.body;
      if (!lockedBy) {
        return res.status(400).json({ error: "lockedBy is required" });
      }
      const document = await storage.lockDocument(req.params.id, lockedBy);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(400).json({ error: "Failed to lock document" });
    }
  });

  // Safeguards
  app.get("/api/assessments/:assessmentId/safeguards", async (req, res) => {
    try {
      const safeguards = await storage.getSafeguardsByAssessment(req.params.assessmentId);
      res.json(safeguards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch safeguards" });
    }
  });

  app.get("/api/safeguards/:id", async (req, res) => {
    try {
      const safeguard = await storage.getSafeguard(req.params.id);
      if (!safeguard) {
        return res.status(404).json({ error: "Safeguard not found" });
      }
      res.json(safeguard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch safeguard" });
    }
  });

  app.get("/api/assessments/:assessmentId/safeguards/:cisId", async (req, res) => {
    try {
      const safeguard = await storage.getSafeguardByAssessmentAndCisId(
        req.params.assessmentId,
        req.params.cisId
      );
      if (!safeguard) {
        return res.status(404).json({ error: "Safeguard not found" });
      }
      res.json(safeguard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch safeguard" });
    }
  });

  app.post("/api/safeguards", async (req, res) => {
    try {
      const data = insertSafeguardSchema.parse(req.body);
      const safeguard = await storage.createSafeguard(data);
      res.status(201).json(safeguard);
    } catch (error) {
      res.status(400).json({ error: "Invalid safeguard data" });
    }
  });

  app.patch("/api/safeguards/:id", async (req, res) => {
    try {
      const safeguard = await storage.updateSafeguard(req.params.id, req.body);
      if (!safeguard) {
        return res.status(404).json({ error: "Safeguard not found" });
      }
      res.json(safeguard);
    } catch (error) {
      res.status(400).json({ error: "Failed to update safeguard" });
    }
  });

  app.post("/api/safeguards/:id/lock", async (req, res) => {
    try {
      const { lockedBy } = req.body;
      if (!lockedBy) {
        return res.status(400).json({ error: "lockedBy is required" });
      }
      const safeguard = await storage.lockSafeguard(req.params.id, lockedBy);
      if (!safeguard) {
        return res.status(404).json({ error: "Safeguard not found" });
      }
      res.json(safeguard);
    } catch (error) {
      res.status(400).json({ error: "Failed to lock safeguard" });
    }
  });

  // Criteria
  app.get("/api/safeguards/:safeguardId/criteria", async (req, res) => {
    try {
      const criteria = await storage.getCriteriaBySafeguard(req.params.safeguardId);
      res.json(criteria);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch criteria" });
    }
  });

  app.post("/api/criteria", async (req, res) => {
    try {
      const data = insertCriterionSchema.parse(req.body);
      const criterion = await storage.createCriterion(data);
      res.status(201).json(criterion);
    } catch (error) {
      res.status(400).json({ error: "Invalid criterion data" });
    }
  });

  app.patch("/api/criteria/:id", async (req, res) => {
    try {
      const criterion = await storage.updateCriterion(req.params.id, req.body);
      if (!criterion) {
        return res.status(404).json({ error: "Criterion not found" });
      }
      res.json(criterion);
    } catch (error) {
      res.status(400).json({ error: "Failed to update criterion" });
    }
  });

  // Change History
  app.get("/api/safeguards/:safeguardId/history", async (req, res) => {
    try {
      const history = await storage.getChangeHistoryBySafeguard(req.params.safeguardId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch change history" });
    }
  });

  app.post("/api/history", async (req, res) => {
    try {
      const data = insertChangeHistorySchema.parse(req.body);
      const history = await storage.createChangeHistory(data);
      res.status(201).json(history);
    } catch (error) {
      res.status(400).json({ error: "Invalid history data" });
    }
  });

  // Findings
  app.get("/api/assessments/:assessmentId/findings", async (req, res) => {
    try {
      const findings = await storage.getFindingsByAssessment(req.params.assessmentId);
      res.json(findings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch findings" });
    }
  });

  app.post("/api/findings", async (req, res) => {
    try {
      const data = insertFindingSchema.parse(req.body);
      const finding = await storage.createFinding(data);
      res.status(201).json(finding);
    } catch (error) {
      res.status(400).json({ error: "Invalid finding data" });
    }
  });

  app.patch("/api/findings/:id", async (req, res) => {
    try {
      const finding = await storage.updateFinding(req.params.id, req.body);
      if (!finding) {
        return res.status(404).json({ error: "Finding not found" });
      }
      res.json(finding);
    } catch (error) {
      res.status(400).json({ error: "Failed to update finding" });
    }
  });

  return httpServer;
}
