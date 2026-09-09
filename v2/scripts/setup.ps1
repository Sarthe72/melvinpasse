$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot
if (-not (Test-Path ".venv\Scripts\python.exe")) {
    if ($env:CV_MELVIN_PYTHON) { & $env:CV_MELVIN_PYTHON -m venv .venv }
    elseif (Get-Command py -ErrorAction SilentlyContinue) { & py -3.12 -m venv .venv }
    else { & python -m venv .venv }
}
& .\.venv\Scripts\python.exe -m pip install --upgrade pip
& .\.venv\Scripts\python.exe -m pip install -e ".[dev]"
& .\.venv\Scripts\python.exe -m playwright install chromium
Write-Host "CV-Melvin est prêt. Lancez run.bat."
