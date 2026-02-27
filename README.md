# Actualización Multi-Modelo v3.0

## Contenido del ZIP

```
actualizacion_v3/
├── backend/
│   └── servidor.py          ← Reemplaza el actual
└── frontend/src/
    ├── App.jsx              ← Reemplaza el actual
    ├── AnalisisIA.jsx       ← Reemplaza el actual
    ├── AnalisisRadiografia.jsx  ← NUEVO archivo
    └── api.js               ← Reemplaza el actual
```

## Instrucciones de instalación

### 1. Descomprime el ZIP

### 2. Copia los archivos al proyecto

**Backend:**
```
Copia: actualizacion_v3\backend\servidor.py
A:     C:\Users\Uned\Documents\patologia-intcf-completo\backend\servidor.py
```

**Frontend:**
```
Copia: actualizacion_v3\frontend\src\*.jsx
       actualizacion_v3\frontend\src\api.js
A:     C:\Users\Uned\Documents\patologia-intcf-completo\frontend\src\
```

### 3. Ejecuta

**Backend:**
```bash
cd C:\Users\Uned\Documents\patologia-intcf-completo\backend
venv\Scripts\activate
python servidor.py
```

**Frontend (otra terminal):**
```bash
cd C:\Users\Uned\Documents\patologia-intcf-completo\frontend
npm run dev
```

## Nuevas pestañas

| Pestaña | Modelo | Función |
|---------|--------|---------|
| **Patología** | BiomedCLIP | Imágenes histológicas (75+ diagnósticos) |
| **Rx Tórax** | BioViL-T | Radiografías de tórax (14 patologías) |

## Patologías detectables en Rx Tórax

- Neumonía
- Neumotórax  
- Derrame pleural
- Cardiomegalia
- Edema pulmonar
- Atelectasia
- Fracturas costales
- Hemotórax
- Contusión pulmonar
- Tuberculosis
- Masa/Nódulo pulmonar
- Ensanchamiento mediastínico
- Neumonía por aspiración
- Normal
