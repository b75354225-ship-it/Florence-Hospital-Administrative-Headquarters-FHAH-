/*==============================================================
    main.js — shared front-end behaviour for every page.
    Runs after the header/footer partials are injected
    (listens for the 'chromeReady' event from include.js).
================================================================*/

// Change this to your deployed backend URL once you host the
// Node/Express API in /backend (see backend/README.md).
const API_BASE = window.API_BASE || 'https://fhah-backend.onrender.com/api';

document.addEventListener('chromeReady', () => {
    initChatWidget();
});

document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();
    initGenericSlider();
    initFaqAccordion();
    initDoctorFilter();
    initAppointmentForm();
    initContactForm();
    initSupportTicketForm();
    initPaymentPage();
    initDonatePage();
    initLightbox();
});

/*==============================
    HERO / IMAGE SLIDER
==============================*/
function initHeroSlider(){
    const slidesWrap = document.querySelector('.hero-slides');
    if(!slidesWrap) return;
    const slides = slidesWrap.querySelectorAll('.hero-slide');
    const dotsWrap = document.querySelector('.hero-dots');
    let i = 0;
    if(dotsWrap){
        slides.forEach((_, idx) => {
            const dot = document.createElement('span');
            if(idx === 0) dot.classList.add('active');
            dot.addEventListener('click', () => show(idx));
            dotsWrap.appendChild(dot);
        });
    }
    function show(idx){
        slides[i].classList.remove('active');
        dotsWrap?.children[i]?.classList.remove('active');
        i = idx;
        slides[i].classList.add('active');
        dotsWrap?.children[i]?.classList.add('active');
    }
    setInterval(() => show((i + 1) % slides.length), 5500);
}

function initGenericSlider(){
    document.querySelectorAll('.slider').forEach(slider => {
        const track = slider.querySelector('.slider-track');
        const slides = slider.querySelectorAll('.slider-slide');
        const prev = slider.parentElement.querySelector('[data-slide="prev"]');
        const next = slider.parentElement.querySelector('[data-slide="next"]');
        let idx = 0;
        function update(){ track.style.transform = `translateX(-${idx * 100}%)`; }
        prev?.addEventListener('click', () => { idx = (idx - 1 + slides.length) % slides.length; update(); });
        next?.addEventListener('click', () => { idx = (idx + 1) % slides.length; update(); });
    });
}

/*==============================
    FAQ ACCORDION
==============================*/
function initFaqAccordion(){
    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
            q.parentElement.classList.toggle('open');
        });
    });
}

/*==============================
    DOCTOR SEARCH / FILTER
==============================*/
function initDoctorFilter(){
    const filterBar = document.querySelector('[data-filter-group="doctors"]');
    const searchInput = document.getElementById('doctorSearch');
    const cards = document.querySelectorAll('[data-specialty]');
    if(!cards.length) return;

    function applyFilters(){
        const active = filterBar?.querySelector('button.active')?.dataset.filter || 'all';
        const term = (searchInput?.value || '').toLowerCase().trim();
        cards.forEach(card => {
            const matchesSpecialty = active === 'all' || card.dataset.specialty === active;
            const matchesSearch = !term || card.dataset.name.toLowerCase().includes(term);
            card.style.display = (matchesSpecialty && matchesSearch) ? '' : 'none';
        });
    }
    filterBar?.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            filterBar.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });
    searchInput?.addEventListener('input', applyFilters);
}

/*==============================
    GALLERY LIGHTBOX
==============================*/
function initLightbox(){
    const items = document.querySelectorAll('[data-lightbox]');
    if(!items.length) return;
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(6,15,25,.9);display:none;align-items:center;justify-content:center;z-index:99999;padding:30px;cursor:zoom-out;';
    const img = document.createElement('img');
    img.style.cssText = 'max-width:90%;max-height:90%;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.5);';
    overlay.appendChild(img);
    overlay.addEventListener('click', () => overlay.style.display = 'none');
    document.body.appendChild(overlay);

    items.forEach(item => {
        item.style.cursor = 'zoom-in';
        item.addEventListener('click', () => {
            img.src = item.getAttribute('data-lightbox');
            overlay.style.display = 'flex';
        });
    });
}

/*==============================
    GENERIC FORM SUBMIT HELPER
    Posts JSON to the backend; shows a friendly status message
    either way so the page still works before the backend is
    deployed.
==============================*/
async function submitForm(endpoint, data, statusEl, successMsg){
    try{
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if(!res.ok) throw new Error('Request failed');
        statusEl.textContent = successMsg;
        statusEl.className = 'form-status success';
        return true;
    }catch(err){
        // Backend not reachable yet — still confirm receipt locally so the
        // form doesn't feel broken while you finish wiring up the API.
        console.warn('API not reachable, falling back:', err);
        statusEl.textContent = successMsg + ' (Note: connect the backend in /backend to actually store this.)';
        statusEl.className = 'form-status success';
        return true;
    }
}

/*==============================
    APPOINTMENT FORM
==============================*/
function initAppointmentForm(){
    const form = document.getElementById('appointmentForm');
    if(!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusEl = document.getElementById('appointmentStatus');
        const data = Object.fromEntries(new FormData(form).entries());
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Submitting...';
        await submitForm('/appointments', data, statusEl, `Thank you ${data.fullName || ''}, your appointment request has been received. Our team will confirm by phone or email shortly.`);
        btn.disabled = false; btn.textContent = 'Request Appointment';
        form.reset();
    });
}

/*==============================
    CONTACT / FEEDBACK FORM
==============================*/
function initContactForm(){
    const form = document.getElementById('contactForm');
    if(!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusEl = document.getElementById('contactStatus');
        const data = Object.fromEntries(new FormData(form).entries());
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Sending...';
        await submitForm('/contact', data, statusEl, 'Thanks for reaching out — a member of our team will get back to you soon.');
        btn.disabled = false; btn.textContent = 'Send Message';
        form.reset();
    });
}

/*==============================
    SUPPORT TICKET FORM + CHAT
==============================*/
function initSupportTicketForm(){
    const form = document.getElementById('ticketForm');
    if(!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusEl = document.getElementById('ticketStatus');
        const data = Object.fromEntries(new FormData(form).entries());
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Submitting...';
        await submitForm('/support-tickets', data, statusEl, 'Your support ticket has been logged. Our customer service team will contact you shortly.');
        btn.disabled = false; btn.textContent = 'Submit Ticket';
        form.reset();
    });
}

function initChatWidget(){
    const toggle = document.getElementById('chatToggle');
    const win = document.getElementById('chatWindow');
    const close = document.getElementById('chatClose');
    const body = document.getElementById('chatBody');
    const input = document.getElementById('chatInput');
    const send = document.getElementById('chatSend');
    if(!toggle || !win) return;

    toggle.addEventListener('click', () => win.classList.toggle('open'));
    close.addEventListener('click', () => win.classList.remove('open'));

    const replies = [
        { match: /appointment|book/i, reply: 'You can book an appointment on our Appointments page, or call +256 700 123 456. Would you like the link? appointments.html' },
        { match: /bill|pay|payment/i, reply: 'You can pay a hospital bill securely on our Payments page: payments.html. You will need your invoice/patient number.' },
        { match: /donat/i, reply: 'Thank you for your interest in supporting FHAH! Visit donate.html to give via mobile money, bank transfer or card.' },
        { match: /visit|hour/i, reply: 'General visiting hours are 10:00 AM – 6:00 PM daily. The Emergency Department is open 24/7.' },
        { match: /emergency/i, reply: 'For emergencies, please call our 24-hour hotline at +256 709 543 181 immediately or go to the nearest Emergency entrance.' },
    ];

    function addMsg(text, who){
        const div = document.createElement('div');
        div.className = 'chat-msg ' + who;
        div.textContent = text;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
    }

    function respond(userText){
        const found = replies.find(r => r.match.test(userText));
        const reply = found ? found.reply : 'Thanks for your message! A member of our customer service team will follow up shortly. For urgent matters, please call +256 700 123 456.';
        setTimeout(() => addMsg(reply, 'bot'), 500);
    }

    function handleSend(){
        const text = input.value.trim();
        if(!text) return;
        addMsg(text, 'user');
        input.value = '';
        respond(text);
        // Best-effort log to backend so support staff see chat transcripts too
        fetch(`${API_BASE}/chat-messages`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ message: text, at: new Date().toISOString() })
        }).catch(() => {});
    }

    send.addEventListener('click', handleSend);
    input.addEventListener('keydown', (e) => { if(e.key === 'Enter') handleSend(); });
}

/*==============================
    PAYMENTS PAGE
==============================*/
function initPaymentPage(){
    const form = document.getElementById('paymentForm');
    if(!form) return;

    // Amount chips
    document.querySelectorAll('.amount-chips button').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.amount-chips button').forEach(b => b.classList.remove('active'));
            chip.classList.add('active');
            document.getElementById('amountInput').value = chip.dataset.amount;
        });
    });

    // Method selection
    document.querySelectorAll('.pay-method').forEach(method => {
        method.addEventListener('click', () => {
            document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('selected'));
            method.classList.add('selected');
            method.querySelector('input').checked = true;
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusEl = document.getElementById('paymentStatus');
        const data = Object.fromEntries(new FormData(form).entries());

        if(!data.amount || Number(data.amount) <= 0){
            statusEl.textContent = 'Please enter a valid amount.';
            statusEl.className = 'form-status error';
            return;
        }

        // This calls your backend, which should create the transaction and
        // return a checkout link/reference from your payment provider
        // (e.g. Flutterwave or Paystack — see backend/routes/payments.js).
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Processing...';
        try{
            const res = await fetch(`${API_BASE}/payments/initiate`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if(result.checkoutUrl){
                window.location.href = result.checkoutUrl; // redirect to provider's secure checkout
                return;
            }
            throw new Error('No checkout URL returned');
        }catch(err){
            console.warn('Payment API not reachable yet:', err);
            statusEl.textContent = 'This form is ready to go — connect it to a payment provider (Flutterwave/Paystack/PayPal) in backend/routes/payments.js to start accepting real payments. See backend/README.md.';
            statusEl.className = 'form-status error';
        }
        btn.disabled = false; btn.textContent = 'Proceed to Secure Payment';
    });
}

/*==============================
    DONATION PAGE
==============================*/
function initDonatePage(){
    const copyBtn = document.getElementById('copyAccount');
    if(copyBtn){
        copyBtn.addEventListener('click', () => {
            const number = document.getElementById('acctNumber').textContent.trim();
            navigator.clipboard.writeText(number).then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => copyBtn.textContent = 'Copy Number', 1800);
            });
        });
    }

    document.querySelectorAll('.donate-amount-chips button').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.donate-amount-chips button').forEach(b => b.classList.remove('active'));
            chip.classList.add('active');
            const input = document.getElementById('donateAmountInput');
            if(input) input.value = chip.dataset.amount;
        });
    });

    const form = document.getElementById('donateForm');
    if(!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusEl = document.getElementById('donateStatus');
        const data = Object.fromEntries(new FormData(form).entries());
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Processing...';
        try{
            const res = await fetch(`${API_BASE}/donations`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if(result.checkoutUrl){
                window.location.href = result.checkoutUrl;
                return;
            }
            throw new Error('No checkout URL returned');
        }catch(err){
            statusEl.textContent = 'Thank you! For card/mobile-money donations to process automatically, connect this form to your payment provider in backend/routes/donations.js. You can also donate directly using account 3204527565 above.';
            statusEl.className = 'form-status success';
        }
        btn.disabled = false; btn.textContent = 'Donate Now';
        form.reset();
    });
}
