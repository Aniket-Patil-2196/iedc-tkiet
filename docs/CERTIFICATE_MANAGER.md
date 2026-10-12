# Certificate Generation & Email Distribution System — IEDC TKIET

Comprehensive guide for the **Certificate Manager** module built for the Innovation and Entrepreneurship Development Cell (IEDC), Tatyasaheb Kore Institute of Engineering & Technology (TKIET).

---

## 1. Overview & Architecture

The Certificate Manager allows authorized IEDC administrators to:
1. **Upload single-page certificate templates** (Vector PDF, PNG, JPG/JPEG).
2. **Visually configure personalized fields** (Participant Name, Certificate ID, Event Name, Event Date, Certificate Type, Issue Date) on an interactive canvas with normalized coordinates, custom font sizes, alignments, and shrink-to-fit safeguards.
3. **Import participant spreadsheets** (`.xlsx`, `.xls`, `.csv`), auto-detect column mappings, validate emails against RFC standards, and review dry-run validation reports with explicit duplicate handling.
4. **Generate high-fidelity personalized PDF certificates in bulk** powered by `pdf-lib` without degrading image resolution.
5. **Store certificates privately** using MongoDB GridFS / protected private storage without exposing private documents to public static directories.
6. **Download certificates individually or as a bulk ZIP archive** with an accompanying audit manifest CSV.
7. **Preview and send sample test emails** before bulk dispatch.
8. **Automate rate-limited, resumable SMTP email distribution** attaching each participant's personalized PDF without exposing other participant email addresses.
9. **Retry failed email deliveries idempotently** without duplicating already sent certificates.
10. **Public Certificate Authenticity Verification** via `/api/certificates/verify/[certificateId]` preserving attendee privacy.

---

## 2. Environment Variables & Setup

Configure the following variables in your `.env.local` file:

```ini
# Database Connection (MongoDB Atlas or Local MongoDB)
MONGODB_URI=mongodb://localhost:27017/iedc_tkiet

# Admin Authentication Session Secret
SESSION_SECRET=your_secure_random_64_character_session_key

# Outgoing SMTP Configuration for Certificate Email Delivery
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=iedc@tkiet.ac.in
SMTP_PASSWORD=your_app_specific_password_or_smtp_password
SMTP_FROM="IEDC TKIET <iedc@tkiet.ac.in>"
CONTACT_RECEIVER_EMAIL=iedc@tkiet.ac.in

# Public Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Note on Local Development without SMTP:**
> If SMTP environment variables are not configured in local development, the system automatically simulates email dispatch honestly without throwing runtime errors or falsely claiming SMTP accepted the delivery.

---

## 3. Step-by-Step Administrator Workflow

### Step 1: Accessing the Dashboard
- Navigate to `/admin` and log in with your administrator credentials.
- Click on **Certificate Manager** in the admin sidebar navigation or visit `/admin/dashboard/certificates`.
- The dashboard displays real-time summary statistics (Total Batches, Total Participants, Generated PDFs, Sent Emails, Pending, and Failures) directly from the database.

### Step 2: Creating a New Certificate Batch
- Click **Create Certificate Batch** (`/admin/dashboard/certificates/new`).
- **Step 1 (Details):** Enter the Batch Name, associate with an existing event from the dropdown (or enter a title manually), event date, certificate type, and customize the email subject and body template.
  - Supported placeholders: `{{participantName}}`, `{{eventName}}`, `{{certificateId}}`, `{{certificateType}}`.
- **Step 2 (Template):** Upload your certificate file (`.pdf`, `.png`, `.jpg`). The system inspects page dimensions and orientation automatically. You can also pick a previously saved template layout.
- **Step 3 (Field Placement):**
  - Click on the interactive preview canvas to set the coordinate anchor for **Participant Name**, **Certificate ID**, **Event Name**, or **Event Date**.
  - Adjust font size, font family (Helvetica, Times, Courier), color, and alignment (Center, Left, Right).
  - Configure **Max Width (%)** and **Min Font Size** to enable automatic shrink-to-fit for long names.
  - Optionally check *"Save this layout for reuse"* to store the layout for future events.
- **Step 4 (Participant Spreadsheet):**
  - Upload an Excel (`.xlsx`, `.xls`) or `.csv` file.
  - The server auto-detects column names (`Candidate Name`, `Student Email`, etc.).
  - Select your worksheet if the file has multiple tabs.
  - Click **Validate Participant Rows** to view the dry-run validation report showing total rows, valid records, invalid rows (with exact line numbers), and duplicate emails.
- **Step 5 (Review):** Review the batch summary and click **Create Batch & Import Participants**.

### Step 3: Batch Management & Dispatch
Once created, you are redirected to the Batch Control Center (`/admin/dashboard/certificates/[batchId]`):
1. **Generate Certificates:** Click **Generate Certificates** to render individual PDFs. Live progress bars reflect real-time database state.
2. **Preview & Download:** Click the eye icon next to any participant to view the rendered PDF in an embedded viewer, or click the download icon to inspect the PDF.
3. **Send Test Email:** Click **Send Test Email**, enter your personal email address, and verify that the layout and PDF attachment arrive correctly.
4. **Start Email Distribution:** Click **Start Email Distribution** and confirm. The system dispatches personalized emails with attachments, tracking every delivery attempt.
5. **Idempotent Retry:** If any recipient fails due to transient SMTP errors, click **Retry Failed** to retry only the failed recipients without re-emailing participants who already received their certificate.
6. **Bulk Download (ZIP):** Click **Download All (ZIP + Manifest)** to download a ZIP archive containing all generated certificates and an audit `manifest.csv`.

---

## 4. Testing Locally with Sample Data

A fictional participant spreadsheet is provided in `sample_data/`:
- `sample_data/sample-participants.xlsx`
- `sample_data/sample-participants.csv`

### Running Automated Verification
Execute the test suites using Node / tsx:
```bash
# Run unit & engine tests (PDF engine, spreadsheet parser, email placeholders, sanitization)
npx tsx scripts/test-certificate-system.ts

# Run API & security integration tests
npx tsx scripts/test-certificate-api-e2e.ts

# Run production Next.js build
npm run build
```

---

## 5. Security Safeguards

- **Access Protection:** All certificate management APIs and routes require valid HMAC-SHA256 admin session authentication via HTTP-only cookies (`iedc_admin_session`).
- **Private Storage:** Certificate files and templates are stored via GridFS / protected storage and are never exposed in public directories.
- **Formula Injection Defense:** All exported CSV records prepend `'` to formula triggers (`=`, `+`, `-`, `@`) to prevent CSV injection attacks in Excel.
- **XSS Prevention:** Dynamic email variables are escaped when generating HTML emails.
- **Privacy-Preserving Verification:** The public verification endpoint (`/api/certificates/verify/[certificateId]`) only exposes certificate validity, event name, and participant name — participant email addresses and spreadsheets are never made public.
