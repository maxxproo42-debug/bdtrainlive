@echo off
chcp 65001 >nul
title Bangladesh Railway eticket Auto-Sync Tool
cd /d "%~dp0"
echo ========================================================
echo   🚆 BD RAIL ASSISTANT - 1-CLICK ETICKET AUTO-SYNC
echo ========================================================
echo.
echo ক্রোম ব্রাউজার ওপেন হচ্ছে...
"..\.venv\Scripts\python.exe" auto_sync_eticket.py
echo.
pause
