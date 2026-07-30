require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
app.use(express.json());

app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/support-tickets', require('./routes/support-tickets'));
app.use('/api/chat-messages', require('./routes/chat-messages'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/donations', require('./routes/donations'));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`FHAH backend running on http://localhost:${PORT}`));
