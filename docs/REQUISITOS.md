# Requisitos del Proyecto — Reto Estrella Damm (UAB THE HACK! 2026)

> **Reto:** *¿Cómo podemos medir el clima laboral de manera ágil, continua e inteligente con IA?*  
> **Lema:** *Escoltar millor, actuar abans* (Escuchar mejor, actuar antes)  
> **Áreas impulsoras:** People (Sostenibilidad & ESG y Desarrollo de Personas) + Equipo de Data & IA de Damm.

---

## 1. Contexto y Problemática a Resolver

Damm cuenta con una plantilla con realidades operativas muy diversas: **fábricas** (producción y envasado, turnos, poco tiempo frente a pantalla), **logística** (almacenes y distribución, siempre en movimiento), **equipos comerciales** (en la calle con clientes, uso intensivo del móvil) y **oficinas/dirección** (equipos corporativos y managers).

Actualmente, la escucha se apoya en encuestas periódicas tradicionales que presentan **tres grandes limitaciones**:

| Limitación | Situación Actual | Objetivo de la Solución |
| :--- | :--- | :--- |
| **1. Participación poco representativa** | Responde solo una parte de la plantilla (casi siempre las mismas personas). Fábrica, logística y producción participan menos por falta de tiempo, acceso o interés. | Obtener feedback representativo de todos los colectivos sin saturar a nadie. |
| **2. Una encuesta única para todos** | Un cuestionario estandarizado no refleja la realidad de un operario, un comercial, personal de oficina o un manager al mismo tiempo. | Generar microconsultas relevantes y adaptadas a cada colectivo (tono, canal, longitud) sin diseñar decenas de encuestas a mano. |
| **3. Mucho feedback, poca capacidad de análisis** | Cientos o miles de comentarios abiertos se analizan manualmente; cuando se detecta un problema, suele ser tarde. | Convertir automáticamente las respuestas y comentarios en *insights* accionables para decidir y actuar antes. |

### Dimensiones del Clima Laboral en Damm
La plataforma debe permitir explorar y ordenar la escucha alrededor de las 6 dimensiones clave de Damm:
1. **Bienestar:** Cómo se vive la experiencia profesional, salud, vida activa y conciliación/flexibilidad.
2. **Liderazgo:** Cómo se perciben el acompañamiento, la comunicación y el feedback.
3. **Desarrollo:** Percepción de oportunidades para aprender, formarse y crecer.
4. **Cultura y pertenencia:** Identificación con Damm, sus valores, igualdad, equidad y diversidad.
5. **Entorno y relaciones:** Cómo se viven la colaboración, la seguridad y el ambiente de trabajo.
6. **Condiciones y organización:** Disponibilidad de recursos, herramientas, turnos y condiciones para trabajar adecuadamente.

---

## 2. Perfiles de Usuario (Stakeholders)

- **Usuario Principal (People / RRHH):** Profesional de RRHH que necesita comprender una situación concreta (ej. impacto de un cambio de turnos o nueva herramienta), diseñar la consulta en lenguaje natural, validar la propuesta de la IA, monitorizar la representatividad y recibir propuestas de acción.
- **Usuario Encuestado (Persona trabajadora de Damm):** Empleados de fábrica, logística, comercial, oficina o managers. Suelen disponer de poco tiempo (< 2 minutos) y acceden mayoritariamente desde el teléfono móvil o mediante código QR en planta.
- **Usuario Secundario (Responsables de equipo / Dirección):** Reciben resultados siempre agregados, indicadores de evolución y recomendaciones accionables para su área.

---

## 3. Requisitos Funcionales (Ciclo Continuo de 8 Pasos)

La solución no debe ser tres proyectos separados (participación, personalización y análisis), sino **un único flujo continuo de principio a fin**:

```
NECESIDAD → CONSULTA ADAPTADA → VALIDACIÓN → PUBLICACIÓN → PARTICIPACIÓN → ANÁLISIS → VISUALIZACIÓN → ACCIÓN Y NUEVA CONSULTA
```

### RF-01: Definición de la Necesidad (Input en Lenguaje Natural)
- Permitir a RRHH describir la necesidad en lenguaje natural o mediante parámetros guiados:
  - **Objetivo** de la consulta.
  - **Colectivo destinatario** (`Planta`, `Logística`, `Comercial`, `Oficina`, `Manager`).
  - **Contexto** (ej. cambio organizativo, nuevo turno, seguimiento trimestral).
  - **Duración máxima** (ej. < 2 minutos).
  - **Restricciones / Qué NO preguntar** (temas excluidos o sensibles).

### RF-02: Generación Inteligente de la Microconsulta con IA
- A partir de la necesidad de RRHH, el motor de IA debe generar un borrador estructurado que incluya:
  - **Título e introducción transparente** (explicando para qué sirve la consulta y garantizando el anonimato).
  - **Entre 3 y 6 preguntas** breves y directas.
  - **Tipos de respuesta adecuados** (escalas 1–5 o 0–10, opción múltiple, texto libre opcional).
  - **Lógica condicional** (preguntas de seguimiento dinámicas según la puntuación).
  - **Tiempo estimado de respuesta** y adaptación de **tono, longitud y canal** según el colectivo (ej. lenguaje directo y móvil/QR para planta).

### RF-03: Validación Humana Obligatoria (*Human-in-the-Loop*)
- Interfaz de revisión donde RRHH pueda **editar textos, añadir, eliminar o reordenar preguntas** antes de su lanzamiento.
- **Regla estricta:** La IA nunca publica una encuesta ni ejecuta acciones sin la aprobación explícita de una persona de RRHH.

### RF-04: Publicación Automatizada en Typeform
- Integración vía **API de Typeform** (o conexión con formularios Typeform existentes) para crear/publicar automáticamente la microconsulta aprobada.
- Generación inmediata del **enlace web y código QR descargable/imprimible** para facilitar su difusión en planta, almacenes o canales digitales.

### RF-05: Estrategia de Participación y Control de Representatividad
- Adaptación multicanal (`Mòbil-QR`, `Correu`, `Teams`) pensando especialmente en trabajadores sin ordenador.
- Control de fatiga de encuesta (frecuencia, recordatorios no invasivos).
- **Detector de representatividad y sesgos de cobertura/no respuesta:** Alertar proactivamente si un colectivo, turno o centro está infrarrepresentado en la muestra actual (ej. *"Aviso: baja participación en el turno de noche de Planta"*).

### RF-06: Recolección y Análisis Inteligente de Datos y Texto Abierto
- Ingesta automática de respuestas vía API/Webhooks desde Typeform y datasets sintéticos.
- Procesamiento con IA de comentarios en texto libre (incluyendo textos con ruido, faltas ortográficas, ironía o múltiples idiomas como catalán y castellano):
  - **Clustering temático:** Agrupación automática por temas (`Comunicación`, `Turnos`, `Liderazgo`, `Herramientas`, `Bienestar`, etc.).
  - **Resumen ejecutivo** de fortalezas y puntos de dolor.
  - **Detección de tendencias y señales débiles (*weak signals*):** Identificación de temas emergentes comparando con períodos anteriores.
  - **Comparativa entre colectivos o períodos** manteniendo el umbral de anonimato.

### RF-07: Visualización en Dashboard (People Analytics)
- Panel de control claro e intuitivo que muestre:
  - **Métricas de participación y tamaño de muestra ($N$)** frente al total esperado.
  - **Indicador de representatividad** por colectivo y canal.
  - **Distribución de puntuaciones de escala** y **evolución temporal** entre períodos.
  - **Temas principales y emergentes** extraídos de los comentarios abiertos.
  - **Alertas tempranas** (caídas de clima, sesgos de muestra, señales débiles) y nivel de confianza/límites del análisis.

### RF-08: Recomendación de Acciones y Cierre del Ciclo
- Generación mediante IA de **recomendaciones concretas y accionables** vinculadas a los hallazgos (con área responsable sugerida y plan de actuación, evitando quedarse solo en el diagnóstico).
- Propuesta automática de una **nueva microconsulta de seguimiento** para medir el impacto de las acciones tomadas semanas después.
- **Validación humana de acciones:** Las recomendaciones son propuestas para RRHH/managers, nunca decisiones automáticas.

---

## 4. Escenarios de Demostración Requeridos

La solución debe ser capaz de demostrar su funcionamiento en los tres escenarios planteados por Damm:

1. **Escenario A · Cambio Organizativo:** Un equipo ha cambiado recientemente su forma de trabajar (nuevo sistema de turnos o nueva herramienta). RRHH solicita una consulta de < 2 minutos para evaluar si se ha entendido el cambio, qué dificultades genera y qué reforzar.
2. **Escenario B · Colectivo de Planta o Logística:** Personas con poco tiempo, sin ordenador corporativo y con acceso limitado al correo. Requiere experiencia móvil vía QR ultrarrápida y alerta automática si la muestra no es representativa (ej. sesgo por turno).
3. **Escenario C · Gran Volumen de Comentarios:** Procesamiento de entre **300 y 1.000 respuestas sintéticas** (con ~500 comentarios abiertos) repartidas en al menos dos períodos y varios colectivos con participación desigual. Debe agrupar, resumir, detectar temas emergentes respecto al período anterior, proponer áreas de actuación y explicar los límites del análisis.

---

## 5. Requisitos de Datos Sintéticos

- **Prohibición absoluta de datos reales:** Se trabajará exclusivamente con datos 100% sintéticos generados mediante LLMs o scripts (Python/Node.js + Faker), incluyendo sesgos intencionados para demostrar que el sistema los detecta.
- **Volumen recomendado:** Entre **300 y 1.000 respuestas**, divididas en al menos **2 períodos temporales** y múltiples colectivos.
- **Esquema de datos mínimo:**

| Campo | Ejemplo | Descripción / Regla |
| :--- | :--- | :--- |
| `id_resposta` | `r_00123` | Identificador aleatorio, jamás vinculado a una persona. |
| `data` | `2026-10-15` | Fecha para simular períodos y evolución de tendencias. |
| `col_lectiu` | `Planta` / `Logística` / `Comercial` / `Oficina` / `Manager` | Categorías amplias, nunca equipos pequeños identificables. |
| `centre_tipus` | `Fàbrica` / `Magatzem` / `Oficina` | Tipo de centro genérico (evitar centros concretos identificables). |
| `canal` | `Mòbil-QR` / `Correu` / `Teams` | Canal de entrada para analizar participación y cobertura. |
| `preguntes_escala` | `1–5` o `0–10` | Valoraciones numéricas (bienestar, carga, comunicación, reconocimiento...). |
| `comentari_obert` | Texto libre | Comentarios variados, realistas, en catalán/castellano, con ruido, faltas e PII simulado para probar la anonimización. |
| `tema_real` *(opcional)* | `Comunicació`, `Torns`... | Etiqueta oculta (*ground truth*) para validar la precisión del clasificador IA. |

---

## 6. Requisitos No Funcionales: Privacidad, Seguridad y Ética (No Negociables)

> [!CAUTION]
> **Criterios Excluyentes de Descalificación:**
> 1. Uso de datos personales reales o información interna real de Damm.
> 2. Mostrar resultados individuales identificables (falta de agregación).
> 3. Ausencia de control humano (*Human-in-the-Loop*) antes de publicar o actuar.
> 4. Exposición de tokens, API Keys o contraseñas en el código, repositorio o presentación.

### RNF-01: Anonimato y Umbral Mínimo de Agregación ($k$-Anonimato)
- **Resultados siempre agregados:** Prohibido mostrar respuestas individuales identificables en el dashboard.
- **Umbral mínimo de confidencialidad ($k \ge 5$ o $10$):** Si un filtro o segmento (por ejemplo, `Logística` + `Oficina`) tiene menos de $k$ respuestas (configurable entre 5 y 10), el sistema **bloquea automáticamente la visualización** de ese desglose para impedir la reidentificación indirecta.

### RNF-02: Sanitización y Eliminación Automática de PII (Anonimización en Origen)
- Antes de almacenar o mostrar cualquier comentario abierto o enviarlo a visualización, un pipeline automático debe **detectar y enmascarar datos identificativos (PII)**: nombres propios, correos electrónicos, números de teléfono, matrículas o cargos únicos (ej. reemplazándolos por `[NOMBRE_ANONIMIZADO]`, `[EMAIL]`, `[TELÉFONO]`).

### RNF-03: No Vigilancia, Transparencia y Explicabilidad
- **Cero perfilado individual:** El sistema no puede construir perfiles de empleados ni usarse para evaluar el desempeño individual.
- **Explicabilidad estadística:** Todo *insight* generado por IA debe ir acompañado del **tamaño de la muestra ($N$)**, el **índice de representatividad/confianza** y una advertencia clara sobre los **límites del análisis** (no presentar correlaciones como relaciones causales).
- **Minimización y caducidad:** Almacenar únicamente los campos necesarios durante el tiempo estrictamente requerido.

### RNF-04: Seguridad de Credenciales y Repositorio
- Gestión de claves (`TYPEFORM_TOKEN`, `GEMINI_API_KEY` / `OPENAI_API_KEY`, `N8N_API_KEY`) exclusivamente mediante variables de entorno (`.env` excluido en `.gitignore`).
- Inclusión obligatoria de plantilla `.env.example` sin secretos y documentación en `README.md`.

---

## 7. Criterios de Evaluación y Bonus Track

| Criterio de Evaluación | Peso | Cómo responde nuestra arquitectura |
| :--- | :---: | :--- |
| **Adecuación al problema y valor para las personas** | **20%** | Ciclo completo de los 8 pasos centrado en reducir la fatiga y mejorar el bienestar real en planta, logística y oficina. |
| **Calidad y usabilidad del prototipo** | **15%** | Web App moderna e intuitiva para RRHH + experiencia móvil/QR inmediata para empleados. |
| **Uso útil y justificado de la IA** | **15%** | IA aplicada donde aporta valor real: diseño adaptativo de microconsultas, anonimización PII, clustering semántico, detección de señales débiles y planes de acción. |
| **Privacidad, anonimato y uso responsable** | **15%** | Redacción automática de PII + bloqueo por umbral mínimo ($N < 5$) + supervisión humana obligatoria + explicabilidad de sesgos. |
| **Representatividad e inclusión de colectivos** | **10%** | Monitor de cobertura por colectivo/canal y alertas automáticas de infrarrepresentación (fábrica/logística/turnos). |
| **Calidad del análisis y de los insights** | **10%** | Comparativa entre períodos, detección de temas emergentes, separación de correlación vs. causalidad y validación contra `tema_real`. |
| **Posibilidad de futuras integraciones con M365 corporativo** | **10%** | Orquestación en **n8n** con conectores listos para Microsoft Teams (webhooks/Adaptive Cards), Outlook y SharePoint/Azure AD. |
| **Claridad de la presentación y potencial de evolución** | **5%** | Demo guiada sobre los Escenarios A, B y C + vídeo/capturas de respaldo. |

### Elementos Bonus Contemplados
- Integración directa con **Microsoft Teams** (notificaciones y envío de microconsultas vía Webhook/n8n).
- **Recomendaciones accionables de bienestar** conectadas a las 6 dimensiones de Damm.
- **Soporte multiidioma** (Catalán / Castellano) tanto en la generación de encuestas como en el análisis NLP de comentarios.
- **Experiencia específica sin ordenador** mediante cartel QR auto-generado con acceso móvil en < 90 segundos.
