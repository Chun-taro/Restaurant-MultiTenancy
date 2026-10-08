# RestoSaaS — Multi-Tenant Restaurant SaaS Platform

A modern, production-grade **React + Express + Node.js + SQLite** multi-tenant restaurant platform built directly from `Restaurant_SaaS_Architecture_Proposal.docx`.

---

## 🌟 What's Included

1. **Clean Database (SQLite)**:
   - **Zero External Software**: Absolutely **no XAMPP, no Apache, and no MySQL server** required.
   - Self-contained file in `data/saas_platform.db` using Node.js 24's native `DatabaseSync` engine.
   - All old test tenant data removed; initialized with **0 fake restaurants** and only the master Super Admin user account.

2. **Public SaaS Landing Page**:
   - High-converting hero section with multi-tenancy concept overview:
     *"ONE PLATFORM → MANY RESTAURANTS → EACH WITH ITS OWN BRANDED EXPERIENCE"*
   - Interactive 3-layer architecture showcase (Super Admin, Restaurant Dashboard, Customer PWA).
   - Core capabilities: Subdomain routing, QR Table Ordering, Philippine Payment Gateways (Maya/GCash), White-label Branding.
   - Transparent SaaS Subscription Tier breakdown (Starter Cafe, Growth Bistro, Pro Restaurant, Enterprise Franchise) with Monthly/Annual pricing switcher.

3. **Multi-Tenant Database Isolation (Database-per-Tenant)**:
   - **Master Database**: `data/saas_platform.db` stores platform registry, tenant accounts, subscriptions, and system settings.
   - **Isolated Tenant Databases**: Each restaurant gets its own dedicated SQLite database in `data/tenants/tenant_<slug>.db`.
   - Complete physical data isolation: menu items, dining tables, customer orders, and customer records live in the tenant's own file.

4. **Multi-Tenant URL & Subdomain Routing**:
   - **Subdomain Routing**: `http://<subdomain>.localhost:5173` (e.g., `http://brandobar.localhost:5173` or `http://tokyoramen.localhost:5173`)
   - **Path Routing**: `http://localhost:5173/store/<slug>` (Customer QR Menu) and `http://localhost:5173/portal/<slug>` (Tenant Kitchen Portal)
   - Vite and Express automatically resolve the tenant context from the incoming hostname or path!

5. **Super Admin & Tenant Portals**:
   - **Super Admin Console**: Executive metrics, tenant provisioning, plan migrations, and billing ledger.
   - **Tenant Portal**: Live kitchen queue (Pending ➔ Preparing ➔ Ready ➔ Completed), menu management, table QR code generator, and branding settings.
   - **Customer Storefront**: Mobile-first digital menu, table/takeout checkout, Maya/GCash payments, and live order tracking.

---

## 🚀 Running Frontend and Backend

### Option A: Separate Terminals (Recommended for Development)

1. **Terminal 1 — Backend (API & SQLite Database)**:
   ```bash
   cd backend
   npm run dev
   ```
   *Runs at:* `http://localhost:3000`

2. **Terminal 2 — Frontend (React + Vite Hot Reload)**:
   ```bash
   cd frontend
   npm run dev
   ```
   *Runs at:* `http://localhost:5173` (proxies `/api` requests to port 3000)

---

### Option B: From the Project Root

- **Run Frontend**: `npm run dev` or `npm run dev:frontend`
- **Run Backend**: `npm run dev:backend` or `npm start`
- **Build Frontend**: `npm run build`

---

## 🔑 Login Credentials

- **URL**: `http://localhost:5173` (Dev) or `http://localhost:3000` (Production)
- **Super Admin Email**: `admin@restosaas.com`
- **Password**: `admin123`
*(Or click the **Auto-fill** button on the login screen)*
