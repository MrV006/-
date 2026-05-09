document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();
    fetchLibrary();
});

const alertBox = document.getElementById('alert-box');

function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert ${type}`;
    // Scroll to alert for mobile usability
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setTimeout(() => { alertBox.className = 'alert'; }, 7000);
}

// -------------------------------------------------------------
// Auth Checks
// -------------------------------------------------------------
async function checkUserSession() {
    try {
        const res = await fetch('/api/auth/me.php', { credentials: 'include' });
        const data = await res.json();
        
        if (!res.ok) {
            window.location.href = '/login.html';
        } else {
            document.getElementById('user-name').textContent = data.user.username;
            document.getElementById('wallet-balance').textContent = Number(data.user.wallet_balance).toLocaleString('fa-IR');
            
            // Show online payment if enabled
            checkPaymentOptions();

            // Check if user is staff to show Earnings tab
            // In our system, if they have staff earnings, they are staff. 
            // We'll just show the tab and if they have nothing, it stays empty.
            // Better: conditionally show it by fetching earnings check
            checkIfStaff();
        }
    } catch (e) {
        window.location.href = '/login.html';
    }
}

async function checkIfStaff() {
    try {
        const res = await fetch('/api/user/earnings.php', { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data.is_staff) {
            document.getElementById('tab-btn-earnings').style.display = 'block';
            window.staffData = data; // store for later
        }
    } catch (e) {}
}

async function logout() {
    await fetch('/api/auth/logout.php', { method: 'POST', credentials: 'include' });
    window.location.href = '/login.html';
}

// -------------------------------------------------------------
// Tab Router
// -------------------------------------------------------------
let notifyInterval;

function switchTab(tabId) {
    // Hide all tabs
    document.getElementById('tab-library').style.display = 'none';
    document.getElementById('tab-receipt').style.display = 'none';
    if(document.getElementById('tab-earnings')) document.getElementById('tab-earnings').style.display = 'none';
    if(document.getElementById('tab-notifications')) document.getElementById('tab-notifications').style.display = 'none';
    
    // Remove active state
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Add active state to clicked
    const e = window.event;
    if(e && e.target) e.target.classList.add('active');
    
    document.getElementById(`tab-${tabId}`).style.display = 'block';

    if (tabId === 'receipt') fetchReceiptHistory();
    if (tabId === 'library') fetchLibrary();
    if (tabId === 'earnings' && window.staffData) renderEarnings();
    if (tabId === 'notifications') {
        fetchNotifications();
        if(!notifyInterval) notifyInterval = setInterval(fetchNotifications_silent, 10000);
    } else {
        if(notifyInterval) clearInterval(notifyInterval);
        notifyInterval = null;
    }
}

async function checkPaymentOptions() {
    try {
        const res = await fetch('/api/settings_public.php');
        if (res.ok) {
            const data = await res.json();
            if (data.settings && parseInt(data.settings.zarinpal_enabled) === 1) {
                const btn = document.getElementById('online-pay-btn');
                if (btn) btn.style.display = 'block';
            }
        }
    } catch(e) {}
}

function startOnlinePayment() {
    const amount = document.getElementById('receipt_amount').value;
    if (!amount || amount < 1000) {
        showAlert('مبلغ پرداخت باید مشخص شود (حداقل ۱۰۰۰ تومان).', 'error');
        return;
    }
    // Note: ZarinPal API integration usually opens a redirect window. We mock it or redirect if implemented.
    showAlert('درگاه پرداخت هنوز به صورت کامل مستقر نشده است.', 'error');
}

async function fetchNotifications_silent() {
    try {
        const res = await fetch('/api/notifications/list.php', {credentials: 'include'});
        const data = await res.json();
        if (res.ok && data.notifications) {
            renderNotifications(data.notifications);
        }
    } catch(e){}
}

function renderNotifications(notifications) {
    const container = document.getElementById('notifications-container');
    if (notifications.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">اعلانی وجود ندارد.</p>';
    } else {
        container.innerHTML = notifications.map(n => `
            <div style="border-bottom: 1px solid var(--border-color); padding: 1rem 0; ${n.is_read == 0 ? 'border-right: 4px solid var(--accent-color); padding-right:1rem;' : ''}">
                <p style="color: var(--text-primary); white-space:pre-wrap;">${n.message}</p>
                <span style="font-size: 0.75rem; color: var(--text-secondary); margin-top:0.5rem; display:block;">${n.created_at}</span>
                ${n.is_read == 0 ? `<button class="btn btn-sm" onclick="markNotificationAsRead(${n.id})" style="margin-top:0.5rem; background:transparent; border:1px solid var(--border-color); color:var(--text-muted);">علامت به عنوان خوانده شده</button>` : ''}
            </div>
        `).join('');
    }
}

async function fetchNotifications() {
    const container = document.getElementById('notifications-container');
    container.innerHTML = '<p style="color:var(--text-muted);">در حال بارگذاری...</p>';
    try {
        const res = await fetch('/api/notifications/list.php', {credentials: 'include'});
        const data = await res.json();
        if (res.ok && data.notifications) {
            renderNotifications(data.notifications);
        }
    } catch (e) {
        container.innerHTML = '<p style="color:var(--error-color);">خطا در بارگذاری.</p>';
    }
}

async function markNotificationAsRead(id) {
    try {
        await fetch('/api/notifications/read.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id})
        });
        fetchNotifications();
    } catch(e){}
}

function renderEarnings() {
    const data = window.staffData;
    document.getElementById('total-earnings').innerHTML = `${new Intl.NumberFormat('fa-IR').format(data.total_amount)} <span style="font-size: 1rem; color: var(--text-muted);">تومان</span>`;
    document.getElementById('total-gift-chapters').textContent = data.gift_chapters;

    let html = '';
    if (data.history.length === 0) {
        html = '<p style="color:var(--text-muted);">سابقه کاری یافت نشد.</p>';
    } else {
        html = data.history.map(item => `
            <div style="padding:1rem; border:1px solid var(--border-color); border-radius:var(--radius-md); margin-bottom:0.5rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                    <strong>چپتر ${item.chapter_number} - ${item.manga_title}</strong>
                    <span style="color:var(--accent-color); font-weight:bold;">${Number(item.earned_amount).toLocaleString('fa-IR')} تومان</span>
                </div>
                <div style="color:var(--text-secondary); font-size:0.8rem;">نقش: ${item.role} | زمان: ${item.created_at}</div>
            </div>
        `).join('');
    }
    document.getElementById('earnings-history').innerHTML = html;
}

// -------------------------------------------------------------
// Receipt Upload Form Handler
// -------------------------------------------------------------
document.getElementById('receipt-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button');
    const OriginalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'در حال پردازش و آپلود امن...';

    // Native Vanilla implementation of multipart/form-data
    const formData = new FormData();
    formData.append('amount', document.getElementById('receipt_amount').value);
    formData.append('receipt_image', document.getElementById('receipt_image').files[0]);

    try {
        const res = await fetch('/api/user/upload_receipt.php', {
            method: 'POST',
            credentials: 'include',
            body: formData 
        });
        const data = await res.json();
        
        if (res.ok) {
            showAlert(data.message, 'success');
            e.target.reset(); // Clear the form
            fetchReceiptHistory(); // Refresh history instantly
        } else {
            showAlert(data.error, 'error');
        }
    } catch (e) {
        showAlert('خطای شبکه. سرور در دسترس نیست.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = OriginalText;
    }
});

// -------------------------------------------------------------
// Fetch Data endpoints
// -------------------------------------------------------------
const statusMap = { 'pending': 'در انتظار تایید', 'approved': 'تایید شده', 'rejected': 'رد شده' };

async function fetchReceiptHistory() {
    const container = document.getElementById('receipts-history');
    container.innerHTML = '<p style="color: var(--text-muted);">در حال بارگذاری...</p>';
    
    try {
        const res = await fetch('/api/user/receipts.php', { credentials: 'include' });
        const data = await res.json();
        
        if (res.ok) {
            if (data.receipts.length === 0) {
                container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">شما تا کنون فیشی ارسال نکرده‌اید.</p>';
                return;
            }
            
            container.innerHTML = data.receipts.map(r => `
                <div style="border-bottom: 1px solid var(--border-color); padding: 1rem 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <strong style="color: var(--text-primary);">${Number(r.amount).toLocaleString('fa-IR')} تومان</strong>
                        <span class="status-badge ${r.status}">${statusMap[r.status]}</span>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">${r.submitted_at}</span>
                </div>
            `).join('');
        }
    } catch (e) {
        container.innerHTML = '<p class="alert error">خطا در بارگذاری فیش‌ها</p>';
    }
}

async function fetchLibrary() {
    const container = document.getElementById('library-container');
    try {
        const res = await fetch('/api/user/library.php', { credentials: 'include' });
        const data = await res.json();
        
        if (res.ok) {
            if (data.library.length === 0) {
                container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
                    <p style="color: var(--text-secondary); margin-bottom: 1rem;">کتابخانه شما هنوز خالی است!</p>
                    <a href="/shop.html" class="btn" style="text-decoration: none; display: inline-block; width: auto;">مشاهده فروشگاه</a>
                </div>`;
                return;
            }
            container.innerHTML = data.library.map(m => `
                <div class="card">
                    <h3 style="margin-bottom: 0.25rem;">${m.title}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1.5rem;">تعداد ${m.chapters.length} فصل خریداری شده</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        ${m.chapters.map(c => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                <span style="font-weight: 500;">فصل ${c.number}: ${c.title || ''}</span>
                                <a href="/reader.html?chapter=${c.id}" class="btn" style="width: auto; padding: 0.4rem 0.8rem; font-size: 0.875rem; text-decoration: none;">مطالعه امن &rarr;</a>
                            </div>
                        `).join('');}
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        container.innerHTML = '<p class="alert error">خطا در اتصال به کتابخانه</p>';
    }
}
