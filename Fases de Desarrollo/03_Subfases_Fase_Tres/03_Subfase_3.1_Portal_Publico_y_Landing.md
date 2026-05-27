# Subfase 3.1: Portal Público, Landing Page de Impacto y Documentación Open Source del Firmware

Esta subfase detalla el diseño y desarrollo de la cara pública de **AQUORA**, orientada a educar a la comunidad y permitir a desarrolladores externos fabricar e integrar sus propios filtros inteligentes de agua.

---

## 🎨 1. Landing Page Comercial y de Impacto Social
Diseño responsivo de ultra-alto rendimiento visual (CSS puro) con tipografía *Outfit* y gradientes neón (*Electric Cyan* a *Emerald Green*).

### Secciones Clave:
1. **Sección Héroe (Hero Section):** 
   * Mensaje de gran impacto social: *"Agua Limpia para La Guajira: Purificación Ecológica Descentralizada y Monitoreo Inteligente"*.
   * Botón de llamada a la acción principal: **"Explorar Documentación Libre"** y **"Acceso Administrativo"**.
2. **Estadísticas de Impacto (Surfeando datos de SIVIGILA):**
   * Gráficos dinámicos interactivos sobre casos prevenidos de Enfermedades Diarreicas Agudas (EDA) mediante el uso de filtros AQUORA.
3. **Cómo Funciona (Infografía Digital):**
   * Explicación animada del ciclo del agua y filtrado físico molecular por capas (zeolita activa, arena silícea y bagazo de caña).

---

## 📖 2. Área de Documentación del Firmware de Código Abierto
Sección pública y completamente gratuita dedicada a habilitar a la comunidad científica y de creadores (Maker Community).

### Contenidos Técnicos Paso a Paso:
1. **Lista de Componentes (BOM):**
   * Placa de desarrollo ESP32 DevKit-C.
   * Sensor analógico de sólidos disueltos (TDS).
   * Potenciómetro / sensor fotoeléctrico de turbidez.
   * Sensor ultrasónico HC-SR04 para medición del nivel de llenado del tanque.
   * LEDs indicadores de red y estado de batería.
2. **Entorno de Programación:**
   * Configuración de la placa en VS Code con PlatformIO o en Arduino IDE.
3. **Flasheo e Instalación:**
   * Enlace de descarga directa del código fuente oficial (`esp32-telemetry.ino`).
   * Instrucciones de cableado y calibración fina de sensores analógicos en base al voltaje de 3.3V del ESP32.
4. **Solicitud de Claves de Vinculación (`device_key`):**
   * Formulario web interactivo de registro de dispositivo. El usuario ingresa la comunidad donde instalará su filtro y su correo.
   * **Flujo Automatizado:** Al enviar, se genera una `device_key` aleatoria en Supabase con estado `'PENDIENTE_APROBACION'` y se asocia a su cuenta de miembro de la comunidad para que un administrador la active.
