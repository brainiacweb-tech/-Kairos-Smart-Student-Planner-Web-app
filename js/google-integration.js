/* ===========================
   GOOGLE INTEGRATION MODULE
   =========================== */

// Google API Configuration
// Note: Replace these with your own Google Cloud Console credentials
const GOOGLE_CONFIG = {
    CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
    API_KEY: 'YOUR_API_KEY',
    DISCOVERY_DOCS: [
        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
    ],
    SCOPES: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar'
};

// Global Google Integration State
let googleIntegration = {
    isInitialized: false,
    isSignedIn: false,
    userEmail: '',
    driveEnabled: false,
    calendarEnabled: false,
    autoSync: false
};

// Initialize Google API
function initGoogleAPI() {
    if (googleIntegration.isInitialized) return;
    
    gapi.load('client:auth2', () => {
        gapi.client.init({
            apiKey: GOOGLE_CONFIG.API_KEY,
            clientId: GOOGLE_CONFIG.CLIENT_ID,
            discoveryDocs: GOOGLE_CONFIG.DISCOVERY_DOCS,
            scope: GOOGLE_CONFIG.SCOPES
        }).then(() => {
            googleIntegration.isInitialized = true;
            const auth = gapi.auth2.getAuthInstance();
            auth.isSignedIn.listen(updateSignInStatus);
            updateSignInStatus(auth.isSignedIn.get());
            loadGoogleIntegrationSettings();
        });
    });
}

// Update Sign In Status
function updateSignInStatus(isSignedIn) {
    googleIntegration.isSignedIn = isSignedIn;
    
    if (isSignedIn) {
        const profile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
        googleIntegration.userEmail = profile.getEmail();
        updateGoogleUI();
    }
}

// Sign In with Google
function signInWithGoogle() {
    gapi.auth2.getAuthInstance().signIn().catch(error => {
        showToast(`Google sign-in failed: ${error.error}`, 'error');
    });
}

// Sign Out from Google
function signOutFromGoogle() {
    if (confirm('Are you sure you want to disconnect Google integration?')) {
        gapi.auth2.getAuthInstance().signOut();
        googleIntegration.isSignedIn = false;
        googleIntegration.userEmail = '';
        localStorage.removeItem('kairos_google_settings');
        updateGoogleUI();
        showToast('Google account disconnected', 'success');
    }
}

// Update Google Integration UI
function updateGoogleUI() {
    const googleStatus = document.getElementById('googleIntegrationStatus');
    if (!googleStatus) return;
    
    if (googleIntegration.isSignedIn) {
        googleStatus.innerHTML = `
            <div style="padding: var(--spacing-md); background: rgba(52, 168, 224, 0.1); border-radius: var(--radius-lg); border: 1px solid #34A8E0;">
                <div style="display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
                    <i class="fas fa-check-circle" style="color: #2ED573; font-size: 1.5rem;"></i>
                    <div>
                        <div style="font-weight: 600;">Connected to Google</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary);">${googleIntegration.userEmail}</div>
                    </div>
                </div>
                <button class="btn btn-secondary" onclick="signOutFromGoogle()" style="width: 100%;">
                    <i class="fas fa-unlink"></i> Disconnect
                </button>
            </div>
        `;
        
        // Show integration options
        const driveOptions = document.getElementById('googleDriveOptions');
        const calendarOptions = document.getElementById('googleCalendarOptions');
        if (driveOptions) driveOptions.style.display = 'block';
        if (calendarOptions) calendarOptions.style.display = 'block';
    } else {
        googleStatus.innerHTML = `
            <div style="padding: var(--spacing-md); background: rgba(255, 152, 0, 0.1); border-radius: var(--radius-lg); border: 1px solid #FF9800;">
                <div style="margin-bottom: var(--spacing-md);">
                    <div style="font-weight: 600; margin-bottom: var(--spacing-sm);">Connect Google Account</div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">Sign in to enable Google Drive and Google Calendar integration.</div>
                </div>
                <button class="btn btn-primary" onclick="signInWithGoogle()" style="width: 100%; background: linear-gradient(135deg, #4285F4, #34A1F0);">
                    <i class="fab fa-google"></i> Sign in with Google
                </button>
            </div>
        `;
        
        // Hide integration options
        const driveOptions = document.getElementById('googleDriveOptions');
        const calendarOptions = document.getElementById('googleCalendarOptions');
        if (driveOptions) driveOptions.style.display = 'none';
        if (calendarOptions) calendarOptions.style.display = 'none';
    }
}

// Google Drive Functions
function toggleDriveSync() {
    googleIntegration.driveEnabled = !googleIntegration.driveEnabled;
    saveGoogleIntegrationSettings();
    showToast(`Google Drive sync ${googleIntegration.driveEnabled ? 'enabled' : 'disabled'}`, 'success');
}

async function uploadAssignmentsToDrive() {
    if (!googleIntegration.isSignedIn) {
        showToast('Please sign in with Google first', 'warning');
        return;
    }
    
    try {
        const assignments = JSON.parse(localStorage.getItem('kairos_assignments') || '[]');
        const folderId = await getOrCreateFolder('KAIROS Assignments');
        
        const content = `KAIROS Assignments Export\nGenerated: ${new Date().toLocaleString()}\n\n${assignments.map(a => 
            `Title: ${a.title}\nCourse: ${a.course}\nDue: ${a.dueDate}\nPriority: ${a.priority}\n---`
        ).join('\n')}`;
        
        await uploadFileToDrive(content, 'assignments-export.txt', 'text/plain', folderId);
        showToast('✅ Assignments exported to Google Drive', 'success');
    } catch (error) {
        showToast(`Upload failed: ${error.message}`, 'error');
    }
}

async function uploadNotesToDrive() {
    if (!googleIntegration.isSignedIn) {
        showToast('Please sign in with Google first', 'warning');
        return;
    }
    
    try {
        const notes = JSON.parse(localStorage.getItem('kairos_lecture_notes') || '[]');
        const folderId = await getOrCreateFolder('KAIROS Lecture Notes');
        
        const content = `KAIROS Lecture Notes Export\nGenerated: ${new Date().toLocaleString()}\n\n${notes.map(n => 
            `Course: ${n.course}\nDate: ${n.date}\n\n${n.content}\n\n---\n`
        ).join('\n')}`;
        
        await uploadFileToDrive(content, 'lecture-notes-export.txt', 'text/plain', folderId);
        showToast('✅ Notes exported to Google Drive', 'success');
    } catch (error) {
        showToast(`Upload failed: ${error.message}`, 'error');
    }
}

async function uploadRecordingsToDrive() {
    if (!googleIntegration.isSignedIn) {
        showToast('Please sign in with Google first', 'warning');
        return;
    }
    
    try {
        const recordings = JSON.parse(localStorage.getItem('kairos_lecture_recordings') || '[]');
        const folderId = await getOrCreateFolder('KAIROS Recordings');
        
        for (const recording of recordings) {
            if (recording.audioData) {
                const filename = `${recording.course.replace(/\s+/g, '_')}_${new Date(recording.savedAt).getTime()}.webm`;
                await uploadFileToDrive(recording.audioData, filename, 'audio/webm', folderId);
            }
        }
        
        showToast('✅ Recordings uploaded to Google Drive', 'success');
    } catch (error) {
        showToast(`Upload failed: ${error.message}`, 'error');
    }
}

// Google Calendar Functions
function toggleCalendarSync() {
    googleIntegration.calendarEnabled = !googleIntegration.calendarEnabled;
    if (googleIntegration.calendarEnabled) {
        syncAssignmentsToCalendar();
    }
    saveGoogleIntegrationSettings();
    showToast(`Google Calendar sync ${googleIntegration.calendarEnabled ? 'enabled' : 'disabled'}`, 'success');
}

async function syncAssignmentsToCalendar() {
    if (!googleIntegration.isSignedIn) {
        showToast('Please sign in with Google first', 'warning');
        return;
    }
    
    try {
        const assignments = JSON.parse(localStorage.getItem('kairos_assignments') || '[]');
        
        for (const assignment of assignments) {
            await createCalendarEvent({
                summary: `Assignment: ${assignment.title}`,
                description: `Course: ${assignment.course}\nPriority: ${assignment.priority}`,
                start: new Date(assignment.dueDate),
                end: new Date(new Date(assignment.dueDate).getTime() + 60*60*1000)
            });
        }
        
        showToast('✅ Assignments synced to Google Calendar', 'success');
    } catch (error) {
        showToast(`Sync failed: ${error.message}`, 'error');
    }
}

async function importCalendarEvents() {
    if (!googleIntegration.isSignedIn) {
        showToast('Please sign in with Google first', 'warning');
        return;
    }
    
    try {
        const events = await getCalendarEvents();
        const assignments = JSON.parse(localStorage.getItem('kairos_assignments') || '[]');
        
        for (const event of events) {
            if (!assignments.some(a => a.googleEventId === event.id)) {
                assignments.push({
                    id: Date.now(),
                    title: event.summary,
                    course: 'Imported',
                    dueDate: event.start.dateTime || event.start.date,
                    priority: 'medium',
                    completed: false,
                    googleEventId: event.id
                });
            }
        }
        
        localStorage.setItem('kairos_assignments', JSON.stringify(assignments));
        showToast('✅ Calendar events imported', 'success');
    } catch (error) {
        showToast(`Import failed: ${error.message}`, 'error');
    }
}

// Helper Functions
async function getOrCreateFolder(folderName) {
    try {
        const result = await gapi.client.drive.files.list({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            spaces: 'drive',
            pageSize: 1
        });
        
        if (result.result.files && result.result.files.length > 0) {
            return result.result.files[0].id;
        }
        
        return await createFolder(folderName);
    } catch (error) {
        console.error('Error getting folder:', error);
        throw error;
    }
}

async function createFolder(folderName) {
    try {
        const result = await gapi.client.drive.files.create({
            resource: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            },
            fields: 'id'
        });
        return result.result.id;
    } catch (error) {
        console.error('Error creating folder:', error);
        throw error;
    }
}

async function uploadFileToDrive(content, filename, mimeType, folderId) {
    try {
        const file = new File([content], filename, { type: mimeType });
        
        const metadata = {
            name: filename,
            mimeType: mimeType,
            parents: [folderId]
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);
        
        return await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + gapi.auth.getToken().access_token }),
            body: form
        }).then(res => res.json());
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

async function createCalendarEvent(event) {
    try {
        return await gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: event
        });
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
}

async function getCalendarEvents() {
    try {
        const result = await gapi.client.calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),
            showDeleted: false,
            singleEvents: true,
            maxResults: 100,
            orderBy: 'startTime'
        });
        return result.result.items || [];
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}

// Save/Load Integration Settings
function saveGoogleIntegrationSettings() {
    localStorage.setItem('kairos_google_integration', JSON.stringify({
        driveEnabled: googleIntegration.driveEnabled,
        calendarEnabled: googleIntegration.calendarEnabled,
        autoSync: googleIntegration.autoSync
    }));
}

function loadGoogleIntegrationSettings() {
    const saved = localStorage.getItem('kairos_google_integration');
    if (saved) {
        const settings = JSON.parse(saved);
        googleIntegration.driveEnabled = settings.driveEnabled || false;
        googleIntegration.calendarEnabled = settings.calendarEnabled || false;
        googleIntegration.autoSync = settings.autoSync || false;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if Google API script is loaded
    if (typeof gapi !== 'undefined') {
        initGoogleAPI();
    }
});
