/**
 * documentParser.js
 * -----------------
 * Turns an uploaded proposal file (PDF, DOCX, or TXT) into plain text.
 * Uses pdf-parse v2 (PDFParse class) and mammoth for DOCX.
 */

const path = require('path');
const mammoth = require('mammoth');
const { PDFParse } = require('pdf-parse');

const SUPPORTED = ['.pdf', '.docx', '.txt'];

async function parseDocument(buffer, originalName) {
  const ext = path.extname(originalName || '').toLowerCase();

  if (!SUPPORTED.includes(ext)) {
    throw new Error(`Unsupported file type "${ext || 'unknown'}". Please upload a PDF, DOCX, or TXT file.`);
  }

  let text = '';

  if (ext === '.pdf') {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      text = result.text || '';
    } finally {
      await parser.destroy(); // free memory even if parsing fails
    }
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value || '';
  } else {
    text = buffer.toString('utf-8');
  }

  // pdf-parse v2 inserts page markers like "-- 1 of 3 --"; drop them
  text = text
    .replace(/^-- \d+ of \d+ --$/gm, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (text.length < 30) {
    throw new Error(
      'Could not extract readable text from this file. If it is a scanned PDF (images only), please upload a text-based PDF or paste the text instead.'
    );
  }
  return text;
}

module.exports = { parseDocument, SUPPORTED };
