$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$userDataDir = Join-Path $projectRoot ".vscode-copilot-clean\user-data"
$extensionsDir = Join-Path $projectRoot ".vscode-copilot-clean\extensions"

New-Item -ItemType Directory -Force -Path $userDataDir | Out-Null
New-Item -ItemType Directory -Force -Path $extensionsDir | Out-Null

Write-Host "Opening a clean VS Code profile for Copilot..."
Write-Host "User data: $userDataDir"
Write-Host "Extensions: $extensionsDir"

code `
  --user-data-dir "$userDataDir" `
  --extensions-dir "$extensionsDir" `
  --profile "CopilotClean" `
  --sync off `
  "$projectRoot"
