# Find MongoDB installation automatically
$mongoBasePath = "C:\Program Files\MongoDB\Server"

# Get the latest installed version automatically
$mongoVersion = Get-ChildItem $mongoBasePath | 
  Sort-Object Name -Descending | 
  Select-Object -First 1 -ExpandProperty Name

$mongoBinPath = "$mongoBasePath\$mongoVersion\bin"

Write-Host "Found MongoDB version: $mongoVersion"
Write-Host "MongoDB bin path: $mongoBinPath"

# Check if already in PATH
$currentPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")

if ($currentPath -like "*$mongoBinPath*") {
  Write-Host "MongoDB is already in PATH. Nothing to do." -ForegroundColor Green
} else {
  # Add to USER path (no admin required)
  $newPath = $currentPath + ";" + $mongoBinPath
  [System.Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
  Write-Host "MongoDB added to PATH successfully!" -ForegroundColor Green
  Write-Host "Please restart your terminal for changes to take effect." -ForegroundColor Yellow
}

# Verify MongoDB is accessible
try {
  $result = & "$mongoBinPath\mongod.exe" --version
  Write-Host "MongoDB verified: $result" -ForegroundColor Green
} catch {
  Write-Host "Could not verify MongoDB. Check installation." -ForegroundColor Red
}
