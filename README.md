# Florence Hospital Administrative Headquarters (FHAH) — Website

A multi-page hospital website: home, about, departments, doctors,
services, appointments, patients, gallery, news, payments, donate,
customer service, and contact — each a real, separate page linked
through the navigation, not sections on one long page.

## Running the front end locally

This site uses `fetch()` to load the shared header/footer
(`js/include.js`), so it must be served over `http://`, not opened
directly as a `file://` path.

- **VS Code:** install the "Live Server" extension, right-click
  `index.html` → "Open with Live Server" (your `settings.json`
  already sets it to port 5502).
- **Or, from a terminal:** `npx serve .` (or `python3 -m http.server 5502`)
  from this folder, then visit `http://localhost:5502`.

## Project structure

```
index.html, about.html, departments.html, ...   ← one file per page
partials/header.html, partials/footer.html      ← shared nav & footer
css/style.css                                    ← all styling
js/include.js                                    ← loads the partials
js/main.js                                        ← forms, sliders, chat, FAQ
images/                                           ← your uploaded photos
manifest.json                                     ← makes the site installable
backend/                                          ← Node/Express API + database
```

## Adding your real logo, video, and images

- `images/logo.svg` is a placeholder mark — replace it with your own
  logo file (keep the filename, or update the `<img src>` in
  `partials/header.html`).
- `index.html` expects a video at `videos/hospital-tour.mp4` — create
  a `videos/` folder and drop your footage in, or remove that
  `<video>` block if you don't have one yet.
- Photos you uploaded are already in `images/`, renamed descriptively
  (`hospital-building.jpg`, `laboratory.jpg`, etc.) and used across
  the Home, Gallery, About, and Departments pages.

## Making it work online

1. **Host the front end** anywhere that serves static files (Netlify,
   Vercel, GitHub Pages, or regular cPanel hosting).
2. **Deploy `/backend`** somewhere that runs Node (Render, Railway, a
   VPS, etc.) — see `backend/README.md` for setup, including how to
   connect Flutterwave so the Payments and Donate pages can actually
   move money.
3. Update `API_BASE` in `js/main.js` to your deployed backend URL.

## Turning it into a mobile app

The site already includes `manifest.json`, so on a phone browser
people can "Add to Home Screen" and it opens full-screen like an app
— no app-store review needed. For real Google Play / App Store
listings, the common next step is wrapping this same code with
[Capacitor](https://capacitorjs.com) (`npm init @capacitor/app`) once
the site is live on its own domain — that's a separate build step
from this website project, not something that can be "switched on"
here.

## What still needs your input before this goes live

- A payment provider account (Flutterwave recommended for Uganda) and
  its API keys in `backend/.env`.
- Real doctor names/photos, department content, and news posts —
  current copy is placeholder text to show the layout.
- A domain + hosting for both the front end and the backend.
- Your own logo and hospital tour video/photos, if different from
  what's here.
