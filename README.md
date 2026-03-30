# 🎯 Kairos - Smart Student Academic Planner

A complete, modern, responsive web application for managing student assignments, planning schedules, and tracking academic progress. Built with vanilla HTML, CSS, and JavaScript.

## 🚀 Features

### ✨ Core Features
- **Authentication**: Login, Sign Up, Sign In pages with guest access
- **OAuth Integration**: Sign up/login with Google and Microsoft accounts
- **Dashboard**: Real-time stats, upcoming deadlines, mini calendar, course progress
- **Assignments Management**: Create, edit, delete, filter, and track assignments
- **Weekly Planner**: Visual timetable for scheduling classes and study sessions
- **Analytics**: Charts, heatmaps, and insights on academic performance
- **Settings**: Profile management, notification preferences, appearance customization

### 🎯 Study & Productivity Features
- **Pomodoro Timer**: 25-minute focused work sessions with 5-minute breaks
- **Study Streak**: Track consecutive days of studying with motivational fire counter
- **Daily Tips**: Personalized study tips and productivity advice (20+ tips)
- **GPA Calculator**: Full calculator to compute and track your GPA with course details
- **Focus Mode**: Minimize distractions by hiding sidebars and notifications
- **Motivational Quotes**: Daily changing inspirational quotes on auth pages (20+ quotes)
- **Exam Preview**: Quick view of upcoming exams from dashboard
- **PDF Tools**: Complete PDF management suite (merge, split, compress, watermark, convert, etc.)

### 🎨 Design System
- **Color Palette**: Purple primary (#6C63FF), Green success (#2ED573), Red danger (#FF4757), Orange warning (#FFA502)
- **Dark/Light Mode**: Toggle with localStorage persistence
- **Responsive**: Mobile-first design (360px - 1440px+)
- **Glassmorphism**: Modern blur effects and smooth transitions
- **Typography**: Poppins & Inter from Google Fonts

### 💾 Data Management
- **LocalStorage**: All data persists in browser
- **CRUD Operations**: Full assignment management
- **Mock Data**: Pre-populated on first visit
- **Export**: CSV export functionality for analytics

## 📁 File Structure

```
kairos/
├── index.html                 # Login page
├── signin.html               # Sign in page
├── signup.html               # Sign up page
├── dashboard.html            # Main dashboard
├── assignments.html          # Assignment management
├── planner.html             # Weekly planner
├── analytics.html           # Analytics & insights
├── gpa-calculator.html      # GPA Calculator
├── pdf-tools.html           # PDF Tools suite
├── settings.html            # User settings
│
├── css/
│   ├── main.css             # Design system, variables, base styles
│   ├── components.css       # Reusable components (cards, buttons, modals)
│   └── pages/
│       ├── auth.css         # Login/signup styling
│       ├── dashboard.css    # Dashboard layout & navbar
│       ├── assignments.css  # Assignment list/grid views
│       ├── planner.css      # Timetable styling
│       ├── analytics.css    # Charts and heatmap
│       └── settings.css     # Settings page
│
├── js/
│   ├── app.js               # Global utilities (theme, toasts, modals, nav)
│   ├── storage.js           # LocalStorage CRUD operations
│   ├── dashboard.js         # Dashboard functionality
│   ├── assignments.js       # Assignment management logic
│   ├── planner.js          # Timetable interactions
│   ├── analytics.js        # Chart rendering (Chart.js)
│   ├── settings.js         # Settings logic
│   ├── gpa-calculator.js   # GPA Calculator functionality
│   └── pdf-tools.js        # PDF Tools functionality
│
└── README.md               # This file
```

## 🛠️ Getting Started

### Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No backend server required
- No installation needed

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd kairos
   ```

2. **Open in browser**
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     python -m http.server 8000
     # or
     npx http-server
     ```

3. **Access the app**
   - Visit `http://localhost:8000`
   - Create an account or sign in
   - Or continue as guest

## 📖 Usage Guide

### Authentication
- **Sign Up**: Create new account with email and password
- **Sign In**: Login with existing credentials
- **OAuth Login**: Sign in with Google or Microsoft account
- **Guest Mode**: Continue without account
- **Motivational Quotes**: Daily changing inspirational quotes on all auth pages
- All settings persist in localStorage

### Dashboard
- View assignment statistics
- See upcoming deadlines
- Check mini calendar with deadline indicators
- Monitor per-course progress
- Receive notifications
- **NEW**: Use Pomodoro timer for focused study sessions
- **NEW**: Check your study streak and log today's session
- **NEW**: Get daily study tips and productivity advice
- **NEW**: View GPA calculator for grade tracking
- **NEW**: Preview upcoming exams
- **NEW**: Enable Focus Mode to eliminate distractions

### Assignments
- **Add Assignment**: Click "+ New Assignment"
- **Filter**: By course, priority, status, or search text
- **View**: Switch between list and grid views
- **Update**: Mark as done
- **Delete**: Remove assignments

### Planner
- **Weekly Timetable**: 7-day view with hourly slots
- **Add Events**: Create classes, study sessions, or personal time
- **Generate Plan**: Auto-schedule study blocks
- **Color Coded**: Different colors for event types

###  Analytics
- **Status Distribution**: Doughnut chart of completion rates
- **Workload by Course**: Bar chart showing assignments per course
- **Weekly Trend**: Line chart of completion over time
- **Heatmap**: Color-coded workload intensity calendar
- **Gantt Timeline**: Visual deadline strip
- **Export**: Download data as CSV

### GPA Calculator
- **Add Courses**: Enter course name, grade (A-F), and credit hours
- **Automatic Calculation**: Real-time GPA computation
- **Target GPA**: Set your goal GPA to track progress
- **Course Management**: Edit or delete courses anytime
- **Export Results**: Download GPA report as CSV
- **Persistent Storage**: All courses saved to localStorage
- **Grade Scale**: Standard 4.0 grading system

### PDF Tools (Like iLovePDF)
- **Merge PDFs**: Combine multiple PDF files
- **Split PDF**: Extract individual pages or page ranges
- **Compress**: Reduce PDF file size
- **Add Watermark**: Add text watermarks to protected documents
- **Convert to Images**: Export pages as JPG or PNG
- **Rotate Pages**: Change orientation (90°, 180°, 270°)
- **Unlock PDF**: Remove password protection
- **Extract Pages**: Get specific pages from PDF
- **No File Limits**: Process files of any size
- **Privacy**: All processing stays local in your browser

### Settings
- **Profile**: Update name, email, institution
- **Notifications**: Configure reminder tiers (48h, 24h, 12h, 3h, 1h)
- **Appearance**: Toggle dark/light mode, choose accent color
- **Semester**: Create new academic terms
- **Danger Zone**: Clear all data (irreversible)

## 🎓 Key Components

### Modals & Dialogs
```javascript
// Open modal
openModal(modalId);
closeModal(modalId);

// Confirmation dialog
createConfirmDialog(title, message, onConfirm, onCancel);
```

### Toast Notifications
```javascript
// Show notification
showToast(message, type); // type: success, error, warning, info
```

### Storage Operations
```javascript
// Assignments
KairosStorage.getAssignments(filter);
KairosStorage.addAssignment(assignment);
KairosStorage.updateAssignment(id, updates);
KairosStorage.deleteAssignment(id);

// Statistics
KairosStorage.getStats();
KairosStorage.getCourses();
```

### Theme Management
```javascript
toggleTheme(); // Toggle between dark and light
initTheme();   // Initialize on page load
```

## 🎨 Customization

### Change Color Scheme
Edit CSS variables in `css/main.css`:
```css
:root {
  --primary: #6C63FF;      /* Change primary color */
  --danger: #FF4757;       /* Change danger color */
  --success: #2ED573;      /* Change success color */
  /* ... */
}
```

### Modify Breakpoints
Update responsive breakpoints in `css/main.css`:
```css
@media (max-width: 767px) { /* Mobile */
@media (min-width: 768px) { /* Tablet */
@media (min-width: 1024px) { /* Desktop */
```

### Add Mock Data
Initialize mock data in `js/storage.js`:
```javascript
KairosStorage.initializeMockData();
```

## 📱 Responsive Design

| Device | Width | Sidebar | Cards | Grid |
|--------|-------|---------|-------|------|
| Mobile | < 768px | Bottom tab bar | Full width | 1 column |
| Tablet | 768-1023px | Icon only | 2 columns | 2 columns |
| Desktop | 1024px+ | Full width | 3-4 columns | 3-4 columns |

## 🔒 Data Storage

### LocalStorage Keys
- `kairos_user`: Current user info
- `kairos_theme`: Theme preference (dark/light)
- `kairos_assignments`: Array of assignments
- `kairos_events`: Calendar events
- `kairos_notifications`: Notification queue
- `kairos_settings`: User preferences
- `kairos_semesters`: Academic terms

## ⚡ Performance Optimizations

- Minimal external dependencies (only Chart.js via CDN)
- Smooth CSS transitions and animations
- Efficient localStorage queries
- Responsive images and icons (Font Awesome CDN)
- Lazy loading for notifications

## 🚨 Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE 11: ⚠️ Limited support

## 📈 Future Enhancements

- Backend API integration
- Cloud data sync
- Collaborative features
- Mobile app (React Native)
- Email notifications
- Google Calendar integration
- Dark mode auto-detection

## 🤝 Contributing

Feel free to fork, modify, and improve the project!

## 📄 License

This project is open source and available under the MIT License.

## 💡 Tips & Tricks

1. **Keyboard Shortcuts**: Use tab to navigate, Enter to submit
2. **Bulk Import**: Paste assignments to quickly populate
3. **Mobile Priority**: Tap navbar hamburger to toggle sidebar
4. **Theme Sync**: Dark mode is default, persists across sessions
5. **Empty States**: All pages handle empty data gracefully

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Data not saving | Check browser's localStorage is enabled |
| Theme not changing | Clear browser cache and reload |
| Charts not showing | Ensure Chart.js CDN is accessible |
| Mobile layout broken | Check viewport meta tag in HTML |
| Notifications not working | Verify localStorage isn't full |

## 📞 Support

For issues or questions, please check the code comments and documentation strings throughout the files.

---

**Kairos** - *Act at the right time* ⏰

Built with ❤️ for students everywhere.
