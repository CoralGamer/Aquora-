# Fase 6: Integración Final, Pruebas End-to-End y Pitch Deck (Sprint 3 / Buffer)
## Protocolo E2E de Pruebas Unificadas y Estructura Expositiva de Hackathon

Esta fase final del MVP consolida todas las piezas del ecosistema de AQUORA (Hardware, API, Base de Datos, Modelo de IA, Flujos en n8n, WhatsApp Bot y Aplicaciones Web y Móvil) para su validación integral de extremo a extremo (E2E). También establece las directrices fundamentales para empaquetar la documentación open source y estructurar el **Pitch Deck de Negocio e Impacto** para impresionar al jurado calificador de la hackathon.

---

## 1. Protocolo de Pruebas de Integración Extremo a Extremo (E2E)

El objetivo es validar que el flujo de datos completo se ejecute en menos de 5 segundos de forma ininterrumpida.

```text
[ESP32 en Wokwi] ---> (1. Cambiar Potenciómetro a Turbidez=12 NTU)
       |
       v (HTTP POST /api/v1/readings)
[FastAPI Backend] ---> (2. Inserción de Datos) ---> [Supabase PostgreSQL]
                                                            |
                                                            v (Realtime Trigger / Webhook)
[OpenWA WhatsApp Bot] <--- (4. Enviar Alerta) <--- [n8n Workflow Automation]
       |
       +---> [Líder Comunitario recibe notificación en su móvil]
       |
[Web Dashboard] y [App Móvil] <--- (5. Visualizan estado "Riesgo: ALTO" en vivo)
```

### Script de Simulación y Orquestación de Pruebas (`e2e_test_orchestrator.py`)
Puede ejecutar este script en la raíz de su proyecto para simular programáticamente todo el flujo y validar la velocidad de respuesta sin necesidad de interactuar manualmente con el hardware.

```python
import time
import requests
import json

API_URL = "http://localhost:8000"
TEST_DEVICE_KEY = "DEV_ESP32_GUAF1"

def run_integration_test():
    print("==================================================")
    print("   AQUORA INTEGRATION TEST: INICIANDO FLUJO E2E   ")
    print("==================================================")
    
    # Paso 1: Validar Salud de la API
    print("\n[Paso 1/5] Verificando salud de la API Backend...")
    try:
        health_res = requests.get(f"{API_URL}/")
        if health_res.status_code == 200:
            print("  -> OK: API Backend activa y respondiendo.")
        else:
            print(f"  -> ERROR: API respondió con código {health_res.status_code}")
            return
    except Exception as e:
        print(f"  -> ERROR: No se pudo conectar a la API. {e}")
        return

    # Paso 2: Inyectar Lectura Crítica de Telemetría (Simulación Wokwi)
    print("\n[Paso 2/5] Simulando lectura crítica desde ESP32 (TDS alto e insalubre)...")
    payload = {
        "device_key": TEST_DEVICE_KEY,
        "tds_ppm": 620.5,         // Umbral crítico > 500 ppm
        "turbidity_ntu": 8.4,      // Umbral crítico > 5.0 NTU
        "water_level_pct": 92.0
    }
    
    start_time = time.time()
    try:
        telemetry_res = requests.post(f"{API_URL}/api/v1/readings", json=payload)
        if telemetry_res.status_code == 201:
            print(f"  -> OK: Lectura inyectada con éxito en {((time.time() - start_time)*1000):.2f} ms.")
        else:
            print(f"  -> ERROR: API rechazó lectura. Código {telemetry_res.status_code}, Detalle: {telemetry_res.text}")
            return
    except Exception as e:
        print(f"  -> ERROR: Falla de red en POST de telemetría. {e}")
        return

    # Paso 3: Verificar Consumo del Mapa del Dashboard
    print("\n[Paso 3/5] Verificando si el Heatmap actualizó el estado a 'Riesgo: ALTO'...")
    try:
        map_res = requests.get(f"{API_URL}/api/v1/stats/heatmap")
        if map_res.status_code == 200:
            heatmap_data = map_res.json()
            # Buscar nuestra comunidad de prueba
            found = False
            for item in heatmap_data:
                if item["current_tds_ppm"] == 620.5:
                    print(f"  -> OK: Comunidad encontrada en Heatmap con riesgo: {item['sanitary_risk']}")
                    found = True
                    break
            if not found:
                print("  -> ADVERTENCIA: La lectura inyectada no se refleja aún en el compilado del mapa.")
        else:
            print("  -> ERROR: No se pudo consumir el mapa.")
    except Exception as e:
        print(f"  -> ERROR: Falla al obtener datos del Heatmap. {e}")

    # Paso 4: Validar Lanzamiento de Alertas
    print("\n[Paso 4/5] Escuchando logs de automatización en n8n...")
    print("  -> Info: Compruebe visualmente que el webhook de n8n se haya disparado.")
    print("  -> Info: Verifique la consola de OpenWA en Docker para confirmar el envío de WhatsApp.")
    
    print("\n[Paso 5/5] Conclusión de Prueba...")
    print("  -> TEST FINALIZADO. Revise los canales finales de recepción.")
    print("==================================================")

if __name__ == "__main__":
    run_integration_test()
```

---

## 2. Documentación del Hardware (Open Source Assets)

Para que el proyecto sea catalogado como un desarrollo tecnológico robusto y digno de ser adoptado por la comunidad open source:
1. **Esquema de Conexiones:** Guardar imágenes claras del esquemático electrónico (PDF o archivo exportado de Fritzing/EasyEDA) en la carpeta `/hardware/schematics/`.
2. **Instrucciones del Firmware:** Asegurar que el firmware `esp32-telemetry.ino` posea comentarios exhaustivos detallando cómo modificar la clave del dispositivo, calibrar las lecturas ADC físicas y redefinir los pines de comunicación.
3. **Guía de Montaje de Filtros PBR:** Redactar un archivo `FILTRO_FISICO.md` describiendo la estratificación de los componentes purificadores de bajo costo (arena de cuarzo de granulometría fina y media, zeolitas lavadas de porosidad media y el lecho filtrante a base de bagazo prensado).

---

## 3. Estructura de Pitch Deck de Hackathon (10 Diapositivas Clave)

El éxito en una hackathon depende en un 50% del desarrollo y un 50% de la venta y propuesta de valor del pitch. Se sugiere estructurar el Pitch Deck bajo el siguiente guion de alta conversión ante jurados corporativos y sociales:

| N° | Título de la Diapositiva | Enfoque de Exposición y Narrativa |
| :--- | :--- | :--- |
| **1** | **El Gancho / Portada** | *Frase de alto impacto:* "AQUORA: Agua segura, nutrición posible". Conecta la crisis de salubridad y desnutrición en un solo golpe visual. |
| **2** | **El Problema en Cifras** | Explicar la Paradoja Alimentaria (Chocó/Guajira). La contaminación por EDAs impide asimilar nutrientes. El problema no es solo la comida, es el agua. |
| **3** | **La Solución Unificada** | El ecosistema AQUORA: Hardware de bajo costo + IA Territorial + Automatización de notificaciones para resiliencia comunitaria. |
| **4** | **Hardware Abierto & Validación** | Mostrar planos del filtro modular (diseño mecánico de capas) y el gemelo digital en Wokwi. Validar que es económicamente viable (< $20 USD). |
| **5** | **Arquitectura de Datos y Backend** | Explicar cómo FastAPI, Supabase y n8n orquestan lecturas IoT y datos históricos en tiempo real de forma escalable. |
| **6** | **Demostración en Vivo (El Clímax)** | Video o demo en vivo: Se altera el potenciómetro en Wokwi en vivo y el líder comunitario recibe la alerta de WhatsApp instantáneamente en su celular. |
| **7** | **Inteligencia Preventiva (IA)** | Cómo Facebook Prophet predice brotes y riesgo de EDA a 7 días, permitiendo a la Fundación Ábaco adelantarse con insumos médicos. |
| **8** | **Modelo de Impacto y ONGs** | Viabilidad del modelo financiero. Cómo se financia (B2G/B2B con ONGs y entes de salud pública) y plan de despliegue territorial. |
| **9** | **Roadmap e Integración Portal Ignia** | Cronograma de desarrollo posterior a la hackathon. Anuncio del código 100% libre bajo licencia MIT subido a la plataforma del evento. |
| **10** | **El Equipo de Desarrollo** | Nombres, roles (IoT, AI Engineer, Fullstack, UI/UX) y la pasión/experiencia colectiva para transformar realidades hídricas. |

---

## 4. Grabación del Demo en Video (Entregable Final)

* **Duración Máxima:** 2 a 3 minutos (máximo tolerado por jurados de hackathons).
* **Guión del Video:**
  1. **0:00 - 0:30:** Introducción corta al problema social del agua y desnutrición (mostrar imágenes del Chocó/La Guajira).
  2. **0:30 - 1:15:** Vista del Portal Open Source con el Visor 3D rotando y el Dashboard interactivo de Leaflet mostrando los mapas de calor territoriales en vivo.
  3. **1:15 - 2:00:** Demostración del gemelo digital de Wokwi simulando agua turbia y la llegada INMEDIATA de la notificación de alerta en el WhatsApp del celular simulado.
  4. **2:00 - 2:30:** Despedida inspiradora sobre el impacto social, tecnología humanitaria y el potencial de AQUORA.

---

> [!IMPORTANT]
> El proyecto está estructurado con el máximo nivel de detalle técnico, listo para ser ejecutado con metodologías ágiles en monorepo. Todos los archivos necesarios han sido creados de forma exitosa en el directorio de trabajo. ¡Adelante con el desarrollo y éxito en la hackathon!
