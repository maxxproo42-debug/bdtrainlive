@echo off
chcp 65001 >nul
title Bangladesh Railway eticket Connect Tool
cd /d "%~dp0"
echo ========================================================
echo   BD RAIL ASSISTANT - OFFICIAL ETICKET CONNECT TOOL
echo ========================================================
echo.
"..\.venv\Scripts\python.exe" connect_railway.py
echo.
pause
