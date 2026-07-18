const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/support-tickets
router.post('/', (req, res) => {
    const { name, email, phone, category, message } = req.body;
    if (!name || !email || !category || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const stmt = db.prepare(`
        INSERT INTO support_tickets (name, email, phone, category, message)
        VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, email, phone || '', category, message);
    res.status(201).json({ id: result.lastInsertRowid, status: 'open' });
});

// GET /api/support-tickets — for an internal support dashboard
router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM support_tickets ORDER BY created_at DESC').all();
    res.json(rows);
});

module.exports = router;
