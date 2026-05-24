import express from 'express';

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  // TODO: Implement user registration
  res.status(501).json({ error: 'Not implemented' });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  // TODO: Implement user login
  res.status(501).json({ error: 'Not implemented' });
});

// GET /auth/me
router.get('/me', async (req, res) => {
  // TODO: Implement get current user
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
