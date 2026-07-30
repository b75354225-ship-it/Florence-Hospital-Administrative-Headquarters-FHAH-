const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/appointments — create a new appointment request
router.post('/', (req, res) => {
    const { fullName, phone, email, department, date, time, notes } = req.body;

    if (!fullName || !phone || !email || !department || !date || !time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const stmt = db.prepare(`
        INSERT INTO appointments (full_name, phone, email, department, appointment_date, appointment_time, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(fullName, phone, email, department, date, time, notes || '');

    res.status(201).json({ id: result.lastInsertRowid, status: 'pending' });
});

// GET /api/appointments — list all (for an internal admin dashboard you build later)
router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM appointments ORDER BY created_at DESC').all();
    res.json(rows);
});

module.exports = router;
