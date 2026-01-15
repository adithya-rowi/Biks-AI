import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  type User,
  type InsertUser,
  type Assessment,
  type InsertAssessment,
  type Document,
  type InsertDocument,
  type Safeguard,
  type InsertSafeguard,
  type Criterion,
  type InsertCriterion,
  type ChangeHistory,
  type InsertChangeHistory,
  type Finding,
  type InsertFinding,
  type TeamMember,
  type InsertTeamMember,
  users,
  assessments,
  documents,
  safeguards,
  criteria,
  changeHistory,
  findings,
  teamMembers,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Team Members
  getAllTeamMembers(): Promise<TeamMember[]>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;

  // Assessments
  getAllAssessments(): Promise<Assessment[]>;
  getAssessment(id: string): Promise<Assessment | undefined>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: string, data: Partial<InsertAssessment>): Promise<Assessment | undefined>;

  // Documents
  getAllDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined>;
  lockDocument(id: string, lockedBy: string): Promise<Document | undefined>;

  // Safeguards
  getSafeguardsByAssessment(assessmentId: string): Promise<Safeguard[]>;
  getSafeguard(id: string): Promise<Safeguard | undefined>;
  getSafeguardByAssessmentAndCisId(assessmentId: string, cisId: string): Promise<Safeguard | undefined>;
  createSafeguard(safeguard: InsertSafeguard): Promise<Safeguard>;
  updateSafeguard(id: string, data: Partial<InsertSafeguard>): Promise<Safeguard | undefined>;
  lockSafeguard(id: string, lockedBy: string): Promise<Safeguard | undefined>;

  // Criteria
  getCriteriaBySafeguard(safeguardId: string): Promise<Criterion[]>;
  getCriterion(id: string): Promise<Criterion | undefined>;
  createCriterion(criterion: InsertCriterion): Promise<Criterion>;
  updateCriterion(id: string, data: Partial<InsertCriterion>): Promise<Criterion | undefined>;

  // Change History
  getChangeHistoryBySafeguard(safeguardId: string): Promise<ChangeHistory[]>;
  createChangeHistory(history: InsertChangeHistory): Promise<ChangeHistory>;

  // Findings
  getFindingsByAssessment(assessmentId: string): Promise<Finding[]>;
  createFinding(finding: InsertFinding): Promise<Finding>;
  updateFinding(id: string, data: Partial<InsertFinding>): Promise<Finding | undefined>;
}

export class PostgresStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Team Members
  async getAllTeamMembers(): Promise<TeamMember[]> {
    return db.select().from(teamMembers);
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const result = await db.insert(teamMembers).values(member).returning();
    return result[0];
  }

  // Assessments
  async getAllAssessments(): Promise<Assessment[]> {
    return db.select().from(assessments).orderBy(desc(assessments.createdAt));
  }

  async getAssessment(id: string): Promise<Assessment | undefined> {
    const result = await db.select().from(assessments).where(eq(assessments.id, id)).limit(1);
    return result[0];
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const result = await db.insert(assessments).values(assessment).returning();
    return result[0];
  }

  async updateAssessment(id: string, data: Partial<InsertAssessment>): Promise<Assessment | undefined> {
    const result = await db
      .update(assessments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(assessments.id, id))
      .returning();
    return result[0];
  }

  // Documents
  async getAllDocuments(): Promise<Document[]> {
    return db.select().from(documents).orderBy(desc(documents.uploadedAt));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    return result[0];
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values(document).returning();
    return result[0];
  }

  async updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined> {
    const result = await db.update(documents).set(data).where(eq(documents.id, id)).returning();
    return result[0];
  }

  async lockDocument(id: string, lockedBy: string): Promise<Document | undefined> {
    const result = await db
      .update(documents)
      .set({ locked: true, lockedBy, lockedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return result[0];
  }

  // Safeguards
  async getSafeguardsByAssessment(assessmentId: string): Promise<Safeguard[]> {
    return db.select().from(safeguards).where(eq(safeguards.assessmentId, assessmentId));
  }

  async getSafeguard(id: string): Promise<Safeguard | undefined> {
    const result = await db.select().from(safeguards).where(eq(safeguards.id, id)).limit(1);
    return result[0];
  }

  async getSafeguardByAssessmentAndCisId(assessmentId: string, cisId: string): Promise<Safeguard | undefined> {
    const result = await db
      .select()
      .from(safeguards)
      .where(and(eq(safeguards.assessmentId, assessmentId), eq(safeguards.cisId, cisId)))
      .limit(1);
    return result[0];
  }

  async createSafeguard(safeguard: InsertSafeguard): Promise<Safeguard> {
    const result = await db.insert(safeguards).values(safeguard).returning();
    return result[0];
  }

  async updateSafeguard(id: string, data: Partial<InsertSafeguard>): Promise<Safeguard | undefined> {
    const result = await db.update(safeguards).set(data).where(eq(safeguards.id, id)).returning();
    return result[0];
  }

  async lockSafeguard(id: string, lockedBy: string): Promise<Safeguard | undefined> {
    const result = await db
      .update(safeguards)
      .set({ locked: true, lockedBy, lockedAt: new Date() })
      .where(eq(safeguards.id, id))
      .returning();
    return result[0];
  }

  // Criteria
  async getCriteriaBySafeguard(safeguardId: string): Promise<Criterion[]> {
    return db.select().from(criteria).where(eq(criteria.safeguardId, safeguardId));
  }

  async getCriterion(id: string): Promise<Criterion | undefined> {
    const result = await db.select().from(criteria).where(eq(criteria.id, id)).limit(1);
    return result[0];
  }

  async createCriterion(criterion: InsertCriterion): Promise<Criterion> {
    const result = await db.insert(criteria).values(criterion).returning();
    return result[0];
  }

  async updateCriterion(id: string, data: Partial<InsertCriterion>): Promise<Criterion | undefined> {
    const result = await db.update(criteria).set(data).where(eq(criteria.id, id)).returning();
    return result[0];
  }

  // Change History
  async getChangeHistoryBySafeguard(safeguardId: string): Promise<ChangeHistory[]> {
    return db.select().from(changeHistory).where(eq(changeHistory.safeguardId, safeguardId)).orderBy(desc(changeHistory.timestamp));
  }

  async createChangeHistory(history: InsertChangeHistory): Promise<ChangeHistory> {
    const result = await db.insert(changeHistory).values(history).returning();
    return result[0];
  }

  // Findings
  async getFindingsByAssessment(assessmentId: string): Promise<Finding[]> {
    return db.select().from(findings).where(eq(findings.assessmentId, assessmentId)).orderBy(desc(findings.createdAt));
  }

  async createFinding(finding: InsertFinding): Promise<Finding> {
    const result = await db.insert(findings).values(finding).returning();
    return result[0];
  }

  async updateFinding(id: string, data: Partial<InsertFinding>): Promise<Finding | undefined> {
    const result = await db.update(findings).set(data).where(eq(findings.id, id)).returning();
    return result[0];
  }
}

export const storage = new PostgresStorage();
