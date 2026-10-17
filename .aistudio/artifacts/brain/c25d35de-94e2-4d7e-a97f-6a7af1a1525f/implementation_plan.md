# Implementation Plan: Test Paper PDF Verification QR Code & Digital Verification Portal

## 1. Executive Summary
This document outlines the architecture and execution steps for integrating an official verification QR code into the CBSE Class 10 Test Paper PDF generation engine (`TestBuilderPage` and `pdfExportService`), and building a dedicated **Digital Test Verification Portal** on the platform.

### User Requirements Addressed:
- **QR Code in PDF Header**: Placed in the top-right corner of the official examination booklet header with a "Scan to Verify" caption and paper reference code.
- **Dedicated Verification Portal**: Anyone scanning the QR code on a mobile device or browser is directed to an official verification view (`/?verify=<testId>`) displaying the verified digital paper.
- **Interactive Solutions Toggle**: The verification interface provides tabs to toggle between the **Question Paper** view and the **Complete Answer Key & Evaluator Marking Scheme**.

---

## 2. System Architecture & Flow

```
+-------------------------------------------------------------+
|                     TestBuilderPage                         |
|  - Generates CBSE Class 10 Mock Examination Paper           |
|  - Auto-registers paper in verifiedTests registry           |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                   pdfExportService.ts                       |
|  - Generates high-res QR code via `qrcode`                  |
|  - Embeds QR in top-right header (x: 168mm, y: 12mm)        |
|  - Adds "Scan to Verify" caption & paper ID code            |
|  - Downloads formatted PDF (Student Copy or Teacher Copy)   |
+------------------------------+------------------------------+
                               |
                     QR Code scanned by user
                               |
                               v
+-------------------------------------------------------------+
|              Dedicated Digital Verification View            |
|                   (TestVerificationPage.tsx)                |
|  - Reads ?verify=<testId> from URL query / hash             |
|  - Fetches authentic test from Firestore / Local Fallback   |
|  - Shows official CBSE Verification Seal & Exam Metadata    |
|  - Allows toggling Question Paper vs. Answer Key & Scheme   |
|  - One-click 'Download Verified PDF' & 'Take Online Test'   |
+-------------------------------------------------------------+
```

---

## 3. Detailed Implementation Steps

### Phase 1: Dependency & QR Code Infrastructure
1. **Install `qrcode` library**:
   - Install `qrcode` and its TypeScript definitions (`@types/qrcode`) using `install_applet_package`.
2. **QR Code Utility (`src/services/qrService.ts`)**:
   - Provide helper `generateVerificationQrCode(url: string): Promise<string>` to generate clean, high-contrast black/white PNG data URLs with minimal margin and high error correction level (`M` or `Q`).

### Phase 2: PDF Header QR Placement (`src/services/pdfExportService.ts`)
1. **Header Layout Adjustment**:
   - Adjust the CBSE header text to balance with the top-right QR code box:
     - Header text centered in main column (`x: 15mm` to `165mm`).
     - QR Box placed at `x: 168mm`, `y: 12mm`, `size: 24mm x 24mm`.
     - Elegant thin border around the QR container.
     - Text caption beneath QR: `"Scan to Verify"` (bold, 6.5pt) and `"ID: <testId-slug>"` (grey, 6pt).
2. **Dynamic Platform URL Construction**:
   - Formulate the canonical verification URL using `window.location.origin` (or dev/shared app URL fallback):
     `${window.location.origin}/?verify=${encodeURIComponent(testPaper.id)}`
3. **Multi-page & Options Support**:
   - QR code is stamped crisply on Page 1 header for both Student copies and Marking Scheme copies.

### Phase 3: Cloud & Offline Test Registry (`src/services/verificationService.ts`)
1. **Firestore Verification Collection**:
   - Collection `verifiedTests/{testId}` containing the complete sanitized `TestPaper` payload and metadata.
   - Update `firestore.rules` to allow public read (`allow read: if true;`) and create (`allow create: if true;`) on `/verifiedTests/{testId}` so any student/teacher can verify without authentication hurdles.
2. **Dual-Layer Fallback**:
   - Sync verified tests to `localStorage` under `cbse_verified_tests_registry` for instant zero-latency retrieval even in offline or local test scenarios.

### Phase 4: Dedicated Online Verification Page (`src/pages/TestVerificationPage.tsx`)
1. **Design & Verification Header**:
   - Authentic CBSE Digital Assessment Verification banner with green verified checkmark badge (`Official Examination Paper - Verified Authentic`).
   - Details: Paper Title, Subject, Standard (Class X), Total Marks, Time Duration, Date of Generation, and Cryptographic/Verification ID.
2. **Interactive Content Tabs**:
   - **Tab 1: Question Paper**: Clean student view showing Section A–E with questions, marks per section, and general instructions.
   - **Tab 2: Marking Scheme & Solutions**: Evaluator view showing model answers, step-by-step marking rubrics, and detailed explanations.
3. **Action Bar**:
   - **"Download Verified PDF"**: Re-download the official PDF directly from the verification screen.
   - **"Copy Verification Link"**: Easy sharing with teachers or parents.
   - **"Return to App"**: Smooth navigation back to the student dashboard or test builder.

### Phase 5: Routing & TestBuilderPage Integration
1. **URL Handling in `App.tsx`**:
   - Detect `?verify=<id>` in `window.location.search` or `#verify-<id>` on initial load and navigation.
   - When detected, render `TestVerificationPage` as the full-view destination, with an easy back button to return to regular app navigation.
2. **TestBuilderPage & TestPaperView Polish**:
   - When a test paper is generated, immediately register it in the verification service.
   - Add a "Copy Verification Link" button in `TestPaperView` alongside the "Download as PDF" dropdown.

---

## 4. Verification & Testing Checklist
- [ ] QR code renders sharply on generated A4 PDF without distorting header text or margins.
- [ ] Scanning QR code with camera or mobile opens `/?verify=<testId>`.
- [ ] Verification page displays complete exam details, sections, and questions.
- [ ] User can switch between Question Paper and Marking Scheme effortlessly.
- [ ] Works seamlessly whether logged in or as a guest visitor scanning the paper.
- [ ] Build & compilation verification with `lint_applet` and `compile_applet`.
