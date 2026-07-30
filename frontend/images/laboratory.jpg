const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const db = require('../db');

// POST /api/donations
// Same pattern as payments.js — logs the donation, then requests a
// hosted checkout link from Flutterwave for card/mobile-money giving.
// Direct transfers to account 3204527565 (shown on donate.html) are
// recorded manually by hospital finance staff, not through this route.
router.post('/', async (req, res) => {
    const { donorName, donorEmail, donorPhone, amount, anonymous } = req.body;

    if (!donorName || !donorEmail || !donorPhone || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const txRef = `FHAH-DONATE-${Date.now()}`;

    db.prepare(`
        INSERT INTO donations (donor_name, donor_email, donor_phone, amount, anonymous, provider_reference, status)
        VALUES (?, ?, ?, ?, ?, ?, 'initiated')
    `).run(donorName, donorEmail, donorPhone, amount, anonymous ? 1 : 0, txRef);

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
