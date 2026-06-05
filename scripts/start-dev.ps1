# Démarre API (8000) + React (5173) en PREPROD local.
$ErrorActionPreference = "Stop"
$WebRoot = Split-Path -Parent $PSScriptRoot
$BettingHudVenv = Join-Path (Split-Path -Parent $WebRoot) "BettingHUD\venv\Scripts\python.exe"

if (-not (Test-Path $BettingHudVenv)) {
    Write-Error "Venv introuvable: $BettingHudVenv"
}

Write-Host "CourtAlpha — démarrage API + React"
Write-Host "  API   : http://127.0.0.1:8000"
Write-Host "  React : http://localhost:5173"
Write-Host ""

Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$WebRoot'; & '$BettingHudVenv' -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000"
)

Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$WebRoot\frontend'; npm run dev"
)

Write-Host "Deux fenêtres PowerShell ouvertes — ne les fermez pas pendant le dev."
