$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
$Python = Join-Path $Root '.venv\Scripts\python.exe'

if (-not (Test-Path $Python)) {
    $Launcher = Get-Command py -ErrorAction SilentlyContinue
    if ($Launcher) { & py -3.12 -m venv .venv }
    else { & python -m venv .venv }
}

$RequirementHash = (Get-FileHash (Join-Path $Root 'requirements.txt') -Algorithm SHA256).Hash
$Stamp = Join-Path $Root '.venv\.requirements.sha256'
$InstalledHash = if (Test-Path $Stamp) { (Get-Content $Stamp -Raw).Trim() } else { '' }
if ($InstalledHash -ne $RequirementHash) {
    & $Python -m pip install --disable-pip-version-check -r requirements.txt
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
    Set-Content -Path $Stamp -Value $RequirementHash -Encoding ascii
}

$PythonW = Join-Path $Root '.venv\Scripts\pythonw.exe'
Start-Process -FilePath $PythonW -ArgumentList 'desktop_app.py' -WorkingDirectory $Root -WindowStyle Hidden
