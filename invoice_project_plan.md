# Invoice Generator — Project Plan & Deployment Guide

## Current State Assessment

Your app is **~80% complete**. Here's where things stand:

| Area | Status | Notes |
|---|---|---|
| Auth (login, JWT, cookies) | ✅ Done | adminJ / MYpassword |
| Dashboard layout + Sidebar | ✅ Done | |
| Generate Invoice (Steps 1–6) | ✅ Done | GST calc, autocomplete, preview |
| PDF Export (Puppeteer) | ✅ Done | Functional |
| Manage Companies (CRUD) | ✅ Partial | Cards exist; logo/signature upload not wired |
| Word Export (.docx) | ⚠️ Stub | Generates file but is NOT properly formatted |
| Invoice History page | ⚠️ Stub | Empty placeholder only |
| Settings page | ⚠️ Stub | Empty placeholder only |
| Company logo/signature upload | ❌ Missing | File upload endpoint not built |
| Save Draft fully working | ✅ Done | Saves to DB |

---

## Step-by-Step: What to Build Next (in order)

### Phase 1 — Fix & Complete Core Features

#### Step 1.1 — Company Logo & Signature Upload
- Build a `POST /api/companies/upload` route using `multer` middleware
- Wire the `CompanyModal.jsx` form to send `multipart/form-data`
- Store files in `/server/uploads/` and save path to DB
- Display preview of uploaded logo/signature in the form

> Ask Antigravity: *"Add company logo and signature image upload to the Manage Companies page using multer"*

#### Step 1.2 — Full Word (.docx) Export
- The current Word export is a stub — it only outputs plain text
- Rebuild `routes/export.js` `/word` endpoint using the `docx` package's `Table`, `TableRow`, `TableCell` to recreate the full invoice layout
- Match the same layout as the PDF preview

> Ask Antigravity: *"Rebuild the Word export endpoint in export.js to produce a fully formatted invoice table matching the PDF output using the docx package"*

#### Step 1.3 — Invoice History Page
- The `/invoice/history` route exists but shows nothing
- Build the `InvoiceHistory.jsx` page: fetch from `GET /api/invoices`, display as a table
- Include: Invoice No, Date, Company, Buyer, Total, Status, Download PDF button
- Add click-to-view detail (open preview modal with saved data)

> Ask Antigravity: *"Build the Invoice History page showing all saved invoices with details and a re-download PDF button"*

#### Step 1.4 — Settings / Manage Saved Data
- The `/settings` route is an empty stub
- Build a page that lists all saved autocomplete data (parties, field values, items)
- Allow user to delete individual saved entries via `DELETE /api/history/:type/:id`

> Ask Antigravity: *"Build the Settings page to list and delete saved autocomplete data (parties, field values, items)"*

---

### Phase 2 — Polish & Quality

#### Step 2.1 — Replace `alert()` with Toast Notifications
- Install `react-hot-toast` or `sonner` in the client
- Replace all `alert(...)` and `alert('Failed...')` calls with toast messages

#### Step 2.2 — Loading States / Spinners
- Add spinner state on PDF/Word export buttons (disable button + show spinner while generating)
- Prevents double-clicks and shows user something is happening

#### Step 2.3 — Invoice Number Auto-Increment Suggestion
- On company select, auto-suggest next invoice number by querying last invoice for that company from DB

#### Step 2.4 — Delete Company confirmation modal
- Currently `ManageCompanies.jsx` likely uses `window.confirm()` — replace with an inline confirmation modal

---

## Online Database — Migration Plan

Your app currently uses **SQLite** (a local file `server/prisma/dev.db`). To move online you have two options:

### Option A — Keep SQLite but Deploy to a VPS (Recommended for Personal Use)
If this app is only for YOU (single user, personal invoice manager), the **simplest path** is to deploy the full app on a VPS (Virtual Private Server) and keep SQLite — it's fast, no extra cost, and zero DB service to manage.

→ See **Deployment Section** below (Railway or Render with persistent disk).

### Option B — Migrate to a Cloud Database (Recommended for Team/Multi-user)

> [!NOTE]
> Only do this if you need multiple people to use the app from different machines, OR if your hosting provider doesn't support persistent storage.

#### Best options ranked:

| Service | Free Tier | Prisma Support | SQLite migration ease |
|---|---|---|---|
| **Turso** (LibSQL) | ✅ Generous free tier | ✅ Native | ⭐⭐⭐ Easiest — stays SQLite syntax |
| **PlanetScale** | ❌ No longer free | ✅ Yes | ⭐⭐ MySQL dialect change needed |
| **Supabase** | ✅ Good free tier | ✅ Yes | ⭐⭐ PostgreSQL dialect change needed |
| **Railway (PostgreSQL)** | ✅ $5 credit | ✅ Yes | ⭐⭐ PostgreSQL dialect change needed |

#### Steps to migrate to Turso (Recommended cloud path):
```bash
# 1. Install Turso CLI
winget install turso

# 2. Login & create a database
turso auth login
turso db create invoice-manager

# 3. Get the connection URL
turso db show invoice-manager --url
turso db tokens create invoice-manager
```

Then update `schema.prisma`:
```diff
datasource db {
-  provider = "sqlite"
-  url      = env("DATABASE_URL")
+  provider = "sqlite"
+  url      = env("DATABASE_URL")
+  directUrl = env("DATABASE_AUTH_TOKEN")
}
```
And use the `@prisma/adapter-libsql` adapter. Ask Antigravity to help with this migration.

> Ask Antigravity: *"Migrate the Prisma database from local SQLite to Turso LibSQL for cloud hosting"*

---

## Deployment Guide

### Architecture Overview

```
User Browser
     │
     ▼
[Frontend — React/Vite]    ←── hosted on Vercel (free)
     │ API calls (HTTPS)
     ▼
[Backend — Express + SQLite] ←── hosted on Railway or Render
     │
     ▼
[File Storage — /uploads]   ←── same server (persistent disk)
```

---

### Option 1 — Railway (RECOMMENDED — Easiest Full-Stack)

Railway can host BOTH your Node.js backend AND serve the built React frontend — all in one place, with a **persistent disk** for SQLite and uploads.

#### Step-by-step:

**1. Prepare the project for Railway**

Create a `Procfile` (or add a start script) at root level:
```
# d:\invoiceGenerator\Procfile
web: cd server && node index.js
```

Update `server/index.js` to also serve the built client:
```js
// Add after app.use('/uploads', ...)
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

Update `client/src/pages/*.jsx` — change all hardcoded `http://localhost:3001` API URLs to relative paths (e.g., `/api/companies`). This is important for production. Ask Antigravity to do this automatically.

> Ask Antigravity: *"Replace all hardcoded localhost:3001 API URLs in the React client with relative paths for production deployment"*

**2. Build the client**
```bash
cd d:\invoiceGenerator\client
npm run build
```
This creates `client/dist/` which the server will serve.

**3. Deploy to Railway**

Go to [railway.app](https://railway.app) → Login with GitHub → New Project → Deploy from GitHub repo

OR use Railway CLI:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inside your project folder
cd d:\invoiceGenerator
railway init
railway up
```

**4. Set Environment Variables on Railway**

In Railway dashboard → your service → Variables tab:
```
PORT=3001
JWT_SECRET=your_strong_secret_key_here_generate_a_long_random_one
DATABASE_URL=file:/app/data/dev.db
UPLOAD_DIR=/app/data/uploads
```

**5. Add a Persistent Volume on Railway**

Go to Railway → your service → Volumes → Add Volume
- Mount path: `/app/data`
- This ensures your SQLite database and uploads survive restarts

**6. Run the seed after first deploy**
```bash
railway run npx prisma db push
railway run node server/prisma/seed.js
```

**7. Get your public URL**
Railway gives you a `.railway.app` URL automatically (e.g., `invoice-manager.up.railway.app`).

**Estimated cost:** ~$5/month with free $5 monthly credit (essentially free for small apps).

---

### Option 2 — Render (Free but has limitations)

Render has a **free tier** for web services but it **spins down after 15 min of inactivity** (cold starts).

**Steps:**
1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New Web Service → Connect GitHub
3. Build command: `cd client && npm install && npm run build && cd ../server && npm install && npx prisma generate`
4. Start command: `node server/index.js`
5. Add environment variables (same as Railway above)
6. Add a Render **Disk** ($1/month) for SQLite persistence

> [!WARNING]
> Render's free tier has no persistent disk. Your SQLite DB will be **wiped on every deploy**. You NEED a paid disk ($1/month) to keep data.

---

### Option 3 — Separate Frontend + Backend (Most Scalable)

- **Frontend:** Deploy `client/` to **Vercel** (completely free, fastest CDN)
- **Backend:** Deploy `server/` to **Railway or Render**
- Update CORS in `server/index.js` to allow your Vercel domain
- Update all API URLs in the React client to point to your Railway backend URL

---

## Summary of Commands to Run (in order)

```bash
# Step 1: Build React frontend (run from client folder)
cd d:\invoiceGenerator\client
npm run build

# Step 2: Test the full build locally (from server folder)
cd d:\invoiceGenerator\server
node index.js
# Visit http://localhost:3001 — should serve the React app

# Step 3: Install Railway CLI (run once)
npm install -g @railway/cli

# Step 4: Deploy
cd d:\invoiceGenerator
railway login
railway init
railway up

# Step 5: Seed the database on Railway
railway run node server/prisma/seed.js
```

---

## Quick Summary: Priority Order

| Priority | Task | Effort |
|---|---|---|
| 🔴 High | Replace localhost API URLs with relative paths | 30 min (Antigravity) |
| 🔴 High | Wire company logo/signature upload | 1 hour (Antigravity) |
| 🟡 Medium | Rebuild Word export to full table format | 2 hours (Antigravity) |
| 🟡 Medium | Build Invoice History page | 1 hour (Antigravity) |
| 🟡 Medium | Build Settings / Manage Saved Data page | 1 hour (Antigravity) |
| 🟢 Low | Toast notifications + loading spinners | 30 min (Antigravity) |
| 🟢 Low | Invoice number auto-suggest | 30 min (Antigravity) |
| ⬛ Deploy | Deploy to Railway with persistent SQLite | 1 hour (manual steps above) |
| ⬛ Optional | Migrate DB to Turso for cloud DB | 2 hours (Antigravity) |
