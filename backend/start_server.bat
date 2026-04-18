@echo off
title Kairos Backend Server
echo =======================================
echo   Kairos Smart Student Planner
echo   Python Backend Server
echo =======================================
echo.

cd /d "%~dp0"

REM Check if venv exists, if not create it
if not exist "venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install/upgrade dependencies
echo Installing dependencies...
pip install -r requirements.txt --quiet
echo.

echo Starting server on http://localhost:5000
echo Press Ctrl+C to stop.
echo.

python app.py

pause
