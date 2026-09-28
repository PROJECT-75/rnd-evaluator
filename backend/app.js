/**
 * app.js — the Express app (all API routes), with NO app.listen().
 * - Local dev & Render:  backend/server.js imports this, adds the static site, and listens.
 * - Vercel:             api/index.js exports this as a serverless function.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const evaluateRoute = require('./routes/evaluate');
const proposalsRoute = require('./routes/proposals');
const extractRoute = require('./routes/extract');
const store = require('./db/store');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' })); // proposals can be long documents

// Health check — also tells the frontend the upload limit for this host
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    ai: Boolean(process.env.GEMINI_API_KEY),
    storage: store.kind,
    maxUploadMb: extractRoute.MAX_UPLOAD_MB,
    host: process.env.VERCEL ? 'vercel' : process.env.RENDER ? 'render' : 'local'
  });
});

app.use('/api', evaluateRoute);
app.use('/api', proposalsRoute);
app.use('/api', extractRoute);

// Unknown API route → JSON 404 (not the HTML page)
app.use('/api', (req, res) => res.status(404).json({ error: `No API route for ${req.method} ${req.originalUrl}` }));

// Last-resort error handler so one bad request never leaves the function in a broken state
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

module.exports = app;
