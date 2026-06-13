@echo off
echo ============================================
echo   DeepSeek Coder - VS Code Local AI Setup
echo ============================================
echo.

echo [Step 1] Checking Ollama...
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ERROR: Ollama not installed.
    echo   Download from: https://ollama.com
    pause
    exit /b 1
)
echo   Ollama is installed. ✅

echo.
echo [Step 2] Pulling DeepSeek Coder 6.7B (~3.8 GB)...
echo   NOTE: Needs ~7.2 GB RAM to run. Skip if < 8 GB RAM.
choice /c YN /n /m "   Download deepseek-coder:6.7b? (Y/N): "
if %errorlevel% equ 2 (
    echo   Skipped.
) else (
    ollama pull deepseek-coder:6.7b
)

echo.
echo [Step 3] Pulling Qwen Coder 7B (~4.7 GB) - Default fallback...
echo   Works on most systems. Recommended.
choice /c YN /n /m "   Download qwen2.5-coder:7b? (Y/N): "
if %errorlevel% equ 2 (
    echo   Skipped.
) else (
    ollama pull qwen2.5-coder:7b
)

echo.
echo [Step 4] Pulling Qwen Coder 0.5B (~400 MB) - Fast autocomplete...
choice /c YN /n /m "   Download qwen2.5-coder:0.5b? (Y/N): "
if %errorlevel% equ 2 (
    echo   Skipped.
) else (
    ollama pull qwen2.5-coder:0.5b
)

echo.
echo [Step 5] Pulling Nomic Embed Text (~274 MB) - Code search...
choice /c YN /n /m "   Download nomic-embed-text? (Y/N): "
if %errorlevel% equ 2 (
    echo   Skipped.
) else (
    ollama pull nomic-embed-text:latest
)

echo.
echo ============================================
echo   VS Code - Continue Extension Setup
echo ============================================
echo.
echo [Step 6] Install Continue extension...
code --install-extension Continue.continue >nul 2>&1
echo   Continue extension install attempted. ✅

echo.
echo ============================================
echo   VS Code - GitHub Copilot Local Setup
echo ============================================
echo.
echo [Step 7] Close VS Code...
taskkill /F /IM Code.exe >nul 2>&1

echo [Step 8] Deploying Copilot local model config...
copy /Y "%~dp0copilot-chatLanguageModels.json" "%APPDATA%\Code\User\chatLanguageModels.json" >nul 2>&1
copy /Y "%~dp0copilot-vscode-settings.json" "%APPDATA%\Code\User\settings.json" >nul 2>&1
echo   Copilot config deployed. ✅

echo.
echo   Models added to Copilot:
echo     - DeepSeek Coder 6.7B  (Ollama local)
echo     - Qwen Coder 7B        (Ollama local)
echo     - Qwen Coder 0.5B      (Ollama autocomplete)
echo     - Nomic Embed Text     (Ollama embeddings)

start "" code

echo.
echo ============================================
echo   DONE - Setup Complete!
echo ============================================
echo.
echo Available models:
ollama list
echo.
echo === How to Use in VS Code ===
echo.
echo   COPILOT CHAT (Ctrl+Shift+I):
echo     - Model dropdown e "DeepSeek Coder 6.7B" / "Qwen Coder 7B"
echo.
echo   CONTINUE EXTENSION (Ctrl+L):
echo     - Model dropdown e "DeepSeek Coder 6.7B" / "Qwen Coder 7B"
echo     - Config: .continue\config.yaml
echo.
echo === Terminal Usage ===
echo   ollama run deepseek-coder:6.7b
echo   ollama run qwen2.5-coder:7b
echo.
echo === RAM Note ===
echo   deepseek-coder:6.7b needs ~7.2 GB RAM
echo   If it crashes, use qwen2.5-coder:7b instead
echo.
pause
