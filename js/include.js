/*==============================================================
    include.js
    Loads the shared header/footer partials into every page so
    nav + footer only need to be edited in one place. Requires
    the site to be served over http(s) — e.g. VS Code "Live
    Server", or any real web host. Opening index.html directly
    with file:// will block this fetch (browser security), so
    always run it through a local server or your live domain.
================================================================*/

async function loadPartial(targetId, url){
    const target = document.getElementById(targetId);
    if(!target) return;
    try{
        const res = await fetch(url);
        if(!res.ok) throw new Error('Failed to load ' + url);
        target.innerHTML = await res.text();
    }catch(err){
        console.error(err);
        target.innerHTML = '<p style="padding:20px;color:#b3261e;">Could not load site navigation. Please serve this site through a local/live web server rather than opening the file directly.</p>';
    }
}

document.addEventListener('DOMContentLoaded', async () => {

    await loadPartial('site-header', 'partials/header.html');
    await loadPartial('site-footer', 'partials/footer.html');

    // Highlight the current page in the nav
    const current = document.body.getAttribute('data-page');
    document.querySelectorAll('.nav-links a[data-page]').forEach(link => {
        if(link.getAttribute('data-page') === current){
            link.classList.add('active');
        }
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if(menuToggle && navLinks){
        menuToggle.addEventListener('click', () => navLinks.classList.toggle('open'));

        // Tap-to-open dropdowns on mobile
        document.querySelectorAll('.nav-links .dropdown > a').forEach(a => {
            a.addEventListener('click', (e) => {
                if(window.innerWidth <= 1200){
                    e.preventDefault();
                    a.parentElement.classList.toggle('open');
                }
            });
        });
    }

    // Footer year
    const yearEl = document.getElementById('year');
    if(yearEl) yearEl.textContent = new Date().getFullYear();

    // Fire a custom event so page-specific scripts know the chrome is ready
    document.dispatchEvent(new CustomEvent('chromeReady'));
});
