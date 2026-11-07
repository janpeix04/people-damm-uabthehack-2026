# 🍺 Damm Pulse IA — Plataforma de Escucha Activa, Continua e Inteligente

> **UAB THE HACK! 2026 · Reto Estrella Damm**  
> *«¿Cómo podemos medir el clima laboral de manera ágil, continua e inteligente con IA? Escoltar millor, actuar abans.»*

---

## 🎯 Sobre el Proyecto

En una organización tan diversa como **Damm** —con personas trabajando en **fábricas** (producción y envasado por turnos), **logística** (almacenes y reparto), **equipos comerciales** (en ruta desde el móvil) y **oficinas**—, las encuestas anuales tradicionales presentan tres grandes barreras:
1. **Participación poco representativa:** Planta y logística participan menos por falta de tiempo o acceso a un ordenador.
2. **Talla única (*one-size-fits-all*):** Una misma encuesta larga no refleja las realidades tan distintas de un operario de turno de noche, un comercial o un manager.
3. **Mucho texto, análisis tardío:** Cientos de comentarios abiertos se revisan a mano; cuando se detecta el problema, la oportunidad de actuar ya ha pasado.

**Damm Pulse IA** transforma la medición del clima laboral en un **ciclo continuo, ético y asistido por IA de principio a fin**, conectando una **Web Base para People/RRHH** con flujos automatizados de **IA y análisis de datos en n8n**, publicación directa en **Typeform** (con experiencia móvil/QR para planta) e integración con **Microsoft 365 (Teams)**.

---

## 🔄 El Ciclo de Escucha Continua (8 Pasos)

Nuestra solución cubre de extremo a extremo el recorrido funcional en una única plataforma:

1. **Definir la Necesidad:** RRHH describe en lenguaje natural qué quiere entender, para qué colectivo (`Planta`, `Logística`, `Comercial`, `Oficina`, `Manager`), la duración máxima (< 2 min) y las restricciones.
2. **Generar la Microconsulta con IA:** `n8n` + LLM diseñan una propuesta adaptada en tono, longitud e idioma (Catalán/Castellano), con 3–6 preguntas, lógica condicional y mensaje de transparencia.
3. **Validación Humana (*Human-in-the-Loop*):** RRHH revisa, edita, reordena o elimina preguntas en la Web Base. **La IA nunca publica sin aprobación humana.**
4. **Publicar en Typeform + QR:** Creación automática del formulario vía **Typeform API**, generando al instante un **Cartel QR imprimible** para planta/logística y notificaciones para **Microsoft Teams**.
5. **Participación Representativa:** Experiencia móvil ultrarrápida (< 90 s) sin necesidad de ordenador, acompañada de un monitor que detecta sesgos de cobertura o baja respuesta en turnos específicos.
6. **Recoger, Anonimizar y Analizar:** Ingesta vía API/Webhook, **eliminación automática de datos identificativos (PII)** en comentarios abiertos, clustering semántico por temas, análisis de sentimiento y detección de **señales débiles (*weak signals*)** entre períodos.
7. **Visualizar con Privacidad por Diseño:** Dashboard de *People Analytics* con resultados **siempre agregados**, bloqueo automático de segmentos con muestra insuficiente (**umbral $k \ge 5$**) y panel de explicabilidad (tamaño muestral $N$, confianza y separación entre correlación y causalidad).
8. **Recomendar y Cerrar el Ciclo:** Propuesta de **acciones concretas de bienestar y organización** (validadas por RRHH) y generación con un clic de la **microconsulta de seguimiento** para evaluar la evolución.

---

## 🏗️ Arquitectura Tecnológica

- **Frontend (Web Base):** Aplicación web interactiva para el equipo de People/RRHH y visualización de dashboards agregados.
- **Orquestación, IA y Análisis Backend (`n8n`):** Instancia local de `n8n` (`http://localhost:5678`) automatizada y validada mediante el servidor MCP local [`mcp-n8n-local`](./mcp-n8n-local) y la skill [`n8n-architect`](./.agents/skills/n8n-architect/SKILL.md):
  - `WF-01`: Diseño adaptativo de microconsultas con IA.
  - `WF-02`: Publicación en Typeform API + Generador QR + Conector Microsoft Teams.
  - `WF-03`: Ingesta de respuestas, sanitización PII multicapa y clustering NLP bilingüe (CA/ES).
  - `WF-04`: Motor estadístico de $k$-anonimato, detector de sesgos de representatividad y recomendador de planes de acción.
- **Formularios y Captura:** Integración con **Typeform API**.
- **Datos:** Dataset **100% sintético** (entre 300 y 1.000 respuestas en múltiples períodos y colectivos, con ruido realista y sesgos controlados para validar los Escenarios A, B y C).

---

## 🛡️ Privacidad, Anonimato y Uso Responsable (Reglas de Oro)

La confianza es la base para que las personas respondan con sinceridad. Nuestra plataforma garantiza por diseño:

- **100% Datos Sintéticos:** Ningún dato real de empleados ni información confidencial de Damm se utiliza o almacena en este proyecto.
- **Agregación Estricta y Umbral Mínimo ($k \ge 5$):** Nunca se muestran respuestas individuales identificables. Si una segmentación tiene menos de 5 respuestas, el backend y el dashboard bloquean el desglose.
- **Redacción Automática de PII:** Todo comentario abierto pasa por un filtro determinista y semántico que enmascara nombres propios, correos, teléfonos o referencias personales antes de ser analizado o mostrado.
- **Supervisión Humana Obligatoria:** La IA propone preguntas y recomienda acciones, pero las personas de RRHH siempre validan y deciden.
- **Zero Secrets Exposed:** Todas las credenciales se gestionan mediante variables de entorno (`.env` ignorado en Git).

---

## 📂 Estructura del Repositorio

```text
├── .agents/
│   └── skills/
│       └── n8n-architect/       # Skill de arquitectura y validación de flujos n8n
├── docs/
│   ├── REQUISITOS.md            # Análisis detallado de requisitos funcionales, éticos y de evaluación
│   ├── PLANIFICACION.md         # Arquitectura técnica, diseño de workflows n8n, módulos web y roadmap
│   ├── 20261102 - Guia participants.pdf
│   └── Repte-Estrella-Damm-UAB-THE-HACK-2026.pdf
├── mcp-n8n-local/               # Servidor MCP local para diseñar, validar y desplegar workflows en n8n
├── ANTIGRAVITY_SETUP.md         # Guía de configuración del servidor MCP en Google Antigravity
├── .gitignore                   # Protección contra subida de secretos (.env), bases de datos y artefactos
└── README.md                    # Documentación general del proyecto
```

---

## 🚀 Puesta en Marcha Rápida

### 1. Clonar y configurar variables de entorno
Crea tu archivo `.env` a partir de la plantilla `.env.example` (nunca subas tus claves al repositorio):

```bash
cp .env.example .env
```

Variables principales requeridas en `.env`:
```env
N8N_API_URL=http://localhost:5678/api/v1
N8N_API_KEY=tu_api_key_local_de_n8n
TYPEFORM_TOKEN=tu_personal_access_token_de_typeform
LLM_API_KEY=tu_api_key_del_modelo_ia
MIN_ANONYMITY_THRESHOLD=5
```

### 2. Iniciar el motor `n8n` localmente
```bash
npx n8n start
# Disponible en http://localhost:5678
```
*(Para conectar el agente con `mcp-n8n-local`, consulta las instrucciones detalladas en [`ANTIGRAVITY_SETUP.md`](./ANTIGRAVITY_SETUP.md)).*

---

## 📚 Documentación Detallada

- 📋 **[Requisitos del Proyecto (`docs/REQUISITOS.md`)](./docs/REQUISITOS.md):** Necesidades de negocio, los 8 pasos del ciclo funcional, escenarios de demostración (A, B y C), esquema de datos sintéticos, reglas de privacidad y criterios de evaluación.
- 🗺️ **[Planificación y Arquitectura (`docs/PLANIFICACION.md`)](./docs/PLANIFICACION.md):** Diseño de la Web Base, topología de los 4 workflows en `n8n`, estrategia de sanitización PII y $k$-anonimato, y planificación por fases del hackathon.
- ⚙️ **[Configuración MCP n8n (`ANTIGRAVITY_SETUP.md`)](./ANTIGRAVITY_SETUP.md):** Guía de conexión del servidor `mcp-n8n-local`.

---

## ✅ Checklist de Entrega (UAB THE HACK! 2026)

- [x] El flujo cubre desde la necesidad de RRHH hasta la recomendación de acción y nueva consulta.
- [x] Existe validación humana obligatoria antes de publicar encuestas y al aprobar acciones.
- [x] Los datos utilizados son 100% sintéticos.
- [x] Se aplica umbral mínimo de agregación ($k \ge 5$) y sanitización de PII en comentarios abiertos.
- [x] Ningún token ni secreto está expuesto en el código ni en la documentación (`.gitignore` configurado).
- [x] Documentación completa (`README.md`, `docs/REQUISITOS.md`, `docs/PLANIFICACION.md`).
