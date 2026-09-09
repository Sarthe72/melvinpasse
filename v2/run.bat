@echo off
if not exist .venv\Scripts\python.exe (
  powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
)
.venv\Scripts\python.exe -m flask --app app init-db
.venv\Scripts\python.exe -m flask --app app run --debug
