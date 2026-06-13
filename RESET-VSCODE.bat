@echo off
echo === VS CODE FULL RESET ===
echo.

echo [1/3] Closing VS Code...
taskkill /F /IM Code.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Deleting VS Code data...
rmdir /s /q "%APPDATA%\Code" 2>nul
rmdir /s /q "%LOCALAPPDATA%\Code" 2>nul
rmdir /s /q "%USERPROFILE%\.vscode" 2>nul

echo [3/3] Launching VS Code...
start "" code

echo.
echo === DONE ===
echo.
echo VS Code is now FRESH. 
echo Install GitHub Copilot from Extensions and sign in.
echo.
pause
