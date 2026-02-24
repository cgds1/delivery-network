const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// GET /api/tracking/:code — public, no auth
router.get('/:code', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM shipments WHERE tracking_code = $1',
      [req.params.code.toUpperCase()]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tracking code not found' });
    }
    const shipment = rows[0];

    const { rows: history } = await pool.query(
      'SELECT * FROM shipment_history WHERE shipment_id = $1 ORDER BY updated_at ASC',
      [shipment.id]
    );

    res.json({ shipment, history });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
