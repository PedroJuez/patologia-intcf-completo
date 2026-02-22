@echo off
echo ============================================
echo   Instalando BiomedCLIP para prueba
echo ============================================

if not exist venv (
    echo Creando entorno virtual...
    python -m venv venv
)

call venv\Scripts\activate
python -m pip install --upgrade pip

echo Instalando dependencias...
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install open_clip_torch fastapi uvicorn python-multipart pillow

echo.
echo ============================================
echo   Instalacion completada!
echo   Ejecuta: iniciar_servidor.bat
echo ============================================
pause
