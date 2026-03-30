# Google Integration Feature Documentation

## Overview

The KAIROS Smart Student Planner now includes comprehensive Google Cloud integration, allowing you to:

- **Backup your data** to Google Drive
- **Sync assignments** with Google Calendar
- **Import calendar events** as assignments
- **Upload lecture recordings** to Google Drive

## Features Breakdown

### Google Drive Integration

#### What You Can Backup

1. **Assignments** - All your assignment details including title, course, due date, and priority
2. **Lecture Notes** - All notes taken during lectures with course and date information
3. **Lecture Recordings** - Audio files from your recorded lectures

#### Backup Location

Files are organized in your Google Drive in these folders:
- `/KAIROS Assignments/` - Assignment exports
- `/KAIROS Lecture Notes/` - Note exports
- `/KAIROS Recordings/` - Audio recordings

#### Manual Backup vs Auto-Backup

- **Manual**: Click export buttons anytime to backup specific data types
- **Auto**: Enable auto-sync in settings (coming soon) for periodic automatic backups

### Google Calendar Integration

#### What You Can Sync

1. **Create Calendar Events** from assignments:
   - Event title: "Assignment: [Assignment Title]"
   - Event date: Assignment due date
   - Event description: Course and priority information

2. **Import Calendar Events** as assignments:
   - Calendar events become assignments
   - Automatically linked to prevent duplicates
   - Can be viewed in both Calendar and Assignments

3. **Two-Way Sync** (Premium):
   - Changes in KAIROS sync to Calendar
   - Changes in Calendar sync back to KAIROS
   - Conflict detection and resolution

## Quick Start Guide

### Step 1: Setup Google Account

1. Go to **Settings** → **Google Services**
2. Click **"Sign in with Google"** button
3. Select your Google account
4. Review permissions and click **"Allow"**

### Step 2: Enable Google Drive

1. Look for **Google Drive Backup** section
2. Click **"Export Assignments"** to backup assignments
3. Click **"Export Notes"** to backup lecture notes
4. Click **"Upload Recordings"** to backup audio files

Check your Google Drive for a new "KAIROS" folder with your backups.

### Step 3: Enable Google Calendar

1. Look for **Google Calendar Sync** section
2. Click **"Sync Assignments"** to create calendar events
3. Check your Google Calendar for new events
4. Click **"Import Events"** to add calendar events as assignments

### Step 4: Configure Auto-Sync (Optional)

1. In Google Services, toggle **"Auto-Sync"** option
2. Select sync frequency (every 5 mins, 15 mins, 1 hour, daily)
3. System will now automatically sync your data

## Detailed Feature Guide

### Dashboard Integration Status

On your Dashboard, you'll see a **Cloud Integration** section with:

- **Google Drive** card - Shows connection status and link to configure
- **Google Calendar** card - Shows sync status and link to configure
- **Data Backup** card - Manual export and backup info

Click configure buttons to go directly to settings.

### Settings Page Integration

#### Google Services Tab

The settings page includes a dedicated **Google Services** tab with:

1. **Connection Status**
   - Shows if you're signed in
   - Displays your Google email
   - Disconnect button for security

2. **Google Drive Options**
   - Export Assignments button
   - Export Notes button
   - Upload Recordings button

3. **Google Calendar Options**
   - Sync Assignments button
   - Import Events button
   - Toggle Auto-Sync button

4. **Setup Instructions**
   - Step-by-step guide for setup
   - Security information
   - Disconnection instructions

## Privacy & Security

### What Data is Shared?

When you enable Google integration, KAIROS shares:

- **With Google Drive**: Assignments, notes, and recordings you explicitly export
- **With Google Calendar**: Assignment titles, due dates, and course information

### What Data is NOT Shared?

- Your login credentials are never shared
- Sensitive personal information remains local
- Google only sees what you explicitly backup/sync

### How to Disconnect

1. Go to **Settings** → **Google Services**
2. Click the **"Disconnect"** button
3. Confirm the disconnection
4. Files already in Google Drive remain (you can delete them manually)

To revoke full access:
1. Visit [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
2. Find "KAIROS Student Planner"
3. Click and select "Remove access"

## Troubleshooting

### Common Issues

#### "Google sign-in failed"

**Solution:**
- Clear browser cookies
- Try logging in again
- Check if JavaScript is enabled
- Use a different browser

#### "Upload/Export failed"

**Solution:**
- Check Google Drive storage (might be full)
- Ensure Google Drive API is enabled in Google Cloud Console
- Check your internet connection
- Try exporting a smaller amount of data first

#### "Calendar events not syncing"

**Solution:**
- Ensure Google Calendar API is enabled
- Verify Calendar is connected in settings
- Check that your calendar is accessible
- Try refreshing the page and syncing again

#### "Data not appearing in Google Drive/Calendar"

**Solution:**
- Refresh Google Drive/Calendar in a new tab
- Check different calendar (might be synced to secondary)
- Verify file/event created with correct date range
- Check browser console for error messages

### How to Check Browser Console for Errors

1. Right-click on the page
2. Select "Inspect" or "Inspect Element"
3. Go to "Console" tab
4. Look for red error messages
5. Copy the error text and search online for solutions

## API Limits & Quotas

Google APIs have usage limits:

- **Drive API**: 100 requests per 100 seconds per user
- **Calendar API**: 1 million requests per day
- **File size**: Max 5GB per file

For normal student use, these limits are rarely reached.

## Data Format

### Exported Assignment Format

```json
{
  "id": 1234567890,
  "title": "Chemistry Project",
  "course": "CHEM 101",
  "dueDate": "2024-12-15",
  "priority": "high",
  "completed": false
}
```

### Exported Note Format

```json
{
  "course": "MATH 201 - Calculus II",
  "date": "2024-12-10",
  "content": "Derivatives and integrals...",
  "savedAt": "2024-12-10T14:30:00Z"
}
```

### Calendar Event Format

```json
{
  "summary": "Assignment: Chemistry Project",
  "description": "Course: CHEM 101\nPriority: high",
  "start": "2024-12-15T23:59:59Z",
  "end": "2024-12-16T00:59:59Z"
}
```

## Advanced Features

### Custom Backup Schedule

To schedule automatic backups edit `js/google-integration.js`:

```javascript
// Backup every Monday at 2 AM
function scheduleWeeklyBackup() {
    // Will auto-sync on Mondays
    setInterval(() => {
        if (googleIntegration.autoSync) {
            uploadAssignmentsToDrive();
            uploadNotesToDrive();
        }
    }, 7 * 24 * 60 * 60 * 1000);
}
```

### Multiple Google Accounts

Currently, KAIROS supports one Google account at a time. To switch:

1. Click "Disconnect"
2. Sign in with different Google account
3. All features will use new account

### Offline Mode

Google integration requires internet connection. When offline:

- Cloud sync buttons are disabled
- Local data continues to work normally
- Sync will resume when connection returns

## Getting Help

### Resources

- [Google Drive API Help](https://support.google.com/drive)
- [Google Calendar Help](https://support.google.com/calendar)
- [OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

### Support

If you encounter issues:

1. Check this documentation
2. Review browser console errors (F12)
3. Try clearing browser cache
4. Disconnect and reconnect Google account
5. Contact support with error details

## Version History

- **v1.0** (Current)
  - Google Drive backup
  - Google Calendar sync
  - Manual export/import
  - Basic auto-sync toggle

- **v1.1** (Future)
  - Advanced sync scheduling
  - Multiple account support
  - Selective sync settings
  - Conflict resolution UI

## FAQ

**Q: Is my data encrypted?**
A: Yes, all data transmitted to Google is encrypted in transit (HTTPS) and at rest.

**Q: Can I sync only specific assignments?**
A: Currently, sync exports all assignments. Selective sync coming in v1.1.

**Q: What if I delete files from Google Drive?**
A: They're permanently deleted. Re-export from KAIROS to restore.

**Q: Can I use multiple devices?**
A: Yes! Sign in on any device with your Google account to access the same backups.

**Q: Is there a cost?**
A: Google Drive/Calendar are free. Standard storage quotas apply.

**Q: How often does auto-sync run?**
A: You can configure: every 5 minutes, 15 minutes, hourly, or daily.

**Q: Can I export data in other formats?**
A: Currently JSON only. Export to CSV coming soon.

**Q: Is my Google password stored?**
A: No. OAuth 2.0 uses secure tokens, never passwords.

**Q: What happens to synced events if I disconnect?**
A: Events stay in Google Calendar. You can manage them independently.

**Q: Can I sync with Microsoft Outlook?**
A: Not yet, but it's on our roadmap for future versions.

## Legal & Data Usage

### Privacy Policy

Your data is processed according to:
- Google's Privacy Policy
- KAIROS's Privacy terms
- OAuth 2.0 security standards

### Data Retention

- Your local data is kept indefinitely (until you clear it)
- Google Drive files follow Google's retention policies
- Calendar events stay until manually deleted

### Cookie & Tracking

- OAuth tokens are stored locally for authentication
- No tracking or analytics on your Google data
- You can clear all tokens by disconnecting

## Feedback & Suggestions

Have ideas for improving Google integration?

- Email: feedback@kairos.edu
- Feature requests: github.com/kairos/issues
- Bug reports: support@kairos.edu

Your feedback helps us build better features!
