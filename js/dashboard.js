/* ===========================
   DASHBOARD FUNCTIONALITY
   =========================== */

let currentDate = new Date();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    updateStats();
    renderDeadlines();
    renderCalendar();
    setupNotificationPanel();
});

// Update Statistics
function updateStats() {
    const stats = KairosStorage.getStats();
    
    document.getElementById('totalAssign').textContent = stats.total;
    document.getElementById('dueToday').textContent = stats.dueToday;
    document.getElementById('completed').textContent = stats.completed;
    document.getElementById('overdue').textContent = stats.overdue;
}

// Render Deadlines
function renderDeadlines() {
    const assignments = KairosStorage.getAssignments()
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 4); // Show top 4

    const grid = document.getElementById('deadlinesGrid');
    grid.innerHTML = '';

    if (assignments.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: var(--spacing-2xl);">
                <div style="font-size: 2rem; margin-bottom: var(--spacing-md);">🎉</div>
                <h3>No upcoming assignments!</h3>
                <p style="color: var(--text-secondary);">You're all caught up. Great work!</p>
            </div>
        `;
        return;
    }

    assignments.forEach(assignment => {
        const daysUntil = getDaysUntil(assignment.dueDate);
        let categoryClass = 'later';
        let icon = '🟢';

        if (daysUntil < 0) {
            categoryClass = 'overdue';
            icon = '🔴';
        } else if (daysUntil === 0) {
            categoryClass = 'due-today';
            icon = '🟠';
        } else if (daysUntil <= 7) {
            categoryClass = 'this-week';
            icon = '🟡';
        }

        grid.innerHTML += `
            <div class="deadline-card ${categoryClass}">
                <div class="deadline-header">
                    <div>
                        <div class="deadline-title">${assignment.title}</div>
                        <div class="deadline-badge ${assignment.priority}">${assignment.priority}</div>
                    </div>
                </div>

                <div class="deadline-meta">
                    <span><i class="fas fa-book"></i> ${assignment.course}</span>
                    <span><i class="fas fa-clock"></i> ${formatDate(assignment.dueDate)}</span>
                </div>

                <div class="deadline-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${assignment.completed}%"></div>
                    </div>
                    <div class="progress-percent">${assignment.completed}%</div>
                </div>

                <div class="deadline-actions">
                    <button class="btn-icon" onclick="markAssignmentDone(${assignment.id})" title="Mark as done">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-icon" onclick="editAssignment(${assignment.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    });
}

// Mark Assignment Done
function markAssignmentDone(assignmentId) {
    const assignment = KairosStorage.getAssignmentById(assignmentId);
    if (assignment) {
        KairosStorage.updateAssignment(assignmentId, {
            status: 'completed',
            completed: 100
        });
        
        showToast(`Marked "${assignment.title}" as completed! 🎉`, 'success');
        updateStats();
        renderDeadlines();
    }
}

// Edit Assignment
function editAssignment(assignmentId) {
    window.location.href = `assignments.html?edit=${assignmentId}`;
}

// Calendar Functions
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const monthYear = document.getElementById("monthYear");
    const datesContainer = document.getElementById("dates");

    monthYear.innerText = currentDate.toLocaleString("default", {
        month: "long",
        year: "numeric"
    });

    datesContainer.innerHTML = "";

    // Empty cells for days before month starts (align with correct day)
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement("div");
        emptyDiv.style.display = "";
        datesContainer.appendChild(emptyDiv);
    }

    // Calendar date cells
    const today = new Date();
    for (let i = 1; i <= lastDate; i++) {
        let div = document.createElement("div");
        div.textContent = i;
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";
        div.style.minHeight = "42px";
        div.style.aspectRatio = "1";
        div.style.borderRadius = "6px";
        div.style.cursor = "pointer";
        div.style.fontSize = "1rem";
        div.style.fontWeight = "500";
        div.style.border = "1px solid #ddd";
        div.style.backgroundColor = "#f9f9f9";
        div.style.color = "#333";
        div.style.transition = "all 0.2s ease";

        // Hover effect
        div.addEventListener("mouseenter", () => {
            if (!div.classList.contains("today")) {
                div.style.backgroundColor = "#007bff";
                div.style.color = "white";
                div.style.borderColor = "#0056b3";
            }
        });
        div.addEventListener("mouseleave", () => {
            if (!div.classList.contains("today")) {
                div.style.backgroundColor = "#f9f9f9";
                div.style.color = "#333";
                div.style.borderColor = "#ddd";
            }
        });

        // Highlight today
        if (
            i === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            div.classList.add("today");
            div.style.backgroundColor = "#007bff";
            div.style.color = "white";
            div.style.fontWeight = "bold";
            div.style.borderColor = "#0056b3";
        }

        datesContainer.appendChild(div);
    }
}

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}



// Notification Panel
function setupNotificationPanel() {
    const notifications = KairosStorage.getNotifications();
    const list = document.getElementById('notificationList');
    
    if (notifications.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-2xl); color: var(--text-secondary);">
                <i class="fas fa-bell" style="font-size: 2rem; margin-bottom: var(--spacing-md); display: block;"></i>
                <p>No notifications</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = notifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(notif => `
            <div style="padding: var(--spacing-md); border-bottom: 1px solid var(--border); cursor: pointer;" onclick="markNotificationRead(${notif.id})">
                <div style="display: flex; gap: var(--spacing-md); align-items: start;">
                    <div style="flex-shrink: 0; ${notif.read ? 'opacity: 0.5;' : ''}">
                        <i class="fas fa-${getNotifIcon(notif.type)}"></i>
                    </div>
                    <div style="flex: 1; ${notif.read ? 'opacity: 0.7;' : ''}">
                        <div style="font-weight: 600; color: var(--text);">${notif.title}</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary);">${notif.message}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: var(--spacing-xs);">
                            ${formatTime(notif.createdAt)}
                        </div>
                    </div>
                    ${!notif.read ? '<div style="width: 8px; height: 8px; background: var(--primary); border-radius: 50%; flex-shrink: 0;"></div>' : ''}
                </div>
            </div>
        `).join('');
}

function getNotifIcon(type) {
    const icons = {
        deadline: 'calendar-alt',
        reminder: 'clock',
        achievement: 'star',
        alert: 'exclamation-triangle'
    };
    return icons[type] || 'bell';
}

function markNotificationRead(notifId) {
    KairosStorage.markNotificationAsRead(notifId);
    setupNotificationPanel();
    updateNotificationBadge();
}

function openNotificationPanel() {
    openDrawer('notificationPanel');
}

// Generate some notifications on first visit
function generateNotifications() {
    const notifications = KairosStorage.getNotifications();
    
    if (notifications.length === 0) {
        const assignments = KairosStorage.getAssignments();
        
        assignments.slice(0, 3).forEach(assignment => {
            const daysUntil = getDaysUntil(assignment.dueDate);
            
            if (daysUntil <= 3 && daysUntil >= 0) {
                KairosStorage.addNotification({
                    type: 'deadline',
                    title: 'Upcoming Deadline',
                    message: `${assignment.title} is due in ${daysUntil === 0 ? 'today' : daysUntil + ' days'}`
                });
            }
        });
    }
}

// Initialize notifications
window.addEventListener('DOMContentLoaded', () => {
    generateNotifications();
    initializeNewFeatures();
});

/* ===========================
   NEW FEATURES - POMODORO TIMER
   =========================== */

let pomodoroTime = 1500; // 25 minutes in seconds
let pomodoroInterval = null;
let isPomodoroPaused = false;

function formatTimeDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    const display = document.getElementById('timerDisplay');
    if (display) {
        display.textContent = formatTimeDisplay(pomodoroTime);
    }
}

function startPomodoro() {
    if (pomodoroInterval) return;
    
    pomodoroInterval = setInterval(() => {
        pomodoroTime--;
        updateTimerDisplay();
        
        if (pomodoroTime <= 0) {
            clearInterval(pomodoroInterval);
            pomodoroInterval = null;
            showToast('🎉 Pomodoro session complete! Take a 5-minute break.', 'success');
            pomodoroTime = 300; // Reset to 5 min break
            updateTimerDisplay();
        }
    }, 1000);
    
    showToast('🚀 Focus session started. Stay concentrated!', 'info');
}

function resetPomodoro() {
    if (pomodoroInterval) {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
    }
    pomodoroTime = 1500;
    updateTimerDisplay();
    showToast('Timer reset to 25:00', 'info');
}

/* ===========================
   NEW FEATURES - STUDY STREAK
   =========================== */

function getStudyStreak() {
    const streak = JSON.parse(localStorage.getItem('kairos_study_streak') || '{"count": 0, "lastDate": null}');
    return streak;
}

function updateStudyStreak() {
    const streak = getStudyStreak();
    const today = new Date().toDateString();
    
    if (streak.lastDate !== today) {
        const lastDate = streak.lastDate ? new Date(streak.lastDate) : new Date();
        const today_date = new Date();
        
        const daysDiff = Math.floor((today_date - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
            streak.count++;
        } else if (daysDiff > 1) {
            streak.count = 1;
        }
        
        streak.lastDate = today;
        localStorage.setItem('kairos_study_streak', JSON.stringify(streak));
    }
    
    return streak;
}

function logStudySession() {
    const streak = updateStudyStreak();
    const display = document.getElementById('streakDisplay');
    if (display) {
        display.innerHTML = `
            <div style="font-size: 2.5rem; font-weight: 700; color: var(--warning);">${streak.count}</div>
            <div style="color: var(--text-secondary);">Days in a row</div>
        `;
    }
    showToast(`🔥 Study session logged! Streak: ${streak.count} days!`, 'success');
}

/* ===========================
   NEW FEATURES - STUDY TIPS
   =========================== */

const studyTips = [
    "Break your study into 25-minute chunks with 5-minute breaks (Pomodoro technique).",
    "Turn off notifications and use Focus Mode to minimize distractions.",
    "Create a dedicated study space free from distractions.",
    "Teach the material to someone else - it's a great way to test understanding.",
    "Use active recall: test yourself without looking at notes.",
    "Space out your studying over several days instead of cramming the night before.",
    "Take handwritten notes instead of typing for better retention.",
    "Study your hardest subject when you're most alert.",
    "Use the Feynman Technique: explain concepts in simple terms.",
    "Get 7-9 hours of sleep for optimal memory consolidation.",
    "Exercise for 30 minutes to improve focus and memory.",
    "Stay hydrated - your brain works better with water!",
    "Use color-coded notes to organize information visually.",
    "Review material within 24 hours of learning it.",
    "Create summary sheets before exams.",
    "Join study groups to learn from peers.",
    "Use flashcards for memorization.",
    "Organize your assignments by priority.",
    "Start assignments early to avoid last-minute stress.",
    "Reward yourself after completing study sessions!"
];

function getRandomTip() {
    return studyTips[Math.floor(Math.random() * studyTips.length)];
}

function displayStudyTip() {
    const tipEl = document.getElementById('studyTip');
    if (tipEl) {
        const tip = getRandomTip();
        tipEl.textContent = `💡 ${tip}`;
    }
}

function getNewTip() {
    displayStudyTip();
    showToast('New tip loaded!', 'info');
}

/* ===========================
   NEW FEATURES - GPA CALCULATOR
   =========================== */

function openGPACalculator() {
    showToast('GPA Calculator - Add to the GPA Calculator page.', 'info');
    // Can be extended to open a modal or dedicated page
}

/* ===========================
   NEW FEATURES - FOCUS MODE
   =========================== */

function enableFocusMode() {
    const isEnabled = document.body.classList.contains('focus-mode');
    
    if (!isEnabled) {
        document.body.classList.add('focus-mode');
        document.querySelector('.sidebar').style.display = 'none';
        document.querySelector('.navbar-title').textContent = 'Focus Mode Enabled';
        showToast('🎯 Focus Mode activated! All distractions minimized.', 'success');
    } else {
        disableFocusMode();
    }
}

function disableFocusMode() {
    document.body.classList.remove('focus-mode');
    document.querySelector('.sidebar').style.display = 'flex';
    document.querySelector('.navbar-title').textContent = 'Dashboard';
    showToast('Focus Mode disabled', 'info');
}

function showFocusModeSettings() {
    showToast('Focus Mode Settings - Customize focus duration and break times', 'info');
}

/* ===========================
   NEW FEATURES - INITIALIZATION
   =========================== */

function initializeNewFeatures() {
    // Initialize timer display
    updateTimerDisplay();
    
    // Initialize study streak
    const streak = getStudyStreak();
    const display = document.getElementById('streakDisplay');
    if (display) {
        display.innerHTML = `
            <div style="font-size: 2.5rem; font-weight: 700; color: var(--warning);">${streak.count}</div>
            <div style="color: var(--text-secondary);">Days in a row</div>
        `;
    }
    
    // Initialize daily tip
    displayStudyTip();
    
    // Initialize upcoming exams preview
    const examsPreview = document.getElementById('examsPreview');
    if (examsPreview) {
        const assignments = KairosStorage.getAssignments();
        const exams = assignments.filter(a => a.type === 'exam' || a.priority === 'high').slice(0, 2);
        
        if (exams.length > 0) {
            examsPreview.innerHTML = exams.map(exam => `
                <div style="margin-bottom: var(--spacing-sm);">
                    <div style="font-weight: 600; color: var(--text);">${exam.title}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        ${formatDate(exam.dueDate)}
                    </div>
                </div>
            `).join('');
        }
    }
}
