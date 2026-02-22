import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ZoomIn, ZoomOut, RotateCw, Tag, MessageSquare, Brain, Upload, ChevronRight, ChevronLeft, Layers, FileText, BarChart3, Users, Clock, CheckCircle, AlertTriangle, Microscope, Heart, Activity, Database, Download, Share2, Settings, Home, Folder, Grid, Eye, Play, Pause, Camera, Printer, Send, Edit3, Save, X, Check, Info, ArrowRight, FileCheck, Bell, Menu, LogOut, HelpCircle, Maximize2, Move, RefreshCw } from 'lucide-react';
import AnalisisIA from './AnalisisIA';

// Configuración de colores institucionales
const COLORS = {
  primary: '#1e3a5f',
  primaryLight: '#2d5a8a',
  accent: '#c9a227',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0891b2'
};

// Datos de casos forenses realistas basados en el documento INTCF
const casosForenses = [
  {
    id: "2024/MAD/HP-001247",
    numeroAsunto: "DP-2024-1247",
    fecha: "2024-01-15",
    fechaRecepcion: "2024-01-14",
    organo: "Corazón",
    tincion: "Hematoxilina-Eosina",
    zona: "Pared anterior ventrículo izquierdo",
    bloqueParafina: "B-1247-C3",
    diagnosticoIA: "Infarto agudo de miocardio en fase precoz",
    diagnosticoFinal: null,
    vitalidad: "Ante-mortem",
    cronolesional: "12-24 horas de evolución",
    confianzaIA: 94,
    patologoAsignado: "Dra. María Paz Suárez Mier",
    estado: "pendiente_revision",
    prioridad: "alta",
    observacionesIA: "Se detecta área de necrosis coagulativa con pérdida de estriaciones transversales, hipereosinofilia citoplasmática e infiltrado inflamatorio neutrofílico incipiente. Patrón compatible con isquemia miocárdica aguda.",
    hallazgosIA: [
      { nombre: "Necrosis coagulativa", confianza: 96, region: { x: 35, y: 38, w: 30, h: 24 } },
      { nombre: "Infiltrado neutrofílico", confianza: 89, region: { x: 55, y: 58, w: 18, h: 15 } },
      { nombre: "Hipereosinofilia", confianza: 92, region: { x: 30, y: 35, w: 35, h: 30 } },
      { nombre: "Pérdida estriaciones", confianza: 88, region: { x: 40, y: 42, w: 20, h: 18 } }
    ],
    casosSimilares: 23,
    medicoForense: "Dr. Juan García López",
    causaMuerte: "Pendiente determinación",
    tipoMuerte: "Muerte súbita",
    antecedentes: "Varón 52 años. HTA en tratamiento. Encontrado en domicilio.",
    tejidoTipo: "miocardio"
  },
  {
    id: "2024/MAD/HP-001248",
    numeroAsunto: "DP-2024-1248",
    fecha: "2024-01-15",
    fechaRecepcion: "2024-01-14",
    organo: "Corazón",
    tincion: "Hematoxilina-Eosina",
    zona: "Septum interventricular",
    bloqueParafina: "B-1248-C1",
    diagnosticoIA: "Miocardiopatía hipertrófica",
    diagnosticoFinal: null,
    vitalidad: "Cardiopatía estructural",
    cronolesional: "Lesión crónica",
    confianzaIA: 96,
    patologoAsignado: "Dra. María Paz Suárez Mier",
    estado: "alerta_hereditaria",
    prioridad: "urgente",
    observacionesIA: "Hipertrofia miocitaria severa con desorganización de fibras (disarray). Fibrosis intersticial y perivascular. Arterias intramiocárdicas con engrosamiento de la media. Hallazgos característicos de MCH.",
    hallazgosIA: [
      { nombre: "Hipertrofia miocitaria", confianza: 97, region: { x: 25, y: 30, w: 50, h: 40 } },
      { nombre: "Disarray miofibrilar", confianza: 94, region: { x: 35, y: 35, w: 30, h: 25 } },
      { nombre: "Fibrosis intersticial", confianza: 91, region: { x: 60, y: 50, w: 25, h: 20 } },
      { nombre: "Arterias anormales", confianza: 88, region: { x: 70, y: 30, w: 15, h: 12 } }
    ],
    casosSimilares: 12,
    medicoForense: "Dr. Juan García López",
    causaMuerte: "Muerte súbita cardíaca",
    tipoMuerte: "Muerte súbita deportiva",
    antecedentes: "Varón 19 años. Colapso durante partido de fútbol. Sin antecedentes conocidos.",
    alertaSNS: true,
    tejidoTipo: "miocardio_hipertrofico"
  },
  {
    id: "2024/MAD/HP-001249",
    numeroAsunto: "DP-2024-1249",
    fecha: "2024-01-14",
    fechaRecepcion: "2024-01-13",
    organo: "Hígado",
    tincion: "Tricrómico de Masson",
    zona: "Parénquima hepático - zona centrolobulillar",
    bloqueParafina: "B-1249-H2",
    diagnosticoIA: "Esteatohepatitis alcohólica con fibrosis avanzada",
    diagnosticoFinal: "Esteatohepatitis alcohólica. Cirrosis incipiente.",
    vitalidad: "N/A - Enfermedad crónica",
    cronolesional: "Proceso crónico con reagudización",
    confianzaIA: 91,
    patologoAsignado: "Dr. Antonio Martínez Ruiz",
    estado: "confirmado",
    prioridad: "normal",
    observacionesIA: "Esteatosis macrovacuolar severa (>60%). Balonización hepatocitaria. Cuerpos de Mallory-Denk. Infiltrado inflamatorio mixto. Fibrosis perisinusoidal y en puentes porto-portales (estadio F3).",
    hallazgosIA: [
      { nombre: "Esteatosis macrovacuolar", confianza: 95, region: { x: 20, y: 25, w: 60, h: 50 } },
      { nombre: "Balonización", confianza: 87, region: { x: 45, y: 40, w: 20, h: 18 } },
      { nombre: "Cuerpos Mallory-Denk", confianza: 82, region: { x: 55, y: 55, w: 12, h: 10 } },
      { nombre: "Fibrosis perisinusoidal", confianza: 89, region: { x: 30, y: 60, w: 40, h: 15 } }
    ],
    casosSimilares: 67,
    medicoForense: "Dra. Elena Rodríguez",
    causaMuerte: "Fallo hepático agudo sobre crónico",
    tipoMuerte: "Muerte natural",
    antecedentes: "Varón 58 años. Alcoholismo crónico conocido. Ingreso previo por descompensación.",
    tejidoTipo: "higado"
  },
  {
    id: "2024/MAD/HP-001250",
    numeroAsunto: "DP-2024-1250",
    fecha: "2024-01-14",
    fechaRecepcion: "2024-01-13",
    organo: "Piel",
    tincion: "Hematoxilina-Eosina",
    zona: "Lesión contusa región temporal derecha",
    bloqueParafina: "B-1250-P1",
    diagnosticoIA: "Contusión vital con reacción inflamatoria",
    diagnosticoFinal: null,
    vitalidad: "Ante-mortem",
    cronolesional: "6-12 horas de evolución",
    confianzaIA: 89,
    patologoAsignado: "Dra. María Paz Suárez Mier",
    estado: "pendiente_revision",
    prioridad: "alta",
    observacionesIA: "Hemorragia dérmica e hipodérmica con extravasación eritrocitaria. Infiltrado inflamatorio con predominio de PMN neutrófilos. Hemólisis incipiente sin hemosiderina. Compatible con lesión vital de evolución intermedia.",
    hallazgosIA: [
      { nombre: "Hemorragia dérmica", confianza: 94, region: { x: 30, y: 40, w: 40, h: 30 } },
      { nombre: "Infiltrado PMN", confianza: 91, region: { x: 40, y: 50, w: 25, h: 20 } },
      { nombre: "Hemólisis incipiente", confianza: 85, region: { x: 35, y: 55, w: 30, h: 15 } },
      { nombre: "Edema dérmico", confianza: 88, region: { x: 25, y: 35, w: 50, h: 25 } }
    ],
    casosSimilares: 156,
    medicoForense: "Dr. Carlos Fernández",
    causaMuerte: "TCE severo",
    tipoMuerte: "Muerte violenta - Homicidio investigación",
    antecedentes: "Mujer 34 años. Encontrada inconsciente en vía pública. Múltiples lesiones.",
    tejidoTipo: "piel"
  },
  {
    id: "2024/MAD/HP-001251",
    numeroAsunto: "DP-2024-1251",
    fecha: "2024-01-13",
    fechaRecepcion: "2024-01-12",
    organo: "Pulmón",
    tincion: "Hematoxilina-Eosina",
    zona: "Lóbulo inferior derecho",
    bloqueParafina: "B-1251-L1",
    diagnosticoIA: "Edema pulmonar agudo cardiogénico",
    diagnosticoFinal: "Edema agudo de pulmón. Congestión pasiva crónica.",
    vitalidad: "Ante-mortem",
    cronolesional: "Proceso agudo",
    confianzaIA: 93,
    patologoAsignado: "Dr. Antonio Martínez Ruiz",
    estado: "confirmado",
    prioridad: "normal",
    observacionesIA: "Espacios alveolares ocupados por material eosinófilo homogéneo (trasudado). Congestión capilar severa. Células de insuficiencia cardíaca (macrófagos con hemosiderina). Compatible con fallo cardíaco izquierdo.",
    hallazgosIA: [
      { nombre: "Edema intraalveolar", confianza: 96, region: { x: 20, y: 20, w: 60, h: 60 } },
      { nombre: "Congestión capilar", confianza: 92, region: { x: 35, y: 35, w: 30, h: 30 } },
      { nombre: "Células cardíacas", confianza: 84, region: { x: 50, y: 45, w: 15, h: 12 } }
    ],
    casosSimilares: 89,
    medicoForense: "Dra. Elena Rodríguez",
    causaMuerte: "Insuficiencia cardíaca aguda",
    tipoMuerte: "Muerte natural",
    antecedentes: "Varón 71 años. Cardiopatía isquémica crónica. FA permanente.",
    tejidoTipo: "pulmon"
  }
];

// Estadísticas del servicio
const estadisticasServicio = {
  casosHoy: 12,
  casosSemana: 67,
  pendientesRevision: 34,
  confirmados: 287,
  alertasHereditarias: 3,
  preparacionesDigitalizadas: 1247,
  bloquesArchivados: 28450,
  tiempoMedioAnalisisIA: "4.2",
  precisionModeloGlobal: 91.2,
  sensibilidadCardiopatias: 94.7
};

// Componente de imagen histológica realista
const HistologicalImage = ({ tipo, zoom, hallazgos, mostrarIA, onRegionClick }) => {
  const patterns = {
    miocardio: (
      <>
        <defs>
          <pattern id="fibras-cardiacas" patternUnits="userSpaceOnUse" width="40" height="12" patternTransform="rotate(-5)">
            <rect width="40" height="12" fill="#f5e6e6"/>
            <path d="M0,6 Q10,3 20,6 T40,6" stroke="#e8b4b4" strokeWidth="8" fill="none" opacity="0.7"/>
            <ellipse cx="8" cy="6" rx="2" ry="3" fill="#6b4c7a" opacity="0.8"/>
            <ellipse cx="28" cy="6" rx="2" ry="3" fill="#6b4c7a" opacity="0.8"/>
          </pattern>
          <pattern id="estriaciones" patternUnits="userSpaceOnUse" width="4" height="20">
            <line x1="2" y1="0" x2="2" y2="20" stroke="#d4a5a5" strokeWidth="0.5" opacity="0.4"/>
          </pattern>
          <linearGradient id="necrosis-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8e8e8"/>
            <stop offset="50%" stopColor="#f0d8d8"/>
            <stop offset="100%" stopColor="#e8c8c8"/>
          </linearGradient>
          <filter id="tissue-texture">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise"/>
            <feDiffuseLighting in="noise" lightingColor="#fff" surfaceScale="1" result="light">
              <feDistantLight azimuth="45" elevation="60"/>
            </feDiffuseLighting>
            <feComposite in="SourceGraphic" in2="light" operator="multiply"/>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="#faf0f0"/>
        <rect width="100%" height="100%" fill="url(#fibras-cardiacas)"/>
        <rect width="100%" height="100%" fill="url(#estriaciones)"/>
        {/* Zona de necrosis */}
        <ellipse cx="350" cy="220" rx="140" ry="100" fill="url(#necrosis-grad)" opacity="0.85"/>
        <ellipse cx="350" cy="220" rx="100" ry="70" fill="#f5e0e0" opacity="0.6"/>
        {/* Infiltrado inflamatorio */}
        {[...Array(30)].map((_, i) => (
          <circle key={i} cx={480 + Math.random()*80} cy={320 + Math.random()*60} r={2 + Math.random()*2} fill="#5a4a8a" opacity="0.7"/>
        ))}
        {/* Vasos */}
        <ellipse cx="150" cy="150" rx="25" ry="15" fill="none" stroke="#c88" strokeWidth="3"/>
        <ellipse cx="600" cy="350" rx="20" ry="12" fill="#fdd" stroke="#c88" strokeWidth="2"/>
      </>
    ),
    miocardio_hipertrofico: (
      <>
        <defs>
          <pattern id="fibras-hipertrofia" patternUnits="userSpaceOnUse" width="50" height="50">
            <rect width="50" height="50" fill="#f5e6e6"/>
            <path d="M0,25 Q25,10 50,25" stroke="#e0a0a0" strokeWidth="12" fill="none"/>
            <path d="M10,40 Q30,55 50,35" stroke="#d8b0b0" strokeWidth="10" fill="none"/>
            <ellipse cx="15" cy="25" rx="4" ry="5" fill="#5a4070"/>
            <ellipse cx="35" cy="40" rx="5" ry="6" fill="#5a4070"/>
          </pattern>
          <pattern id="fibrosis" patternUnits="userSpaceOnUse" width="30" height="30">
            <path d="M0,15 Q15,5 30,15 M0,25 Q15,35 30,25" stroke="#8eb4c8" strokeWidth="2" fill="none" opacity="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#faf0f0"/>
        <rect width="100%" height="100%" fill="url(#fibras-hipertrofia)"/>
        <rect width="100%" height="100%" fill="url(#fibrosis)" opacity="0.4"/>
        {/* Disarray - fibras desordenadas */}
        <g transform="translate(300, 200)">
          {[...Array(15)].map((_, i) => (
            <path key={i} d={`M${Math.random()*100},${Math.random()*100} Q${50+Math.random()*50},${Math.random()*100} ${100+Math.random()*50},${Math.random()*100}`} 
              stroke="#d4a0a0" strokeWidth={8+Math.random()*6} fill="none" opacity="0.7"
              transform={`rotate(${Math.random()*360}, 75, 50)`}/>
          ))}
        </g>
      </>
    ),
    higado: (
      <>
        <defs>
          <pattern id="hepatocitos" patternUnits="userSpaceOnUse" width="35" height="35">
            <rect width="35" height="35" fill="#f8f0e8"/>
            <polygon points="17,2 32,10 32,25 17,33 2,25 2,10" fill="#f0e0d0" stroke="#d4c0a8" strokeWidth="0.5"/>
            <circle cx="17" cy="17" r="5" fill="#5a4a4a"/>
          </pattern>
          <pattern id="esteatosis" patternUnits="userSpaceOnUse" width="50" height="50">
            <circle cx="25" cy="25" r="12" fill="#fff" opacity="0.8" stroke="#eee" strokeWidth="0.5"/>
            <circle cx="10" cy="10" r="6" fill="#fff" opacity="0.7"/>
            <circle cx="40" cy="40" r="8" fill="#fff" opacity="0.75"/>
          </pattern>
          <pattern id="fibrosis-hepatica" patternUnits="userSpaceOnUse" width="100" height="100">
            <path d="M0,50 Q50,30 100,50" stroke="#7aaec4" strokeWidth="3" fill="none" opacity="0.6"/>
            <path d="M20,0 Q40,50 20,100" stroke="#7aaec4" strokeWidth="2" fill="none" opacity="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#faf5f0"/>
        <rect width="100%" height="100%" fill="url(#hepatocitos)"/>
        <rect width="100%" height="100%" fill="url(#esteatosis)"/>
        <rect width="100%" height="100%" fill="url(#fibrosis-hepatica)"/>
        {/* Espacio porta */}
        <circle cx="200" cy="200" r="40" fill="#f8f8f0" stroke="#aaa" strokeWidth="2"/>
        <circle cx="200" cy="200" r="15" fill="none" stroke="#c66" strokeWidth="3"/>
        <circle cx="220" cy="185" r="8" fill="none" stroke="#6a6" strokeWidth="2"/>
      </>
    ),
    pulmon: (
      <>
        <defs>
          <pattern id="alveolos" patternUnits="userSpaceOnUse" width="60" height="60">
            <rect width="60" height="60" fill="#faf8fc"/>
            <circle cx="30" cy="30" r="25" fill="none" stroke="#e0c0d0" strokeWidth="2"/>
            <circle cx="30" cy="30" r="20" fill="#fef8fa" opacity="0.5"/>
          </pattern>
          <pattern id="edema-alveolar" patternUnits="userSpaceOnUse" width="60" height="60">
            <circle cx="30" cy="30" r="18" fill="#f8e0e8" opacity="0.7"/>
          </pattern>
          <radialGradient id="congestion" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e8a0a0"/>
            <stop offset="100%" stopColor="#f0d0d0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="#fcf8fa"/>
        <rect width="100%" height="100%" fill="url(#alveolos)"/>
        <rect width="100%" height="100%" fill="url(#edema-alveolar)" opacity="0.6"/>
        {/* Capilares congestionados */}
        {[...Array(20)].map((_, i) => (
          <path key={i} d={`M${50+i*35},${100+Math.sin(i)*50} Q${70+i*35},${150+Math.cos(i)*30} ${50+i*35},${200+Math.sin(i)*40}`}
            stroke="url(#congestion)" strokeWidth="4" fill="none" opacity="0.6"/>
        ))}
        {/* Células de insuficiencia cardíaca */}
        {[...Array(8)].map((_, i) => (
          <g key={i} transform={`translate(${200+i*60}, ${250+Math.sin(i*2)*80})`}>
            <circle r="8" fill="#c8a090"/>
            <circle r="3" cx="-2" cy="-2" fill="#705040"/>
          </g>
        ))}
      </>
    ),
    piel: (
      <>
        <defs>
          <linearGradient id="epidermis" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c8a090"/>
            <stop offset="15%" stopColor="#e0c8b8"/>
            <stop offset="30%" stopColor="#f0e0d8"/>
            <stop offset="100%" stopColor="#f8f0ec"/>
          </linearGradient>
          <pattern id="dermis" patternUnits="userSpaceOnUse" width="40" height="40">
            <rect width="40" height="40" fill="#f8f0ec"/>
            <path d="M0,20 Q20,15 40,20" stroke="#e8d8d0" strokeWidth="2" fill="none"/>
            <ellipse cx="20" cy="30" rx="3" ry="4" fill="#8070a0" opacity="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#epidermis)"/>
        <rect y="120" width="100%" height="380" fill="url(#dermis)"/>
        {/* Zona de hemorragia/contusión */}
        <ellipse cx="400" cy="280" rx="150" ry="100" fill="#d08080" opacity="0.5"/>
        <ellipse cx="380" cy="300" rx="100" ry="70" fill="#c06060" opacity="0.4"/>
        {/* Eritrocitos extravasados */}
        {[...Array(50)].map((_, i) => (
          <ellipse key={i} cx={320+Math.random()*160} cy={240+Math.random()*120} rx="4" ry="2" fill="#b04040" opacity={0.5+Math.random()*0.4}
            transform={`rotate(${Math.random()*180}, ${320+Math.random()*160}, ${240+Math.random()*120})`}/>
        ))}
        {/* Infiltrado inflamatorio */}
        {[...Array(25)].map((_, i) => (
          <circle key={i} cx={350+Math.random()*100} cy={300+Math.random()*80} r={2+Math.random()*1.5} fill="#6050a0" opacity="0.7"/>
        ))}
      </>
    )
  };

  return (
    <svg viewBox="0 0 800 500" className="w-full h-full" style={{ background: '#f8f4f0' }}>
      {patterns[tipo] || patterns.miocardio}
      
      {/* Overlay de detecciones IA */}
      {mostrarIA && hallazgos && hallazgos.map((h, i) => (
        <g key={i} onClick={() => onRegionClick && onRegionClick(h)} style={{ cursor: 'pointer' }}>
          <rect
            x={h.region.x * 8}
            y={h.region.y * 5}
            width={h.region.w * 8}
            height={h.region.h * 5}
            fill="none"
            stroke={h.confianza >= 90 ? "#059669" : h.confianza >= 85 ? "#d97706" : "#dc2626"}
            strokeWidth="2"
            strokeDasharray="6,3"
            opacity="0.9"
          />
          <rect
            x={h.region.x * 8}
            y={h.region.y * 5 - 20}
            width={h.nombre.length * 7 + 45}
            height="18"
            fill={h.confianza >= 90 ? "#059669" : h.confianza >= 85 ? "#d97706" : "#dc2626"}
            rx="3"
          />
          <text
            x={h.region.x * 8 + 5}
            y={h.region.y * 5 - 7}
            fill="white"
            fontSize="11"
            fontWeight="500"
          >
            {h.nombre} ({h.confianza}%)
          </text>
        </g>
      ))}
      
      {/* Escala */}
      <g transform="translate(650, 460)">
        <line x1="0" y1="0" x2="100" y2="0" stroke="#333" strokeWidth="2"/>
        <line x1="0" y1="-5" x2="0" y2="5" stroke="#333" strokeWidth="2"/>
        <line x1="100" y1="-5" x2="100" y2="5" stroke="#333" strokeWidth="2"/>
        <text x="50" y="15" textAnchor="middle" fontSize="10" fill="#333">100 µm</text>
      </g>
    </svg>
  );
};

// Componente principal
export default function PatologiaDigitalINTCF() {
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [casoSeleccionado, setCasoSeleccionado] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [mostrarIA, setMostrarIA] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [analizandoIA, setAnalizandoIA] = useState(false);
  const [progresoAnalisis, setProgresoAnalisis] = useState(0);
  const [mostrarInforme, setMostrarInforme] = useState(false);
  const [diagnosticoEditado, setDiagnosticoEditado] = useState('');
  const [hallazgoSeleccionado, setHallazgoSeleccionado] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState(3);

  // Simular análisis IA con progreso
  const ejecutarAnalisisIA = useCallback(() => {
    setAnalizandoIA(true);
    setProgresoAnalisis(0);
    const interval = setInterval(() => {
      setProgresoAnalisis(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setAnalizandoIA(false), 500);
          return 100;
        }
        return p + Math.random() * 15 + 5;
      });
    }, 200);
  }, []);

  // Filtrar casos
  const casosFiltrados = casosForenses.filter(caso => {
    const matchBusqueda = 
      caso.id.toLowerCase().includes(busqueda.toLowerCase()) ||
      caso.organo.toLowerCase().includes(busqueda.toLowerCase()) ||
      caso.diagnosticoIA.toLowerCase().includes(busqueda.toLowerCase()) ||
      caso.numeroAsunto.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado === 'todos' || 
      (filtroEstado === 'pendiente' && caso.estado.includes('pendiente')) ||
      (filtroEstado === 'confirmado' && caso.estado === 'confirmado') ||
      (filtroEstado === 'alerta' && caso.estado === 'alerta_hereditaria');
    return matchBusqueda && matchEstado;
  });

  const getEstadoBadge = (estado) => {
    const estilos = {
      'pendiente_revision': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pendiente revisión' },
      'confirmado': { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmado' },
      'alerta_hereditaria': { bg: 'bg-red-100', text: 'text-red-700', label: '⚠️ Alerta SNS' }
    };
    const estilo = estilos[estado] || estilos['pendiente_revision'];
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${estilo.bg} ${estilo.text}`}>{estilo.label}</span>;
  };

  const getPrioridadBadge = (prioridad) => {
    const estilos = {
      'urgente': 'bg-red-500',
      'alta': 'bg-orange-500',
      'normal': 'bg-blue-500'
    };
    return <span className={`w-2 h-2 rounded-full ${estilos[prioridad] || 'bg-gray-400'}`}/>;
  };

  // Dashboard principal
  const renderDashboard = () => (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header con fecha */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de Control</h1>
          <p className="text-gray-500">Servicio de Histopatología - Departamento de Madrid</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Última actualización</div>
          <div className="font-medium">{new Date().toLocaleString('es-ES')}</div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { icon: Microscope, label: 'Casos hoy', value: estadisticasServicio.casosHoy, color: 'blue' },
          { icon: Clock, label: 'Pendientes', value: estadisticasServicio.pendientesRevision, color: 'amber' },
          { icon: CheckCircle, label: 'Confirmados', value: estadisticasServicio.confirmados, color: 'green' },
          { icon: Heart, label: 'Alertas SNS', value: estadisticasServicio.alertasHereditarias, color: 'red' },
          { icon: Database, label: 'Digitalizadas', value: estadisticasServicio.preparacionesDigitalizadas.toLocaleString(), color: 'purple' },
          { icon: Brain, label: 'Precisión IA', value: `${estadisticasServicio.precisionModeloGlobal}%`, color: 'cyan' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${item.color}-100`}>
                <item.icon className={`w-5 h-5 text-${item.color}-600`} style={{color: item.color === 'blue' ? '#2563eb' : item.color === 'amber' ? '#d97706' : item.color === 'green' ? '#059669' : item.color === 'red' ? '#dc2626' : item.color === 'purple' ? '#9333ea' : '#0891b2'}}/>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{item.value}</div>
                <div className="text-xs text-gray-500">{item.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alertas cardiopatías hereditarias */}
      {casosForenses.filter(c => c.alertaSNS).length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600"/>
            </div>
            <div>
              <h3 className="font-bold text-red-800">Alertas de Cardiopatías Potencialmente Hereditarias</h3>
              <p className="text-sm text-red-600">Requieren comunicación al Sistema Nacional de Salud</p>
            </div>
          </div>
          <div className="space-y-2">
            {casosForenses.filter(c => c.alertaSNS).map(caso => (
              <div key={caso.id} className="flex items-center justify-between bg-white rounded-lg p-4 border border-red-100 hover:border-red-300 transition">
                <div className="flex items-center gap-4">
                  <Heart className="w-5 h-5 text-red-500"/>
                  <div>
                    <div className="font-mono text-sm text-gray-600">{caso.id}</div>
                    <div className="font-medium text-gray-800">{caso.diagnosticoIA}</div>
                    <div className="text-sm text-gray-500">{caso.antecedentes}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    Confianza IA: {caso.confianzaIA}%
                  </span>
                  <button 
                    onClick={() => {setCasoSeleccionado(caso); setVistaActual('visor');}}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4"/>
                    Revisar urgente
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Casos recientes y métricas IA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de casos recientes */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Casos Recientes</h3>
            <button 
              onClick={() => setVistaActual('casos')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {casosForenses.slice(0, 4).map(caso => (
              <div 
                key={caso.id}
                onClick={() => {setCasoSeleccionado(caso); setVistaActual('visor');}}
                className="p-4 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getPrioridadBadge(caso.prioridad)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-500">{caso.id}</span>
                        {getEstadoBadge(caso.estado)}
                      </div>
                      <div className="font-medium text-gray-800">{caso.organo} - {caso.diagnosticoIA}</div>
                      <div className="text-sm text-gray-500">{caso.patologoAsignado} • {caso.tincion}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${caso.confianzaIA >= 90 ? 'text-green-600' : caso.confianzaIA >= 85 ? 'text-amber-600' : 'text-red-600'}`}>
                      {caso.confianzaIA}%
                    </div>
                    <div className="text-xs text-gray-400">Confianza IA</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de métricas IA */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600"/>
              Rendimiento del Modelo IA
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Precisión global</span>
                  <span className="font-medium">{estadisticasServicio.precisionModeloGlobal}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{width: `${estadisticasServicio.precisionModeloGlobal}%`}}/>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Sensibilidad cardiopatías</span>
                  <span className="font-medium">{estadisticasServicio.sensibilidadCardiopatias}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{width: `${estadisticasServicio.sensibilidadCardiopatias}%`}}/>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tiempo medio análisis</span>
                  <span className="font-medium">{estadisticasServicio.tiempoMedioAnalisisIA}s</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-5 text-white">
            <h3 className="font-semibold mb-3">Flujo de trabajo digital</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">1</div>
                <span>Recepción en LIMS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">2</div>
                <span>Digitalización automática</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-xs">3</div>
                <span>Análisis IA</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">4</div>
                <span>Revisión facultativo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">5</div>
                <span>Firma digital</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Lista de casos/preparaciones
  const renderListaCasos = () => (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Preparaciones Digitalizadas</h1>
          <p className="text-gray-500">Gestión de casos y revisión histopatológica</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm">
          <Upload className="w-4 h-4"/>
          Nueva preparación
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
            <input
              type="text"
              placeholder="Buscar por ID, órgano, diagnóstico..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select 
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes revisión</option>
            <option value="confirmado">Confirmados</option>
            <option value="alerta">Alertas hereditarias</option>
          </select>
          <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option>Todos los órganos</option>
            <option>Corazón</option>
            <option>Pulmón</option>
            <option>Hígado</option>
            <option>Piel</option>
          </select>
        </div>
      </div>

      {/* Tabla de casos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Caso</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Órgano / Tinción</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Diagnóstico IA</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vitalidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Confianza</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patólogo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {casosFiltrados.map(caso => (
                <tr key={caso.id} className="hover:bg-blue-50/50 transition">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {getPrioridadBadge(caso.prioridad)}
                      <div>
                        <div className="font-mono text-sm font-medium text-gray-800">{caso.id}</div>
                        <div className="text-xs text-gray-500">{caso.fecha}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-800">{caso.organo}</div>
                    <div className="text-xs text-gray-500">{caso.tincion}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-gray-800 max-w-xs truncate">{caso.diagnosticoIA}</div>
                    <div className="text-xs text-gray-500">{caso.cronolesional}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      caso.vitalidad.includes('Ante') ? 'bg-green-100 text-green-700' :
                      caso.vitalidad.includes('Cardiopatía') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {caso.vitalidad}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            caso.confianzaIA >= 90 ? 'bg-green-500' :
                            caso.confianzaIA >= 85 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{width: `${caso.confianzaIA}%`}}
                        />
                      </div>
                      <span className="text-sm font-medium">{caso.confianzaIA}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {getEstadoBadge(caso.estado)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-600">{caso.patologoAsignado}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => {setCasoSeleccionado(caso); setVistaActual('visor');}}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      title="Ver preparación"
                    >
                      <Eye className="w-5 h-5"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Visor de preparaciones
  const renderVisor = () => {
    if (!casoSeleccionado) return null;

    return (
      <div className="flex h-full bg-gray-100">
        {/* Panel lateral - Información del caso */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Header del caso */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <button 
              onClick={() => setVistaActual('casos')}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm mb-3"
            >
              <ChevronLeft className="w-4 h-4"/>
              Volver a lista
            </button>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-lg font-bold text-gray-800">{casoSeleccionado.id}</div>
                <div className="text-sm text-gray-500">Asunto: {casoSeleccionado.numeroAsunto}</div>
              </div>
              {getPrioridadBadge(casoSeleccionado.prioridad)}
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Datos de la muestra */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Datos de la muestra</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500">Órgano</div>
                  <div className="font-medium">{casoSeleccionado.organo}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Tinción</div>
                  <div className="font-medium">{casoSeleccionado.tincion}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-500">Zona</div>
                  <div className="font-medium">{casoSeleccionado.zona}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Bloque parafina</div>
                  <div className="font-mono text-sm">{casoSeleccionado.bloqueParafina}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Fecha recepción</div>
                  <div className="text-sm">{casoSeleccionado.fechaRecepcion}</div>
                </div>
              </div>
            </div>

            {/* Contexto clínico */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contexto clínico</h3>
              <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                {casoSeleccionado.antecedentes}
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Tipo muerte:</span>
                  <span className="ml-1 font-medium">{casoSeleccionado.tipoMuerte}</span>
                </div>
              </div>
            </div>

            {/* Análisis IA */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600"/>
                  Análisis IA
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mostrarIA}
                    onChange={(e) => setMostrarIA(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600">Mostrar en imagen</span>
                </label>
              </div>

              <div className={`p-4 rounded-lg border ${
                casoSeleccionado.confianzaIA >= 90 ? 'bg-green-50 border-green-200' :
                casoSeleccionado.confianzaIA >= 85 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">Diagnóstico sugerido</span>
                  <span className={`text-lg font-bold ${
                    casoSeleccionado.confianzaIA >= 90 ? 'text-green-600' :
                    casoSeleccionado.confianzaIA >= 85 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {casoSeleccionado.confianzaIA}%
                  </span>
                </div>
                <div className="text-gray-800 font-medium">{casoSeleccionado.diagnosticoIA}</div>
                {casoSeleccionado.cronolesional && (
                  <div className="text-sm text-gray-600 mt-1">
                    <Clock className="inline w-3 h-3 mr-1"/>
                    {casoSeleccionado.cronolesional}
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-700 leading-relaxed">
                {casoSeleccionado.observacionesIA}
              </div>

              {/* Hallazgos detectados */}
              <div>
                <div className="text-xs text-gray-500 mb-2">Hallazgos detectados:</div>
                <div className="space-y-1">
                  {casoSeleccionado.hallazgosIA.map((h, i) => (
                    <div 
                      key={i}
                      onClick={() => setHallazgoSeleccionado(h)}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                        hallazgoSeleccionado === h ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm">{h.nombre}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        h.confianza >= 90 ? 'bg-green-100 text-green-700' :
                        h.confianza >= 85 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {h.confianza}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 bg-blue-50 rounded-lg p-2">
                <Search className="w-4 h-4"/>
                <span>{casoSeleccionado.casosSimilares} casos similares en archivo</span>
              </div>
            </div>

            {/* Alerta hereditaria */}
            {casoSeleccionado.alertaSNS && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                  <AlertTriangle className="w-5 h-5"/>
                  Alerta: Cardiopatía potencialmente hereditaria
                </div>
                <p className="text-sm text-red-600 mb-3">
                  Se recomienda comunicar al Sistema Nacional de Salud para estudio cardiológico preventivo de familiares.
                </p>
                <button className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2">
                  <Send className="w-4 h-4"/>
                  Generar comunicación SNS
                </button>
              </div>
            )}
          </div>

          {/* Acciones del caso */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
            <button 
              onClick={() => setMostrarInforme(true)}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4"/>
              Generar informe
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2 text-sm">
                <Share2 className="w-4 h-4"/>
                Compartir
              </button>
              <button className="py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4"/>
                Consultar
              </button>
            </div>
          </div>
        </div>

        {/* Área del visor de imagen */}
        <div className="flex-1 bg-gray-900 relative flex flex-col">
          {/* Barra de herramientas */}
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setZoom(z => Math.min(z + 0.5, 5))}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-5 h-5"/>
              </button>
              <button 
                onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition"
                title="Reducir zoom"
              >
                <ZoomOut className="w-5 h-5"/>
              </button>
              <button 
                onClick={() => setZoom(1)}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition"
                title="Restablecer zoom"
              >
                <Maximize2 className="w-5 h-5"/>
              </button>
              <div className="px-3 py-1 bg-gray-700 rounded text-sm text-gray-300">
                {Math.round(zoom * 100)}%
              </div>
              <div className="w-px h-6 bg-gray-600 mx-2"/>
              <button className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition" title="Mover">
                <Move className="w-5 h-5"/>
              </button>
              <button className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition" title="Añadir anotación">
                <Tag className="w-5 h-5"/>
              </button>
              <button className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition" title="Capturar imagen">
                <Camera className="w-5 h-5"/>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={ejecutarAnalisisIA}
                disabled={analizandoIA}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                <Brain className="w-4 h-4"/>
                {analizandoIA ? 'Analizando...' : 'Re-analizar IA'}
              </button>
            </div>
          </div>

          {/* Área de imagen */}
          <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
            <div 
              className="transition-transform duration-200 ease-out"
              style={{ transform: `scale(${zoom})` }}
            >
              <div className="bg-white rounded-lg shadow-2xl overflow-hidden" style={{ width: '800px', height: '500px' }}>
                <HistologicalImage 
                  tipo={casoSeleccionado.tejidoTipo}
                  zoom={zoom}
                  hallazgos={casoSeleccionado.hallazgosIA}
                  mostrarIA={mostrarIA}
                  onRegionClick={setHallazgoSeleccionado}
                />
              </div>
            </div>
          </div>

          {/* Info de la preparación */}
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <span>Resolución: 40x</span>
              <span>Formato: SVS (Aperio)</span>
              <span>Tamaño: 2.3 GB</span>
            </div>
            <div className="flex items-center gap-2">
              <span>QR: {casoSeleccionado.bloqueParafina}</span>
            </div>
          </div>

          {/* Overlay de análisis IA */}
          {analizandoIA && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
              <div className="bg-white rounded-xl p-8 text-center max-w-sm">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none"/>
                    <circle 
                      cx="48" cy="48" r="40" 
                      stroke="#7c3aed" strokeWidth="8" fill="none"
                      strokeDasharray={`${progresoAnalisis * 2.51} 251`}
                      className="transition-all duration-200"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-purple-600"/>
                  </div>
                </div>
                <div className="font-semibold text-gray-800 mb-1">Analizando preparación...</div>
                <div className="text-sm text-gray-500 mb-4">
                  {progresoAnalisis < 30 ? 'Detectando estructuras tisulares...' :
                   progresoAnalisis < 60 ? 'Identificando patrones patológicos...' :
                   progresoAnalisis < 90 ? 'Calculando confianza diagnóstica...' : 'Finalizando análisis...'}
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full transition-all duration-200"
                    style={{width: `${Math.min(progresoAnalisis, 100)}%`}}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de informe */}
        {mostrarInforme && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30 p-8">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-full overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">Informe de Histopatología</h2>
                <button onClick={() => setMostrarInforme(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose max-w-none">
                  <div className="text-center mb-6">
                    <div className="text-sm text-gray-500">MINISTERIO DE JUSTICIA</div>
                    <div className="font-bold">INSTITUTO NACIONAL DE TOXICOLOGÍA Y CIENCIAS FORENSES</div>
                    <div className="text-sm">Departamento de Madrid - Servicio de Histopatología</div>
                  </div>
                  
                  <h3 className="text-lg font-bold border-b pb-2">INFORME PERICIAL DE HISTOPATOLOGÍA</h3>
                  
                  <div className="grid grid-cols-2 gap-4 my-4 text-sm">
                    <div><strong>Nº Asunto:</strong> {casoSeleccionado.numeroAsunto}</div>
                    <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES')}</div>
                    <div><strong>Nº Registro:</strong> {casoSeleccionado.id}</div>
                    <div><strong>Médico Forense:</strong> {casoSeleccionado.medicoForense}</div>
                  </div>

                  <h4 className="font-bold mt-4">MUESTRA ESTUDIADA:</h4>
                  <p>{casoSeleccionado.organo} - {casoSeleccionado.zona}</p>
                  <p><strong>Tinción:</strong> {casoSeleccionado.tincion}</p>

                  <h4 className="font-bold mt-4">DESCRIPCIÓN MICROSCÓPICA:</h4>
                  <p>{casoSeleccionado.observacionesIA}</p>

                  <h4 className="font-bold mt-4">DIAGNÓSTICO:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <textarea
                      className="w-full border-0 bg-transparent resize-none focus:outline-none"
                      rows={3}
                      value={diagnosticoEditado || casoSeleccionado.diagnosticoIA}
                      onChange={(e) => setDiagnosticoEditado(e.target.value)}
                      placeholder="Escriba el diagnóstico definitivo..."
                    />
                  </div>

                  <h4 className="font-bold mt-4">CRONOLOGÍA LESIONAL:</h4>
                  <p>{casoSeleccionado.cronolesional}</p>

                  {casoSeleccionado.alertaSNS && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                      <h4 className="font-bold text-red-800">NOTA IMPORTANTE:</h4>
                      <p className="text-red-700">Los hallazgos son compatibles con cardiopatía potencialmente hereditaria. Se recomienda comunicación al Sistema Nacional de Salud para estudio cardiológico preventivo de familiares.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                <button 
                  onClick={() => setMostrarInforme(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center gap-2">
                  <Download className="w-4 h-4"/>
                  Exportar PDF
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <FileCheck className="w-4 h-4"/>
                  Firmar y enviar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header institucional */}
      <header className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8a] text-white shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Microscope className="w-6 h-6"/>
              </div>
              <div>
                <div className="font-bold text-lg tracking-wide">INTCF</div>
                <div className="flex flex-col">
                  <span className="text-xs text-blue-200">Patología Digital</span>
                  <span className="text-[10px] text-blue-300/80 italic font-light">Creado por Pedro Juez Martel</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block w-px h-8 bg-white/20 mx-2"/>
            <div className="hidden md:block text-sm text-blue-200">
              Instituto Nacional de Toxicología y Ciencias Forenses
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-white/10 rounded-lg transition">
              <Bell className="w-5 h-5"/>
              {notificaciones > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {notificaciones}
                </span>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
              <div className="w-8 h-8 bg-[#c9a227] rounded-full flex items-center justify-center text-sm font-bold">
                MS
              </div>
              <div className="text-sm">
                <div className="font-medium">Dra. M.P. Suárez Mier</div>
                <div className="text-xs text-blue-200">Jefa de Servicio</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navegación */}
        <nav className="px-4 bg-[#1a3250]">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'dashboard', icon: Home, label: 'Panel de Control' },
              { id: 'casos', icon: Folder, label: 'Preparaciones' },
              { id: 'busqueda', icon: Search, label: 'Búsqueda IA' },
              { id: 'estadisticas', icon: BarChart3, label: 'Estadísticas' },
              { id: 'docencia', icon: Users, label: 'Docencia' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setVistaActual(item.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                  vistaActual === item.id || (vistaActual === 'visor' && item.id === 'casos')
                    ? 'border-[#c9a227] text-white bg-white/5' 
                    : 'border-transparent text-blue-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4"/>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto">
        {vistaActual === 'dashboard' && renderDashboard()}
        {vistaActual === 'casos' && renderListaCasos()}
        {vistaActual === 'visor' && renderVisor()}
        {vistaActual === 'busqueda' && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Análisis con IA Real</h1>
              <p className="text-gray-500 mt-1">Sube una imagen histológica para analizarla con el modelo Phikon</p>
            </div>
            
            {/* Componente de análisis con IA real */}
            <AnalisisIA />
            
            {/* Información sobre el modelo */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Sobre el modelo</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>BiomedClip</strong> (Owkin) - Vision Transformer con 85M parámetros</li>
                <li>• Entrenado con 40 millones de imágenes histológicas (TCGA)</li>
                <li>• El modelo se carga bajo demanda para ahorrar memoria</li>
                <li>• Primera carga: ~30-60 segundos | Análisis: ~2-5 segundos</li>
              </ul>
            </div>
            
            {/* Instrucciones */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-semibold text-amber-800 mb-2">⚠️ Requisitos</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• El servidor backend debe estar corriendo en <code className="bg-amber-100 px-1 rounded">http://localhost:8000</code></li>
                <li>• Inicia el servidor con: <code className="bg-amber-100 px-1 rounded">iniciar_servidor.bat</code> (Windows) o <code className="bg-amber-100 px-1 rounded">./iniciar_servidor.sh</code> (Linux/Mac)</li>
                <li>• Formatos soportados: JPEG, PNG, TIFF</li>
              </ul>
            </div>
          </div>
        )}
        {vistaActual === 'estadisticas' && (
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Estadísticas y Epidemiología Forense</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Distribución de diagnósticos (2024)</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Patología cardíaca', value: 34, color: '#dc2626' },
                    { label: 'Patología pulmonar', value: 28, color: '#2563eb' },
                    { label: 'Patología hepática', value: 18, color: '#d97706' },
                    { label: 'Lesiones traumáticas', value: 12, color: '#7c3aed' },
                    { label: 'Otros', value: 8, color: '#6b7280' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium">{item.value}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width: `${item.value}%`, backgroundColor: item.color}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Productividad del servicio</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-700">{estadisticasServicio.preparacionesDigitalizadas}</div>
                    <div className="text-sm text-blue-600">Preparaciones este año</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-700">{estadisticasServicio.bloquesArchivados.toLocaleString()}</div>
                    <div className="text-sm text-green-600">Bloques en archivo</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-purple-700">87%</div>
                    <div className="text-sm text-purple-600">Reducción tiempo informe</div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-amber-700">4.2h</div>
                    <div className="text-sm text-amber-600">Tiempo medio por caso</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {vistaActual === 'docencia' && (
          <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Banco de Imágenes para Docencia</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { titulo: 'Infarto agudo de miocardio', casos: 156, descripcion: 'Fases evolutivas del IAM' },
                { titulo: 'Miocardiopatía hipertrófica', casos: 48, descripcion: 'Casos con MCH confirmada' },
                { titulo: 'Esteatohepatitis alcohólica', casos: 234, descripcion: 'Espectro de lesión hepática' },
                { titulo: 'Edema pulmonar', casos: 189, descripcion: 'Patología pulmonar aguda' },
                { titulo: 'Lesiones vitales vs post-mortem', casos: 312, descripcion: 'Datación de lesiones' },
                { titulo: 'Asfixias mecánicas', casos: 87, descripcion: 'Hallazgos en asfixias' },
              ].map((coleccion, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group">
                  <div className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative overflow-hidden">
                    <Grid className="w-16 h-16 text-purple-300 group-hover:scale-110 transition"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"/>
                    <div className="absolute bottom-3 left-3 text-white font-medium">{coleccion.casos} imágenes</div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800">{coleccion.titulo}</h3>
                    <p className="text-sm text-gray-500 mt-1">{coleccion.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
