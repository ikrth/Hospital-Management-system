@echo off
echo Finding MongoDB installation...
for /d %%i in ("C:\Program Files\MongoDB\Server\*") do set MONGO_VERSION=%%~nxi
set MONGO_BIN=C:\Program Files\MongoDB\Server\%MONGO_VERSION%\bin
echo Found MongoDB at: %MONGO_BIN%
setx PATH "%PATH%;%MONGO_BIN%"
echo MongoDB added to PATH. Please restart your terminal.
pause
