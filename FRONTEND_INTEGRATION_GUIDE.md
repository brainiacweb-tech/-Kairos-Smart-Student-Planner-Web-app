# 🔄 Frontend Integration Guide - API & SQLite Backend

## Overview

The Kairos Smart Student Planner now supports a **hybrid mode** that automatically detects whether the Flask backend is running. If it is, all data is stored in SQLite; if not, the app falls back to localStorage.

## Feature Comparison

| Feature | Before (LocalStorage) | After (API + SQLite) |
|---------|----------------------|----------------------|
| Data Persistence | Browser-only | Multiple devices (with login) |
| Auto-sync | No | Yes |
| Offline Mode | Full | Partial (falls back to localStorage) |
| User Accounts | Optional | Required for backend |
| Data Privacy | Private | Encrypted (with SSL in production) |
| Backup | Manual export | Automatic with database |
| Scalability | Single browser | Multi-device/cloud |

## What You Don't Need to Change

The frontend code is **backward compatible**! You don't need to change your existing JavaScript logic:

```javascript
// The storage manager handles everything automatically
const assignments = await storage.getAssignments();
const updated = await storage.updateAssignment(id, data);
```

## How to Use

### 1. Include Required Scripts

In all HTML pages that use data, include these scripts **in order**:

```html
<!-- Load API client first -->
<script src="js/api-client.js"></script>

<!-- Load main app utilities -->
<script src="js/app.js"></script>

<!-- Load storage manager (hybrid mode) -->
<script src="js/storage-api.js"></script>

<!-- Then load your page-specific scripts -->
<script src="js/assignments.js"></script>
```

### 2. Update Existing Functions

If you're using the old `storage` object directly (from `storage.js`), it now automatically routes to the API when available:

```javascript
// OLD CODE - Still works!
const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');

// NEW CODE - Better! Uses API if available
const assignments = await storage.getAssignments();
```

### 3. Working in Offline Mode

The app automatically falls back to localStorage if the backend is not running:

```javascript
try {
    // Try API first
    const data = await storage.getAssignments();
    console.log('Data from API');
} catch (error) {
    // Falls back automatically
    console.log('Offline mode - using localStorage');
    const data = JSON.parse(localStorage.getItem('assignments') || '[]');
}
```

## Implementation Examples

### Login Example

**Before:**
```javascript
localStorage.setItem('kairos_user', JSON.stringify({
    email: email,
    name: username
}));
```

**After:**
```javascript
try {
    const user = await storage.loginUser(email, password);
    console.log('Logged in with backend');
} catch (error) {
    // Falls back to localStorage
    localStorage.setItem('kairos_user', JSON.stringify({
        email: email,
        name: username
    }));
}
```

### Creating Assignment

**Before:**
```javascript
const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
const newAssignment = {
    id: Date.now(),
    title: 'My Assignment',
    due_date: dueDate
};
assignments.push(newAssignment);
localStorage.setItem('assignments', JSON.stringify(assignments));
```

**After:**
```javascript
const newAssignment = await storage.createAssignment({
    title: 'My Assignment',
    due_date: dueDate
});
// API automatically saves to database or falls back to localStorage
```

### Getting Statistics

**Before:**
```javascript
function getStats() {
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    return {
        total: assignments.length,
        completed: assignments.filter(a => a.status === 'completed').length
    };
}
```

**After:**
```javascript
const stats = await storage.getStats();
// Returns: { total_assignments, completed, in_progress, pending, ... }
```

## API Methods Reference

### Authentication
```javascript
// Register new user
await storage.registerUser(email, username, password);

// Login existing user
const user = await storage.loginUser(email, password);

// Get current user
const user = storage.getCurrentUser();

// Logout
storage.logout();

// Check if authenticated
const isAuth = storage.isAuthenticated();
```

### Assignments
```javascript
// Get all assignments
const assignments = await storage.getAssignments();

// Create assignment
const assignment = await storage.createAssignment({
    title: 'Assignment Title',
    course: 'CS101',
    due_date: '2024-05-20T23:59:00',
    priority: 'high',
    status: 'pending'
});

// Update assignment
const updated = await storage.updateAssignment(assignmentId, {
    status: 'completed',
    priority: 'medium'
});

// Delete assignment
await storage.deleteAssignment(assignmentId);
```

### Lectures
```javascript
// Get all lectures
const lectures = await storage.getLectures();

// Create lecture
const lecture = await storage.createLecture({
    course_name: 'Computer Science 101',
    day_of_week: 0,  // 0=Monday
    start_time: '09:00',
    end_time: '10:30',
    room: 'A101'
});

// Update lecture
await storage.updateLecture(lectureId, { room: 'B202' });

// Delete lecture
await storage.deleteLecture(lectureId);
```

### GPA
```javascript
// Get all GPA records
const records = await storage.getGPARecords();

// Create GPA record
const record = await storage.createGPARecord({
    course_name: 'Calculus I',
    credits: 4.0,
    grade: 'A',
    semester: 'Spring 2024'
});

// Calculate GPA
const gpa = await storage.calculateGPA();
// Returns: { gpa: 3.85, total_credits: 16.0, record_count: 4 }

// Delete GPA record
await storage.deleteGPARecord(recordId);
```

### Study Sessions
```javascript
// Get study sessions
const sessions = await storage.getStudySessions();

// Create study session
const session = await storage.createStudySession({
    date: '2024-04-16',
    duration_minutes: 60,
    subject: 'Mathematics',
    notes: 'Studied calculus'
});

// Get study streak
const streak = await storage.getStudyStreak();
// Returns: { current_streak: 5, longest_streak: 12 }
```

### Settings
```javascript
// Get user settings
const settings = await storage.getSettings();

// Update settings
const updated = await storage.updateSettings({
    theme: 'dark',
    notifications_enabled: true,
    pomodoro_duration: 25,
    break_duration: 5
});
```

### Analytics
```javascript
// Get dashboard statistics
const stats = await storage.getStats();
// Returns: { total_assignments, completed, in_progress, pending, due_today, overdue, due_this_week }

// Get upcoming assignments
const upcoming = await storage.getUpcomingAssignments();
```

## Error Handling

```javascript
try {
    const assignments = await storage.getAssignments();
    console.log('Success:', assignments);
} catch (error) {
    console.error('Error:', error.message);
    
    // Fallback to localStorage
    const fallbackAssignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    console.log('Using offline data:', fallbackAssignments);
}
```

## Performance Optimization

### 1. Cache API Responses
```javascript
// Store API response in localStorage for faster access
localStorage.setItem('assignments_cache', JSON.stringify(assignmentsFromAPI));
```

### 2. Batch Operations
```javascript
// Get multiple data types in parallel
const [assignments, lectures, settings] = await Promise.all([
    storage.getAssignments(),
    storage.getLectures(),
    storage.getSettings()
]);
```

### 3. Lazy Loading
```javascript
// Only fetch when needed
if (!this.assignmentsLoaded) {
    this.assignments = await storage.getAssignments();
    this.assignmentsLoaded = true;
}
```

## Debugging

### Enable Console Logging
```javascript
// The storage manager logs all API calls
// Watch the browser console for detailed logs
```

### Check Backend Status
```javascript
// Test if backend is reachable
fetch('http://localhost:5000/api/auth/me')
    .then(r => r.json())
    .then(data => console.log('Backend status:', data))
    .catch(e => console.log('Backend offline:', e.message));
```

### Inspect LocalStorage
```javascript
// View stored data in browser console
console.log(localStorage.getItem('assignments'));
console.log(localStorage.getItem('accessToken'));
```

## Migration Path

### Phase 1: Development
- Backend running locally (http://localhost:5000)
- Frontend uses API by default
- Falls back to localStorage if backend stops

### Phase 2: Testing
- Replace localhost with staging server
- Test multi-device sync
- Verify fallback behavior

### Phase 3: Production
- Deploy backend to cloud (Heroku, AWS, etc.)
- Change API base URL in `api-client.js`
- All new data automatically goes to database

## Updating API Base URL

To connect to a different backend server, edit `js/api-client.js`:

```javascript
// Default (local development)
const api = new APIClient('http://localhost:5000/api');

// For production
const api = new APIClient('https://api.kairos-app.com/api');

// Or make it configurable
const baseURL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const api = new APIClient(baseURL);
```

## Frequently Asked Questions

### Q: Do I need to rewrite all my JavaScript?
**A:** No! The storage manager is backward compatible. Your existing code continues to work.

### Q: What if the backend is down?
**A:** The app automatically falls back to localStorage. Users can continue working in offline mode.

### Q: How do I switch back to pure localStorage?
**A:** Remove the API scripts and use the old `storage.js` directly.

### Q: Can I run the backend on a different machine?
**A:** Yes! Change the API base URL in `api-client.js` to point to your backend server.

### Q: How is my password encrypted?
**A:** Passwords are hashed with werkzeug.security in the backend. Never stored in plain text.

### Q: Can I export my data?
**A:** Yes! Database can be backed up or exported. LocalStorage data can be exported as JSON.

## Next Steps

1. ✅ Include the new API scripts in your HTML
2. ✅ Start the Flask backend
3. ✅ Login with your account
4. ✅ Create test data
5. ✅ Verify data syncs across browser refreshes
6. ✅ Test offline mode by stopping backend
7. ✅ Deploy backend to production when ready

---

For detailed backend setup, see [backend/PYTHON_BACKEND_SETUP.md](backend/PYTHON_BACKEND_SETUP.md)

Happy coding! 🚀
