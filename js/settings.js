/* ===========================
   SETTINGS PAGE FUNCTIONALITY
   =========================== */

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadProfile();
});

function showSettingTab(tab) {
    // Hide all tabs
    document.querySelectorAll('[id$="Tab"]').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.settings-tab').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const tabId = tab + 'Tab';
    const tabEl = document.getElementById(tabId);
    if (tabEl) {
        tabEl.classList.remove('hidden');
    }
    
    // Mark button as active
    event.target.classList.add('active');
}

function loadProfile() {
    const user = JSON.parse(localStorage.getItem('kairos_user') || '{}');
    
    if (user.name) {
        document.getElementById('fullName').value = user.name;
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('profileAvatar').textContent = initials;
    }
    
    if (user.email) {
        document.getElementById('emailName').value = user.email;
    }
    
    if (user.institution) {
        document.getElementById('institution').value = user.institution;
    }
}

function saveProfile() {
    const user = JSON.parse(localStorage.getItem('kairos_user') || '{}');
    
    user.name = document.getElementById('fullName').value;
    user.email = document.getElementById('emailName').value;
    user.institution = document.getElementById('institution').value;
    
    localStorage.setItem('kairos_user', JSON.stringify(user));
    showToast('Profile updated successfully!', 'success');
}

function toggleNotification(el) {
    el.classList.toggle('active');
}

function applyTheme(theme) {
    document.querySelectorAll('.appearance-option').forEach(opt => opt.classList.remove('selected'));
    event.target.closest('.appearance-option').classList.add('selected');
    
    const newTheme = theme === 'light' ? 'light-mode' : 'dark-mode';
    document.body.className = newTheme;
    localStorage.setItem('kairos_theme', newTheme);
    
    showToast(`Theme changed to ${theme}`, 'success');
}

function changeAccentColor(color) {
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    event.target.classList.add('selected');
    
    document.documentElement.style.setProperty('--primary', color);
    localStorage.setItem('kairos_accent_color', color);
    
    showToast('Accent color updated!', 'success');
}

function startNewSemester() {
    const semester = prompt('Enter semester name (e.g., First Semester or Second Semester):');
    if (semester) {
        KairosStorage.addSemester({
            name: semester,
            startDate: new Date().toISOString()
        });
        showToast('New semester created!', 'success');
    }
}

function archiveSemester() {
    createConfirmDialog(
        'Archive Current Semester',
        'This will archive all assignments from this semester. You can restore them later.',
        () => {
            showToast('Semester archived!', 'success');
        }
    );
}

function clearAllData() {
    createConfirmDialog(
        'Clear All Data',
        'This will permanently delete all your assignments, events, and settings. This cannot be undone!',
        () => {
            KairosStorage.clearAllData();
            showToast('All data cleared!', 'success');
            setTimeout(() => {
                logout();
            }, 1000);
        }
    );
}
