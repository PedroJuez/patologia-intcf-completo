@echo off
echo ============================================
echo   Instalando Frontend React
echo ============================================
echo.
echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo Descargalo de https://nodejs.org
    pause
    exit /b 1
)

echo Instalando dependencias...
npm install

echo.
echo ============================================
echo   Instalacion completada!
echo   Ejecuta: iniciar.bat
echo ============================================
pause
