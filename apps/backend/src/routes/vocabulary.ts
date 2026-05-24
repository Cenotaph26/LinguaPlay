import express from 'express';

const router = express.Router();

// GET /vocabulary/words
router.get('/words', async (req, res) => {
  // TODO: Implement get vocabulary words
  res.status(501).json({ error: 'Not implemented' });
});

// GET /vocabulary/due
router.get('/due', async (req, res) => {
  // TODO: Implement get due words for SRS
  res.status(501).json({ error: 'Not implemented' });
});

// POST /vocabulary/review
router.post('/review', async (req, res) => {
  // TODO: Implement SRS review submission
  res.status(501).json({ error: 'Not implemented' });
});

// GET /vocabulary/:wordId/explain
router.get('/:wordId/explain', async (req, res) => {
  // TODO: Implement Claude word explanation
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
