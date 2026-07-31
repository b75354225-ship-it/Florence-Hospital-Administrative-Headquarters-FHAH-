const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/support-tickets
router.post('/', (req, res) => {
    const { name, email, phone, category, message } = req.body;
    if (!name || !email || !category || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = `
        INSERT INTO support_tickets (name, email, phone, category, message)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [name, email, phone || null, category, message], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Ticket creation failed' });
        }
        res.status(201).json({ id: result.insertId, status: 'open' });
    });
});

// GET /api/support-tickets
router.get('/', (req, res) => {
    db.query('SELECT * FROM support_tickets ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Unable to fetch tickets' });
        }
        res.json(rows);
    });
});

module.exports = router;
