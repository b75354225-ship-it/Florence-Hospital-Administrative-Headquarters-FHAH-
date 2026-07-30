const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const db = require('../config/db');
const { body, validationResult } = require('express-validator');

const validateDonation = [
  body('donorName').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name is too long'),
  body('donorEmail').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
  body('donorPhone').trim().notEmpty().withMessage('Phone is required').isLength({ max: 20 }).withMessage('Phone number is too long'),
  body('amount').notEmpty().withMessage('Amount is required').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('anonymous').optional().isBoolean().withMessage('Invalid anonymous value'),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

// POST /api/donations
// Same pattern as payments.js — logs the donation, then requests a
// hosted checkout link from Flutterwave for card/mobile-money giving.
// Direct transfers to account 3204527565 (shown on donate.html) are
// recorded manually by hospital finance staff, not through this route.
router.post('/', validateDonation, handleValidation, async (req, res) => {
    const { donorName, donorEmail, donorPhone, amount, anonymous } = req.body;

    const txRef = `FHAH-DONATE-${Date.now()}`;

    const donationMessage = anonymous
        ? `Phone: ${donorPhone} | Reference: ${txRef} | Anonymous donation`
        : `Phone: ${donorPhone} | Reference: ${txRef}`;

    const insertSql = `
        INSERT INTO donations (name, email, amount, payment_method, message)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        insertSql,
        [anonymous ? 'Anonymous Donor' : donorName, donorEmail, amount, 'pending', donationMessage],
        (insertErr) => {
            if (insertErr) {
                console.error('Donation insert error:', insertErr);
            }
        }
    );

    if (!process.env.FLW_SECRET_KEY) {
        return res.status(501).json({
            error: 'Payment provider not configured yet. Add FLW_SECRET_KEY to backend/.env — see backend/README.md.'
        });
    }

    try {
        const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tx_ref: txRef,
                amount,
                currency: 'UGX',
                redirect_url: process.env.DONATION_REDIRECT_URL,
                customer: { email: donorEmail, phonenumber: donorPhone, name: anonymous ? 'Anonymous Donor' : donorName },
                customizations: {
                    title: 'Florence Hospital — Donation',
                    description: 'Supporting patient care at FHAH'
                }
            })
        });
        const data = await flwRes.json();
        if (data.status === 'success') {
            return res.json({ checkoutUrl: data.data.link, reference: txRef });
        }
        return res.status(502).json({ error: 'Payment provider error', details: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not reach payment provider' });
    }
});

module.exports = router;