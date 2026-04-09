/**
 * Timetable Manager - File Upload & Schedule Management
 * Handles PDF, Image, and CSV timetable uploads with daily alerts
 */

class TimetableManager {
    constructor() {
        this.timetables = this.loadTimetables();
        this.lectures = this.loadLectures();
        this.settings = this.loadSettings();
        this.initializeEventListeners();
        this.renderUI();
        this.startDailyAlertCheck();
    }

    initializeEventListeners() {
        // Drag and drop
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        }

        // Alert toggle
        const dailyToggle = document.getElementById('dailyAlertsToggle');
        if (dailyToggle && this.settings.dailyAlerts) {
            dailyToggle.classList.add('on');
        }

        const soundToggle = document.getElementById('soundNotifToggle');
        if (soundToggle && this.settings.soundNotif) {
            soundToggle.classList.add('on');
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileUpload(file) {
        this.processFile(file);
    }

    processFile(file) {
        const fileName = file.name;
        const fileType = file.type;
        const fileExt = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();

        // Validate file
        const validExts = ['.pdf', '.png', '.jpg', '.jpeg', '.csv'];
        if (!validExts.includes(fileExt)) {
            this.showToast('❌ Invalid file format. Use PDF, PNG, JPG, or CSV', 'error');
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            const fileData = e.target.result;
            
            if (fileExt === '.csv') {
                this.parseCSVFile(fileData, fileName);
            } else if (['.pdf', '.png', '.jpg', '.jpeg'].includes(fileExt)) {
                this.storeImageOrPDF(fileData, fileName, file.type);
            }
        };

        reader.onerror = () => {
            this.showToast('❌ Error reading file', 'error');
        };

        if (fileExt === '.csv') {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }
    }

    parseCSVFile(csvData, fileName) {
        try {
            const lines = csvData.trim().split('\n');
            let lecturesToAdd = [];

            // Try to parse CSV (flexible format)
            // Expected format: Course,Time,Room,Days (or similar)
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',').map(p => p.trim());
                if (parts.length >= 2) {
                    const course = parts[0];
                    const time = parts[1];
                    const room = parts.length > 2 ? parts[2] : 'TBA';
                    const days = parts.length > 3 ? parts[3] : 'Mon,Tue,Wed,Thu,Fri';

                    // Parse time "HH:MM-HH:MM" or "HH:MM"
                    const timeMatch = time.match(/(\d{1,2}):(\d{2})/);
                    if (timeMatch) {
                        lecturesToAdd.push({
                            course,
                            room,
                            startTime: time.split('-')[0].trim(),
                            endTime: time.split('-')[1]?.trim() || 'TBA',
                            days: days.split('|').map(d => d.trim()),
                            uploadedFile: fileName
                        });
                    }
                }
            }

            if (lecturesToAdd.length > 0) {
                lecturesToAdd.forEach(lec => this.lectures.push({
                    id: Date.now() + Math.random(),
                    ...lec,
                    dateAdded: new Date().toLocaleDateString()
                }));

                this.saveLectures();
                this.showToast(`✅ Added ${lecturesToAdd.length} lectures from CSV`, 'success');
            } else {
                this.showToast('⚠️ No valid lectures found in CSV', 'warning');
            }
        } catch (err) {
            this.showToast('❌ Error parsing CSV file', 'error');
            console.error(err);
        }

        this.saveTimetable(fileName, csvData, 'csv');
        this.renderUI();
    }

    storeImageOrPDF(fileData, fileName, fileType) {
        const timetable = {
            id: Date.now(),
            name: fileName,
            type: fileType.includes('pdf') ? 'pdf' : 'image',
            data: fileData,
            dateAdded: new Date().toLocaleDateString(),
            size: (fileData.length / 1024).toFixed(2) + 'KB'
        };

        this.timetables.push(timetable);
        this.saveTimetables();
        this.showToast(`✅ Timetable "${fileName}" uploaded successfully`, 'success');
        this.renderUI();
    }

    saveTimetable(name, data, type) {
        const timetable = {
            id: Date.now(),
            name: name,
            type: type,
            data: data,
            dateAdded: new Date().toLocaleDateString(),
            size: (data.length / 1024).toFixed(2) + 'KB'
        };

        this.timetables.push(timetable);
        this.saveTimetables();
    }

    addManualLecture() {
        const courseName = document.getElementById('courseName').value.trim();
        const roomLocation = document.getElementById('roomLocation').value.trim();
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;

        const selectedDays = Array.from(document.querySelectorAll('.day-checkbox:checked'))
            .map(cb => cb.value);

        if (!courseName || !startTime || selectedDays.length === 0) {
            this.showToast('⚠️ Please fill in all required fields', 'warning');
            return;
        }

        const lecture = {
            id: Date.now() + Math.random(),
            course: courseName,
            room: roomLocation || 'TBA',
            startTime: startTime,
            endTime: endTime || 'TBA',
            days: selectedDays,
            dateAdded: new Date().toLocaleDateString(),
            uploadedFile: 'Manual Entry'
        };

        this.lectures.push(lecture);
        this.saveLectures();

        // Clear form
        document.getElementById('courseName').value = '';
        document.getElementById('roomLocation').value = '';
        document.getElementById('startTime').value = '';
        document.getElementById('endTime').value = '';
        document.querySelectorAll('.day-checkbox').forEach(cb => cb.checked = false);

        this.showToast('✅ Lecture added successfully', 'success');
        this.renderUI();
    }

    getTodayLectures() {
        const today = new Date();
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];

        return this.lectures.filter(lec => lec.days && lec.days.includes(dayName))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    startDailyAlertCheck() {
        // Check every minute
        setInterval(() => {
            if (this.settings.dailyAlerts) {
                this.checkUpcomingLectures();
            }
        }, 60000); // Check every minute

        // Also check on load
        if (this.settings.dailyAlerts) {
            this.checkUpcomingLectures();
        }
    }

    checkUpcomingLectures() {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');

        const todayLectures = this.getTodayLectures();

        todayLectures.forEach(lecture => {
            // Convert time to minutes for comparison
            const [lectureHour, lectureMin] = lecture.startTime.split(':').map(Number);
            const lectureTimeInMin = lectureHour * 60 + lectureMin;
            
            const [currentHour, currentMin] = currentTime.split(':').map(Number);
            const currentTimeInMin = currentHour * 60 + currentMin;

            const minutesBefore = parseInt(this.settings.alertAdvanceTime);
            const alertTimeInMin = lectureTimeInMin - minutesBefore;

            // Check if within alert window
            if (currentTimeInMin >= alertTimeInMin && currentTimeInMin < lectureTimeInMin) {
                // Check if already notified (store in sessionStorage to prevent duplicate alerts)
                const alertKey = `notified_${lecture.id}_${new Date().toDateString()}`;
                if (!sessionStorage.getItem(alertKey)) {
                    this.sendLectureAlert(lecture);
                    sessionStorage.setItem(alertKey, 'true');
                }
            }
        });
    }

    sendLectureAlert(lecture) {
        // Show toast notification
        this.showToast(
            `🔔 ${lecture.course} starts at ${lecture.startTime} (${lecture.room})`,
            'info'
        );

        // Play sound if enabled
        if (this.settings.soundNotif) {
            this.playAlertSound();
        }

        // Send browser notification if permitted
        if (Notification.permission === 'granted') {
            new Notification('Lecture Alert - Kairos', {
                body: `${lecture.course} starts at ${lecture.startTime} in room ${lecture.room}`,
                icon: '📅',
                tag: `lecture_${lecture.id}`
            });
        }
    }

    playAlertSound() {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800; // Hz
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    deleteTimetable(id) {
        if (confirm('Delete this timetable?')) {
            this.timetables = this.timetables.filter(t => t.id !== id);
            this.saveTimetables();
            this.showToast('✅ Timetable deleted', 'info');
            this.renderUI();
        }
    }

    viewTimetable(id) {
        const timetable = this.timetables.find(t => t.id === id);
        if (!timetable) return;

        if (timetable.type === 'pdf' || timetable.type === 'image') {
            const newWindow = window.open();
            newWindow.document.write(`
                <html>
                <head><title>${timetable.name}</title></head>
                <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a1a;">
                    <img src="${timetable.data}" style="max-width: 90%; max-height: 90%; border-radius: 8px;">
                </body>
                </html>
            `);
        }
    }

    downloadTimetable(id) {
        const timetable = this.timetables.find(t => t.id === id);
        if (!timetable) return;

        const link = document.createElement('a');
        link.href = timetable.data;
        link.download = timetable.name;
        link.click();
    }

    deleteLecture(id) {
        if (confirm('Delete this lecture?')) {
            this.lectures = this.lectures.filter(l => l.id !== id);
            this.saveLectures();
            this.showToast('✅ Lecture deleted', 'info');
            this.renderUI();
        }
    }

    toggleDailyAlerts() {
        this.settings.dailyAlerts = !this.settings.dailyAlerts;
        this.saveSettings();
        
        const toggle = document.getElementById('dailyAlertsToggle');
        toggle.classList.toggle('on');

        const status = this.settings.dailyAlerts ? 'ON' : 'OFF';
        document.getElementById('alertStatus').textContent = status;

        this.showToast(`✅ Daily alerts turned ${status}`, 'info');

        // Request notification permission if enabling
        if (this.settings.dailyAlerts) {
            this.requestNotificationPermission();
            this.checkUpcomingLectures();
        }
    }

    toggleSoundNotif() {
        this.settings.soundNotif = !this.settings.soundNotif;
        this.saveSettings();
        
        const toggle = document.getElementById('soundNotifToggle');
        toggle.classList.toggle('on');

        this.showToast(`✅ Sound notifications ${this.settings.soundNotif ? 'enabled' : 'disabled'}`, 'info');
    }

    quickAddLecture() {
        const courseName = document.getElementById('quickCourseName').value.trim();
        const room = document.getElementById('quickRoom').value.trim();
        const startTime = document.getElementById('quickStartTime').value;
        const endTime = document.getElementById('quickEndTime').value;

        const selectedDays = Array.from(document.querySelectorAll('.quick-day-checkbox:checked'))
            .map(cb => cb.value);

        if (!courseName || !startTime || selectedDays.length === 0) {
            this.showToast('⚠️ Please fill in required fields', 'warning');
            return;
        }

        const lecture = {
            id: Date.now() + Math.random(),
            course: courseName,
            room: room || 'TBA',
            startTime: startTime,
            endTime: endTime || 'TBA',
            days: selectedDays,
            dateAdded: new Date().toLocaleDateString(),
            uploadedFile: 'Created',
            isCustom: true
        };

        this.lectures.push(lecture);
        this.saveLectures();

        // Clear form
        document.getElementById('quickCourseName').value = '';
        document.getElementById('quickRoom').value = '';
        document.getElementById('quickStartTime').value = '';
        document.getElementById('quickEndTime').value = '';
        document.querySelectorAll('.quick-day-checkbox').forEach(cb => cb.checked = false);

        this.renderCreateUI();
        this.showToast('✅ Lecture added to timetable', 'success');
    }

    renderDaysGrid() {
        const daysGrid = document.getElementById('daysGrid');
        if (!daysGrid) return;

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        daysGrid.innerHTML = days.map(day => {
            const dayLectures = this.lectures.filter(l => l.days && l.days.includes(day));
            return `
                <div class="day-card ${dayLectures.length > 0 ? 'has-lectures' : ''}" onclick="timetableManager.viewDayLectures('${day}')">
                    <div class="day-name">${day.slice(0, 3)}</div>
                    <div class="lecture-count">${dayLectures.length} lecture${dayLectures.length !== 1 ? 's' : ''}</div>
                </div>
            `;
        }).join('');
    }

    viewDayLectures(day) {
        const lectures = this.lectures.filter(l => l.days && l.days.includes(day))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        // Scroll to preview and highlight
        const preview = document.getElementById('timetablePreview');
        preview.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    saveTimetableAsNew() {
        const customLectures = this.lectures.filter(l => l.isCustom);
        
        if (customLectures.length === 0) {
            this.showToast('⚠️ Add at least one lecture to your timetable', 'warning');
            return;
        }

        const name = prompt('Enter a name for your timetable:', `My Timetable - ${new Date().toLocaleDateString()}`);
        if (!name) return;

        const timetable = {
            id: Date.now(),
            name: name,
            type: 'custom',
            lectureCount: customLectures.length,
            dateAdded: new Date().toLocaleDateString(),
            lectureIds: customLectures.map(l => l.id)
        };

        this.timetables.push(timetable);
        this.saveTimetables();

        this.showToast(`✅ Timetable "${name}" saved successfully`, 'success');
        this.renderUI();
    }

    clearCreateTimetable() {
        if (confirm('Clear all custom lectures?')) {
            this.lectures = this.lectures.filter(l => !l.isCustom);
            this.saveLectures();
            document.getElementById('quickCourseName').value = '';
            document.getElementById('quickRoom').value = '';
            document.getElementById('quickStartTime').value = '';
            document.getElementById('quickEndTime').value = '';
            document.querySelectorAll('.quick-day-checkbox').forEach(cb => cb.checked = false);
            this.renderCreateUI();
            this.showToast('✅ Custom timetable cleared', 'info');
        }
    }

    renderCreateUI() {
        this.renderDaysGrid();
        this.renderTimetablePreview();
    }

    renderTimetablePreview() {
        const preview = document.getElementById('timetablePreview');
        if (!preview) return;

        const customLectures = this.lectures
            .filter(l => l.isCustom)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

        if (customLectures.length === 0) {
            preview.innerHTML = '<p style="color: var(--text-secondary); text-align: center; margin: 0;">No lectures added yet</p>';
            return;
        }

        preview.innerHTML = customLectures.map(l => `
            <div class="lecture-item" style="margin-bottom: var(--spacing-md);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <div class="lecture-time">${l.startTime} - ${l.endTime}</div>
                        <p class="lecture-course">${l.course}</p>
                        <p class="lecture-room"><i class="fas fa-map-marker-alt" style="margin-right: 4px;"></i>${l.room}</p>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0 0 0;">
                            ${l.days.join(', ')}
                        </p>
                    </div>
                    <button class="btn-delete-file" onclick="timetableManager.deleteLecture(${l.id})" style="padding: 4px 8px;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderUI() {
        // Update stats
        document.getElementById('totalTimetables').textContent = this.timetables.length;
        document.getElementById('totalLectures').textContent = this.lectures.length;
        document.getElementById('alertStatus').textContent = this.settings.dailyAlerts ? 'ON' : 'OFF';

        // Render uploaded files
        const filesContainer = document.getElementById('uploadedFiles');
        if (this.timetables.length === 0) {
            filesContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; margin: 0;">No timetables uploaded yet</p>';
        } else {
            filesContainer.innerHTML = this.timetables.map(t => `
                <div class="file-item">
                    <div class="file-icon">
                        <i class="fas ${t.type === 'pdf' ? 'fa-file-pdf' : 'fa-image'}"></i>
                    </div>
                    <div class="file-info">
                        <p class="file-name" title="${t.name}">${t.name}</p>
                        <p class="file-time">${t.dateAdded}</p>
                    </div>
                    <div class="file-actions">
                        <button class="btn-view" onclick="timetableManager.viewTimetable(${t.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-download-file" onclick="timetableManager.downloadTimetable(${t.id})">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-delete-file" onclick="timetableManager.deleteTimetable(${t.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Render lectures (today first)
        const lectureContainer = document.getElementById('lectureSchedule');
        const todayLectures = this.getTodayLectures();

        if (this.lectures.length === 0) {
            lectureContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; margin: 0;">No lectures scheduled</p>';
        } else if (todayLectures.length === 0) {
            lectureContainer.innerHTML = `
                <p style="color: var(--text-secondary); text-align: center; margin: 0;">No lectures today</p>
                <p style="color: var(--text-secondary); font-size: 0.85rem; text-align: center; margin: var(--spacing-md) 0 0 0;">You have ${this.lectures.length} lecture(s) scheduled this week</p>
            `;
        } else {
            lectureContainer.innerHTML = todayLectures.map(l => `
                <div class="lecture-item">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <div class="lecture-time">${l.startTime} - ${l.endTime}</div>
                            <p class="lecture-course">${l.course}</p>
                            <p class="lecture-room"><i class="fas fa-map-marker-alt" style="margin-right: 4px;"></i>${l.room}</p>
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0 0 0;">
                                ${l.days.join(', ')}
                            </p>
                        </div>
                        <button class="btn-delete-file" onclick="timetableManager.deleteLecture(${l.id})" style="padding: 4px 8px;">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        let bgColor = 'linear-gradient(135deg, #6C63FF, #a39bff)';
        if (type === 'success') bgColor = 'linear-gradient(135deg, #2ED573, #6DE89F)';
        if (type === 'error') bgColor = 'linear-gradient(135deg, #FF4757, #FF8C98)';
        if (type === 'warning') bgColor = 'linear-gradient(135deg, #FFA502, #FFB84D)';

        toast.style.cssText = `
            background: ${bgColor};
            color: white;
            padding: 16px 20px;
            margin-bottom: 12px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            font-weight: 500;
        `;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    loadTimetables() {
        try {
            return JSON.parse(localStorage.getItem('kairos_timetables')) || [];
        } catch {
            return [];
        }
    }

    saveTimetables() {
        localStorage.setItem('kairos_timetables', JSON.stringify(this.timetables));
    }

    loadLectures() {
        try {
            return JSON.parse(localStorage.getItem('kairos_lectures')) || [];
        } catch {
            return [];
        }
    }

    saveLectures() {
        localStorage.setItem('kairos_lectures', JSON.stringify(this.lectures));
    }

    loadSettings() {
        try {
            const defaults = {
                dailyAlerts: false,
                soundNotif: false,
                alertAdvanceTime: '15'
            };
            return { ...defaults, ...JSON.parse(localStorage.getItem('kairos_timetable_settings')) };
        } catch {
            return {
                dailyAlerts: false,
                soundNotif: false,
                alertAdvanceTime: '15'
            };
        }
    }

    saveSettings() {
        localStorage.setItem('kairos_timetable_settings', JSON.stringify(this.settings));
    }
}

// Initialize on page load
let timetableManager;

document.addEventListener('DOMContentLoaded', () => {
    timetableManager = new TimetableManager();
});

// Global functions for HTML onclick handlers
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && timetableManager) {
        timetableManager.handleFileUpload(file);
    }
}

function addManualLecture() {
    if (timetableManager) {
        timetableManager.addManualLecture();
    }
}

function quickAddLecture() {
    if (timetableManager) {
        timetableManager.quickAddLecture();
    }
}

function saveTimetableAsNew() {
    if (timetableManager) {
        timetableManager.saveTimetableAsNew();
    }
}

function clearCreateTimetable() {
    if (timetableManager) {
        timetableManager.clearCreateTimetable();
    }
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active state from buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Set button active
    event.target.classList.add('active');

    // Render UI for create tab
    if (tabName === 'create' && timetableManager) {
        timetableManager.renderCreateUI();
    }
}

function toggleDailyAlerts() {
    if (timetableManager) {
        timetableManager.toggleDailyAlerts();
    }
}

function toggleSoundNotif() {
    if (timetableManager) {
        timetableManager.toggleSoundNotif();
    }
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
    }
`;
document.head.appendChild(style);
