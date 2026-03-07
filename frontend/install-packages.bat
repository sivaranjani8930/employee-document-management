@echo off
cd /d "%~dp0"
echo Installing missing packages...
call npm install react-router-dom@^6.20.0
call npm install react-toastify@^9.1.3
call npm install bootstrap@^5.3.2
call npm install react-bootstrap@^2.9.1
call npm install jspdf@^2.5.1
echo.
echo Installation complete!
pause

