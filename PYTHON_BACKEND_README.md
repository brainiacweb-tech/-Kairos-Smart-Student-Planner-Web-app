# 🎯 Kairos - Complete System with Python Backend & SQLite

**Version**: 2.0  
**Release Date**: April 2026  
**Status**: ✅ Production Ready

Complete student planner application with Flask backend, SQLite database, and modern web frontend.

---

## 🚀 Quick Start (Choose Your Setup)

### Option 1: Backend + Frontend (Full Stack)
```bash
# Terminal 1 - Start Backend
cd backend
# Windows
start.bat
# macOS/Linux
./start.sh

# Terminal 2 - Start Frontend
python -m http.server 8000
# Visit: http://localhost:8000
```

### Option 2: Frontend Only (LocalStorage)
```bash
# Just open index.html in browser
# Or run: python -m http.server 8000
```

---

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────┐
│         Frontend (HTML/CSS/JavaScript)              │
│  index.html, dashboard.html, assignments.html, ...  │
├─────────────────────────────────────────────────────┤
│              API Client Layer                        │
│  (api-client.js + storage-api.js)                   │
│  Auto-detects backend & falls back to localStorage  │
├─────────────────────────────────────────────────────┤
│           Flask Backend (Python) [OPTIONAL]         │
│  REST API Endpoints for all operations              │
├─────────────────────────────────────────────────────┤
│   SQLite Database (kairos.db) [OPTIONAL]            │
│   User data stored persistently                     │
└─────────────────────────────────────────────────────┘
```

### Hybrid Mode

The app intelligently handles two scenarios:

**Scenario 1: Backend Running** ✅
- User logs in with credentials
- All data stored in SQLite database
- Auto-syncs across devices
- Browser cache for offline access

**Scenario 2: Backend Offline** 📱
- Falls back to localStorage automatically
- Full functionality preserved
- No login required (demo mode)
- Data stays in browser

---

## 📦 What's New (v2.0)

### Backend
- ✅ **Flask REST API** - Complete API for all operations
- ✅ **SQLite Database** - Persistent data storage
- ✅ **User Authentication** - JWT tokens for security
- ✅ **Database Models** - Users, Assignments, Lectures, GPA, Sessions, Settings
- ✅ **Error Handling** - Comprehensive validation
- ✅ **CORS Enabled** - Cross-origin requests supported
- ✅ **Database Initialization** - Sample data setup script

### Frontend Integration
- ✅ **API Client** - Automatic backend detection
- ✅ **Hybrid Storage** - API with localStorage fallback
- ✅ **Updated Auth** - Login/Signup with backend support
- ✅ **Backward Compatible** - All existing code still works
- ✅ **Offline Mode** - Continues working without backend

---

## 📁 Project Structure

```
kairos/
├── index.html                          # Login page
├── signup.html                         # Register page
├── dashboard.html                      # Main dashboard
├── assignments.html                    # Assignment management
├── analytics.html                      # Analytics & charts
├── planner.html                        # Weekly planner
├── timetable.html                      # Timetable manager
├── settings.html                       # User settings
├── gpa-calculator.html                # GPA calculator
├── pdf-tools.html                     # PDF utilities
│
├── css/
│   ├── main.css                       # Design system & variables
│   ├── components.css                 # Reusable components
│   └── pages/
│       ├── auth.css, dashboard.css, assignments.css, etc.
│
├── js/
│   ├── api-client.js          ⭐ NEW - API client
│   ├── storage-api.js         ⭐ NEW - Hybrid storage manager
│   ├── app.js                 # Global utilities
│   ├── storage.js             # Legacy localStorage (fallback)
│   ├── dashboard.js           # Dashboard logic
│   ├── assignments.js         # Assignments logic
│   ├── timetable.js          # Timetable logic
│   ├── analytics.js          # Charts & analytics
│   ├── planner.js            # Weekly planner
│   ├── gpa-calculator.js     # GPA calculator
│   ├── settings.js           # Settings logic
│   └── google-integration.js # Google OAuth
│
├── backend/                   ⭐ NEW - Python Backend
│   ├── app.py               # Flask application & routes
│   ├── models.py            # SQLAlchemy database models
│   ├── init_db.py          # Database initialization script
│   ├── requirements.txt     # Python dependencies
│   ├── .env                # Environment variables
│   ├── start.bat           # Windows startup script
│   ├── start.sh            # macOS/Linux startup script
│   ├── PYTHON_BACKEND_SETUP.md  # Backend documentation
│   └── kairos.db           # SQLite database (auto-created)
│
├── README.md                  # Original README
├── FRONTEND_INTEGRATION_GUIDE.md  ⭐ NEW - Integration guide
├── BACKEND_SETUP_GUIDE.md         ⭐ NEW - Backend setup
└── [Other documentation files]
```

---

## 🔧 Installation & Setup

### Prerequisites
- **Python 3.8+** - Download from python.org
- **Modern Browser** - Chrome, Firefox, Safari, Edge
- **Optional**: Node.js (for better local server)

### Installation Steps

#### 1. Install Python
- Download Python from https://www.python.org/downloads/
- ✅ **Check: "Add Python to PATH"** during installation
- Verify: `python --version` or `python3 --version`

#### 2. Set Up Backend

**Windows:**
```batch
cd backend
start.bat
```

**macOS/Linux:**
```bash
cd backend
chmod +x start.sh
./start.sh
```

**Manual Setup:**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python init_db.py  # Initialize database
python app.py      # Start server
```

#### 3. Set Up Frontend

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx http-server

# Then visit: http://localhost:8000
```

#### 4. First Login

Use demo credentials from database initialization:
- **Email**: demo@kairos.edu
- **Username**: demo_student
- **Password**: password123

---

## 🎯 Key Features

### Dashboard
- Real-time statistics (total, completed, pending assignments)
- Upcoming deadlines with color-coded priority
- Mini calendar view
- Quick stats cards
- Study streak tracker
- Pomodoro timer

### Assignments Management
- Create, edit, delete assignments
- Filter by status, priority, course
- Due date tracking
- Progress indicators
- Bulk actions
- Search functionality

### Weekly Planner
- Visual timetable
- Class scheduling
- Study session planning
- Recurring lectures
- Time management

### Timetable Manager
- CSV import/export
- File upload (PDF, PNG, JPG)
- Lecture auto-extraction
- Manual entry
- Notifications

### Analytics
- Completion charts
- Priority distribution
- Due date heatmap
- Course statistics
- CSV export

### GPA Calculator
- Course tracking
- Grade-point calculation
- GPA trends
- Target setting
- Course comparison

### Settings
- Profile management
- Theme preferences (light/dark)
- Notification settings
- Pomodoro duration customization
- Google integration settings
- Lecture alert preferences

### Study Tools
- **Pomodoro Timer** - 25-min focus + 5-min breaks
- **Study Streak** - Track consecutive study days
- **Daily Tips** - Motivational productivity advice
- **Motivational Quotes** - Inspirational messages

---

## 🔐 Authentication

### Local Database (No Backend Needed)
- User data stored in browser's localStorage
- No account required
- Works offline

### Backend Authentication (Persistent)
- Create account with email/password
- JWT token-based authentication
- Auto-login on return visits
- Multi-device access with same account
- Secure password hashing (werkzeug)

---

## 📊 Database Schema

### Users Table
```sql
email, username, password_hash, created_at
```

### Assignments Table
```sql
title, description, course, status, priority, due_date, user_id
```

### Lectures Table
```sql
course_name, day_of_week, start_time, end_time, room, instructor, user_id
```

### GPA Records Table
```sql
course_name, credits, grade, grade_points, semester, user_id
```

### Study Sessions Table
```sql
date, duration_minutes, subject, notes, user_id
```

### User Settings Table
```sql
theme, notifications_enabled, pomodoro_duration, break_duration, 
lecture_alert_enabled, lecture_alert_advance_minutes, sound_alerts_enabled, user_id
```

---

## 🖥️ API Endpoints

### Base URL: `http://localhost:5000/api`

#### Auth Endpoints
```
POST   /auth/register         - Create new account
POST   /auth/login            - Login user
GET    /auth/me               - Get current user
```

#### Assignment Endpoints
```
GET    /assignments           - Get all assignments
POST   /assignments           - Create assignment
PUT    /assignments/<id>      - Update assignment
DELETE /assignments/<id>      - Delete assignment
```

#### Lecture Endpoints
```
GET    /lectures              - Get all lectures
POST   /lectures              - Create lecture
PUT    /lectures/<id>         - Update lecture
DELETE /lectures/<id>         - Delete lecture
```

#### GPA Endpoints
```
GET    /gpa/records           - Get GPA records
POST   /gpa/records           - Create GPA record
GET    /gpa/calculate         - Calculate cumulative GPA
DELETE /gpa/records/<id>      - Delete GPA record
```

#### Study Session Endpoints
```
GET    /study-sessions        - Get study sessions
POST   /study-sessions        - Create session
GET    /study-sessions/streak - Get study streak
```

#### Settings Endpoints
```
GET    /settings              - Get user settings
PUT    /settings              - Update settings
```

#### Analytics Endpoints
```
GET    /analytics/stats       - Get dashboard statistics
GET    /analytics/upcoming    - Get upcoming assignments
```

**See [backend/PYTHON_BACKEND_SETUP.md](backend/PYTHON_BACKEND_SETUP.md) for detailed API documentation.**

---

## 💻 Frontend Integration

### Including API in HTML Pages

Add these scripts to your HTML files (in order):

```html
<!-- 1. API Client -->
<script src="js/api-client.js"></script>

<!-- 2. Main App -->
<script src="js/app.js"></script>

<!-- 3. Storage Manager (API + LocalStorage) -->
<script src="js/storage-api.js"></script>

<!-- 4. Page-specific scripts -->
<script src="js/dashboard.js"></script>
```

### Using in JavaScript

```javascript
// Login
const user = await storage.loginUser(email, password);

// Fetch assignments
const assignments = await storage.getAssignments();

// Create assignment
const newAssignment = await storage.createAssignment({
    title: 'My Assignment',
    due_date: '2024-05-20T23:59:00'
});

// Update assignment
await storage.updateAssignment(id, { status: 'completed' });

// Delete assignment
await storage.deleteAssignment(id);
```

**See [FRONTEND_INTEGRATION_GUIDE.md](FRONTEND_INTEGRATION_GUIDE.md) for complete guide.**

---

## ⚙️ Configuration

### Backend Configuration (.env file)

```env
FLASK_ENV=development
FLASK_APP=app.py
SECRET_KEY=your-secret-key-change-this
JWT_SECRET_KEY=your-jwt-secret-change-this
DATABASE_URL=sqlite:///kairos.db
```

### Frontend Configuration (api-client.js)

```javascript
// Default (local development)
const baseURL = 'http://localhost:5000/api';

// Change to production URL when deploying
const baseURL = 'https://api.kairos-app.com/api';
```

---

## 🧪 Testing

### Test Workflow

1. **Start Backend**
   ```bash
   cd backend && python app.py
   ```

2. **Start Frontend**
   ```bash
   python -m http.server 8000
   ```

3. **Login with Demo Credentials**
   - Email: demo@kairos.edu
   - Password: password123

4. **Create Test Data**
   - Add assignments
   - Create lectures
   - Enter GPA records
   - Log study sessions

5. **Verify Functionality**
   - Check data persists after refresh
   - Test offline mode (stop backend)
   - Verify stats update correctly

### Test Database

Run database setup again to reset data:

```bash
cd backend
python init_db.py
```

---

## 🚀 Deployment

### Development (Local)
```bash
# Terminal 1
cd backend && python app.py

# Terminal 2
python -m http.server 8000
```

### Production (Examples)

**Heroku:**
```bash
heroku create kairos-app
git push heroku main
```

**AWS EC2:**
```bash
# Deploy Flask to EC2
# Use Gunicorn for production: pip install gunicorn
# gunicorn -w 4 app:app
```

**PythonAnywhere:**
1. Sign up at pythonanywhere.com
2. Upload code
3. Configure WSGI
4. Set environment variables

---

## 📚 Documentation

1. **Backend Setup** → [backend/PYTHON_BACKEND_SETUP.md](backend/PYTHON_BACKEND_SETUP.md)
2. **Frontend Integration** → [FRONTEND_INTEGRATION_GUIDE.md](FRONTEND_INTEGRATION_GUIDE.md)
3. **Original README** → [README.md](README.md)
4. **Getting Started** → [GETTING_STARTED.md](GETTING_STARTED.md)
5. **Feature Guide** → [FEATURE_GUIDE.md](FEATURE_GUIDE.md)

---

## 🔍 Troubleshooting

### Python Not Found
```
Error: python: command not found
Solution: Reinstall Python with "Add to PATH" checked
```

### Port 5000 Already in Use
```
Error: Address already in use
Solution: Kill process or change port in app.py
```

### Database Locked
```
Error: database is locked
Solution: Stop Flask, delete kairos.db, restart
```

### CORS Errors
```
Error: Cross-Origin Request Blocked
Solution: Ensure backend runs on port 5000, frontend on port 8000
```

### API Connection Failed
```
Error: API is unavailable
Solution: App falls back to localStorage automatically
```

For more troubleshooting, see [backend/PYTHON_BACKEND_SETUP.md](backend/PYTHON_BACKEND_SETUP.md#troubleshooting)

---

## 🔐 Security Notes

### Development
- Debug mode enabled for easier troubleshooting
- Sample user credentials provided
- CORS allows all origins

### Production (Before Deploying)
- [ ] Change `SECRET_KEY` in `.env`
- [ ] Change `JWT_SECRET_KEY` in `.env`
- [ ] Set `FLASK_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Use strong database password
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Enable CSRF protection
- [ ] Use environment variables for secrets

---

## 📈 Performance Tips

1. **Database Indexing**
   - Add indexes on frequently queried columns
   - Query optimization

2. **Caching**
   - Cache API responses in localStorage
   - Implement pagination for large result sets

3. **Frontend Optimization**
   - Lazy load assignments
   - Compress JavaScript
   - Minimize CSS

4. **Backend Optimization**
   - Use connection pooling
   - Implement query caching
   - Add response compression

---

## 🤝 Contributing

Ideas for improvement?

1. Add real-time collaboration
2. Mobile app (React Native)
3. AI-powered scheduling
4. Email notifications
5. Slack integration
6. Calendar sync (iCal)

---

## 📄 License

This project is provided as-is for educational and personal use.

---

## 🎓 What's Next?

1. ✅ Set up backend
2. ✅ Create user account
3. ✅ Add assignments
4. ✅ Track progress
5. ⭐ Deploy to production
6. 📱 Build mobile app

---

## 📞 Support

- Check documentation files (`*.md`)
- Review API endpoints in [backend/PYTHON_BACKEND_SETUP.md](backend/PYTHON_BACKEND_SETUP.md)
- Test with demo credentials
- Check browser console for error messages

---

## 🎉 Success Checklist

- [ ] Python installed (3.8+)
- [ ] Backend directory created
- [ ] Requirements installed (`pip install -r requirements.txt`)
- [ ] Database initialized (`python init_db.py`)
- [ ] Backend running on port 5000
- [ ] Frontend running on port 8000
- [ ] Can login with demo@kairos.edu / password123
- [ ] Can create/edit/delete assignments
- [ ] Data persists after page refresh
- [ ] App works offline when backend stops

---

**Happy Planning! 🎯📚✨**

For detailed setup instructions, start with [backend/PYTHON_BACKEND_SETUP.md](backend/PYTHON_BACKEND_SETUP.md)
