# Build React + déploie dist/ sur PROD + fixe les permissions nginx.
# Usage (PowerShell, depuis la racine CourtAlpha) :
#   .\deploy\deploy_frontend.ps1
#   .\deploy\deploy_frontend.ps1 -SkipBuild
param(
    [string]$SshHost = "bettinghud",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Frontend = Join-Path $Root "frontend"
$Dist = Join-Path $Frontend "dist"
$RemoteDist = "/opt/courtalpha/frontend/dist"

Push-Location $Frontend
try {
    if (-not $SkipBuild) {
        Write-Host "==> npm run build"
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed ($LASTEXITCODE)" }
    }

    if (-not (Test-Path (Join-Path $Dist "index.html"))) {
        throw "frontend/dist/index.html introuvable (npm run build ?)"
    }

    Write-Host "==> scp dist -> ${SshHost}:${RemoteDist}/"
    & ssh $SshHost "mkdir -p $RemoteDist"
    if ($LASTEXITCODE -ne 0) { throw "ssh mkdir failed ($LASTEXITCODE)" }

    & scp -r "$Dist/." "${SshHost}:${RemoteDist}/"
    if ($LASTEXITCODE -ne 0) { throw "scp failed ($LASTEXITCODE)" }

    Write-Host "==> permissions nginx"
    $fixCmd = "find $RemoteDist -type d -exec chmod 755 {} + 2>/dev/null; find $RemoteDist -type f -exec chmod 644 {} + 2>/dev/null; echo ok: permissions nginx"
    & ssh $SshHost $fixCmd
    if ($LASTEXITCODE -ne 0) { throw "fix permissions failed ($LASTEXITCODE)" }

    Write-Host "==> Done - https://courtalpha.tech/"
}
finally {
    Pop-Location
}
