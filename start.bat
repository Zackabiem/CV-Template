@echo off
title Resume Forge Professional Studio
echo ==================================================
echo   Resume Forge Professional Studio - Launcher
echo ==================================================
echo.
echo [1/3] Verifying and installing dependencies...
call npm install --no-audit --no-fund --loglevel=error

echo.
echo [2/3] Building frontend assets...
call npm run build

echo.
echo [3/3] Launching local database server...
echo.
echo **************************************************
echo   App is starting!
echo   Open your web browser and go to:
echo   👉 http://localhost:3000
echo **************************************************
echo.

:: Automatically open default web browser
start http://localhost:3000

:: Start express/sql.js server
node server.js

pause
