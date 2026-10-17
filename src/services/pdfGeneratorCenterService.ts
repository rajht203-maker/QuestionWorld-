import { jsPDF } from 'jspdf';
import {
  ExtractedQuestion,
  PaperAcademicAnalysis,
  ProcessingPipelineJob,
  GeneratedPdfDocumentType
} from '../types/index.ts';

interface PdfGeneratorOptions {
  institutionName?: string;
  includeAnswerKey?: boolean;
  studentNameSpace?: boolean;
}

/**
 * Universal PDF Document Generation Center for QuestionWorld
 * Supports 8 professional CBSE Class 9/10 document formats
 */
export async function generateDocumentPdf(
  job: ProcessingPipelineJob,
  type: GeneratedPdfDocumentType,
  options: PdfGeneratorOptions = {}
): Promise<void> {
  const {
    institutionName = 'CENTRAL BOARD OF SECONDARY EDUCATION — MOCK PORTAL',
    includeAnswerKey = true,
    studentNameSpace = true,
  } = options;

  const questions = job.extractedQuestions || [];
  const analysis = job.analysis;

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

  const ensureSpace = (needed: number) => {
    if (currentY + needed > pageHeight - marginBottom) {
      doc.addPage();
      currentY = marginTop;
      doc.setDrawColor(220, 225, 230);
      doc.setLineWidth(0.2);
      doc.line(marginX, currentY, pageWidth - marginX, currentY);
      currentY += 5;
    }
  };

  // Header Helper
  const renderHeader = (title: string, subTitle: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(institutionName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(subTitle, pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;

    // Meta row
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Subject: ${job.subject} (${job.targetClass})`, marginX, currentY);
    doc.text(`Exam Type: ${job.examType}`, pageWidth / 2, currentY, { align: 'center' });
    doc.text(`Marks: ${analysis?.totalMarks || 80}`, pageWidth - marginX, currentY, { align: 'right' });
    currentY += 2;

    doc.setLineWidth(0.4);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 6;

    if (studentNameSpace) {
      ensureSpace(12);
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.rect(marginX, currentY, contentWidth, 9);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Roll No.: _____________________', marginX + 4, currentY + 6);
      doc.text('Student Name: _________________________________', marginX + 65, currentY + 6);
      doc.text('Date: ____________', marginX + 145, currentY + 6);
      currentY += 13;
    }
  };

  // --- GENERATE SPECIFIC DOCUMENT FORMAT ---
  if (type === 'question_bank' || type === 'original') {
    renderHeader(
      `${job.subject} — Clean Question Bank`,
      `Extracted from ${job.fileName} • ${questions.length} Questions`
    );

    questions.forEach((q, idx) => {
      ensureSpace(18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const qNum = `Q${idx + 1}. [${q.type}] [${q.marks} Mark${q.marks > 1 ? 's' : ''}]`;
      doc.text(qNum, marginX, currentY);
      currentY += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const qLines = doc.splitTextToSize(q.question, contentWidth - 4);
      ensureSpace(qLines.length * 4 + 4);
      doc.text(qLines, marginX + 2, currentY);
      currentY += qLines.length * 4 + 2;

      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, oIdx) => {
          const optLabel = `(${String.fromCharCode(65 + oIdx)}) ${opt}`;
          const optLines = doc.splitTextToSize(optLabel, contentWidth - 8);
          ensureSpace(optLines.length * 3.8 + 1);
          doc.text(optLines, marginX + 6, currentY);
          currentY += optLines.length * 3.8 + 1;
        });
      }

      currentY += 3;
    });
  } else if (type === 'qa_marking') {
    renderHeader(
      `${job.subject} — Questions with Step Marking Scheme`,
      `Verified Solutions & NCERT Marking Rubrics • ${questions.length} Items`
    );

    questions.forEach((q, idx) => {
      ensureSpace(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`Q${idx + 1}. ${q.question.substring(0, 100)}${q.question.length > 100 ? '...' : ''} [${q.marks}M]`, marginX, currentY);
      currentY += 4.5;

      // Model Answer
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105); // emerald 600
      doc.text('Model Answer / Solution:', marginX + 2, currentY);
      currentY += 4;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const ansLines = doc.splitTextToSize(q.correctAnswer, contentWidth - 6);
      ensureSpace(ansLines.length * 3.8 + 2);
      doc.text(ansLines, marginX + 4, currentY);
      currentY += ansLines.length * 3.8 + 2;

      // Step Marking
      if (q.stepMarking) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229); // indigo 600
        doc.text('Step Marking Rubric:', marginX + 2, currentY);
        currentY += 4;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const stepLines = doc.splitTextToSize(q.stepMarking, contentWidth - 6);
        ensureSpace(stepLines.length * 3.8 + 2);
        doc.text(stepLines, marginX + 4, currentY);
        currentY += stepLines.length * 3.8 + 2;
      }

      // Formula
      if (q.formula) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Key Formula: ${q.formula}`, marginX + 4, currentY);
        currentY += 4;
      }

      currentY += 4;
    });
  } else if (type === 'questions_only') {
    renderHeader(
      `${job.subject} — Student Practice Booklet`,
      `Questions with Ruled Student Response Space`
    );

    questions.forEach((q, idx) => {
      ensureSpace(35);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`Q${idx + 1}. [${q.type}] [${q.marks} Mark${q.marks > 1 ? 's' : ''}]`, marginX, currentY);
      currentY += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const qLines = doc.splitTextToSize(q.question, contentWidth - 4);
      ensureSpace(qLines.length * 4 + 2);
      doc.text(qLines, marginX + 2, currentY);
      currentY += qLines.length * 4 + 4;

      // Draw blank response lines for students
      const linesCount = q.marks >= 5 ? 6 : q.marks >= 3 ? 4 : 2;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      for (let l = 0; l < linesCount; l++) {
        ensureSpace(6);
        doc.line(marginX + 2, currentY, pageWidth - marginX, currentY);
        currentY += 6;
      }
      currentY += 3;
    });
  } else if (type === 'mcq_practice') {
    const mcqQuestions = questions.filter(q => q.type === 'MCQ' || q.type === 'Assertion-Reason' || (q.options && q.options.length > 0));
    renderHeader(
      `${job.subject} — MCQ & Assertion-Reason Practice Sheet`,
      `Timed MCQ Drill • ${mcqQuestions.length} Questions`
    );

    mcqQuestions.forEach((q, idx) => {
      ensureSpace(24);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(15, 23, 42);
      doc.text(`Q${idx + 1}. ${q.question}`, marginX, currentY);
      currentY += 4.5;

      if (q.options && q.options.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        q.options.forEach((opt, oIdx) => {
          ensureSpace(4);
          doc.text(`[   ]  (${String.fromCharCode(65 + oIdx)}) ${opt}`, marginX + 4, currentY);
          currentY += 4;
        });
      }
      currentY += 2;
    });

    // Answer Key Sheet at end
    if (includeAnswerKey) {
      doc.addPage();
      currentY = marginTop;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('MCQ PRACTICE ANSWER KEY & RATIONALE', pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;

      mcqQuestions.forEach((q, idx) => {
        ensureSpace(12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(79, 70, 229);
        const correctLabel = typeof q.correctOptionIndex === 'number' ? String.fromCharCode(65 + q.correctOptionIndex) : 'Ans';
        doc.text(`Q${idx + 1}: Option (${correctLabel}) — ${q.correctAnswer}`, marginX, currentY);
        currentY += 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const expLines = doc.splitTextToSize(q.explanation, contentWidth - 4);
        doc.text(expLines, marginX + 2, currentY);
        currentY += expLines.length * 3.5 + 3;
      });
    }
  } else if (type === 'chapter_revision') {
    renderHeader(
      `${job.subject} — Quick Chapter Revision Notes`,
      `Key Formulas, Definitions, and Core Learning Outcomes`
    );

    if (analysis?.importantFormulas && analysis.importantFormulas.length > 0) {
      ensureSpace(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(79, 70, 229);
      doc.text('Important Formulas & Equations:', marginX, currentY);
      currentY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      analysis.importantFormulas.forEach(formula => {
        ensureSpace(5);
        doc.text(`•  ${formula}`, marginX + 3, currentY);
        currentY += 4.5;
      });
      currentY += 4;
    }

    if (analysis?.keyDefinitions && analysis.keyDefinitions.length > 0) {
      ensureSpace(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(5, 150, 105);
      doc.text('Essential Definitions & Principles:', marginX, currentY);
      currentY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      analysis.keyDefinitions.forEach(def => {
        ensureSpace(5);
        doc.text(`•  ${def}`, marginX + 3, currentY);
        currentY += 4.5;
      });
      currentY += 4;
    }

    if (analysis?.identifiedKnowledgeGaps && analysis.identifiedKnowledgeGaps.length > 0) {
      ensureSpace(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(217, 119, 6);
      doc.text('Key Revision Areas & Knowledge Gaps:', marginX, currentY);
      currentY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      analysis.identifiedKnowledgeGaps.forEach(gap => {
        ensureSpace(5);
        doc.text(`•  ${gap}`, marginX + 3, currentY);
        currentY += 4.5;
      });
      currentY += 4;
    }
  } else if (type === 'analysis_report') {
    renderHeader(
      `${job.subject} — Detailed Academic Analysis Report`,
      `CBSE Curriculum Audit, Bloom's Taxonomy, and Blueprint Breakdown`
    );

    // Summary Box
    ensureSpace(25);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, currentY, contentWidth, 22, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Executive Document Summary:', marginX + 3, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const sumLines = doc.splitTextToSize(analysis?.summaryExecutive || 'Comprehensive analysis of uploaded paper.', contentWidth - 6);
    doc.text(sumLines, marginX + 3, currentY + 9);
    currentY += 26;

    // Metrics grid
    ensureSpace(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`Total Questions: ${analysis?.totalQuestions || questions.length}`, marginX, currentY);
    doc.text(`Total Marks: ${analysis?.totalMarks || 80}`, marginX + 50, currentY);
    doc.text(`Syllabus Alignment: ${analysis?.syllabusAlignmentScore || 95}%`, marginX + 100, currentY);
    doc.text(`Competency Questions: ${analysis?.competencyQuestionsCount || 0}`, marginX + 150, currentY);
    currentY += 7;

    // Chapter distribution table
    if (analysis?.chapterDistribution && analysis.chapterDistribution.length > 0) {
      ensureSpace(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('Chapter Marks Weightage Breakdown:', marginX, currentY);
      currentY += 4.5;

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      analysis.chapterDistribution.forEach(ch => {
        ensureSpace(4);
        doc.text(`• ${ch.chapter}: ${ch.count} Question(s) — ${ch.marks} Marks`, marginX + 3, currentY);
        currentY += 4;
      });
      currentY += 4;
    }

    // Question type distribution table
    if (analysis?.questionTypeDistribution && analysis.questionTypeDistribution.length > 0) {
      ensureSpace(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('Question Format Distribution:', marginX, currentY);
      currentY += 4.5;

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      analysis.questionTypeDistribution.forEach(qt => {
        ensureSpace(4);
        doc.text(`• ${qt.type}: ${qt.count} items (${qt.percentage}%)`, marginX + 3, currentY);
        currentY += 4;
      });
    }
  } else {
    // Default Mock Test PDF format
    renderHeader(
      `${job.subject} — Official CBSE Mock Examination`,
      `Board Standard Model Examination Booklet`
    );

    questions.forEach((q, idx) => {
      ensureSpace(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`Q${idx + 1}. [${q.type}] [${q.marks} Mark${q.marks > 1 ? 's' : ''}]`, marginX, currentY);
      currentY += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const qLines = doc.splitTextToSize(q.question, contentWidth - 4);
      ensureSpace(qLines.length * 4 + 2);
      doc.text(qLines, marginX + 2, currentY);
      currentY += qLines.length * 4 + 3;

      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, oIdx) => {
          ensureSpace(4);
          doc.text(`(${String.fromCharCode(65 + oIdx)}) ${opt}`, marginX + 6, currentY);
          currentY += 4;
        });
      }
      currentY += 2;
    });
  }

  // Running Footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(210, 215, 220);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(130, 140, 150);
    doc.text(`QuestionWorld AI Education System • ${job.subject} • ${type.toUpperCase()}`, marginX, pageHeight - 8);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
  }

  // Download PDF file
  const cleanSubject = job.subject.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `CBSE_${job.targetClass.replace(' ', '')}_${cleanSubject}_${type}.pdf`;
  doc.save(fileName);
}
