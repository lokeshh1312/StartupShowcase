# Startup Showcase PowerShell Launcher
$ErrorActionPreference = "Stop"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "          STARTUP SHOWCASE - LOCAL LAUNCHER           " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# Check Node.js
try {
    $nodeVersion = node -v
    Write-Host "[INFO] Using Node.js $nodeVersion" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js 22.5+ from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

# Check node_modules
if (-not (Test-Path "$PSScriptRoot\node_modules")) {
    Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
    npm.cmd install
}

# Run launcher
node start.mjs @args
