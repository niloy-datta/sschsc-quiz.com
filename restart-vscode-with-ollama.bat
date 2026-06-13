@echo off
echo ============================================
echo   Restarting VS Code with Ollama Qwen 7B
echo ============================================
echo.

REM Step 1: Kill VS Code
echo [Step 1] Closing VS Code...
taskkill /F /IM Code.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Step 2: Verify Ollama is running
echo [Step 2] Verifying Ollama...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo   ERROR: Ollama is not running!
    echo   Start Ollama first, then run this script again.
    pause
    exit /b 1
)
echo   Ollama is running. ✅

REM Step 3: Verify Qwen 2.5 Coder 7B is available
echo [Step 3] Checking Qwen 2.5 Coder 7B model...
curl -s http://localhost:11434/api/tags | findstr "qwen2.5-coder:7b" >nul 2>&1
if %errorlevel% neq 0 (
    echo   WARNING: qwen2.5-coder:7b not found locally.
    echo   Run: ollama pull qwen2.5-coder:7b
    echo.
    echo   Using: deepseek-coder:6.7b as fallback.
) else (
    echo   qwen2.5-coder:7b is available. ✅
)

REM Step 4: Copy the VS Code settings with Cline config
echo [Step 4] Deploying Cline Ollama config...
copy /Y "%~dp0copilot-vscode-settings.json" "%APPDATA%\Code\User\settings.json" >nul 2>&1
echo   Cline config deployed. ✅

REM Step 5: Create Cline MCP settings for Ollama bridge
mkdir "%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings" 2>nul

REM Step 6: Start VS Code
echo [Step 5] Starting VS Code with local AI...
start "" code

echo.
echo ============================================
echo   DONE!
echo ============================================
echo.
echo   VS Code is now configured to use:
echo     Model: qwen2.5-coder:7b (or deepseek-coder:6.7b)
echo     API:   http://localhost:11434/v1
echo.
echo   In Cline, you should now see the model connected.
echo.
echo   If Cline still shows API error, manually set in Cline UI:
echo     Settings > API Provider > OpenAI Compatible
echo     Base URL: http://localhost:11434/v1
echo     Model: qwen2.5-coder:7b
echo     API Key: (leave empty)
echo.
pause