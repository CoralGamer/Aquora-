# 💧 AQUORA: Monitoreo Inteligente y Salud Comunitaria en La Guajira
## Descripción Detallada de la Aplicación y Resolución de la Problemática Hídrico-Nutricional

Este documento ofrece una radiografía profunda de la problemática social, hídrica y nutricional que enfrenta el departamento de La Guajira, Colombia, y detalla con precisión científica cómo el **Ecosistema Tecnológico de AQUORA** resuelve este desafío de forma integral, sustentable y de bajo costo.

---

## 🛑 1. El Nexus Hídrico-Nutricional: La Problemática Crítica

En departamentos vulnerables como La Guajira, la crisis humanitaria y la desnutrición infantil crónica no son problemas meramente alimentarios; están intrínsecamente ligados a la **atribución y calidad del agua de consumo**.

```
  Agua Contaminada (Bacterias / Metales)
                │
                ▼
  Infección Intestinal / EDA (Diarreas Agudas)
                │
                ▼
  Atrofia de Vellosidades Intestinales
                │
                ▼
  Mala absorción Crónica de Nutrientes (Ceguera Alimentaria)
                │
                ▼
   🆘 DESNUTRICIÓN INFANTIL CRÓNICA
```

### 1.1 El Síndrome de la Vellosidad Intestinal Atrofiada
Cuando los niños indígenas y campesinos consumen agua de jagüeyes o pozos contaminados con bacterias coliformes (E. coli) y metales pesados, sufren de forma recurrente de **Enfermedades Diarreicas Agudas (EDA)**. 
* Estas infecciones diarreicas constantes provocan una inflamación crónica del tracto digestivo que atrofia las vellosidades de las paredes del intestino delgado (encargadas de absorber los nutrientes de los alimentos).
* Como consecuencia directa, **el organismo del niño pierde la capacidad física de absorber los nutrientes**, proteínas y vitaminas esenciales.
* **El Impacto Social:** Las costosas ayudas humanitarias, suplementos alimenticios y programas de nutrición del gobierno se pierden por completo (se evacúan sin ser metabolizados), perpetuando el círculo de la mortalidad infantil. **Sin agua segura, no hay nutrición posible.**

### 1.2 La Ceguera Operativa en Territorio
Las fundaciones (como la Fundación Ábaco) y las entidades de salud pública se enfrentan a una absoluta **ceguera de datos**:
* No saben en tiempo real qué filtros comunitarios están saturados, cuáles están rotos o en desuso, y qué tanques se han secado debido a sequías extremas.
* Los reportes de brotes epidemiológicos del SIVIGILA llegan con semanas de retraso, impidiendo bloqueos preventivos y respuestas ágiles antes de que ocurra una fatalidad.

---

## ⚡ 2. La Solución Integral de AQUORA

**AQUORA** interrumpe este ciclo de raíz mediante un ecosistema de hardware abierto y software analítico que empodera tanto a las organizaciones humanitarias como a las propias familias vulnerables.

```
       [ Filtro Físico Ecológico / ESP32 IoT ]
                          │
            (Telemetría TDS, Turbidez, Nivel)
                          │
                          ▼
             [ API Unificada / FastAPI ]
                          │
          (Cruce de Datos Históricos SIVIGILA)
                          │
       ┌──────────────────┴──────────────────┐
       ▼                                     ▼
[ Portal de Admin / Ábaco ]       [ Dashboard del Usuario ]
 - Mapa Territorial (580px)        - Estado de su propio filtro
 - Alertas de Riesgo Sanitario     - Alertas sanitarias en vivo
 - Aprovisionamiento por Correo    - Configuración de alertas
```

### 2.1 El Filtro Físico Inteligente (Hardware Ecológico Abierto)
Es un sistema de filtrado multietapa construido con insumos locales orgánicos y abundantes en Colombia:
1. **Bagazo de Caña de Azúcar:** Actúa como un bio-adsorbente molecular, reteniendo compuestos orgánicos, color, olor y metales pesados.
2. **Zeolita Activa:** Realiza intercambio iónico para eliminar bacterias, patógenos y disolver la dureza del agua.
3. **Arena Silícea y Grava:** Retención física de sedimentos gruesos, arcillas y turbidez física.
4. **Cerebro Electrónico (ESP32 DevKit):** Integrado con sensores de Sólidos Disueltos Totales (TDS), Turbidez analógica y Ultrasonido para medir el volumen del tanque, transmitiendo telemetría en tiempo real.

### 2.2 El Ecosistema Web (Software Unificado de Monitoreo y Roles)
Nuestra aplicación web divide la experiencia de forma segura en tres niveles de valor:

#### A. La Cara Pública y Concientización
* **Landing Page:** Presentación interactiva y visual que concientiza al público sobre el nexus hídrico-nutricional en La Guajira, mostrando estadísticas de impacto y casos de EDA prevenidos.
* **Documentación Open Source del Firmware:** Un repositorio abierto y pedagógico paso a paso para que cualquier Maker o comunidad vulnerable del mundo compile el firmware en C++ (`esp32-telemetry.ino`), arme su circuito en Wokwi o en físico y conecte su filtro de forma gratuita a nuestra red solicitando una clave.

#### B. El Centro de Control Territorial de la Fundación Ábaco (Rol: `admin`)
* **Mapa de Inteligencia Territorial (580px):** Un mapa interactivo gigante de Leaflet.js que cruza instantáneamente la telemetría viva de los sensores con los registros epidemiológicos semanales del **SIVIGILA**.
* **Índice de Riesgo Sanitario Dinámico:** El mapa calcula de forma inteligente el riesgo sanitario de cada comunidad, alertando visualmente con marcadores en **Rojo (Riesgo Alto)**, **Amarillo (Riesgo Medio)** o **Verde (Riesgo Bajo)**.
* **Aprovisionamiento Centralizado Seguro:** Permite a los administradores registrar y dar de alta nuevas cuentas para las familias ingresando su correo y una contraseña temporal, vinculando la cuenta directamente al ID del filtro físico instalado en su rancho, manteniendo la seguridad perimetral a través de la API del backend.

#### C. El Dashboard Familiar e Individual (Rol: `community_member`)
* **Monitoreo de su Propio Filtro:** Cada familia ingresa con su correo y contraseña (pudiendo cambiarla por una personal en su perfil) para ver en tiempo real la pureza del agua de su propio filtro familiar.
* **Alertas Sanitarias Proactivas:** Mensajes en pantalla y notificaciones automáticas configurables que avisan a la familia cuando los sólidos disueltos TDS superan los 400 ppm o el nivel cae por debajo del 20%, asegurando que beban agua siempre limpia y prevengan brotes infecciosos digestivos en sus hijos.

---

## 📈 3. Resumen del Impacto y la Transformación Social

Con AQUORA, el agua deja de ser un vector invisible de enfermedades y se convierte en el cimiento del bienestar nutricional:
* **Bloqueo Epidemiológico:** Los administradores detectan incrementos de turbidez o sólidos en tiempo real en una zona antes de que se manifieste un brote de EDA en los puestos de salud.
* **Empoderamiento Comunitario:** Las familias adquieren soberanía tecnológica al poder monitorear y mantener de forma autónoma sus propios sistemas de purificación hídrica.
