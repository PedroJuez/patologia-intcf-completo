FROM python:3.10-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias para Pillow y OpenCV (si se usara)
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código del backend
COPY . .

# Hugging Face Spaces usa el puerto 7860 por defecto
EXPOSE 7860

CMD ["uvicorn", "servidor:app", "--host", "0.0.0.0", "--port", "7860"]
