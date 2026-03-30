/* ===========================
   KAIROS APP - GLOBAL UTILITIES
   =========================== */

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('kairos_theme') || 'light-mode';
    document.body.className = savedTheme;
    updateThemeToggle(savedTheme === 'dark-mode');
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    const newTheme = isDark ? 'light-mode' : 'dark-mode';
    
    document.body.classList.remove('dark-mode', 'light-mode');
    document.body.classList.add(newTheme);
    
    localStorage.setItem('kairos_theme', newTheme);
    updateThemeToggle(!isDark);
}

function updateThemeToggle(isDark) {
    const toggles = document.querySelectorAll('.theme-toggle');
    toggles.forEach(toggle => {
        toggle.classList.toggle('dark', isDark);
    });
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
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
        
        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('active');
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
    const avatarEl = document.querySelector('.user-avatar');
    
    if (avatarEl && user.name) {
        const initials = user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        
        avatarEl.textContent = initials;
        avatarEl.title = user.name;
    }
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
    
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
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
    
    // Setup theme toggle handlers
    const themeToggles = document.querySelectorAll('.theme-toggle');
    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', toggleTheme);
    });
    
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
    "\"Your limitation—it's only your imagination.\" - Unknown",
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
});
