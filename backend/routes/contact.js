const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/contact
router.post('/', (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const fullMessage = subject ? `Subject: ${subject}\n\n${message}` : message;

    const sql = `INSERT INTO contact (name, email, phone, message) VALUES (?, ?, ?, ?)`;

    db.query(sql, [name, email, phone || null, fullMessage], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Message submission failed' });
        }
        res.status(201).json({ id: result.insertId });
    });
});

module.exports = router;
