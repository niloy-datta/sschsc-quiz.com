# Start Ollama for Cursor Chat (CORS enabled)
$ErrorActionPreference = "Stop"

# Cursor needs this or browser CORS blocks localhost:11434
[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")
$env:OLLAMA_ORIGINS = "*"

$model = "qwen2.5-coder:14b"

Write-Host "Ollama for Cursor — model: $model" -ForegroundColor Cyan
Write-Host "API: http://localhost:11434/v1" -ForegroundColor Gray

# Warm up model (optional, speeds first chat)
Write-Host "Loading model..." -ForegroundColor Yellow
ollama run $model "ready" 2>$null | Out-Null

Write-Host ""
Write-Host "Cursor setup:" -ForegroundColor Green
Write-Host "  1. Restart Cursor (Ctrl+Shift+P -> Reload Window)"
Write-Host "  2. Cursor Settings -> Models"
Write-Host "  3. Override OpenAI Base URL: http://localhost:11434/v1"
Write-Host "  4. API Key: ollama"
Write-Host "  5. Add model: $model"
Write-Host "  6. Chat: Ctrl+L, select $model"
Write-Host ""

if (Get-Process ollama -ErrorAction SilentlyContinue) {
    Write-Host "Ollama already running." -ForegroundColor Green
} else {
    Write-Host "Starting ollama serve..." -ForegroundColor Yellow
    Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

ollama list
