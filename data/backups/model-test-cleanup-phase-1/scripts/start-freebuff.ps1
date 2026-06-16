# Launch Freebuff after Smart App Control allows the binary.
$ErrorActionPreference = "Stop"

$exe = Join-Path $env:USERPROFILE ".config\manicode\freebuff.exe"
$projectRoot = Split-Path $PSScriptRoot -Parent

function Test-FreebuffRunnable {
    if (-not (Test-Path $exe)) {
        return $false
    }
    try {
        $p = Start-Process -FilePath $exe -ArgumentList "--version" -NoNewWindow -PassThru -Wait
        return $p.ExitCode -eq 0
    } catch {
        return $false
    }
}

function Show-SacInstructions {
    Write-Host ""
    Write-Host "Freebuff is installed but Windows Smart App Control is blocking it." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Do this once:" -ForegroundColor Cyan
    Write-Host "  1. Open: Windows Security -> App and browser control -> Smart App Control"
    Write-Host "  2. Click: Turn off"
    Write-Host "  3. Restart your PC"
    Write-Host ""
    Write-Host "Opening Smart App Control settings..."
    Start-Process "windowsdefender://smartappcontrol"
}

if (-not (Get-Command freebuff -ErrorAction SilentlyContinue)) {
    Write-Host "Installing freebuff globally..."
    npm install -g freebuff
}

if (-not (Test-Path $exe)) {
    Write-Host "Downloading Freebuff binary (first run)..."
    freebuff --help | Out-Null
}

if (-not (Test-FreebuffRunnable)) {
    Show-SacInstructions
    exit 1
}

Set-Location $projectRoot
Write-Host "Starting Freebuff in $projectRoot" -ForegroundColor Green
freebuff
