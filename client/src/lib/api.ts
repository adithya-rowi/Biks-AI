import type { 
  Assessment, 
  Document, 
  Safeguard, 
  Criterion, 
  ChangeHistory, 
  Finding,
  TeamMember 
} from "@shared/schema";

const API_BASE = "/api";

export const api = {
  // Team Members
  teamMembers: {
    getAll: async (): Promise<TeamMember[]> => {
      const res = await fetch(`${API_BASE}/team-members`);
      if (!res.ok) throw new Error("Failed to fetch team members");
      return res.json();
    },
  },

  // Assessments
  assessments: {
    getAll: async (): Promise<Assessment[]> => {
      const res = await fetch(`${API_BASE}/assessments`);
      if (!res.ok) throw new Error("Failed to fetch assessments");
      return res.json();
    },
    
    getOne: async (id: string): Promise<Assessment> => {
      const res = await fetch(`${API_BASE}/assessments/${id}`);
      if (!res.ok) throw new Error("Failed to fetch assessment");
      return res.json();
    },

    create: async (data: Partial<Assessment>): Promise<Assessment> => {
      const res = await fetch(`${API_BASE}/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create assessment");
      return res.json();
    },

    update: async (id: string, data: Partial<Assessment>): Promise<Assessment> => {
      const res = await fetch(`${API_BASE}/assessments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update assessment");
      return res.json();
    },
  },

  // Documents
  documents: {
    getAll: async (): Promise<Document[]> => {
      const res = await fetch(`${API_BASE}/documents`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },

    create: async (data: Partial<Document>): Promise<Document> => {
      const res = await fetch(`${API_BASE}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create document");
      return res.json();
    },

    update: async (id: string, data: Partial<Document>): Promise<Document> => {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update document");
      return res.json();
    },

    lock: async (id: string, lockedBy: string): Promise<Document> => {
      const res = await fetch(`${API_BASE}/documents/${id}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockedBy }),
      });
      if (!res.ok) throw new Error("Failed to lock document");
      return res.json();
    },
  },

  // Safeguards
  safeguards: {
    getByAssessment: async (assessmentId: string): Promise<Safeguard[]> => {
      const res = await fetch(`${API_BASE}/assessments/${assessmentId}/safeguards`);
      if (!res.ok) throw new Error("Failed to fetch safeguards");
      return res.json();
    },

    getOne: async (id: string): Promise<Safeguard> => {
      const res = await fetch(`${API_BASE}/safeguards/${id}`);
      if (!res.ok) throw new Error("Failed to fetch safeguard");
      return res.json();
    },

    getByAssessmentAndCisId: async (assessmentId: string, cisId: string): Promise<Safeguard> => {
      const res = await fetch(`${API_BASE}/assessments/${assessmentId}/safeguards/${cisId}`);
      if (!res.ok) throw new Error("Failed to fetch safeguard");
      return res.json();
    },

    update: async (id: string, data: Partial<Safeguard>): Promise<Safeguard> => {
      const res = await fetch(`${API_BASE}/safeguards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update safeguard");
      return res.json();
    },

    lock: async (id: string, lockedBy: string): Promise<Safeguard> => {
      const res = await fetch(`${API_BASE}/safeguards/${id}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockedBy }),
      });
      if (!res.ok) throw new Error("Failed to lock safeguard");
      return res.json();
    },
  },

  // Criteria
  criteria: {
    getBySafeguard: async (safeguardId: string): Promise<Criterion[]> => {
      const res = await fetch(`${API_BASE}/safeguards/${safeguardId}/criteria`);
      if (!res.ok) throw new Error("Failed to fetch criteria");
      return res.json();
    },

    update: async (id: string, data: Partial<Criterion>): Promise<Criterion> => {
      const res = await fetch(`${API_BASE}/criteria/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update criterion");
      return res.json();
    },
  },

  // Change History
  history: {
    getBySafeguard: async (safeguardId: string): Promise<ChangeHistory[]> => {
      const res = await fetch(`${API_BASE}/safeguards/${safeguardId}/history`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },

    create: async (data: Partial<ChangeHistory>): Promise<ChangeHistory> => {
      const res = await fetch(`${API_BASE}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create history entry");
      return res.json();
    },
  },

  // Findings
  findings: {
    getByAssessment: async (assessmentId: string): Promise<Finding[]> => {
      const res = await fetch(`${API_BASE}/assessments/${assessmentId}/findings`);
      if (!res.ok) throw new Error("Failed to fetch findings");
      return res.json();
    },

    create: async (data: Partial<Finding>): Promise<Finding> => {
      const res = await fetch(`${API_BASE}/findings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create finding");
      return res.json();
    },

    update: async (id: string, data: Partial<Finding>): Promise<Finding> => {
      const res = await fetch(`${API_BASE}/findings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update finding");
      return res.json();
    },
  },
};
