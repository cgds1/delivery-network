const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const shipmentRoutes = require('./routes/shipments');
const trackingRoutes = require('./routes/tracking');
const adminRoutes = require('./routes/admin');
const customerRoutes = require('./routes/customers');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Public routes (no auth required)
app.use('/api/auth', authRoutes);
app.use('/api/tracking', trackingRoutes);
app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'central-server' }));

// Protected routes (LDAP JWT required)
app.use('/api/shipments', authMiddleware, shipmentRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Central server running on port ${PORT}`);
});
