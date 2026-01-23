# Biks.ai - Cybersecurity Compliance Platform

Cybersecurity compliance platform for Indonesian banks (BUKU 1-3). CIS Controls v8.1 IG1 implementation with deterministic scoring. "Know. Close. Prove."

## Tech Stack
- **Frontend**: React 19 + TypeScript + Wouter + TanStack Query + Shadcn/UI + Tailwind v4 + Framer Motion
- **Backend**: Express + Drizzle ORM + PostgreSQL (Neon)
- **External APIs**: Landing.ai (doc parsing), Ragie.ai (RAG), Anthropic Claude (evidence evaluation)

## Project Structure
```
client/src/           # React frontend
  pages/              # Route pages (Overview, Documents, Assessments)
  components/ui/      # Shadcn components
  lib/api.ts          # API client
server/               # Express backend
  routes.ts           # All API endpoints (822 lines - be careful)
  storage.ts          # Database operations
  services/           # Business logic
    scoring.ts        # CRITICAL: Deterministic scoring formula
    assessment.ts     # AI assessment orchestration
    landing-ai.ts     # Document parsing
    ragie.ts          # RAG retrieval (partitioned by company_id)
    anthropic.ts      # Claude evidence extraction
shared/schema.ts      # Drizzle schema + Zod validation
```

## Commands
```bash
npm run dev           # Start dev server (port 5000)
npm test              # Run vitest tests
npm run db:push       # Push schema changes
npm run check         # TypeScript check
npm run build         # Production build

# Pre-commit sanity check
npm run check && npm test && npm run build
```

## Work Rules
- **Plan first**: Output bulleted plan before coding. Wait for confirmation on complex logic.
- **Bias toward shipping**: Speed over perfection. Small batches. Get it working, then pretty.
- **No regressions**: Run tests before asking to commit.

## Critical Architecture

### Deterministic Scoring (server/services/scoring.ts:48-101)
```
Score = (met + 0.5 × partial) / total_criteria
≥80% → Covered | ≥40% → Partial | <40% → Gap
```
**NEVER modify scoring thresholds without running full test suite. 130+ tests depend on this.**

### Score Recalculation Cascade (routes.ts:542-570)
Criterion status change → recalculates safeguard score → updates assessment stats. Do not break this chain.

### State Machines
- Document: `uploading → parsing → indexing → ready/failed`
- Assessment: `idle → running → completed/failed`

### Multi-tenancy
Ragie partitions by `company_id`. Always include partition in RAG queries.

## Environment Variables
```
DATABASE_URL, ANTHROPIC_API_KEY, RAGIE_API_KEY, LANDING_AI_API_KEY
```

## Testing
- Most critical: `server/services/scoring.test.ts` (130+ tests)
- Always run `npm test` after touching scoring logic

## Do Not
- Modify scoring formula thresholds without discussion
- Edit `routes.ts` without understanding cascade effects
- Break partition-based multi-tenancy in Ragie calls
- Change schema without migration planning
- Skip tests for scoring-related changes