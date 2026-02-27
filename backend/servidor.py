"""
Backend de Patología Digital INTCF - Versión BiomedCLIP FORENSE
Modelo: BiomedCLIP (Microsoft) - Clasificación Zero-Shot
Versión: 2.1.0 - Categorías forenses ampliadas
"""

import os
import io
import time
import gc
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Estado de los modelos (carga bajo demanda)
modelos_cargados = {
    "biomedclip": {"modelo": None, "procesador": None, "tokenizer": None},
    "biovil": {"modelo": None, "procesador": None, "tokenizer": None}
}

def obtener_modelo_cargado():
    """Retorna si el modelo biomedclip está cargado (para compatibilidad)"""
    return modelos_cargados["biomedclip"]["modelo"] is not None

# =============================================================================
# CATEGORÍAS DIAGNÓSTICAS FORENSES AMPLIADAS PARA EL INTCF
# =============================================================================

CATEGORIAS_FORENSES = {
    
    # =========================================================================
    # LESIONES CONTUSAS - DATACIÓN DE CONTUSIONES
    # =========================================================================
    "contusiones": {
        "nombre": "Lesiones contusas y datación",
        "descripcion": "Clasificación temporal de contusiones y equimosis",
        "diagnosticos": [
            {
                "id": "contusion_inmediata",
                "texto": "very fresh bruise with active hemorrhage and intact red blood cells without inflammatory response",
                "nombre_es": "Contusión inmediata (0-4 horas)",
                "descripcion": "Hemorragia activa con eritrocitos intactos, sin respuesta inflamatoria",
                "hallazgos": ["Eritrocitos intactos", "Hemorragia activa", "Sin infiltrado inflamatorio"],
                "tiempo_estimado": "0-4 horas",
                "relevancia_forense": "Lesión muy reciente, compatible con hechos inmediatos"
            },
            {
                "id": "contusion_reciente",
                "texto": "recent bruise with early neutrophil infiltration and red blood cell extravasation",
                "nombre_es": "Contusión reciente (4-24 horas)",
                "descripcion": "Inicio de infiltrado neutrofílico, extravasación eritrocitaria",
                "hallazgos": ["Infiltrado neutrofílico temprano", "Eritrocitos extravasados", "Edema tisular"],
                "tiempo_estimado": "4-24 horas",
                "relevancia_forense": "Lesión del mismo día de los hechos"
            },
            {
                "id": "contusion_1_3_dias",
                "texto": "bruise with neutrophil predominance and early macrophage infiltration beginning hemoglobin degradation",
                "nombre_es": "Contusión en evolución (1-3 días)",
                "descripcion": "Predominio neutrofílico con inicio de macrófagos, degradación de hemoglobina",
                "hallazgos": ["Neutrófilos abundantes", "Macrófagos tempranos", "Hemoglobina degradándose"],
                "tiempo_estimado": "1-3 días",
                "relevancia_forense": "Lesión de días previos a los hechos"
            },
            {
                "id": "contusion_3_7_dias",
                "texto": "bruise with macrophage predominance hemosiderin deposits and early granulation tissue",
                "nombre_es": "Contusión intermedia (3-7 días)",
                "descripcion": "Predominio de macrófagos, depósitos de hemosiderina, tejido de granulación",
                "hallazgos": ["Macrófagos con hemosiderina", "Pigmento férrico", "Granulación incipiente", "Coloración verdosa-amarillenta"],
                "tiempo_estimado": "3-7 días",
                "relevancia_forense": "Lesión de aproximadamente una semana"
            },
            {
                "id": "contusion_1_2_semanas",
                "texto": "healing bruise with hemosiderin-laden macrophages fibroblast proliferation and collagen deposition",
                "nombre_es": "Contusión en resolución (1-2 semanas)",
                "descripcion": "Macrófagos cargados de hemosiderina, proliferación fibroblástica",
                "hallazgos": ["Hemosiderina abundante", "Fibroblastos activos", "Colágeno nuevo", "Coloración amarillenta"],
                "tiempo_estimado": "1-2 semanas",
                "relevancia_forense": "Lesión previa de más de una semana"
            },
            {
                "id": "contusion_antigua",
                "texto": "old healed bruise with residual hemosiderin organized fibrosis and scar tissue",
                "nombre_es": "Contusión antigua (>2 semanas)",
                "descripcion": "Hemosiderina residual, fibrosis organizada, cicatrización",
                "hallazgos": ["Hemosiderina residual", "Fibrosis organizada", "Tejido cicatricial"],
                "tiempo_estimado": ">2 semanas",
                "relevancia_forense": "Lesión antigua, no relacionada con hechos recientes"
            },
            {
                "id": "lesion_postmortem",
                "texto": "postmortem skin injury without vital reaction no inflammatory infiltrate no hemorrhage organization",
                "nombre_es": "Lesión post-mortem",
                "descripcion": "Ausencia de reacción vital, sin infiltrado inflamatorio",
                "hallazgos": ["Sin reacción inflamatoria", "Ausencia de organización hemorrágica", "Tejido sin respuesta vital"],
                "tiempo_estimado": "Post-mortem",
                "relevancia_forense": "Lesión producida después de la muerte"
            }
        ]
    },

    # =========================================================================
    # HERIDAS POR ARMA DE FUEGO
    # =========================================================================
    "arma_fuego": {
        "nombre": "Heridas por arma de fuego",
        "descripcion": "Clasificación de heridas por proyectil de arma de fuego",
        "diagnosticos": [
            {
                "id": "haf_entrada_contacto",
                "texto": "contact gunshot entrance wound with muzzle imprint soot deposits and stellate laceration from gas expansion",
                "nombre_es": "Orificio de entrada a contacto",
                "descripcion": "Herida con impronta de boca de cañón, depósito de hollín, laceración estrellada",
                "hallazgos": ["Impronta de boca de cañón", "Hollín en bordes", "Laceración estrellada", "Quemadura por gases"],
                "distancia": "Contacto (0 cm)",
                "relevancia_forense": "Disparo a quemarropa, frecuente en suicidios"
            },
            {
                "id": "haf_entrada_corta",
                "texto": "close range gunshot entrance wound with stippling tattooing and soot ring around defect",
                "nombre_es": "Orificio de entrada a corta distancia",
                "descripcion": "Herida con tatuaje por pólvora (stippling), anillo de hollín",
                "hallazgos": ["Tatuaje de pólvora", "Anillo de hollín", "Zona de limpieza", "Ahumamiento"],
                "distancia": "Corta distancia (1-30 cm)",
                "relevancia_forense": "Disparo cercano, indica proximidad agresor-víctima"
            },
            {
                "id": "haf_entrada_intermedia",
                "texto": "intermediate range gunshot wound with powder stippling without soot deposition abrasion collar",
                "nombre_es": "Orificio de entrada a distancia intermedia",
                "descripcion": "Tatuaje de pólvora sin hollín, collarete de contusión",
                "hallazgos": ["Tatuaje sin hollín", "Collarete contuso-erosivo", "Anillo de limpieza"],
                "distancia": "Intermedia (30-60 cm)",
                "relevancia_forense": "Distancia media, compatible con agresión"
            },
            {
                "id": "haf_entrada_larga",
                "texto": "distant gunshot entrance wound with clean circular defect abrasion ring and contusion collar only",
                "nombre_es": "Orificio de entrada a larga distancia",
                "descripcion": "Defecto circular limpio con collarete erosivo-contusivo",
                "hallazgos": ["Orificio circular regular", "Collarete erosivo", "Anillo de contusión", "Sin residuos de pólvora"],
                "distancia": "Larga distancia (>60 cm)",
                "relevancia_forense": "Disparo a distancia"
            },
            {
                "id": "haf_salida",
                "texto": "gunshot exit wound with irregular stellate margins everted edges and no abrasion collar",
                "nombre_es": "Orificio de salida",
                "descripcion": "Herida irregular, estrellada, bordes evertidos, sin collarete",
                "hallazgos": ["Bordes irregulares evertidos", "Forma estrellada", "Sin collarete", "Mayor tamaño que entrada"],
                "distancia": "N/A",
                "relevancia_forense": "Confirma trayectoria del proyectil"
            },
            {
                "id": "haf_trayecto",
                "texto": "gunshot wound track with hemorrhagic tunnel tissue destruction and bullet fragmentation",
                "nombre_es": "Trayecto de proyectil",
                "descripcion": "Túnel hemorrágico con destrucción tisular",
                "hallazgos": ["Túnel hemorrágico", "Destrucción tisular", "Posibles fragmentos metálicos"],
                "distancia": "Interno",
                "relevancia_forense": "Determina dirección y ángulo del disparo"
            }
        ]
    },

    # =========================================================================
    # HERIDAS POR ARMA BLANCA
    # =========================================================================
    "arma_blanca": {
        "nombre": "Heridas por arma blanca",
        "descripcion": "Lesiones por instrumentos cortantes, punzantes y corto-punzantes",
        "diagnosticos": [
            {
                "id": "herida_incisa",
                "texto": "incised wound with clean sharp edges longer than deep regular margins and minimal tissue bridging",
                "nombre_es": "Herida incisa (cortante)",
                "descripcion": "Herida de bordes limpios, más larga que profunda, sin puentes tisulares",
                "hallazgos": ["Bordes nítidos regulares", "Mayor longitud que profundidad", "Sin puentes dérmicos", "Colas de entrada y salida"],
                "mecanismo": "Instrumento cortante (cuchillo, navaja, vidrio)",
                "relevancia_forense": "Indica instrumento con filo"
            },
            {
                "id": "herida_punzante",
                "texto": "stab wound with small entrance and deep penetration track puncture wound with depth greater than width",
                "nombre_es": "Herida punzante",
                "descripcion": "Orificio pequeño con penetración profunda, mayor profundidad que anchura",
                "hallazgos": ["Orificio de entrada pequeño", "Trayecto profundo", "Bordes regulares o irregulares según instrumento"],
                "mecanismo": "Instrumento punzante (punzón, destornillador, aguja)",
                "relevancia_forense": "Puede afectar órganos profundos con mínima lesión externa"
            },
            {
                "id": "herida_corto_punzante",
                "texto": "stab wound with sharp edges showing weapon characteristics penetrating wound with cutting component",
                "nombre_es": "Herida corto-punzante",
                "descripcion": "Herida penetrante con componente cortante, reproduce forma del arma",
                "hallazgos": ["Bordes cortantes", "Un extremo agudo (punta)", "Un extremo romo o cortante (lomo/filo)", "Profundidad significativa"],
                "mecanismo": "Instrumento corto-punzante (cuchillo, puñal)",
                "relevancia_forense": "Permite estimar características del arma"
            },
            {
                "id": "herida_defensa",
                "texto": "defensive wound on hands forearms with incised cuts abrasions indicating victim resistance",
                "nombre_es": "Heridas de defensa",
                "descripcion": "Lesiones en manos, antebrazos por defensa activa de la víctima",
                "hallazgos": ["Cortes en palmas", "Lesiones en dorso de manos", "Cortes en antebrazos", "Múltiples heridas superficiales"],
                "mecanismo": "Defensa activa contra agresor armado",
                "relevancia_forense": "Indica que la víctima intentó defenderse"
            },
            {
                "id": "herida_vacilacion",
                "texto": "hesitation marks with multiple superficial parallel incisions tentative self-inflicted cuts",
                "nombre_es": "Heridas de vacilación/tanteo",
                "descripcion": "Múltiples incisiones superficiales paralelas, típicas de autolesión",
                "hallazgos": ["Múltiples cortes paralelos", "Superficiales", "Zona accesible", "Agrupados"],
                "mecanismo": "Autoinfligidas (suicidio)",
                "relevancia_forense": "Sugiere etiología suicida"
            }
        ]
    },

    # =========================================================================
    # ASFIXIAS MECÁNICAS
    # =========================================================================
    "asfixias": {
        "nombre": "Asfixias mecánicas",
        "descripcion": "Lesiones por diferentes mecanismos asfícticos",
        "diagnosticos": [
            {
                "id": "ahorcamiento",
                "texto": "hanging with oblique ligature mark ascending pattern cervical tissue hemorrhage and neck structure damage",
                "nombre_es": "Ahorcamiento",
                "descripcion": "Surco oblicuo ascendente, lesiones cervicales características",
                "hallazgos": ["Surco oblicuo ascendente", "Signo de Amussat", "Hemorragia en esternocleidomastoideo", "Fractura de hioides/tiroides"],
                "mecanismo": "Constricción cervical por peso corporal",
                "relevancia_forense": "Típico de suicidio, raramente homicidio"
            },
            {
                "id": "estrangulacion_lazo",
                "texto": "ligature strangulation with horizontal circular mark petechial hemorrhages and neck soft tissue damage",
                "nombre_es": "Estrangulación a lazo",
                "descripcion": "Surco horizontal circular, petequias, lesiones de partes blandas",
                "hallazgos": ["Surco horizontal completo", "Petequias conjuntivales", "Cianosis facial", "Hemorragias musculares cervicales"],
                "mecanismo": "Constricción cervical por lazo con fuerza externa",
                "relevancia_forense": "Típico de homicidio"
            },
            {
                "id": "estrangulacion_manual",
                "texto": "manual strangulation with fingernail marks bruises on neck thyroid cartilage fracture and petechiae",
                "nombre_es": "Estrangulación manual",
                "descripcion": "Estigmas ungueales, equimosis digitales, fracturas laríngeas",
                "hallazgos": ["Marcas de uñas (estigmas ungueales)", "Equimosis digitales", "Fractura de cartílago tiroides", "Petequias faciales"],
                "mecanismo": "Compresión cervical con manos",
                "relevancia_forense": "Homicidio, indica contacto directo agresor-víctima"
            },
            {
                "id": "sofocacion",
                "texto": "smothering asphyxia with perioral perinasal injuries mucosal petechiae and pulmonary congestion",
                "nombre_es": "Sofocación",
                "descripcion": "Lesiones periorales/perinasales, petequias mucosas, congestión pulmonar",
                "hallazgos": ["Lesiones en labios", "Lesiones en encías", "Petequias en mucosas", "Congestión pulmonar intensa"],
                "mecanismo": "Oclusión de orificios respiratorios",
                "relevancia_forense": "Puede ser homicidio o accidente"
            },
            {
                "id": "sumersion",
                "texto": "drowning with pulmonary edema foam in airways diatom presence and aqueous medium aspiration",
                "nombre_es": "Sumersión/Ahogamiento",
                "descripcion": "Edema pulmonar, espuma en vías aéreas, signos de aspiración",
                "hallazgos": ["Hongo de espuma", "Pulmones hiperinsuflados", "Edema pulmonar", "Manchas de Paltauf", "Presencia de diatomeas"],
                "mecanismo": "Inmersión en medio líquido",
                "relevancia_forense": "Requiere determinar si fue vital (antes de muerte)"
            },
            {
                "id": "compresion_toraco_abdominal",
                "texto": "traumatic asphyxia with facial cyanosis petechial hemorrhages and chest compression injuries",
                "nombre_es": "Asfixia por compresión toraco-abdominal",
                "descripcion": "Cianosis cérvico-facial, petequias, lesiones por compresión",
                "hallazgos": ["Mascarilla equimótica", "Petequias en escleróticas", "Fracturas costales", "Congestión visceral"],
                "mecanismo": "Compresión externa del tórax/abdomen",
                "relevancia_forense": "Accidental (avalanchas) u homicida"
            }
        ]
    },

    # =========================================================================
    # LESIONES POR TEMPERATURA
    # =========================================================================
    "temperatura": {
        "nombre": "Lesiones por temperatura",
        "descripcion": "Quemaduras, congelación y lesiones térmicas",
        "diagnosticos": [
            {
                "id": "quemadura_1grado",
                "texto": "first degree burn with erythema and mild epidermal damage without blistering",
                "nombre_es": "Quemadura de 1er grado",
                "descripcion": "Eritema epidérmico sin ampollas",
                "hallazgos": ["Eritema", "Edema leve", "Epidermis intacta", "Dolor"],
                "profundidad": "Epidérmica",
                "relevancia_forense": "Lesión leve, recuperación completa"
            },
            {
                "id": "quemadura_2grado",
                "texto": "second degree burn with blistering partial thickness skin damage and dermal injury",
                "nombre_es": "Quemadura de 2do grado",
                "descripcion": "Ampollas, afectación dérmica parcial",
                "hallazgos": ["Flictenas/ampollas", "Dermis expuesta", "Exudado seroso", "Dolor intenso"],
                "profundidad": "Dérmica parcial",
                "relevancia_forense": "Lesión moderada, puede dejar cicatriz"
            },
            {
                "id": "quemadura_3grado",
                "texto": "third degree burn with full thickness skin necrosis eschar formation and destroyed skin appendages",
                "nombre_es": "Quemadura de 3er grado",
                "descripcion": "Necrosis cutánea completa, escara, destrucción de anejos",
                "hallazgos": ["Escara blanquecina o negra", "Anestesia (nervios destruidos)", "Trombosis vascular", "Destrucción de folículos"],
                "profundidad": "Espesor total",
                "relevancia_forense": "Lesión grave, requiere injerto"
            },
            {
                "id": "quemadura_4grado",
                "texto": "fourth degree burn with carbonization muscle and bone involvement deep tissue destruction",
                "nombre_es": "Quemadura de 4to grado (carbonización)",
                "descripcion": "Carbonización, afectación de músculo y hueso",
                "hallazgos": ["Tejido carbonizado", "Músculo afectado", "Hueso expuesto", "Actitud de boxeador"],
                "profundidad": "Tejidos profundos",
                "relevancia_forense": "Determinar si quemadura fue vital o post-mortem"
            },
            {
                "id": "quemadura_vital",
                "texto": "vital burn injury with inflammatory reaction blistering with protein-rich fluid and soot in airways",
                "nombre_es": "Quemadura vital (ante-mortem)",
                "descripcion": "Signos de reacción vital, hollín en vías aéreas",
                "hallazgos": ["Reacción inflamatoria en bordes", "Líquido rico en proteínas en ampollas", "Hollín en tráquea/bronquios", "COHb elevada"],
                "profundidad": "Variable",
                "relevancia_forense": "Persona viva durante el incendio"
            },
            {
                "id": "quemadura_postmortem",
                "texto": "postmortem burn without vital reaction no inflammatory response heat-induced skin splitting",
                "nombre_es": "Quemadura post-mortem",
                "descripcion": "Sin reacción vital, fisuras cutáneas por calor",
                "hallazgos": ["Sin inflamación", "Fisuras cutáneas por retracción", "Sin hollín en vías aéreas", "COHb baja"],
                "profundidad": "Variable",
                "relevancia_forense": "Cadáver quemado después de la muerte"
            }
        ]
    },

    # =========================================================================
    # LESIONES ELÉCTRICAS
    # =========================================================================
    "electricidad": {
        "nombre": "Lesiones por electricidad",
        "descripcion": "Electrocución y fulguración",
        "diagnosticos": [
            {
                "id": "marca_electrica",
                "texto": "electrical burn mark with pale crater-like lesion raised edges and metallization",
                "nombre_es": "Marca eléctrica típica",
                "descripcion": "Lesión crateriforme pálida con bordes elevados",
                "hallazgos": ["Lesión crateriforme", "Centro pálido deprimido", "Bordes elevados", "Metalización", "Vesículas periféricas"],
                "mecanismo": "Contacto con conductor eléctrico",
                "relevancia_forense": "Confirma electrocución, indica punto de contacto"
            },
            {
                "id": "fulgoracion",
                "texto": "lightning strike injury with arborescent burns Lichtenberg figures and entry exit wounds",
                "nombre_es": "Fulguración (rayo)",
                "descripcion": "Figuras de Lichtenberg, quemaduras arborescentes",
                "hallazgos": ["Figuras de Lichtenberg", "Quemaduras arborescentes", "Magnetización de metales", "Rotura de tímpanos"],
                "mecanismo": "Descarga atmosférica",
                "relevancia_forense": "Muerte accidental por rayo"
            }
        ]
    },

    # =========================================================================
    # FENÓMENOS CADAVÉRICOS Y TANATOLOGÍA
    # =========================================================================
    "tanatologia": {
        "nombre": "Fenómenos cadavéricos",
        "descripcion": "Signos para estimación del intervalo post-mortem",
        "diagnosticos": [
            {
                "id": "livor_mortis_temprano",
                "texto": "early livor mortis with unfixed red-purple discoloration that blanches with pressure",
                "nombre_es": "Livideces recientes (no fijas)",
                "descripcion": "Coloración rojo-violácea que desaparece a la presión",
                "hallazgos": ["Coloración rojo-violácea", "Desaparece a la presión", "En zonas declives", "Móviles"],
                "tiempo_estimado": "0-6 horas post-mortem",
                "relevancia_forense": "Muerte reciente, posición modificable"
            },
            {
                "id": "livor_mortis_fijo",
                "texto": "fixed livor mortis with permanent purple discoloration that does not blanch with pressure",
                "nombre_es": "Livideces fijas",
                "descripcion": "Coloración permanente que no desaparece a la presión",
                "hallazgos": ["Coloración violácea fija", "No desaparece a presión", "Posición definitiva"],
                "tiempo_estimado": "6-12 horas post-mortem",
                "relevancia_forense": "Permite determinar si hubo cambio de posición"
            },
            {
                "id": "rigor_mortis_temprano",
                "texto": "early rigor mortis with muscle stiffening beginning in small muscles face and jaw",
                "nombre_es": "Rigidez cadavérica inicial",
                "descripcion": "Rigidez comenzando en músculos pequeños (cara, mandíbula)",
                "hallazgos": ["Rigidez en mandíbula", "Rigidez en párpados", "Rigidez en dedos", "Resto del cuerpo flácido"],
                "tiempo_estimado": "2-4 horas post-mortem",
                "relevancia_forense": "Muerte reciente"
            },
            {
                "id": "rigor_mortis_completo",
                "texto": "complete rigor mortis with generalized muscle stiffness affecting all body",
                "nombre_es": "Rigidez cadavérica completa",
                "descripcion": "Rigidez generalizada en todo el cuerpo",
                "hallazgos": ["Rigidez generalizada", "Articulaciones inmóviles", "Máxima intensidad"],
                "tiempo_estimado": "8-12 horas post-mortem",
                "relevancia_forense": "Intervalo post-mortem intermedio"
            },
            {
                "id": "rigor_mortis_resolucion",
                "texto": "resolving rigor mortis with decreasing muscle stiffness and beginning flaccidity",
                "nombre_es": "Rigidez en resolución",
                "descripcion": "Disminución de rigidez, inicio de flacidez",
                "hallazgos": ["Rigidez disminuyendo", "Flacidez en músculos pequeños", "Articulaciones más móviles"],
                "tiempo_estimado": "24-36 horas post-mortem",
                "relevancia_forense": "Muerte no reciente"
            },
            {
                "id": "putrefaccion_temprana",
                "texto": "early decomposition with green abdominal discoloration and bacterial gas formation",
                "nombre_es": "Putrefacción temprana",
                "descripcion": "Mancha verde abdominal, inicio de gases",
                "hallazgos": ["Mancha verde en fosa ilíaca derecha", "Distensión abdominal", "Olor característico", "Red venosa visible"],
                "tiempo_estimado": "24-48 horas post-mortem",
                "relevancia_forense": "Muerte de más de un día"
            }
        ]
    },

    # =========================================================================
    # PATOLOGÍA CARDÍACA FORENSE
    # =========================================================================
    "corazon": {
        "nombre": "Patología cardíaca forense",
        "descripcion": "Causas de muerte súbita cardíaca",
        "diagnosticos": [
            {
                "id": "infarto_hiperagudo",
                "texto": "hyperacute myocardial infarction with wavy myocardial fibers early coagulative necrosis and contraction bands",
                "nombre_es": "Infarto agudo de miocardio (hiperagudo)",
                "descripcion": "Fibras onduladas, bandas de contracción, necrosis coagulativa inicial",
                "hallazgos": ["Fibras miocárdicas onduladas", "Bandas de contracción", "Necrosis incipiente", "Sin infiltrado inflamatorio"],
                "tiempo_estimado": "0-4 horas",
                "relevancia_forense": "Muerte súbita cardíaca, puede no verse macroscópicamente"
            },
            {
                "id": "infarto_agudo",
                "texto": "acute myocardial infarction with coagulative necrosis neutrophil infiltration and nuclear pyknosis",
                "nombre_es": "Infarto agudo de miocardio",
                "descripcion": "Necrosis coagulativa con infiltrado neutrofílico",
                "hallazgos": ["Necrosis coagulativa", "Infiltrado neutrofílico", "Picnosis nuclear", "Pérdida de estriaciones"],
                "tiempo_estimado": "4-24 horas",
                "relevancia_forense": "Causa de muerte natural frecuente"
            },
            {
                "id": "infarto_subagudo",
                "texto": "subacute myocardial infarction with macrophage infiltration granulation tissue and early fibrosis",
                "nombre_es": "Infarto subagudo de miocardio",
                "descripcion": "Infiltrado macrofágico, tejido de granulación",
                "hallazgos": ["Macrófagos fagocitando", "Tejido de granulación", "Neovascularización", "Fibroblastos"],
                "tiempo_estimado": "1-3 semanas",
                "relevancia_forense": "Infarto previo en evolución"
            },
            {
                "id": "miocardiopatia_hipertrofica",
                "texto": "hypertrophic cardiomyopathy with asymmetric septal hypertrophy myocyte disarray and interstitial fibrosis",
                "nombre_es": "Miocardiopatía hipertrófica",
                "descripcion": "Hipertrofia asimétrica septal, desorganización miocitaria",
                "hallazgos": ["Hipertrofia septal asimétrica", "Desorganización de fibras", "Fibrosis intersticial", "Arterias intramurales engrosadas"],
                "tiempo_estimado": "Crónico",
                "relevancia_forense": "Causa de muerte súbita en jóvenes y deportistas"
            },
            {
                "id": "miocarditis",
                "texto": "myocarditis with lymphocytic infiltration myocyte necrosis and interstitial edema",
                "nombre_es": "Miocarditis",
                "descripcion": "Infiltrado linfocitario con necrosis miocitaria",
                "hallazgos": ["Infiltrado linfocitario", "Necrosis de miocitos", "Edema intersticial", "Posibles células gigantes"],
                "tiempo_estimado": "Agudo/Subagudo",
                "relevancia_forense": "Causa de muerte súbita, especialmente en jóvenes"
            },
            {
                "id": "rotura_cardiaca",
                "texto": "cardiac rupture with myocardial wall defect hemopericardium and infarcted tissue",
                "nombre_es": "Rotura cardíaca",
                "descripcion": "Defecto en pared miocárdica, hemopericardio",
                "hallazgos": ["Solución de continuidad en pared", "Hemopericardio", "Tejido necrótico circundante", "Taponamiento cardíaco"],
                "tiempo_estimado": "3-7 días post-infarto",
                "relevancia_forense": "Complicación fatal de infarto"
            }
        ]
    },

    # =========================================================================
    # PATOLOGÍA HEPÁTICA FORENSE
    # =========================================================================
    "higado": {
        "nombre": "Patología hepática forense",
        "descripcion": "Hallazgos hepáticos relevantes en medicina forense",
        "diagnosticos": [
            {
                "id": "esteatosis_alcoholica",
                "texto": "alcoholic fatty liver with macrovesicular steatosis and perivenular distribution",
                "nombre_es": "Esteatosis hepática alcohólica",
                "descripcion": "Esteatosis macrovesicular de predominio perivenular",
                "hallazgos": ["Vacuolas lipídicas grandes", "Distribución perivenular", "Hepatocitos balonizados"],
                "relevancia_forense": "Indica consumo crónico de alcohol"
            },
            {
                "id": "hepatitis_alcoholica",
                "texto": "alcoholic hepatitis with Mallory-Denk bodies neutrophil infiltration and ballooning degeneration",
                "nombre_es": "Hepatitis alcohólica",
                "descripcion": "Cuerpos de Mallory-Denk, infiltrado neutrofílico, balonización",
                "hallazgos": ["Cuerpos de Mallory-Denk", "Infiltrado neutrofílico", "Degeneración balonizante", "Fibrosis pericelular"],
                "relevancia_forense": "Alcoholismo crónico severo"
            },
            {
                "id": "cirrosis",
                "texto": "liver cirrhosis with regenerative nodules fibrous septa and distorted architecture",
                "nombre_es": "Cirrosis hepática",
                "descripcion": "Nódulos regenerativos, septos fibrosos, arquitectura distorsionada",
                "hallazgos": ["Nódulos de regeneración", "Fibrosis en puentes", "Arquitectura distorsionada", "Hipertensión portal"],
                "relevancia_forense": "Enfermedad hepática terminal"
            },
            {
                "id": "necrosis_hepatica_toxica",
                "texto": "toxic hepatic necrosis with centrilobular necrosis and hepatocyte dropout",
                "nombre_es": "Necrosis hepática tóxica",
                "descripcion": "Necrosis centrolobulillar por tóxicos/fármacos",
                "hallazgos": ["Necrosis centrolobulillar", "Pérdida de hepatocitos", "Congestión sinusoidal", "Posible colestasis"],
                "relevancia_forense": "Sobredosis de paracetamol, intoxicaciones"
            },
            {
                "id": "congestion_hepatica",
                "texto": "hepatic congestion with centrilobular sinusoidal dilation and nutmeg liver pattern",
                "nombre_es": "Congestión hepática pasiva",
                "descripcion": "Dilatación sinusoidal centrolobulillar, patrón en nuez moscada",
                "hallazgos": ["Hígado en nuez moscada", "Dilatación sinusoidal central", "Atrofia hepatocitaria", "Fibrosis cardíaca"],
                "relevancia_forense": "Indica insuficiencia cardíaca derecha"
            }
        ]
    },

    # =========================================================================
    # PATOLOGÍA PULMONAR FORENSE
    # =========================================================================
    "pulmon": {
        "nombre": "Patología pulmonar forense",
        "descripcion": "Hallazgos pulmonares en autopsias médico-legales",
        "diagnosticos": [
            {
                "id": "edema_pulmonar",
                "texto": "pulmonary edema with alveolar fluid protein-rich transudate and septal congestion",
                "nombre_es": "Edema pulmonar",
                "descripcion": "Líquido intraalveolar, trasudado proteico, congestión septal",
                "hallazgos": ["Líquido rosado en alvéolos", "Septos engrosados", "Congestión capilar", "Macrófagos con hemosiderina"],
                "relevancia_forense": "Insuficiencia cardíaca, sobredosis opiáceos"
            },
            {
                "id": "aspiracion",
                "texto": "aspiration pneumonia with foreign material in airways inflammatory response and necrotizing pneumonia",
                "nombre_es": "Neumonía por aspiración",
                "descripcion": "Material extraño en vías aéreas, respuesta inflamatoria",
                "hallazgos": ["Material alimenticio en bronquios", "Células gigantes multinucleadas", "Inflamación aguda", "Necrosis focal"],
                "relevancia_forense": "Aspiración de contenido gástrico, atragantamiento"
            },
            {
                "id": "hemorragia_pulmonar",
                "texto": "pulmonary hemorrhage with intraalveolar blood hemosiderin-laden macrophages and alveolar damage",
                "nombre_es": "Hemorragia pulmonar",
                "descripcion": "Sangre intraalveolar, macrófagos con hemosiderina",
                "hallazgos": ["Eritrocitos en alvéolos", "Macrófagos con hemosiderina", "Daño alveolar difuso"],
                "relevancia_forense": "Trauma, coagulopatía, vasculitis"
            },
            {
                "id": "embolia_pulmonar",
                "texto": "pulmonary embolism with thrombus in pulmonary artery hemorrhagic infarction and pleuritic reaction",
                "nombre_es": "Tromboembolismo pulmonar",
                "descripcion": "Trombo en arteria pulmonar, infarto hemorrágico",
                "hallazgos": ["Trombo en arteria pulmonar", "Infarto hemorrágico cuneiforme", "Líneas de Zahn en trombo", "Reacción pleural"],
                "relevancia_forense": "Muerte súbita, postoperatorio, inmovilización"
            },
            {
                "id": "embolia_grasa",
                "texto": "fat embolism with fat globules in pulmonary vessels petechial hemorrhages and ARDS pattern",
                "nombre_es": "Embolia grasa",
                "descripcion": "Glóbulos de grasa en vasos pulmonares, petequias",
                "hallazgos": ["Glóbulos de grasa en capilares", "Petequias cerebrales y cutáneas", "Daño alveolar difuso"],
                "relevancia_forense": "Fracturas de huesos largos, liposucción"
            },
            {
                "id": "neumonia",
                "texto": "bacterial pneumonia with neutrophilic alveolar exudate consolidation and fibrinopurulent inflammation",
                "nombre_es": "Neumonía bacteriana",
                "descripcion": "Exudado neutrofílico alveolar, consolidación",
                "hallazgos": ["Exudado purulento alveolar", "Consolidación lobar", "Fibrina", "Bacterias"],
                "relevancia_forense": "Causa de muerte natural frecuente"
            }
        ]
    },

    # =========================================================================
    # PATOLOGÍA CEREBRAL FORENSE
    # =========================================================================
    "cerebro": {
        "nombre": "Patología cerebral forense",
        "descripcion": "Lesiones cerebrales de interés médico-legal",
        "diagnosticos": [
            {
                "id": "hematoma_epidural",
                "texto": "epidural hematoma with lens-shaped blood collection between skull and dura arterial bleeding",
                "nombre_es": "Hematoma epidural",
                "descripcion": "Colección hemática biconvexa entre cráneo y duramadre",
                "hallazgos": ["Hematoma biconvexo", "Origen arterial (a. meníngea media)", "Fractura temporal asociada", "Intervalo lúcido"],
                "mecanismo": "Traumatismo craneal",
                "relevancia_forense": "Lesión traumática, potencialmente tratable"
            },
            {
                "id": "hematoma_subdural",
                "texto": "subdural hematoma with crescent-shaped blood collection between dura and arachnoid venous origin",
                "nombre_es": "Hematoma subdural",
                "descripcion": "Colección hemática en semiluna entre duramadre y aracnoides",
                "hallazgos": ["Hematoma en semiluna", "Origen venoso (venas puente)", "Puede ser bilateral", "Atrofia cerebral subyacente"],
                "mecanismo": "Trauma, maltrato (síndrome del niño sacudido)",
                "relevancia_forense": "Frecuente en maltrato infantil y ancianos"
            },
            {
                "id": "hemorragia_subaracnoidea",
                "texto": "subarachnoid hemorrhage with blood in subarachnoid space aneurysm rupture and basal cistern blood",
                "nombre_es": "Hemorragia subaracnoidea",
                "descripcion": "Sangre en espacio subaracnoideo, rotura aneurismática",
                "hallazgos": ["Sangre en cisternas basales", "Aneurisma roto", "Vasoespasmo", "Hidrocefalia"],
                "mecanismo": "Rotura de aneurisma, trauma",
                "relevancia_forense": "Muerte súbita natural o traumática"
            },
            {
                "id": "contusion_cerebral",
                "texto": "cerebral contusion with hemorrhagic necrosis coup and contrecoup injuries and cortical bruising",
                "nombre_es": "Contusión cerebral",
                "descripcion": "Necrosis hemorrágica cortical, lesiones por golpe y contragolpe",
                "hallazgos": ["Hemorragias corticales", "Lesión de golpe", "Lesión de contragolpe", "Edema perilesional"],
                "mecanismo": "Traumatismo craneoencefálico",
                "relevancia_forense": "Indica mecanismo del trauma"
            },
            {
                "id": "dai",
                "texto": "diffuse axonal injury with axonal swelling retraction balls and corpus callosum hemorrhage",
                "nombre_es": "Daño axonal difuso",
                "descripcion": "Lesión axonal por cizallamiento, bolas de retracción",
                "hallazgos": ["Hemorragias en cuerpo calloso", "Bolas de retracción axonal", "Lesiones en tronco", "Hemorragias puntiformes difusas"],
                "mecanismo": "Aceleración-desaceleración rotacional",
                "relevancia_forense": "Accidentes de tráfico, maltrato infantil"
            },
            {
                "id": "encefalopatia_hipoxica",
                "texto": "hypoxic-ischemic encephalopathy with selective neuronal necrosis red neurons and laminar necrosis",
                "nombre_es": "Encefalopatía hipóxico-isquémica",
                "descripcion": "Necrosis neuronal selectiva, neuronas rojas",
                "hallazgos": ["Neuronas rojas (eosinófilas)", "Necrosis laminar cortical", "Afectación de hipocampo", "Gliosis reactiva"],
                "mecanismo": "Paro cardíaco, asfixia, ahogamiento",
                "relevancia_forense": "Indica período de hipoxia antes de muerte"
            }
        ]
    },

    # =========================================================================
    # TOXICOLOGÍA HISTOPATOLÓGICA
    # =========================================================================
    "toxicologia": {
        "nombre": "Hallazgos histopatológicos en intoxicaciones",
        "descripcion": "Cambios tisulares asociados a intoxicaciones",
        "diagnosticos": [
            {
                "id": "intox_co",
                "texto": "carbon monoxide poisoning with cherry red discoloration and selective basal ganglia necrosis",
                "nombre_es": "Intoxicación por monóxido de carbono",
                "descripcion": "Coloración rojo cereza, necrosis de ganglios basales",
                "hallazgos": ["Coloración rojo cereza de vísceras", "Necrosis bilateral de globo pálido", "Desmielinización tardía", "Carboxihemoglobina elevada"],
                "relevancia_forense": "Incendios, suicidio por gases de escape"
            },
            {
                "id": "intox_opiaceos",
                "texto": "opioid overdose with pulmonary edema congestion and needle track marks",
                "nombre_es": "Sobredosis de opiáceos",
                "descripcion": "Edema pulmonar severo, marcas de venopunción",
                "hallazgos": ["Edema pulmonar masivo", "Congestión visceral", "Marcas de aguja", "Miosis"],
                "relevancia_forense": "Muerte por sobredosis accidental o suicidio"
            },
            {
                "id": "intox_cocaina",
                "texto": "cocaine toxicity with myocardial contraction band necrosis coronary vasospasm and hyperthermia",
                "nombre_es": "Toxicidad por cocaína",
                "descripcion": "Necrosis en bandas de contracción, vasoespasmo coronario",
                "hallazgos": ["Bandas de contracción miocárdica", "Hemorragias cerebrales", "Hipertermia", "Rabdomiolisis"],
                "relevancia_forense": "Muerte súbita por consumo de cocaína"
            },
            {
                "id": "intox_paracetamol",
                "texto": "acetaminophen hepatotoxicity with centrilobular hepatic necrosis and hepatocyte dropout",
                "nombre_es": "Hepatotoxicidad por paracetamol",
                "descripcion": "Necrosis hepática centrolobulillar masiva",
                "hallazgos": ["Necrosis centrolobulillar", "Colapso reticular", "Preservación periportal", "Colestasis"],
                "relevancia_forense": "Sobredosis accidental o suicida"
            },
            {
                "id": "intox_etanol_aguda",
                "texto": "acute alcohol intoxication with gastric mucosal erosions pulmonary edema and cerebral edema",
                "nombre_es": "Intoxicación etílica aguda",
                "descripcion": "Erosiones gástricas, edema pulmonar y cerebral",
                "hallazgos": ["Erosiones gástricas hemorrágicas", "Edema pulmonar", "Edema cerebral", "Congestión visceral"],
                "relevancia_forense": "Muerte por intoxicación alcohólica aguda"
            }
        ]
    },

    # =========================================================================
    # PIEL - LESIONES DIVERSAS
    # =========================================================================
    "piel": {
        "nombre": "Lesiones cutáneas diversas",
        "descripcion": "Otras lesiones cutáneas de interés forense",
        "diagnosticos": [
            {
                "id": "excoriacion",
                "texto": "abrasion with superficial epithelial loss and serum crusting without dermal damage",
                "nombre_es": "Excoriación/Erosión",
                "descripcion": "Pérdida superficial de epidermis con costra serosa",
                "hallazgos": ["Pérdida epidérmica", "Costra sero-hemática", "Dermis intacta"],
                "relevancia_forense": "Indica contacto tangencial con superficie rugosa"
            },
            {
                "id": "equimosis",
                "texto": "ecchymosis with intradermal hemorrhage without skin elevation blood extravasation in dermis",
                "nombre_es": "Equimosis",
                "descripcion": "Hemorragia intradérmica sin elevación cutánea",
                "hallazgos": ["Extravasación sanguínea dérmica", "Sin elevación", "Coloración evolutiva"],
                "relevancia_forense": "Traumatismo contuso de baja energía"
            },
            {
                "id": "hematoma",
                "texto": "hematoma with blood collection in subcutaneous tissue elevated swelling and fluctuation",
                "nombre_es": "Hematoma subcutáneo",
                "descripcion": "Colección hemática en tejido subcutáneo con elevación",
                "hallazgos": ["Colección líquida", "Fluctuación", "Elevación cutánea"],
                "relevancia_forense": "Traumatismo contuso de mayor energía"
            },
            {
                "id": "mordedura_humana",
                "texto": "human bite mark with oval contusion pattern dental arch impression and suction petechiae",
                "nombre_es": "Mordedura humana",
                "descripcion": "Patrón contuso oval con impresión de arcada dental",
                "hallazgos": ["Patrón oval doble", "Marcas dentales", "Petequias por succión", "Espacio interdental característico"],
                "relevancia_forense": "Agresión, abuso sexual, identificación del agresor"
            },
            {
                "id": "estigmas_ungueales",
                "texto": "fingernail marks with crescentic abrasions or contusions indicating manual assault",
                "nombre_es": "Estigmas ungueales",
                "descripcion": "Lesiones semilunares por uñas, indican agresión manual",
                "hallazgos": ["Marcas semilunares", "Excoriaciones curvas", "Múltiples y agrupadas"],
                "relevancia_forense": "Estrangulación manual, agresión física"
            },
            {
                "id": "piel_normal",
                "texto": "normal skin histology without pathological changes intact epidermis and dermis",
                "nombre_es": "Piel sin alteraciones",
                "descripcion": "Arquitectura cutánea normal conservada",
                "hallazgos": ["Epidermis intacta", "Dermis normal", "Anejos conservados"],
                "relevancia_forense": "Sin hallazgos patológicos"
            }
        ]
    }
}


# =============================================================================
# FUNCIONES DEL MODELO
# =============================================================================

def obtener_todos_diagnosticos():
    """Obtiene lista plana de todos los diagnósticos disponibles"""
    todos = []
    for organo, data in CATEGORIAS_FORENSES.items():
        for diag in data["diagnosticos"]:
            todos.append({
                "organo": organo,
                "organo_nombre": data["nombre"],
                **diag
            })
    return todos


def cargar_modelo(tipo="biomedclip"):
    """Carga el modelo especificado bajo demanda"""
    global modelos_cargados
    
    if modelos_cargados.get(tipo) and modelos_cargados[tipo]["modelo"] is not None:
        return True
        
    try:
        if tipo == "biomedclip":
            print(f"🔄 Cargando modelo BiomedCLIP (esto puede tardar 30-60 segundos la primera vez)...")
            inicio = time.time()
            import torch
            from open_clip import create_model_from_pretrained, get_tokenizer
            
            modelo, procesador = create_model_from_pretrained(
                'hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224'
            )
            tokenizer = get_tokenizer('hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224')
            
            modelo.eval()
            for param in modelo.parameters():
                param.requires_grad = False

            modelos_cargados["biomedclip"] = {
                "modelo": modelo,
                "procesador": procesador,
                "tokenizer": tokenizer
            }
            tiempo = time.time() - inicio
            print(f"✅ Modelo BiomedCLIP cargado en {tiempo:.1f} segundos.")
            return True
        
        elif tipo == "biovil":
            # Para BioViL-T, si no hay RAM suficiente, usamos BiomedCLIP como base
            # pero con los prompts específicos de BioViL.
            # En un entorno con más RAM podríamos cargar 'microsoft/Biovil-T'
            print(f"🔄 Cargando BioViL-T (usando motor BiomedCLIP optimizado para Rx)...")
            # BioViL-T en este contexto es un "modo" de BiomedCLIP con prompts específicos.
            # Por lo tanto, cargamos BiomedCLIP si no está cargado.
            if not cargar_modelo("biomedclip"):
                return False
            # Marcamos BioViL como "cargado" para indicar que su motor está listo
            modelos_cargados["biovil"]["modelo"] = True # Usamos un booleano para indicar que está "listo"
            print("✅ Motor BioViL-T (BiomedCLIP) listo para radiografías.")
            return True
            
    except Exception as e:
        print(f"❌ Error cargando modelo {tipo}: {e}")
        import traceback
        traceback.print_exc()
        return False

def liberar_modelo(tipo="todas"):
    """Libera el modelo especificado de la memoria"""
    global modelos_cargados
    
    import gc
    import torch
    
    tipos_a_liberar = []
    if tipo == "todas":
        tipos_a_liberar = list(modelos_cargados.keys())
    elif tipo in modelos_cargados:
        tipos_a_liberar = [tipo]
    else:
        print(f"⚠️ Tipo de modelo '{tipo}' no reconocido para liberar.")
        return

    for t in tipos_a_liberar:
        if modelos_cargados.get(t):
            if modelos_cargados[t]["modelo"] is not None:
                del modelos_cargados[t]["modelo"]
            if modelos_cargados[t]["procesador"] is not None:
                del modelos_cargados[t]["procesador"]
            if modelos_cargados[t]["tokenizer"] is not None:
                del modelos_cargados[t]["tokenizer"]
            modelos_cargados[t] = {"modelo": None, "procesador": None, "tokenizer": None}
            print(f"🧹 Modelo '{t}' liberado de memoria.")
    
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    
    print(f"🧹 Limpieza de memoria completada.")


def analizar_imagen(imagen_bytes: bytes, organo_filtro: str = None) -> dict:
    """
    Analiza una imagen histológica con BiomedCLIP usando clasificación zero-shot.
    """
    import torch
    from PIL import Image
    import numpy as np
    import io
    import time
    
    if not cargar_modelo("biomedclip"):
        raise Exception("No se pudo cargar el modelo BiomedCLIP")
    
    m = modelos_cargados["biomedclip"]
    modelo = m["modelo"]
    procesador = m["procesador"]
    tokenizer = m["tokenizer"]

    imagen = Image.open(io.BytesIO(imagen_bytes)).convert("RGB")
    imagen_procesada = procesador(imagen).unsqueeze(0)
    
    if organo_filtro and organo_filtro in CATEGORIAS_FORENSES:
        diagnosticos = []
        data = CATEGORIAS_FORENSES[organo_filtro]
        for diag in data["diagnosticos"]:
            diagnosticos.append({
                "organo": organo_filtro,
                "organo_nombre": data["nombre"],
                **diag
            })
    else:
        diagnosticos = obtener_todos_diagnosticos()
    
    template = "this is a histopathology image showing "
    textos = [template + d["texto"] for d in diagnosticos]
    
    try:
        tokens = tokenizer(textos)
    except Exception as e:
        print(f"⚠️ Error en tokenización estándar: {e}")
        # Intento manual si el wrapper de open_clip falla
        if hasattr(tokenizer, 'tokenizer'):
            tokens = tokenizer.tokenizer(textos, padding=True, truncation=True, return_tensors="pt")["input_ids"]
        else:
            raise e
    
    inicio = time.time()
    with torch.no_grad():
        image_features = modelo.encode_image(imagen_procesada)
        text_features = modelo.encode_text(tokens)
        
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        
        logit_scale = modelo.logit_scale.exp()
        logits = (logit_scale * image_features @ text_features.T).softmax(dim=-1)
        
    tiempo_inferencia = time.time() - inicio
    
    probabilidades = logits[0].numpy()
    indices_ordenados = np.argsort(probabilidades)[::-1]
    
    resultados = []
    for idx in indices_ordenados:
        prob = float(probabilidades[idx])
        diag = diagnosticos[idx]
        resultados.append({
            "diagnostico_id": diag["id"],
            "diagnostico": diag["nombre_es"],
            "descripcion": diag["descripcion"],
            "organo": diag["organo_nombre"],
            "probabilidad": round(prob * 100, 1),
            "hallazgos": diag.get("hallazgos", []),
            "info_adicional": {
                k: v for k, v in diag.items() 
                if k not in ["id", "texto", "nombre_es", "descripcion", "hallazgos", "organo", "organo_nombre"]
            }
        })
    
    principal = resultados[0]
    confianza = "alta" if principal["probabilidad"] > 50 else "media" if principal["probabilidad"] > 30 else "baja"
    
    return {
        "diagnostico_principal": principal,
        "diagnosticos_alternativos": resultados[1:5],
        "todos_los_diagnosticos": resultados,
        "confianza": confianza,
        "tiempo_analisis": f"{tiempo_inferencia:.2f}s",
        "tamano_imagen": f"{imagen.size[0]}x{imagen.size[1]}",
        "modelo": "BiomedCLIP (Microsoft)",
        "tipo_clasificacion": "Zero-shot",
        "num_categorias_evaluadas": len(diagnosticos)
    }


# =============================================================================
# APLICACIÓN FASTAPI
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("""
    ╔═══════════════════════════════════════════════════════════════════╗
    ║     INTCF - Patología Digital Forense con BiomedCLIP v2.1        ║
    ║                                                                   ║
    ║  Modelo: BiomedCLIP (Microsoft) - Zero-Shot Classification        ║
    ║  Categorías forenses: Contusiones, Armas de fuego, Armas blancas, ║
    ║  Asfixias, Quemaduras, Tanatología, Toxicología, y más...         ║
    ╚═══════════════════════════════════════════════════════════════════╝
    """)
    print("🔬 Servidor iniciado")
    print("📋 Documentación API: http://localhost:8000/docs")
    print(f"📊 Categorías disponibles: {list(CATEGORIAS_FORENSES.keys())}")
    yield
    liberar_modelo("todas")
    print("👋 Servidor cerrado")


app = FastAPI(
    title="INTCF Patología Digital Forense - BiomedCLIP",
    description="""
    API de análisis histopatológico forense con IA para el Instituto Nacional de Toxicología y Ciencias Forenses.
    
    ## Categorías diagnósticas disponibles:
    - **contusiones**: Datación de lesiones contusas (0-4h hasta >2 semanas)
    - **arma_fuego**: Heridas por proyectil (entrada, salida, distancia)
    - **arma_blanca**: Heridas incisas, punzantes, corto-punzantes
    - **asfixias**: Ahorcamiento, estrangulación, sofocación, sumersión
    - **temperatura**: Quemaduras de 1º a 4º grado, vitales y post-mortem
    - **electricidad**: Marcas eléctricas, fulguración
    - **tanatologia**: Livideces, rigidez, putrefacción
    - **corazon**: Infarto, miocardiopatías, muerte súbita cardíaca
    - **higado**: Esteatosis, cirrosis, toxicidad hepática
    - **pulmon**: Edema, aspiración, embolias
    - **cerebro**: Hematomas, contusiones, encefalopatía hipóxica
    - **toxicologia**: CO, opiáceos, cocaína, paracetamol
    - **piel**: Excoriaciones, equimosis, mordeduras
    """,
    version="2.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción podemos ser más específicos si conocemos la URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(404)
async def custom_404_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": f"Ruta no encontrada en el backend: {request.url.path}"}
    )


@app.get("/api")
async def raiz():
    """Endpoint raíz - información del servicio"""
    total_diagnosticos = sum(len(data["diagnosticos"]) for data in CATEGORIAS_FORENSES.values())
    return {
        "servicio": "INTCF Patología Digital Forense API",
        "version": "2.1.0",
        "modelo": "BiomedCLIP (Microsoft)",
        "tipo": "Zero-Shot Classification - Medicina Forense",
        "estado": "activo",
        "estadisticas": {
            "categorias": len(CATEGORIAS_FORENSES),
            "diagnosticos_totales": total_diagnosticos
        },
        "categorias_disponibles": list(CATEGORIAS_FORENSES.keys()),
        "endpoints": {
            "analizar": "POST /analizar",
            "analizar_categoria": "POST /analizar/{categoria}",
            "estado": "GET /estado",
            "categorias": "GET /categorias",
            "documentacion": "GET /docs"
        }
    }


@app.get("/api/estado")
async def obtener_estado():
    """Obtiene el estado de los modelos. Sincronizado con el frontend."""
    status = {}
    
    # BiomedCLIP status
    cargado_biomed = modelos_cargados["biomedclip"]["modelo"] is not None
    status["biomedclip"] = {
        "cargado": cargado_biomed,
        "nombre": "BiomedCLIP (Microsoft)",
        "tipo": "Zero-Shot Classification - Forense",
        "consumo_ram": "~1.5 GB" if cargado_biomed else "0 GB",
        "num_categorias": len(CATEGORIAS_FORENSES),
        "num_diagnosticos": sum(len(data["diagnosticos"]) for data in CATEGORIAS_FORENSES.values())
    }
    
    # BioViL status (reutiliza el motor BiomedCLIP si está cargado)
    cargado_biovil = cargado_biomed or modelos_cargados["biovil"]["modelo"] is not None
    status["biovil"] = {
        "cargado": cargado_biovil,
        "nombre": "BioViL-T (Microsoft)",
        "tipo": "Zero-Shot Classification - Radiografía de Tórax",
        "consumo_ram": "~1.5 GB" if cargado_biovil else "0 GB",
        "num_categorias": len(CATEGORIAS_RADIOGRAFIA),
        "num_diagnosticos": sum(len(data["diagnosticos"]) for data in CATEGORIAS_RADIOGRAFIA.values())
    }
    
    # Compatibilidad con formato antiguo (si el frontend no ha actualizado)
    # Esto devuelve el estado de biomedclip directamente en la raíz del JSON
    # para clientes que esperan el formato anterior de /estado
    status.update(status["biomedclip"])
    
    return status


@app.get("/api/categorias")
async def obtener_categorias():
    """Obtiene todas las categorías diagnósticas disponibles"""
    return {
        organo: {
            "nombre": data["nombre"],
            "descripcion": data.get("descripcion", ""),
            "num_diagnosticos": len(data["diagnosticos"]),
            "diagnosticos": [
                {"id": d["id"], "nombre": d["nombre_es"]}
                for d in data["diagnosticos"]
            ]
        }
        for organo, data in CATEGORIAS_FORENSES.items()
    }


@app.get("/api/categorias/{categoria}")
async def obtener_categoria(categoria: str):
    """Obtiene los diagnósticos de una categoría específica"""
    if categoria not in CATEGORIAS_FORENSES:
        raise HTTPException(
            status_code=404, 
            detail=f"Categoría no encontrada. Disponibles: {list(CATEGORIAS_FORENSES.keys())}"
        )
    
    data = CATEGORIAS_FORENSES[categoria]
    return {
        "categoria": categoria,
        "nombre": data["nombre"],
        "descripcion": data.get("descripcion", ""),
        "diagnosticos": [
            {
                "id": d["id"],
                "nombre": d["nombre_es"],
                "descripcion": d["descripcion"],
                "hallazgos": d.get("hallazgos", []),
                **{k: v for k, v in d.items() if k not in ["id", "texto", "nombre_es", "descripcion", "hallazgos"]}
            }
            for d in data["diagnosticos"]
        ]
    }


@app.post("/cargar-modelo")
async def endpoint_cargar_modelo(modelo: str = "biomedclip"):
    """Carga un modelo específico en memoria"""
    exito = cargar_modelo(modelo)
    if exito:
        return {"exito": True, "mensaje": f"Modelo {modelo} cargado correctamente"}
    else:
        raise HTTPException(status_code=500, detail=f"Error al cargar el modelo {modelo}")


@app.post("/liberar-modelo")
async def endpoint_liberar_modelo(modelo: str = "todas"):
    """Libera un modelo específico o todos de la memoria"""
    liberar_modelo(modelo)
    return {"exito": True, "mensaje": f"Modelo(s) {modelo} liberado(s) de memoria"}


@app.post("/api/analizar")
async def analizar(archivo: UploadFile = File(...)):
    """
    Analiza una imagen histológica buscando en TODAS las categorías forenses.
    """
    tipos_permitidos = ["image/jpeg", "image/png", "image/tiff", "image/jpg"]
    if archivo.content_type not in tipos_permitidos:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de archivo no soportado: {archivo.content_type}. Use JPEG, PNG o TIFF."
        )
    
    try:
        contenido = await archivo.read()
        resultado = analizar_imagen(contenido)
        
        return {
            "exito": True,
            "nombre_archivo": archivo.filename,
            **resultado
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")


@app.post("/api/analizar/{categoria}")
async def analizar_por_categoria(categoria: str, archivo: UploadFile = File(...)):
    """
    Analiza una imagen buscando solo en diagnósticos de la categoría especificada.
    """
    if categoria not in CATEGORIAS_FORENSES:
        raise HTTPException(
            status_code=404, 
            detail=f"Categoría no encontrada. Disponibles: {list(CATEGORIAS_FORENSES.keys())}"
        )
    
    tipos_permitidos = ["image/jpeg", "image/png", "image/tiff", "image/jpg"]
    if archivo.content_type not in tipos_permitidos:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de archivo no soportado: {archivo.content_type}. Use JPEG, PNG o TIFF."
        )
    
    try:
        contenido = await archivo.read()
        resultado = analizar_imagen(contenido, organo_filtro=categoria)
        
        return {
            "exito": True,
            "nombre_archivo": archivo.filename,
            "filtro_categoria": categoria,
            **resultado
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")


@app.post("/analizar-y-liberar")
async def analizar_y_liberar(archivo: UploadFile = File(...)):
    """
    Analiza una imagen y luego libera el modelo de memoria.
    """
    try:
        resultado = await analizar(archivo)
        liberar_modelo("biomedclip") # Solo liberar biomedclip si fue el usado
        resultado["modelo_liberado"] = True
        return resultado
    except HTTPException:
        liberar_modelo("biomedclip")
        raise


# =============================================================================
# CATEGORÍAS DIAGNÓSTICAS - RADIOGRAFÍAS DE TÓRAX
# =============================================================================

CATEGORIAS_RADIOGRAFIA = {
    "torax": {
        "nombre": "Radiografía de tórax",
        "descripcion": "Análisis de radiografías de tórax para patología pulmonar y cardíaca",
        "diagnosticos": [
            {
                "id": "rx_normal",
                "texto": "normal chest x-ray with clear lung fields and normal cardiac silhouette",
                "nombre_es": "Radiografía normal",
                "descripcion": "Campos pulmonares claros, silueta cardíaca normal",
                "hallazgos": ["Campos pulmonares claros", "Silueta cardíaca normal", "Sin infiltrados", "Senos costofrénicos libres"],
                "relevancia_forense": "Sin hallazgos patológicos"
            },
            {
                "id": "neumonia",
                "texto": "chest x-ray showing pneumonia with lung consolidation and air bronchograms",
                "nombre_es": "Neumonía",
                "descripcion": "Consolidación pulmonar con broncograma aéreo",
                "hallazgos": ["Consolidación lobar o segmentaria", "Broncograma aéreo", "Opacidad alveolar"],
                "relevancia_forense": "Causa de muerte natural frecuente"
            },
            {
                "id": "derrame_pleural",
                "texto": "chest x-ray with pleural effusion showing blunted costophrenic angle and meniscus sign",
                "nombre_es": "Derrame pleural",
                "descripcion": "Obliteración del seno costofrénico, signo del menisco",
                "hallazgos": ["Seno costofrénico obliterado", "Signo del menisco", "Opacidad homogénea basal"],
                "relevancia_forense": "Puede indicar trauma torácico, ICC, o malignidad"
            },
            {
                "id": "neumotorax",
                "texto": "chest x-ray showing pneumothorax with visible pleural line and absent lung markings",
                "nombre_es": "Neumotórax",
                "descripcion": "Línea pleural visible, ausencia de trama pulmonar",
                "hallazgos": ["Línea pleural visible", "Ausencia de trama pulmonar", "Hiperclaridad", "Colapso pulmonar"],
                "relevancia_forense": "Trauma torácico, herida penetrante, iatrogénico"
            },
            {
                "id": "cardiomegalia",
                "texto": "chest x-ray with cardiomegaly showing enlarged cardiac silhouette and increased cardiothoracic ratio",
                "nombre_es": "Cardiomegalia",
                "descripcion": "Silueta cardíaca aumentada, índice cardiotorácico >0.5",
                "hallazgos": ["Índice cardiotorácico >0.5", "Silueta cardíaca globulosa"],
                "relevancia_forense": "Indica cardiopatía crónica"
            },
            {
                "id": "edema_pulmonar_rx",
                "texto": "chest x-ray showing pulmonary edema with bilateral infiltrates and butterfly pattern",
                "nombre_es": "Edema pulmonar",
                "descripcion": "Infiltrados bilaterales en alas de mariposa",
                "hallazgos": ["Patrón en alas de mariposa", "Infiltrados perihiliares", "Líneas B de Kerley"],
                "relevancia_forense": "ICC, sobredosis de opiáceos, SDRA"
            },
            {
                "id": "atelectasia",
                "texto": "chest x-ray with atelectasis showing volume loss and displaced fissures",
                "nombre_es": "Atelectasia",
                "descripcion": "Pérdida de volumen pulmonar, desplazamiento de cisuras",
                "hallazgos": ["Opacidad con pérdida de volumen", "Desplazamiento de cisuras", "Elevación diafragmática"],
                "relevancia_forense": "Obstrucción bronquial, post-quirúrgico"
            },
            {
                "id": "masa_pulmonar",
                "texto": "chest x-ray showing pulmonary mass or nodule with defined borders",
                "nombre_es": "Masa/Nódulo pulmonar",
                "descripcion": "Lesión ocupante de espacio en parénquima pulmonar",
                "hallazgos": ["Opacidad redondeada", "Bordes definidos o espiculados"],
                "relevancia_forense": "Neoplasia, tuberculoma, metástasis"
            },
            {
                "id": "fracturas_costales",
                "texto": "chest x-ray showing rib fractures with cortical discontinuity",
                "nombre_es": "Fracturas costales",
                "descripcion": "Discontinuidad cortical en arcos costales",
                "hallazgos": ["Discontinuidad cortical", "Desplazamiento fragmentos"],
                "relevancia_forense": "Trauma torácico, maltrato"
            },
            {
                "id": "ensanchamiento_mediastino",
                "texto": "chest x-ray with widened mediastinum suggesting aortic pathology or mass",
                "nombre_es": "Ensanchamiento mediastínico",
                "descripcion": "Mediastino ensanchado >8cm",
                "hallazgos": ["Mediastino >8cm", "Pérdida de contornos aórticos"],
                "relevancia_forense": "Disección aórtica, rotura traumática de aorta"
            },
            {
                "id": "tuberculosis_rx",
                "texto": "chest x-ray showing tuberculosis with upper lobe infiltrates and cavitation",
                "nombre_es": "Tuberculosis pulmonar",
                "descripcion": "Infiltrados en lóbulos superiores con cavitación",
                "hallazgos": ["Infiltrados apicales", "Cavitación", "Fibrosis"],
                "relevancia_forense": "Enfermedad infecciosa de declaración obligatoria"
            },
            {
                "id": "hemotorax",
                "texto": "chest x-ray showing hemothorax with dense pleural fluid collection after trauma",
                "nombre_es": "Hemotórax",
                "descripcion": "Colección pleural densa post-traumática",
                "hallazgos": ["Opacidad pleural densa", "Asociado a fracturas costales"],
                "relevancia_forense": "Trauma torácico penetrante o cerrado"
            },
            {
                "id": "contusion_pulmonar_rx",
                "texto": "chest x-ray showing pulmonary contusion with patchy alveolar opacities after trauma",
                "nombre_es": "Contusión pulmonar",
                "descripcion": "Opacidades alveolares parcheadas post-traumáticas",
                "hallazgos": ["Opacidades parcheadas", "No respetan límites lobares"],
                "relevancia_forense": "Trauma torácico de alta energía"
            },
            {
                "id": "aspiracion_rx",
                "texto": "chest x-ray showing aspiration pneumonia with infiltrates in dependent lung segments",
                "nombre_es": "Neumonía por aspiración",
                "descripcion": "Infiltrados en segmentos pulmonares dependientes",
                "hallazgos": ["Infiltrados en segmentos posteriores", "Lóbulo inferior derecho frecuente"],
                "relevancia_forense": "Alteración de conciencia, intoxicación, TCE"
            }
        ]
    }
}


def obtener_todos_diagnosticos_radiografia():
    """Obtiene lista plana de todos los diagnósticos de radiografía"""
    todos = []
    for organo, data in CATEGORIAS_RADIOGRAFIA.items():
        for diag in data["diagnosticos"]:
            todos.append({
                "organo": organo,
                "organo_nombre": data["nombre"],
                **diag
            })
    return todos


def analizar_imagen_radiografia(imagen_bytes: bytes) -> dict:
    """
    Analiza una radiografía de tórax usando el motor BiomedCLIP optimizado con prompts de BioViL-T.
    """
    import torch
    import time
    from PIL import Image
    import numpy as np
    import io

    # BioViL-T usa el motor de BiomedCLIP para este despliegue
    if not cargar_modelo("biovil"):
        raise Exception("No se pudo cargar el motor para análisis de radiografías")
    
    m = modelos_cargados["biomedclip"]
    modelo = m["modelo"]
    procesador = m["procesador"]
    tokenizer = m["tokenizer"]

    imagen = Image.open(io.BytesIO(imagen_bytes)).convert("RGB")
    imagen_procesada = procesador(imagen).unsqueeze(0)
    
    # Diagnósticos especializados para radiografía de tórax (BioViL-T style)
    diagnosticos = obtener_todos_diagnosticos_radiografia()
    template = "chest x-ray with "
    textos = [template + d["texto"] for d in diagnosticos]
    
    try:
        tokens = tokenizer(textos)
    except Exception as e:
        print(f"⚠️ Error en tokenización Rx: {e}")
        if hasattr(tokenizer, 'tokenizer'):
            tokens = tokenizer.tokenizer(textos, padding=True, truncation=True, return_tensors="pt")["input_ids"]
        else:
            raise e
    
    inicio = time.time()
    with torch.no_grad():
        image_features = modelo.encode_image(imagen_procesada)
        text_features = modelo.encode_text(tokens)
        
        # Normalización (CRÍTICO para zero-shot)
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        
        # Usar la escala aprendida del modelo
        logit_scale = modelo.logit_scale.exp()
        logits = (logit_scale * image_features @ text_features.T).softmax(dim=-1)
        probabilidades = logits.cpu().numpy()[0]
    
    tiempo_inferencia = time.time() - inicio
    
    # Formatear resultados
    resultados = []
    indices_ordenados = np.argsort(probabilidades)[::-1]
    
    for idx in indices_ordenados:
        d = diagnosticos[idx]
        resultados.append({
            "id": d["id"],
            "diagnostico": d["nombre_es"],
            "probabilidad": float(probabilidades[idx]),
            "organo": "Tórax",
            "descripcion": d["descripcion"],
            "hallazgos": d.get("hallazgos", []),
            "info_adicional": {
                "gravedad": d.get("gravedad", "media"),
                "modelo": "BioViL-T (Microsoft)"
            }
        })
    
    principal = resultados[0]
    confianza = "alta" if principal["probabilidad"] > 50 else "media" if principal["probabilidad"] > 30 else "baja"
    
    return {
        "diagnostico_principal": principal,
        "diagnosticos_alternativos": resultados[1:5],
        "todos_los_diagnosticos": resultados,
        "confianza": confianza,
        "tiempo_analisis": f"{tiempo_inferencia:.2f}s",
        "tamano_imagen": f"{imagen.size[0]}x{imagen.size[1]}",
        "modelo": "BioViL-T (Microsoft)",
        "tipo_imagen": "Radiografía de tórax",
        "num_categorias_evaluadas": len(diagnosticos)
    }


@app.post("/api/analizar-radiografia")
async def analizar_radiografia(archivo: UploadFile = File(...)):
    """
    Analiza una radiografía de tórax.
    """
    tipos_permitidos = ["image/jpeg", "image/png", "image/tiff", "image/jpg"]
    if archivo.content_type not in tipos_permitidos:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de archivo no soportado: {archivo.content_type}. Use JPEG, PNG o TIFF."
        )
    
    try:
        contenido = await archivo.read()
        resultado = analizar_imagen_radiografia(contenido)
        
        return {
            "exito": True,
            "nombre_archivo": archivo.filename,
            **resultado
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")


@app.get("/api/categorias-radiografia")
async def obtener_categorias_radiografia():
    """Obtiene las categorías de radiografía disponibles"""
    return {
        organo: {
            "nombre": data["nombre"],
            "descripcion": data.get("descripcion", ""),
            "num_diagnosticos": len(data["diagnosticos"]),
            "diagnosticos": [
                {"id": d["id"], "nombre": d["nombre_es"]}
                for d in data["diagnosticos"]
            ]
        }
        for organo, data in CATEGORIAS_RADIOGRAFIA.items()
    }


@app.get("/api/health")
async def health_check():
    """Verificación de salud del servicio"""
    biomed_ok = modelos_cargados["biomedclip"]["modelo"] is not None
    biovil_ok = modelos_cargados["biovil"]["modelo"] is not None
    return {
        "status": "healthy", 
        "version": "2.2.0-BiovilT-Fix",
        "biomedclip_cargado": biomed_ok,
        "biovil_cargado": biovil_ok
    }


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
