import express from 'express';

const router = express.Router();

// GET /quiz/generate
router.get('/generate', async (req, res) => {
  // TODO: Implement generate quiz
  res.status(501).json({ error: 'Not implemented' });
});

// POST /quiz/submit
router.post('/submit', async (req, res) => {
  // TODO: Implement submit quiz answers
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
