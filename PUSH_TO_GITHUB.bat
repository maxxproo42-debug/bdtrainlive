@echo off
cd /d "%~dp0"
title BD Rail Assistant - Push Update to GitHub
echo ============================================================
echo      BD RAIL ASSISTANT - PUSHING LATEST UPDATE TO GITHUB
echo ============================================================
echo.
git add -A
git commit -m "feat: Result Engine style train header, Rail Seba Pro brand, and remove eticket sync modal"
git branch -M main
echo Pushing to GitHub (https://github.com/maxxproo42-debug/bdtrainlive.git)...
git push -u origin main
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo [SUCCESS] Push completed successfully!
    echo Render will auto-build and deploy to: https://bdtrainlive.onrender.com
    echo ============================================================
) else (
    echo.
    echo [NOTICE] If push failed, check your internet or GitHub login.
)
echo.
pause
