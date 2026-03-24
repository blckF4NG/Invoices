# Invoice Generator Web Application — Antigravity Build Spec

## Project Overview

Build a full-stack, single-user web application for generating GST-compliant invoices across multiple companies. The user logs in, selects a company, fills in invoice details using dropdowns (with saved history) and editable fields, previews the invoice, and downloads it as PDF or Word (.docx). All data persists in a local database (SQLite via Prisma or similar).

---

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** SQLite with Prisma ORM
- **PDF Generation:** `puppeteer` or `html-pdf-node`
- **Word Generation:** `docx` npm package
- **Auth:** JWT stored in HttpOnly cookie, bcrypt for password hashing
- **File Storage:** Local `/uploads` folder for company logos

---

## Authentication

### Login Page
- Clean centered card UI with app title "Invoice Manager" at the top
- Fields: **Username**, **Password**
- Single hardcoded admin account:
  - Username: `adminJ`
  - Password: `MYpassword` (store bcrypt-hashed in DB seed)
- On success → redirect to Dashboard
- On failure → show inline error: "Invalid username or password"
- No registration page needed
- JWT token valid for 24 hours; refresh on activity
- Protect all routes with auth middleware — redirect unauthenticated users to `/login`

---

## Dashboard Layout (Post Login)

### Sidebar (left, fixed)
- App logo / title: **Invoice Manager**
- Navigation links:
  - 🧾 **Generate Invoice** (default landing)
  - 🏢 **Manage Companies**
  - 📂 **Invoice History** (future-ready stub page)
  - 🚪 **Logout**

### Top Bar
- Shows currently selected company name
- Company switcher dropdown (quick switch between companies)
- User avatar / name: "adminJ"

---

## Company Management (`/companies`)

### Company List Page
- Shows all companies as cards with:
  - Company logo (thumbnail)
  - Company name
  - GST number
  - Location / State
  - **Edit** button
  - **Delete** button (with confirmation modal: "Are you sure you want to delete [Company Name]?")
- **+ Add New Company** button (top right)

### Add / Edit Company Form
Fields (all required unless noted):
| Field | Type | Notes |
|---|---|---|
| Company Name | Text input | e.g. "SSD Aviation Techno Pvt. Ltd." |
| Full Address | Textarea | Multi-line |
| State Code | Text input | e.g. "06" |
| GSTIN | Text input | 15-char GST number |
| PAN (optional) | Text input | |
| Signatory Authority Name | Text input | Name that appears above signature |
| Signature Image | File upload | PNG/JPG, shown on invoice |
| Company Logo | File upload | PNG/JPG, shown top-left of invoice |
| Bank Name | Text input | |
| Bank Account Number | Text input | |
| IFSC Code | Text input | |

### Pre-seeded Companies (seed in DB on first run)

**Company 1 — SSD Aviation Techno Pvt. Ltd.**
- Address: Plot No 49, Kami Road, Asadpur Nandnaur, Kami-Ganur Road Sonipat, Haryana - 131027
- State Code: 06
- GSTIN: 06ABOCS1545E1ZC
- Bank: HDFC Bank | A/c: 50200104459853 | IFSC: HDFC0007876
- Logo: `/assets/ssd_logo.jpg` (embedded from uploaded file)

**Company 2 — FAB Aviation (Location 1)**
- Address: [User to fill — leave placeholder "Enter address for FAB Aviation Location 1"]
- State Code: [User to fill]
- GSTIN: [User to fill]
- Logo: `/assets/fab_aviation_logo.png` (embedded from uploaded file)

**Company 3 — FAB Aviation (Location 2)**
- Address: [User to fill — leave placeholder "Enter address for FAB Aviation Location 2"]
- State Code: [User to fill]
- GSTIN: [User to fill]
- Logo: `/assets/fab_aviation_logo.png` (same logo as Company 2)

---

## Generate Invoice Page (`/invoice/new`)

### Step 1 — Select Company
- Dropdown: "Select Company" → lists all companies from DB
- On selection, auto-fills the **From** section of the invoice header with saved company data

### Step 2 — Invoice Header Fields
All fields below are editable. Previously used values for each field are saved and shown as a **dropdown with history** (user can pick from past entries or type a new one).

| Field | Input Type | Saved History |
|---|---|---|
| Invoice Number | Text + auto-increment suggestion | Yes |
| Invoice Date | Date picker (default: today) | No |
| Delivery Note | Text | Yes |
| eWay Bill No. | Text | Yes |
| Dispatch From | Text dropdown | Yes |
| Dispatched Through | Text dropdown | Yes |
| Destination / Place of Supply | Text dropdown | Yes |
| Terms of Delivery | Text dropdown | Yes ("100% Against Delivery", etc.) |
| Buyer's Order No. | Text | Yes |
| Order Dated | Date picker | No |

### Step 3 — Consignee & Buyer Details
Two separate sections: **Consignee (Ship to)** and **Buyer (Bill to)** with a checkbox: ☑ "Same as Consignee" (auto-copies data).

For each party:
| Field | Input Type | Saved History |
|---|---|---|
| Company / Party Name | Text dropdown | Yes |
| Full Address | Textarea dropdown | Yes |
| State Code | Text dropdown | Yes |
| GST Number | Text dropdown | Yes |

Saved history works as an **autocomplete dropdown** — as user types, matching past entries appear. Selecting one fills all related fields for that party simultaneously.

### Step 4 — Line Items Table
A dynamic table for goods/services:

| Column | Type | Notes |
|---|---|---|
| S. No. | Auto | Read-only |
| Description of Goods | Text dropdown | Saved history of past item names |
| HSN Code | Text dropdown | Saved per description |
| GST Rate (%) | Dropdown | Options: 0%, 5%, 12%, 18%, 28% |
| Quantity | Number | |
| Unit | Dropdown | Nos., Kg, Pcs, Set, etc. |
| Rate (₹) | Number | |
| Amount (₹) | Auto-calculated | Rate × Quantity |

- **+ Add Row** button below table
- **🗑 Delete** icon on each row
- Minimum 1 row

### Step 5 — GST Calculation (Auto)

Logic based on **whether seller and buyer states match**:

```
If Seller State Code == Buyer State Code:
  → CGST = Amount × (GST Rate / 2)
  → SGST = Amount × (GST Rate / 2)
  → IGST = 0

Else:
  → IGST = Amount × GST Rate
  → CGST = 0
  → SGST = 0
```

Display in invoice:
- Taxable Value subtotal
- CGST amount (if applicable)
- SGST amount (if applicable)
- IGST amount (if applicable)
- **Total = Taxable Value + Tax**
- **Amount in Words** — auto-generated Indian number format (e.g., "₹ Eighty Seven Thousand Three Hundred Twenty Only")

### Step 6 — HSN/SAC Summary Table (auto-generated)
| HSN/SAC | Taxable Value | CGST | SGST | IGST | Total Tax |
|---|---|---|---|---|---|
| Auto-grouped by HSN from line items above |

### Step 7 — Preview & Export
- **Preview Invoice** button → opens a full-page styled invoice preview in a modal or new tab
- **Download PDF** button → generates and downloads the invoice as `.pdf`
- **Download Word** button → generates and downloads the invoice as `.docx`
- **Save Draft** button → saves the invoice to DB without downloading

---

## Invoice Layout & Design Spec

Match the layout from the reference image exactly:

```
┌─────────────────────────────────────────────────────────────┐
│ [COMPANY LOGO]   Company Name                               │
│                  Full Address                    Invoice No │
│                  State Code | GSTIN              Invoice Date│
├─────────────────────────────────────────────────────────────┤
│ Consignee (Ship to)          │ Invoice No:                  │
│ Name, Address, State, GST    │ Invoice Date:                │
│                              │ Delivery Note:               │
│                              │ eWay Bill No.:               │
├──────────────────────────────┤──────────────────────────────┤
│ Buyer (Bill to)              │ Buyer's Order No:            │
│ Name, Address, State, GST    │ Order Dated:                 │
│                              │ Dispatch From:               │
│                              │ Dispatched Through:          │
│                              │ Destination/Place of Supply: │
│                              │ Terms of Delivery:           │
├────┬──────────────────┬──────┬──────┬──────┬───────┬────────┤
│S.No│ Description      │ HSN  │ GST% │ Qty  │ Rate  │ Amount │
├────┼──────────────────┼──────┼──────┼──────┼───────┼────────┤
│ 1  │ Item name        │ XXXX │  18% │  1   │74,000 │ 74,000 │
│    │        IGST/CGST/SGST                        │ 13,320 │
│    │                                    Total     │ 87,320 │
├────┴──────────────────┴──────┴──────┴──────┴───────┴────────┤
│ Amount in Words: ₹ Eighty Seven Thousand Three Hundred...   │
├──────────────────┬──────────────────┬────────────────────────┤
│ HSN/SAC          │ Taxable Value    │ Tax Amount             │
├──────────────────┴──────────────────┴────────────────────────┤
│ Bank: [Bank Name] | A/c: [Number] | IFSC: [Code]            │
│                                                              │
│ Declaration: We declare that this invoice shows the         │
│ actual price of goods described...                          │
│                                          For [Company Name] │
│                                          [Signature Image]  │
│                                          Authorised Signatory│
└─────────────────────────────────────────────────────────────┘
```

- Company logo: top-left corner, max height 80px
- Font: clean sans-serif (Arial or Inter)
- Border: solid black table borders throughout
- All monetary values: Indian comma format (₹ 74,000.00)

---

## Data Persistence Requirements

### Tables / Models

**users**
- id, username, passwordHash, createdAt

**companies**
- id, name, address, stateCode, gstin, pan, signatoryName, signatureImagePath, logoImagePath, bankName, bankAccount, ifscCode, createdAt, updatedAt

**saved_parties** (consignees / buyers history)
- id, partyName, address, stateCode, gstin, lastUsedAt

**saved_field_values** (generic history store)
- id, fieldName (e.g. "dispatchFrom", "termsOfDelivery"), value, lastUsedAt

**saved_items** (line item history)
- id, description, hsnCode, defaultGstRate, defaultRate, defaultUnit, lastUsedAt

**invoices**
- id, companyId, invoiceNumber, invoiceDate, consigneeId, buyerId, lineItemsJSON, taxType, subtotal, taxAmount, total, status (draft/final), createdAt

---

## Saved History / Autocomplete Behavior

- Every time a user types a new value in a history-enabled field and submits/saves the invoice, that value is upserted into the corresponding saved table.
- In the input field UI, show a dropdown below the field listing the top 5 most recently used values matching what the user has typed.
- If user selects a saved party name, all party fields (address, state code, GST) auto-fill from the saved record.
- User can clear individual saved entries from a "Manage Saved Data" settings sub-page (future-ready stub is fine).

---

## PDF Export Requirements

- Use `puppeteer` to render the invoice HTML template to PDF
- Paper size: A4, portrait
- Margins: 15mm all sides
- Include company logo image embedded as base64
- Include signature image embedded as base64
- File name format: `[CompanyShortName]_Invoice_[InvoiceNo]_[Date].pdf`

---

## Word Export Requirements

- Use the `docx` npm package
- Recreate the invoice layout as a Word table
- Embed company logo in top-left cell
- Embed signature image in footer section
- File name format: `[CompanyShortName]_Invoice_[InvoiceNo]_[Date].docx`

---

## UI / UX Guidelines

- **Color scheme:** White background, dark navy/charcoal text, blue accent (#1E40AF) for buttons and headers — professional and neutral
- **Font:** Inter or system sans-serif
- **Buttons:**
  - Primary action (blue filled): Generate Invoice, Download PDF, Save
  - Secondary (outlined): Add Row, Preview
  - Danger (red outlined): Delete Company, Remove Row
- **Responsive:** Desktop-first but functional on tablet
- **Loading states:** Show spinner on PDF/Word generation
- **Toast notifications:** Success/error toasts for save, export, login actions
- **No unnecessary modals** — inline editing preferred; use modals only for destructive confirmations

---

## File & Folder Structure

```
/invoice-app
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── GenerateInvoice.jsx
│   │   │   ├── ManageCompanies.jsx
│   │   │   └── InvoiceHistory.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── CompanyCard.jsx
│   │   │   ├── InvoiceForm.jsx
│   │   │   ├── LineItemsTable.jsx
│   │   │   ├── InvoicePreview.jsx
│   │   │   └── AutocompleteInput.jsx
│   │   └── utils/
│   │       ├── gstCalculator.js
│   │       └── numberToWords.js
├── server/                    # Express backend
│   ├── routes/
│   │   ├── auth.js
│   │   ├── companies.js
│   │   ├── invoices.js
│   │   ├── history.js
│   │   └── export.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── uploads/               # Company logos & signatures
├── .env
├── package.json
└── README.md
```

---

## Environment Variables (`.env`)

```
PORT=3001
JWT_SECRET=supersecretjwtkey_changethis
DATABASE_URL="file:./dev.db"
UPLOAD_DIR=./uploads
```

---

## Seed Data Instructions

Run `npx prisma db seed` on first launch. This should:
1. Create the `adminJ` user with bcrypt-hashed `MYpassword`
2. Insert Company 1 (SSD Aviation Techno Pvt. Ltd.) with full details
3. Insert Company 2 (FAB Aviation — Location 1) with placeholder address
4. Insert Company 3 (FAB Aviation — Location 2) with placeholder address
5. Copy logo files to `/uploads` folder

---

## Future-Ready Stubs (build empty pages, no logic needed now)

- `/invoice/history` — Invoice History page (list view, no detail needed)
- `/settings` — Manage saved autocomplete data (list + delete entries)
- Multi-user support hooks in DB schema (userId foreign key on invoices) even if only one user exists now

---

## Out of Scope (do not build)

- Email sending
- Payment integration
- Multi-language support
- Cloud storage for logos (local file system only)
- Any public-facing pages (entire app is behind login)