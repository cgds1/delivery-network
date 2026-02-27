const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// GET /api/customers/search?q= — search shipments (atencion only)
router.get('/search', async (req, res) => {
  if (req.user.role !== 'atencion') {
    return res.status(403).json({ error: 'Atencion access required' });
  }

  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM shipments
       WHERE tracking_code ILIKE $1 OR receiver_name ILIKE $1
       ORDER BY created_at DESC`,
      [`%${q}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/customers/complaints — list all complaints (atencion and admin)
router.get('/complaints', async (req, res) => {
  if (req.user.role !== 'atencion' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Atencion or admin access required' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT c.id, s.tracking_code, c.customer_name, c.description, c.status, c.created_at
       FROM complaints c
       JOIN shipments s ON s.id = c.shipment_id
       ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/customers/complaint — register a complaint (atencion only)
router.post('/complaint', async (req, res) => {
  if (req.user.role !== 'atencion') {
    return res.status(403).json({ error: 'Atencion access required' });
  }

  const { shipment_id, customer_name, description } = req.body;
  if (!shipment_id || !customer_name || !description) {
    return res.status(400).json({ error: 'shipment_id, customer_name, and description are required' });
  }

  try {
    const { rows: shipment } = await pool.query('SELECT id FROM shipments WHERE id = $1', [shipment_id]);
    if (shipment.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const { rows } = await pool.query(
      `INSERT INTO complaints (shipment_id, customer_name, description, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [shipment_id, customer_name, description, req.user.uid]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
