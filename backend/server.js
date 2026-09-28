/**
 * server.js — runs the app as a normal long-lived server (local dev and Render).
 * Serves the built React app from frontend/dist alongside the API.
 */
const path = require('path');
const express = require('express');
const app = require('./app');

const PORT = process.env.PORT || 3000;

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// Any non-API route → the React app
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) res.status(404).send('Frontend not built yet — run "npm run build", or use the Vite dev server on :5173.');
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 R&D Proposal Evaluator backend running at http://localhost:${PORT}`);
  console.log(`   API endpoints available at http://localhost:${PORT}/api\n`);
});
