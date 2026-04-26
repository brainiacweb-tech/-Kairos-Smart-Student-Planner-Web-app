/* ===========================
   SETTINGS PAGE FUNCTIONALITY
   =========================== */

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadProfile();
    loadNotificationPrefs();
    setupAvatarUpload();
});

function showSettingTab(tab, el) {
    document.querySelectorAll('[id$="Tab"]').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.settings-tab').forEach(btn => btn.classList.remove('active'));

    const tabEl = document.getElementById(tab + 'Tab');
    if (tabEl) tabEl.classList.remove('hidden');
    if (el) el.classList.add('active');
}

// ── PROFILE ──────────────────────────────────────────────────────────────────

function loadProfile() {
    const user = JSON.parse(localStorage.getItem('kairos_user') || '{}');

    if (user.name) {
        const nameEl = document.getElementById('fullName');
        if (nameEl) nameEl.value = user.name;
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const avatarEl = document.getElementById('profileAvatar');
        if (avatarEl) {
            if (user.avatarUrl) {
                avatarEl.innerHTML = `<img src="${user.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            } else {
                avatarEl.textContent = initials;
            }
        }
    }
    if (user.email) {
        const emailEl = document.getElementById('emailName');
        if (emailEl) emailEl.value = user.email;
    }
    if (user.institution) {
        const instEl = document.getElementById('institution');
        if (instEl) instEl.value = user.institution;
    }
}

function saveProfile() {
    const user = JSON.parse(localStorage.getItem('kairos_user') || '{}');
    user.name        = document.getElementById('fullName')?.value || user.name;
    user.email       = document.getElementById('emailName')?.value || user.email;
    user.institution = document.getElementById('institution')?.value || user.institution;
    localStorage.setItem('kairos_user', JSON.stringify(user));
    showToast('Profile updated successfully!', 'success');
}

// ── AVATAR UPLOAD ─────────────────────────────────────────────────────────────

function setupAvatarUpload() {
    const input = document.getElementById('avatarInput');
    if (!input) return;

    // Also make the avatar element itself clickable
    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) {
        avatarEl.style.cursor = 'pointer';
        avatarEl.title = 'Click to change photo';
        avatarEl.addEventListener('click', () => input.click());
    }

    input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file (JPG, PNG, GIF)', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be under 5 MB', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = e => {
            const dataUrl = e.target.result;

            // Update avatar display
            if (avatarEl) {
                avatarEl.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            }

            // Persist to user record
            const user = JSON.parse(localStorage.getItem('kairos_user') || '{}');
            user.avatarUrl = dataUrl;
            localStorage.setItem('kairos_user', JSON.stringify(user));

            showToast('Profile photo updated!', 'success');
        };
        reader.onerror = () => showToast('Failed to read image', 'error');
        reader.readAsDataURL(file);
    });
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

const NOTIF_KEYS = ['48h', '24h', '12h', '3h', '1h'];

function loadNotificationPrefs() {
    const prefs = JSON.parse(localStorage.getItem('kairos_notif_prefs') || '{"48h":true,"24h":true,"12h":true,"3h":false,"1h":false}');
    const toggles = document.querySelectorAll('.notification-toggle');
    NOTIF_KEYS.forEach((key, i) => {
        if (toggles[i]) {
            toggles[i].classList.toggle('active', !!prefs[key]);
            toggles[i].dataset.key = key;
        }
    });
}

function toggleNotification(el) {
    el.classList.toggle('active');
    const isActive = el.classList.contains('active');

    // Save to prefs
    const prefs = JSON.parse(localStorage.getItem('kairos_notif_prefs') || '{}');
    const key = el.dataset.key;
    if (key) prefs[key] = isActive;
    localStorage.setItem('kairos_notif_prefs', JSON.stringify(prefs));

    // Request browser permission when user enables any notification
    if (isActive) {
        requestBrowserNotificationPermission(() => {
            showToast('Deadline reminders enabled', 'success');
        });
    }
}

// ── APPEARANCE ────────────────────────────────────────────────────────────────

function applyTheme(theme, el) {
    document.querySelectorAll('.appearance-option').forEach(opt => opt.classList.remove('selected'));
    const option = el ? el.closest('.appearance-option') : null;
    if (option) option.classList.add('selected');
    const newTheme = theme === 'light' ? 'light-mode' : 'dark-mode';
    document.body.className = newTheme;
    localStorage.setItem('kairos_theme', newTheme);
    showToast(`Theme changed to ${theme}`, 'success');
}

function changeAccentColor(color, el) {
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    if (el) el.classList.add('selected');
    document.documentElement.style.setProperty('--primary', color);
    localStorage.setItem('kairos_accent_color', color);
    showToast('Accent color updated!', 'success');
}

// ── SEMESTER ──────────────────────────────────────────────────────────────────

function startNewSemester() {
    const semester = prompt('Enter semester name (e.g., First Semester or Second Semester):');
    if (semester) {
        KairosStorage.addSemester({ name: semester, startDate: new Date().toISOString() });
        showToast('New semester created!', 'success');
    }
}

function archiveSemester() {
    createConfirmDialog(
        'Archive Current Semester',
        'This will archive all assignments from this semester. You can restore them later.',
        () => showToast('Semester archived!', 'success')
    );
}

function clearAllData() {
    createConfirmDialog(
        'Clear All Data',
        'This will permanently delete all your assignments, events, and settings. This cannot be undone!',
        () => {
            KairosStorage.clearAllData();
            showToast('All data cleared!', 'success');
            setTimeout(() => logout(), 1000);
        }
    );
}
