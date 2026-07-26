const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/chat-messages — best-effort transcript logging from the
// front-end chat widget so support staff can review conversations.
router.post('/', (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message' });
    db.prepare('INSERT INTO chat_messages (message) VALUES (?)').run(message);
    res.status(201).json({ ok: true });
});

module.exports = router;
