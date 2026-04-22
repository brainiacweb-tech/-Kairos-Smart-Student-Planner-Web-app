# ✅ Python Backend Installation & Validation Checklist

## Pre-Installation Checklist

- [ ] Computer has at least 2GB free disk space
- [ ] Internet connection available
- [ ] Admin rights to install software (if needed)
- [ ] Terminal/Command Prompt access

---

## Step 1: Install Python

### Windows
- [ ] Download Python 3.8+ from https://www.python.org/downloads/
- [ ] Run installer
- [ ] **✅ IMPORTANT: Check "Add Python to PATH"**
- [ ] Complete installation
- [ ] Verify: Open Command Prompt and run `python --version`

### macOS
- [ ] Install Homebrew if not present: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- [ ] Run `brew install python3`
- [ ] Verify: `python3 --version`

### Linux
- [ ] Run `sudo apt-get install python3 python3-pip` (Ubuntu/Debian)
- [ ] Or `sudo yum install python3 python3-pip` (CentOS/RHEL)
- [ ] Verify: `python3 --version`

---

## Step 2: Navigate to Backend Directory

```bash
# From project root
cd backend
ls  # macOS/Linux - verify files exist
dir # Windows - verify files exist
```

Files to verify:
- [ ] `app.py`
- [ ] `models.py`
- [ ] `requirements.txt`
- [ ] `.env`
- [ ] `start.bat` (Windows) or `start.sh` (macOS/Linux)
- [ ] `init_db.py`

---

## Step 3: Create Virtual Environment

### Windows
```batch
python -m venv venv
venv\Scripts\activate
```

### macOS/Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

Verify activation (should show `(venv)` prefix in terminal):
- [ ] `(venv) C:\...` (Windows) or `(venv) user@...` (macOS/Linux)

---

## Step 4: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Expected packages installed:
- [ ] Flask==2.3.3
- [ ] Flask-SQLAlchemy==3.0.5
- [ ] Flask-CORS==4.0.0
- [ ] Flask-JWT-Extended==4.4.4
- [ ] werkzeug==2.3.7
- [ ] python-dotenv==1.0.0

---

## Step 5: Initialize Database

```bash
python init_db.py
```

Expected output:
```
📊 Creating database tables...
✓ Tables created
👤 Creating sample user...
✓ Sample user created: demo@kairos.edu
⚙️  Creating user settings...
✓ Settings created
📝 Creating sample assignments...
✓ Created 5 sample assignments
📅 Creating sample lectures...
✓ Created 5 sample lectures
🎓 Creating sample GPA records...
✓ Created 4 sample GPA records
📚 Creating sample study sessions...
✓ Created 4 sample study sessions

==================================================
✅ Database initialization complete!
==================================================

📋 Sample Credentials:
  Email: demo@kairos.edu
  Username: demo_student
  Password: password123
```

Files created:
- [ ] `kairos.db` (SQLite database)

---

## Step 6: Start Flask Server

### Windows (using start script)
```batch
start.bat
```

### macOS/Linux (using start script)
```bash
chmod +x start.sh
./start.sh
```

### Manual Startup
```bash
python app.py
```

Expected output:
```
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
```

Verification:
- [ ] Server running on `http://localhost:5000`
- [ ] No errors in console
- [ ] Server continues running

---

## Step 7: Verify Backend (New Terminal/Tab)

Keep Flask running in first terminal, open new terminal and run:

```bash
# Test basic connectivity
curl http://localhost:5000/api/auth/me

# Or from browser, visit:
# http://localhost:5000/api/auth/me
```

Expected response (error is OK, shows backend is responding):
```json
{
  "error": "Missing Authorization Header"
}
```

✅ This error confirms the backend is running correctly!

---

## Step 8: Start Frontend Server

Open new terminal tab:

```bash
# Make sure you're in project root (not backend folder)
cd ..

# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx http-server

# Option 3: Open directly in browser
# Windows: Double-click index.html
# macOS: Open -a "Google Chrome" index.html
```

Expected output:
```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

---

## Step 9: Test in Browser

Open browser and navigate to:
```
http://localhost:8000
```

Try this workflow:

1. [ ] Click "Sign Up"
2. [ ] Enter test credentials:
   - Full Name: Test User
   - Email: test@example.com
   - Password: Test123!
3. [ ] Click "Create Account"
4. [ ] Should redirect to dashboard
5. [ ] Create an assignment:
   - Title: "Test Assignment"
   - Due Date: Tomorrow
6. [ ] Refresh page (F5)
7. [ ] Verify assignment still appears (data persisted!)

---

## Troubleshooting

### ❌ ERROR: Python not found

**Windows:**
```
'python' is not recognized as an internal or external command
```

**Solution:**
1. Uninstall Python
2. Reinstall with ✅ "Add Python to PATH" checked
3. Restart Command Prompt
4. Try `python --version` again

**Alternative (if reinstall doesn't work):**
```bash
# Use full path
C:\Users\YourName\AppData\Local\Programs\Python\Python311\python.exe --version
```

---

### ❌ ERROR: venv not creating

**Solution:**
```bash
python -m venv venv --without-pip
venv\Scripts\python.exe -m pip install pip
venv\Scripts\activate
```

---

### ❌ ERROR: Port 5000 already in use

**Windows:**
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
lsof -i :5000
kill -9 <PID>
```

**Or change port in app.py:**
```python
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)  # Changed port
```

---

### ❌ ERROR: Module not found (e.g., Flask)

**Solution:**
```bash
# Make sure virtual env is activated (look for (venv) prefix)
# If not activated:
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux

# Then install again
pip install -r requirements.txt
```

---

### ❌ ERROR: Database is locked

**Solution:**
1. Stop Flask server (Ctrl+C)
2. Delete `kairos.db` file
3. Run `python init_db.py` again
4. Start Flask again

---

### ❌ ERROR: CORS Error in Browser

**Example Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
- Backend must run on port 5000
- Frontend must run on port 8000
- CORS is enabled in app.py (should work automatically)
- Try `http://localhost:8000` not `http://127.0.0.1:8000`

---

### ⚠️ WARNING: Login returns 401 error

**Expected:** First login fails (needs to create account first)
**Solution:** Click "Sign Up" instead of "Sign In"

---

## 🎯 Final Validation

Run through this checklist to confirm everything works:

### Frontend Tests
- [ ] Can open index.html in browser
- [ ] Can click "Sign Up"
- [ ] Can create new account
- [ ] Dashboard loads after signup
- [ ] Can create assignment
- [ ] Can see assignment on dashboard
- [ ] Assignment list shows after page refresh
- [ ] Can update assignment status
- [ ] Can delete assignment
- [ ] Stats update correctly

### Backend Tests
- [ ] API responds to requests
- [ ] Can login with API
- [ ] Can create assignments via API
- [ ] Database file exists (kairos.db)
- [ ] Sample data loaded correctly

### Offline Tests
- [ ] Stop Flask server (Ctrl+C)
- [ ] Frontend still works
- [ ] Can create assignments in offline mode
- [ ] Data stored in localStorage
- [ ] Start Flask again
- [ ] Refresh page (should sync with backend)

### Database Tests
- [ ] `kairos.db` file exists
- [ ] Sample assignments visible
- [ ] Sample lectures visible
- [ ] Can add new data
- [ ] Data persists after restart

---

## 📊 System Information (for debugging)

Collect this info if you need help:

```bash
# Python version
python --version

# Flask version
python -c "import flask; print(flask.__version__)"

# SQLAlchemy version
python -c "import sqlalchemy; print(sqlalchemy.__version__)"

# Database file
ls -la kairos.db  # macOS/Linux
dir kairos.db     # Windows

# Environment
echo %PYTHON%     # Windows
echo $PYTHON      # macOS/Linux
```

---

## ✅ Success Indicators

When everything is working correctly:

1. ✅ Backend terminal shows "Running on http://127.0.0.1:5000"
2. ✅ Frontend terminal shows "Serving HTTP"
3. ✅ Browser shows dashboard after login
4. ✅ Page refresh shows saved data
5. ✅ New assignments appear in list
6. ✅ Stats calculate correctly
7. ✅ No errors in browser console (F12 → Console tab)
8. ✅ No errors in Flask terminal

---

## 🚀 Next Steps

If all checks pass:

1. [ ] Read comprehensive documentation:
   - [PYTHON_BACKEND_README.md](PYTHON_BACKEND_README.md)
   - [backend/PYTHON_BACKEND_SETUP.md](backend/PYTHON_BACKEND_SETUP.md)
   - [FRONTEND_INTEGRATION_GUIDE.md](FRONTEND_INTEGRATION_GUIDE.md)

2. [ ] Explore features:
   - Create assignments
   - Add lectures
   - Calculate GPA
   - Track study sessions
   - View analytics

3. [ ] Customize:
   - Change pomodoro duration in settings
   - Toggle notifications
   - Try different themes

4. [ ] Deploy (optional):
   - Heroku, AWS, PythonAnywhere, etc.
   - Update API URL
   - Use production database

---

## 📞 Getting Help

1. **Check terminal output** - Look for error messages
2. **Browser console** - F12 → Console tab for frontend errors
3. **Database** - Verify `kairos.db` exists and has data
4. **Documentation** - See docs folder for detailed guides
5. **Test credentials** - Email: `demo@kairos.edu`, Password: `password123`

---

## 🎉 Congratulations!

You've successfully set up Kairos with Python backend and SQLite database!

Your app now has:
- ✅ Persistent database storage
- ✅ Multi-device access (with login)
- ✅ User authentication
- ✅ RESTful API
- ✅ Offline fallback mode
- ✅ Production-ready infrastructure

**Start planning your academic journey! 📚🎓**

---

**Questions?** Check the documentation files or review the troubleshooting section above.
