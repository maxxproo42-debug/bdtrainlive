@echo off
chcp 65001 >nul
title Push BD Rail Assistant to GitHub
cd /d "%~dp0"

echo ========================================================
echo       BD RAIL ASSISTANT - GITHUB PUSH WIZARD
echo ========================================================
echo.
echo আপনার GitHub এ তৈরি করা নতুন Repository URL টি দিন:
echo (যেমন: https://github.com/username/bd-rail-assistant.git)
echo.
set /p REPO_URL="GitHub Repo URL: "

if "%REPO_URL%"=="" (
    echo [ERROR] কোন URL দেওয়া হয়নি!
    pause
    exit /b
)

echo.
echo [1/3] Adding files to git...
git add .
git commit -m "Update BD Rail Assistant for Render Cloud Deployment" 2>nul

echo [2/3] Configuring Remote Origin...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo [3/3] Pushing to GitHub...
git push -u origin main

echo.
echo ========================================================
echo কোড সফলভাবে GitHub-এ পুশ হয়েছে!
echo এখন render.com এ গিয়ে New Web Service হিসেবে কানেক্ট করুন।
echo ========================================================
pause
