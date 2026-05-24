import express from 'express';

const router = express.Router();

// GET /roleplay/scenes
router.get('/scenes', async (req, res) => {
  // TODO: Implement get preset scenes
  res.status(501).json({ error: 'Not implemented' });
});

// POST /roleplay/sessions
router.post('/sessions', async (req, res) => {
  // TODO: Implement start roleplay session
  res.status(501).json({ error: 'Not implemented' });
});

// POST /roleplay/sessions/:id/message
router.post('/sessions/:id/message', async (req, res) => {
  // TODO: Implement send message in roleplay
  res.status(501).json({ error: 'Not implemented' });
});

// POST /roleplay/sessions/:id/end
router.post('/sessions/:id/end', async (req, res) => {
  // TODO: Implement end roleplay session
  res.status(501).json({ error: 'Not implemented' });
});

// GET /roleplay/sessions/:id
router.get('/sessions/:id', async (req, res) => {
  // TODO: Implement get session history
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
