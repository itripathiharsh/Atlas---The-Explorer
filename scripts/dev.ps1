# Start backend + frontend dev servers in separate windows.
$root = Split-Path -Parent $PSScriptRoot

# ensure database is up
& (Join-Path $PSScriptRoot "setup_db.ps1")

Write-Host "Starting backend on http://localhost:8014 ..."
Start-Process -WorkingDirectory (Join-Path $root "backend") -FilePath (Join-Path $root "backend\.venv\Scripts\python.exe") -ArgumentList "-m","uvicorn","app.main:app","--reload","--port","8014"

Write-Host "Starting frontend on http://localhost:5173 ..."
Start-Process -WorkingDirectory (Join-Path $root "web") -FilePath "cmd.exe" -ArgumentList "/c","npm run dev"

Write-Host ""
Write-Host "Backend:  http://localhost:8014  (docs at /docs)"
Write-Host "Frontend: http://localhost:5173"
