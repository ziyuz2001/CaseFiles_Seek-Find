@echo off
cd /d "%~dp0"
start "" http://localhost:5173
node_modules\.bin\vite
pause
