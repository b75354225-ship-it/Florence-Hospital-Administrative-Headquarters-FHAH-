const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const db = require('../db');

// POST /api/payments/initiate
// Creates a pending payment record, then asks Flutterwave for a secure
// hosted checkout link and returns it to the front end, which redirects
// the patient there to actually enter card/mobile-money details.
//
// Requires FLW_SECRET_KEY in backend/.env — see backend/README.md.
router.post('/initiate', async (req, res) => {
    const { payerName, invoiceNumber, payerEmail, payerPhone, amount, method } = req.body;

    if (!payerName || !invoiceNumber || !payerEmail || !payerPhone || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const txRef = `FHAH-${invoiceNumber}-${Date.now()}`;

    const insert = db.prepare(`
        INSERT INTO payments (payer_name, invoice_number, payer_email, payer_phone, amount, method, provider_reference, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'initiated')
    `);
    insert.run(payerName, invoiceNumber, payerEmail, payerPhone, amount, method, txRef);

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
                redirect_url: process.env.PAYMENT_REDIRECT_URL,
                customer: { email: payerEmail, phonenumber: payerPhone, name: payerName },
                customizations: {
                    title: 'Florence Hospital — Bill Payment',
                    description: `Invoice ${invoiceNumber}`
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

// POST /api/payments/webhook
// Point your Flutterwave "Webhook URL" (Dashboard > Settings > Webhooks)
// here so payment status updates automatically instead of relying on
// the browser redirect alone.
router.post('/webhook', express.json(), (req, res) => {
    const signature = req.headers['verif-hash'];
    if (!signature || signature !== process.env.FLW_SECRET_HASH) {
        return res.sendStatus(401);
    }
    const { txRef, status } = req.body.data || {};
    if (txRef) {
        db.prepare('UPDATE payments SET status = ? WHERE provider_reference = ?')
          .run(status === 'successful' ? 'successful' : 'failed', txRef);
    }
    res.sendStatus(200);
});

module.exports = router;
