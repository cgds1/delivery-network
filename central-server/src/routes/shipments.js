const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

function generateTrackingCode() {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
  return `RDD-${year}-${seq}`;
}

// GET /api/shipments — list all shipments (all authenticated roles)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM shipments ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/shipments — create new shipment (mostrador only)
router.post('/', async (req, res) => {
  if (req.user.role !== 'mostrador') {
    return res.status(403).json({ error: 'Only mostrador can create shipments' });
  }

  const { sender_name, sender_phone, receiver_name, receiver_phone, receiver_address, description, weight_kg } = req.body;
  if (!sender_name || !receiver_name || !receiver_address) {
    return res.status(400).json({ error: 'sender_name, receiver_name, and receiver_address are required' });
  }

  try {
    const tracking_code = generateTrackingCode();
    const { rows } = await pool.query(
      `INSERT INTO shipments (tracking_code, sender_name, sender_phone, receiver_name, receiver_phone, receiver_address, description, weight_kg, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [tracking_code, sender_name, sender_phone, receiver_name, receiver_phone, receiver_address, description, weight_kg, req.user.uid]
    );

    await pool.query(
      'INSERT INTO shipment_history (shipment_id, status, notes, updated_by) VALUES ($1, $2, $3, $4)',
      [rows[0].id, 'recibido', 'Paquete recibido en mostrador', req.user.uid]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/shipments/:id — get shipment + history
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM shipments WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const { rows: history } = await pool.query(
      'SELECT * FROM shipment_history WHERE shipment_id = $1 ORDER BY updated_at ASC',
      [req.params.id]
    );

    res.json({ shipment: rows[0], history });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/shipments/:id/status — update shipment status (despacho only)
router.put('/:id/status', async (req, res) => {
  if (req.user.role !== 'despacho') {
    return res.status(403).json({ error: 'Only despacho can update shipment status' });
  }

  const { status, notes } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE shipments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    await pool.query(
      'INSERT INTO shipment_history (shipment_id, status, notes, updated_by) VALUES ($1, $2, $3, $4)',
      [req.params.id, status, notes || '', req.user.uid]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
