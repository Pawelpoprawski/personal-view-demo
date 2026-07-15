@echo off
REM One-command deploy: build frontend, install backend deps, serve everything on one port.
REM Override the port with:  set PORT=8888 ^& run.bat
cd /d "%~dp0"
if "%PORT%"=="" set PORT=8888

echo == Building frontend ==
cd frontend
call npm install --no-audit --no-fund || goto :error
call npm run build || goto :error
cd ..

echo == Installing backend deps ==
pip install -r backend\requirements.txt || goto :error

echo == Starting app on http://127.0.0.1:%PORT% ==
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port %PORT%
goto :eof

:error
echo BUILD FAILED
exit /b 1
