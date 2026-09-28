// Vercel serverless entry point: every /api/* request is routed here (see vercel.json),
// and the Express app handles it exactly as it does locally.
module.exports = require('../backend/app');
