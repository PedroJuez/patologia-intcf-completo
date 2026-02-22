@echo off
echo ============================================
echo   Servidor BiomedCLIP - Datacion Contusiones
echo ============================================
echo.
echo API: http://localhost:8000/docs
echo.
echo Para probar una imagen:
echo   curl -X POST -F "archivo=@imagen.jpg" http://localhost:8000/analizar/contusiones
echo.
call venv\Scripts\activate
python servidor.py
pause
