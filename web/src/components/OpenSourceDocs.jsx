import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../services/supabaseClient";

/* ───────────────────────────────────────────────────────
   AQUORA — Open Source Documentation Portal
   3-column layout: Left sidebar · Center reading · Right TOC
   ─────────────────────────────────────────────────────── */

// ── Navigation structure ────────────────────────────────
const SECTIONS = [
  {
    id: "getting-started",
    label: "GETTING STARTED",
    num: "01",
    items: [
      { id: "overview", label: "Resumen del Proyecto", tab: "overview" },
      { id: "link-device", label: "Vincular Filtro Familiar", tab: "link-device" },
      { id: "join-community", label: "Queremos ser Comunidad", tab: "join-community" },
    ],
  },
  {
    id: "hardware",
    label: "HARDWARE & WIRING",
    num: "02",
    items: [
      { id: "bom", label: "Materiales de Ensamble", tab: "bom" },
      { id: "pinout", label: "Esquema de Pines", tab: "pinout" },
    ],
  },
  {
    id: "firmware",
    label: "COMPILING FIRMWARE",
    num: "03",
    items: [
      { id: "arduino-setup", label: "Configurar Arduino IDE", tab: "arduino-setup" },
      { id: "firmware-src", label: "Firmware C++ (ESP32)", tab: "firmware-src" },
    ],
  },
  {
    id: "support",
    label: "SOPORTE & FAQS",
    num: "04",
    items: [
      { id: "faqs", label: "FAQs de Mantenimiento", tab: "faq" },
    ],
  },
];

// ── Right-hand TOC headings per active tab ──────────────
const TOC_MAP = {
  overview: [
    { label: "Acerca de AQUORA", anchor: "about" },
    { label: "Arquitectura del Sistema", anchor: "arch" },
  ],
  "link-device": [
    { label: "Solicitar Clave", anchor: "request-key" },
    { label: "Activacion", anchor: "activation" },
  ],
  "join-community": [
    { label: "Postular Comunidad", anchor: "postulate-comm" },
    { label: "Acompañamiento Hídrico", anchor: "support-info" },
  ],
  bom: [
    { label: "Requisitos del Filtro", anchor: "reqs" },
    { label: "Lista de Materiales (BOM)", anchor: "bom-table" },
  ],
  pinout: [
    { label: "Tabla de Conexiones", anchor: "pinout-section" },
    { label: "Pines Activos", anchor: "pin-ref" },
  ],
  "arduino-setup": [
    { label: "Configurar Entorno", anchor: "code-intro" },
    { label: "Guia de Montaje", anchor: "assembly-guide" },
    { label: "Simulacion Wokwi", anchor: "wokwi-sim" },
  ],
  "firmware-src": [
    { label: "Codigo Fuente v2.2", anchor: "code-block" },
  ],
  faq: [
    { label: "Preguntas Frecuentes", anchor: "faq-list" },
  ],
};

const COLOMBIA_LOCATIONS = {
  "La Guajira": [
    "Uribia",
    "Manaure",
    "Riohacha",
    "Maicao",
    "San Juan del Cesar",
    "Albania",
    "Dibulla",
    "Barrancas"
  ],
  "Magdalena": [
    "Santa Marta",
    "Ciénaga",
    "Aracataca",
    "Plato",
    "Fundación",
    "El Banco"
  ],
  "Atlántico": [
    "Barranquilla",
    "Soledad",
    "Malambo",
    "Sabanalarga",
    "Puerto Colombia"
  ],
  "Bolívar": [
    "Cartagena",
    "Turbaco",
    "Arjona",
    "Magangué",
    "El Carmen de Bolívar"
  ],
  "Cesar": [
    "Valledupar",
    "Aguachica",
    "Agustín Codazzi",
    "Bosconia",
    "San Diego"
  ]
};

// ── FAQ data ────────────────────────────────────────────
const FAQS = [
  {
    q: "Como configuro las alertas de WhatsApp en territorio?",
    a: "Una vez que tengas tu cuenta comunitaria aprovisionada por un administrador, ve a 'Alertas y Preferencias' en tu panel de miembro e introduce tu numero telefonico. n8n escuchara cambios criticos de TDS y Turbidez y enviara notificaciones instantaneas automatizadas a tu telefono mediante el bot autoalojado de OpenWA.",
  },
  {
    q: "Cada cuanto se deben realizar los reemplazos fisicos del filtro organico?",
    a: "El Bagazo de Cana de Azucar (capa de adsorcion quimica) requiere recambio cada 3 meses. La Zeolita Activa (capa de ablandamiento y bacterias) debe lavarse con salmuera cada 6 meses. La Arena Silicea (filtracion primaria) requiere retrolavado simple una vez al mes para remover sedimentos gruesos acumulados.",
  },
  {
    q: "El circuito ESP32 consume mucha energia? Se puede alimentar con celdas solares?",
    a: "Si, el microcontrolador ESP32 DevKit-C opera a 3.3V y tiene modos de deep-sleep integrados en el codigo. Para territorio sin red electrica, se alimenta eficientemente utilizando una celda solar de 5V acoplada a una bateria de Litio 18650 con un cargador TP4056 estandar.",
  },
  {
    q: "Por que los LEDs del filtro familiar parpadean constantemente?",
    a: "Si el LED rojo parpadea de forma intermitente, significa que el ESP32 no ha podido establecer conexion con la red WiFi comunitaria. Si el LED verde esta encendido fijo, la red esta enlazada y el filtro transmite datos de telemetria a Supabase activamente.",
  },
];

// ── Firmware source code ────────────────────────────────
const cppCode = `// ============================================================
// AQUORA - FIRMWARE DE TELEMETRIA v2.2 (HTTP Plano)
// ============================================================
// Simulacion en Wokwi con ESP32 DevKit-C v4
// Sensores: TDS (pot), Turbidez (pot), Nivel (HC-SR04)
// Conectividad: WiFi -> HTTP POST a API REST via ngrok
// ============================================================

#include <WiFi.h>
#include <HTTPClient.h>

// --- CONFIGURACION DE RED ---
const char* ssid     = "Wokwi-GUEST";
const char* password = "";

// --- ENDPOINT API (HTTP plano, sin HTTPS) ---
const char* serverURL = "http://TU_TUNNEL_NGROK.ngrok-free.dev/api/v1/readings";

// --- CLAVE UNICA DE TU FILTRO ---
// Ingresa la "Clave de API de Firmware" asignada a tu purificador.
// Se obtiene en el Panel de Aprovisionamiento de AQUORA.
// Formato: "aq_api_XXXXXXXXXXXXXXXX"
const String deviceKey = "aq_api_TU_CLAVE_AQUI";

// --- PINES DE SENSORES ---
const int pinTDS       = 34;   // Potenciometro TDS -> GPIO34 (ADC)
const int pinTurbidity = 35;   // Potenciometro Turbidez -> GPIO35 (ADC)
const int pinTrigger   = 5;    // HC-SR04 TRIG -> GPIO5
const int pinEcho      = 18;   // HC-SR04 ECHO -> GPIO18
const int pinLED       = 2;    // LED integrado ESP32

// --- TIEMPOS ---
const unsigned long sendInterval = 15000;  // Enviar cada 15 segundos
unsigned long lastSendTime = 0;

// --- PROMEDIO MOVIL ---
const int N = 20;
int bufTDS[N], bufTurb[N];
int idx = 0;
bool bufferReady = false;

// --- TANQUE ---
const float tankH     = 200.0;  // Altura total del tanque (cm)
const float sensorOff = 10.0;   // Offset del sensor desde el tope (cm)

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("=============================================");
  Serial.println("   AQUORA SMART WATER MONITOR v2.2");
  Serial.println("=============================================");

  pinMode(pinLED, OUTPUT);
  pinMode(pinTDS, INPUT);
  pinMode(pinTurbidity, INPUT);
  pinMode(pinTrigger, OUTPUT);
  pinMode(pinEcho, INPUT);

  memset(bufTDS, 0, sizeof(bufTDS));
  memset(bufTurb, 0, sizeof(bufTurb));

  WiFi.begin(ssid, password);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 50) {
    delay(400);
    digitalWrite(pinLED, tries % 2);  // Parpadeo = conectando
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] CONECTADO - IP: " + WiFi.localIP().toString());
    digitalWrite(pinLED, HIGH);  // LED fijo = conectado
  } else {
    Serial.println("[WiFi] ERROR: No se pudo conectar");
    digitalWrite(pinLED, LOW);
  }
}

void loop() {
  bufTDS[idx]  = analogRead(pinTDS);
  bufTurb[idx] = analogRead(pinTurbidity);
  idx++;
  if (idx >= N) { idx = 0; bufferReady = true; }

  unsigned long now = millis();
  if (now - lastSendTime >= sendInterval) {
    lastSendTime = now;
    if (WiFi.status() != WL_CONNECTED) {
      WiFi.reconnect(); delay(3000);
      if (WiFi.status() != WL_CONNECTED) return;
    }

    float tds   = calcTDS();
    float turb  = calcTurb();
    float level = calcLevel();
    sendTelemetry(tds, turb, level);
  }
  delay(100);
}

// --- FUNCIONES DE SENSORES ---
float avg(int* buf) {
  long s = 0;
  int count = bufferReady ? N : (idx > 0 ? idx : 1);
  for (int i = 0; i < count; i++) s += buf[i];
  return (float)s / count;
}

float calcTDS() {
  float voltage = avg(bufTDS) * (3.3 / 4095.0);
  return max((voltage / 2.3) * 1000.0f, 0.0f);
}

float calcTurb() {
  float voltage = avg(bufTurb) * (3.3 / 4095.0);
  return constrain((1.0 - voltage / 3.3) * 100.0f, 0.0f, 100.0f);
}

float calcLevel() {
  digitalWrite(pinTrigger, LOW);
  delayMicroseconds(2);
  digitalWrite(pinTrigger, HIGH);
  delayMicroseconds(10);
  digitalWrite(pinTrigger, LOW);
  long dur = pulseIn(pinEcho, HIGH, 30000);
  if (dur == 0) return 0.0;
  float d = constrain(dur * 0.01715, sensorOff, tankH);
  return ((tankH - d) / (tankH - sensorOff)) * 100.0;
}

// --- ENVIO HTTP ---
void sendTelemetry(float tds, float turb, float level) {
  HTTPClient http;
  http.begin(serverURL);
  http.setTimeout(10000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("ngrok-skip-browser-warning", "69420");

  String json = "{";
  json += "\\"device_key\\":\\"" + deviceKey + "\\",";
  json += "\\"tds_ppm\\":" + String(tds, 2) + ",";
  json += "\\"turbidity_ntu\\":" + String(turb, 2) + ",";
  json += "\\"water_level_pct\\":" + String(level, 2);
  json += "}";

  int httpCode = http.POST(json);
  if (httpCode == 200 || httpCode == 201) {
    Serial.println("[OK] Dato enviado exitosamente!");
    for (int i = 0; i < 6; i++) {
      digitalWrite(pinLED, i % 2); delay(80);
    }
    digitalWrite(pinLED, HIGH);
  } else {
    Serial.println("[HTTP] ERROR: " + http.errorToString(httpCode));
    digitalWrite(pinLED, LOW); delay(500);
    digitalWrite(pinLED, HIGH);
  }
  http.end();
}`;

// ═══════════════════════════════════════════════════════
//  Inline Style Objects
// ═══════════════════════════════════════════════════════

const S = {
  /* Root wrapper */
  root: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "var(--font-ui)",
    color: "hsl(var(--text-primary))",
    background: "hsl(var(--bg-base))",
  },

  /* ── Left sidebar ─────────────────────────────────── */
  sidebar: {
    width: 240,
    minWidth: 240,
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
    borderRight: "1px solid hsl(var(--border))",
    padding: "var(--space-lg) 0",
    flexShrink: 0,
  },
  sidebarSection: {
    marginBottom: "var(--space-lg)",
  },
  sidebarSectionHeader: {
    fontFamily: "var(--font-label)",
    fontSize: "0.72rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "hsl(var(--text-dim))",
    padding: "0 var(--space-md)",
    marginBottom: "var(--space-xs)",
    display: "flex",
    alignItems: "center",
    gap: "var(--space-xs)",
  },
  sidebarNum: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.68rem",
    color: "hsl(var(--ocean))",
    opacity: 0.7,
  },
  sidebarItem: (isActive) => ({
    display: "block",
    width: "100%",
    background: isActive ? "hsla(var(--ocean) / 0.08)" : "none",
    border: "none",
    borderLeft: isActive ? "3px solid hsl(var(--ocean))" : "3px solid transparent",
    padding: "6px var(--space-md) 6px calc(var(--space-md) - 3px)",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontFamily: "var(--font-ui)",
    color: isActive ? "hsl(var(--sky))" : "hsl(var(--text-secondary))",
    fontWeight: isActive ? 600 : 400,
    lineHeight: 1.5,
    transition: "all 0.15s ease",
    textDecoration: "none",
  }),

  /* ── Center reading area ──────────────────────────── */
  center: {
    flex: 1,
    minWidth: 0,
    padding: "var(--space-lg) var(--space-xl)",
  },
  reading: {
    maxWidth: 750,
    margin: "0 auto",
  },
  pageTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--text-3xl, 2.5rem)",
    fontWeight: 700,
    color: "hsl(var(--text-primary))",
    marginBottom: "var(--space-xs)",
    lineHeight: 1.15,
  },
  pageSubtitle: {
    fontFamily: "var(--font-ui)",
    fontSize: "var(--text-base, 1rem)",
    color: "hsl(var(--text-secondary))",
    lineHeight: 1.6,
    marginBottom: "var(--space-xl)",
  },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--text-2xl, 1.75rem)",
    fontWeight: 600,
    color: "hsl(var(--text-primary))",
    marginBottom: "var(--space-sm)",
    marginTop: "var(--space-lg)",
    lineHeight: 1.25,
  },
  sectionSubtitle: {
    fontFamily: "var(--font-label)",
    fontSize: "var(--text-lg, 1.125rem)",
    fontWeight: 500,
    color: "hsl(var(--sky))",
    marginBottom: "var(--space-sm)",
    marginTop: "var(--space-md)",
  },
  bodyText: {
    fontSize: "var(--text-base, 1rem)",
    color: "hsl(var(--text-secondary))",
    lineHeight: 1.7,
    marginBottom: "var(--space-md)",
  },

  /* ── Table ────────────────────────────────────────── */
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.875rem",
    textAlign: "left",
    marginBottom: "var(--space-lg)",
  },
  th: {
    padding: "0.75rem var(--space-sm)",
    fontFamily: "var(--font-label)",
    fontWeight: 600,
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "hsl(var(--text-dim))",
    borderBottom: "2px solid hsl(var(--border-active))",
  },
  td: (isOdd) => ({
    padding: "0.75rem var(--space-sm)",
    color: "hsl(var(--text-secondary))",
    borderBottom: "1px solid hsl(var(--border))",
    background: isOdd ? "hsla(var(--ocean) / 0.03)" : "transparent",
  }),
  tdBold: (isOdd) => ({
    padding: "0.75rem var(--space-sm)",
    fontWeight: 600,
    color: "hsl(var(--text-primary))",
    borderBottom: "1px solid hsl(var(--border))",
    background: isOdd ? "hsla(var(--ocean) / 0.03)" : "transparent",
  }),
  tdMono: (isOdd) => ({
    padding: "0.75rem var(--space-sm)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.8rem",
    color: "hsl(var(--sky))",
    borderBottom: "1px solid hsl(var(--border))",
    background: isOdd ? "hsla(var(--ocean) / 0.03)" : "transparent",
  }),

  /* ── Code block ───────────────────────────────────── */
  codeWrap: {
    background: "#0A1822",
    borderRadius: "var(--radius-md)",
    border: "1px solid hsl(var(--border))",
    overflow: "hidden",
    marginBottom: "var(--space-lg)",
  },
  codeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "var(--space-xs) var(--space-md)",
    borderBottom: "1px solid hsl(var(--border))",
    background: "hsla(var(--bg-surface) / 0.5)",
  },
  codeFilename: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.8rem",
    color: "hsl(var(--sky))",
  },
  copyBtn: (copied) => ({
    padding: "4px 12px",
    fontSize: "0.75rem",
    fontFamily: "var(--font-mono)",
    background: copied ? "hsla(var(--teal-success) / 0.15)" : "transparent",
    color: copied ? "hsl(var(--teal-success))" : "hsl(var(--text-secondary))",
    border: `1px solid ${copied ? "hsla(var(--teal-success) / 0.3)" : "hsl(var(--border-active))"}`,
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  }),
  pre: {
    margin: 0,
    padding: "var(--space-md)",
    fontSize: "0.8rem",
    fontFamily: "var(--font-mono)",
    color: "#E8F4FF",
    overflowX: "auto",
    maxHeight: 420,
    lineHeight: 1.6,
    tabSize: 2,
  },

  /* ── Pin list ─────────────────────────────────────── */
  pinList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-xs)",
    marginBottom: "var(--space-lg)",
  },
  pinItem: {
    display: "flex",
    alignItems: "baseline",
    gap: "var(--space-xs)",
    fontSize: "0.9rem",
    color: "hsl(var(--text-secondary))",
    lineHeight: 1.6,
  },
  pinDot: (color) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
    marginTop: 6,
  }),
  inlineCode: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.82rem",
    background: "hsla(var(--ocean) / 0.15)",
    padding: "2px 6px",
    borderRadius: "var(--radius-sm)",
    color: "hsl(var(--sky))",
  },

  /* ── FAQ accordion ────────────────────────────────── */
  faqItem: (isOpen) => ({
    borderRadius: "var(--radius-md)",
    border: `1px solid ${isOpen ? "hsl(var(--border-active))" : "hsl(var(--border))"}`,
    overflow: "hidden",
    transition: "border-color 0.2s ease",
    marginBottom: "var(--space-sm)",
  }),
  faqBtn: {
    width: "100%",
    padding: "var(--space-md)",
    background: "none",
    border: "none",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "var(--space-sm)",
  },
  faqQ: (isOpen) => ({
    fontFamily: "var(--font-ui)",
    fontSize: "0.95rem",
    fontWeight: 500,
    color: isOpen ? "hsl(var(--sky))" : "hsl(var(--text-primary))",
    lineHeight: 1.4,
  }),
  faqChevron: (isOpen) => ({
    fontSize: "0.7rem",
    color: "hsl(var(--text-dim))",
    flexShrink: 0,
    transition: "transform 0.2s ease",
    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
  }),
  faqBody: {
    padding: "0 var(--space-md) var(--space-md) var(--space-md)",
    color: "hsl(var(--text-secondary))",
    fontSize: "0.9rem",
    lineHeight: 1.65,
    borderTop: "1px solid hsl(var(--border))",
    paddingTop: "var(--space-sm)",
  },

  /* ── Device key form ──────────────────────────────── */
  formCard: {
    background: "hsl(var(--bg-surface))",
    borderRadius: "var(--radius-md)",
    border: "1px solid hsl(var(--border))",
    padding: "var(--space-md)",
    marginBottom: "var(--space-lg)",
  },
  formLabel: {
    display: "block",
    fontFamily: "var(--font-label)",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "hsl(var(--text-dim))",
    marginBottom: 4,
  },
  formInput: {
    width: "100%",
    padding: "8px 12px",
    fontSize: "0.875rem",
    fontFamily: "var(--font-ui)",
    background: "hsl(var(--bg-base))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius-sm)",
    color: "hsl(var(--text-primary))",
    outline: "none",
    transition: "border-color 0.15s ease",
    boxSizing: "border-box",
  },
  formSelect: {
    width: "100%",
    padding: "8px 12px",
    fontSize: "0.875rem",
    fontFamily: "var(--font-ui)",
    background: "hsl(var(--bg-base))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius-sm)",
    color: "hsl(var(--text-primary))",
    cursor: "pointer",
    outline: "none",
    boxSizing: "border-box",
  },
  submitBtn: (loading) => ({
    width: "100%",
    padding: "10px 0",
    fontSize: "0.875rem",
    fontFamily: "var(--font-label)",
    fontWeight: 600,
    letterSpacing: "0.04em",
    background: loading ? "hsl(var(--bg-overlay))" : "hsl(var(--ocean))",
    color: "hsl(var(--text-primary))",
    border: "none",
    borderRadius: "var(--radius-sm)",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "background 0.15s ease, transform 0.1s ease",
    marginTop: "var(--space-xs)",
  }),
  successBox: {
    background: "hsla(var(--teal-success) / 0.06)",
    border: "1px solid hsla(var(--teal-success) / 0.25)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-md)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-xs)",
  },
  keyDisplay: {
    background: "hsla(0 0% 0% / 0.3)",
    padding: "var(--space-sm)",
    borderRadius: "var(--radius-sm)",
    fontFamily: "var(--font-mono)",
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "hsl(var(--sky))",
    letterSpacing: "0.06em",
  },

  /* ── Right TOC ────────────────────────────────────── */
  toc: {
    width: 200,
    minWidth: 200,
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
    padding: "var(--space-lg) var(--space-md)",
    flexShrink: 0,
    borderLeft: "1px solid hsl(var(--border))",
  },
  tocTitle: {
    fontFamily: "var(--font-label)",
    fontSize: "0.68rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "hsl(var(--text-dim))",
    marginBottom: "var(--space-sm)",
  },
  tocLink: {
    display: "block",
    fontSize: "0.8rem",
    fontFamily: "var(--font-ui)",
    color: "hsl(var(--text-secondary))",
    textDecoration: "none",
    padding: "4px 0",
    lineHeight: 1.5,
    cursor: "pointer",
    transition: "color 0.12s ease",
    border: "none",
    background: "none",
    textAlign: "left",
    width: "100%",
  },

  /* ── Responsive media query injection ─────────────── */
  responsiveStyle: `
    @media (max-width: 1200px) {
      .aquora-docs-toc { display: none !important; }
    }
    @media (max-width: 860px) {
      .aquora-docs-root { flex-direction: column !important; }
      .aquora-docs-sidebar {
        width: 100% !important;
        min-width: 100% !important;
        height: auto !important;
        position: relative !important;
        border-right: none !important;
        border-bottom: 1px solid hsl(var(--border)) !important;
        padding: var(--space-md) 0 !important;
      }
      .aquora-docs-center { padding: var(--space-md) !important; }
    }
  `,
};

// ═══════════════════════════════════════════════════════
//  Component
// ═══════════════════════════════════════════════════════

export default function OpenSourceDocs({ getApiUrl }) {
  // Derive API base
  const apiBase = getApiUrl ? getApiUrl() : "http://localhost:8000";

  // ── State ──────────────────────────────────────────
  const [activeItem, setActiveItem] = useState("bom");
  const [openFaqIdx, setOpenFaqIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  // Device key request state
  const [communities, setCommunities] = useState([]);
  const [selectedCommId, setSelectedCommId] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestedKey, setRequestedKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Community request state
  const [commName, setCommName] = useState("");
  const [commEmail, setCommEmail] = useState("");
  const [selectedDept, setSelectedDept] = useState("La Guajira");
  const [selectedMuni, setSelectedMuni] = useState("Uribia");
  const [commCorregimiento, setCommCorregimiento] = useState("");
  const [commDesc, setCommDesc] = useState("");
  const [commLoading, setCommLoading] = useState(false);
  const [commSuccess, setCommSuccess] = useState(false);
  const [commError, setCommError] = useState("");

  // State for loaded departments and municipalities of Colombia (defaults to fallback)
  const [locationsMap, setLocationsMap] = useState(COLOMBIA_LOCATIONS);

  // Municipalities map
  const municipalities = useMemo(() => {
    return locationsMap[selectedDept] || [];
  }, [selectedDept, locationsMap]);

  // Reset selected municipality when department changes
  useEffect(() => {
    if (municipalities.length > 0) {
      if (!municipalities.includes(selectedMuni)) {
        setSelectedMuni(municipalities[0]);
      }
    }
  }, [selectedDept, municipalities]);

  // Derive active tab from active sidebar item
  const activeTab = useMemo(() => {
    for (const section of SECTIONS) {
      const found = section.items.find((i) => i.id === activeItem);
      if (found) return found.tab;
    }
    return "hardware";
  }, [activeItem]);

  // Derive right TOC entries
  const tocEntries = useMemo(() => TOC_MAP[activeTab] || [], [activeTab]);

  // ── Effects ────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("communities")
      .select("id, name")
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setCommunities(data);
          setSelectedCommId(data[0].id);
        } else {
          // Respaldo robusto de comunidades piloto aprobadas/aceptadas
          const fallbackComms = [
            { id: "7b91f03b-4cf5-41b0-87e4-2515c9acb225", name: "Comunidad Uribia" },
            { id: "28d1b963-3751-4928-b773-e184e9b9d505", name: "Comunidad Manaure" },
            { id: "gen-comm-riohacha", name: "Comunidad Riohacha" },
            { id: "gen-comm-maicao", name: "Comunidad Maicao" },
            { id: "gen-comm-sanjuan", name: "Comunidad San Juan del Cesar" },
            { id: "gen-comm-albania", name: "Comunidad Albania" },
            { id: "gen-comm-dibulla", name: "Comunidad Dibulla" },
            { id: "gen-comm-barrancas", name: "Comunidad Barrancas" }
          ];
          setCommunities(fallbackComms);
          setSelectedCommId(fallbackComms[0].id);
        }
      });

    // Cargar todos los departamentos y municipios de Colombia de forma asíncrona desde GitHub
    fetch("https://raw.githubusercontent.com/marcovega/colombia-json/master/colombia.json")
      .then((res) => {
        if (!res.ok) throw new Error("Error en red al descargar base de datos de municipios");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const map = {};
          // Ordenar los departamentos alfabéticamente (con manejo de acentos en español)
          const sortedData = [...data].sort((a, b) => 
            a.departamento.localeCompare(b.departamento, 'es', { sensitivity: 'base' })
          );
          sortedData.forEach((item) => {
            if (item.departamento && Array.isArray(item.ciudades)) {
              // Ordenar las ciudades de cada departamento alfabéticamente
              map[item.departamento] = [...item.ciudades].sort((a, b) => 
                a.localeCompare(b, 'es', { sensitivity: 'base' })
              );
            }
          });
          setLocationsMap(map);
        }
      })
      .catch((err) => {
        console.error("Error al cargar departamentos de Colombia desde GitHub, usando fallbacks locales:", err);
      });
  }, []);

  // ── Handlers ───────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(cppCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestKey = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setRequestedKey("");
    try {
      const response = await fetch(`${apiBase}/api/v1/requests/filter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: requesterName,
          email: requesterEmail,
          community_id: selectedCommId,
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Error al registrar solicitud de filtro.");
      }
      setRequestedKey("PENDIENTE_APROBACION");
      setRequesterName("");
      setRequesterEmail("");
    } catch (err) {
      console.error("Error requesting key:", err);
      setErrorMsg(
        err.message || "Ocurrió un error al registrar la solicitud de filtro. Verifique la conexión al backend de AQUORA."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCommunity = async (e) => {
    e.preventDefault();
    setCommLoading(true);
    setCommError("");
    setCommSuccess(false);
    try {
      const response = await fetch(`${apiBase}/api/v1/requests/community`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: commName,
          email: commEmail,
          department: selectedDept,
          municipality: selectedMuni,
          corregimiento: commCorregimiento,
          description: commDesc
        })
      });
      if (!response.ok) {
        throw new Error("Error al enviar postulación");
      }
      setCommSuccess(true);
      setCommName("");
      setCommEmail("");
      setCommCorregimiento("");
      setCommDesc("");
    } catch (err) {
      console.error("Error requesting community:", err);
      setCommError("Ocurrió un error al registrar la comunidad. Verifique la conexión al backend de AQUORA.");
    } finally {
      setCommLoading(false);
    }
  };

  const scrollToAnchor = (anchor) => {
    const el = document.getElementById(anchor);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Render helpers ─────────────────────────────────

  const renderOverview = () => (
    <div>
      <h2 id="about" style={S.sectionTitle}>
        Acerca de AQUORA
      </h2>
      <p style={S.bodyText}>
        AQUORA es una plataforma de monitoreo comunitario de calidad de agua
        disenada para comunidades rurales de La Guajira, Colombia. El sistema
        integra sensores IoT de bajo costo con un backend en Supabase y una
        interfaz web en tiempo real para visualizar la telemetria de filtros
        ecologicos familiares.
      </p>

      <h3 id="arch" style={S.sectionSubtitle}>
        Arquitectura del Sistema
      </h3>
      <p style={S.bodyText}>
        El filtro inteligente utiliza un microcontrolador{" "}
        <strong>ESP32 DevKit-C</strong> que recolecta datos de sensores
        analogicos (TDS, Turbidez, Nivel) y los transmite via WiFi a un
        endpoint FastAPI. Los datos se almacenan en Supabase y se visualizan en
        el dashboard comunitario protegido por autenticacion basada en roles.
      </p>
    </div>
  );

  const renderLinkDevice = () => (
    <div>
      <h2 id="request-key" style={S.sectionTitle}>
        Vincular Filtro Familiar
      </h2>
      <p style={S.bodyText}>
        Solicita una clave unica para tu filtro ecologico familiar. Podras
        ingresarla al firmware de tu microcontrolador para transmitir datos a
        Supabase y visualizar tu propio dashboard de calidad en vivo.
      </p>

      <div style={S.formCard}>
        {requestedKey ? (
          <div style={S.successBox}>
            <h4
              style={{
                color: "hsl(var(--teal-success))",
                fontFamily: "var(--font-label)",
                fontWeight: 700,
                fontSize: "1rem",
                margin: 0,
              }}
            >
              Solicitud Exitosa
            </h4>
            <p
              style={{
                color: "hsl(var(--text-secondary))",
                fontSize: "0.85rem",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Tu dispositivo ha sido registrado correctamente en Supabase de
              forma protegida.
            </p>
            <div style={S.keyDisplay}>{requestedKey}</div>
            <small
              style={{
                color: "hsl(var(--peach))",
                fontSize: "0.75rem",
                lineHeight: 1.4,
              }}
            >
              <strong>Nota:</strong> Esta clave esta inactiva temporalmente. Un
              administrador de Abaco la activara en breve para habilitar la
              telemetria.
            </small>
            <button
              style={{
                ...S.submitBtn(false),
                background: "transparent",
                border: "1px solid hsl(var(--border-active))",
                marginTop: "var(--space-xs)",
              }}
              onClick={() => setRequestedKey("")}
            >
              Pedir Otra Clave
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleRequestKey}
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}
          >
            <div>
              <label style={S.formLabel}>Tu Nombre / Identificacion</label>
              <input
                type="text"
                style={S.formInput}
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Familia Pushaina o Nombre del Creador"
                required
              />
            </div>
            <div>
              <label style={S.formLabel}>Tu Correo Electronico</label>
              <input
                type="email"
                style={S.formInput}
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                required
              />
            </div>
            <div>
              <label style={S.formLabel}>Comunidad a Monitorear</label>
              <select
                style={S.formSelect}
                value={selectedCommId}
                onChange={(e) => setSelectedCommId(e.target.value)}
                required
              >
                {communities.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    style={{ background: "#14293a", color: "#E8F4FF" }}
                  >
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {errorMsg && (
              <div
                style={{
                  color: "hsl(var(--danger))",
                  fontSize: "0.8rem",
                  lineHeight: 1.4,
                }}
              >
                {errorMsg}
              </div>
            )}

            <button type="submit" style={S.submitBtn(loading)} disabled={loading}>
              {loading ? "Registrando..." : "Solicitar Clave de Filtro"}
            </button>
          </form>
        )}
      </div>

      <h3 id="activation" style={S.sectionSubtitle}>
        Proceso de Activacion
      </h3>
      <p style={S.bodyText}>
        Despues de solicitar la clave, un administrador de la Fundacion Abaco
        revisara y activara el dispositivo. Una vez activo, el filtro comenzara a
        transmitir datos de telemetria automaticamente cada 15 segundos.
      </p>
    </div>
  );

  const renderBom = () => (
    <div>
      <h2 id="reqs" style={S.sectionTitle}>
        Requisitos del Filtro Inteligente
      </h2>
      <p style={S.bodyText}>
        El cerebro electronico esta disenado en base a hardware de bajo costo y
        facil adquisicion. Utiliza un microcontrolador{" "}
        <strong>ESP32 DevKit-C v4</strong> (Dual-core 240MHz) integrado con sensores analogicos
        robustos de grado industrial para soportar las condiciones climaticas
        extremas de La Guajira. El firmware AQUORA v2.2 utiliza 5 pines GPIO, un ADC de 12 bits (rango 0-4095) y opera a 3.3V.
      </p>

      <h3 id="bom-table" style={S.sectionSubtitle}>
        Lista de Materiales y Sensores (BOM)
      </h3>
      <div style={{ overflowX: "auto" }}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Componente</th>
              <th style={S.th}>Proposito Tecnico</th>
              <th style={S.th}>Modelo Recomendado</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["ESP32 DevKit-C v4", "Microcontrolador con antena WiFi/Bluetooth y pines ADC de 12 bits.", "ESP32-WROOM-32D"],
              ["Sensor de TDS Analogico", "Mide la pureza quimica del agua mediante conductividad (ppm).", "Gravity TDS Sensor V1.0"],
              ["Sensor de Turbidez", "Mide la claridad fisica del agua mediante diodos opticos (NTU).", "TSW-30 / Gravity Turbidity"],
              ["Sensor Ultrasonico", "Mide el volumen de agua disponible por rebote en la tapa del tanque.", "HC-SR04 / JSN-SR04T"],
            ].map(([comp, purpose, model], i) => (
              <tr key={i}>
                <td style={S.tdBold(i % 2 === 1)}>{comp}</td>
                <td style={S.td(i % 2 === 1)}>{purpose}</td>
                <td style={S.tdMono(i % 2 === 1)}>{model}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPinout = () => (
    <div>
      <h3 id="pinout-section" style={S.sectionTitle}>
        Tabla Maestra de Conexiones
      </h3>
      <p style={S.bodyText}>
        Todas las conexiones entre los sensores y el ESP32. Los tres sensores comparten el mismo rail de alimentacion 3.3V y masa comun GND.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Dispositivo</th>
              <th style={S.th}>Pin</th>
              <th style={S.th}>Cable</th>
              <th style={S.th}>ESP32 GPIO</th>
              <th style={S.th}>Tipo</th>
              <th style={S.th}>Notas</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["TDS", "VCC", "Rojo", "#e74c3c", "3V3", "Alimentacion", "3.3V, no usar 5V"],
              ["TDS", "GND", "Negro", "#555", "GND", "Tierra", "Masa comun"],
              ["TDS", "SIG/OUT", "Verde", "#2ecc71", "GPIO 34", "ADC analogico", "Solo INPUT. pinTDS = 34"],
              ["Turbidez", "VCC", "Rojo", "#e74c3c", "3V3", "Alimentacion", "3.3V, mismo rail"],
              ["Turbidez", "GND", "Negro", "#555", "GND", "Tierra", "Masa comun"],
              ["Turbidez", "SIG/OUT", "Azul", "#4a9eff", "GPIO 35", "ADC analogico", "Solo INPUT. pinTurbidity = 35"],
              ["HC-SR04", "VCC", "Rojo", "#e74c3c", "3V3", "Alimentacion", "3.3-5V. 3.3V en Wokwi"],
              ["HC-SR04", "GND", "Negro", "#555", "GND", "Tierra", "Masa comun"],
              ["HC-SR04", "TRIG", "Naranja", "#e67e22", "GPIO 5", "Digital OUT", "Pulso 10 us. pinTrigger = 5"],
              ["HC-SR04", "ECHO", "Amarillo", "#f1c40f", "GPIO 18", "Digital IN", "Pulso retorno. pinEcho = 18"],
              ["ESP32", "LED", "\u2014", "#00c8b4", "GPIO 2", "Digital OUT", "Estado WiFi. pinLED = 2"],
            ].map(([device, pin, cable, color, gpio, tipo, notas], i) => (
              <tr key={i}>
                <td style={S.tdBold(i % 2 === 1)}>{device}</td>
                <td style={S.tdMono(i % 2 === 1)}>{pin}</td>
                <td style={S.td(i % 2 === 1)}><span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />{cable}</span></td>
                <td style={S.tdMono(i % 2 === 1)}>{gpio}</td>
                <td style={S.td(i % 2 === 1)}>{tipo}</td>
                <td style={{ ...S.td(i % 2 === 1), fontSize: "0.8rem" }}>{notas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 id="pin-ref" style={S.sectionSubtitle}>Referencia Rapida de Pines Activos</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "var(--space-lg)" }}>
        {[
          { gpio: "34", name: "Sensor TDS", detail: "ADC, analogico, solo INPUT", color: "#2ecc71" },
          { gpio: "35", name: "Sensor Turbidez", detail: "ADC, analogico, solo INPUT", color: "#4a9eff" },
          { gpio: "5", name: "HC-SR04 TRIG", detail: "Digital OUTPUT, pulso 10 us", color: "#e67e22" },
          { gpio: "18", name: "HC-SR04 ECHO", detail: "Digital INPUT, pulso retorno", color: "#f1c40f" },
          { gpio: "2", name: "LED Integrado", detail: "Digital OUTPUT, estado WiFi", color: "hsl(var(--ocean))" },
        ].map((p, i) => (
          <div key={i} style={{ background: "hsla(var(--bg-surface) / 0.5)", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius-sm)", padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 500, color: p.color, minWidth: "36px" }}>{p.gpio}</span>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "hsl(var(--text-primary))" }}>{p.name}</div>
              <div style={{ fontSize: "0.72rem", color: "hsl(var(--text-dim))", fontFamily: "var(--font-mono)" }}>{p.detail}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: "0.82rem", color: "#e0a060", background: "rgba(230,126,34,0.06)", border: "1px solid rgba(230,126,34,0.15)", borderRadius: "var(--radius-sm)", padding: "0.75rem 1rem", marginBottom: "var(--space-lg)" }}>
        \u26a0\ufe0f En hardware fisico, el pin ECHO del HC-SR04 devuelve 5V. Usar divisor resistivo 1k\u03a9 / 2k\u03a9 entre ECHO y GPIO18 para no exceder los 3.3V del ESP32. GPIO34 y GPIO35 son input-only.
      </div>
    </div>
  );

  const renderArduinoSetup = () => (
    <div>
      <h2 id="code-intro" style={S.sectionTitle}>
        Configurar Entorno de Desarrollo
      </h2>
      <p style={S.bodyText}>
        Instrucciones para preparar Arduino IDE, compilar el firmware AQUORA v2.2 y subirlo al ESP32.
      </p>

      <h3 style={S.sectionSubtitle}>Pasos de Configuracion</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: "var(--space-lg)" }}>
        {[
          { num: "1", title: "Instalar Arduino IDE 2.x", desc: "Descarga desde arduino.cc/software. Version 2.3+ recomendada." },
          { num: "2", title: "Agregar soporte ESP32", desc: "Archivo > Preferencias > URLs adicionales de Gestor de Tarjetas. Pega: https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json" },
          { num: "3", title: "Instalar tarjeta ESP32", desc: "Herramientas > Placa > Gestor de Tarjetas. Busca \"esp32\" e instala \"esp32 by Espressif Systems\" v2.0+." },
          { num: "4", title: "Seleccionar placa y puerto", desc: "Herramientas > Placa > ESP32 Dev Module. Herramientas > Puerto > COMx (el puerto USB donde esta conectado el ESP32)." },
          { num: "5", title: "Editar las 3 variables clave", desc: 'En el firmware, cambia: ssid = tu red WiFi, password = tu clave WiFi, serverURL = tu URL ngrok, deviceKey = tu clave aq_api_XXXXXXXX del Panel de Aprovisionamiento.' },
          { num: "6", title: "Compilar y subir", desc: "Click en Subir (flecha). Espera a que compile (1-2 min primera vez). Abre Monitor Serial a 115200 baud para verificar." },
        ].map((step, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "36px 1fr", gap: "0 0.75rem", position: "relative" }}>
            {i < 5 && <div style={{ position: "absolute", left: "17px", top: "36px", bottom: "-8px", width: "2px", background: "hsl(var(--border))", zIndex: 0 }} />}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "0.6rem", position: "relative", zIndex: 1 }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid hsl(var(--ocean))", background: "hsla(var(--ocean) / 0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 500, color: "hsl(var(--ocean))" }}>{step.num}</div>
            </div>
            <div style={{ background: "hsla(var(--bg-surface) / 0.5)", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius-sm)", padding: "0.65rem 0.85rem", marginBottom: "10px" }}>
              <h4 style={{ fontSize: "0.82rem", fontWeight: 500, color: "hsl(var(--text-primary))", marginBottom: "4px", fontFamily: "var(--font-label)" }}>{step.title}</h4>
              <p style={{ fontSize: "0.78rem", color: "hsl(var(--text-secondary))", lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Assembly Guide */}
      <h3 id="assembly-guide" style={S.sectionSubtitle}>Guia de Montaje Paso a Paso</h3>
      <p style={S.bodyText}>
        Instrucciones de ensamblaje fisico, desde la inspeccion de la placa hasta la verificacion del sistema.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: "var(--space-lg)" }}>
        {[
          { num: "01", title: "Verifica el ESP32 DevKit-C v4", desc: "Inspecciona la placa de 38 pines. Ubica 3V3, GND.1, GPIO34, GPIO35, GPIO5, GPIO18. Confirma que el micro-USB funciona.", note: "GPIO34 y GPIO35 son input-only. No pueden usarse como salida." },
          { num: "02", title: "Conecta el rail de alimentacion (3V3 y GND)", desc: "Cable rojo de ESP32 3V3 al rail positivo de la protoboard. Cable negro de GND.1 al rail negativo. Los tres sensores se alimentan desde estos rails." },
          { num: "03", title: "Conecta el sensor TDS a GPIO34", desc: "VCC a 3V3 (rojo). GND a GND (negro). SIG/OUT a GPIO34 (verde). No compartir GPIO34 con otro componente." },
          { num: "04", title: "Conecta el sensor de Turbidez a GPIO35", desc: "VCC a 3V3 (rojo). GND a GND (negro). SIG/OUT a GPIO35 (azul). Separado de GPIO34 para evitar interferencia." },
          { num: "05", title: "Conecta HC-SR04 a GPIO5 y GPIO18", desc: "VCC a 3V3. GND a GND. TRIG a GPIO5 (naranja). ECHO a GPIO18 (amarillo). Hardware real: divisor 1k\u03a9/2k\u03a9 en ECHO.", note: "Montar en la tapa del tanque apuntando hacia abajo. tankH = 200 cm, sensorOff = 10 cm." },
          { num: "06", title: "Flashea el firmware", desc: "Abre el .ino en Arduino IDE. Selecciona ESP32 Dev Module. Edita deviceKey, ssid, password y serverURL. Compila y sube. Serial Monitor a 115200 baud." },
          { num: "07", title: "Verifica indicadores LED", desc: "Parpadeo = conectando WiFi. Fijo ON = conectado. Rapido x6 cada 15s = telemetria enviada. Apagado breve = error HTTP.", note: "Si ves [OK] Dato enviado exitosamente! con codigo 200/201, el sistema funciona correctamente." },
        ].map((step, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "50px 1fr", gap: "0 1rem", position: "relative" }}>
            {i < 6 && <div style={{ position: "absolute", left: "24px", top: "44px", bottom: "-12px", width: "2px", background: "hsl(var(--border))", zIndex: 0 }} />}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "0.75rem", position: "relative", zIndex: 1 }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid hsl(var(--ocean))", background: "hsla(var(--ocean) / 0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 500, color: "hsl(var(--ocean))" }}>{step.num}</div>
            </div>
            <div style={{ background: "hsla(var(--bg-surface) / 0.5)", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius-sm)", padding: "0.85rem 1rem", marginBottom: "16px" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 500, color: "hsl(var(--text-primary))", marginBottom: "6px", fontFamily: "var(--font-label)" }}>{step.title}</h4>
              <p style={{ fontSize: "0.82rem", color: "hsl(var(--text-secondary))", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              {step.note && (
                <div style={{ marginTop: "8px", fontSize: "0.78rem", color: "hsl(var(--sky))", background: "hsla(var(--ocean) / 0.06)", border: "1px solid hsla(var(--ocean) / 0.15)", borderRadius: "var(--radius-sm)", padding: "6px 10px" }}>
                  {step.note}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Wokwi Simulation */}
      <h3 id="wokwi-sim" style={S.sectionSubtitle}>Simulacion en Wokwi</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "var(--space-md)" }}>
        <div style={{ background: "hsla(var(--bg-surface) / 0.5)", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius-md)", padding: "1rem" }}>
          <h4 style={{ fontSize: "0.85rem", fontWeight: 500, color: "hsl(var(--text-primary))", marginBottom: "0.75rem" }}>Componentes en Wokwi</h4>
          <p style={{ fontSize: "0.82rem", color: "hsl(var(--text-secondary))", marginBottom: "8px" }}>El <code style={S.inlineCode}>diagram.json</code> usa potenciometros para simular sensores analogicos.</p>
          <ul style={{ ...S.pinList, gap: "4px" }}>
            <li style={{ ...S.pinItem, fontSize: "0.8rem" }}><span style={S.pinDot("hsl(var(--ocean))")} /><code style={S.inlineCode}>board-esp32-devkit-c-v4</code></li>
            <li style={{ ...S.pinItem, fontSize: "0.8rem" }}><span style={S.pinDot("#2ecc71")} /><code style={S.inlineCode}>wokwi-potentiometer</code> (potTDS) — GPIO34</li>
            <li style={{ ...S.pinItem, fontSize: "0.8rem" }}><span style={S.pinDot("#4a9eff")} /><code style={S.inlineCode}>wokwi-potentiometer</code> (potTurbidity) — GPIO35</li>
            <li style={{ ...S.pinItem, fontSize: "0.8rem" }}><span style={S.pinDot("#f1c40f")} /><code style={S.inlineCode}>wokwi-hc-sr04</code> (sonarLevel) — GPIO5/18</li>
          </ul>
        </div>
        <div style={{ background: "hsla(var(--bg-surface) / 0.5)", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius-md)", padding: "1rem" }}>
          <h4 style={{ fontSize: "0.85rem", fontWeight: 500, color: "hsl(var(--text-primary))", marginBottom: "0.75rem" }}>Conectividad</h4>
          <p style={{ fontSize: "0.82rem", color: "hsl(var(--text-secondary))", marginBottom: "8px" }}>WiFi simulado con acceso HTTP real a internet.</p>
          <ul style={{ ...S.pinList, gap: "4px" }}>
            <li style={{ ...S.pinItem, fontSize: "0.8rem" }}><span style={S.pinDot("hsl(var(--ocean))")} />SSID: <code style={S.inlineCode}>Wokwi-GUEST</code> (sin clave)</li>
            <li style={{ ...S.pinItem, fontSize: "0.8rem" }}><span style={S.pinDot("hsl(var(--ocean))")} />HTTP plano (no HTTPS)</li>
            <li style={{ ...S.pinItem, fontSize: "0.8rem" }}><span style={S.pinDot("hsl(var(--ocean))")} />Endpoint via <code style={S.inlineCode}>ngrok</code></li>
            <li style={{ ...S.pinItem, fontSize: "0.8rem" }}><span style={S.pinDot("hsl(var(--ocean))")} />Header: <code style={S.inlineCode}>ngrok-skip-browser-warning: 69420</code></li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderFirmwareSrc = () => (
    <div>
      <h2 id="code-block" style={S.sectionTitle}>
        Firmware C++ (ESP32) — v2.2
      </h2>
      <p style={S.bodyText}>
        Codigo fuente completo del archivo <code style={S.inlineCode}>esp32-telemetry.ino</code>.
        Incluye promedio movil de 20 muestras, reconexion WiFi automatica, indicadores LED de estado, y envio HTTP POST con header ngrok.
      </p>
      <div style={S.codeWrap}>
        <div style={S.codeHeader}>
          <span style={S.codeFilename}>esp32-telemetry.ino</span>
          <button style={S.copyBtn(copied)} onClick={handleCopy}>
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <pre style={{ ...S.pre, maxHeight: 600 }}>
          <code>{cppCode}</code>
        </pre>
      </div>

      <h3 style={S.sectionSubtitle}>Formulas de Conversion</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Sensor</th>
              <th style={S.th}>Formula</th>
              <th style={S.th}>Unidad</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["TDS", "(voltage / 2.3) \u00d7 1000", "ppm"],
              ["Turbidez", "(1.0 - voltage / 3.3) \u00d7 100", "NTU"],
              ["Nivel", "((tankH - d) / (tankH - sensorOff)) \u00d7 100", "%"],
            ].map(([sensor, formula, unit], i) => (
              <tr key={i}>
                <td style={S.tdBold(i % 2 === 1)}>{sensor}</td>
                <td style={S.tdMono(i % 2 === 1)}>{formula}</td>
                <td style={S.td(i % 2 === 1)}>{unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: "0.78rem", color: "hsl(var(--text-dim))", marginTop: "8px" }}>
        Donde <code style={S.inlineCode}>voltage = ADC \u00d7 (3.3 / 4095.0)</code>, <code style={S.inlineCode}>tankH = 200 cm</code>, <code style={S.inlineCode}>sensorOff = 10 cm</code>, <code style={S.inlineCode}>d = pulseIn \u00d7 0.01715 cm</code>.
      </p>
    </div>
  );

  const renderFaq = () => (
    <div>
      <h2 id="faq-list" style={S.sectionTitle}>
        FAQs y Solucion de Problemas
      </h2>
      <p style={S.bodyText}>
        Respuestas a las preguntas frecuentes sobre el ensamblaje de la red de
        telemetria y el mantenimiento en territorio por parte de los operarios de
        campo de la Fundacion Abaco.
      </p>

      <div>
        {FAQS.map((faq, idx) => {
          const isOpen = openFaqIdx === idx;
          return (
            <div key={idx} style={S.faqItem(isOpen)}>
              <button
                onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                style={S.faqBtn}
              >
                <span style={S.faqQ(isOpen)}>{faq.q}</span>
                <span style={S.faqChevron(isOpen)}>&#9660;</span>
              </button>
              <div
                style={{
                  maxHeight: isOpen ? 300 : 0,
                  opacity: isOpen ? 1 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.3s ease, opacity 0.25s ease",
                }}
              >
                {isOpen && <div style={S.faqBody}>{faq.a}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderJoinCommunity = () => (
    <div>
      <h2 id="postulate-comm" style={S.sectionTitle}>
        Queremos ser Comunidad
      </h2>
      <p style={S.bodyText}>
        ¿Tu comunidad rural necesita acceso a agua potable y monitoreo inteligente de calidad? 
        Postula a tu vereda o cabildo para recibir acompañamiento hídrico de la Fundación Ábaco y financiamiento tecnológico para filtros AQUORA.
      </p>

      <div style={S.formCard}>
        {commSuccess ? (
          <div style={S.successBox}>
            <h4
              style={{
                color: "hsl(var(--teal-success))",
                fontFamily: "var(--font-label)",
                fontWeight: 700,
                fontSize: "1rem",
                margin: 0,
              }}
            >
              Postulación Registrada
            </h4>
            <p
              style={{
                color: "hsl(var(--text-secondary))",
                fontSize: "0.85rem",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              La postulación de tu comunidad ha sido recibida correctamente por el equipo staff de Ábaco.
            </p>
            <div style={S.keyDisplay}>POSTULACIÓN RECIBIDA</div>
            <small
              style={{
                color: "hsl(var(--sky))",
                fontSize: "0.75rem",
                lineHeight: 1.4,
              }}
            >
              <strong>Próximo paso:</strong> El personal técnico programará una visita diagnóstica territorial para verificar las fuentes de agua locales.
            </small>
            <button
              style={{
                ...S.submitBtn(false),
                background: "transparent",
                border: "1px solid hsl(var(--border-active))",
                marginTop: "var(--space-xs)",
              }}
              onClick={() => setCommSuccess(false)}
            >
              Postular Otra Comunidad
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleRequestCommunity}
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-sm)" }}>
              <div>
                <label style={S.formLabel}>Nombre del Líder / Comunidad</label>
                <input
                  type="text"
                  style={S.formInput}
                  value={commName}
                  onChange={(e) => setCommName(e.target.value)}
                  placeholder="Líder Comunitario o Cabildo"
                  required
                />
              </div>
              <div>
                <label style={S.formLabel}>Correo Electrónico de Contacto</label>
                <input
                  type="email"
                  style={S.formInput}
                  value={commEmail}
                  onChange={(e) => setCommEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-sm)" }}>
              <div>
                <label style={S.formLabel}>Departamento</label>
                <select
                  style={S.formSelect}
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  required
                >
                  {Object.keys(locationsMap).map((dept) => (
                    <option key={dept} value={dept} style={{ background: "#14293a", color: "#E8F4FF" }}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.formLabel}>Municipio</label>
                <select
                  style={S.formSelect}
                  value={selectedMuni}
                  onChange={(e) => setSelectedMuni(e.target.value)}
                  required
                >
                  {municipalities.map((muni) => (
                    <option key={muni} value={muni} style={{ background: "#14293a", color: "#E8F4FF" }}>
                      {muni}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.formLabel}>Corregimiento / Sector</label>
                <input
                  type="text"
                  style={S.formInput}
                  value={commCorregimiento}
                  onChange={(e) => setCommCorregimiento(e.target.value)}
                  placeholder="Ej: El Pájaro"
                  required
                />
              </div>
            </div>

            <div>
              <label style={S.formLabel}>Descripción del Territorio y Problemática</label>
              <textarea
                style={{
                  ...S.formInput,
                  minHeight: "80px",
                  resize: "vertical",
                }}
                value={commDesc}
                onChange={(e) => setCommDesc(e.target.value)}
                placeholder="Por favor describe brevemente el número de familias y el estado actual de tu fuente de agua."
                required
              />
            </div>

            {commError && (
              <div
                style={{
                  color: "hsl(var(--danger))",
                  fontSize: "0.8rem",
                  lineHeight: 1.4,
                }}
              >
                {commError}
              </div>
            )}

            <button type="submit" style={S.submitBtn(commLoading)} disabled={commLoading}>
              {commLoading ? "Enviando Postulación..." : "Enviar Postulación de Comunidad"}
            </button>
          </form>
        )}
      </div>

      <h3 id="support-info" style={S.sectionSubtitle}>
        Programa de Acompañamiento Hídrico
      </h3>
      <p style={S.bodyText}>
        Ábaco apoya a las comunidades mediante la entrega sin costo de purificadores orgánicos modulares equipados con telemetría IoT de bajo consumo. 
        Además, capacitamos a la comunidad en la autogestión de repuestos y monitoreo preventivo de salud del agua.
      </p>
    </div>
  );

  // ── Map active tab → render function ───────────────
  const contentMap = {
    overview: renderOverview,
    "link-device": renderLinkDevice,
    "join-community": renderJoinCommunity,
    bom: renderBom,
    pinout: renderPinout,
    "arduino-setup": renderArduinoSetup,
    "firmware-src": renderFirmwareSrc,
    faq: renderFaq,
  };

  // ════════════════════════════════════════════════════
  //  JSX
  // ════════════════════════════════════════════════════

  return (
    <>
      {/* Inject responsive CSS */}
      <style>{S.responsiveStyle}</style>

      <div className="aquora-docs-root" style={S.root}>
        {/* ── Left Sidebar ──────────────────────────── */}
        <aside className="aquora-docs-sidebar" style={S.sidebar}>
          {SECTIONS.map((section) => (
            <div key={section.id} style={S.sidebarSection}>
              <div style={S.sidebarSectionHeader}>
                <span style={S.sidebarNum}>{section.num}</span>
                {section.label}
              </div>

              <nav>
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveItem(item.id)}
                    style={S.sidebarItem(activeItem === item.id)}
                    onMouseEnter={(e) => {
                      if (activeItem !== item.id) {
                        e.currentTarget.style.color = "hsl(var(--text-primary))";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeItem !== item.id) {
                        e.currentTarget.style.color = "hsl(var(--text-secondary))";
                      }
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </aside>

        {/* ── Center Reading Area ───────────────────── */}
        <main className="aquora-docs-center" style={S.center}>
          <div style={S.reading}>
            <h1 style={S.pageTitle}>Documentacion Open Source</h1>
            <p style={S.pageSubtitle}>
              Guia tecnica completa para ensamblar, programar y mantener el
              filtro inteligente AQUORA en comunidades rurales.
            </p>

            {/* Render active section */}
            {contentMap[activeTab] ? contentMap[activeTab]() : renderHardware()}
          </div>
        </main>

        {/* ── Right TOC Sidebar ─────────────────────── */}
        <aside className="aquora-docs-toc" style={S.toc}>
          <div style={S.tocTitle}>EN ESTA PAGINA</div>
          <nav>
            {tocEntries.map((entry) => (
              <button
                key={entry.anchor}
                style={S.tocLink}
                onClick={() => scrollToAnchor(entry.anchor)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "hsl(var(--sky))";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "hsl(var(--text-secondary))";
                }}
              >
                {entry.label}
              </button>
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
}
