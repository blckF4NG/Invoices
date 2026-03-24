# Invoice Manager — Railway + SQLite Deployment Instructions for Antigravity

## Context

This is a full-stack invoice generator app:
- **Frontend:** React (Vite) + Tailwind CSS — lives in `/client`
- **Backend:** Node.js + Express — lives in `/server`
- **Database:** SQLite via Prisma ORM (`/server/prisma/dev.db`)
- **Auth:** JWT in HttpOnly cookies, single user: `adminJ` / `MYpassword`
- **File uploads:** Company logos and signatures stored in `/server/uploads/`

**Deployment target:** Railway (single service, SQLite on persistent volume at `/app/data/`)

**Goal:** One user, any device, anywhere. All new data (invoices, parties, autocomplete history) persists permanently on Railway's disk.

---

## TASK 1 — Fix All Hardcoded API URLs

**Problem:** Every `axios` call in the React client uses `http://localhost:3001/api/...`. In production on Railway, the frontend is served by the same Express server, so these must become relative paths like `/api/...`.

**Files to check and update:**
- `client/src/pages/GenerateInvoice.jsx`
- `client/src/pages/ManageCompanies.jsx`
- `client/src/pages/Login.jsx`
- `client/src/pages/InvoiceHistory.jsx`
- `client/src/components/AutocompleteInput.jsx`
- `client/src/components/CompanyModal.jsx`
- Any other file using `axios` or `fetch` with `localhost:3001`

**What to do:**
1. Search all client source files for `http://localhost:3001`
2. Replace every occurrence with an empty string (i.e., `http://localhost:3001/api/companies` → `/api/companies`)
3. Also fix any image `src` URLs like `http://localhost:3001${company.logoImagePath}` → use a helper that returns the right base URL depending on environment, OR simply use `/` as the base in production

**Recommended approach — create a central API base URL utility:**

Create `client/src/utils/api.js`:
```js
import axios from 'axios';

const api = axios.create({
  baseURL: '',  // relative — works both locally and on Railway
  withCredentials: true,
});

export default api;
```

Then replace all `axios.get('http://localhost:3001/api/...')` with `api.get('/api/...')` across all files.

---

## TASK 2 — Serve React Build from Express in Production

**Problem:** In production, Railway runs only the Express server. The React app must be served as static files by Express from the `client/dist` folder.

**File to update:** `server/index.js`

**What to add** (after all `app.use(...)` route registrations, before `app.listen`):

```js
const path = require('path');

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  // Catch-all: serve index.html for any non-API route
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}
```

Make sure this comes **after** all `/api/*` routes so API routes take priority.

---

## TASK 3 — Update CORS for Production

**File to update:** `server/index.js`

**Problem:** CORS is currently hardcoded to `http://localhost:5173`. In production, the frontend is served by the same origin (same Railway server), so CORS must allow the production domain too.

**What to do:**

```js
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || true  // allow same-origin in production
    : 'http://localhost:5173',
  credentials: true
}));
```

---

## TASK 4 — Update Database Path for Railway Volume

**Problem:** The database URL is `file:./dev.db` which stores the file relative to the server directory. On Railway with a persistent volume mounted at `/app/data/`, the file must be stored there so it survives redeploys.

**File to update:** `server/.env` — but this is set via Railway environment variables, so no code change is needed. Just make sure the Prisma client reads from `DATABASE_URL` env var (it already does via `schema.prisma`).

**Verify** `server/prisma/schema.prisma` has:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```
This is already correct. No changes needed here.

---

## TASK 5 — Update Uploads Path to Use Environment Variable

**Problem:** The uploads directory path may be hardcoded in the companies route or multer config. It must point to `/app/data/uploads` on Railway.

**Files to check:** `server/routes/companies.js`, any multer configuration

**What to do:**
- Make sure multer uses `process.env.UPLOAD_DIR || './uploads'` as the destination
- Make sure the uploads directory is created on startup if it doesn't exist

Add to `server/index.js` startup (before `app.listen`):
```js
const fs = require('fs');
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
```

Also update the static file serving for uploads:
```js
// Current:
app.use('/uploads', express.static('uploads'));

// Change to:
app.use('/uploads', express.static(process.env.UPLOAD_DIR || path.join(__dirname, 'uploads')));
```

---

## TASK 6 — Add Company Logo & Signature Upload (multer)

**This feature is currently missing.** The database has `logoImagePath` and `signatureImagePath` fields but there is no file upload endpoint.

**What to build:**

### 6A — Install multer
```bash
cd server && npm install multer
```

### 6B — Create upload middleware in `server/middleware/upload.js`:
```js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

module.exports = upload;
```

### 6C — Add upload routes to `server/routes/companies.js`:

Add a `POST /api/companies/:id/upload-logo` and `POST /api/companies/:id/upload-signature` endpoint that:
1. Uses `upload.single('file')` multer middleware
2. Saves the file path to the company record in the DB
3. Returns the updated company

The path saved to the DB should be `/uploads/filename.jpg` (the URL path, not the filesystem path).

### 6D — Update `CompanyModal.jsx` in the client:

The Add/Edit Company form must include:
- A file input for **Company Logo** with preview
- A file input for **Signature Image** with preview
- On form submit, if files were selected, first upload them via the upload endpoint, get back the paths, then include those paths in the company create/update payload

---

## TASK 7 — Build Invoice History Page

**File:** `client/src/pages/InvoiceHistory.jsx` (currently an empty stub)

**What to build:**
- On mount, fetch `GET /api/invoices` (already exists in backend, returns last 50 invoices)
- Display as a styled table with columns: Invoice No, Date, Company Name, Buyer Name, Total Amount, Status (draft/final)
- Each row has a **View** button and a **Download PDF** button
- The View button opens the `InvoicePreview` modal, reconstructing invoice data from the saved record
- The Download PDF button calls the existing `/api/export/pdf` endpoint

**Backend note:** The `GET /api/invoices` endpoint returns `lineItemsJSON` as a string — parse it with `JSON.parse()` on the client before passing to the preview component.

---

## TASK 8 — Build Settings / Manage Saved Data Page

**File:** `client/src/pages/Settings.jsx` (currently an empty stub)

**What to build:**
- Three tabs: **Saved Parties**, **Saved Field Values**, **Saved Items**
- Each tab fetches from the existing history endpoints and lists all saved entries
- Each entry has a **Delete** button
- Add `DELETE /api/history/party/:id`, `DELETE /api/history/field/:id`, `DELETE /api/history/item/:id` routes in `server/routes/history.js`

---

## TASK 9 — Add Toast Notifications (replace all alert() calls)

**What to do:**
1. `cd client && npm install react-hot-toast`
2. Add `<Toaster />` to `client/src/App.jsx` or `DashboardLayout.jsx`
3. Search all `.jsx` files for `alert(` and replace with appropriate toast calls:
   - `alert('...')` → `toast.success('...')` or `toast.error('...')`
   - `alert('Failed...')` → `toast.error('...')`

---

## TASK 10 — Add Loading States to Export Buttons

**File:** `client/src/pages/GenerateInvoice.jsx`

**What to do:**
- Add `const [pdfLoading, setPdfLoading] = useState(false)` and `const [wordLoading, setWordLoading] = useState(false)`
- Wrap the PDF export handler: set `setPdfLoading(true)` before the axios call, `setPdfLoading(false)` in finally block
- Same for Word export
- On the buttons: `disabled={pdfLoading}` and show a spinner SVG or "Generating..." text while loading

---

## TASK 11 — Create .gitignore

Create `d:\invoiceGenerator\.gitignore`:
```
node_modules/
client/dist/
client/node_modules/
server/node_modules/
server/prisma/dev.db
server/prisma/dev.db-shm
server/prisma/dev.db-wal
server/uploads/
.env
*.pem
.DS_Store
```

---

## TASK 12 — Create Railway Configuration File

Create `d:\invoiceGenerator\railway.toml`:
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node server/index.js"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

Create `d:\invoiceGenerator\nixpacks.toml`:
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "chromium"]

[phases.build]
cmds = [
  "cd client && npm install && npm run build",
  "cd server && npm install && npx prisma generate"
]

[start]
cmd = "cd server && node index.js"
```

> Note: Chromium is needed because Puppeteer (used for PDF generation) requires a browser. Railway must have it installed.

---

## TASK 13 — Fix Puppeteer for Railway (Linux)

**Problem:** Puppeteer on Railway (Linux) needs special launch args. The current `puppeteer.launch({ headless: 'new' })` will fail.

**File:** `server/routes/export.js`

**What to change:**
```js
// Change this:
const browser = await puppeteer.launch({ headless: 'new' });

// To this:
const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu'
  ],
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
});
```

Also add to `server/.env` (and Railway environment variables):
```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/run/current-system/sw/bin/chromium
```

---

## TASK 14 — Rebuild Word (.docx) Export to Full Table Format

**File:** `server/routes/export.js` — the `/word` route

**Problem:** Currently the Word export is a stub that only outputs 3 plain text lines. It must produce a fully formatted invoice table matching the PDF layout.

**What to build using the `docx` npm package:**
- Full document with proper A4 page size and 15mm margins
- Company name as bold heading
- Invoice header table (2-column: company info | invoice meta)
- Consignee / Buyer table
- Line items table with all columns (S.No, Description, HSN, GST%, Qty, Rate, Amount)
- Tax summary rows (IGST or CGST + SGST)
- Total row
- Amount in words paragraph
- HSN/SAC summary table
- Bank details section
- Declaration text
- "For [Company Name]" and "Authorised Signatory" footer

Use `BorderStyle.SINGLE` for all table cell borders. Use `WidthType.PERCENTAGE` for column widths.

---

## Verification Checklist (after all tasks are done)

Run these checks before deploying:

```bash
# 1. Build the React frontend — must complete with no errors
cd d:\invoiceGenerator\client
npm run build

# 2. Start the server and verify it serves the React app
cd d:\invoiceGenerator\server
set NODE_ENV=production
node index.js
# Open http://localhost:3001 in browser
# — Should show the login page (React app), not an API response

# 3. Verify login works
# Login with adminJ / MYpassword — should redirect to dashboard

# 4. Verify API routes still work
# In browser: http://localhost:3001/api/health → should return {"status":"ok"}

# 5. Verify no localhost:3001 hardcoded URLs remain
grep -r "localhost:3001" d:\invoiceGenerator\client\src
# Should return nothing

# 6. Test PDF and Word export — both should download files

# 7. Test company logo upload — should save and display the logo
```

---

## Railway Environment Variables (set these in Railway dashboard)

```
NODE_ENV=production
PORT=3001
DATABASE_URL=file:/app/data/dev.db
JWT_SECRET=<generate a random 64-char string>
UPLOAD_DIR=/app/data/uploads
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/run/current-system/sw/bin/chromium
FRONTEND_URL=https://your-app-name.up.railway.app
```

---

## Railway Volume Setup (do this in Railway dashboard)

- Go to your service → **Volumes** tab → **Add Volume**
- Mount path: `/app/data`
- This single volume stores BOTH the SQLite database AND uploaded files
- Data persists across all redeploys and server restarts

---

## After First Deploy — Run Seed

In Railway dashboard → your service → **Deploy** tab → open terminal:
```bash
cd server && node prisma/seed.js
```

This creates the `adminJ` user and the 3 pre-seeded companies.
