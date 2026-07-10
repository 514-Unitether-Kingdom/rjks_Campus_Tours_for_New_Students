@echo off
REM One-click: start backend + Cloudflare public tunnel.
REM Real logic is in start-dev.ps1 (same folder).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-dev.ps1"
pause
