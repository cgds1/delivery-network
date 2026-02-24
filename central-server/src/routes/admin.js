const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// GET /api/admin/stats — dashboard statistics (admin only)
router.get('/stats', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { rows: statusCounts } = await pool.query(
      'SELECT status, COUNT(*)::int as count FROM shipments GROUP BY status'
    );
    const { rows: totalRow } = await pool.query(
      'SELECT COUNT(*)::int as total FROM shipments'
    );
    const { rows: complaintsRow } = await pool.query(
      "SELECT COUNT(*)::int as open_complaints FROM complaints WHERE status = 'abierta'"
    );

    res.json({
      total_shipments: totalRow[0].total,
      by_status: statusCounts,
      open_complaints: complaintsRow[0].open_complaints,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/shipments — all shipments unfiltered (admin only)
router.get('/shipments', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM shipments ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
