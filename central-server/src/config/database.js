const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'reddedeliveries',
  user: process.env.DB_USER || 'redde',
  password: process.env.DB_PASSWORD || 'redde_secret',
});

module.exports = { pool };
