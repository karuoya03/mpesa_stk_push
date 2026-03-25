const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Render (and many hosted DBs)
});

// Create table if not exists
pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        checkout_request_id TEXT UNIQUE,
        merchant_request_id TEXT,
        result_code INTEGER,
        result_desc TEXT,
        amount REAL,
        receipt_number TEXT,
        phone_number TEXT,
        transaction_date TEXT,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`).catch(err => console.error('Table creation error:', err));

module.exports = pool;