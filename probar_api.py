
import requests
import os

url = "http://localhost:8000/analizar-radiografia"
# Usamos una imagen de prueba si existe, sino creamos una dummy
dummy_image = b"fake image content"
files = {"archivo": ("test.png", dummy_image, "image/png")}

try:
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
