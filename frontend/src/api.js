// API para comunicación con el servidor BiomedCLIP
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Verifica la conexión con el servidor
 */
export async function verificarConexion() {
  try {
    const response = await fetch(`${API_URL}/`, { timeout: 5000 });
    return response.ok;
  } catch (error) {
    console.error("Error verificando conexión:", error);
    return false;
  }
}

/**
 * Obtiene el estado del modelo (cargado, RAM, etc.)
 */
export async function obtenerEstadoModelo() {
  try {
    const response = await fetch(`${API_URL}/estado`);
    if (!response.ok) throw new Error("Error obteniendo estado");
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo estado del modelo:", error);
    return null;
  }
}

/**
 * Analiza una imagen
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
      const error = await response.json();
      throw new Error(error.detail || "Error en análisis");
    }

    return await response.json();
  } catch (error) {
    console.error("Error analizando imagen:", error);
    throw error;
  }
}

/**
 * Libera el modelo de la memoria
 */
export async function liberarModelo() {
  try {
    const response = await fetch(`${API_URL}/liberar-modelo`, {
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
 * Carga el modelo en memoria
 */
export async function cargarModelo() {
  try {
    const response = await fetch(`${API_URL}/cargar-modelo`, {
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
