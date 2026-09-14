# RLABZ ERP — System Architecture & Design Specification (DESIGN.md)

---

## 1. Executive Summary & Design Philosophy

**RLABZ ERP** is an enterprise-grade university laboratory management and enterprise resource planning system. It coordinates research projects, student work logs, payroll, faculty supervision, coordinator workflows, client finances, certificates, audit trails, and GitHub repository tracking.

The entire system is architected around the **Modular Monolith** paradigm across both frontend and backend. This ensures:
- **Feature Isolation:** Individual developers/subteams can build and maintain vertical feature domains without merge conflicts or cross-module regression risks.
- **Zero-Dependency Core:** Features are plug-and-play via shared manifest contracts rather than tightly coupled direct references.
- **Single Design Language:** A unified, cohesive aesthetic (Emerald / Forest palette with modern typography and sleek elevation) runs consistently across all 10+ operational modules.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             RLABZ ERP PLATFORM                              │
├──────────────────────────────────────┬──────────────────────────────────────┤
│               FRONTEND               │               BACKEND                │
│    Vanilla JS (ES Modules) + Vite    │     PHP 8.1+ / Laravel 9 Modules     │
│        Custom SPA Micro-Router       │       `nwidart/laravel-modules`      │
│        Scoped CSS Token System       │          Eloquent ORM + RBAC         │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 2. Global Architecture & Architectural Patterns

### 2.1 The Modular Monolith Pattern

Both tiers are vertically sliced by business domains:

| Module Domain | Role / Function | Frontend Path | Backend Path |
| :--- | :--- | :--- | :--- |
| **Auth** | Authentication, JWT, RBAC & user context | `frontend/src/modules/auth/` | `backend/Modules/Auth/` |
| **Dashboard** | Executive overview & high-level KPI oversight | `frontend/src/modules/dashboard/` | `backend/Modules/Dashboard/` |
| **Coordinator** | Academic & operational workflow management | `frontend/src/modules/coordinator/` | `backend/Modules/Coordinator/` |
| **Faculty** | Faculty portal, sprints, tasks & grading | `frontend/src/modules/faculty/` | `backend/Modules/Faculty/` |
| **Finance** | Invoicing, client payments, student payroll | `frontend/src/modules/finance/` | `backend/Modules/Finance/` |
| **Student** | Student workspace, work logs, project view | `frontend/src/modules/student/` | `backend/Modules/Student/` |
| **Project / Client** | Client projects, deliverables, milestones | `frontend/src/modules/project/` | `backend/Modules/Project/` |
| **Communication** | Messages, announcements & chat | `frontend/src/modules/communication/` | `backend/Modules/Communication/` |
| **GitHub** | Repositories, commit tracking & integrations | `frontend/src/modules/github/` | `backend/Modules/Github/` |
| **Certificates** | Certificate generation, verification & reports | `frontend/src/modules/certificates/` | `backend/Modules/Certificates/` |
| **Audit Notifications**| Centralized event audit log & alerts | `frontend/src/modules/audit-notifications/`| `backend/Modules/Audit/` |

---

## 3. Frontend Architecture & Design System

### 3.1 Technology Stack & Choices
- **Engine:** Pure Vanilla JavaScript (ES2022+ Modules) bundled via **Vite**.
- **Styles:** Plain, custom-crafted CSS with CSS Custom Properties (Variables), zero heavy external CSS frameworks (no Tailwind/Bootstrap runtime overhead).
- **Tooling & Plugins:**
  - `sweetalert2` for rich animated dialogs and alerts.
  - `html2pdf.js` for client-side receipt, payroll, and certificate PDF rendering.
- **Rendering Architecture:** Custom Single Page Application (SPA) architecture using a lightweight, reactive Router and DOM Component Factories.

### 3.2 Design System Tokens (`main.css`)

All components consume standardized CSS custom properties defined in `:root`:

```css
:root {
  /* Typography */
  --font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  /* Primary Emerald Brand Palette */
  --primary: #059669;        /* Base Emerald */
  --primary-hover: #047857;  /* Dark Emerald */
  --primary-light: #ecfdf5;  /* Soft Emerald tint */
  --primary-accent: #10b981; /* Vibrant Mint */

  /* Neutrals & Backgrounds */
  --bg-main: #f8fafc;        /* Slate-50 page background */
  --bg-card: #ffffff;        /* Pure white panel background */
  --text-main: #0f172a;      /* Slate-900 primary text */
  --text-muted: #64748b;     /* Slate-500 secondary text */
  --text-light: #94a3b8;     /* Slate-400 placeholder text */
  --border-color: #e2e8f0;   /* Slate-200 border */

  /* Navigation Sidebar */
  --sidebar-bg: #064e3b;      /* Deep Forest Green */
  --sidebar-hover: #047857;   /* Medium Forest */
  --sidebar-active: #059669;  /* Emerald Active state */
  --sidebar-text: #e2e8f0;    /* Light Slate text */

  /* Status Colors */
  --danger: #ef4444;         /* Red-500 */
  --danger-light: #fef2f2;   /* Red-50 */
  --success: #10b981;        /* Emerald-500 */
  --warning: #f59e0b;        /* Amber-500 */
  --info: #0891b2;           /* Cyan-600 */

  /* Elevations & Radii */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 3.3 Visual Identity & Styling Philosophy

1. **Depth & Elevation:** Subtle borders (`1px solid var(--border-color)`) combined with layered box-shadows (`--shadow-sm` transitioning to `--shadow-md` on hover).
2. **Typography Hierarchy:**
   - **H1 / Page Titles:** `1.75rem` - `1.85rem`, font-weight `800`, letter-spacing `-0.025em`.
   - **Card Titles & Section Headers:** `1.0rem` - `1.25rem`, font-weight `700`.
   - **Labels / Badges:** `0.75rem` - `0.85rem`, uppercase, letter-spacing `0.04em` - `0.06em`, font-weight `600` or `700`.
   - **Numbers & KPI Counters:** `1.85rem` - `2.25rem`, font-weight `800`, tight letter-spacing.
3. **Color Coding for Financial & Operational Metrics:**
   - **Primary / Emerald (`#059669`):** Total revenue, confirmed balances, completed tasks.
   - **Teal / Cyan (`#0891b2`):** Total collected, bank disbursements, verified credentials.
   - **Indigo / Purple (`#6366f1` / `#a855f7`):** Total project expenses, allocations, student awards.
   - **Warning / Amber (`#f59e0b`):** Pending approvals, outstanding invoices, expiring certificates.
   - **Danger / Rose (`#ef4444`):** Overdue payments, critical alerts, failed runs.
4. **CSS Scoping Convention:**
   To guarantee zero style collisions, each module scopes its internal selectors using a unique class prefix:
   - Finance: `.fin-*` or `.finance-*`
   - Student Portal: `.student-*`
   - Coordinator: `.coordinator-*`
   - Faculty: `.fac-*` or `.faculty-*`
   - GitHub: `.gh-*` or `.github-*`

---

## 4. UI Components & Layout Anatomy

### 4.1 Shell Layout (`DashboardLayout.js`)

The primary layout provides a 2-column responsive workspace:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [RLABZ ERP] [ROLE] │ Topbar Title                           [Profile Pill]  │
├────────────────────┼────────────────────────────────────────────────────────┤
│ ❖ Dashboard        │                                                        │
│ ❖ Projects         │  #layout-outlet (Dynamic Page Container)               │
│ ❖ Finance          │  ┌──────────────────────────────────────────────────┐  │
│ ❖ Student Portal   │  │ Page Header & Back Navigation                    │  │
│ ❖ GitHub           │  ├──────────────────────────────────────────────────┤  │
│ ❖ Certificates     │  │ KPI Metric Cards Grid                            │  │
│                    │  ├──────────────────────────────────────────────────┤  │
│                    │  │ Tabbed Panels / Data Tables / Forms              │  │
│                    │  └──────────────────────────────────────────────────┘  │
│ [⇥ Logout]         │                                                        │
└────────────────────┴────────────────────────────────────────────────────────┘
```

- **Sidebar:** Fixed width (`260px`), deep forest green background, scrollable navigation items, active link indicator with emerald gradient and glow. Supports dual-portal dynamic rendering (switching to Student Portal navigation when in student context).
- **Topbar:** `68px` height with page title and interactive User Profile pill.
- **Profile Popover:** Hoverable/clickable user card displaying Name, Role Badge, Designation, Email, Department, Course, and Semester.
- **Main Outlet (`#layout-outlet`):** Scrollable container with customized slim scrollbars.

### 4.2 Standard Reusable Component Patterns

#### 1. Universal Back Navigation Button (`.btn-back-nav`)
```html
<button class="btn-back-nav" id="back-btn" title="Go back">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
  <span>Back to Overview</span>
</button>
```
*Behavior:* Floats cleanly with subtle hover animation (translates `-3px` left on hover, soft green tint).

#### 2. KPI Metric Strip & Cards (`.fin-kpi-card`, `.stat-card`)
- Rounded corners (`var(--radius-lg)`), semi-transparent gradient backgrounds.
- Background watermark circle decoration (`::after`).
- Interactive hover lift (`transform: translateY(-3px)`).

#### 3. Data Tables & Status Badges
- **Tables:** Full-width clean borders, subtle hover highlights on rows (`background: #f8fafc`), right-aligned numeric columns.
- **Pills / Badges (`.fin-badge`, `.badge`):** Soft background with solid text:
  - Active / Paid: `background: #ecfdf5; color: #059669;`
  - Pending / Warning: `background: #fffbeb; color: #d97706;`
  - Overdue / Danger: `background: #fef2f2; color: #dc2626;`

#### 4. Action Modals & Form Dialogs
- Backdrop overlay with blur effect (`backdrop-filter: blur(4px)`).
- Centered modal dialog with entrance animation (`popoverFade` / `fadeIn`).
- Clear distinction between primary submit buttons and secondary cancel buttons.

---

## 5. Frontend Routing & State Architecture

### 5.1 Dynamic Module Manifest (`module-manifest.js`)
All modules register themselves through the single manifest contract:

```javascript
export const modules = [
  {
    name: 'finance',
    path: '/finance',
    loadRoutes: () => import('@/modules/finance/routes.js'),
    sidebar: true,
    title: 'Finance & Payroll',
    icon: 'IconFinance',
    requiredPermissions: ['view-finance']
  },
  // ...other modules
];
```

### 5.2 Reactive Routing Engine (`VanillaRouter`)
- **HTML5 History API:** Intercepts internal link clicks, manages `popstate` events.
- **Dynamic Segment Support:** Matches routes with dynamic parameters (e.g. `/finance/projects/:id`).
- **Navigation Guards:** Executes authentication checks (`authGuard`) prior to mounting views.
- **Sub-Layout Preservation:** Re-renders only the `#layout-outlet` when navigating between routes that share `DashboardLayout`, eliminating layout thrashing and flicker.

### 5.3 Authentication Store (`AuthStore`)
- Manages state via an Observable / Pub-Sub pattern (`subscribe(listener)`, `notify()`).
- Persists session tokens and user metadata in `localStorage`.
- Includes automated fallback support for local mock sessions during offline development.

---

## 6. Backend Architecture & API Standards

### 6.1 Modular Structure (`nwidart/laravel-modules`)

Every backend module is self-contained with its own MVC structure:

```
backend/Modules/<ModuleName>/
├── Http/
│   └── Controllers/       # API Controllers
├── Models/                # Eloquent Models & business logic
├── Database/
│   └── Migrations/        # Ordered database schema definitions
├── Routes/
│   └── api.php            # Route endpoints
└── module.json            # Module manifest metadata
```

### 6.2 RESTful API Conventions

1. **Endpoint Slugs:** Lowercase hyphenated or slash-separated namespaces:
   - `GET    /api/finance/project-finances`
   - `GET    /api/finance/project-finances/{id}`
   - `POST   /api/finance/invoices`
   - `POST   /api/student/work-logs`
   - `GET    /api/coordinator/overview`
2. **Standard Response Structure:**
   ```json
   {
     "status": "success",
     "data": { ... },
     "message": "Resource retrieved successfully"
   }
   ```
3. **Error Response Structure:**
   ```json
   {
     "status": "error",
     "message": "Validation failed",
     "errors": {
       "amount": ["The amount field is required."]
     }
   }
   ```
4. **HTTP Status Code Usage:**
   - `200 OK` — Successful query / update
   - `201 Created` — Successful resource creation
   - `400 Bad Request` — Invalid input parameters
   - `401 Unauthorized` — Missing or invalid JWT token
   - `403 Forbidden` — Insufficient role permissions
   - `404 Not Found` — Resource missing
   - `422 Unprocessable Entity` — Validation failure
   - `500 Server Error` — Unhandled exception

### 6.3 Database Design & Eloquent Standards

1. **Naming Conventions:**
   - **Tables:** Plural `snake_case` (e.g., `student_payments`, `hosting_charges`, `ssl_renewal_history`).
   - **Primary Keys:** Auto-incrementing unsigned `id` (`BIGINT`).
   - **Foreign Keys:** Singular `model_id` (e.g., `project_finance_id`, `user_id`).
   - **Timestamps:** Standard `created_at` and `updated_at`.
   - **Currency & Money Fields:** `DECIMAL(10, 2)` or `DECIMAL(12, 2)` to avoid floating-point rounding errors.
2. **Cross-Module Relationships:**
   Eloquent models are referenced explicitly using their full namespace across modules:
   ```php
   // Inside Modules\Finance\Models\ProjectFinance.php
   use Modules\Project\Models\Project;
   
   public function project() {
       return $this->belongsTo(Project::class);
   }
   ```

---

## 7. Role-Based Access Control (RBAC) & Security Design

The system enforces 5 distinct roles with specialized viewports and permission boundaries:

| Role | Landing Route | Access Boundaries & Permissions |
| :--- | :--- | :--- |
| **Director** | `/dashboard` | Executive oversight across all modules, Read-Only Finance overview, Project Client supervision. |
| **Coordinator**| `/coordinator` | Full academic & team coordination, work log verifications, project assignments, reporting. |
| **Finance Head**| `/finance` | Complete billing, client invoicing, student stipend disbursements, faculty payments, hosting renewals. |
| **Faculty** | `/faculty` | Course supervision, sprint reviews, task assignments, project guidance. |
| **Student** | `/student` | Work log submissions, assigned project tasks, certificate downloads, profile tracking. |

### 7.1 Client & Server Security Strategy
- **Frontend Guard (`authGuard.js`):** Intercepts unauthorized navigation, checks `user.role` and `user.modules`, and redirects unauthorized requests back to the user's primary landing view.
- **Backend Middleware (`JwtMiddleware.php`):** Inspects the HTTP `Authorization: Bearer <token>` header on all protected endpoints, decoding user context before allowing controller execution.

---

## 8. Development & Extension Golden Rules

When contributing new features or modules to RLABZ ERP, team members must adhere to these non-negotiable guidelines:

1. **Isolation First:** Never edit code directly inside another module's directory (`frontend/src/modules/<other>` or `backend/Modules/<other>`) without explicit coordination.
2. **Register via Manifest:** New frontend modules must be registered inside `frontend/src/module-manifest.js`. The core router dynamically handles loading.
3. **Always Scope Styles:** Prefix all CSS classes with your module identifier (e.g., `.fin-*`, `.student-*`). Never add generic un-scoped class selectors like `.card` or `.header` inside module CSS files.
4. **Use Design Tokens:** Never hardcode random hex colors or fonts. Always use `var(--primary)`, `var(--bg-main)`, `var(--text-muted)`, and `var(--radius-md)`.
5. **No Direct DOM Mutations on Shared Shell:** Render all module views inside the provided container element returned by your view function.
6. **Immutable Migrations:** Never alter past migration files once deployed or run. Always write a new migration (`php artisan make:migration ...`) to add or alter columns.
7. **Consistent Formatters:** Format all currencies with the standard Indian Rupee formatter:
   ```javascript
   const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
   ```

---
*RLABZ ERP — Engineering & Design Specification Document*
