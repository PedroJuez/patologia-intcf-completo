/**
 * Componente de Análisis de Radiografías de Tórax - BioViL-T
 * Clasificación zero-shot para patología torácica
 */

import React, { useState, useEffect } from 'react';
import { Stethoscope, Upload, Loader2, CheckCircle, XCircle, AlertTriangle, Cpu, HardDrive, Zap, Trash2, Activity, FileText, Scan } from 'lucide-react';
import { verificarConexion, obtenerEstadoModelo, analizarRadiografia, liberarModelo, archivoABase64, API_URL } from './api';

export default function AnalisisRadiografia({ onResultado }) {
  const [conectado, setConectado] = useState(false);
  const [estadoModelo, setEstadoModelo] = useState(null);
  const [analizando, setAnalizando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [modoAhorro, setModoAhorro] = useState(true);

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

  const handleAnalizar = async () => {
    if (!archivoSeleccionado) {
      setError('Selecciona una radiografía primero');
      return;
    }
    setAnalizando(true);
    setProgreso(0);
    setError(null);

    const intervalo = setInterval(() => {
      setProgreso(p => Math.min(p + Math.random() * 15, 90));
    }, 300);

    try {
      const res = await analizarRadiografia(archivoSeleccionado);
      clearInterval(intervalo);
      setProgreso(100);
      
      if (res.diagnostico_principal) {
        setResultado({ ...res, exito: true });
        if (onResultado) onResultado(res);
        if (modoAhorro) {
          try { await liberarModelo('biovil'); } catch (e) {}
        }
        const modelo = await obtenerEstadoModelo();
        setEstadoModelo(modelo);
      } else if (res.error) {
        setError(res.error);
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

  const handleLiberarModelo = async () => {
    try {
      await liberarModelo('biovil');
      const modelo = await obtenerEstadoModelo();
      setEstadoModelo(modelo);
    } catch (err) {
      console.error('Error liberando modelo:', err);
    }
  };

  const handleLimpiar = () => {
    setArchivoSeleccionado(null);
    setPreviewImagen(null);
    setResultado(null);
    setError(null);
    setProgreso(0);
  };

  const getColorByProbabilidad = (prob) => {
    if (prob >= 60) return 'bg-green-100 text-green-700 border-green-200';
    if (prob >= 40) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getConfianzaColor = (confianza) => {
    if (confianza === 'alta') return 'bg-green-100 text-green-700';
    if (confianza === 'media') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Scan className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Análisis de Radiografías - BioViL-T</h3>
              <p className="text-xs text-gray-500">Microsoft - Zero-Shot Classification Torácica</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${conectado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {conectado ? <><CheckCircle className="w-4 h-4" />Backend conectado</> : <><XCircle className="w-4 h-4" />Sin conexión</>}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {estadoModelo && estadoModelo.biovil && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Modelo:</span>
              <span className={`font-medium ${estadoModelo.biovil.cargado ? 'text-green-600' : 'text-gray-500'}`}>
                {estadoModelo.biovil.cargado ? 'Cargado' : 'No cargado'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">RAM:</span>
              <span className="font-medium text-gray-700">{estadoModelo.biovil.consumo_ram}</span>
            </div>
            {estadoModelo.biovil.cargado && (
              <button onClick={handleLiberarModelo} className="ml-auto flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200">
                <Trash2 className="w-3 h-3" />Liberar memoria
              </button>
            )}
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={modoAhorro} onChange={(e) => setModoAhorro(e.target.checked)} className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
          <span className="text-sm text-gray-600"><Zap className="w-4 h-4 inline mr-1 text-amber-500" />Modo ahorro: liberar modelo después del análisis</span>
        </label>

        {!conectado ? (
          <div className="p-6 border-2 border-dashed border-red-200 rounded-xl text-center bg-red-50">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Backend no disponible</p>
            <p className="text-xs text-red-400 mt-1">Intentando conectar a: {API_URL}</p>
            <p className="text-sm text-red-500 mt-1">Inicia el servidor con: <code className="bg-red-100 px-1 rounded">iniciar_servidor.bat</code></p>
          </div>
        ) : previewImagen ? (
          <div className="space-y-3">
            <div className="relative">
              <img src={previewImagen} alt="Preview" className="w-full h-64 object-contain rounded-lg border border-gray-200 bg-black" />
              <button onClick={handleLimpiar} className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="text-sm text-gray-600">
              <strong>Archivo:</strong> {archivoSeleccionado?.name}
              <span className="ml-2 text-gray-400">({(archivoSeleccionado?.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button onClick={handleAnalizar} disabled={analizando} className="w-full py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {analizando ? <><Loader2 className="w-5 h-5 animate-spin" />Analizando...</> : <><Scan className="w-5 h-5" />Analizar con BioViL-T</>}
            </button>
          </div>
        ) : (
          <label className="block p-6 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-50 transition">
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Arrastra una radiografía de tórax</p>
            <p className="text-sm text-gray-400 mt-1">o haz clic para seleccionar</p>
            <p className="text-xs text-gray-400 mt-2">Formatos: JPEG, PNG</p>
            <input type="file" accept="image/jpeg,image/png" onChange={handleArchivoSeleccionado} className="hidden" />
          </label>
        )}

        {analizando && (
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-600 transition-all duration-300" style={{ width: `${progreso}%` }} />
            </div>
            <p className="text-sm text-gray-500 text-center">
              {progreso < 30 ? 'Cargando modelo BioViL-T...' : progreso < 60 ? 'Analizando estructuras torácicas...' : progreso < 90 ? 'Evaluando patologías...' : 'Finalizando...'}
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 inline mr-2" />{error}
          </div>
        )}

        {resultado && resultado.exito && resultado.diagnostico_principal && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Stethoscope className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-cyan-800 text-lg">{resultado.diagnostico_principal.diagnostico}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getColorByProbabilidad(resultado.diagnostico_principal.probabilidad)}`}>
                      {resultado.diagnostico_principal.probabilidad.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-cyan-700 mt-1">{resultado.diagnostico_principal.organo}</p>
                  <p className="text-sm text-gray-600 mt-2">{resultado.diagnostico_principal.descripcion}</p>
                  
                  {resultado.diagnostico_principal.hallazgos && resultado.diagnostico_principal.hallazgos.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Hallazgos radiológicos:</p>
                      <div className="flex flex-wrap gap-2">
                        {resultado.diagnostico_principal.hallazgos.map((h, i) => (
                          <span key={i} className="px-2 py-1 bg-white border border-cyan-200 rounded text-xs text-cyan-700">{h}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {resultado.diagnostico_principal.info_adicional && Object.keys(resultado.diagnostico_principal.info_adicional).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-cyan-200">
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

            {resultado.diagnosticos_alternativos && resultado.diagnosticos_alternativos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Activity className="w-4 h-4" />Diagnósticos diferenciales:
                </h4>
                <div className="space-y-2">
                  {resultado.diagnosticos_alternativos.slice(0, 5).map((alt, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${getColorByProbabilidad(alt.probabilidad)}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{alt.diagnostico}</span>
                        <span className="font-bold">{alt.probabilidad.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
              <div className="flex items-center gap-4">
                <span>⏱️ {resultado.tiempo_analisis}</span>
                <span className={`px-2 py-0.5 rounded ${getConfianzaColor(resultado.confianza)}`}>Confianza: {resultado.confianza}</span>
              </div>
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" />BioViL-T (Microsoft)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
