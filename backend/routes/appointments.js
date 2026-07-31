const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/appointments — create a new appointment request
router.post('/', (req, res) => {
    const { name, phone, email, department, appointment_date, doctor, message } = req.body;

    if (!name || !phone || !email || !department || !appointment_date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = `
        INSERT INTO appointments (name, email, phone, department, appointment_date, doctor, message, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
    `;

    db.query(
        sql,
        [name, email, phone, department, appointment_date, doctor || null, message || null],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Appointment creation failed' });
            }
            res.status(201).json({ id: result.insertId, status: 'Pending' });
        }
    );
});

// GET /api/appointments — list all
router.get('/', (req, res) => {
    db.query('SELECT * FROM appointments ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Unable to fetch appointments' });
        }
        res.json(rows);
    });
});

module.exports = router;
