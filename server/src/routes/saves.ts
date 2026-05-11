import { Router } from 'express';
import { stmts } from '../db.js';

const router = Router();

/**
 * GET /api/saves/:playerId — fetch latest save for player.
 */
router.get('/:playerId', (req, res) => {
  const playerId = req.params.playerId;
  const row = stmts.getSave.get(playerId);
  if (!row) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  try {
    res.json(JSON.parse(row.json_data));
  } catch {
    res.status(500).json({ error: 'corrupt_save' });
  }
});

/**
 * PUT /api/saves/:playerId — upsert a save.
 * Also writes the player's reputation/bankroll/level into the leaderboard
 * so the global standings reflect the latest snapshot.
 */
router.put('/:playerId', (req, res) => {
  const playerId = req.params.playerId;
  const body = req.body;
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'invalid_body' });
    return;
  }

  const json = JSON.stringify(body);
  if (json.length > 500_000) {
    res.status(413).json({ error: 'payload_too_large' });
    return;
  }
  const now = Date.now();
  stmts.upsertSave.run(playerId, json, now);

  // Best-effort leaderboard update — never fail the save if shape is unexpected
  try {
    const player = body.player ?? {};
    const economy = body.economy ?? {};
    stmts.upsertLeaderboard.run(
      playerId,
      String(player.name ?? 'Forasteiro').slice(0, 32),
      Number(player.reputation ?? 0) | 0,
      Math.round(Number(economy.bankroll ?? 0)) +
        Math.round(Number(economy.bank ?? 0)),
      Number(player.level ?? 1) | 0,
      now,
    );
  } catch {
    // ignore — leaderboard is non-essential
  }

  res.json({ ok: true, updatedAt: now });
});

export default router;
