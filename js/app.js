/* ===========================
   KAIROS APP - GLOBAL UTILITIES
   =========================== */

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('kairos_theme') || 'light-mode';
    document.body.className = savedTheme;
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    const newTheme = isDark ? 'light-mode' : 'dark-mode';
    
    document.body.classList.remove('dark-mode', 'light-mode');
    document.body.classList.add(newTheme);
    
    localStorage.setItem('kairos_theme', newTheme);
}

// Toast Notifications
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${getIconForType(type)}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${capitalizeFirst(type)}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function getIconForType(type) {
    const icons = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-circle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Modal Management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function createConfirmDialog(title, message, onConfirm, onCancel) {
    return new Promise((resolve) => {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop active';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.maxWidth = '400px';
        modal.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${title}</h2>
                <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p style="color: var(--text-secondary);">${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Cancel</button>
                <button class="btn btn-danger">Confirm</button>
            </div>
        `;
        
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
        
        const confirmBtn = modal.querySelector('.btn-danger');
        confirmBtn.addEventListener('click', () => {
            backdrop.remove();
            resolve(true);
            if (onConfirm) onConfirm();
        });
        
        const cancelBtn = modal.querySelector('.btn-secondary');
        cancelBtn.addEventListener('click', () => {
            if (onCancel) onCancel();
        });
    });
}

// Drawer/Slide Modal
function openDrawer(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (drawer) {
        drawer.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeDrawer(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (drawer) {
        drawer.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const currentPage = getCurrentPage();
    
    navItems.forEach(item => {
        const href = item.getAttribute('href') || item.getAttribute('data-page');
        if (href && href.includes(currentPage)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
        
        item.addEventListener('click', function(e) {
            if (this.hasAttribute('href')) {
                return;
            }
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page) {
                window.location.href = page;
            }
        });
    });
}

function getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop().replace('.html', '') || 'dashboard';
}

// Sidebar toggle for mobile
function setupSidebarToggle() {
    const toggleBtn = document.querySelector('.navbar-toggle');
    const sidebar = document.querySelector('.sidebar');

    // Inject logo into navbar next to hamburger (visible on all screen sizes)
    const navbarLeft = document.querySelector('.navbar-left');
    if (navbarLeft && toggleBtn && !navbarLeft.querySelector('.navbar-logo-img')) {
        const logoImg = document.createElement('img');
        logoImg.src = '1000669890-Photoroom.png';
        logoImg.alt = 'Kairos';
        logoImg.className = 'navbar-logo-img';
        logoImg.style.cssText = 'width:48px;height:48px;object-fit:contain;margin-left:8px;cursor:pointer;filter:drop-shadow(0 0 6px rgba(108,99,255,0.35));flex-shrink:0;';
        logoImg.onclick = () => window.location.href = 'dashboard.html';
        toggleBtn.insertAdjacentElement('afterend', logoImg);
    }

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
            toggleBtn.classList.toggle('active');
        });
        
        // Function to close sidebar and reset hamburger
        function closeSidebarAndReset() {
            sidebar.classList.remove('active');
            document.body.classList.remove('sidebar-open');
            toggleBtn.classList.remove('active');
        }
        
        // Close sidebar when clicking on nav links and navigate after animation
        const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href) {
                    e.preventDefault();
                    closeSidebarAndReset();
                    // Navigate after sidebar animation completes
                    setTimeout(() => {
                        window.location.href = href;
                    }, 300);
                }
            });
        });
        
        // Close sidebar on logout button (doesn't navigate)
        const logoutBtn = document.querySelector('.sidebar-footer .nav-item');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                closeSidebarAndReset();
            });
        }
        
        // Close sidebar and reset hamburger when clicking outside
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                closeSidebarAndReset();
            }
        });
    }
}

// Authentication Check
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('kairos_user') || '{}');
    
    if (!user.logged_in) {
        window.location.href = 'index.html';
        return null;
    }
    
    return user;
}

// Update user info in navbar
function updateUserInfo() {
    const user = JSON.parse(localStorage.getItem('kairos_user') || '{}');
    const avatarEls = document.querySelectorAll('.user-avatar, .user-profile-avatar');

    avatarEls.forEach(avatarEl => {
        if (!user.name) return;
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        if (user.avatarUrl) {
            avatarEl.innerHTML = `<img src="${user.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" alt="${initials}">`;
        } else {
            avatarEl.textContent = initials;
        }
        avatarEl.title = user.name;
    });
}

// Logout
function logout() {
    localStorage.removeItem('kairos_user');
    localStorage.removeItem('kairos_theme');
    window.location.href = 'index.html';
}

// Format utilities
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatDateTime(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getDaysUntil(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diff = date - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    return days;
}

function getPriorityClass(priority) {
    const map = {
        'high': 'danger',
        'medium': 'warning',
        'low': 'success'
    };
    return map[priority] || 'info';
}

// Tab switching
function setupTabs() {
    const tabs = document.querySelectorAll('[role="tab"]');
    const tabContents = document.querySelectorAll('[role="tabpanel"]');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('aria-controls');
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(targetId)?.classList.add('active');
        });
    });
}

// Notification Badge
function updateNotificationBadge() {
    const notifications = JSON.parse(localStorage.getItem('kairos_notifications') || '[]');
    const unreadCount = notifications.filter(n => !n.read).length;
    
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// PWA Service Worker Registration
async function clearPwaStorage() {
    if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
    }
}
clearPwaStorage().catch(() => {});

// PWA Install Prompt
let _deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredInstallPrompt = e;
    const btn = document.getElementById('pwaInstallBtn');
    if (btn) btn.style.display = 'flex';
});
window.addEventListener('appinstalled', () => {
    _deferredInstallPrompt = null;
    const btn = document.getElementById('pwaInstallBtn');
    if (btn) btn.style.display = 'none';
});
function promptPWAInstall() {
    if (!_deferredInstallPrompt) return;
    _deferredInstallPrompt.prompt();
    _deferredInstallPrompt.userChoice.then(() => { _deferredInstallPrompt = null; });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupNavigation();
    setupSidebarToggle();
    updateUserInfo();
    updateNotificationBadge();
    setupTabs();
    initMotivationalQuote();
    setupOAuthHandlers();
    
    // Setup logout
    const logoutBtn = document.querySelector('[data-action="logout"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Close modals on backdrop click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
            e.target.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Start background active alarm system
    startBackgroundAlarmChecker();
});

/* ===========================
   MOTIVATIONAL QUOTES
   =========================== */

const motivationalQuotes = [
    "\"The only way to do great work is to love what you do.\" - Steve Jobs",
    "\"Success is the sum of small efforts repeated day in and day out.\" - Robert Collier",
    "\"Don't watch the clock; do what it does. Keep going.\" - Sam Levenson",
    "\"The future depends on what you do today.\" - Mahatma Gandhi",
    "\"Education is the passport to the future.\" - Malcolm X",
    "\"Your education is a dress for life.\" - B. B. King",
    "\"Commit to your goals and stay persistent.\" - Denzel Washington",
    "\"Success doesn't just find you. You have to go out and get it.\" - Unknown",
    "\"The expert in anything was once a beginner.\" - Helen Hayes",
    "\"No one is too busy. It's just a matter of priorities.\" - Unknown",
    "\"Your limitation - it's only your imagination.\" - Unknown",
    "\"Great things never came from comfort zones.\" - Unknown",
    "\"Dream it. Believe it. Build it.\" - Unknown",
    "\"Do something today that your future self will thank you for.\" - Sean Patrick Flanery",
    "\"A goal without a plan is just a wish.\" - Antoine de Saint-Exupéry",
    "\"The only limit to our realization of tomorrow is our doubts of today.\" - Franklin D. Roosevelt",
    "\"Your potential is endless.\" - Unknown",
    "\"Discipline is choosing between what you want now and what you want most.\" - Unknown",
    "\"Today is the perfect day to start living your dreams.\" - Unknown",
    "\"Success is not final, failure is not fatal.\" - Winston Churchill"
];

function initMotivationalQuote() {
    const quoteEl = document.getElementById('dailyQuote');
    if (quoteEl) {
        const dayOfYear = getDayOfYear();
        const quoteIndex = dayOfYear % motivationalQuotes.length;
        quoteEl.textContent = motivationalQuotes[quoteIndex];
        quoteEl.style.animation = 'fadeIn 0.6s ease';
    }
}

function getDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

/* ===========================
   OAUTH HANDLERS
   =========================== */

function setupOAuthHandlers() {
    const googleBtns = document.querySelectorAll('.oauth-google');
    const microsoftBtns = document.querySelectorAll('.oauth-microsoft');
    
    googleBtns.forEach(btn => {
        btn.addEventListener('click', () => handleGoogleLogin());
    });
    
    microsoftBtns.forEach(btn => {
        btn.addEventListener('click', () => handleMicrosoftLogin());
    });
}

function handleGoogleLogin() {
    // In production, this would redirect to Google OAuth
    // For now, simulate by creating a user with Google account
    showToast('Google login integration ready!', 'info');
    console.log('Google OAuth: Redirect would happen here');
    console.log('Implementation: Redirect to Google OAuth endpoint');
}

function handleMicrosoftLogin() {
    // In production, this would redirect to Microsoft OAuth
    // For now, simulate by creating a user with Microsoft account
    showToast('Microsoft login integration ready!', 'info');
    console.log('Microsoft OAuth: Redirect would happen here');
    console.log('Implementation: Redirect to Microsoft OAuth endpoint');
}

function loginAsGuest() {
    const guestUser = {
        email: 'guest@kairos.local',
        name: 'Guest User',
        logged_in: true,
        is_guest: true,
        guest_session: new Date().toISOString()
    };
    
    localStorage.setItem('kairos_user', JSON.stringify(guestUser));
    KairosStorage.initializeMockData();
    window.location.href = 'dashboard.html';
}

function signinAsGuest() {
    loginAsGuest();
}

/* ===========================
   PASSWORD FIELD VISIBILITY TOGGLE
   =========================== */

function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const btn = field.closest('.password-field-wrapper')?.querySelector('.password-toggle-btn');
    if (!btn) return;
    
    const icon = btn.querySelector('i');
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

/* ===========================
   USER PROFILE MENU
   =========================== */

function toggleProfileMenu(e) {
    if (e) {
        e.stopPropagation();
    }
    const dropdown = document.getElementById('profileDropdown');
    if (!dropdown) return;
    
    dropdown.classList.toggle('active');
    
    // Update user info display
    updateProfileMenuUser();
}

function closeProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
    }
}

function updateProfileMenuUser() {
    const user = JSON.parse(localStorage.getItem('kairos_user') || '{}');
    if (user && user.name) {
        const nameDisplay1 = document.getElementById('userNameDisplay');
        const nameDisplay2 = document.getElementById('userNameDisplay2');
        const emailDisplay = document.getElementById('userEmailDisplay');
        
        if (nameDisplay1) nameDisplay1.textContent = user.name || 'User';
        if (nameDisplay2) nameDisplay2.textContent = user.name || 'User';
        if (emailDisplay) emailDisplay.textContent = user.email || 'user@example.com';
    }
}

// Close profile menu when clicking outside
document.addEventListener('click', (e) => {
    const profileMenu = document.querySelector('.user-profile-menu');
    const profileBtn = document.querySelector('.user-profile-btn');
    
    // Don't close if clicking on the button itself
    if (profileBtn && profileBtn.contains(e.target)) {
        return;
    }
    
    // Close if clicking outside the menu
    if (profileMenu && !profileMenu.contains(e.target)) {
        closeProfileMenu();
    }
});

// Close profile menu when clicking menu items
document.addEventListener('click', (e) => {
    const menuItem = e.target.closest('.user-profile-item');
    if (menuItem) {
        // Small delay to allow navigation to complete  
        setTimeout(closeProfileMenu, 0);
    }
});

// Initialize profile menu on page load
document.addEventListener('DOMContentLoaded', () => {
    updateProfileMenuUser();
    checkDeadlineNotifications();
});

// ── NOTIFICATION PANEL (global  -  works on any page) ───────────────────────────

function openNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        openDrawer('notificationPanel');
    } else {
        // Pages without a drawer (assignments, etc.): navigate to dashboard
        window.location.href = 'dashboard.html';
    }
}

// ── BROWSER NOTIFICATION PERMISSION ──────────────────────────────────────────

function requestBrowserNotificationPermission(callback) {
    if (!('Notification' in window)) {
        showToast('This browser does not support notifications', 'warning');
        return;
    }
    if (Notification.permission === 'granted') {
        if (callback) callback();
        return;
    }
    if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast('Browser notifications enabled!', 'success');
                if (callback) callback();
            } else {
                showToast('Notification permission denied', 'warning');
            }
        });
    }
}

function sendBrowserNotification(title, body, icon) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
        new Notification(title, {
            body,
            icon: icon || '1000669890-Photoroom.png',
            badge: '1000669890-Photoroom.png'
        });
    } catch (e) { /* Safari/restricted contexts */ }
}

// ── DEADLINE ALARM CHECKER (runs on every page load) ─────────────────────────

function checkDeadlineNotifications() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const prefs = JSON.parse(localStorage.getItem('kairos_notif_prefs') || '{"48h":true,"24h":true,"12h":true,"3h":false,"1h":false}');
    const assignments = JSON.parse(localStorage.getItem('kairos_assignments') || '[]');
    const now = Date.now();
    const fired = JSON.parse(localStorage.getItem('kairos_notif_fired') || '{}');

    const thresholds = [
        { key: '48h', ms: 48 * 3600000, label: '2 days' },
        { key: '24h', ms: 24 * 3600000, label: '1 day' },
        { key: '12h', ms: 12 * 3600000, label: '12 hours' },
        { key: '3h',  ms:  3 * 3600000, label: '3 hours' },
        { key: '1h',  ms:  1 * 3600000, label: '1 hour' },
    ];

    assignments.forEach(a => {
        if (a.status === 'completed' || !a.dueDate) return;
        const due = new Date(a.dueDate).getTime();
        if (due < now) return;
        const remaining = due - now;

        thresholds.forEach(t => {
            if (!prefs[t.key]) return;
            if (remaining > t.ms) return;
            const fireKey = `${a.id}_${t.key}`;
            if (fired[fireKey]) return;

            sendBrowserNotification(
                `⏰ Due in ${t.label}: ${a.title}`,
                `${a.course || 'Assignment'} is due ${new Date(a.dueDate).toLocaleString()}`,
            );
            fired[fireKey] = true;
        });
    });

    localStorage.setItem('kairos_notif_fired', JSON.stringify(fired));
}

// ── ACTIVE ALARM & SOUND SYSTEM ──────────────────────────────────────────────

let audioCtx = null;
let activeOscillators = [];
let alarmInterval = null;
let activeAlarmModal = null;

function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playAlarmSound() {
    initAudio();
    if (!audioCtx) return; // Not supported or blocked

    // Stop any existing sound
    stopAlarmSound();

    // Create a pulsing "beep-beep" pattern using setInterval
    alarmInterval = setInterval(() => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1); // C#6
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.2);
        
        activeOscillators.push(osc);
    }, 1000); // Pulse every 1 second
}

function stopAlarmSound() {
    if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
    }
    activeOscillators.forEach(osc => {
        try { osc.stop(); } catch(e){}
    });
    activeOscillators = [];
}

function showAlarmModal(title, description) {
    if (activeAlarmModal) return; // Don't stack alarms

    activeAlarmModal = document.createElement('div');
    activeAlarmModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;flex-direction:column;animation:fadeIn 0.3s ease;';
    
    // Add pulsing red glow
    activeAlarmModal.innerHTML = `
        <div style="background:var(--card-bg, #fff);padding:40px;border-radius:24px;width:90%;max-width:450px;text-align:center;box-shadow:0 0 50px rgba(255, 71, 87, 0.4);animation:pulseGlow 2s infinite;">
            <style>
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 30px rgba(255, 71, 87, 0.4); }
                    50% { box-shadow: 0 0 60px rgba(255, 71, 87, 0.8); transform: scale(1.02); }
                    100% { box-shadow: 0 0 30px rgba(255, 71, 87, 0.4); }
                }
            </style>
            <i class="fas fa-bell" style="font-size:4rem;color:var(--danger, #ff4757);margin-bottom:20px;animation:shake 0.5s infinite;"></i>
            <h1 style="margin-bottom:15px;font-family:var(--font-primary);color:var(--text-primary);">${title}</h1>
            <p style="color:var(--text-secondary);font-size:1.1rem;margin-bottom:30px;">${description}</p>
            <button id="btnDismissAlarm" class="btn btn-primary" style="width:100%;padding:15px;font-size:1.1rem;background:var(--danger, #ff4757);border:none;">
                <i class="fas fa-times-circle"></i> Dismiss Alarm
            </button>
        </div>
    `;

    document.body.appendChild(activeAlarmModal);
    
    document.getElementById('btnDismissAlarm').addEventListener('click', () => {
        stopAlarmSound();
        activeAlarmModal.remove();
        activeAlarmModal = null;
    });

    // We must try to init audio on first show in case they haven't interacted yet, 
    // but usually checking happens after page load interaction.
    playAlarmSound();
}

function startBackgroundAlarmChecker() {
    // Run every 30 seconds
    setInterval(() => {
        const now = new Date();
        const currentTimeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const currentDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
        
        const firedAlarms = JSON.parse(localStorage.getItem('kairos_active_alarms_fired') || '{}');

        // 1. Check Timetable for classes starting in 10 minutes
        const timetable = JSON.parse(localStorage.getItem('kairos_timetable') || '[]');
        timetable.forEach(cls => {
            if (cls.day === currentDay) {
                // Parse class start time
                const [startH, startM] = cls.startTime.split(':').map(Number);
                const classTime = new Date();
                classTime.setHours(startH, startM, 0, 0);
                
                // Diff in minutes
                const diffMs = classTime - now;
                const diffMins = Math.floor(diffMs / 60000);
                
                if (diffMins === 10) { // Exactly 10 minutes away
                    const alarmKey = `class_${cls.id}_${now.toDateString()}`;
                    if (!firedAlarms[alarmKey]) {
                        showAlarmModal(
                            "Upcoming Class!",
                            `<strong>${cls.title}</strong> starts in 10 minutes (${cls.startTime}).<br><br>Location: ${cls.location || 'TBA'}`
                        );
                        firedAlarms[alarmKey] = true;
                    }
                }
            }
        });

        // 2. Check Assignments for due in 1 hour
        const assignments = JSON.parse(localStorage.getItem('kairos_assignments') || '[]');
        assignments.forEach(a => {
            if (a.status === 'completed' || !a.dueDate) return;
            const due = new Date(a.dueDate).getTime();
            const remainingMins = Math.floor((due - now.getTime()) / 60000);
            
            if (remainingMins === 60) { // Exactly 1 hour away
                const alarmKey = `assign_${a.id}_1h`;
                if (!firedAlarms[alarmKey]) {
                    showAlarmModal(
                        "Deadline Approaching!",
                        `Your assignment <strong>${a.title}</strong> is due in 1 hour!`
                    );
                    firedAlarms[alarmKey] = true;
                }
            }
        });

        localStorage.setItem('kairos_active_alarms_fired', JSON.stringify(firedAlarms));

    }, 30000); // 30,000 ms = 30 seconds
}
