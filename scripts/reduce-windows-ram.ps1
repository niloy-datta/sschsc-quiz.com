# Quick RAM cleanup helper for Windows dev machine.
$ErrorActionPreference = 'SilentlyContinue'

function Show-RamSummary {
    $os = Get-CimInstance Win32_OperatingSystem
    $total = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1)
    $free = [math]::Round($os.FreePhysicalMemory / 1MB, 1)
    $used = [math]::Round($total - $free, 1)
    Write-Host "RAM: $used GB used / $total GB total ($free GB free)" -ForegroundColor Cyan
}

Write-Host "Before cleanup:" -ForegroundColor Yellow
Show-RamSummary

$optionalApps = @('msedge', 'chrome', 'Antigravity', 'WhatsApp.Root', 'ollama')
foreach ($app in $optionalApps) {
    $procs = Get-Process -Name $app -ErrorAction SilentlyContinue
    if ($procs) {
        $mb = [math]::Round(($procs | Measure-Object WorkingSet64 -Sum).Sum / 1MB, 1)
        Write-Host "Found $app using ~$mb MB. Close it manually if you are not using it."
    }
}

if (Get-Process freebuff -ErrorAction SilentlyContinue) {
    Write-Host "freebuff is running (~1.2 GB). Exit it when not coding with Freebuff." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Already disabled auto-start for: Chrome, Edge, Copilot, Ollama" -ForegroundColor Green
Write-Host "Tip: Keep only one browser open, and close extra Cursor/VS Code windows." -ForegroundColor Green

Write-Host ""
Write-Host "After tips:" -ForegroundColor Yellow
Show-RamSummary
