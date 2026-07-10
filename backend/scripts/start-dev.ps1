# 一键启动：后端服务 + Cloudflare 公网隧道
#
# 用法：在 backend 目录双击 scripts/start-dev.bat，或执行
#   powershell -ExecutionPolicy Bypass -File scripts/start-dev.ps1
#
# 作用：
#   1. 起 Node 后端（localhost:3000）
#   2. 起 Cloudflare 隧道，把 3000 端口暴露成一个 https 公网地址
#   3. 把公网地址显眼地打印出来，发给前端/测试即可联调
#
# 需要 cloudflared.exe。脚本会依次在下列位置查找：
#   - PATH
#   - %USERPROFILE%\campus-tools\cloudflared.exe
#   - 本脚本同目录
# 都找不到时会给出下载地址。

$ErrorActionPreference = 'Stop'
$backendDir = Split-Path -Parent $PSScriptRoot   # backend/
Set-Location $backendDir

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " 探校之旅 · 后端 + 公网隧道 一键启动" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# ---- 1. 找 cloudflared ----
$cf = $null
$candidates = @(
    (Get-Command cloudflared.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source),
    (Join-Path $env:USERPROFILE 'campus-tools\cloudflared.exe'),
    (Join-Path $PSScriptRoot 'cloudflared.exe')
)
foreach ($c in $candidates) {
    if ($c -and (Test-Path $c)) { $cf = $c; break }
}
if (-not $cf) {
    Write-Host "[X] 找不到 cloudflared.exe。" -ForegroundColor Red
    Write-Host "    下载（约 54MB）后放到 $env:USERPROFILE\campus-tools\ 即可：" -ForegroundColor Yellow
    Write-Host "    https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -ForegroundColor Yellow
    exit 1
}
Write-Host "[1/3] cloudflared: $cf" -ForegroundColor Green

# ---- 2. 检查 .env ----
if (-not (Test-Path (Join-Path $backendDir '.env'))) {
    Write-Host "[X] 缺少 .env，请先照 .env.example 创建。" -ForegroundColor Red
    exit 1
}

# ---- 3. 起后端 ----
Write-Host "[2/3] 启动后端 ..." -ForegroundColor Cyan
$backend = Start-Process -FilePath 'node' -ArgumentList 'app.js' -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $env:TEMP 'campus-backend.log') `
    -RedirectStandardError  (Join-Path $env:TEMP 'campus-backend.err.log')

$backendUp = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 700
    try {
        Invoke-WebRequest -Uri 'http://localhost:3000/' -TimeoutSec 3 -UseBasicParsing | Out-Null
        $backendUp = $true; break
    } catch { }
}
if (-not $backendUp) {
    Write-Host "[X] 后端未能在预期时间内启动，请看 $env:TEMP\campus-backend.err.log" -ForegroundColor Red
    if (-not $backend.HasExited) { Stop-Process -Id $backend.Id -Force }
    exit 1
}
Write-Host "      后端已就绪：http://localhost:3000" -ForegroundColor Green

# ---- 4. 起隧道，抓公网地址 ----
Write-Host "[3/3] 启动公网隧道 ..." -ForegroundColor Cyan
$tunnelLog = Join-Path $env:TEMP 'campus-tunnel.log'
if (Test-Path $tunnelLog) { Remove-Item $tunnelLog -Force }
$tunnel = Start-Process -FilePath $cf -ArgumentList 'tunnel', '--url', 'http://localhost:3000' `
    -PassThru -WindowStyle Hidden -RedirectStandardOutput $tunnelLog -RedirectStandardError "$tunnelLog.err"

$publicUrl = $null
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    foreach ($f in @($tunnelLog, "$tunnelLog.err")) {
        if (Test-Path $f) {
            $m = Select-String -Path $f -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($m) { $publicUrl = $m.Matches[0].Value; break }
        }
    }
    if ($publicUrl) { break }
}

if (-not $publicUrl) {
    Write-Host "[X] 隧道未能获取到公网地址，请看 $tunnelLog" -ForegroundColor Red
    Stop-Process -Id $tunnel.Id -Force
    if (-not $backend.HasExited) { Stop-Process -Id $backend.Id -Force }
    exit 1
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host " 已就绪！把下面这个地址发给前端 / 测试：" -ForegroundColor Green
Write-Host ""
Write-Host "   $publicUrl" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host ""
Write-Host " 本地：http://localhost:3000" -ForegroundColor Gray
Write-Host " 管理员：admin / rjks@bjut514" -ForegroundColor Gray
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host " 这个窗口不要关。关闭窗口 = 停止服务和隧道，前端就调不通了。" -ForegroundColor Yellow
Write-Host " 电脑不要休眠。换网络或断网后地址会失效，重跑本脚本会生成新地址。" -ForegroundColor Yellow
Write-Host ""
Write-Host " 按 Ctrl+C 或关闭窗口停止。" -ForegroundColor Gray

# 记录 PID 便于收尾
$backend.Id, $tunnel.Id | Set-Content (Join-Path $env:TEMP 'campus-dev-pids.txt')

# 前台等待：任一进程退出就一起收尾
try {
    while ($true) {
        Start-Sleep -Seconds 2
        if ($backend.HasExited -or $tunnel.HasExited) {
            Write-Host "`n[!] 后端或隧道进程已退出，正在收尾 ..." -ForegroundColor Yellow
            break
        }
    }
} finally {
    if (-not $tunnel.HasExited)  { Stop-Process -Id $tunnel.Id  -Force -ErrorAction SilentlyContinue }
    if (-not $backend.HasExited) { Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue }
    Write-Host "[OK] 已停止后端与隧道。" -ForegroundColor Green
}
