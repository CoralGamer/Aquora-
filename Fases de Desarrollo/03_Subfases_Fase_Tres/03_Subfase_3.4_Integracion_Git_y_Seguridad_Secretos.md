# Subfase 3.4: Integración de Git, Ciberseguridad de Secretos y Despliegues Automáticos (CD)

Esta subfase detalla el protocolo de control de versiones seguro, los estándares de ciberseguridad adoptados para prevenir fugas de credenciales en repositorios públicos, y el flujo de despliegue continuo (CD) para el portal analítico de AQUORA.

---

## 🔒 1. Políticas de Ciberseguridad y Protección de Secretos

Para garantizar que el código de AQUORA permanezca seguro al subirse a repositorios públicos de GitHub (como `Creathon-Ignia`), implementamos un esquema estricto de **seguridad perimetral de secretos**:

### 1.1 Exclusión Absoluta de Archivos Sensibles (`.gitignore`):
* El archivo `.env` en la raíz del backend y del frontend web se encuentra estrictamente ignorado por Git.
* Ninguna clave de Supabase, API Key de servicios de IA, ni contraseñas de red se encuentran hardcodeadas en los repositorios públicos.
* Se ignoran carpetas de dependencias como `node_modules/` y entornos virtuales como `venv/` para prevenir sobrecargar el repositorio y fugas involuntarias.

### 1.2 Archivos de Ejemplo de Variables de Entorno:
* Se provee un archivo de plantilla seguro libre de secretos reales: `backend/.env.example`.
* De esta manera, cualquier desarrollador del equipo o creador del público puede descargar el repositorio y simplemente renombrar la plantilla a `.env` e insertar sus credenciales locales sin riesgo alguno.

---

## 📡 2. Estructura de Commits Segregados e Historial Detallado

Para facilitar el control del proyecto y cumplir con estándares de entrega comercial, hemos estructurado el repositorio en commits modulares y específicos en español:

1. **Commit de Documentación y Fundamentos:** Orquestación inicial del monorepo, gitignore y especificación de fases.
2. **Commit del Backend:** La API robusta en FastAPI, configuración resiliente del loopback y queries optimizadas en memoria.
3. **Commit del Hardware:** El firmware C++ modular para el ESP32 y la simulación en Wokwi.
4. **Commit de Mobile:** La app móvil base React Native Expo y sus utilidades de QR.
5. **Commit de Web Portal:** El panel Vanilla CSS responsivo, mapa de 580px, visor 3D en React Three Fiber y analítica de Recharts.

---

## 🚀 3. Flujo de Despliegue Continuo (CD) - GitHub Pages

Para el portal web público, configuramos un pipeline de despliegue estático automatizado:

1. **Herramienta Utilizada:** Paquete `gh-pages` integrado en Node.js.
2. **Configuración en `web/package.json`:**
   * Script de compilación y despliegue integrado:
     ```json
     "scripts": {
       "build": "vite build",
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
     ```
3. **Mecanismo:** Al ejecutar `npm run deploy`, el pipeline compila el frontend web y genera la carpeta `/dist`, aislándola y empujándola de manera automática a la rama de producción `gh-pages` en GitHub, la cual sirve la aplicación web en HTTPS de forma gratuita e inmediata.
