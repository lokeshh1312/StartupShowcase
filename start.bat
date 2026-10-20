@echo off
setlocal enabledelayedexpansion
title Startup Showcase - Local Server

echo ======================================================
echo           STARTUP SHOWCASE - LOCAL LAUNCHER
echo ======================================================
echo.

cd /d "%~dp0"

:: 1. Verify Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH.
    echo Please install Node.js 22.5 or newer from:
    echo   https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Verify dependencies are installed
if not exist "%~dp0node_modules\" (
    echo [INFO] First time setup detected. Installing dependencies...
    echo.
    call npm.cmd install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo [ERROR] Failed to install npm dependencies.
        pause
        exit /b 1
    )
    echo [INFO] Dependencies installed successfully.
    echo.
)

:: 3. Launch application via start runner
node start.mjs %*

echo.
echo [INFO] Server stopped.
pause

