# Restores ngrok.exe after Windows Defender quarantine.
# 1. In Windows Security > Virus & threat protection > Protection history,
#    restore/allow ngrok.exe (or add an exclusion for this folder).
# 2. Run: npm run restore:ngrok
# 3. Run: npm run start:tunnel

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$target = Join-Path $root "node_modules\@expo\ngrok-bin-win32-x64"
New-Item -ItemType Directory -Force -Path $target | Out-Null

Write-Host "Downloading @expo/ngrok-bin-win32-x64@2.3.41..."
npm pack @expo/ngrok-bin-win32-x64@2.3.41 | Out-Null
$tarball = Get-ChildItem -Filter "expo-ngrok-bin-win32-x64-*.tgz" | Select-Object -First 1
if (-not $tarball) { throw "npm pack did not produce a tarball" }

tar -xf $tarball.FullName -C $target --strip-components 1
Remove-Item $tarball.FullName -Force

$exe = Join-Path $target "ngrok.exe"
if (-not (Test-Path $exe)) {
  throw "ngrok.exe missing after extract — check Windows Defender quarantine."
}

Write-Host "Restored $exe ($((Get-Item $exe).Length) bytes)"
Write-Host "If Defender deletes it again, add an exclusion for:`n  $target"
