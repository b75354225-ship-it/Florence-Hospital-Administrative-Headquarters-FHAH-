const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/chat-messages
router.post('/', (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message' });

    db.query('INSERT INTO chat_messages (message) VALUES (?)', [message], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to log message' });
        }
        res.status(201).json({ ok: true, id: result.insertId });
    });
});

module.exports = router;
