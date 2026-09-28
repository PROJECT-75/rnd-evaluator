const express = require('express');
const multer = require('multer');
const router = express.Router();
const { parseDocument } = require('../services/documentParser');
const { extractProposalFields } = require('../services/llmService');
const { extractFieldsLocally } = require('../services/fieldExtractor');

// Keep uploads in memory (nothing written to disk). Vercel caps request bodies at
// 4.5 MB, so the limit is 4 MB there and 10 MB elsewhere (override with MAX_UPLOAD_MB).
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB) || (process.env.VERCEL ? 4 : 10);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 } });

// POST /api/extract  (multipart/form-data, field name: "file")
// Reads the document, asks the LLM to pull out title / institution / budget / duration,
// and returns them so the frontend can pre-fill the form. The user reviews before evaluating.
router.post('/extract', (req, res) => {
  upload.single('file')(req, res, async (uploadErr) => {
    if (uploadErr) {
      const tooBig = uploadErr.code === 'LIMIT_FILE_SIZE';
      return res.status(tooBig ? 413 : 400).json({ error: tooBig ? `File is larger than ${MAX_UPLOAD_MB} MB` : uploadErr.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const text = await parseDocument(req.file.buffer, req.file.originalname);

      // Rule-based reader always runs (instant, no API). Gemini then fills in or
      // corrects fields; if Gemini is down, the rule-based values are used alone.
      const local = extractFieldsLocally(text);
      let fields = local;
      let source = 'backup';
      let warning = null;
      try {
        const ai = await extractProposalFields(text);
        fields = {
          title: ai.title ?? local.title,
          proposer: ai.proposer ?? local.proposer,
          budget_lakhs: ai.budget_lakhs ?? local.budget_lakhs,
          duration_months: ai.duration_months ?? local.duration_months
        };
        source = 'ai';
      } catch (llmErr) {
        warning = `AI auto-fill unavailable (${llmErr.message}) — used the built-in backup reader instead.`;
      }

      res.json({
        text: text.slice(0, 50000), // full text for the textarea (capped)
        truncated: text.length > 50000,
        fields,
        source,
        warning
      });
    } catch (err) {
      console.error('Extraction error:', err);
      res.status(400).json({ error: err.message });
    }
  });
});

module.exports = router;
module.exports.MAX_UPLOAD_MB = MAX_UPLOAD_MB;
