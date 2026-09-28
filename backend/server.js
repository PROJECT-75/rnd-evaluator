require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const evaluateRoute = require('./routes/evaluate');
const proposalsRoute = require('./routes/proposals');
const extractRoute = require('./routes/extract');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' })); // proposals can be long documents

// Health check (used by the hosting platform to know the app is up)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, ai: Boolean(process.env.GEMINI_API_KEY) });
});

// API routes
app.use('/api', evaluateRoute);
app.use('/api', proposalsRoute);
app.use('/api', extractRoute);

// Serve the built React frontend (after `npm run build` in /frontend)
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// Catch-all: send index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 R&D Proposal Evaluator backend running at http://localhost:${PORT}`);
  console.log(`   API endpoints available at http://localhost:${PORT}/api\n`);
});
