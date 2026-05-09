let currentUserRole = 'admin';

document.addEventListener('DOMContentLoaded', () => {
    checkAdminSession();
});

const alertBox = document.getElementById('alert-box');

function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert ${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => { alertBox.style.display = 'none'; }, 5000);
}

// -------------------------------------------------------------
// Core Auth Functions
// -------------------------------------------------------------
async function checkAdminSession() {
    try {
        const res = await fetch('/api/auth/me.php', { credentials: 'include' });
        const data = await res.json();
        
        if (!res.ok || (data.user.role !== 'admin' && data.user.role !== 'super_admin')) {
            window.location.href = '/login.html';
            return;
        }

        currentUserRole = data.user.role;
        
        if (currentUserRole === 'super_admin') {
            document.getElementById('role-badge').innerHTML = '<span class="super-admin-badge">دسترسی سوپرادمین</span>';
            document.querySelectorAll('.sa-only').forEach(el => el.style.display = 'block');
        }

        // Now that we verified session, fetch initial data
        fetchSettings();
    } catch (e) {
        window.location.href = '/login.html';
    }
}

async function logout() {
    await fetch('/api/auth/logout.php', { method: 'POST', credentials: 'include' });
    window.location.href = '/login.html';
}

function showSection(sectionId, evt) {
    if(evt) {
        document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
        evt.target.classList.add('active');
    }

    const sections = ['dashboard', 'receipts', 'comments', 'users', 'pricing', 'restore'];
    sections.forEach(s => {
        const el = document.getElementById(`section-${s}`);
        if(el) el.style.display = 'none';
    });
    
    const targetEl = document.getElementById(`section-${sectionId}`);
    if (targetEl) targetEl.style.display = 'block';

    if (sectionId === 'receipts') fetchReceipts();
    if (sectionId === 'users' && currentUserRole === 'super_admin') fetchUsers();
}

// -------------------------------------------------------------
// Settings Functions
// -------------------------------------------------------------
async function fetchSettings() {
    try {
        const res = await fetch('/api/admin/settings.php', { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data.settings) {
            document.getElementById('base_price').value = data.settings.base_price;
            document.getElementById('bulk_discount').value = data.settings.bulk_discount_percent;
            document.getElementById('gift_amount').value = data.settings.gift_amount;
            if(document.getElementById('recruitment_contact')) document.getElementById('recruitment_contact').value = data.settings.recruitment_contact || '';
            if(document.getElementById('recruitment_file_path')) document.getElementById('recruitment_file_path').value = data.settings.recruitment_file_path || '';
        }
    } catch (e) {
        console.error('Failed fetching settings', e);
    }
}

document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (currentUserRole !== 'super_admin') {
        showAlert('فقط سوپرادمین می‌تواند تنظیمات را تغییر دهد.', 'error');
        return;
    }

    const payload = {
        base_price: document.getElementById('base_price').value,
        bulk_discount_percent: document.getElementById('bulk_discount').value,
        gift_amount: document.getElementById('gift_amount').value,
        recruitment_contact: document.getElementById('recruitment_contact') ? document.getElementById('recruitment_contact').value : '',
        recruitment_file_path: document.getElementById('recruitment_file_path') ? document.getElementById('recruitment_file_path').value : ''
    };

    try {
        const res = await fetch('/api/admin/settings.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) showAlert(data.message, 'success');
        else showAlert(data.error || 'ارور نامشخص', 'error');
    } catch (e) {
        showAlert('خطا در ارتباط با سرور', 'error');
    }
});

// -------------------------------------------------------------
// Receipts Functions
// -------------------------------------------------------------
async function fetchReceipts() {
    const container = document.getElementById('receipts-container');
    container.innerHTML = '<p style="color: var(--text-muted);">در حال بارگذاری...</p>';
    
    try {
        const res = await fetch('/api/admin/receipts.php', { credentials: 'include' });
        const data = await res.json();
        
        if (res.ok) {
            if (data.receipts.length === 0) {
                container.innerHTML = '<p style="color: var(--text-muted);">فیش بررسی نشده‌ای وجود ندارد.</p>';
                return;
            }

            container.innerHTML = data.receipts.map(r => `
                <div class="item-row" id="receipt-${r.id}">
                    <div>
                        <strong>کاربر: ${r.username}</strong>
                        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">مبلغ واریزی: ${Number(r.amount).toLocaleString('fa-IR')} تومان</p>
                        <p style="font-size: 0.75rem; color: var(--text-muted);">ارسال شده در: ${r.submitted_at}</p>
                    </div>
                    <div class="item-actions">
                        <a href="/${r.image_path}" target="_blank" class="btn" style="text-decoration: none; margin-right: 0.5rem; display:inline-block; width:auto;">مشاهده تصویر</a>
                        <button class="btn-approve" onclick="handleReceipt(${r.id}, 'approve')">تایید</button>
                        <button class="btn-reject" onclick="handleReceipt(${r.id}, 'reject')">رد کردن</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        container.innerHTML = '<p style="color: var(--error-color);">خطا در بارگذاری اطلاعات</p>';
    }
}

async function handleReceipt(id, action) {
    if (!confirm(`آیا از ${action === 'approve' ? 'تایید' : 'رد'} این فیش اطمینان دارید؟`)) return;

    try {
        const res = await fetch('/api/admin/receipts.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receipt_id: id, action: action })
        });
        const data = await res.json();
        
        if (res.ok) {
            showAlert(data.message, 'success');
            document.getElementById(`receipt-${id}`).remove();
        } else {
            showAlert(data.error, 'error');
        }
    } catch (e) {
        showAlert('خطا در ثبت درخواست', 'error');
    }
}

// -------------------------------------------------------------
// Comments Management
// -------------------------------------------------------------
async function loadComments() {
    const mangaId = document.getElementById('comment-manga-id').value;
    if (!mangaId) return;

    const container = document.getElementById('comments-container');
    container.innerHTML = '<p style="color: var(--text-muted);">در حال بارگذاری...</p>';

    try {
        const res = await fetch(`/api/comments/list.php?manga_id=${mangaId}`, { credentials: 'include' });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);

        if (data.comments.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">نظری برای این مانهوا ثبت نشده است.</p>';
            return;
        }

        container.innerHTML = data.comments.map(c => `
            <div class="item-row" id="comment-${c.id}">
                <div>
                    <strong>${c.username} ${c.role !== 'user' ? '<span style="color:var(--accent-color); font-size:0.7rem;">(ادمین)</span>' : ''}</strong>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem; color:var(--text-primary); white-space:pre-wrap;">${c.content}</p>
                    <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">${c.created_at}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-reject" onclick="deleteComment(${c.id})">حذف</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = `<p style="color: var(--error-color);">خطا: ${e.message}</p>`;
    }
}

async function deleteComment(id) {
    if (!confirm('آیا از حذف این نظر اطمینان دارید؟')) return;
    try {
        const res = await fetch('/api/comments/delete.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (res.ok) {
            showAlert('نظر با موفقیت حذف شد.', 'success');
            document.getElementById(`comment-${id}`).remove();
        } else {
            showAlert(data.error, 'error');
        }
    } catch (e) {
        showAlert('خطا در ارتباط با سرور.', 'error');
    }
}

// -------------------------------------------------------------
// Users Management (Super Admin)
// -------------------------------------------------------------
async function fetchUsers() {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '<tr><td colspan="5">در حال بارگذاری...</td></tr>';
    
    try {
        const res = await fetch('/api/admin/users.php', { credentials: 'include' });
        const data = await res.json();
        
        if (res.ok && data.users) {
            if (data.users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">کاربری یافت نشد.</td></tr>';
                return;
            }

            tbody.innerHTML = data.users.map(u => `
                <tr id="user-row-${u.id}">
                    <td>${u.id}</td>
                    <td><input type="text" id="u-name-${u.id}" value="${u.username}"></td>
                    <td>
                        <select id="u-role-${u.id}">
                            <option value="user" ${u.role === 'user' ? 'selected' : ''}>کاربر عادی</option>
                            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>ادمین ناظر</option>
                            <option value="super_admin" ${u.role === 'super_admin' ? 'selected' : ''}>سوپر ادمین</option>
                        </select>
                    </td>
                    <td><input type="number" id="u-wallet-${u.id}" value="${u.wallet_balance}"></td>
                    <td>
                        <button class="btn btn-sm btn-approve" onclick="updateUser(${u.id})" style="width:100%;">ذخیره</button>
                    </td>
                </tr>
            `).join('');
        } else {
            throw new Error(data.error || 'دسترسی غیرمجاز');
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:var(--error-color);">خطا: ${e.message}</td></tr>`;
    }
}

async function updateUser(id) {
    if (!confirm('آیا از تغییر اطلاعات این کاربر اطمینان دارید؟')) return;
    
    const payload = {
        id: id,
        username: document.getElementById(`u-name-${id}`).value,
        role: document.getElementById(`u-role-${id}`).value,
        wallet_balance: document.getElementById(`u-wallet-${id}`).value
    };

    try {
        const res = await fetch('/api/admin/users.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) showAlert('کاربر با موفقیت بروزرسانی شد', 'success');
        else showAlert(data.error, 'error');
    } catch (e) {
        showAlert('خطا در ثبت اطلاعات', 'error');
    }
}

// -------------------------------------------------------------
// Advanced Pricing (Super Admin)
// -------------------------------------------------------------
async function updateChapterPrice(e) {
    e.preventDefault();
    if (!confirm('آیا قیمت این چپتر به همین مقدار تغییر کند؟')) return;

    const priceInput = document.getElementById('target_chapter_price').value;
    const payload = {
        chapter_id: document.getElementById('target_chapter_id').value,
        price: priceInput === "" ? null : priceInput
    };

    try {
        const res = await fetch('/api/admin/prices.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            showAlert(data.message, 'success');
            document.getElementById('chapter-price-form').reset();
        } else {
            showAlert(data.error, 'error');
        }
    } catch (e) {
        showAlert('خطا در ارتباط با سرور', 'error');
    }
}

// -------------------------------------------------------------
// DB Backup & Restore (Super Admin)
// -------------------------------------------------------------
// Note: Backup is just a link to GET /api/admin/backup.php

async function restoreDatabase(e) {
    e.preventDefault();
    if (!confirm('اخطار! آیا مطمئن هستید که می‌خواهید دیتابیس فعلی را کاملا جایگزین کنید؟ این عملیات غیرقابل بازگشت است.')) return;
    
    const fileInput = document.getElementById('db_sql_file');
    if (!fileInput.files.length) return;

    const formData = new FormData();
    formData.append('backup_file', fileInput.files[0]);

    const statusEl = document.getElementById('restore-status');
    statusEl.innerHTML = '<span style="color:var(--accent-color);">در حال پردازش پایگاه داده، لطفا صبر کنید...</span>';

    try {
        const res = await fetch('/api/admin/restore.php', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            statusEl.innerHTML = `<span style="color:var(--success-color);">${data.message}</span>`;
            showAlert('سیستم با موفقیت بازیابی شد.', 'success');
            setTimeout(() => window.location.reload(), 2000); // Reload everything
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        statusEl.innerHTML = `<span style="color:var(--error-color);">خطا: ${err.message}</span>`;
        showAlert('عملیات ناموفق.', 'error');
    }
}
