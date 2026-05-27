# AQUORA: Agua segura, nutrición posible
**Documentación Maestra y Guía de Desarrollo**

---

## 1. Visión y Propuesta de Valor

**AQUORA** conecta agua segura, monitoreo inteligente y análisis territorial para fortalecer la efectividad de las estrategias nutricionales en comunidades vulnerables. La iniciativa permite pasar de modelos reactivos a modelos preventivos basados en datos.

* **El Problema:** La desnutrición en departamentos como La Guajira y Chocó se agrava drásticamente por la presencia de Enfermedades Diarreicas Agudas (EDA) causadas por agua contaminada, lo que impide la correcta absorción de nutrientes. 
* **La Solución:** Un ecosistema integral (hardware open source + aplicaciones móviles + inteligencia de datos) que elimina la "ceguera" del estado de los filtros de agua y predice riesgos sanitarios.

---

## 2. Arquitectura del Sistema y Stack Tecnológico

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Portal Web & Open Source** | React 18, Vite, Tailwind CSS, Framer Motion | Landing page de ultra alto rendimiento. Exhibe la iniciativa, documentación open source y un visor 3D interactivo del hardware. |
| **Dashboard (Ábaco)** | React 18, TypeScript, Recharts, Leaflet | Centro de control de Inteligencia Territorial (mapas de estrés hídrico, predicciones, métricas). |
| **App Ecosistema Comunitario** | React Native | Aplicación móvil para comunidades y equipos de mantenimiento. Reportes manuales y escaneo de hardware. |
| **Backend & Base de Datos** | FastAPI (Python), Supabase (PostgreSQL) | Gestión de usuarios, ingesta de telemetría IoT y almacenamiento relacional. |
| **Workflows & Alertas** | n8n, OpenWA (API Gateway) | Automatización de flujos y bot de WhatsApp 100% open source y autoalojado para notificaciones a la comunidad. |
| **Hardware & Simulación** | C++, ESP32, Wokwi | Firmware de sensores (TDS, Turbidez, Nivel). Wokwi actúa como gemelo digital antes de ensamblar el hardware físico. |

---

## 3. Pasos de Desarrollo y Ejecución (Roadmap Detallado)

### Fase 1: Fundamentos y Backend (Sprint 0)
1. **Configuración de Repositorios:** Crear la organización en GitHub y establecer repositorios separados (Frontend, Mobile, Backend, Hardware).
2. **Setup de Base de Datos (Supabase):**
   * Crear el esquema relacional centralizado: tablas `communities`, `devices` y `sensor_readings`.
   * Carga ETL inicial: Importar datos históricos del SIVIGILA (casos EDA) y del Observatorio Ábaco para alimentar la base de predicciones.
3. **Desarrollo de la API (FastAPI):**
   * Configurar el entorno de Python y dependencias (`uvicorn`, `fastapi`, `supabase-py`).
   * Construir el endpoint `POST /api/v1/readings` para la ingesta de telemetría desde los ESP32.
   * Construir el endpoint `GET /api/v1/stats/heatmap` para servir los datos geolocalizados a Leaflet.

### Fase 2: Hardware Simulado y Telemetría (Sprint 1)
1. **Gemelo Digital en Wokwi:**
   * Diseñar el circuito virtual conectando un ESP32 a sensores analógicos (simulando turbidez y TDS).
   * Escribir el firmware en C++ implementando rutinas de conexión WiFi y envíos HTTP POST temporizados hacia la API de FastAPI.
2. **Validación del Flujo de Datos:**
   * Ajustar los potenciómetros en Wokwi para simular agua turbia/contaminada y verificar que las lecturas impacten la base de datos de Supabase en tiempo real.

### Fase 3: Ecosistema Frontend y Visor XR (Sprint 2)
1. **Portal Open Source (React/Vite):**
   * Maquetar la UI con Tailwind CSS e implementar transiciones fluidas de entrada con Framer Motion.
   * **Integración del Visor 3D:** Para lograr una experiencia inmersiva del ensamblaje del filtro, el flujo ideal consiste en optimizar el modelo 3D en Blender y aplicar texturizado en Substance Painter (aprovechando flujos UDIM si se requiere alto nivel de detalle en las capas de arena, zeolita y bagazo). Luego, exportar el activo optimizado (GLTF/GLB) e integrarlo en React utilizando `react-three-fiber` para asegurar compatibilidad web y XR.
2. **Dashboard de Inteligencia Territorial:**
   * Integrar Leaflet.js para mapear las comunidades con gradientes de color según el riesgo sanitario.
   * Conectar Recharts para visualizar el histórico de calidad del agua.

### Fase 4: Aplicación Móvil y Ecosistema Comunitario (Sprint 2-3)
1. **Setup de React Native:**
   * Inicializar el proyecto y configurar la navegación nativa.
2. **Módulos Operativos:**
   * Crear la interfaz de reporte rápido (botones de estado: `OK`, `TURBIO`, `SECO`, `ROTO`).
   * Desarrollar la vista de diagnóstico técnico para los equipos operativos encargados del recambio de módulos del filtro.
   * Conectar la app móvil a la API unificada para lectura/escritura en Supabase.

### Fase 5: Inteligencia, Workflows y Notificaciones (Sprint 3)
1. **Modelo Preventivo (Prophet):**
   * Configurar un script recurrente en Python (cron job) que cruce las lecturas de TDS/Turbidez con la data histórica de SIVIGILA para proyectar el riesgo EDA a 7 días.
2. **Automatización (n8n & OpenWA):**
   * Desplegar y autoalojar **rmyndharis/OpenWA**.
   * En n8n, crear un webhook que escuche umbrales críticos (ej. TDS > 500 ppm).
   * Conectar n8n con OpenWA para que, ante un umbral crítico, se dispare un mensaje de alerta preventivo vía WhatsApp a los gestores de la comunidad afectada.

### Fase 6: Pruebas Finales y Empaquetado (Buffer)
1. **End-to-End Testing:** Verificar el recorrido completo: Cambio de sensor en Wokwi -> API -> Supabase -> Alerta n8n -> OpenWA (WhatsApp) -> Dashboard.
2. **Documentación Open Source:** Asegurar que los esquemas eléctricos y el firmware C++ estén bien comentados en el portal.
3. **Preparación del Pitch:** Grabación del demo funcional para la presentación final.

---

> *"AQUORA conecta tecnología abierta y comunidades para garantizar que el agua potabilizada sea el verdadero motor de la nutrición."*
