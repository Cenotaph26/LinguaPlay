import express from 'express';

const router = express.Router();

// GET /placement/test
router.get('/test', async (req, res) => {
  // TODO: Implement get placement test
  res.status(501).json({ error: 'Not implemented' });
});

// POST /placement/evaluate
router.post('/evaluate', async (req, res) => {
  // TODO: Implement evaluate placement test
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
