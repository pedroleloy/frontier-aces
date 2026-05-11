import express from 'express';
import cors from 'cors';
import savesRouter from './routes/saves.js';
import leaderboardRouter from './routes/leaderboard.js';

const PORT = Number(process.env.PORT ?? 4000);
const app = express();

app.use(cors());
app.use(express.json({ limit: '512kb' }));

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.use('/api/saves', savesRouter);
app.use('/api/leaderboard', leaderboardRouter);

// 404 fallback for /api/*
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'not_found' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[frontier-aces] server listening on :${PORT}`);
});
