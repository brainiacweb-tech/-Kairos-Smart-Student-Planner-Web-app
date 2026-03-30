# Google Integration Setup Guide

This guide will help you set up Google Drive and Google Calendar integration for the KAIROS Smart Student Planner.

## Prerequisites

- A Google account
- Access to Google Cloud Console (https://console.cloud.google.com)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter project name: "KAIROS Student Planner"
5. Click "CREATE"
6. Wait for the project to be created (this may take a few moments)

## Step 2: Enable Required APIs

1. In the Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Drive API"
3. Click on it and click "ENABLE"
4. Search for "Google Calendar API"
5. Click on it and click "ENABLE"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" > "OAuth client ID"
3. If prompted, click "CONFIGURE CONSENT SCREEN"
4. Select "External" and click "CREATE"
5. Fill in the form:
   - App name: "KAIROS Student Planner"
   - User support email: Your email
   - Developer contact: Your email
   - Click "SAVE AND CONTINUE"
6. On the "Scopes" screen, click "ADD OR REMOVE SCOPES"
7. Add these scopes:
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/calendar`
8. Click "UPDATE" then "SAVE AND CONTINUE"
9. Go back to "Credentials" and click "CREATE CREDENTIALS" > "OAuth client ID"
10. Choose "Web application"
11. Under "Authorized redirect URIs", add:
    - `http://localhost:3000`
    - `http://localhost:8080`
    - `http://localhost:5000`
    - Your production domain (if deployed online)
12. Click "CREATE"
13. Copy the Client ID and API Key

## Step 4: Configure KAIROS

1. Open `js/google-integration.js` in your text editor
2. Find the `GOOGLE_CONFIG` object at the top
3. Replace the placeholder values:
   ```javascript
   const GOOGLE_CONFIG = {
       CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',  // Paste your Client ID here
       API_KEY: 'YOUR_API_KEY',                                   // Paste your API Key here
       // ... rest of config
   };
   ```

## Features Enabled

### Google Drive Integration
- **Export Assignments**: Backup all assignments to Google Drive
- **Export Notes**: Backup all lecture notes to Google Drive
- **Upload Recordings**: Upload lecture recordings to Google Drive

### Google Calendar Integration
- **Sync Assignments**: Create calendar events for all assignments
- **Import Events**: Import events from your Google Calendar as assignments
- **Two-Way Sync**: Keep assignments and calendar events synchronized

## Usage

### Settings Page
1. Go to Settings > Google Services
2. Click "Sign in with Google"
3. Authorize the application
4. Once connected, you'll see options for Drive and Calendar

### Google Drive
- Click "Export Assignments" to backup your assignments
- Click "Export Notes" to backup your lecture notes
- Click "Upload Recordings" to backup recorded lectures

### Google Calendar
- Click "Sync Assignments" to create calendar events
- Click "Import Events" to add calendar events as assignments
- Click "Toggle Auto-Sync" to enable automatic synchronization

## Troubleshooting

### "Sign in failed"
- Make sure you've enabled both Drive and Calendar APIs
- Check that your Client ID is correct
- Verify that your redirect URI matches

### "Upload failed"
- Check that you have storage space in Google Drive
- Verify that the Google Drive API is enabled
- Check your browser console for detailed error messages

### Events not syncing
- Make sure you've clicked "Sign in with Google"
- Verify that Google Calendar is enabled in your settings
- Check that Calendar API is enabled in Google Cloud Console

### Data not persisting
- Clear your browser cache
- Check that localStorage is enabled in your browser
- Make sure you're signed in to your Google account

## Security Notes

- Never commit your API keys or Client IDs to public repositories
- Consider using environment variables for production deployments
- Regularly review connected applications in your Google Account settings
- You can revoke access at any time in Google Account settings > Security > Connected apps

## Support

For issues with Google APIs, visit:
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

## For Production Deployment

When deploying to production:

1. Update the redirect URIs in Google Cloud Console to match your domain
2. Use HTTPS for all production URLs
3. Move API keys to secure environment variables
4. Enable rate limiting and quota monitoring
5. Add error tracking and monitoring
6. Consider using a backend proxy for API calls instead of direct client-side calls

## Additional Configuration

### Customize Sync Frequency

In `js/google-integration.js`, find the sync functions and add intervals:

```javascript
// Auto-sync every 5 minutes
setInterval(() => {
    if (googleIntegration.autoSync && googleIntegration.calendarEnabled) {
        syncAssignmentsToCalendar();
    }
}, 5 * 60 * 1000);
```

### Add More Sync Folders

Modify the folder names in the export functions to organize by semester or course:

```javascript
const folderId = await getOrCreateFolder(`KAIROS ${semester}/${course}`);
```

### Backup Schedule

Create a backup schedule to automatically export data:

```javascript
// Weekly backup at Sunday 2 AM
function scheduleWeeklyBackup() {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const millisUntilSunday = daysUntilSunday * 24 * 60 * 60 * 1000;
    
    setTimeout(() => {
        uploadAssignmentsToDrive();
        uploadNotesToDrive();
        setInterval(weeklyBackup, 7 * 24 * 60 * 60 * 1000);
    }, millisUntilSunday);
}
```
