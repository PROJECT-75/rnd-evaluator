const express = require('express');
const router = express.Router();
const store = require('../db/store');
const REFERENCE = require('../db/pastProposalsReference');

// GET /api/reference - the reference projects novelty is judged against (shown in the UI)
router.get('/reference', (req, res) => {
  res.json({
    total: REFERENCE.length,
    groups: Object.entries(REFERENCE.groups).map(([category, projects]) => ({ category, projects }))
  });
});

// GET /api/proposals - list all evaluated proposals, newest first
router.get('/proposals', (req, res) => {
  try {
    const rows = store.all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/proposals/:id - single proposal detail
router.get('/proposals/:id', (req, res) => {
  try {
    const row = store.get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Proposal not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/proposals/:id - remove a proposal (useful for cleaning up demo data)
router.delete('/proposals/:id', (req, res) => {
  try {
    store.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
