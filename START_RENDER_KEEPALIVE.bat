@echo off
title 24/7 RENDER KEEP-ALIVE SENTINEL - BD RAIL ASSISTANT
cd /d "%~dp0"
echo ============================================================
echo   🚆 BD RAIL ASSISTANT - 24/7 RENDER KEEP-ALIVE DAEMON
echo   Pinging bdtrainlive.onrender.com every 5 minutes
echo ============================================================
echo.
"..\.venv\Scripts\python.exe" -u render_keepalive_sentinel.py
pause

