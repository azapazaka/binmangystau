# Vite Auth Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the dormant Next surface, add citizen registration to the Vite auth flow, and harden auth-dependent writes before pushing and deploying the Vite app.

**Architecture:** Keep the app as a browser-only Vite SPA backed directly by Supabase JS. Extend the existing auth context and login page to support citizen registration, and gate protected writes with verified Supabase users so stale sessions fail clearly instead of surfacing raw RLS errors.

**Tech Stack:** Vite, React 19, React Router 7, TypeScript, Supabase JS, Vitest, Vercel CLI

---

### Task 1: Lock in auth-write regression coverage

**Files:**
- Create: `tests/lib/api.test.ts`
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Write the failing tests**

Add tests for unauthenticated report submission rejection and successful authenticated submission.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lib/api.test.ts`
Expected: FAIL because `createReport` does not verify the current Supabase user before writing.

- [ ] **Step 3: Write minimal implementation**

Add a shared helper in `src/lib/api.ts` that calls `supabase.auth.getUser()` and throws a clear session-expired message when the verified user is missing or mismatched. Use it in `createReport`, `castHumanVote`, and `updateClusterStatus`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/lib/api.test.ts`
Expected: PASS

### Task 2: Add citizen registration to the Vite auth layer

**Files:**
- Modify: `src/contexts/AuthContext.tsx`
- Modify: `src/pages/auth/LoginPage.tsx`
- Create: `tests/contexts/auth-context.test.tsx`

- [ ] **Step 1: Write the failing tests**

Cover:
- successful citizen registration with immediate session
- successful citizen registration with no returned session
- registration failure returning a visible error

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/contexts/auth-context.test.tsx`
Expected: FAIL because the auth context has no registration method and the login page has no registration flow.

- [ ] **Step 3: Write minimal implementation**

Extend `AuthContext` with `registerCitizen`. Use `supabase.auth.signUp` with `role: "citizen"` and `full_name`. Return structured result for:
- `signed_in`
- `confirm_email`
- `error`

Update the Vite login page to expose a citizen registration mode with:
- full name
- email
- password
- success state for confirmation-required registration

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/contexts/auth-context.test.tsx`
Expected: PASS

### Task 3: Remove the dormant Next app surface

**Files:**
- Delete: `app/`
- Delete: `components/`
- Delete: `lib/`
- Delete: `types/`
- Delete: `next.config.ts`
- Delete: `next-env.d.ts`

- [ ] **Step 1: Verify Vite code does not import deleted Next-only paths**

Run: `rg -n "@/lib|@/components|@/types|next/" src tests package.json`
Expected: Only Vite-owned `src/*` imports remain valid.

- [ ] **Step 2: Delete the dormant Next surface**

Remove the files and directories listed above from the worktree.

- [ ] **Step 3: Re-run project-wide checks**

Run:
- `npm test`
- `npm run build`

Expected:
- tests either pass or only show clearly unrelated pre-existing failures
- build passes

### Task 4: Push and deploy the exact Vite commit

**Files:**
- None

- [ ] **Step 1: Review working tree**

Run: `git status --short`
Expected: only intended Vite-auth consolidation changes are present.

- [ ] **Step 2: Commit**

Run:
- `git add -A`
- `git commit -m "feat: consolidate auth on vite app"`

- [ ] **Step 3: Push**

Run: `git push -u origin feat/vite-auth-consolidation`

- [ ] **Step 4: Deploy production**

Run: `vercel deploy --prod --yes`

- [ ] **Step 5: Verify deployment**

Run:
- `vercel inspect`
- fetch the live HTML and confirm the current JS asset changed

Expected: production deployment status is `Ready`
