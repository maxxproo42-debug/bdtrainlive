@echo off
cd /d "%~dp0"
title BD Rail Assistant - Push to GitHub

if exist "..\.venv\Scripts\python.exe" (
    "..\.venv\Scripts\python.exe" push_to_github.py
) else (
    python push_to_github.py
)
if errorlevel 1 pause
