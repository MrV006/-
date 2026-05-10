let currentUserRole = 'admin';

document.addEventListener('DOMContentLoaded', async () => {
    try { await fetch('/api/admin/setup_db.php', { credentials: 'include' }); } catch(e){}
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

    const sections = ['dashboard', 'manga', 'receipts', 'comments', 'users', 'pricing', 'restore', 'analytics', 'seo', 'tickets', 'staff_uploads', 'notifications'];
    sections.forEach(s => {
        const el = document.getElementById(`section-${s}`);
        if(el) el.style.display = 'none';
    });
    
    const targetEl = document.getElementById(`section-${sectionId}`);
    if (targetEl) targetEl.style.display = 'block';

    if (sectionId === 'receipts') fetchReceipts();
    if (sectionId === 'users' && currentUserRole === 'super_admin') fetchUsers();
    if (sectionId === 'analytics') loadAnalytics();
    if (sectionId === 'seo') initSeoSection();
    if (sectionId === 'tickets') loadAdminTickets();
    if (sectionId === 'manga') fetchAdminMangasList();
    if (sectionId === 'staff_uploads') fetchStaffUploadsAdmin();
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
            if(document.getElementById('staff_chapter_reward')) document.getElementById('staff_chapter_reward').value = data.settings.staff_chapter_reward || 1;
            if(document.getElementById('recruitment_contact')) document.getElementById('recruitment_contact').value = data.settings.recruitment_contact || '';
            if(document.getElementById('recruitment_file_path')) document.getElementById('recruitment_file_path').value = data.settings.recruitment_file_path || '';
            if(document.getElementById('footer_text')) document.getElementById('footer_text').value = data.settings.footer_text || '';
            if(document.getElementById('rules_text')) document.getElementById('rules_text').value = data.settings.rules_text || '';
            if(document.getElementById('zarinpal_enabled')) document.getElementById('zarinpal_enabled').value = data.settings.zarinpal_enabled ? 1 : 0;
            if(document.getElementById('zarinpal_merchant_id')) document.getElementById('zarinpal_merchant_id').value = data.settings.zarinpal_merchant_id || '';
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
        staff_chapter_reward: document.getElementById('staff_chapter_reward') ? document.getElementById('staff_chapter_reward').value : 1,
        recruitment_contact: document.getElementById('recruitment_contact') ? document.getElementById('recruitment_contact').value : '',
        recruitment_file_path: document.getElementById('recruitment_file_path') ? document.getElementById('recruitment_file_path').value : '',
        footer_text: document.getElementById('footer_text') ? document.getElementById('footer_text').value : '',
        rules_text: document.getElementById('rules_text') ? document.getElementById('rules_text').value : '',
        zarinpal_enabled: document.getElementById('zarinpal_enabled') ? document.getElementById('zarinpal_enabled').value : 0,
        zarinpal_merchant_id: document.getElementById('zarinpal_merchant_id') ? document.getElementById('zarinpal_merchant_id').value : ''
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
                    <strong>
                        ${c.is_pinned ? '<span style="color:var(--accent-color); font-size:0.8rem;">[سنجاق شده]</span> ' : ''}
                        ${c.username} ${c.role !== 'user' ? '<span style="color:var(--accent-color); font-size:0.7rem;">(ادمین)</span>' : ''}
                    </strong>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem; color:var(--text-primary); white-space:pre-wrap;">${c.content}</p>
                    <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">${c.created_at}</p>
                </div>
                <div class="item-actions">
                    ${currentUserRole === 'super_admin' ? `<button class="btn btn-sm" onclick="pinComment(${c.id}, ${c.is_pinned})" style="background:var(--accent-color);">${c.is_pinned ? 'برداشتن سنجاق' : 'سنجاق کردن'}</button>` : ''}
                    <button class="btn-reject" onclick="deleteComment(${c.id})">حذف</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = `<p style="color: var(--error-color);">خطا: ${e.message}</p>`;
    }
}

async function pinComment(id, currentState) {
    try {
        const res = await fetch('/api/comments/pin.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, pin: currentState ? 0 : 1 })
        });
        const data = await res.json();
        if (res.ok) {
            showAlert('وضعیت سنجاق تغییر کرد.', 'success');
            loadComments();
        } else {
            showAlert(data.error, 'error');
        }
    } catch (e) {
        showAlert('خطا.', 'error');
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
                        <div style="display:flex; gap:0.5rem;">
                            <button class="btn btn-sm btn-approve" onclick="updateUser(${u.id})">ذخیره</button>
                            <button class="btn btn-sm" onclick="openGiftModal(${u.id}, '${u.username}')" style="background:#8b5cf6;">هدیه چپتر</button>
                        </div>
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
// Gift Chapter (Super Admin)
// -------------------------------------------------------------
function openGiftModal(userId, username) {
    document.getElementById('gift_user_id').value = userId;
    document.getElementById('gift_username').value = username;
    document.getElementById('gift_chapter_id').value = '';
    document.getElementById('gift-modal').style.display = 'flex';
}

function closeGiftModal() {
    document.getElementById('gift-modal').style.display = 'none';
}

async function submitGiftChapter(e) {
    e.preventDefault();
    const userId = document.getElementById('gift_user_id').value;
    const chapterId = document.getElementById('gift_chapter_id').value;

    try {
        const res = await fetch('/api/admin/gift_chapter.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, chapter_id: chapterId })
        });
        const data = await res.json();
        if (res.ok) {
            showAlert('چپتر با موفقیت هدیه داده شد.', 'success');
            closeGiftModal();
        } else {
            showAlert(data.error || 'خطا در انجام عملیات', 'error');
        }
    } catch (e) {
        showAlert('خطا در ارتباط با سرور.', 'error');
    }
}

// -------------------------------------------------------------
// Manage Tickets (Admin & Super Admin)
// -------------------------------------------------------------
async function loadAdminTickets() {
    const container = document.getElementById('admin-tickets-container');
    container.innerHTML = '<p style="color: var(--text-muted);">در حال بارگذاری...</p>';

    try {
        const res = await fetch('/api/tickets/admin_list.php', { credentials: 'include' });
        const data = await res.json();

        if (res.ok && data.tickets) {
            if (data.tickets.length === 0) {
                container.innerHTML = '<p style="color: var(--text-muted);">تیکت فعالی وجود ندارد.</p>';
                return;
            }

            container.innerHTML = data.tickets.map(t => `
                <div class="item-row" style="flex-direction: column; align-items: stretch; gap: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${t.subject}</strong> <span style="font-size:0.8rem; color:var(--text-muted);">توسط: ${t.username}</span>
                        </div>
                        <span class="status-badge ${t.status === 'open' ? 'status-open' : (t.status === 'answered' ? 'status-answered' : 'status-closed')}" style="padding:4px 8px; border-radius:4px;">وضعیت: ${t.status}</span>
                    </div>
                    ${t.status !== 'closed' ? `
                    <div style="display:flex; gap: 1rem;">
                        <input type="text" id="ticket-reply-${t.id}" style="flex:1; padding:0.5rem; border-radius:4px; background:var(--bg-surface); border:1px solid var(--border-color); color:white;" placeholder="پاسخ سریع به این تیکت...">
                        <button class="btn btn-sm btn-approve" onclick="adminReplyTicket(${t.id})" style="width:100px;">ثبت پاسخ</button>
                        <button class="btn btn-sm" onclick="closeTicket(${t.id})" style="background:var(--error-color);">بستن تیکت</button>
                    </div>
                    ` : ''}
                </div>
            `).join('');
        }
    } catch (e) {
        container.innerHTML = `<p style="color:var(--error-color);">خطا در بارگذاری تیکت‌ها.</p>`;
    }
}

async function adminReplyTicket(ticketId) {
    const message = document.getElementById(`ticket-reply-${ticketId}`).value;
    if (!message) return;

    try {
        const res = await fetch('/api/tickets/admin_reply.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticket_id: ticketId, message })
        });
        if (res.ok) {
            showAlert('پاسخ ثبت شد.', 'success');
            loadAdminTickets();
        }
    } catch (e) {
        showAlert('خطا', 'error');
    }
}

async function closeTicket(ticketId) {
    if (!confirm('آیا از بستن این تیکت اطمینان دارید؟')) return;
    try {
        const res = await fetch('/api/tickets/admin_close.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticket_id: ticketId })
        });
        if (res.ok) {
            showAlert('تیکت بسته شد.', 'success');
            loadAdminTickets();
        }
    } catch (e) {
        showAlert('خطا', 'error');
    }
}

// -------------------------------------------------------------
// Analytics
// -------------------------------------------------------------
async function loadAnalytics() {
    try {
        const res = await fetch('/api/admin/analytics.php', { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data.success) {
            document.getElementById('analytics-stats').innerHTML = `
                <div style="background:var(--bg-primary); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-color); text-align:center;">
                    <h4 style="color:var(--text-muted); margin-bottom:0.5rem;">کل درآمد فروشگاه</h4>
                    <span style="font-size:1.5rem; font-weight:bold; color:var(--accent-color);">${new Intl.NumberFormat('fa-IR').format(data.stats.total_revenue)} تومان</span>
                </div>
                <div style="background:var(--bg-primary); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-color); text-align:center;">
                    <h4 style="color:var(--text-muted); margin-bottom:0.5rem;">تعداد چپترهای فروخته شده</h4>
                    <span style="font-size:1.5rem; font-weight:bold;">${new Intl.NumberFormat('fa-IR').format(data.stats.total_chapters_sold)}</span>
                </div>
            `;
            // Render D3 chart
            const container = document.getElementById('chart-container');
            container.innerHTML = ''; // clear old
            
            if(data.stats.manga_stats && data.stats.manga_stats.length > 0) {
                renderD3Chart(data.stats.manga_stats);
            } else {
                container.innerHTML = '<span style="color: var(--text-muted);">اطلاعاتی برای نمایش نمودار وجود ندارد.</span>';
            }
        }
    } catch (e) {
        console.error(e);
    }
}

function renderD3Chart(data) {
    const container = document.getElementById('chart-container');
    const width = container.clientWidth;
    const height = 400;
    const margin = {top: 20, right: 30, bottom: 40, left: 90};

    // Append svg
    const svg = d3.select("#chart-container")
      .append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X axis
    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => +d.revenue)])
      .range([0, width - margin.left - margin.right]);
      
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Y axis
    const y = d3.scaleBand()
      .range([0, height - margin.top - margin.bottom])
      .domain(data.map(d => d.title))
      .padding(.1);
      
    svg.append("g")
      .call(d3.axisLeft(y));

    // Bars
    svg.selectAll("myRect")
      .data(data)
      .join("rect")
      .attr("x", x(0) )
      .attr("y", d => y(d.title))
      .attr("width", d => x(+d.revenue))
      .attr("height", y.bandwidth())
      .attr("fill", "#3b82f6");
}

// -------------------------------------------------------------
// DB Backup & Restore (Super Admin)
// -------------------------------------------------------------
async function uploadStaffFile(e) {
    e.preventDefault();
    const fileInput = document.getElementById('staff_file');
    if (!fileInput.files.length) return;

    if (!fileInput.files[0].name.toLowerCase().endsWith('.webp')) {
        showAlert('فقط عکس با فرمت webp مجاز است.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('chapter_id', document.getElementById('staff_chapter_id').value);
    formData.append('role', document.getElementById('staff_role').value);

    try {
        const res = await fetch('/api/admin/staff_upload.php', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            showAlert('آپلود با موفقیت انجام شد.', 'success');
            document.getElementById('staff-upload-form').reset();
        } else {
            showAlert(data.error || 'خطا در آپلود', 'error');
        }
    } catch (err) {
        showAlert('خطا در آپلود', 'error');
    }
}

async function sendNotification(e) {
    e.preventDefault();
    const payload = {
        user_id: document.getElementById('notif_user_id').value,
        message: document.getElementById('notif_message').value,
        is_popup: document.getElementById('notif_is_popup').checked ? 1 : 0
    };
    try {
        const res = await fetch('/api/admin/notify.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            showAlert('نوتیفیکیشن با موفقیت ارسال شد.', 'success');
            document.getElementById('notification-form').reset();
        } else {
            showAlert(data.error, 'error');
        }
    } catch (err) {
        showAlert('خطا در ارسال.', 'error');
    }
}

// -------------------------------------------------------------
// Manga Management (Upload/Create)
// -------------------------------------------------------------
async function fetchAdminMangasList() {
    try {
        const res = await fetch('/api/manhwa/list.php');
        const data = await res.json();
        
        const select = document.getElementById('admin_manga_select');
        select.innerHTML = '<option value="">برای انتخاب، مانهوا را برگزینید</option>';
        if (res.ok && data.success && data.data) {
            data.data.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = m.title;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.error('Failed to load mangas');
    }
}

async function createManga(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', document.getElementById('new_manga_title').value);
    formData.append('genres', document.getElementById('new_manga_genres').value);
    formData.append('description', document.getElementById('new_manga_desc').value);
    formData.append('cover', document.getElementById('new_manga_cover').files[0]);

    try {
        const res = await fetch('/api/admin/create_manga.php', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            showAlert(data.message, 'success');
            document.getElementById('create-manga-form').reset();
            fetchAdminMangasList();
        } else {
            showAlert(data.error, 'error');
        }
    } catch (e) {
        showAlert('خطا در سرور', 'error');
    }
}

async function loadAdminMangaChapters() {
    const mangaId = document.getElementById('admin_manga_select').value;
    const container = document.getElementById('admin-manga-chapters');
    
    if (!mangaId) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    const listDiv = document.getElementById('admin-chapters-list');
    listDiv.innerHTML = '<p>در حال بارگذاری چپترها...</p>';
    
    try {
        const res = await fetch(`/api/manhwa/detail.php?id=${mangaId}`);
        const data = await res.json();
        if (res.ok && data.success && data.manga && data.manga.chapters) {
            if (data.manga.chapters.length === 0) {
                listDiv.innerHTML = '<p style="color:var(--text-muted);">چپتری یافت نشد.</p>';
            } else {
                listDiv.innerHTML = data.manga.chapters.map(c => `
                    <div style="padding: 0.5rem; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between;">
                        <span>چپتر ${c.number}: ${c.title || ''}</span>
                        <span style="color:var(--text-muted); font-size:0.8rem;">ID: ${c.id}</span>
                    </div>
                `).join('');
            }
        }
    } catch (e) {
        listDiv.innerHTML = '<p style="color:var(--error-color);">خطا در بارگذاری چپترها</p>';
    }
}

async function createChapter(e) {
    e.preventDefault();
    const mangaId = document.getElementById('admin_manga_select').value;
    if (!mangaId) {
        showAlert('لطفا یک مانهوا انتخاب کنید', 'error'); return;
    }
    
    const payload = {
        manga_id: mangaId,
        chapter_number: document.getElementById('new_chapter_number').value,
        title: document.getElementById('new_chapter_title').value,
        price: document.getElementById('new_chapter_price').value
    };
    
    try {
        const res = await fetch('/api/admin/create_chapter.php', {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            showAlert(data.message, 'success');
            document.getElementById('create-chapter-form').reset();
            loadAdminMangaChapters();
        } else {
            showAlert(data.error, 'error');
        }
    } catch (e) {
        showAlert('خطا در سرور', 'error');
    }
}

// -------------------------------------------------------------
// Staff Uploads Admin Review
// -------------------------------------------------------------
async function fetchStaffUploadsAdmin() {
    const container = document.getElementById('admin-staff-uploads-container');
    container.innerHTML = '<p style="color:var(--text-muted);">در حال بارگذاری...</p>';
    
    try {
        const res = await fetch('/api/admin/staff_uploads_list.php', {credentials: 'include'});
        const data = await res.json();
        
        if (res.ok && data.uploads) {
            if (data.uploads.length === 0) {
                container.innerHTML = '<p style="color:var(--text-muted);">هیچ فایل جدیدی برای بررسی وجود ندارد.</p>';
            } else {
                container.innerHTML = data.uploads.map(u => `
                    <div class="item-row" id="staff-upload-${u.id}">
                        <div>
                            <strong>فایل: ${u.original_name || 'نامشخص'} (چپتر ${u.chapter_id})</strong>
                            <p style="font-size:0.875rem; color:var(--text-secondary); margin-top:0.25rem;">نقش: ${u.role === 'translator' ? 'مترجم' : (u.role === 'editor' ? 'تایپیست/ادیتور' : 'کلینر')} | ارسال توسط کاربر ID: ${u.user_id}</p>
                            <p style="font-size:0.75rem; color:var(--text-muted);">${u.created_at}</p>
                        </div>
                        <div class="item-actions">
                            <a href="/${u.file_path}" target="_blank" class="btn" style="text-decoration:none; margin-right:0.5rem; display:inline-block; width:auto; background:var(--bg-surface); border:1px solid var(--border-color);">دانلود/مشاهده</a>
                            <button class="btn-approve" onclick="handleStaffUpload(${u.id}, 'approve')">تایید</button>
                            <button class="btn-reject" onclick="handleStaffUpload(${u.id}, 'reject')">رد</button>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (e) {
        container.innerHTML = '<p style="color:var(--error-color);">خطا در بارگذاری لیست.</p>';
    }
}

async function handleStaffUpload(uploadId, action) {
    if (!confirm(`آیا از ${action === 'approve' ? 'تایید' : 'رد'} این فایل اطمینان دارید؟`)) return;
    
    try {
        const res = await fetch('/api/admin/staff_upload_action.php', {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ upload_id: uploadId, action: action })
        });
        const data = await res.json();
        if (res.ok) {
            showAlert('عملیات با موفقیت انجام شد.', 'success');
            document.getElementById(`staff-upload-${uploadId}`).remove();
        } else {
            showAlert(data.error, 'error');
        }
    } catch (e) {
        showAlert('خطا در شبکه.', 'error');
    }
}

// -------------------------------------------------------------
// SEO Management
// -------------------------------------------------------------
async function initSeoSection() {
    try {
        const res = await fetch('/api/admin/seo_get.php?type=site', { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data.success && data.seo) {
            document.getElementById('seo_site_title').value = data.seo.title || '';
            document.getElementById('seo_site_description').value = data.seo.description || '';
            document.getElementById('seo_site_keywords').value = data.seo.keywords || '';
        }

        // populate manga select
        const mRes = await fetch('/api/manhwa/list.php');
        const mData = await mRes.json();
        const mSelect = document.getElementById('seo_manga_select');
        mSelect.innerHTML = '<option value="">برای انتخاب، مانهوا را برگزینید...</option>';
        if (mRes.ok && mData.success && mData.data) {
            mData.data.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = m.title;
                mSelect.appendChild(opt);
            });
        }
        
        // populate genre select (hardcoded or from db, we will fetch from seo_get.php for existing genres + basic list)
        const gRes = await fetch('/api/admin/seo_get.php?type=genres', { credentials: 'include' });
        const gData = await gRes.json();
        const gSelect = document.getElementById('seo_genre_select');
        const defaultGenres = ['اکشن', 'فانتزی', 'درام', 'عاشقانه', 'ماجراجویی', 'کمدی', 'ایسکای', 'شبیه‌ساز', 'ترسناک'];
        let allGenres = new Set(defaultGenres);
        
        if (gRes.ok && gData.success && gData.genres) {
            gData.genres.forEach(g => allGenres.add(g.genre));
        }
        
        gSelect.innerHTML = '<option value="">برای انتخاب، ژانر را برگزینید...</option>';
        allGenres.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g;
            opt.textContent = g;
            gSelect.appendChild(opt);
        });

    } catch (e) {}
}

async function saveSiteSeo(e) {
    e.preventDefault();
    const payload = {
        type: 'site',
        title: document.getElementById('seo_site_title').value,
        description: document.getElementById('seo_site_description').value,
        keywords: document.getElementById('seo_site_keywords').value
    };
    await submitSeo(payload);
}

async function loadMangaSeo() {
    const id = document.getElementById('seo_manga_select').value;
    const form = document.getElementById('seo-manga-form');
    if (!id) { form.style.display = 'none'; return; }
    
    try {
        const res = await fetch(`/api/admin/seo_get.php?type=manga&id=${id}`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data.success) {
            document.getElementById('seo_manga_title').value = data.seo.title || '';
            document.getElementById('seo_manga_description').value = data.seo.description || '';
            document.getElementById('seo_manga_keywords').value = data.seo.keywords || '';
            form.style.display = 'block';
        }
    } catch(e){}
}

async function saveMangaSeo(e) {
    e.preventDefault();
    const payload = {
        type: 'manga',
        id: document.getElementById('seo_manga_select').value,
        title: document.getElementById('seo_manga_title').value,
        description: document.getElementById('seo_manga_description').value,
        keywords: document.getElementById('seo_manga_keywords').value
    };
    await submitSeo(payload);
}

async function loadGenreSeo() {
    const genre = document.getElementById('seo_genre_select').value;
    const form = document.getElementById('seo-genre-form');
    if (!genre) { form.style.display = 'none'; return; }
    
    try {
        const res = await fetch(`/api/admin/seo_get.php?type=genre&genre=${encodeURIComponent(genre)}`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data.success) {
            document.getElementById('seo_genre_title').value = data.seo?.title || '';
            document.getElementById('seo_genre_description').value = data.seo?.description || '';
            document.getElementById('seo_genre_keywords').value = data.seo?.keywords || '';
            form.style.display = 'block';
        }
    } catch(e){}
}

async function saveGenreSeo(e) {
    e.preventDefault();
    const payload = {
        type: 'genre',
        genre: document.getElementById('seo_genre_select').value,
        title: document.getElementById('seo_genre_title').value,
        description: document.getElementById('seo_genre_description').value,
        keywords: document.getElementById('seo_genre_keywords').value
    };
    await submitSeo(payload);
}

async function submitSeo(payload) {
    try {
        const res = await fetch('/api/admin/seo_save.php', {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showAlert('تنظیمات سئو با موفقیت ذخیره شد.', 'success');
        } else {
            showAlert(data.error || 'خطا در ذخیره سئو', 'error');
        }
    } catch(e) {
        showAlert('خطا در ارتباط با سرور', 'error');
    }
}

// -------------------------------------------------------------
// Final DB Backup
// -------------------------------------------------------------
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
            setTimeout(() => window.location.reload(), 2000);
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        statusEl.innerHTML = `<span style="color:var(--error-color);">خطا: ${err.message}</span>`;
        showAlert('عملیات ناموفق.', 'error');
    }
}

