@echo off
REM 双击本文件即可一键启动后端 + 公网隧道。
REM 实际逻辑在同目录的 start-dev.ps1 里。
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-dev.ps1"
pause
