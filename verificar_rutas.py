
import sys
import os
# Añadir el directorio actual al path para importar servidor
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from backend.servidor import app
    print("Rutas registradas:")
    for route in app.routes:
        print(f"{route.methods} {route.path}")
except Exception as e:
    print(f"Error importando app: {e}")
