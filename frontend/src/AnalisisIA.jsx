/**
 * Componente de Análisis IA - BiomedCLIP
 * Clasificación zero-shot con diagnósticos forenses reales
 */

import React, { useState, useEffect } from 'react';
import { Brain, Upload, Loader2, CheckCircle, XCircle, AlertTriangle, Cpu, HardDrive, Zap, Trash2, Stethoscope, Activity, FileText } from 'lucide-react';
import { verificarConexion, obtenerEstadoModelo, analizarImagen, liberarModelo, archivoABase64, API_URL } from './api';

export default function AnalisisIA({ onResultado, imagenActual }) {
  const [conectado, setConectado] = useState(false);
  const [estadoModelo, setEstadoModelo] = useState(null);
  const [analizando, setAnalizando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [modoAhorro, setModoAhorro] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  // Categorías disponibles
  const categorias = [
    { id: null, nombre: 'Todas las categorías (75+ diagnósticos)' },
    { id: 'contusiones', nombre: '🩸 Contusiones (datación temporal)' },
    { id: 'arma_fuego', nombre: '🔫 Arma de fuego' },
    { id: 'arma_blanca', nombre: '🗡️ Arma blanca' },
    { id: 'asfixias', nombre: '😶 Asfixias' },
    { id: 'corazon', nombre: '❤️ Corazón' },
    { id: 'higado', nombre: '🫁 Hígado' },
    { id: 'pulmon', nombre: '🌬️ Pulmón' },
    { id: 'cerebro', nombre: '🧠 Cerebro' },
    { id: 'toxicologia', nombre: '☠️ Toxicología' },
    { id: 'temperatura', nombre: '🔥 Quemaduras' },
    { id: 'tanatologia', nombre: '⚰️ Tanatología' },
    { id: 'piel', nombre: '🩹 Piel' },
    { id: 'electricidad', nombre: '⚡ Electricidad' },
  ];

  // Verificar conexión al montar
  useEffect(() => {
    const verificar = async () => {
      const estaConectado = await verificarConexion();
      setConectado(estaConectado);
      if (estaConectado) {
        const modelo = await obtenerEstadoModelo();
        setEstadoModelo(modelo);
      }
    };
    verificar();
    
    const interval = setInterval(verificar, 5000);
    return () => clearInterval(interval);
  }, []);

  // Manejar selección de archivo
  const handleArchivoSeleccionado = async (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      setArchivoSeleccionado(archivo);
      setError(null);
      setResultado(null);
      
      const base64 = await archivoABase64(archivo);
      setPreviewImagen(base64);
    }
  };

  // Analizar imagen
  const handleAnalizar = async () => {
    if (!archivoSeleccionado) {
      setError('Selecciona una imagen primero');
      return;
    }

    setAnalizando(true);
    setProgreso(0);
    setError(null);

    const intervalo = setInterval(() => {
      setProgreso(p => Math.min(p + Math.random() * 15, 90));
    }, 300);

    try {
      // Pasar la categoría seleccionada (puede ser null para todas)
      const res = await analizarImagen(archivoSeleccionado, categoriaSeleccionada);
      
      clearInterval(intervalo);
      setProgreso(100);
      
      if (res.diagnostico_principal) {
        setResultado({ ...res, exito: true });
        if (onResultado) onResultado(res);
        
        // Liberar modelo si modo ahorro está activo
        if (modoAhorro) {
          try {
            await liberarModelo();
          } catch (e) {
            console.log('Modelo ya liberado o no cargado');
          }
        }
        
        const modelo = await obtenerEstadoModelo();
        setEstadoModelo(modelo);
      } else if (res.error) {
        setError(res.error || 'Error desconocido en el análisis');
      } else {
        setResultado({ ...res, exito: true });
      }
    } catch (err) {
      clearInterval(intervalo);
      setError(err.message || 'Error de conexión');
    } finally {
      setAnalizando(false);
    }
  };

  // Liberar modelo manualmente
  const handleLiberarModelo = async () => {
    try {
      await liberarModelo();
      const modelo = await obtenerEstadoModelo();
      setEstadoModelo(modelo);
    } catch (err) {
      console.error('Error liberando modelo:', err);
    }
  };

  // Limpiar
  const handleLimpiar = () => {
    setArchivoSeleccionado(null);
    setPreviewImagen(null);
    setResultado(null);
    setError(null);
    setProgreso(0);
  };

  // Obtener color según probabilidad
  const getColorByProbabilidad = (prob) => {
    if (prob >= 60) return 'bg-green-100 text-green-700 border-green-200';
    if (prob >= 40) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  // Obtener color de confianza
  const getConfianzaColor = (confianza) => {
    if (confianza === 'alta') return 'bg-green-100 text-green-700';
    if (confianza === 'media') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Análisis con IA - BiomedCLIP</h3>
              <p className="text-xs text-gray-500">Microsoft - Zero-Shot Classification Forense</p>
            </div>
          </div>
          
          {/* Estado de conexión */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            conectado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {conectado ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Backend conectado
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Sin conexión
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-4">
        {/* Estado del modelo */}
        {estadoModelo && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Modelo:</span>
              <span className={`font-medium ${estadoModelo.cargado ? 'text-green-600' : 'text-gray-500'}`}>
                {estadoModelo.cargado ? 'Cargado' : 'No cargado'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">RAM:</span>
              <span className="font-medium text-gray-700">{estadoModelo.consumo_ram}</span>
            </div>
            {estadoModelo.cargado && (
              <button
                onClick={handleLiberarModelo}
                className="ml-auto flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition"
              >
                <Trash2 className="w-3 h-3" />
                Liberar memoria
              </button>
            )}
          </div>
        )}

        {/* Selector de categoría */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Categoría a analizar:</label>
          <select
            value={categoriaSeleccionada || ''}
            onChange={(e) => setCategoriaSeleccionada(e.target.value || null)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {categorias.map((cat) => (
              <option key={cat.id || 'todas'} value={cat.id || ''}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Modo ahorro */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={modoAhorro}
            onChange={(e) => setModoAhorro(e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-600">
            <Zap className="w-4 h-4 inline mr-1 text-amber-500" />
            Modo ahorro: liberar modelo después del análisis
          </span>
        </label>

        {/* Área de subida de imagen */}
        {!conectado ? (
          <div className="p-6 border-2 border-dashed border-red-200 rounded-xl text-center bg-red-50">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Backend no disponible</p>
            <p className="text-xs text-red-400 mt-1 mb-2">Intentando conectar a: {API_URL}</p>
            <p className="text-sm text-red-500 mt-1">
              Inicia el servidor con: <code className="bg-red-100 px-1 rounded">iniciar_servidor.bat</code>
            </p>
          </div>
        ) : previewImagen ? (
          <div className="space-y-3">
            {/* Preview de imagen */}
            <div className="relative">
              <img
                src={previewImagen}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border border-gray-200"
              />
              <button
                onClick={handleLimpiar}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              <strong>Archivo:</strong> {archivoSeleccionado?.name}
              <span className="ml-2 text-gray-400">
                ({(archivoSeleccionado?.size / 1024).toFixed(1)} KB)
              </span>
            </div>

            {/* Botón de análisis */}
            <button
              onClick={handleAnalizar}
              disabled={analizando}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {analizando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Analizar con BiomedCLIP
                </>
              )}
            </button>
          </div>
        ) : (
          <label className="block p-6 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition">
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Arrastra una imagen histológica</p>
            <p className="text-sm text-gray-400 mt-1">o haz clic para seleccionar</p>
            <p className="text-xs text-gray-400 mt-2">Formatos: JPEG, PNG, TIFF</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/tiff"
              onChange={handleArchivoSeleccionado}
              className="hidden"
            />
          </label>
        )}

        {/* Barra de progreso */}
        {analizando && (
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all duration-300"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 text-center">
              {progreso < 30 ? 'Cargando modelo BiomedCLIP...' :
               progreso < 60 ? 'Comparando con diagnósticos forenses...' :
               progreso < 90 ? 'Calculando probabilidades...' : 'Finalizando...'}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        )}

        {/* Resultados BiomedCLIP */}
        {resultado && resultado.exito && resultado.diagnostico_principal && (
          <div className="space-y-4">
            {/* Diagnóstico Principal */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Stethoscope className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-green-800 text-lg">
                      {resultado.diagnostico_principal.diagnostico}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getColorByProbabilidad(resultado.diagnostico_principal.probabilidad)}`}>
                      {resultado.diagnostico_principal.probabilidad.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    {resultado.diagnostico_principal.organo}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {resultado.diagnostico_principal.descripcion}
                  </p>
                  
                  {/* Hallazgos */}
                  {resultado.diagnostico_principal.hallazgos && resultado.diagnostico_principal.hallazgos.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Hallazgos característicos:</p>
                      <div className="flex flex-wrap gap-2">
                        {resultado.diagnostico_principal.hallazgos.map((h, i) => (
                          <span key={i} className="px-2 py-1 bg-white border border-green-200 rounded text-xs text-green-700">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Info adicional */}
                  {resultado.diagnostico_principal.info_adicional && Object.keys(resultado.diagnostico_principal.info_adicional).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      {Object.entries(resultado.diagnostico_principal.info_adicional).map(([key, value]) => (
                        <p key={key} className="text-xs text-gray-600">
                          <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span> {value}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Diagnósticos Alternativos */}
            {resultado.diagnosticos_alternativos && resultado.diagnosticos_alternativos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Diagnósticos diferenciales:
                </h4>
                <div className="space-y-2">
                  {resultado.diagnosticos_alternativos.slice(0, 5).map((alt, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${getColorByProbabilidad(alt.probabilidad)}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{alt.diagnostico}</span>
                          <span className="text-xs ml-2 opacity-75">({alt.organo})</span>
                        </div>
                        <span className="font-bold">{alt.probabilidad.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadatos */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
              <div className="flex items-center gap-4">
                <span>⏱️ {resultado.tiempo_analisis}</span>
                <span className={`px-2 py-0.5 rounded ${getConfianzaColor(resultado.confianza)}`}>
                  Confianza: {resultado.confianza}
                </span>
              </div>
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                BiomedCLIP
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
