async function loadLayout() {
    const isReader = window.location.pathname.includes('reader.html');
    
    // Header HTML
    const headerHTML = `
    <header class="app-header">
        <div class="header-container">
            <div class="header-right">
                <a href="/" class="brand-logo" style="text-decoration:none;">مانـگاتا</a>
                <nav class="desktop-nav">
                    <a href="/shop.html">فروشگاه</a>
                    <a href="/">تازه‌ها</a>
                    <a href="/tickets.html">پشتیبانی</a>
                </nav>
            </div>
            <div class="header-left">
                <div class="search-box header-search" style="margin:0;">
                    <input type="text" id="global-search" placeholder="جستجو...">
                    <button class="search-btn">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                </div>
                
                <a href="/login.html" class="icon-btn" id="header-profile-btn" aria-label="پروفایل">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </a>
                
                <button class="menu-btn mobile-only">
                   <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
            </div>
        </div>
    </header>
    `;

    let settings = null;
    try {
        const setRes = await fetch('/api/settings_public.php');
        if (setRes.ok) {
            const data = await setRes.json();
            settings = data.settings;
            window.globalSettings = settings;
        }
    } catch(e) {}

    // Footer HTML
    const footerHTML = `
    <footer class="app-footer">
        <div class="footer-container">
            <div class="footer-brand">
                <h2 class="brand-logo" style="margin-bottom: 1rem;">مانـگاتا</h2>
                <p>${settings && settings.footer_text ? settings.footer_text : 'بزرگترین مرجع تخصصی خواندن مانهوا و مانگا به زبان فارسی.'}</p>
            </div>
            <div class="footer-links">
                <a href="/tickets.html">تیکت و پشتیبانی</a>
                <a href="/rules.html">قوانین و مقررات</a>
                <a href="#">درباره ما</a>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 مانگاتا. تمامی حقوق محفوظ است.</p>
        </div>
    </footer>
    `;

    if (!isReader) {
        if (!document.querySelector('.app-header')) {
            document.body.insertAdjacentHTML('afterbegin', headerHTML);
        }
        if (!document.querySelector('.app-footer')) {
            document.body.insertAdjacentHTML('beforeend', footerHTML);
        }
    }

    // Check auth status globally
    try {
        const response = await fetch('/api/auth/me.php');
        if (response.ok) {
            const data = await response.json();
            if (data.user) {
                const profileBtn = document.getElementById('header-profile-btn');
                if (profileBtn) {
                    if (data.user.role === 'admin' || data.user.role === 'superadmin') {
                        profileBtn.href = '/admin.html';
                    } else {
                        profileBtn.href = '/dashboard.html';
                    }
                    // Show initials instead of icon
                    profileBtn.innerHTML = `<div style="width:24px;height:24px;border-radius:50%;background:var(--accent-color);color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;">${data.user.username.charAt(0).toUpperCase()}</div>`;
                }
                setTimeout(() => checkPopups(), 1500);
            }
        }
    } catch (e) {
        console.log('Not logged in or error checking auth', e);
    }
}

async function checkPopups() {
    try {
        const res = await fetch('/api/notifications/popups.php');
        if (res.ok) {
            const data = await res.json();
            if (data.popups && data.popups.length > 0) {
                data.popups.forEach(p => showPopupModal(p));
            }
        }
    } catch(e){}
}

function showPopupModal(popup) {
    const html = `
    <div id="popup-${popup.id}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; align-items:center; justify-content:center;">
        <div style="background:var(--bg-surface); padding:2rem; border-radius:var(--radius-lg); max-width:400px; width:90%; position:relative;">
            <button onclick="dismissPopup(${popup.id})" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
            <h3 style="margin-top:0; color:var(--accent-color);">اطلاعیه مهم</h3>
            <p style="margin-top:1rem; line-height:1.6;">${popup.message}</p>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

async function dismissPopup(id) {
    const el = document.getElementById(`popup-${id}`);
    if(el) el.remove();
    try {
        await fetch('/api/notifications/read.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id})
        });
    } catch(e){}
}

document.addEventListener('DOMContentLoaded', loadLayout);
