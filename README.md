# AcadSetu

APAAR-linked student records and admissions review, built as a local prototype for Smart India Hackathon.

AcadSetu brings student submissions, verification states, enrolment conflicts and intake checks into one workflow. An institution can upload records, investigate a flagged case and correct the underlying data. A student can contribute evidence and share selected details through a revocable verification reference.

This repository contains the working demo. Student data is synthetic, government integrations are simulated, and the role picker is not a real login system. Run it locally; do not use it with real student data or expose the API publicly.

## Run locally

Use Node.js 22.12 or newer and npm. No API keys or database setup are needed.

```sh
git clone https://github.com/ALainOP/AcadSetu.git
cd AcadSetu
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. The Express API runs on **http://127.0.0.1:3001**; its root URL is not a web page. Both processes start with `npm run dev`.

On the first run, the app creates `data/demo.json` from the seed fixtures. Changes persist in that file between restarts. The file is excluded from Git so each checkout starts with fresh demo data.

If port 5173 is already in use, stop the other copy of the development server before starting another one.

### Reset the demo

Stop the running app with Ctrl+C first, then run:

```sh
npm run seed
npm run dev
```

Resetting replaces saved records, case decisions, admissions, consent references and audit history. Clear the browser tab's session storage or open a fresh private window if it still displays an old verification reference.

## What you can try

| Area | Demo behaviour |
| --- | --- |
| Student records | Add and edit records, preview changes, inspect versions and view a dossier. |
| CSV import | See row and field errors, import valid rows and skip exact resubmissions. |
| Verification | Inspect identifier format, institution confirmation, official authentication, documents and review separately. Simulate an outage to show a pending result. |
| Conflict review | Compare duplicate candidates, identity mismatches, transfers, permitted concurrent study and uncertain matches. Inspect facts, rule versions and frozen evidence snapshots. |
| Cases | Add evidence, assign responsibility, request corrections, escalate and record reasoned decisions. Identity cases support appeals and require a linked record update before reconciliation. |
| Intake reconciliation | Compare active submissions with regular and supernumerary limits by institution, programme and session. Keep excess submissions visible and create a review case. |
| Admission commitment | Preview two candidates for one remaining seat, commit the first and see the second refused after capacity is checked again. |
| Consent and verification | Select shared fields and a recipient, create an expiring QR/reference, revoke it and check that access is blocked. Corrections supersede dependent references. |
| Administration | Inspect audit events, simulated connector status and predefined policy guidance with mock citations. |

Matching names alone never establishes a duplicate. Flags are candidates for human review, not findings of fraud or automatic penalties. The rules and policy sections used here are demonstration rules, not official eligibility decisions.

## A useful walkthrough

1. Choose **Institution** on the landing page. The overview separates identity, enrolment, documents and review instead of presenting one overall verification tick.
2. Open **Batch Import** and load the seeded demo CSV. It contains an exact resubmission, an invalid row and a new record. Commit the valid row, then load it again to see resubmission prevention.
3. Open **Validation**. Enable the external-service outage simulation: official authentication becomes pending, not passed or failed. Disable it to return to the simulated response.
4. Open **Duplicate Review**. Select a candidate, compare the source records and open its frozen snapshot. Continue into the case to add evidence. Use the Student and AICTE Officer views for their parts of the review.
5. Return to **Batch Import** and load **6 students / 5 seats demo**. After committing, open **Intake** and find MSR / MBA / 2027-28. All six regular submissions remain visible against five approved regular seats, with one excess and a review case.
6. To resolve that intake case, add evidence and a reasoned correction decision, then update a contributing record to reflect an evidence-supported change, such as a withdrawal. Reconciliation is only available once the counts meet the configured limits. Do not delete records just to make the numbers fit.
7. In the admission commitment section, create both last-seat previews before committing either. Commit one, then attempt the other.
8. Switch to **Student**, create a reference for selected fields and check it from **Verifier / Employer** with the matching recipient. Revoke that same reference from the Student view and try it again.
9. Finish with **Audit Trail**, **Integrations** and **Policy Copilot**. Auditor and Super Admin also open the compact admin panel.

The six-student CSV exercise and the admission commitment exercise serve different purposes. CSV submission reports existing enrolments; it does not allocate a seat or change the separate reservation counters.

## CSV files and intake rules

Three files are included in `public/`:

- [`template.csv`](public/template.csv): the current import columns.
- [`demo-import.csv`](public/demo-import.csv): a small validation and resubmission example.
- [`intake-six-students.csv`](public/intake-six-students.csv): six active regular enrolments for the five-seat intake scenario.

Use the template headers exactly. Dates use `YYYY-MM-DD`; academic sessions use `YYYY-YY`, such as `2027-28`. APAAR identifiers are synthetic 12-digit strings. Spreadsheet software can change date formats or display identifiers in scientific notation, so check the saved CSV before uploading.

The importer requires institution student ID, academic session, admission date, NRI status, OCI status, Foreign National status, nationality, seat type and enrolment status alongside the basic student fields. The status values are `Yes` or `No`; seat type is `regular` or `supernumerary`; enrolment status is `active`, `withdrawn`, `transferred` or `cancelled`.

NRI, OCI and Foreign National status are independent of seat type. They do not automatically grant a supernumerary seat. Intake limits live in the institution/programme/session configuration, not on each student record. Unresolved duplicate candidates remain in the counts, and groups without a configuration are shown as not assessed.

## How it is built

```text
React interface -> Express API -> local JSON data file
```

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router and Lucide icons.
- **Backend:** Node.js, Express and TypeScript, run with tsx. Zod validates submissions and csv-parse reads CSV files.
- **Sharing:** Node.js crypto generates reference tokens; qrcode renders their QR codes. The server checks scope, recipient, expiry, revocation and record version on verification requests.
- **Storage:** one JSON file, loaded at startup and written after changes. No database server or background worker is required.

```text
src/App.tsx             Landing page, dashboard and role navigation
src/pages/              Record, review, intake and admin screens
src/widgets/Consent.tsx  Student sharing controls
src/shared.tsx          API helpers and dossier display
src/style.css           Interface styles
server/index.ts         Express entry point
server/steps/           Feature routes and demo rules
server/store.ts         Persistence and audit helpers
server/seed.ts          Synthetic records and intake configuration
public/                 CSV templates and examples
```

`npm run build` bundles the frontend into `dist/`. It does not package the API, run a full TypeScript type check or constitute a production deployment.

## Current limits

This is a single-machine demonstration, not a production student registry:

- The role picker and request headers are not secure authentication or production institution isolation. Recipient matching is not employer identity verification.
- APAAR/ABC, DigiLocker/NAD and AICTE responses are local fixtures. Connector environment labels do not enable live access.
- Evidence stores file names and notes, not authenticated documents. There is no OCR or live AI model; policy answers are predefined and cite mock sections.
- Audit history is stored in editable JSON and is not tamper-proof. Capacity checks run in one local API process; distributed concurrency has not been implemented.
- Dossiers can be downloaded as text. Regulatory reports and certificate printing are not implemented; the Reports navigation item is inactive.
- QR references point to the local application. Scanning from a different device does not make that device's localhost reach the running server.

The college names are used for illustration and do not imply affiliation or endorsement. Production work would need authenticated users, enforced institutional access boundaries, approved integrations, durable storage and broader security and load validation.
