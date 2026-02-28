export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

/**
 * Verifica la conexión con el servidor
 */
export async function verificarConexion() {
  try {
    const response = await fetch(`${API_URL}/`);
    if (!response.ok) {
      console.error(`Error en verificarConexion (${API_URL}/): status ${response.status}`);
    }
    return response.ok;
  } catch (error) {
    console.error("Error verificando conexión:", error);
    return false;
  }
}

/**
 * Obtiene el estado de los modelos (cargado, RAM, etc.)
 */
export async function obtenerEstadoModelo() {
  try {
    const response = await fetch(`${API_URL}/estado`);
    if (!response.ok) throw new Error(`Error obteniendo estado de ${API_URL}/estado (status ${response.status})`);
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo estado del modelo:", error);
    return null;
  }
}

/**
 * Analiza una imagen histopatológica con BiomedCLIP
 * @param {File} archivo - Archivo de imagen
 * @param {string} categoria - Categoría específica (opcional)
 */
export async function analizarImagen(archivo, categoria = null) {
  try {
    const formData = new FormData();
    formData.append("archivo", archivo);

    const endpoint = categoria 
      ? `${API_URL}/analizar/${categoria}`
      : `${API_URL}/analizar`;

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorDetail = "Error en análisis";
      try {
        const error = await response.json();
        errorDetail = error.detail || errorDetail;
      } catch (e) {}
      throw new Error(`${errorDetail} (Endpoint: ${endpoint}, Status: ${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error analizando imagen:", error);
    throw error;
  }
}

/**
 * Analiza una radiografía de tórax con BioViL-T
 * @param {File} archivo - Archivo de imagen
 */
export async function analizarRadiografia(archivo) {
  try {
    const formData = new FormData();
    formData.append("archivo", archivo);

    const response = await fetch(`${API_URL}/analizar-radiografia`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorDetail = "Error en análisis de radiografía";
      try {
        const error = await response.json();
        errorDetail = error.detail || errorDetail;
      } catch (e) {}
      throw new Error(`${errorDetail} (Endpoint: ${API_URL}/analizar-radiografia, Status: ${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error analizando radiografía:", error);
    throw error;
  }
}

/**
 * Libera un modelo de la memoria
 * @param {string} modelo - 'biomedclip', 'biovil' o 'todos'
 */
export async function liberarModelo(modelo = 'todos') {
  try {
    const response = await fetch(`${API_URL}/liberar-modelo?modelo=${modelo}`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Error liberando modelo");
    return await response.json();
  } catch (error) {
    console.error("Error liberando modelo:", error);
    throw error;
  }
}

/**
 * Carga un modelo en memoria
 * @param {string} modelo - 'biomedclip' o 'biovil'
 */
export async function cargarModelo(modelo = 'biomedclip') {
  try {
    const response = await fetch(`${API_URL}/cargar-modelo?modelo=${modelo}`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Error cargando modelo");
    return await response.json();
  } catch (error) {
    console.error("Error cargando modelo:", error);
    throw error;
  }
}

/**
 * Obtiene las categorías disponibles
 */
export async function obtenerCategorias() {
  try {
    const response = await fetch(`${API_URL}/categorias`);
    if (!response.ok) throw new Error("Error obteniendo categorías");
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo categorías:", error);
    return null;
  }
}

/**
 * Convierte un archivo a Base64
 * @param {File} archivo
 * @returns {Promise<string>}
 */
export function archivoABase64(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(archivo);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}
