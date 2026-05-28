# 🎨 AQUORA — Skill Temporal: Especificaciones de Diseño Visual Premium

> Este documento es un **skill de diseño de referencia** creado para guiar el rediseño visual de la plataforma web AQUORA.
> Objetivo: Alejarse de los patrones genéricos "hechos por IA" hacia un diseño personalizado, editorial y de alto impacto visual inspirado en estudios de diseño profesionales de alto nivel.

---

## 🧭 Filosofía de Diseño

| Principio | Descripción |
|---|---|
| **Editorial sobre decorativo** | Jerarquía tipográfica clara. El contenido lidera, no los adornos. |
| **Espacio negativo intencional** | Márgenes generosos. Las secciones respiran. Sin rellenos innecesarios. |
| **Grids asimétricos** | Layouts que rompen la monotonía del grid de 12 columnas. Usar proporciones áureas (1.62:1). |
| **Fotografía de primer plano** | Imágenes de alta calidad que ocupan zonas completas del viewport. |
| **Tipografía como elemento visual** | Titulares grandes (6-8rem) que son en sí mismos elementos gráficos. |
| **Color como herramienta narrativa** | Los colores no son solo estéticos; comunican estado, urgencia y calma. |

---

## 🎨 Paleta de Colores Oficial AQUORA

| Token | Hex | HSL | Uso semántico |
|---|---|---|---|
| `--prussian-dark` | `#14293A` | `207 48% 16%` | Fondo base profundo, lienzo principal |
| `--ocean-blue` | `#00508F` | `207 100% 28%` | Acento institucional, CTAs primarios |
| `--sky-blue` | `#ADDBFF` | `207 100% 84%` | Highlights, telemetría óptima, texto de énfasis |
| `--peach-sand` | `#FFCD82` | `36 100% 75%` | Alertas, temperatura, datos críticos |
| `--earthy-mud` | `#4F3815` | `36 55% 19%` | Superficies terciarias, texturas 3D (bagazo) |
| `--amber-gold` | `#8F5601` | `36 99% 28%` | Acentos terciarios, zeolita 3D |

### Colores funcionales derivados:
- **Fondo principal:** `#0A1822` (más oscuro que prussian, para máximo contraste)
- **Superficie de tarjeta:** `rgba(20, 41, 58, 0.7)` con blur(20px)
- **Borde estándar:** `rgba(173, 219, 255, 0.1)`
- **Borde activo/hover:** `rgba(173, 219, 255, 0.4)`
- **Texto principal:** `#E8F4FF` (no blanco puro — más suave)
- **Texto secundario:** `rgba(173, 219, 255, 0.55)`
- **Éxito:** `#2DD4BF` (teal, más apropiado para agua que el verde genérico)

---

## ✏️ Sistema Tipográfico

### Fuentes:
- **Display / Títulos grandes:** `'Playfair Display'` (serif editorial — evoca confianza, profundidad)
- **UI / Cuerpo / Navegación:** `'Inter'` (system-ui fallback — legible, neutro, profesional)
- **Código / Datos técnicos:** `'JetBrains Mono'` (monospace limpio)
- **Subtítulos / Labels:** `'Outfit'` (geométrico moderno)

### Escala tipográfica (mobile-first, en rem):
```
--text-xs:    0.72rem  (11.5px) — labels, badges
--text-sm:    0.875rem (14px)   — metadata, secondary text
--text-base:  1rem     (16px)   — cuerpo
--text-lg:    1.125rem (18px)   — texto destacado
--text-xl:    1.375rem (22px)   — subencabezados
--text-2xl:   1.75rem  (28px)   — encabezados de sección
--text-3xl:   2.5rem   (40px)   — títulos de página
--text-4xl:   3.5rem   (56px)   — títulos hero
--text-5xl:   5rem     (80px)   — tipografía display editorial
```

---

## 📐 Principios de Layout

### Hero Section (Landing Page):
- **Full viewport**: `min-height: 100vh`
- **Imagen de fondo** que ocupa el 60% derecho del viewport (blur suave en los bordes)
- **Texto anclado a la izquierda** con márgenes amplios
- **Sin grid centrado** — layout asimétrico deliberado
- **Línea decorativa vertical** a la izquierda del título (acento ocean-blue de 3px)
- **Número de sección** en tipografía display grande (opacity 0.06) como watermark de fondo

### Cards / Módulos:
- **Sin bordes radius excesivos** — máximo 12px (no 24px como el diseño genérico de IA)
- **Glassmorphism sutil**: `backdrop-filter: blur(12px)` solo donde sea funcional
- **Sombra de profundidad real**: `box-shadow: 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`
- **Hover**: Elevar 6px + cambio de borde sutil (no glow excesivo)

### Spacing:
```
--space-xs:  0.5rem   (8px)
--space-sm:  0.875rem (14px)
--space-md:  1.5rem   (24px)
--space-lg:  2.5rem   (40px)
--space-xl:  4rem     (64px)
--space-2xl: 6rem     (96px)
--space-3xl: 9rem     (144px)
```

---

## 🧩 Componentes Clave y Cómo Se Ven

### 1. Navbar
- Fondo: **Transparente** con `backdrop-filter: blur(16px)` + borde inferior `rgba(173,219,255,0.08)`
- Logo: Texto simple `AQUORA` en Playfair Display + ícono de gota SVG a la izquierda
- Links: Sin colores de fondo en hover — solo subrayado animado que crece desde el centro
- CTA "Iniciar Sesión": Borde ocean-blue, texto sky-blue, fondo transparente. Al hover: fondo sólido ocean-blue

### 2. Hero Slide (Sección Principal)
- Layout: Grid 2 columnas asimétrico — `grid-template-columns: 1.1fr 0.9fr`
- Columna izquierda: Contenido editorial + botones CTA
- Columna derecha: Imagen de fondo con máscara de degradado que la difumina hacia la izquierda
- Número de hito: Texto gigante `01`, `02`, etc. en Playfair Display, `font-size: 12rem`, `opacity: 0.04`, posicionado absolutamente como watermark
- Indicador de slide: Línea vertical delgada a la derecha, con puntos a la derecha del panel

### 3. Tarjetas Informativas (Problema, Solución)
- Layout horizontal: Dos columnas (texto + datos o imagen)
- Divisor: Línea vertical de 1px ocean-blue entre columnas
- Sin íconos emoji — usar **SVG minimalistas** inline o caracteres unicode estructurados
- Números estadísticos: Tipografía display, colores del sistema

### 4. Footer
- Dos filas: Primera con logo + links cortos; Segunda con copyright + licencia
- Fondo: Mismo que el body (sin cambio de color que se vea "apilado")
- Separador: Solo un `border-top` de 1px con baja opacidad

### 5. Open Source Docs (Sidebar Layout)
- Sidebar izquierda: `220px` fijo, fondo ligeramente más oscuro que el main
- Separador: Solo `border-right: 1px solid rgba(173,219,255,0.08)`
- Items del menú: Sin íconos — texto limpio con número de sección a la izquierda
- Área central: Máximo `750px` de ancho de lectura (legibilidad óptima)
- TOC derecha: Solo visible en desktop (>1200px), fondo transparente

---

## 🎭 Micro-Animaciones Permitidas

| Elemento | Animación |
|---|---|
| Cambio de slide | `transform: translateY(8px) → 0` + `opacity: 0 → 1` en 250ms |
| Hover en botón CTA | `transform: translateY(-2px)` + sombra más profunda |
| Hover en card | `transform: translateY(-4px)` + borde más visible |
| Pulse indicator | Scale 0.95→1 con glow expandiéndose |
| Entrada de modal | `translateY(20px) → 0` con ease-out |
| Número de hito activo | Escala de `0.95 → 1` + `opacity: 0 → 1` |

**NO permitidas:**
- Rotaciones
- Flashes de color
- Animaciones de entrada en scroll (Intersection Observer) — se ve anticuado
- Gradient shifts animados en fondos

---

## 🚫 Patrones Prohibidos (Evitar a Toda Costa)

Estos son los elementos que hacen que el diseño se vea "genérico de IA":

1. ❌ **Glassmorphism excesivo** — Si todo es translúcido no hay contraste. Usarlo solo en elementos flotantes.
2. ❌ **Glow neon en todo** — Solo usar en el indicador de telemetría activa y en el mapa.
3. ❌ **Grid centrado simétrico 3-columnas** para features — Romper la simetría intencionalmente.
4. ❌ **Íconos emoji** en títulos y menús — Reemplazar con SVG o tipografía estructurada.
5. ❌ **Tarjetas con `border-radius: 24px`** — El radio excesivo se ve inflado y fake.
6. ❌ **Colores puros de Tailwind** (blue-500, green-400) — Siempre usar los tokens de la paleta AQUORA.
7. ❌ **Animaciones de gradiente en el hero** — Queda bien en demos, mal en producción seria.
8. ❌ **Fondo degradado de múltiples colores** en el hero — Una sola imagen es más poderosa.
9. ❌ **`backdrop-filter: blur()` en todos los elementos** — Solo en navbar y modales.
10. ❌ **`box-shadow` con colores neon brillantes** en cards comunes — Solo en elementos de estado crítico.

---

## 📸 Guía de Imágenes

### Hero Section:
- Imagen derecha: Fotografía aérea o de paisaje de La Guajira (desierto con agua, tonos cálidos)
- Fallback CDN: `https://images.unsplash.com/photo-1571401835393-8c5f35328320?q=80&w=1200` (paisaje agua/desierto)
- Local: `/assets/hero-guajira.jpg` — el usuario debe reemplazar con imagen propia

### Cards de capas del filtro:
- Mantener el enfoque de imagen de fondo (ya implementado)
- Agregar un overlay más oscuro: `rgba(10, 24, 34, 0.92)` en la parte inferior

### Dashboard Admin:
- Sin imágenes decorativas — los datos son el contenido visual principal

---

## 🔧 Variables CSS Finales

```css
:root {
  /* === Paleta Territorial AQUORA === */
  --prussian:      207 48% 16%;   /* #14293A */
  --ocean:         207 100% 28%;  /* #00508F */
  --sky:           207 100% 84%;  /* #ADDBFF */
  --peach:         36 100% 75%;   /* #FFCD82 */
  --earth:         36 55% 19%;    /* #4F3815 */
  --amber:         36 99% 28%;    /* #8F5601 */
  
  /* === Fondo y Superficies === */
  --bg-base:       10 42% 7%;     /* #0A1822 — más profundo */
  --bg-surface:    207 48% 13%;   /* #14293A — tarjeta */
  --bg-overlay:    207 48% 10%;   /* Para secciones alternadas */
  
  /* === Texto === */
  --text-primary:  207 60% 94%;   /* #E8F4FF */
  --text-secondary:207 60% 65%;   /* Azul grisáceo */
  --text-dim:      207 30% 45%;   /* Para metadata */
  
  /* === Bordes === */
  --border:        207 100% 84% / 0.08;  /* Muy sutil */
  --border-active: 207 100% 84% / 0.35;  /* En hover/focus */
  
  /* === Acento semántico === */
  --teal-success:  174 72% 52%;   /* #2DD4BF — para agua limpia */
  --danger:        350 89% 60%;   /* #f43f5e */
  
  /* === Tipografía === */
  --font-display:  'Playfair Display', Georgia, serif;
  --font-ui:       'Inter', system-ui, sans-serif;
  --font-mono:     'JetBrains Mono', 'Courier New', monospace;
  --font-label:    'Outfit', system-ui, sans-serif;
  
  /* === Spacing === */
  --space-xs: 0.5rem;
  --space-sm: 0.875rem;
  --space-md: 1.5rem;
  --space-lg: 2.5rem;
  --space-xl: 4rem;
  --space-2xl: 6rem;
  
  /* === Efectos === */
  --shadow-card:   0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04);
  --shadow-float:  0 20px 40px rgba(0,0,0,0.5);
  --transition:    all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  --blur-glass:    blur(16px);
  --radius-sm:     6px;
  --radius-md:     10px;
  --radius-lg:     16px;
}
```

---

## 📋 Checklist de Implementación

- [ ] Actualizar `index.css` con el sistema de tokens corregido
- [ ] Actualizar Google Fonts import: añadir `Playfair Display` y `JetBrains Mono`
- [ ] Refactorizar `LandingPage.jsx`: Hero full-viewport con imagen lateral + slider editorial
- [ ] Añadir 5to slide de Escalabilidad en el hero slider
- [ ] Refactorizar `App.jsx` navbar: Quitar emojis, añadir underline-hover animation
- [ ] Actualizar `OpenSourceDocs.jsx`: Layout 3 columnas con max-width de lectura
- [ ] Verificar `FilterViewer3D.jsx`: Usar tokens amber/earth para materiales
- [ ] Ejecutar `npm run build` y validar cero errores

---

*Skill creado para el proyecto AQUORA — Fundación Ábaco.*
*Versión: 1.0 | Fase: 3.5 (Refinamiento Visual)*
