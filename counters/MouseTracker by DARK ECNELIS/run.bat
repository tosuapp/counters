@echo off
title Tosu Mouse Server

REM --- Lancer le serveur Node ---
echo Starting Node server...
start "" /B node ./js/server.js
set NODE_PID=%ERRORLEVEL%

echo Node server started with PID: %NODE_PID%

REM --- Boucle: Tant que tosu tourne, on attend ---
:loop
tasklist /FI "IMAGENAME eq tosu.exe" | find /I "tosu.exe" >nul
if errorlevel 1 goto stopServer

timeout /t 1 >nul
goto loop

REM --- Quand tosu ne tourne plus, on arrête Node ---
:stopServer
echo Tosu is closed. Stopping Node server...

taskkill /F /IM node.exe >nul 2>&1

echo Server stopped.
exit
