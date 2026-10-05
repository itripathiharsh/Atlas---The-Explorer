# Setup / start the project database. Idempotent — safe to run anytime.
# Everything lives on D: (RULES.md Rule 1). Postgres runs on port 5433
# because port 5432 is blocked by security software on this machine.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$pg = Join-Path $root "tools\pg\bin"
$dataDir = Join-Path $root "data\pg"
$log = Join-Path $dataDir "log\server.log"

if (-not (Test-Path (Join-Path $dataDir "PG_VERSION"))) {
    Write-Host "Initializing PostgreSQL cluster at $dataDir ..."
    New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
    & (Join-Path $pg "initdb.exe") -D $dataDir -U explorer -A trust -E UTF8
    Add-Content -Path (Join-Path $dataDir "postgresql.conf") -Value "`nport = 5433"
}

$running = & (Join-Path $pg "pg_isready.exe") -h localhost -p 5433 2>$null
if ($LASTEXITCODE -ne 0) {
    New-Item -ItemType Directory -Force -Path (Join-Path $dataDir "log") | Out-Null
    Write-Host "Starting PostgreSQL on port 5433 ..."
    & (Join-Path $pg "pg_ctl.exe") -D $dataDir -l $log start
    Start-Sleep -Seconds 2
} else {
    Write-Host "PostgreSQL already running."
}

$dbExists = & (Join-Path $pg "psql.exe") -U explorer -p 5433 -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='worldgame'" | Out-String
if ($dbExists.Trim() -eq "") {
    Write-Host "Creating database worldgame ..."
    & (Join-Path $pg "psql.exe") -U explorer -p 5433 -d postgres -c "CREATE DATABASE worldgame"
}

Write-Host "Applying migrations ..."
Push-Location (Join-Path $root "backend")
& (Join-Path $root "backend\.venv\Scripts\python.exe") -m alembic upgrade head
Pop-Location
Write-Host "Database ready. (data dir: $dataDir)"
