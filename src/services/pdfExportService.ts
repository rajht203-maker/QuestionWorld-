import { jsPDF } from 'jspdf';
import { TestPaper } from '../types';
import { generateQrCodeDataUrl } from './qrService';
import { registerVerifiedTest } from './verificationService';

interface GeneratePdfOptions {
  includeAnswers?: boolean;
  verificationUrl?: string;
}

export async function generateTestPaperPdf(
  testPaper: TestPaper,
  options: GeneratePdfOptions = {}
): Promise<void> {
  const { includeAnswers = false } = options;

  // Obtain or register canonical verification URL
  let verificationUrl = options.verificationUrl;
  if (!verificationUrl) {
    try {
      verificationUrl = await registerVerifiedTest(testPaper);
    } catch (e) {
      console.warn('Verification registration fallback:', e);
      verificationUrl = typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(testPaper.id)}`
        : `https://cbse-mock.internal/?verify=${testPaper.id}`;
    }
  }

  // Pre-generate QR code PNG data URL
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await generateQrCodeDataUrl(verificationUrl);
  } catch (err) {
    console.warn('Could not generate QR code data URL:', err);
  }

  // Create A4 PDF document in portrait orientation (units: mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const marginTop = 16;
  const marginBottom = 18;
  const contentWidth = pageWidth - marginX * 2; // 178 mm

  let currentY = marginTop;

  // Helper: Check space and add page if needed
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      currentY = marginTop;
      // Small running top rule on continuation pages
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(marginX, currentY, pageWidth - marginX, currentY);
      currentY += 5;
    }
  };

  // --- 1. TOP-RIGHT VERIFICATION QR CODE BLOCK ---
  const qrBoxX = 166;
  const qrBoxY = 12;
  const qrBoxWidth = 28;
  const qrBoxHeight = 33;

  if (qrDataUrl) {
    // Elegant frame around QR code
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrBoxX, qrBoxY, qrBoxWidth, qrBoxHeight, 1.5, 1.5, 'FD');

    // Stamped QR Code Image
    const qrImgSize = 21;
    const qrImgX = qrBoxX + (qrBoxWidth - qrImgSize) / 2;
    doc.addImage(qrDataUrl, 'PNG', qrImgX, qrBoxY + 2, qrImgSize, qrImgSize);

    // Caption: "SCAN TO VERIFY"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('SCAN TO VERIFY', qrBoxX + qrBoxWidth / 2, qrBoxY + 25.5, { align: 'center' });

    // Paper Code Identifier
    const shortCode = (testPaper.id || 'TEST').replace(/[^a-zA-Z0-9]/g, '').slice(-7).toUpperCase();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`CODE: ${shortCode}`, qrBoxX + qrBoxWidth / 2, qrBoxY + 29, { align: 'center' });

    // Clickable link annotation in PDF
    doc.link(qrBoxX, qrBoxY, qrBoxWidth, qrBoxHeight, { url: verificationUrl });
  }

  // --- 2. CBSE OFFICIAL EXAMINATION HEADER TEXT ---
  // The header text is centered in the available width next to the QR box (from marginX to qrBoxX - 2)
  const headerCenterX = marginX + (qrBoxX - marginX) / 2;
  const headerAvailableWidth = qrBoxX - marginX - 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text('CENTRAL BOARD OF SECONDARY EDUCATION, DELHI', headerCenterX, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('SECONDARY SCHOOL EXAMINATION (CLASS X) — PRACTICE MOCK TEST', headerCenterX, currentY, { align: 'center' });
  currentY += 6;

  // Subject and Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  const examTitle = (testPaper.title || `${testPaper.subject.toUpperCase()} EXAMINATION`).toUpperCase();
  const examTitleLines = doc.splitTextToSize(examTitle, headerAvailableWidth);
  doc.text(examTitleLines, headerCenterX, currentY, { align: 'center' });
  currentY += examTitleLines.length * 5;

  // Syllabus / Chapters summary if available
  if (testPaper.chapters && testPaper.chapters.length > 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(90, 90, 90);
    const syllabusText = `Syllabus Units: ${testPaper.chapters.join(', ')}`;
    const syllabusLines = doc.splitTextToSize(syllabusText, headerAvailableWidth);
    doc.text(syllabusLines, headerCenterX, currentY, { align: 'center' });
    currentY += syllabusLines.length * 3.5 + 2;
  }

  // Ensure currentY is below the QR box before candidate info box
  currentY = Math.max(currentY, qrBoxY + qrBoxHeight + 4);

  // --- 3. CANDIDATE IDENTIFICATION BOX ---
  ensureSpace(16);
  doc.setDrawColor(50, 50, 50);
  doc.setLineWidth(0.4);
  doc.rect(marginX, currentY, contentWidth, 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Roll No.:', marginX + 3, currentY + 7);

  // Blank roll number boxes (8 digits)
  let boxX = marginX + 18;
  doc.setLineWidth(0.2);
  doc.setDrawColor(120, 120, 120);
  for (let i = 0; i < 8; i++) {
    doc.rect(boxX, currentY + 2.5, 4.5, 6);
    boxX += 5.2;
  }

  doc.text('Candidate Name:', marginX + 66, currentY + 7);
  doc.setDrawColor(140, 140, 140);
  doc.line(marginX + 92, currentY + 8, marginX + 172, currentY + 8);
  currentY += 15;

  // --- 3. TIME AND MAXIMUM MARKS META BAR ---
  ensureSpace(9);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Time Allowed: ${testPaper.timeLimit || 180} Minutes`, marginX, currentY);
  doc.text(`Maximum Marks: ${testPaper.totalMarks || 80}`, pageWidth - marginX, currentY, { align: 'right' });
  currentY += 2;

  doc.setLineWidth(0.6);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 6;

  // --- 4. GENERAL INSTRUCTIONS ---
  if (testPaper.generalInstructions && testPaper.generalInstructions.length > 0) {
    ensureSpace(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('General Instructions:', marginX, currentY);
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);

    testPaper.generalInstructions.forEach((instruction, idx) => {
      const cleanInst = `${idx + 1}. ${instruction}`;
      const lines = doc.splitTextToSize(cleanInst, contentWidth - 4);
      ensureSpace(lines.length * 3.5 + 1.5);
      doc.text(lines, marginX + 2, currentY);
      currentY += lines.length * 3.5 + 1;
    });

    currentY += 4;
  }

  // Running Question Counter across sections (CBSE standard 1, 2, 3...)
  let globalQuestionNumber = 1;

  // --- 5. SECTIONS & QUESTIONS ---
  testPaper.sections.forEach(section => {
    // Section Header
    ensureSpace(16);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(section.name.toUpperCase(), marginX, currentY);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.text(`[${section.marksPerQuestion} Mark${section.marksPerQuestion > 1 ? 's' : ''} each]`, pageWidth - marginX, currentY, { align: 'right' });
    currentY += 2;

    doc.setLineWidth(0.3);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 4;

    if (section.instructions) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const secInstLines = doc.splitTextToSize(section.instructions, contentWidth);
      ensureSpace(secInstLines.length * 3.5 + 2);
      doc.text(secInstLines, marginX, currentY);
      currentY += secInstLines.length * 3.5 + 2;
    }

    // Render questions in section
    section.questions.forEach(q => {
      const qNumStr = `Q${globalQuestionNumber}.`;
      const qMarksStr = `[${q.marks || section.marksPerQuestion}]`;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(0, 0, 0);

      const qNumWidth = doc.getTextWidth(qNumStr) + 2;
      const availableTextWidth = contentWidth - qNumWidth - 14;

      doc.setFont('helvetica', 'normal');
      const questionLines = doc.splitTextToSize(q.question, availableTextWidth);
      const estHeight = questionLines.length * 4 + 4 + (q.options ? q.options.length * 4.5 : 0);

      ensureSpace(estHeight);

      // Print Question Number
      doc.setFont('helvetica', 'bold');
      doc.text(qNumStr, marginX, currentY);

      // Print Question Text
      doc.setFont('helvetica', 'normal');
      doc.text(questionLines, marginX + qNumWidth, currentY);

      // Print Marks Bracket right-aligned
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(qMarksStr, pageWidth - marginX, currentY, { align: 'right' });

      currentY += questionLines.length * 4 + 1.5;

      // MCQ Options if present
      if (q.options && q.options.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.2);

        // Check if options are short enough for 2-column layout
        const maxOptLength = Math.max(...q.options.map(opt => opt.length));
        if (maxOptLength < 32 && q.options.length === 4) {
          // 2-column layout
          const col1X = marginX + qNumWidth + 2;
          const col2X = marginX + qNumWidth + (contentWidth - qNumWidth) / 2 + 2;

          ensureSpace(12);
          doc.text(`(A) ${q.options[0]}`, col1X, currentY);
          doc.text(`(B) ${q.options[1]}`, col2X, currentY);
          currentY += 4.5;
          doc.text(`(C) ${q.options[2]}`, col1X, currentY);
          doc.text(`(D) ${q.options[3]}`, col2X, currentY);
          currentY += 5.5;
        } else {
          // 1-column stacked layout
          q.options.forEach((opt, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            const optText = `(${letter}) ${opt}`;
            const optLines = doc.splitTextToSize(optText, contentWidth - qNumWidth - 4);
            ensureSpace(optLines.length * 3.8 + 1);
            doc.text(optLines, marginX + qNumWidth + 2, currentY);
            currentY += optLines.length * 3.8 + 1;
          });
          currentY += 2;
        }
      }

      currentY += 2.5;
      globalQuestionNumber++;
    });

    currentY += 3;
  });

  // --- 6. OPTIONAL OFFICIAL MARKING SCHEME & MODEL ANSWERS ---
  if (includeAnswers) {
    // Force a fresh page for the confidential marking scheme
    doc.addPage();
    currentY = marginTop;

    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(1);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(67, 56, 202);
    doc.text('CONFIDENTIAL — CBSE EVALUATOR MARKING SCHEME', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text('Step-by-Step Marking Rubric, Key Formulas & Model Solutions', pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.4);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 6;

    let ansIndex = 1;
    testPaper.sections.forEach(section => {
      section.questions.forEach(q => {
        ensureSpace(24);

        // Box container for each solution
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);

        const headerTitle = `${section.name} — Question ${ansIndex} [${q.marks || section.marksPerQuestion} Mark(s)]`;
        doc.text(headerTitle, marginX, currentY);
        currentY += 4;

        // Model Answer
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(5, 150, 105);
        doc.text('Model Answer:', marginX + 2, currentY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        const ansLines = doc.splitTextToSize(q.answer || 'Refer to textbook model answer', contentWidth - 30);
        doc.text(ansLines, marginX + 25, currentY);
        currentY += ansLines.length * 3.8 + 2;

        // Step Marking / Explanation
        if (q.explanation) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(79, 70, 229);
          doc.text('Step Marking:', marginX + 2, currentY);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          const expLines = doc.splitTextToSize(q.explanation, contentWidth - 30);
          ensureSpace(expLines.length * 3.8 + 4);
          doc.text(expLines, marginX + 25, currentY);
          currentY += expLines.length * 3.8 + 4;
        }

        currentY += 3;
        ansIndex++;
      });
    });
  }

  // --- 7. RUNNING FOOTERS & PAGE NUMBERS (APPLIED TO ALL PAGES) ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom hairline separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    // Left exam integrity text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(`CBSE Class 10 Mock Examination • ${testPaper.subject}`, marginX, pageHeight - 8);

    // Right Page Number
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
  }

  // Generate clean filename
  const cleanSubject = testPaper.subject.replace(/[^a-zA-Z0-9]/g, '_');
  const typeTag = includeAnswers ? 'Question_Paper_With_Marking_Scheme' : 'Student_Question_Paper';
  const fileName = `CBSE_Class10_${cleanSubject}_${typeTag}.pdf`;

  // Save to browser
  doc.save(fileName);
}
