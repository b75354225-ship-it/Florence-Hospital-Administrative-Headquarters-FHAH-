const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const db = require('../config/db');

// POST /api/donations
router.post('/', async (req, res) => {
    const { donorName, donorEmail, donorPhone, amount, anonymous } = req.body;

    if (!donorName || !donorEmail || !donorPhone || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const txRef = `FHAH-DONATE-${Date.now()}`;
    const displayName = anonymous ? 'Anonymous Donor' : donorName;
    const noteMessage = `Phone: ${donorPhone} | Reference: ${txRef}${anonymous ? ' | Anonymous donation' : ''}`;

    const sql = `
        INSERT INTO donations (name, email, amount, payment_method, message)
        VALUES (?, ?, ?, 'pending', ?)
    `;

    db.query(sql, [displayName, donorEmail, amount, noteMessage], async (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Donation record failed' });
        }

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
                    customer: { email: donorEmail, phonenumber: donorPhone, name: displayName },
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
});

module.exports = router;
