# 🔬 Sistema Completo - Patología Forense INTCF

## 📁 Estructura

```
sistema_completo/
├── backend/                 # Servidor BiomedCLIP (Python)
│   ├── instalar.bat         
│   ├── iniciar_servidor.bat 
│   └── servidor.py
├── frontend/                # Interfaz React
│   ├── instalar.bat         
│   ├── iniciar.bat          
│   └── src/
└── imagenes_prueba/         # 35 imágenes de prueba
```

---

## 🚀 Instalación

### 1. Backend (primera ventana CMD)

```
cd backend
instalar.bat          # Solo la primera vez (~10 min)
iniciar_servidor.bat  # Inicia en http://localhost:8000
```

### 2. Frontend (segunda ventana CMD)

```
cd frontend
instalar.bat          # Solo la primera vez (~2 min)
iniciar.bat           # Inicia en http://localhost:5173
```

---

## 🖥️ Uso

1. Con ambos servidores corriendo, abre http://localhost:5173
2. Arrastra una imagen de `imagenes_prueba/`
3. Selecciona categoría "Contusiones" para datación
4. Clic en Analizar

---

## 📊 Imágenes de prueba incluidas

| Carpeta | Tiempo | Características |
|---------|--------|-----------------|
| inmediata | 0-4h | Eritrocitos rojos, sin inflamación |
| reciente | 4-24h | Neutrófilos tempranos |
| 1_3_dias | 1-3 días | Muchos neutrófilos |
| 3_7_dias | 3-7 días | Hemosiderina (dorado) |
| 1_2_semanas | 1-2 sem | Fibroblastos |
| antigua | >2 sem | Fibrosis |
| postmortem | Post-mortem | Sin reacción vital |
