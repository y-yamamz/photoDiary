@echo off
setlocal enabledelayedexpansion

rem ============================================================
rem photoDiary WAR Build Script
rem ============================================================

set WAR_DIR=%~dp0
set ROOT_DIR=%WAR_DIR%..\..\..\
set BACKEND_DIR=%ROOT_DIR%backend
set FRONTEND_DIR=%ROOT_DIR%frontend

echo ==============================================
echo  photoDiary WAR Build Start
echo ==============================================

echo.
echo [1/4] Building Backend WAR...
cd /d "%BACKEND_DIR%"
if not exist "gradlew.bat" (
    echo [ERROR] gradlew.bat not found: %BACKEND_DIR%
    goto :error
)
call gradlew.bat clean bootWar --no-daemon
if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed.
    goto :error
)

echo [2/4] Copying backend.war to War folder...
set BACKEND_WAR=%BACKEND_DIR%\build\libs\backend.war
if not exist "%BACKEND_WAR%" (
    echo [ERROR] backend.war not found: %BACKEND_WAR%
    goto :error
)
copy /Y "%BACKEND_WAR%" "%WAR_DIR%backend.war" > nul
echo       -^> %WAR_DIR%backend.war

echo.
echo [3/4] Building Frontend...
cd /d "%FRONTEND_DIR%"
if not exist "package.json" (
    echo [ERROR] package.json not found: %FRONTEND_DIR%
    goto :error
)
if not exist "node_modules" (
    echo       node_modules not found. Running npm install...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] npm install failed.
        goto :error
    )
)
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed.
    goto :error
)

echo [4/4] Creating frontend.war...
set DIST_DIR=%FRONTEND_DIR%\dist
if not exist "%DIST_DIR%" (
    echo [ERROR] dist folder not found: %DIST_DIR%
    goto :error
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%WAR_DIR%create-frontend-war.ps1" -DistDir "%DIST_DIR%" -OutputWar "%WAR_DIR%frontend.war"
if %errorlevel% neq 0 (
    echo [ERROR] frontend.war creation failed.
    goto :error
)
echo       -^> %WAR_DIR%frontend.war

echo.
echo ==============================================
echo  Build Complete! Run to deploy:
echo    cd Doc\Deploy\War
echo    docker compose up -d --build
echo ==============================================
goto :end

:error
echo.
echo [FAILED] Build was interrupted.
exit /b 1

:end
endlocal
pause
