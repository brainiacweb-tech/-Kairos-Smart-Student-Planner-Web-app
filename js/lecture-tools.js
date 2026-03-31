/* ===========================
   KAIROS LECTURE TOOLS - NOTES & RECORDING
   =========================== */

// Audio Recording Setup
let mediaRecorder;
let audioChunks = [];
let recordingStartTime;
let recordingTimerInterval;
let isRecordingPaused = false;
let isPasswordProtected = false;

// Initialize Lecture Tools
document.addEventListener('DOMContentLoaded', function() {
    loadNotesFromStorage();
    loadRecordingsFromStorage();
    updateStats();
    loadPasswordSetting();
});

// ========== PASSWORD PROTECTION ==========

function togglePasswordProtect() {
    const toggle = document.getElementById('passwordProtectToggle');
    const passwordSection = document.getElementById('passwordSection');
    const courseSection = document.getElementById('courseSelectSection');
    
    isPasswordProtected = toggle.checked;
    
    if (isPasswordProtected) {
        passwordSection.style.display = 'block';
        courseSection.style.display = 'none';
    } else {
        passwordSection.style.display = 'none';
        courseSection.style.display = 'block';
        document.getElementById('notePassword').value = '';
    }
    
    localStorage.setItem('kairos_password_protect', JSON.stringify(isPasswordProtected));
}

function loadPasswordSetting() {
    const setting = JSON.parse(localStorage.getItem('kairos_password_protect') || 'false');
    if (setting) {
        document.getElementById('passwordProtectToggle').checked = true;
        togglePasswordProtect();
    }
}

// Toggle password visibility (show/hide eye button)
function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const btn = event.target.closest('.password-toggle-btn');
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

// ========== NOTE TAKING FUNCTIONALITY ==========

class LectureNote {
    constructor(id, course, content, savedAt, password = '') {
        this.id = id;
        this.course = course;
        this.content = content;
        this.savedAt = savedAt;
        this.password = password;
    }
}

function saveNote() {
    const content = document.getElementById('noteInput').value.trim();

    if (!content) {
        showToast('Please write some notes first', 'warning');
        return;
    }

    let course = '';
    let password = '';

    if (isPasswordProtected) {
        password = document.getElementById('notePassword').value;
        if (!password) {
            showToast('Please set a password for this note', 'warning');
            return;
        }
        course = 'Protected Note';
    } else {
        const courseCode = document.getElementById('noteCourseCode').value.trim();
        const courseName = document.getElementById('noteCourseName').value.trim();
        
        if (!courseCode || !courseName) {
            showToast('Please enter course code and name', 'warning');
            return;
        }
        
        course = `${courseCode} - ${courseName}`;
    }

    const notes = JSON.parse(localStorage.getItem('kairos_lecture_notes') || '[]');
    
    const newNote = new LectureNote(
        Date.now(),
        course,
        content,
        new Date().toLocaleString(),
        password
    );

    notes.push(newNote);
    localStorage.setItem('kairos_lecture_notes', JSON.stringify(notes));

    showToast('✅ Note saved successfully!', 'success');
    clearNoteInput();
    loadNotesFromStorage();
    updateStats();
}

function clearNoteInput() {
    document.getElementById('noteInput').value = '';
    document.getElementById('noteCourseCode').value = '';
    document.getElementById('noteCourseName').value = '';
    document.getElementById('notePassword').value = '';
    document.getElementById('passwordProtectToggle').checked = false;
    isPasswordProtected = false;
    document.getElementById('courseSelectSection').style.display = 'flex';
    document.getElementById('passwordSection').style.display = 'none';
}

function loadNotesFromStorage() {
    const notes = JSON.parse(localStorage.getItem('kairos_lecture_notes') || '[]');
    const notesList = document.getElementById('notesList');

    if (notes.length === 0) {
        notesList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; margin: 0;">No notes yet. Start taking notes!</p>';
        return;
    }

    notesList.innerHTML = notes.map(note => `
        <div class="note-item">
            <div class="note-item-header">
                <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    <span class="note-item-course">${note.course}</span>
                    ${note.password ? '<i class="fas fa-lock" style="color: var(--primary); font-size: 0.75rem;" title="Password Protected"></i>' : ''}
                </div>
                <span class="note-item-date">${note.savedAt}</span>
            </div>
            <div class="note-item-content">
                ${note.password ? '<em style="color: var(--text-secondary);">[Protected]</em> ' : ''}
                ${escapeHtml(note.content.substring(0, 80))}${note.content.length > 80 ? '...' : ''}
            </div>
            <div class="note-item-actions">
                <button class="btn-edit" onclick="viewNote(${note.id}, ${note.password ? 'true' : 'false'})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn-delete-note" onclick="deleteNote(${note.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function viewNote(noteId, isProtected) {
    const notes = JSON.parse(localStorage.getItem('kairos_lecture_notes') || '[]');
    const note = notes.find(n => n.id === noteId);

    if (!note) return;

    // If password protected, prompt for password
    if (isProtected && note.password) {
        const enteredPassword = prompt('This note is password protected. Enter the password:');
        if (enteredPassword !== note.password) {
            showToast('❌ Incorrect password', 'error');
            return;
        }
    }

    // Show note in modal or expand view
    const modalContent = `
        <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--spacing-lg); max-width: 600px; max-height: 70vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
                <h3 style="margin: 0; font-size: 1.1rem;">${note.course}</h3>
                <button onclick="this.closest('[data-modal]').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: var(--spacing-md);">
                ${note.savedAt}
                ${note.password ? '<span style="margin-left: var(--spacing-sm);"><i class="fas fa-lock"></i> Password Protected</span>' : ''}
            </div>
            <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--spacing-lg); min-height: 200px; max-height: 300px; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word; font-family: 'Inter', monospace; line-height: 1.6;">
                ${escapeHtml(note.content)}
            </div>
            <div style="display: flex; gap: var(--spacing-md); margin-top: var(--spacing-lg);">
                <button class="btn btn-primary" onclick="copyNoteContent('${note.id}')" style="flex: 1; cursor: pointer;">
                    <i class="fas fa-copy"></i> Copy
                </button>
                <button class="btn btn-secondary" onclick="this.closest('[data-modal]').remove()" style="flex: 1; cursor: pointer;">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;

    // Create and show modal
    const modal = document.createElement('div');
    modal.setAttribute('data-modal', 'true');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: var(--spacing-lg);
    `;
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);

    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function copyNoteContent(noteId) {
    const notes = JSON.parse(localStorage.getItem('kairos_lecture_notes') || '[]');
    const note = notes.find(n => n.id === noteId);
    
    if (note) {
        navigator.clipboard.writeText(note.content).then(() => {
            showToast('✅ Note copied to clipboard', 'success');
        });
    }
}

function deleteNote(noteId) {
    const confirmed = confirm('Are you sure you want to delete this note?');
    if (!confirmed) return;

    let notes = JSON.parse(localStorage.getItem('kairos_lecture_notes') || '[]');
    notes = notes.filter(n => n.id !== noteId);
    localStorage.setItem('kairos_lecture_notes', JSON.stringify(notes));

    showToast('Note deleted', 'info');
    loadNotesFromStorage();
    updateStats();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== SOUND RECORDING FUNCTIONALITY ==========

async function startRecording() {
    try {
        // Request access to microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Create MediaRecorder instance
        mediaRecorder = new MediaRecorder(stream, {
            audioBitsPerSecond: 128000
        });

        audioChunks = [];
        recordingStartTime = Date.now();
        isRecordingPaused = false;

        // Collect audio chunks
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        // When recording stops
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            saveRecording(audioBlob);
            audioChunks = [];
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        updateRecordingUI(true);
        startRecordingTimer();

        showToast('Recording started...', 'info');
    } catch (error) {
        showToast('Microphone access denied. Please enable microphone permissions.', 'error');
        console.error('Recording error:', error);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        clearInterval(recordingTimerInterval);
        updateRecordingUI(false);
        showToast('Recording stopped!', 'success');
    }
}

function pauseRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        isRecordingPaused = true;
        updateRecordingPauseUI(true);
        showToast('Recording paused', 'info');
    } else if (mediaRecorder && mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        isRecordingPaused = false;
        updateRecordingPauseUI(false);
        showToast('Recording resumed', 'info');
    }
}

function startRecordingTimer() {
    let seconds = 0;
    recordingTimerInterval = setInterval(() => {
        seconds++;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        document.getElementById('recordingTimer').textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
}

function updateRecordingUI(recording) {
    const startBtn = document.getElementById('startRecordBtn');
    const stopBtn = document.getElementById('stopRecordBtn');
    const pauseBtn = document.getElementById('pauseRecordBtn');
    const status = document.getElementById('recordingStatus');
    const statusText = document.getElementById('recordingStatusText');

    if (recording) {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        pauseBtn.disabled = false;
        status.classList.remove('inactive');
        statusText.textContent = '🔴 Recording...';
    } else {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        pauseBtn.disabled = true;
        status.classList.add('inactive');
        statusText.textContent = 'Ready to record';
        document.getElementById('recordingTimer').textContent = '00:00:00';
    }
}

function updateRecordingPauseUI(paused) {
    const pauseBtn = document.getElementById('pauseRecordBtn');
    const status = document.getElementById('recordingStatus');
    const statusText = document.getElementById('recordingStatusText');

    if (paused) {
        pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        status.classList.add('inactive');
        statusText.textContent = '⏸️ Paused';
    } else {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        status.classList.remove('inactive');
        statusText.textContent = '🔴 Recording...';
    }
}

function saveRecording(audioBlob) {
    // Convert blob to base64 for storage
    const reader = new FileReader();
    reader.onloadend = function() {
        const recordings = JSON.parse(localStorage.getItem('kairos_lecture_recordings') || '[]');
        
        const newRecording = {
            id: Date.now(),
            name: `Lecture Recording - ${new Date().toLocaleString()}`,
            audioData: reader.result,
            duration: calculateDuration(recordingStartTime),
            savedAt: new Date().toLocaleString(),
            course: `${(document.getElementById('noteCourseCode').value || 'General').trim()} - ${(document.getElementById('noteCourseName').value || 'Recording').trim()}`
        };

        recordings.push(newRecording);
        localStorage.setItem('kairos_lecture_recordings', JSON.stringify(recordings));

        loadRecordingsFromStorage();
        updateStats();
    };
    reader.readAsDataURL(audioBlob);
}

function calculateDuration(startTime) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function loadRecordingsFromStorage() {
    const recordings = JSON.parse(localStorage.getItem('kairos_lecture_recordings') || '[]');
    const recordingsList = document.getElementById('recordingsList');

    if (recordings.length === 0) {
        recordingsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; margin: 0;">No recordings yet.</p>';
        return;
    }

    recordingsList.innerHTML = recordings.map(recording => `
        <div class="recording-item">
            <div class="recording-item-icon">
                <i class="fas fa-file-audio"></i>
            </div>
            <div class="recording-item-info">
                <p class="recording-item-name">${recording.name}</p>
                <p class="recording-item-time">Duration: ${recording.duration}</p>
            </div>
            <div class="recording-item-actions">
                <button class="btn-play" onclick="playRecording(${recording.id})" title="Play">
                    <i class="fas fa-play"></i>
                </button>
                <button class="btn-download" onclick="downloadRecording(${recording.id})" title="Download">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn-delete" onclick="deleteRecording(${recording.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function playRecording(recordingId) {
    const recordings = JSON.parse(localStorage.getItem('kairos_lecture_recordings') || '[]');
    const recording = recordings.find(r => r.id === recordingId);

    if (recording) {
        const audio = new Audio(recording.audioData);
        audio.play();
        showToast('Playing recording...', 'info');
    }
}

function downloadRecording(recordingId) {
    const recordings = JSON.parse(localStorage.getItem('kairos_lecture_recordings') || '[]');
    const recording = recordings.find(r => r.id === recordingId);

    if (recording) {
        const link = document.createElement('a');
        link.href = recording.audioData;
        link.download = `${recording.name.replace(/\s+/g, '_')}.webm`;
        link.click();
        showToast('Download started!', 'success');
    }
}

function deleteRecording(recordingId) {
    const confirmed = confirm('Are you sure you want to delete this recording?');
    if (!confirmed) return;

    let recordings = JSON.parse(localStorage.getItem('kairos_lecture_recordings') || '[]');
    recordings = recordings.filter(r => r.id !== recordingId);
    localStorage.setItem('kairos_lecture_recordings', JSON.stringify(recordings));

    showToast('Recording deleted', 'info');
    loadRecordingsFromStorage();
    updateStats();
}

// ========== STATISTICS ==========

function updateStats() {
    const notes = JSON.parse(localStorage.getItem('kairos_lecture_notes') || '[]');
    const recordings = JSON.parse(localStorage.getItem('kairos_lecture_recordings') || '[]');

    document.getElementById('totalNotes').textContent = notes.length;
    document.getElementById('totalRecordings').textContent = recordings.length;
}
