import { Router } from 'express';
import { stmts } from '../db.js';

const router = Router();

/**
 * GET /api/leaderboard?limit=20 — top players by reputation, then bankroll.
 */
router.get('/', (req, res) => {
  const raw = Number(req.query.limit ?? 20);
  const limit = Number.isFinite(raw) ? Math.max(1, Math.min(100, Math.round(raw))) : 20;
  const rows = stmts.topLeaderboard.all(limit);
  res.json(
    rows.map((r) => ({
      name: r.name,
      reputation: r.reputation,
      bankroll: r.bankroll,
      level: r.level,
    })),
  );
});

export default router;
