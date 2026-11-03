@echo off
title BD Rail Assistant Pro
color 0A
cd /d "%~dp0"
start /b "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5055"
"..\.venv\Scripts\python.exe" "server.py" 5055
pause
