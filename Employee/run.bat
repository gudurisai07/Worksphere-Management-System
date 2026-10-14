@echo off
echo Starting Spring Boot backend...
cd /d "%~dp0"
.\mvnw.cmd spring-boot:run
pause
