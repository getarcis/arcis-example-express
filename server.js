// Minimal Express + Arcis app. One install, one middleware line,
// twenty-plus attack vectors blocked. Run with `npm start`, then
// fire `npm run attack` in another shell to see Arcis at work.

import express from 'express';
import { arcis } from '@arcis/node';

const app = express();
app.use(express.json());

// block:true returns 403 on detected attacks. The default is sanitize
// (silently strip + observe), which is safer to roll out without
// breaking existing clients. We use block here so the demo is visible.
app.use(arcis({ block: true }));

app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'Arcis is live. Try /api/echo with an attack payload.' });
});

// Echo endpoint that demonstrates the block in action. Safe input
// passes through; an attack payload returns 403 from Arcis before
// this handler ever runs.
app.post('/api/echo', (req, res) => {
  res.json({ received: req.body });
});

// GET version with a query param so you can demo from a browser.
app.get('/api/echo', (req, res) => {
  res.json({ query: req.query });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`arcis-example-express listening on http://localhost:${PORT}`);
  console.log('In another shell: npm run attack');
});
