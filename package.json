# FHAH Backend API

A small Node/Express API that powers the forms on the Florence Hospital
website: appointments, contact messages, support tickets, live-chat
transcript logging, and payment/donation checkout via Flutterwave.

## 1. Install

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in real values (see comments in the file).

## 2. Run it

```bash
npm start
```

This starts the API at `http://localhost:4000` and creates a local
SQLite database file at `backend/db/fhah.db` automatically the first
time it runs — no separate database server needed to get going.

## 3. Point the front end at it

In `js/main.js`, `API_BASE` defaults to `http://localhost:4000/api`.
Update it (or set `window.API_BASE` before that script loads) once you
deploy the backend somewhere public, e.g.:

```js
const API_BASE = 'https://api.florencehospital.org/api';
```

## 4. Accepting real payments

The payment and donation forms are fully wired on the front end, but
**no money can move until you connect a real payment provider.** This
project uses [Flutterwave](https://flutterwave.com) because it
supports Uganda mobile money (MTN, Airtel) and cards from one
integration:

1. Create a Flutterwave account and switch to "Live" mode when ready.
2. Copy your Secret Key from Dashboard → Settings → API Keys into
   `FLW_SECRET_KEY` in `.env`.
3. Under Settings → Webhooks, set your webhook URL to
   `https://your-domain.com/api/payments/webhook` and copy the
   "Secret Hash" into `FLW_SECRET_HASH` in `.env` — this lets the
   server confirm payments automatically instead of trusting the
   browser redirect alone.
4. Test with Flutterwave's test cards/mobile money numbers before
   going live.

Prefer PayPal, Paystack, or Stripe instead? The pattern in
`routes/payments.js` and `routes/donations.js` is the same for any of
them — swap the `fetch` call to that provider's "create checkout
session" endpoint and use their SDK/keys instead.

The direct donation account (3204527565) shown on `donate.html` is
for manual bank/mobile-money transfers your finance team reconciles
by hand — it is not connected to this API.

## 5. Moving to a hosted database later

`db/schema.sql` is plain SQL and maps almost one-to-one onto MySQL or
PostgreSQL if you outgrow SQLite (e.g. move to shared hosting or a
managed cloud database). Swap `better-sqlite3` for `mysql2` or `pg`,
change `AUTOINCREMENT` → `AUTO_INCREMENT`/`SERIAL`, and the rest of
the route code needs only minor query-syntax changes.

## 6. Notifying staff by email (optional)

Add SMTP credentials to `.env` and wire up a mail library (e.g.
`nodemailer`) inside `routes/contact.js` and `routes/support-tickets.js`
if you want staff emailed immediately when a form is submitted. This
scaffold logs to the database only, by default.

## Endpoints

| Method | Path                       | Purpose                        |
|--------|----------------------------|---------------------------------|
| POST   | /api/appointments          | Create an appointment request  |
| GET    | /api/appointments          | List appointments (admin use)  |
| POST   | /api/contact               | Save a contact/feedback message|
| POST   | /api/support-tickets       | Create a customer-service ticket|
| GET    | /api/support-tickets       | List tickets (admin use)       |
| POST   | /api/chat-messages         | Log a live-chat message        |
| POST   | /api/payments/initiate     | Start a bill payment checkout  |
| POST   | /api/payments/webhook      | Flutterwave payment status hook|
| POST   | /api/donations             | Start a donation checkout      |
