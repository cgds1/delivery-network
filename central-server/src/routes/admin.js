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
      "SELECT COUNT(*) FILTER (WHERE status = 'abierta') AS open_complaints, COUNT(*) AS total_complaints FROM complaints"
    );

    // Build by_status as a keyed object so CLI can access stats.by_status.recibido etc.
    const by_status = { recibido: 0, en_despacho: 0, en_camino: 0, entregado: 0, devuelto: 0 };
    statusCounts.forEach(({ status, count }) => { by_status[status] = count; });

    res.json({
      total_shipments: totalRow[0].total,
      by_status,
      open_complaints: complaintsRow[0].open_complaints,
      total_complaints: complaintsRow[0].total_complaints,
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

// GET /api/admin/activity — recent employee activity log (admin only)
router.get('/activity', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT sh.updated_by AS uid, 'status_update' AS action,
              'Envio ' || s.tracking_code || ' → ' || sh.status AS detail,
              sh.updated_at AS timestamp
       FROM shipment_history sh
       JOIN shipments s ON s.id = sh.shipment_id
       ORDER BY sh.updated_at DESC
       LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
