const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { body, validationResult } = require('express-validator');

const validateContact = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name is too long'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
  body('subject').optional({ checkFalsy: true }).isLength({ max: 150 }).withMessage('Subject is too long'),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }).withMessage('Message is too long'),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

// POST /api/contact
router.post('/', validateContact, handleValidation, (req, res) => {
    const { name, email, subject, message } = req.body;

    const fullMessage = subject
        ? `Subject: ${subject}\n\n${message}`
        : message;

    const sql = `
        INSERT INTO contact (name, email, message)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [name, email, fullMessage], (err, result) => {
        if (err) {
            console.error('Contact insert error:', err);
            return res.status(500).json({ error: 'Unable to send message.' });
        }

        res.status(201).json({ id: result.insertId, message: 'Message sent successfully.' });
    });
});

module.exports = router;