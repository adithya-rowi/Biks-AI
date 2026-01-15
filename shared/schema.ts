import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Team members
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role").notNull(),
  email: text("email").notNull().unique(),
  avatarColor: text("avatar_color").notNull().default('#0F766E'),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true });
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

// Assessments
export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  framework: text("framework").notNull().default('CIS Controls v8 IG1'),
  status: text("status").notNull().default('in_progress'), // in_progress, completed, archived
  maturityScore: integer("maturity_score").notNull().default(0),
  controlsCovered: integer("controls_covered").notNull().default(0),
  controlsPartial: integer("controls_partial").notNull().default(0),
  controlsGap: integer("controls_gap").notNull().default(0),
  totalControls: integer("total_controls").notNull().default(56),
  dueDate: text("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;

// Documents
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  version: text("version").notNull(),
  type: text("type").notNull(), // policy, procedure, evidence, etc.
  status: text("status").notNull().default('parsing'), // parsing, indexing, ready, failed
  uploadedBy: text("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  locked: boolean("locked").notNull().default(false),
  lockedBy: text("locked_by"),
  lockedAt: timestamp("locked_at"),
  referencedBy: text("referenced_by").array(), // assessment IDs
  fileSize: integer("file_size"),
  pageCount: integer("page_count"),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({ 
  id: true, 
  uploadedAt: true,
  locked: true,
  lockedBy: true,
  lockedAt: true
});
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Safeguards (Controls)
export const safeguards = pgTable("safeguards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  cisId: text("cis_id").notNull(), // e.g., "1.1", "2.1"
  name: text("name").notNull(),
  assetType: text("asset_type").notNull(), // Devices, Applications, etc.
  securityFunction: text("security_function").notNull(), // Identify, Protect, etc.
  status: text("status").notNull().default('gap'), // gap, partial, covered
  score: integer("score").notNull().default(0), // 0-100
  owner: text("owner"),
  dueDate: text("due_date"),
  locked: boolean("locked").notNull().default(false),
  lockedBy: text("locked_by"),
  lockedAt: timestamp("locked_at"),
  remediationStatus: text("remediation_status").default('not_started'), // not_started, in_progress, blocked, implemented
  remediationOwner: text("remediation_owner"),
  reviewerNotes: text("reviewer_notes"),
});

export const insertSafeguardSchema = createInsertSchema(safeguards).omit({ 
  id: true,
  locked: true,
  lockedBy: true,
  lockedAt: true
});
export type InsertSafeguard = z.infer<typeof insertSafeguardSchema>;
export type Safeguard = typeof safeguards.$inferSelect;

// Criteria (for each safeguard)
export const criteria = pgTable("criteria", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  safeguardId: varchar("safeguard_id").notNull().references(() => safeguards.id, { onDelete: 'cascade' }),
  text: text("text").notNull(),
  status: text("status").notNull().default('not_met'), // met, partial, not_met, insufficient
  citationDocumentId: varchar("citation_document_id").references(() => documents.id),
  citationPage: text("citation_page"),
  citationSection: text("citation_section"),
  citationExcerpt: text("citation_excerpt"),
  citationHighlight: text("citation_highlight"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertCriterionSchema = createInsertSchema(criteria).omit({ id: true });
export type InsertCriterion = z.infer<typeof insertCriterionSchema>;
export type Criterion = typeof criteria.$inferSelect;

// Change history / audit trail
export const changeHistory = pgTable("change_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  safeguardId: varchar("safeguard_id").notNull().references(() => safeguards.id, { onDelete: 'cascade' }),
  criterionId: varchar("criterion_id").references(() => criteria.id, { onDelete: 'cascade' }),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  details: jsonb("details"), // Store any additional context
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertChangeHistorySchema = createInsertSchema(changeHistory).omit({ 
  id: true, 
  timestamp: true 
});
export type InsertChangeHistory = z.infer<typeof insertChangeHistorySchema>;
export type ChangeHistory = typeof changeHistory.$inferSelect;

// Findings
export const findings = pgTable("findings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  cisId: text("cis_id").notNull(),
  title: text("title").notNull(),
  severity: text("severity").notNull(), // high, medium, low
  impact: text("impact").notNull(),
  recommendation: text("recommendation").notNull(),
  status: text("status").notNull().default('open'), // open, in_progress, resolved
  assignedTo: text("assigned_to"),
  dueDate: text("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFindingSchema = createInsertSchema(findings).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertFinding = z.infer<typeof insertFindingSchema>;
export type Finding = typeof findings.$inferSelect;
