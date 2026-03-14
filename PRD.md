# Estater — Product Requirements Document

## 1. Product Overview

**Estater** is a full-stack property management platform built for UAE landlords and property managers. It handles the complete lifecycle: properties, tenants, contracts, payments, deposits, expenses, mortgages, valuations, and market intelligence — with AI-powered contract analysis and Google Calendar integration.

**Target Users:** Individual landlords, small property management firms, and real estate investors managing portfolios across UAE emirates.

**Core Value Proposition:** Consolidate property management into one tool — from contract signing to rent collection to portfolio valuation — with UAE-specific features (Ejari, DLD data, AED-first, multi-emirate).

---

## 2. Current Feature Set

### Core Entities
| Entity | Description | Dependencies |
|--------|-------------|-------------|
| **Properties** | Buildings/villas across 7 UAE emirates with type classification | None (root entity) |
| **Units** | Individual rentable spaces within a property | Property |
| **Tenants** | Individuals/companies renting units | None (root entity) |
| **Contracts** | Lease agreements linking tenant ↔ unit with payment terms | Unit + Tenant |
| **Payments** | Auto-generated payment schedule from contract | Contract (auto-created) |
| **Deposits** | Security deposits with refund tracking | Contract (optional) |
| **Expenses** | Categorized costs per property/unit (10 categories) | Property (optional Unit) |
| **Mortgages** | Loan tracking with amortization schedules | Property |
| **Valuations** | Property value tracking from multiple sources | Property |

### Key Features
- **AI Contract Upload** — Upload PDF/image → Claude extracts tenant, property, contract details → auto-creates all entities in one click
- **Payment Schedule Generation** — Auto-generates cheque schedule from contract terms
- **Overdue Detection** — Background job auto-marks overdue payments, triggers webhooks
- **Google Calendar Sync** — Syncs contract deadlines and payment due dates
- **Market Data** — DLD (Dubai) and ADREC (Abu Dhabi) transaction data for area comparisons
- **Portfolio Analytics** — Gain/loss tracking, occupancy trends, collection rates, vacancy costs, net income
- **Reports** — PDF/Excel/JSON export (Portfolio Overview, P&L, Rent Roll, Payment History, Occupancy)
- **Document Templates** — Generate contracts, receipts, notices from templates
- **Webhooks** — Event-driven integration (n8n, Zapier) with HMAC signatures and retry queue
- **Audit Trail** — Full change history with before/after diff visualization
- **Reminders** — Configurable alerts for payments and contract expiry
- **Multi-Currency** — AED default with exchange rate support
- **Command Palette** — Cmd+K quick navigation across entities

### Tech Stack
- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS, Framer Motion, Recharts, React Query
- **Backend:** Express.js, TypeScript, SQLite (better-sqlite3, WAL mode)
- **AI:** Anthropic Claude (contract/mortgage analysis)
- **Integrations:** Google Calendar, Google Maps, DLD, ADREC

---

## 3. Entity Creation Sequence (Current)

```
Sign Up → Empty Dashboard → ??? (no guidance)

Required flow to get first value:
1. Create Property (name, type, emirate)
2. Add Unit to Property (unit number)
3. Create Tenant (name, phone)
4. Create Contract (link unit + tenant + dates + rent)
   → Auto-generates payment schedule
   → Auto-creates deposit (optional)
5. Track payments (mark as paid with method + reference)

Shortcut: AI Upload creates tenant + property + unit + contract in one step
```

**Minimum steps to value:** 4 forms across 3 pages (or 1 AI upload)

---

## 4. Current User Flow Gaps (Stage 1 Problems)

### 4.1 — No First-Time Experience
- New user signs up → lands on empty Dashboard with zeros everywhere
- No onboarding wizard, no "getting started" guide, no tooltips
- Empty charts and empty stat cards look broken, not "ready to use"
- User has no idea what to do first or what order things need to happen

### 4.2 — Hidden Dependencies
- Contract requires pre-existing Property + Unit + Tenant
- This isn't communicated anywhere — user discovers it when the dropdowns are empty
- No cross-links between pages ("Create a property first" from Contracts page)
- No breadcrumb or progress indicator showing where user is in setup

### 4.3 — No Feedback Loop
- CRUD operations give zero confirmation (no toasts, no success messages)
- User creates a property → form closes → card appears (was it saved? unclear)
- Delete confirmation uses browser `confirm()` — no styled modal
- Deposit refund uses browser `prompt()` — unacceptable for financial input

### 4.4 — Dead Ends in Empty States
- Payments page with no contracts: "No payments found" — doesn't explain payments come from contracts
- Deposits page with no contracts: "No deposits found" — no guidance
- Portfolio page with no valuations: empty cards with no call-to-action
- Cash Flow page: meaningless without contracts + expenses

### 4.5 — No Quick Actions from Context
- Viewing a property → no "Create contract for this property" shortcut
- Viewing a tenant → no "Create contract for this tenant" shortcut
- Dashboard overdue alert → links to contract but no "Mark Paid" inline
- No "Add another" after creating any entity

### 4.6 — Navigation Overload
- Sidebar shows 15 items immediately — overwhelming for new users
- No distinction between "setup" pages (Properties, Tenants) and "operational" pages (Payments, Deposits)
- Workflows section has 7 items that are irrelevant until data exists
- Mobile nav shows 7 items in the dock — too many

### 4.7 — No Account Setup
- No profile page (can't change name, email, password)
- No organization/company setup
- No preferences (currency, date format, notification preferences)
- Settings link goes directly to Calendar integration — unexpected

---

## 5. Stage 1 Enhancement Plan — User Flow & Engagement

### 5.1 — Onboarding Wizard (First Login)

**Trigger:** First time user reaches Dashboard (detect: 0 properties)

**Step-by-step modal wizard:**

| Step | Title | Action | Skip? |
|------|-------|--------|-------|
| 1 | Welcome | "Let's set up your first property in under 2 minutes" | No |
| 2 | Add Property | Inline form: name, type, emirate | No |
| 3 | Add Unit(s) | Quick unit form (unit #, bedrooms, area) with "Add another" | Can skip |
| 4 | Add Tenant | Name + phone (minimal) | Can skip |
| 5 | Create Contract | Link the above, set rent + dates | Can skip |
| 6 | Done! | "Your dashboard is ready. Here's what you can do next." | — |

**Alternative:** "Skip setup — try with demo data" button loads seed data

### 5.2 — Smart Empty Dashboard

Replace empty zeros with a **Getting Started checklist card:**

```
Getting Started                                    3/5 complete
─────────────────────────────────────────────────────────────
✅ Create your account
✅ Add your first property                    [View →]
✅ Add units to your property                 [View →]
○  Add your first tenant                      [Add Tenant →]
○  Create your first contract                 [New Contract →]
─────────────────────────────────────────────────────────────
                                    [Dismiss checklist]
```

- Checklist persists across sessions (stored in `app_settings` or localStorage)
- Each incomplete step links directly to the relevant action
- Dismiss permanently after all steps complete or user clicks dismiss

### 5.3 — Toast Notification System

Add `sonner` (lightweight toast library) for all CRUD feedback:

| Action | Toast |
|--------|-------|
| Create property | "Property created" with link to view |
| Create tenant | "Tenant added" |
| Create contract | "Contract created — 12 payments scheduled" |
| Mark payment | "Payment #3 marked as paid" |
| Delete entity | "Property deleted" with undo (soft delete) |
| Upload file | "2 files uploaded" |
| AI analysis | "Contract analyzed — review extracted data" |
| Error | Red toast with error message + retry |

### 5.4 — Contextual Empty States with CTAs

Replace dead-end empty states:

**Payments (no contracts):**
> "Payments are auto-generated when you create contracts.
> [Create your first contract →]"

**Deposits (no contracts):**
> "Security deposits are created alongside contracts.
> [Create a contract with deposit →]"

**Portfolio (no valuations):**
> "Add property valuations to track your portfolio performance.
> [Go to Properties →]"

**Contracts (no properties/tenants):**
> "You'll need a property and tenant before creating a contract.
> [Add Property →]  [Add Tenant →]"

### 5.5 — Contextual Quick Actions

**Property Detail page:**
- Add "Create Contract" button next to vacant units
- Clicking pre-selects the property + unit in contract form

**Tenant Detail page:**
- Add "New Contract" button that pre-selects the tenant

**Dashboard overdue alert:**
- Add inline "Mark Paid" button per payment (expand to method/ref form)

**After any creation:**
- Toast with "Add another [entity]?" link
- Contract creation → "View payment schedule →" link in toast

### 5.6 — Simplified Navigation

**Phase approach — show items progressively:**

```
ALWAYS VISIBLE:
  Home (Dashboard)
  Properties
  Tenants
  Contracts
  Payments

SHOW AFTER FIRST CONTRACT:
  Deposits
  Expenses

SHOW UNDER "MORE" OR SETTINGS:
  Portfolio
  Reports
  Templates
  Market Data
  Cash Flow
  Audit Log
  Reminders
  Settings
```

**Mobile dock:** Reduce to 5 items: Home, Properties, Contracts, Payments, More (opens drawer)

### 5.7 — Settings & Profile Page

Create `/settings` page with tabs:

| Tab | Contents |
|-----|----------|
| **Profile** | Name, email, change password |
| **Preferences** | Default currency, date format, timezone |
| **Integrations** | Google Calendar, DLD API, Webhooks (move from CalendarSettings) |
| **Reminders** | Reminder rules (move from ReminderSettings) |
| **Data** | Export all data, import data, reset demo data |

### 5.8 — Inline Contract Creation (Quick Add)

Add a floating "+" button or quick-add modal accessible from any page:

**Quick Contract flow (modal):**
1. Select existing property+unit OR type new property name (auto-create)
2. Select existing tenant OR type name+phone (auto-create)
3. Set rent, frequency, dates
4. Preview → Create

This eliminates the 3-page bouncing (Properties → Tenants → Contracts).

### 5.9 — AI Upload as Primary CTA

The AI upload is the fastest path to value but it's secondary in the UI.

**Changes:**
- Make "Upload Contract" the PRIMARY button on Dashboard empty state
- Add drag-and-drop zone on Dashboard: "Drop a contract PDF to get started"
- Show AI upload option in onboarding wizard as the "fast track"
- After AI extraction, show a summary card: "We found: 1 tenant, 1 property, 1 unit, 12 payments — Create all?"

### 5.10 — Progress Indicators on Dashboard

Once data exists, show meaningful progress:

```
┌─ Collection Rate ─────────┐  ┌─ Occupancy ────────────────┐
│  ████████████░░░  78%     │  │  ██████████████░  92%       │
│  9 of 12 payments         │  │  11 of 12 units occupied    │
└───────────────────────────┘  └─────────────────────────────┘
```

Replace raw numbers with visual progress bars and contextual labels.

---

## 6. Stage 1 Priority Order

| Priority | Enhancement | Effort | Impact |
|----------|------------|--------|--------|
| **P0** | Toast notifications (sonner) | Small | Immediate — fixes biggest UX gap |
| **P0** | Smart empty states with CTAs | Small | Eliminates dead ends |
| **P1** | Getting Started checklist on Dashboard | Medium | Guides first-time users |
| **P1** | Onboarding wizard (first login) | Medium | First impression |
| **P1** | Contextual quick actions (create contract from property/tenant) | Medium | Reduces friction |
| **P2** | Quick-add contract modal | Medium | Eliminates page bouncing |
| **P2** | AI upload as primary CTA | Small | Surfaces fastest path |
| **P2** | Settings & profile page | Medium | Expected feature |
| **P3** | Progressive navigation | Medium | Reduces overwhelm |
| **P3** | Dashboard progress indicators | Small | Better engagement |

---

## 7. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Steps to first contract | 7-8 (manual) or 3 (AI) | 3 (manual) or 2 (AI) |
| Time to first value | ~10 min | < 3 min |
| Empty state dead ends | 6+ pages | 0 |
| Actions with no feedback | All CRUD | 0 |
| Pages visible to new user | 15 sidebar items | 5-7 relevant items |

---

## 8. Out of Scope (Stage 2)

- Security hardening (RBAC, rate limiting, CSRF)
- i18n / Arabic / RTL
- Dark mode
- Pagination
- E2E testing
- CI/CD pipeline
- Email notifications
- Multi-tenant data isolation
