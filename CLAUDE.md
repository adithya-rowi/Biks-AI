# Project Context & Stack
- **Origin:** Started in Replit (Design Mock), moved to Local (Production Build).
- **Core:** React + Vite (Client) / Express (Server)
- **Routing:** wouter (lightweight React router)
- **Database:** PostgreSQL + Drizzle ORM
- **Styling:** Tailwind CSS (Utility-first)
- **UI System:** Shadcn/UI (for clean, accessible components) + Lucide React (Icons)
- **Animation:** Framer Motion (for "beautiful," fluid interactions)
- **Language:** TypeScript

# Work & Interaction Rules

## 1. Plan Before Execute
- **Do not** start coding immediately.
- **Always** output a bulleted plan first.
- **Wait** for my confirmation on complex logic.
- If the change is visual, describe the expected aesthetic outcome.

## 2. Bias Towards Shipping
- **Speed over perfection:** Get it working first, then make it pretty.
- **Small Batches:** Do not refactor the entire app at once. Focus on the current task.
- **Replit Handoff:** Respect existing code structure from the Replit mock unless it's fundamentally broken.

## 3. Testing & Quality
- **TDD Lite:** Write a test case for critical logic *before* implementation.
- **Sanity Check:** Run `npm run build` or `npm test` before asking me to commit.
- **No Regressions:** Ensure new "beautiful" features don't break existing functionality.

## 4. Aesthetic Guidelines (The "Beauty" Standard)
- **Whitespace:** Use generous padding/margins. Avoid cramped UIs.
- **Motion:** Use `framer-motion` for subtle entrance animations and hover states. No jarring transitions.
- **Typography:** Hierarchy matters. Use font weights and colors to create depth.
- **Details:** Round those corners (`rounded-xl` or `rounded-2xl`). Add subtle drop shadows or borders.

# Commands
- Dev Server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Test: `npm test`