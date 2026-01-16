import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import {
  insertAssessmentSchema,
  insertTeamMemberSchema,
  DEFAULT_COMPANY_ID,
} from "@shared/schema";
import { getAllSafeguards } from "./data/cis-ig1-controls";
import { parseDocumentFromBuffer, isSupportedFile } from "./services/landing-ai";
import { indexDocument } from "./services/ragie";
import { runAssessment, getAssessmentRunStatus } from "./services/assessment";
import { generateAssessmentReport } from "./services/pdf-export";

// Configure multer for file uploads
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (_req, file, cb) => {
    if (isSupportedFile(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${path.extname(file.originalname)}`));
    }
  },
});

// Store active assessment runs for progress tracking
const activeRuns = new Map<string, { cancel: () => void }>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============================================================================
  // Team Members
  // ============================================================================

  app.get("/api/team-members", async (_req: Request, res: Response) => {
    try {
      const members = await storage.getAllTeamMembers();
      res.json(members);
    } catch (error) {
      console.error("Failed to fetch team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.post("/api/team-members", async (req: Request, res: Response) => {
    try {
      const data = insertTeamMemberSchema.parse(req.body);
      const member = await storage.createTeamMember(data);
      res.status(201).json(member);
    } catch (error) {
      console.error("Failed to create team member:", error);
      res.status(400).json({ error: "Invalid team member data" });
    }
  });

  // ============================================================================
  // Documents
  // ============================================================================

  // List all documents
  app.get("/api/documents", async (_req: Request, res: Response) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Get document by ID
  app.get("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Failed to fetch document:", error);
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  // Upload document (with parsing and indexing)
  app.post(
    "/api/documents",
    upload.single("file"),
    async (req: Request, res: Response) => {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const {
        name = file.originalname,
        version = "1.0",
        type = "policy",
        uploadedBy = "system",
        companyId = DEFAULT_COMPANY_ID,
      } = req.body;

      // Create document record in uploading state
      let document;
      try {
        document = await storage.createDocument({
          companyId,
          name,
          version,
          type,
          status: "uploading",
          uploadedBy,
          fileUrl: file.path,
          mimeType: file.mimetype,
          fileSize: file.size,
        });
      } catch (error) {
        console.error("Failed to create document record:", error);
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        return res.status(500).json({ error: "Failed to create document record" });
      }

      // Return immediately, process async
      res.status(202).json({
        ...document,
        message: "Document uploaded. Processing will continue in background.",
      });

      // Process document in background
      processDocument(document.id, file, companyId).catch((error) => {
        console.error(`Background processing failed for document ${document.id}:`, error);
      });
    }
  );

  // Update document
  app.patch("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const document = await storage.updateDocument(req.params.id, req.body);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Failed to update document:", error);
      res.status(400).json({ error: "Failed to update document" });
    }
  });

  // Lock document
  app.post("/api/documents/:id/lock", async (req: Request, res: Response) => {
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
      console.error("Failed to lock document:", error);
      res.status(400).json({ error: "Failed to lock document" });
    }
  });

  // ============================================================================
  // Assessments
  // ============================================================================

  // List all assessments
  app.get("/api/assessments", async (_req: Request, res: Response) => {
    try {
      const assessments = await storage.getAllAssessments();
      res.json(assessments);
    } catch (error) {
      console.error("Failed to fetch assessments:", error);
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  // Get assessment by ID (with stats)
  app.get("/api/assessments/:id", async (req: Request, res: Response) => {
    try {
      const assessment = await storage.getAssessment(req.params.id);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      console.error("Failed to fetch assessment:", error);
      res.status(500).json({ error: "Failed to fetch assessment" });
    }
  });

  // Create new assessment (with CIS IG1 safeguards/criteria)
  app.post("/api/assessments", async (req: Request, res: Response) => {
    try {
      const data = insertAssessmentSchema.parse(req.body);
      const companyId = data.companyId || DEFAULT_COMPANY_ID;

      // Create assessment
      const assessment = await storage.createAssessment({
        ...data,
        companyId,
        totalControls: 56, // CIS IG1 has 56 safeguards
      });

      // Populate safeguards from CIS IG1 data
      const cisData = getAllSafeguards();

      const safeguardsToCreate = cisData.map((sg) => ({
        companyId,
        assessmentId: assessment.id,
        cisId: sg.cisId,
        name: sg.title,
        assetType: sg.assetClass,
        securityFunction: sg.securityFunction,
        status: "gap" as const,
        score: 0,
      }));

      const createdSafeguards = await storage.createSafeguardsBatch(safeguardsToCreate);

      // Create criteria for each safeguard
      const criteriaToCreate = createdSafeguards.flatMap((safeguard) => {
        const cisSafeguard = cisData.find((sg) => sg.cisId === safeguard.cisId);
        if (!cisSafeguard) return [];

        return cisSafeguard.criteria.map((criterion, index) => ({
          companyId,
          safeguardId: safeguard.id,
          text: criterion.text,
          status: "not_met" as const,
          sortOrder: index,
        }));
      });

      await storage.createCriteriaBatch(criteriaToCreate);

      res.status(201).json({
        ...assessment,
        safeguardsCreated: createdSafeguards.length,
        criteriaCreated: criteriaToCreate.length,
      });
    } catch (error) {
      console.error("Failed to create assessment:", error);
      res.status(400).json({ error: "Invalid assessment data" });
    }
  });

  // Update assessment
  app.patch("/api/assessments/:id", async (req: Request, res: Response) => {
    try {
      const assessment = await storage.updateAssessment(req.params.id, req.body);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      console.error("Failed to update assessment:", error);
      res.status(400).json({ error: "Failed to update assessment" });
    }
  });

  // Run AI assessment
  app.post("/api/assessments/:id/run", async (req: Request, res: Response) => {
    const assessmentId = req.params.id;
    const { companyId } = req.body;

    try {
      // Check if assessment exists
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      // Check if already running
      if (assessment.runStatus === "running") {
        return res.status(409).json({
          error: "Assessment is already running",
          runStatus: assessment.runStatus,
          runProgress: assessment.runProgress,
        });
      }

      // Return immediately, run in background
      res.status(202).json({
        message: "Assessment run started",
        assessmentId,
        runStatus: "running",
      });

      // Run assessment in background
      runAssessment(assessmentId, { companyId })
        .then((result) => {
          console.log(`Assessment ${assessmentId} completed:`, result.status);
        })
        .catch((error) => {
          console.error(`Assessment ${assessmentId} failed:`, error);
        });
    } catch (error) {
      console.error("Failed to start assessment run:", error);
      res.status(500).json({ error: "Failed to start assessment run" });
    }
  });

  // Get assessment run status
  app.get("/api/assessments/:id/run-status", async (req: Request, res: Response) => {
    try {
      const status = await getAssessmentRunStatus(req.params.id);
      if (!status) {
        return res.status(404).json({ error: "Assessment not found" });
      }
      res.json(status);
    } catch (error) {
      console.error("Failed to get run status:", error);
      res.status(500).json({ error: "Failed to get run status" });
    }
  });

  // ============================================================================
  // Safeguards
  // ============================================================================

  // List safeguards for assessment
  app.get("/api/assessments/:assessmentId/safeguards", async (req: Request, res: Response) => {
    try {
      const safeguards = await storage.getSafeguardsByAssessment(req.params.assessmentId);
      res.json(safeguards);
    } catch (error) {
      console.error("Failed to fetch safeguards:", error);
      res.status(500).json({ error: "Failed to fetch safeguards" });
    }
  });

  // Get safeguard by ID (with criteria)
  app.get("/api/safeguards/:id", async (req: Request, res: Response) => {
    try {
      const safeguard = await storage.getSafeguard(req.params.id);
      if (!safeguard) {
        return res.status(404).json({ error: "Safeguard not found" });
      }

      // Include criteria
      const criteria = await storage.getCriteriaBySafeguard(safeguard.id);

      res.json({
        ...safeguard,
        criteria,
      });
    } catch (error) {
      console.error("Failed to fetch safeguard:", error);
      res.status(500).json({ error: "Failed to fetch safeguard" });
    }
  });

  // Get safeguard by assessment and CIS ID
  app.get("/api/assessments/:assessmentId/safeguards/:cisId", async (req: Request, res: Response) => {
    try {
      const safeguard = await storage.getSafeguardByAssessmentAndCisId(
        req.params.assessmentId,
        req.params.cisId
      );
      if (!safeguard) {
        return res.status(404).json({ error: "Safeguard not found" });
      }

      // Include criteria
      const criteria = await storage.getCriteriaBySafeguard(safeguard.id);

      res.json({
        ...safeguard,
        criteria,
      });
    } catch (error) {
      console.error("Failed to fetch safeguard:", error);
      res.status(500).json({ error: "Failed to fetch safeguard" });
    }
  });

  // Update safeguard (override status, assign owner, due date, notes)
  app.patch("/api/safeguards/:id", async (req: Request, res: Response) => {
    try {
      // Only allow specific fields to be updated
      const allowedFields = [
        "status",
        "score",
        "owner",
        "dueDate",
        "remediationStatus",
        "remediationOwner",
        "reviewerNotes",
      ];

      const updateData: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const safeguard = await storage.updateSafeguard(req.params.id, updateData);
      if (!safeguard) {
        return res.status(404).json({ error: "Safeguard not found" });
      }

      // Log change history if actor provided
      if (req.body.actor) {
        await storage.createChangeHistory({
          companyId: safeguard.companyId,
          safeguardId: safeguard.id,
          actor: req.body.actor,
          action: "safeguard_updated",
          details: updateData,
        });
      }

      res.json(safeguard);
    } catch (error) {
      console.error("Failed to update safeguard:", error);
      res.status(400).json({ error: "Failed to update safeguard" });
    }
  });

  // Lock safeguard
  app.post("/api/safeguards/:id/lock", async (req: Request, res: Response) => {
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
      console.error("Failed to lock safeguard:", error);
      res.status(400).json({ error: "Failed to lock safeguard" });
    }
  });

  // ============================================================================
  // Criteria
  // ============================================================================

  // List criteria for safeguard
  app.get("/api/safeguards/:safeguardId/criteria", async (req: Request, res: Response) => {
    try {
      const criteria = await storage.getCriteriaBySafeguard(req.params.safeguardId);
      res.json(criteria);
    } catch (error) {
      console.error("Failed to fetch criteria:", error);
      res.status(500).json({ error: "Failed to fetch criteria" });
    }
  });

  // Get criterion by ID
  app.get("/api/criteria/:id", async (req: Request, res: Response) => {
    try {
      const criterion = await storage.getCriterion(req.params.id);
      if (!criterion) {
        return res.status(404).json({ error: "Criterion not found" });
      }
      res.json(criterion);
    } catch (error) {
      console.error("Failed to fetch criterion:", error);
      res.status(500).json({ error: "Failed to fetch criterion" });
    }
  });

  // Update criterion (override status, citation)
  app.patch("/api/criteria/:id", async (req: Request, res: Response) => {
    try {
      // Only allow specific fields to be updated
      const allowedFields = [
        "status",
        "citationDocumentId",
        "citationPage",
        "citationSection",
        "citationExcerpt",
        "citationHighlight",
        "ragieChunkId",
      ];

      const updateData: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const criterion = await storage.updateCriterion(req.params.id, updateData);
      if (!criterion) {
        return res.status(404).json({ error: "Criterion not found" });
      }

      // Log change history if actor provided
      if (req.body.actor && criterion.safeguardId) {
        await storage.createChangeHistory({
          companyId: criterion.companyId,
          safeguardId: criterion.safeguardId,
          criterionId: criterion.id,
          actor: req.body.actor,
          action: "criterion_updated",
          details: updateData,
        });
      }

      res.json(criterion);
    } catch (error) {
      console.error("Failed to update criterion:", error);
      res.status(400).json({ error: "Failed to update criterion" });
    }
  });

  // ============================================================================
  // Change History
  // ============================================================================

  app.get("/api/safeguards/:safeguardId/history", async (req: Request, res: Response) => {
    try {
      const history = await storage.getChangeHistoryBySafeguard(req.params.safeguardId);
      res.json(history);
    } catch (error) {
      console.error("Failed to fetch change history:", error);
      res.status(500).json({ error: "Failed to fetch change history" });
    }
  });

  // ============================================================================
  // Findings
  // ============================================================================

  app.get("/api/assessments/:assessmentId/findings", async (req: Request, res: Response) => {
    try {
      const findings = await storage.getFindingsByAssessment(req.params.assessmentId);
      res.json(findings);
    } catch (error) {
      console.error("Failed to fetch findings:", error);
      res.status(500).json({ error: "Failed to fetch findings" });
    }
  });

  app.patch("/api/findings/:id", async (req: Request, res: Response) => {
    try {
      const finding = await storage.updateFinding(req.params.id, req.body);
      if (!finding) {
        return res.status(404).json({ error: "Finding not found" });
      }
      res.json(finding);
    } catch (error) {
      console.error("Failed to update finding:", error);
      res.status(400).json({ error: "Failed to update finding" });
    }
  });

  // ============================================================================
  // PDF Export
  // ============================================================================

  // Generate and return PDF directly
  app.post("/api/assessments/:id/export/pdf", async (req: Request, res: Response) => {
    const assessmentId = req.params.id;
    const { requestedBy = "system", companyId = DEFAULT_COMPANY_ID } = req.body;

    try {
      // Check if assessment exists
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      // Create export job record
      const exportJob = await storage.createExportJob({
        companyId,
        assessmentId,
        type: "pdf",
        status: "generating",
        requestedBy,
      });

      try {
        // Generate PDF
        const pdfBuffer = await generateAssessmentReport(assessmentId, {
          includeGapDetails: req.body.includeGapDetails !== false,
          includeFindings: req.body.includeFindings !== false,
          includeCriteria: req.body.includeCriteria !== false,
        });

        // Save PDF to disk
        const filename = `assessment-${assessmentId}-${Date.now()}.pdf`;
        const exportDir = process.env.EXPORT_DIR || "./exports";

        if (!fs.existsSync(exportDir)) {
          fs.mkdirSync(exportDir, { recursive: true });
        }

        const filePath = path.join(exportDir, filename);
        fs.writeFileSync(filePath, pdfBuffer);

        // Update export job as ready
        await storage.updateExportJob(exportJob.id, {
          status: "ready",
          fileUrl: filePath,
          completedAt: new Date(),
        } as Parameters<typeof storage.updateExportJob>[1]);

        // Return PDF directly
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${assessment.name.replace(/[^a-zA-Z0-9]/g, "_")}_Report.pdf"`
        );
        res.setHeader("X-Export-Job-Id", exportJob.id);
        res.send(pdfBuffer);
      } catch (genError) {
        // Update export job as failed
        await storage.updateExportJob(exportJob.id, {
          status: "failed",
          errorMessage: (genError as Error).message,
          completedAt: new Date(),
        } as Parameters<typeof storage.updateExportJob>[1]);

        throw genError;
      }
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF report" });
    }
  });

  // Get export job status / download
  app.get("/api/exports/:id", async (req: Request, res: Response) => {
    try {
      const exportJob = await storage.getExportJob(req.params.id);
      if (!exportJob) {
        return res.status(404).json({ error: "Export job not found" });
      }

      // If download requested and file is ready
      if (req.query.download === "true" && exportJob.status === "ready" && exportJob.fileUrl) {
        if (fs.existsSync(exportJob.fileUrl)) {
          const assessment = await storage.getAssessment(exportJob.assessmentId);
          const filename = assessment
            ? `${assessment.name.replace(/[^a-zA-Z0-9]/g, "_")}_Report.pdf`
            : "Assessment_Report.pdf";

          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
          return res.sendFile(path.resolve(exportJob.fileUrl));
        } else {
          return res.status(404).json({ error: "Export file not found" });
        }
      }

      // Return job status
      res.json({
        id: exportJob.id,
        assessmentId: exportJob.assessmentId,
        type: exportJob.type,
        status: exportJob.status,
        requestedAt: exportJob.requestedAt,
        completedAt: exportJob.completedAt,
        errorMessage: exportJob.errorMessage,
        downloadUrl: exportJob.status === "ready" ? `/api/exports/${exportJob.id}?download=true` : null,
      });
    } catch (error) {
      console.error("Failed to get export job:", error);
      res.status(500).json({ error: "Failed to get export job" });
    }
  });

  // List export jobs for an assessment
  app.get("/api/assessments/:assessmentId/exports", async (req: Request, res: Response) => {
    try {
      const exports = await storage.getExportJobsByAssessment(req.params.assessmentId);
      res.json(exports);
    } catch (error) {
      console.error("Failed to fetch exports:", error);
      res.status(500).json({ error: "Failed to fetch exports" });
    }
  });

  return httpServer;
}

// ============================================================================
// Background Processing Functions
// ============================================================================

async function processDocument(
  documentId: string,
  file: Express.Multer.File,
  companyId: string
): Promise<void> {
  try {
    // Update status to parsing
    await storage.updateDocument(documentId, { status: "parsing" });

    // Read file and parse with Landing.ai
    const fileBuffer = fs.readFileSync(file.path);
    let parseResult;

    try {
      parseResult = await parseDocumentFromBuffer(fileBuffer, file.originalname, {
        split: "page",
      });
    } catch (parseError) {
      console.error(`Parsing failed for document ${documentId}:`, parseError);
      await storage.updateDocument(documentId, {
        status: "failed",
        errorMessage: `Parsing failed: ${(parseError as Error).message}`,
      });
      return;
    }

    // Update with page count
    await storage.updateDocument(documentId, {
      status: "indexing",
      pageCount: parseResult.metadata.pageCount || parseResult.splits.length || 1,
    });

    // Index with Ragie
    try {
      const document = await storage.getDocument(documentId);
      if (!document) {
        throw new Error("Document not found after parsing");
      }

      const ragieDoc = await indexDocument(companyId, documentId, parseResult.markdown, {
        filename: document.name,
        version: document.version,
        type: document.type,
        pageCount: parseResult.metadata.pageCount,
      });

      // Update document with Ragie ID and mark as ready
      await storage.updateDocument(documentId, {
        status: "ready",
        ragieDocumentId: ragieDoc.id,
      });

      console.log(`Document ${documentId} processed successfully. Ragie ID: ${ragieDoc.id}`);
    } catch (indexError) {
      console.error(`Indexing failed for document ${documentId}:`, indexError);
      await storage.updateDocument(documentId, {
        status: "failed",
        errorMessage: `Indexing failed: ${(indexError as Error).message}`,
      });
    }
  } catch (error) {
    console.error(`Document processing failed for ${documentId}:`, error);
    await storage.updateDocument(documentId, {
      status: "failed",
      errorMessage: `Processing failed: ${(error as Error).message}`,
    });
  }
}
