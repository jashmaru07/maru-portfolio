@echo off
cd /d "%~dp0"
npm.cmd run publish:github -- %*
if errorlevel 1 pause
