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
        }
    } catch (e) {
        window.location.href = '/login.html';
    }
}

async function logout() {
    await fetch('/api/auth/logout.php', { method: 'POST', credentials: 'include' });
    window.location.href = '/login.html';
}

// -------------------------------------------------------------
// Tab Router
// -------------------------------------------------------------
function switchTab(tabId) {
    // Hide all tabs
    document.getElementById('tab-library').style.display = 'none';
    document.getElementById('tab-receipt').style.display = 'none';
    
    // Remove active state
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Add active state to clicked
    event.target.classList.add('active');
    document.getElementById(`tab-${tabId}`).style.display = 'block';

    if (tabId === 'receipt') fetchReceiptHistory();
    if (tabId === 'library') fetchLibrary();
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
