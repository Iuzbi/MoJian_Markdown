param(
  [string]$ExePath,
  [int]$WaitSeconds = 12
)

$ErrorActionPreference = "Stop"

if (-not $ExePath) {
  Write-Host "Usage:"
  Write-Host "powershell -ExecutionPolicy Bypass -File .\scripts\capture-installed-app-log.ps1 -ExePath `"C:\Path\To\MoJian Markdown.exe`""
  exit 1
}

if (-not (Test-Path -LiteralPath $ExePath)) {
  Write-Host "Executable not found: $ExePath"
  exit 1
}

$logDir = "E:\Desktop\MoJian_Debug_Logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$stdoutPath = Join-Path $logDir "stdout_$timestamp.log"
$stderrPath = Join-Path $logDir "stderr_$timestamp.log"
$tracePath = Join-Path $logDir "trace_$timestamp.json"

$env:ELECTRON_ENABLE_LOGGING = "true"
$env:ELECTRON_DEBUG_NOTIFICATIONS = "true"
$env:CHROME_LOG_FILE = $stderrPath

$process = Start-Process -FilePath $ExePath `
  -ArgumentList "--enable-logging=file", "--v=1", "--trace-warnings" `
  -RedirectStandardOutput $stdoutPath `
  -RedirectStandardError $stderrPath `
  -PassThru

Start-Sleep -Seconds $WaitSeconds

$bundledLog = $null

if (Test-Path -LiteralPath $logDir) {
  $bundledLog = Get-ChildItem -LiteralPath $logDir -File -Filter "session-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

$trace = [PSCustomObject]@{
  exePath = $ExePath
  pid = $process.Id
  waitSeconds = $WaitSeconds
  startedAt = (Get-Date).ToString("s")
  stdoutLog = $stdoutPath
  stderrLog = $stderrPath
  appLog = if ($bundledLog) { $bundledLog.FullName } else { $null }
}

$trace | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $tracePath -Encoding UTF8

Write-Host "Trace file: $tracePath"
Write-Host "Stdout log: $stdoutPath"
Write-Host "Stderr log: $stderrPath"

if ($bundledLog) {
  Write-Host "App log: $($bundledLog.FullName)"
} else {
  Write-Host "App log: NOT FOUND"
}

Write-Host "After reproducing the issue, close the app and send me the generated files."
