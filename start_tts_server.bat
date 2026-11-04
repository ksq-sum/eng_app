@echo off
title TTS Server
color 0A

echo ========================================
echo Edge TTS Server Startup
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/3] Checking Python environment...
python --version

REM Check virtual environment
if not exist "venv" (
    echo.
    echo [2/3] Creating virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

echo.
echo [2/3] Activating virtual environment...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

echo.
echo [3/3] Installing/updating dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Starting Edge TTS Server...
echo ========================================
echo.
echo Service URL: http://localhost:5000
echo Press Ctrl+C to stop service
echo.

python tts_server.py

pause
