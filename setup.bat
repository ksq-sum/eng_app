@echo off
echo Testing Python environment...
python --version
if %errorlevel% neq 0 (
    echo Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
python -m pip install --upgrade pip
pip install flask flask-cors edge-tts

echo.
echo Testing Edge TTS...
python -c "import edge_tts; print('Edge TTS installed successfully!')"

echo.
echo Setup complete! You can now run: start_tts_server.bat
pause
