const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateUser } = require('../config/ldap');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'redde_jwt_secret_change_in_prod';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { uid, password } = req.body;
  if (!uid || !password) {
    return res.status(400).json({ error: 'uid and password required' });
  }

  try {
    const user = await authenticateUser(uid, password);
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

module.exports = router;
