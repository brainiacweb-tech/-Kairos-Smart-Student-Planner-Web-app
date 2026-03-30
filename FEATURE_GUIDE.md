# 📚 Kairos - Comprehensive Feature Guide

Complete guide to every feature in Kairos Smart Student Planner.

---

## Table of Contents
1. [Authentication](#authentication)
2. [Dashboard](#dashboard)
3. [Assignments](#assignments)
4. [Weekly Planner](#weekly-planner)
5. [Analytics](#analytics)
6. [GPA Calculator](#gpa-calculator)
7. [PDF Tools](#pdf-tools)
8. [Study Tools](#study-tools)
9. [Settings](#settings)

---

## 🔐 Authentication

### Login Options

#### Traditional Login
**Access**: `index.html`
- **Email Field**: Enter your email or username
- **Password**: Optional (leave blank for guest access)
- **Remember Me**: Keep you logged in

**Process**:
1. Enter your login credentials
2. Check "Remember me" if desired
3. Click "Sign In"

#### OAuth Login
**Available Providers**: Google, Microsoft

**Google Login**:
- Click the Google OAuth button
- Authenticate with Google account
- Redirects to dashboard

**Microsoft Login**:
- Click the Microsoft OAuth button
- Authenticate with Microsoft account
- Redirects to dashboard

#### Guest Access
**Feature**: Login without creating account
- Click "Continue as Guest"
- Immediate access to all features
- Data stored locally on your device

### User Registration
**Access**: Click "Sign Up" link
- Create new account
- Email verification (optional)
- Password creation
- Profile setup

### Motivational Quotes
- **Display**: Authentication pages (Login, Sign Up, Sign In)
- **Rotation**: Changes daily based on date
- **Count**: 20+ curated inspirational quotes
- **Purpose**: Motivate students during login

---

## 📊 Dashboard

The central hub of Kairos with real-time stats and quick access to all features.

### Dashboard Sections

#### Quick Stats
**Real-time Overview**:
| Stat | Description |
|------|-------------|
| Total Assignments | All assignments ever created |
| Completed | Finished assignments ✓ |
| In Progress | Actively working on |
| Pending | Not yet started |
| Due Today | Deadlines today |
| Overdue | Missed deadlines |
| Due This Week | Next 7 days |

**Use Case**: Quick project status check

#### Upcoming Deadlines
- **Display**: Next 5-10 assignments
- **Sort**: By due date (nearest first)
- **Info**: Title, course, due date
- **Status Indicator**: Color by urgency
- **Quick Action**: Click to open assignment

#### Mini Calendar
- **Month View**: Current month
- **Due Dates**: Marked with indicators
- **Navigation**: Previous/next months
- **Quick Jump**: Click date to filter

#### Course Progress
- **By Course**: Each course separately
- **Progress Bar**: Visual completion %
- **Count Display**: X/Y assignments completed
- **Color Coding**: By status

#### Feature Cards

##### Pomodoro Timer
- **Display**: 25:00 countdown
- **Session**: 25 minutes focused work
- **Break**: 5-minute rest
- **Buttons**: Start, Pause, Reset
- **Audio Alert**: Bell sound when complete

##### Study Streak
- **Counter**: Days in a row studying
- **Fire Icon**: Visual motivation 🔥
- **Log Today**: Click to record study session
- **Streak Saved**: Persists across sessions

##### Daily Study Tips
- **Display**: Random study tip
- **Count**: 20+ different tips
- **Refresh**: Get new tip anytime
- **Topics**: Time management, focus, motivation

##### Quick GPA
- **Current GPA**: Your calculated GPA
- **Target GPA**: Your goal GPA
- **Visual Display**: Large, easy to read
- **Configure**: Access full GPA calculator

##### Focus Mode
- **Enable**: Hide distractions
- **Hide Sidebar**: Clean interface
- **Minimize Alerts**: Quiet notifications
- **Settings Button**: Customize experience
- **Exit Anytime**: Resume normal view

##### Upcoming Exams
- **Preview**: Next scheduled exams
- **Display**: Up to 5 exams
- **Quick Link**: Go to full assignment list
- **Schedule**: Click to create new exam

---

## 📝 Assignments

Complete assignment management system with filtering, searching, and tracking.

### Creating Assignments

**Form Fields**:
- **Title**: Assignment name *required
- **Course**: Which class (dropdown) *required
- **Description**: Details, requirements, notes
- **Due Date**: When it's due *required
- **Priority**: Low, Medium, High *required
- **Status**: Pending, In Progress, Completed
- **Attachments**: Add files (optional)
- **Notes**: Additional notes

**How to Create**:
1. Click "+ New Assignment" button
2. Fill in all required fields (marked with *)
3. Click "Add Assignment"
4. See it appear in the list

### Viewing Assignments

#### List View
- **Default Layout**: Table format
- **Columns**: Title, Course, Due, Priority, Status
- **Sort**: Click column header
- **Quick Preview**: Hover for tooltip

#### Grid View
- **Card Layout**: Visual presentation
- **Info**: Title, due date, course, priority
- **Status Badge**: Color-coded status
- **Click Card**: Open details modal

### Filtering Assignments

**Filter Options**:
- **Status**: Pending, In Progress, Completed
- **Priority**: Low, Medium, High
- **Course**: Select specific course
- **Date Range**: Custom date filtering

**How to Filter**:
1. Click "Filter" button
2. Select desired filters
3. Click "Apply"
4. Results update instantly

### Searching Assignments

**Search Features**:
- **Search Box**: Type to find
- **Search By**: Title or Course
- **Real-time**: Results as you type
- **Clear**: Reset search easily

**Example Searches**:
- "Math" → Math course assignments
- "Project" → Project in title
- "Exam" → Exam-related work

### Editing Assignments

**How to Edit**:
1. Click assignment in list
2. Click "Edit" button
3. Modify fields
4. Click "Save Changes"
5. Automatically updates

**What You Can Change**:
- All fields (Title, Course, Due Date, Priority, Status, Description)
- Changes save instantly
- Can edit multiple times

### Deleting Assignments

**How to Delete**:
1. Click assignment
2. Click "Delete" button
3. Confirm deletion
4. Assignment removed
5. Can't be recovered (no undo)

**Caution**: Deletion is permanent!

### Tracking Progress

**Status Options**:
- **Pending**: Not yet started (default)
- **In Progress**: Currently working on
- **Completed**: Finished and submitted

**How to Update Status**:
1. Open assignment
2. Click status dropdown
3. Select new status
4. Saves automatically

**Status Indicators**:
- Pending: Gray/neutral color
- In Progress: Blue/yellow color
- Completed: Green color ✓

### Bulk Actions

**Multiple Operations**:
- **Select Multiple**: Checkboxes on left
- **Bulk Status Change**: Change all at once
- **Bulk Delete**: Remove multiple
- **Bulk Export**: Export selection

---

## 📅 Weekly Planner

Visual timetable for scheduling classes and study sessions.

### Understanding the Planner

**Layout**:
- **Time Grid**: Monday-Sunday columns
- **Hours**: 8 AM - 10 PM vertically
- **Color Coding**: Different colors for different types
- **Drag & Drop**: Move events around (ready for enhancement)

### Creating Events

**Event Types**:
1. **Classes**: Regular scheduled classes
2. **Study Sessions**: Dedicated study blocks
3. **Breaks**: Rest and relax time

**How to Add Event**:
1. Click on time slot
2. Select event type
3. Enter details:
   - **Title**: Name of class/session
   - **Course**: Which class (if applicable)
   - **Duration**: Event length
   - **Notes**: Additional info
4. Click "Add" to save

### Editing Events

**How to Modify**:
1. Click event on planner
2. Edit form appears
3. Change details as needed
4. Click "Save"
5. Updates on calendar

**What You Can Change**:
- Title
- Time/Duration
- Course
- Event type
- Notes

### Deleting Events

**How to Remove**:
1. Click event
2. Click "Delete"
3. Confirm removal
4. Event disappears from planner

### color Legend

**What Colors Mean**:
| Color | Type | Usage |
|-------|------|-------|
| Purple | Classes | Scheduled lectures |
| Green | Study | Study sessions |
| Orange | Break | Rest time |
| Red | Deadline | Important dates |

### Viewing Your Week

**Features**:
- **Current Week**: Shows this week by default
- **Navigate**: Previous/next week buttons
- **Full View**: See all events at once
- **Print**: Print weekly schedule
- **Export**: Save as image

---

## 📈 Analytics

Data visualization and performance insights.

### Dashboard Charts

#### Completion Rate
- **Chart Type**: Line graph
- **Data**: Assignments completed over time
- **Trend**: See your progress
- **Use**: Motivation and tracking

#### Priority Distribution
- **Chart Type**: Pie chart
- **Data**: Low vs Medium vs High priority
- **Use**: Understand workload balance
- **Action**: Adjust priorities if needed

#### Due Date Heatmap
- **Chart Type**: Calendar heatmap
- **Data**: Density of due dates
- **Color**: Darker = more assignments
- **Use**: Identify busy periods

#### Course Performance
- **Chart Type**: Bar chart
- **Data**: Assignments per course
- **Use**: See which courses need focus
- **Filter**: By course type

### Data Insights

**Statistics Provided**:
- **Completion Rate**: % of assignments finished
- **Average Priority**: What you typically work on
- **Busiest Days**: When most work is due
- **Course Stats**: Performance by class

### Export Functionality

**Export Options**:
- **Format**: CSV (spreadsheet compatible)
- **Data**: All assignments with details
- **Use**: External analysis in Excel
- **How**: Click "Export CSV" button

**In CSV You Get**:
- Assignment ID
- Title
- Course
- Due Date
- Status
- Priority
- Created Date
- Updated Date

---

## 🎓 GPA Calculator

Calculate and track your GPA with course details.

### Understanding GPA

**GPA Scale**:
- **4.0 Scale**: Standard US grading (A=4.0, B=3.0, C=2.0, D=1.0, F=0.0)
- **Weighted GPA**: Accounts for credit hours
- **Cumulative GPA**: All courses combined

**Letter Grades**:
| Grade | GPA | Percentage |
|-------|-----|-----------|
| A | 4.0 | 90-100% |
| B | 3.0 | 80-89% |
| C | 2.0 | 70-79% |
| D | 1.0 | 60-69% |
| F | 0.0 | Below 60% |

### Adding Courses

**Course Details**:
- **Course Name**: Official course title *required
- **Course Code**: Department and number (e.g., CS101)
- **Credits**: Credit hours (typically 1-4)
- **Grade**: Letter grade (A-F) or percentage

**How to Add Course**:
1. Click "Add Course"
2. Fill in course details
3. Select grade
4. Click "Add to GPA"
5. See instant calculation

### Calculating GPA

**Calculation Method**:
```
GPA = Sum (Grade Points × Credits) / Total Credits
```

**Example**:
- CS101 (4 credits, A): 4.0 × 4 = 16.0 points
- MATH101 (3 credits, B): 3.0 × 3 = 9.0 points
- Total: 25.0 points ÷ 7 credits = 3.57 GPA

### Target GPA

**Setting Goals**:
1. Enter your **Target GPA** (e.g., 3.8)
2. See what you need to achieve it
3. Plan accordingly
4. Track progress

**What-If Analysis**:
- Add hypothetical grades
- See impact on GPA
- Plan semester grades needed

### Editing Courses

**How to Modify**:
1. Find course in list
2. Click "Edit"
3. Change grade or credits
4. Click "Update"
5. GPA recalculates automatically

### Removing Courses

**How to Delete**:
1. Find course in list
2. Click "Delete"
3. Confirm removal
4. GPA recalculates

### GPA History

**Track Over Time**:
- **Semester View**: See each semester separately
- **Cumulative**: All semesters combined
- **Trend**: See improvement/decline
- **Export**: Download your transcript

---

## 📚 PDF Tools

Complete PDF manipulation suite.

### Available Tools

#### 1. Merge PDFs
**What It Does**:
- Combine multiple PDF files into one
- Preserve all pages and formatting
- Reorder pages before merging

**How to Use**:
1. Click "Merge PDFs"
2. Upload first PDF
3. Upload second PDF (and more)
4. Click "Merge"
5. Download combined PDF

**Use Cases**:
- Combine lecture notes
- Merge assignment parts
- Create study bundles

#### 2. Split PDF
**What It Does**:
- Extract specific pages from PDF
- Create multiple PDFs from one
- Select page ranges

**How to Use**:
1. Click "Split PDF"
2. Upload PDF file
3. Select pages to extract
4. Click "Split"
5. Download extracted pages

**Use Cases**:
- Extract specific chapters
- Remove unwanted pages
- Share selective content

#### 3. Compress PDF
**What It Does**:
- Reduce file size
- Maintain readability
- Perfect for email/sharing

**How to Use**:
1. Click "Compress PDF"
2. Upload PDF
3. Select compression level
4. Click "Compress"
5. Download smaller file

**Size Reduction**:
- Low Compression: 20-30% reduction
- Medium: 40-50% reduction
- High: 60-70% reduction

#### 4. Add Watermark
**What It Does**:
- Add text or image watermark to PDF
- Protect intellectual property
- Add branding/disclaimers

**How to Use**:
1. Click "Watermark"
2. Upload PDF
3. Enter watermark text
4. Choose position and style
5. Click "Add Watermark"
6. Download watermarked PDF

**Watermark Options**:
- Text: Custom messages
- Position: Center, corners, repeated
- Opacity: Transparency level
- Color: Custom colors

#### 5. Format Conversion
**What It Does**:
- Convert PDF to other formats
- Supported output formats

**Supported Conversions**:
- PDF → DOCX (Microsoft Word)
- PDF → XLSX (Excel)
- PDF → PPTX (PowerPoint)
- PDF → Images (PNG, JPG)
- PDF → Text

**How to Use**:
1. Click "Convert"
2. Upload PDF
3. Select output format
4. Click "Convert"
5. Download converted file

#### 6. Extract Images
**What It Does**:
- Pull all images from PDF
- Save as individual files
- Batch extraction

**How to Use**:
1. Click "Extract Images"
2. Upload PDF
3. Click "Extract"
4. Download images

### File Requirements

**Accepted Formats**:
- PDF files (Adobe PDF format)
- Maximum size: 50 MB
- Multiple files: Support for batch

**File Size Limits**:
| Operation | Limit |
|-----------|-------|
| Single file | 50 MB |
| Batch merge | 100 MB total |
| Compression | 50 MB |

---

## ⏰ Study Tools

Productivity and motivation features.

### Pomodoro Timer

**What Is It?**
Scientific time-management technique using intervals:
- 25 minutes: Focused work
- 5 minutes: Short break
- After 4 cycles: 15-30 minute long break

**How to Use**:
1. Go to Dashboard or dedicated timer page
2. Click "Start" to begin
3. Focus for 25 minutes
4. When timer finishes, take 5-min break
5. Repeat cycle

**Settings**:
- **Work Duration**: Default 25 min (customizable)
- **Break Duration**: Default 5 min (customizable)
- **Sessions**: Track completed sessions
- **Sound Alert**: Bell rings when done

**Benefits**:
- ✅ Improved focus
- ✅ Reduced procrastination
- ✅ Better time awareness
- ✅ Regular breaks reduce fatigue

### Study Streak

**What Is It?**
Counter tracking consecutive days of studying to build habit.

**How It Works**:
1. Each day you study, log a session
2. Streak counter increases by 1
3. If you miss a day, streak resets
4. Track your longest streak

**How to Log Session**:
1. After studying, go to Dashboard
2. Click "Log Today"
3. Confirm it saves
4. See streak increment

**Tracking**:
- **Current Streak**: Days in a row
- **Longest Streak**: Your best ever
- **Total Sessions**: All time
- **Last Session**: When you last studied

**Motivation Tips**:
- 🔥 Aim for 30-day streak
- 🎯 Don't break the chain
- 📈 Track consistency
- 🏆 Set personal records

### Daily Study Tips

**What Are They?**
Rotating collection of study strategies and productivity advice.

**Available Tips** (20+ including):
1. "Use the Pomodoro Technique for focused study"
2. "Review material within 24 hours of learning"
3. "Study in a quiet, distraction-free environment"
4. "Take breaks every 25-30 minutes"
5. "Teach concepts to someone else"
6. "Create mind maps for complex topics"
7. "Use active recall, not passive reading"
8. "Study hardest material when fresh"
9. "Group related concepts together"
10. "Test yourself frequently"
... and 10+ more!

**How to Use**:
1. Go to Dashboard
2. See "Today's Tip" card
3. Implement the tip
4. Click "New Tip" to see another

**Tip Categories**:
- Time Management
- Focus Techniques
- Memory Strategies
- Motivation
- Organization

### Focus Mode

**What Is It?**
Distraction-minimization feature for pure productivity.

**What It Hides**:
- ❌ Sidebar navigation
- ❌ Extra UI elements
- ❌ Notifications
- ❌ Distracting buttons

**What It Shows**:
- ✅ Main content only
- ✅ Your work/assignments
- ✅ Fullscreen option
- ✅ Minimal UI

**How to Enable**:
1. Go to Dashboard
2. Click "Enable" in Focus Mode card
3. View transforms to fullscreen
4. Click "Exit Focus" to return

**Settings**:
- **Hide Time**: Don't see clock
- **Mute Notifications**: No alerts
- **Full Screen**: Maximum real estate
- **Dark/Light**: Maintain theme

**Best For**:
- Writing essays
- Working on assignments
- Deep focus work
- Test preparation

---

## ⚙️ Settings

Customize your Kairos experience.

### Profile Management

**Your Profile Includes**:
- **Name**: Your full name
- **Email**: Login email
- **Avatar**: Profile picture
- **Bio**: Optional bio/description
- **Preferences**: Your settings

**How to Update Profile**:
1. Go to Settings
2. Click "Profile"
3. Edit fields
4. Click "Save Changes"

### Theme Customization

**Theme Options**:
- **Dark Mode**: Eye-friendly dark colors
- **Light Mode**: Bright, clean appearance
- **Auto**: Switch based on time of day
- **Custom**: Create your own theme

**How to Change Theme**:
1. Go to Settings
2. Click theme toggle
3. Choose Dark or Light
4. Automatically applies
5. Setting saved to browser

**Default Theme**: Dark Mode

### Notification Preferences

**What You Can Control**:
- **Assignment Reminders**: Due date alerts
- **Study Reminders**: Time to study notifications
- **Deadline Alerts**: Urgent deadline warnings
- **Sound**: Turn audio alerts on/off
- **Desktop Notifications**: Browser notifications
- **Email Reminders**: Email notifications (if configured)

**How to Change**:
1. Go to Settings
2. Click "Notifications"
3. Toggle each option
4. Saves automatically

### Display Preferences

**Customization Options**:
- **Font Size**: Small, Medium, Large
- **Sidebar**: Show/hide navigation
- **Animations**: On/off for transitions
- **Color Scheme**: Choose accent colors
- **Language**: English, Spanish, French, etc. (if available)

**How to Customize**:
1. Settings > Display
2. Select preferences
3. Changes apply immediately
4. Save automatically

### Privacy & Data

**Your Data Control**:
- **What's Stored**: assignments, preferences, stats
- **Where**: Browser storage (your device)
- **Who Sees It**: Only you
- **Export**: Download your data as CSV
- **Delete**: Clear all data option

**Backup & Restore**:
- **Export Backup**: Settings > Export Data
- **Import Backup**: Settings > Import Data
- **Schedule**: Set automatic backups

### Account Settings

**Security Options**:
- **Password**: Change password
- **Sessions**: Active logins/devices
- **Sign Out**: Logout from device
- **Two-Factor**: Enable 2FA
- **Login History**: See access log

**How to Change Password**:
1. Settings > Account
2. Click "Change Password"
3. Enter current password
4. Enter new password twice
5. Click "Update"

### About & Support

**Application Info**:
- **Version**: Current version number
- **Last Updated**: Last system update
- **Build**: Build/release information
- **License**: Legal information

**Help & Support**:
- **Send Feedback**: Report issues
- **Getting Started**: Quick start guide
- **Feature Guide**: This document
- **Contact**: Support options

---

## 🎨 Design System

### Colors

**Primary Color (Purple)**
- Use: Main actions, buttons, highlights
- Color Code: #6C63FF
- Dark Shades: #5248E5, #3D2DBE
- Light Shades: #8878FF, #A39BFF

**Success Color (Green)**
- Use: Completed, success states
- Color Code: #2ED573
- Dark: #1DC64A
- Light: #6DE89F

**Danger Color (Red)**
- Use: Delete, high priority, alerts
- Color Code: #FF4757
- Dark: #E63946
- Light: #FF8C98

**Warning Color (Orange)**
- Use: Medium priority, warnings
- Color Code: #FFA502
- Dark: #F57C00
- Light: #FFB74D

### Typography

**Fonts**:
- **Headings**: Poppins (bold, clean)
- **Body Text**: Inter (readable, friendly)
- **Both**: Google Fonts, free & open

**Sizes**:
- **H1**: 32-40 px (page titles)
- **H2**: 24-28 px (section heads)
- **H3**: 18-20 px (subsections)
- **Body**: 14-16 px (regular text)
- **Small**: 12-13 px (captions, labels)

### Components

**Buttons**:
- **Primary**: Large, bold, main action
- **Secondary**: Outline, alternative action
- **Ghost**: Minimal, tertiary action
- **Small**: Compact buttons
- **Disabled**: Greyed out when inactive

**Cards**:
- **Default**: White/dark background with shadow
- **Elevated**: Raised appearance
- **Filled**: Solid color background
- **Outline**: Border only
- **Hover**: Subtle lift animation

**Input Fields**:
- **Text**: Username, email, search
- **Password**: Secure input
- **Date**: Date picker
- **Dropdown**: Select from options
- **Textarea**: Multi-line text
- **Checkbox**: Multiple selection
- **Radio**: Single selection

---

## 🔄 Data Synchronization

### Auto-Save Features
- **Real-time Saving**: Changes save as you type
- **Conflict Resolution**: Last save wins
- **Backup Periodic**: Every 5 minutes
- **Recovery**: Last 10 states saved

### Cloud Sync (Future Feature)
- Planned cloud integration
- Login across devices
- Automatic synchronization
- Backup to cloud storage

---

## 📞 Support & Resources

### Getting Help
- **In-App Help**: ? icon on pages
- **Feature Tips**: Hover for details
- **Documentation**: README.md file
- **Video Tutorials**: Coming soon

### Report Issues
- **Bug Report**: Settings > Send Feedback
- **Feature Request**: GitHub issues
- **Contact**: Support email in About

### Community
- **Forum**: Discuss with other users
- **Social**: Follow for updates
- **Blog**: Tips and tutorials

---

## 🎓 Final Tips

1. **Start Small**: Add assignments one course at a time
2. **Be Consistent**: Log assignments as you get them
3. **Use All Features**: Try Pomodoro, streak, GPA calc
4. **Review Regularly**: Check analytics weekly
5. **Adjust Settings**: Customize to your workflow
6. **Make It Yours**: Personalize colors and layout

---

**Happy Planning with Kairos!** ⏰✨

For more information, check out:
- README.md - Project overview
- GETTING_STARTED.md - Quick start guide
- PROJECT_VERIFICATION.md - Technical details
