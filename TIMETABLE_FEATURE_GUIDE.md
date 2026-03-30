# 📅 Timetable Manager - Feature Guide

## Overview
The Timetable Manager is a comprehensive school schedule management system with file upload support, daily lecture alerts, and a clean interface for managing your academic calendar.

## Features

### 1. **File Upload Support**
- **Supported Formats**: PDF, PNG, JPG, JPEG, CSV
- **Drag & Drop**: Simply drag files onto the upload area
- **Click to Browse**: Click the upload area to select files
- **File Management**: View, download, or delete uploaded timetables
- **CSV Parsing**: Auto-parse CSV files to extract lecture information

### 2. **Lecture Management**
- **Manual Entry**: Add lectures directly in the interface
- **Auto-Detection**: Extract lectures from uploaded CSV files
- **Recurring Lectures**: Set lectures for specific days of the week
- **Time Scheduling**: Define start and end times for each lecture
- **Location Tracking**: Store room/location information

### 3. **Daily Alerts & Notifications**
- **Real-Time Checking**: System checks for upcoming lectures every minute
- **Customizable Timing**: Set alert advance time (5, 10, 15, 30 minutes, or 1 hour)
- **Audio Notifications**: Optional sound alerts using Web Audio API
- **Browser Notifications**: System tray notifications when enabled
- **Toast Alerts**: In-app toast notifications for immediate feedback

### 4. **Smart Display**
- **Today's Lectures**: Automatically shows lectures scheduled for today
- **Statistics**: 
  - Total uploaded timetables
  - Total lectures scheduled
  - Alert status (ON/OFF)
- **Detailed View**: Each lecture shows time, course name, room, and days

## How to Use

### Uploading a Timetable

1. **Via File Browser**:
   - Click the upload area
   - Select a PDF, image, or CSV file
   - File is automatically saved

2. **Via Drag & Drop**:
   - Drag your timetable file
   - Drop it onto the upload area
   - File is automatically processed

### Adding Lectures Manually

1. Go to "Add Lecture Manually" section
2. Enter course name (required)
3. Enter room/location (optional)
4. Select which days the lecture occurs
5. Set start time (required)
6. Set end time (optional)
7. Click "Add Lecture"

### Parsing CSV Files

Expected CSV Format:
```
Course Name,Time,Room,Days
Physics I,09:00-10:30,A101,Monday|Wednesday|Friday
Calculus II,14:00-15:30,B205,Tuesday|Thursday
```

Columns:
- **Course Name**: Name of the course
- **Time**: Lecture time (HH:MM or HH:MM-HH:MM format)
- **Room**: Room/location (optional)
- **Days**: Days separated by | (optional)

### Enabling Daily Alerts

1. Go to "Notification Settings"
2. Toggle "Daily Lecture Alerts"
3. Set "Alert Advance Time" (how many minutes before lecture)
4. Enable "Sound Notification" for audio alerts
5. System will now alert you for upcoming lectures

### Managing Lectures

**View/Edit**:
- Lectures are displayed in "Your Lectures" section
- Shows time, course name, room, and recurring days

**Delete**:
- Click trash icon next to any lecture
- Confirm deletion
- Lecture will be removed from schedule

## Data Storage

- **Timetables**: Stored in browser localStorage (key: `kairos_timetables`)
- **Lectures**: Stored in browser localStorage (key: `kairos_lectures`)
- **Settings**: Stored in browser localStorage (key: `kairos_timetable_settings`)

**Note**: Data persists across browser sessions but is local to your device.

## Technical Details

### File Handleing
- Images: Converted to base64 data URLs
- PDFs: Stored as base64 data URLs
- CSV: Parsed for lecture extraction

### Alert System
- Checks for upcoming lectures every 60 seconds
- Uses sessionStorage to prevent duplicate alerts
- Supports Browser Notifications API (requires permission)
- Fallback to toast notifications if browser notifications denied

### Responsive Design
- Optimized for desktop, tablet, and mobile
- Touch-friendly interface
- Adaptive grid layouts

## API & JavaScript

### TimetableManager Class

```javascript
// Initialize
const manager = new TimetableManager();

// Add lecture manually
manager.addManualLecture();

// Get today's lectures
const todayLectures = manager.getTodayLectures();

// Enable/disable alerts
manager.toggleDailyAlerts();
manager.toggleSoundNotif();

// File operations
manager.downloadTimetable(id);
manager.deleteTimetable(id);
manager.deleteLecture(id);
```

### Storage Keys
```javascript
// Timetables array
localStorage.getItem('kairos_timetables')

// Lectures array
localStorage.getItem('kairos_lectures')

// Settings object
localStorage.getItem('kairos_timetable_settings')

// Alert notifications (session-based)
sessionStorage.getItem(`notified_${lectureId}_${date}`)
```

## Tips & Tricks

1. **CSV Import**: Use the CSV format for quick bulk import of multiple lectures
2. **Recurring Lectures**: Select all relevant days when adding a lecture course
3. **Alert Timing**: Set advance time based on your preference (15 min recommended)
4. **Sound Alerts**: Use sound alerts if you often miss desktop notifications
5. **Browser Storage**: Allow browser notifications for system tray alerts

## Troubleshooting

### Alerts Not Working
- Check if browser notifications are enabled
- Verify "Daily Lecture Alerts" toggle is ON
- Check system time matches your computer's time
- Clear browser cache and refresh page

### File Upload Issues
- Ensure file format is PDF, PNG, JPG, or CSV
- Check file size (localStorage limit ~5-10MB per domain)
- Try different format if CSV parsing fails

### Data Not Persisting
- Check if localStorage is enabled in browser settings
- Private/Incognito mode may not persist data
- Clear browser cache partially (keep cookies)

## Updates & Improvements

### Recently Added
- ✅ File upload with CSV parsing
- ✅ Daily lecture alerts
- ✅ Manual lecture entry
- ✅ Customizable notification settings
- ✅ Audio alert option
- ✅ Browser notification integration

### Future Enhancements
- Calendar view for the week/month
- Multiple timetable support with switching
- Sync with cloud storage
- Reminder notifications
- Integration with dashboard

---

**Questions or Issues?** Check the main project documentation or app settings.
