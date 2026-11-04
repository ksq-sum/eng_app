@echo off
title Eng App - Start All Services
color 0A

echo.
echo ====================================================
echo           Eng App - Edge TTS Server
echo ====================================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found
    echo Please install Python 3.8+: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found
    echo Please install Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Environment check passed
echo.

REM Create virtual environment if not exists
if not exist "venv" (
    echo [1/4] Creating Python virtual environment...
    python -m venv venv
    echo.
)

REM Install Python dependencies
echo [2/4] Installing Python dependencies...
call venv\Scripts\activate.bat
pip install -q -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies
    pause
    exit /b 1
)
echo.

REM Start TTS server in background
echo [3/4] Starting Edge TTS server...
start "Edge TTS Server" cmd /c "venv\Scripts\activate.bat && python tts_server.py"
timeout /t 3 /nobreak > nul
echo.

REM Start frontend server in background
echo [4/4] Starting frontend server...
start "Frontend Server" cmd /c "node server.js"
timeout /t 2 /nobreak > nul
echo.

echo ====================================================
echo               Services Started!
echo ====================================================
echo.
echo  App:        http://localhost:5188
echo  TTS Server: http://localhost:5000
echo  Frontend:   http://localhost:5188
echo.
echo  Two service windows will open, do not close them
echo.
echo ====================================================
echo.

REM Wait for services to start
echo Waiting for services to start...
timeout /t 5 /nobreak > nul

REM Open browser
echo Opening browser...
start http://localhost:5188
echo.

echo ====================================================
echo  Press any key to close this window
echo  To stop services, close the two service windows
echo ====================================================
pause > nul
