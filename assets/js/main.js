// main.js - Core functionality for Mangata UI

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for app updates (Simulated logic for now)
    checkAppVersion();

    // Init Hero Slider
    initHeroSlider();

    // 2. Fetch and render Mangas
    fetchMangas('latest-mangas', '/api/manhwa/list.php?type=latest');
    fetchMangas('recommended-mangas', '/api/manhwa/list.php?type=recommended');
    fetchMangas('popular-mangas', '/api/manhwa/list.php?type=popular');

    // Fetch other lists from backend
    fetchList('stories-list', '/api/stories/list.php', renderStory);
    fetchList('discounts-list', '/api/discounts/list.php', renderDiscount);
    fetchList('news-list', '/api/news/list.php', renderNews);
    fetchList('team-list', '/api/team/list.php', renderTeam);

    // 3. Search functionality
    setupSearch();
});

// Variable for slider
let currentSlide = 0;
let totalSlides = 0;
let slideInterval;

async function initHeroSlider() {
    const container = document.getElementById('hero-slider-container');
    const indicatorsData = document.getElementById('slider-indicators');
    if (!container) return;

    try {
        const response = await fetch('/api/manhwa/list.php?type=popular');
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data && result.data.length > 0) {
                // limit slider to top 5
                const slides = result.data.slice(0, 5);
                totalSlides = slides.length;
                container.innerHTML = '';
                indicatorsData.innerHTML = '';

                slides.forEach((manga, idx) => {
                    const coverImage = manga.cover_image && manga.cover_image !== '/assets/images/default-cover.jpg' ? manga.cover_image : '';
                    const hue = Math.floor(Math.random() * 360);
                    const backgroundStyle = coverImage 
                        ? `background-image: url('${coverImage}');`
                        : `background: linear-gradient(45deg, hsl(${hue}, 40%, 20%), hsl(${hue + 40}, 50%, 30%));`;

                    const slide = document.createElement('div');
                    slide.className = 'hero-slide';
                    slide.style.cssText = backgroundStyle;
                    slide.innerHTML = `<div class="hero-content">
                        <span class="hero-tag">انتخاب مدیریت</span>
                        <h2>${manga.title}</h2>
                        <p>${manga.description ? manga.description.substring(0, 150) + '...' : 'توضیحاتی برای این مانگا ثبت نشده است.'}</p>
                        <div class="hero-actions">
                            <a href="/manga.html?id=${manga.id}" class="btn-hero">شروع خواندن</a>
                            <a href="/manga.html?id=${manga.id}" class="btn-outline-hero">جزئیات بیشتر</a>
                        </div>
                    </div>`;
                    container.appendChild(slide);

                    // Add indicator
                    const ind = document.createElement('div');
                    ind.className = `indicator ${idx === 0 ? 'active' : ''}`;
                    ind.onclick = () => goToSlide(idx);
                    indicatorsData.appendChild(ind);
                });

                startSlider();
                return;
            }
        }
    } catch (e) {
        console.log(`Failed to load slider`);
    }

    container.innerHTML = `<div class="slider-placeholder">
        <h2>مانگاتا</h2>
        <p>هیچ اثری یافت نشد</p>
    </div>`;
}

function updateSliderUI() {
    const container = document.getElementById('hero-slider-container');
    const indicators = document.querySelectorAll('.indicator');
    if (!container || indicators.length === 0) return;
    
    container.style.transform = `translateX(${currentSlide * 100}%)`;
    indicators.forEach((ind, idx) => {
        ind.className = `indicator ${idx === currentSlide ? 'active' : ''}`;
    });
}

window.moveSlide = function(dir) {
    currentSlide += dir;
    if (currentSlide >= totalSlides) currentSlide = 0;
    if (currentSlide < 0) currentSlide = totalSlides - 1;
    updateSliderUI();
    resetSliderInterval();
}

window.goToSlide = function(idx) {
    currentSlide = idx;
    updateSliderUI();
    resetSliderInterval();
}

function startSlider() {
    slideInterval = setInterval(() => { window.moveSlide(1); }, 5000);
}

function resetSliderInterval() {
    clearInterval(slideInterval);
    startSlider();
}

// Generic Fetch List Function
async function fetchList(containerId, endpoint, renderFn) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    try {
        const response = await fetch(endpoint);
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data && result.data.length > 0) {
                container.innerHTML = '';
                result.data.forEach(item => {
                    container.appendChild(renderFn(item));
                });
                
                // If this is the stories list, setup click handlers
                if (containerId === 'stories-list') {
                    setupStories();
                }
                return;
            }
        }
    } catch (e) {
        console.log(`Failed to fetch ${endpoint}`);
    }
    
    // Empty state
    container.innerHTML = `<div style="padding: 1rem; color: var(--text-secondary); text-align: center; width: 100%; border: 1px dashed var(--border-color); border-radius: 8px;">موردی یافت نشد.</div>`;
}

// Render Functions
function renderStory(item) {
    const div = document.createElement('div');
    div.className = 'story-item';
    div.innerHTML = `
        <div class="story-ring ${item.has_unseen ? 'unread' : ''}">
            <div class="story-avatar" style="${item.avatar ? `background-image:url(${item.avatar});background-size:cover;` : ''}">${item.avatar ? '' : (item.name?.[0] || 'A')}</div>
        </div>
        <span class="story-author">${item.name || 'کاربر'}</span>
    `;
    // store media info in dataset for the viewer later
    if(item.media_url) div.dataset.media = item.media_url; 
    return div;
}

function renderDiscount(item) {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
        <div class="item-icon discount-icon">%</div>
        <div class="item-details">
            <h4>${item.title}</h4>
            <span class="item-meta">${item.time_ago || 'جدید'}</span>
        </div>
    `;
    return div;
}

function renderNews(item) {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
        <div class="item-icon news-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        </div>
        <div class="item-details">
            <h4>${item.title}</h4>
            <span class="item-meta">${item.time_ago || 'جدید'}</span>
        </div>
    `;
    return div;
}

function renderTeam(item) {
    const div = document.createElement('div');
    div.className = 'team-card';
    div.innerHTML = `
        <div class="avatar" style="${item.avatar ? `background-image:url(${item.avatar});background-size:cover;` : ''}">${item.avatar ? '' : (item.name?.[0] || 'U')}</div>
        <h4>${item.name}</h4>
        <span>${item.role}</span>
    `;
    return div;
}

// ================= API FETCHING =================
async function fetchMangas(gridId, endpoint) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    let data = [];
    let success = false;

    try {
        const response = await fetch(endpoint);
        if (response.ok) {
            const result = await response.json();
            success = result.success;
            data = result.data || [];
        }
    } catch (err) {
        console.log(`Failed to fetch from ${endpoint}`, err);
    }

    if (!success || data.length === 0) {
        grid.innerHTML = '<div style="padding: 2rem; color: var(--text-secondary); text-align: center; width: 100%;">محصولی یافت نشد یا در حال راه‌اندازی است.</div>';
        return;
    }

    grid.innerHTML = ''; // clear any existing content
    
    data.forEach(manga => {
        const card = document.createElement('div');
        card.className = 'manga-card';
        card.onclick = () => window.location.href = `/manga.html?id=${manga.id}`;
        
        const coverImage = manga.cover_image || '';
        const chapterText = manga.chapter || 'جدید';
        
        // Using a background placeholder if cover_image is missing or default
        const hue = Math.floor(Math.random() * 360);
        const backgroundStyle = coverImage && coverImage !== '/assets/images/default-cover.jpg'
            ? `background-image: url('${coverImage}'); background-size: cover; background-position: center;`
            : `background: linear-gradient(45deg, hsl(${hue}, 40%, 20%), hsl(${hue + 40}, 50%, 30%));`;
        
        card.innerHTML = `
            <div class="manga-cover" style="${backgroundStyle}">
                <div class="manga-badge">${chapterText}</div>
            </div>
            <div class="manga-info">
                <h3 class="manga-title">${manga.title}</h3>
                <p class="manga-meta">${manga.description ? manga.description.substring(0, 30) + '...' : 'بدون توضیحات'}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}


// ================= MODALS & ALERTS =================

// Recruitment Modal
function openRecruitmentModal() {
    document.getElementById('recruitment-modal').style.display = 'flex';
}

function closeRecruitmentModal() {
    document.getElementById('recruitment-modal').style.display = 'none';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('recruitment-modal');
    if (event.target === modal) {
        closeRecruitmentModal();
    }
}

// Handle Recruitment Form Submit
document.getElementById('recruitment-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('درخواست شما با موفقیت ثبت شد! پس از بررسی با شما تماس خواهیم گرفت.');
    closeRecruitmentModal();
});

// Update Banner
function checkAppVersion() {
    const currentVersion = localStorage.getItem('mangata_version');
    const NEW_VERSION = '1.0.1'; // Can be fetched from settings API
    
    if (currentVersion !== NEW_VERSION) {
        document.getElementById('system-update-banner').style.display = 'block';
        localStorage.setItem('mangata_version', NEW_VERSION);
    }
}

function hideUpdateBanner() {
    document.getElementById('system-update-banner').style.display = 'none';
    window.location.reload(); // Force reload to get new SW caching
}

// ================= SEARCH =================
function setupSearch() {
    const searchInput = document.getElementById('main-search');
    const dropdown = document.getElementById('search-dropdown');
    
    // Simple debounce function
    let timeout = null;
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(timeout);
        
        if (query.length < 2) {
            dropdown.style.display = 'none';
            return;
        }

        timeout = setTimeout(() => {
            // Simulated API search response
            dropdown.innerHTML = `
                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.5rem; position: absolute; width: 100%; top: 100%; left: 0; box-shadow: var(--shadow-lg);">
                    <div style="padding: 0.5rem; border-bottom: 1px solid var(--border-color); cursor:pointer;">نتیجه یافت شده برای: ${query}</div>
                    <div style="padding: 0.5rem; color:var(--text-secondary); text-align:center; font-size: 0.8rem;">در حال توسعه...</div>
                </div>
            `;
            dropdown.style.display = 'block';
        }, 300);
    });
}

// ================= STORIES =================
function setupStories() {
    const stories = document.querySelectorAll('.story-item');
    stories.forEach(story => {
        story.addEventListener('click', () => {
            document.getElementById('story-viewer').style.display = 'flex';
            const ring = story.querySelector('.story-ring');
            if (ring) ring.classList.remove('unread');
            
            // Simple progress bar animation
            const progress = document.getElementById('story-progress');
            progress.style.width = '0%';
            
            // Wait a tick for CSS transition to reset
            setTimeout(() => {
                progress.style.width = '100%';
                progress.style.transition = 'width 5s linear';
            }, 50);

            // Close automatically after 5s
            window.storyTimeout = setTimeout(closeStoryViewer, 5000);
        });
    });
}

function closeStoryViewer() {
    document.getElementById('story-viewer').style.display = 'none';
    const progress = document.getElementById('story-progress');
    progress.style.transition = 'none';
    progress.style.width = '0%';
    clearTimeout(window.storyTimeout);
}
