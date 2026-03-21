@echo off
title Digital Pulse - One-Click Launcher
color 0B
echo.
echo  ============================================================
echo    DIGITAL PULSE - AI Emergency Response Platform
echo    One-Click Setup ^& Launch
echo  ============================================================
echo.

:: Check for PRIVATE_KEYS.env
if not exist "PRIVATE_KEYS.env" (
    echo  [ERROR] PRIVATE_KEYS.env not found!
    echo  Please place the PRIVATE_KEYS.env file in the root directory.
    echo  You should have received this file privately from the team.
    echo.
    pause
    exit /b 1
)

echo  [Step 1/3] Installing dependencies for all 4 interfaces...
echo  -----------------------------------------------------------
echo.

echo  [1/4] Patient Portal (Next.js)...
cd patient-portal
call npm install --silent 2>nul
cd ..

echo  [2/4] Emergency Trigger (Vite)...
cd emergency-trigger
call npm install --silent 2>nul
cd ..

echo  [3/4] Ambulance Driver App (Vite)...
cd ambulance-driver
call npm install --silent 2>nul
cd ..

echo  [4/4] Hospital Dashboard (Vite)...
cd hospital-dashboard
call npm install --silent 2>nul
cd ..

echo.
echo  [Step 2/3] Distributing API keys to all interfaces...
echo  -----------------------------------------------------------
node setup_config.js
echo.

echo  [Step 3/3] Launching all development servers...
echo  -----------------------------------------------------------
echo.

start "Digital Pulse - Patient Portal (3000)" cmd /k "cd patient-portal && npm run dev"
timeout /t 2 /nobreak >nul

start "Digital Pulse - Hospital Dashboard (3001)" cmd /k "cd hospital-dashboard && npm run dev"
timeout /t 2 /nobreak >nul

start "Digital Pulse - Ambulance Driver (3002)" cmd /k "cd ambulance-driver && npm run dev"
timeout /t 2 /nobreak >nul

start "Digital Pulse - Emergency Trigger (3003)" cmd /k "cd emergency-trigger && npm run dev"

echo.
echo  ============================================================
echo    ALL SERVERS ARE STARTING!
echo  ============================================================
echo.
echo    Patient Portal:     http://localhost:3000
echo    Hospital Dashboard: http://localhost:3001
echo    Ambulance Driver:   http://localhost:3002
echo    Emergency Trigger:  http://localhost:3003
echo.
echo    Press any key to close this window (servers stay running).
echo  ============================================================
pause >nul
