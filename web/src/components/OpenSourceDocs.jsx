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
    ],
  },
  {
    id: "hardware",
    label: "HARDWARE & WIRING",
    num: "02",
    items: [
      { id: "bom", label: "Materiales de Ensamble", tab: "hardware" },
      { id: "pinout", label: "Esquema de Pines", tab: "hardware" },
    ],
  },
  {
    id: "firmware",
    label: "COMPILING FIRMWARE",
    num: "03",
    items: [
      { id: "arduino-setup", label: "Configurar Arduino IDE", tab: "code" },
      { id: "firmware-src", label: "Firmware C++ (ESP32)", tab: "code" },
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
  hardware: [
    { label: "Requisitos del Filtro", anchor: "reqs" },
    { label: "Lista de Materiales (BOM)", anchor: "bom-table" },
    { label: "Asignacion de Pines", anchor: "pinout-section" },
  ],
  code: [
    { label: "Instrucciones", anchor: "code-intro" },
    { label: "Codigo Fuente", anchor: "code-block" },
  ],
  faq: [
    { label: "Preguntas Frecuentes", anchor: "faq-list" },
  ],
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
const cppCode = `#include <WiFi.h>
#include <HTTPClient.h>

// --- CONFIGURACION DE RED WIFI ---
const char* ssid     = "Wokwi-GUEST"; // O el SSID de la comunidad
const char* password = "";            // Clave del WiFi

// --- ENLACE A LA API DE AQUORA ---
// Endpoint de ingesta segura en FastAPI
const char* serverURL = "http://127.0.0.1:8000/api/v1/readings";

// --- CLAVE UNICA DE TU FILTRO ---
// Ingresa la clave devuelta en el formulario de vinculacion
const String deviceKey = "INGRESAR_TU_CLAVE_AQUI";

// Pines de Hardware
#define PIN_TDS A0
#define PIN_TURB A1
#define PIN_TRIG 12
#define PIN_ECHO 13
#define LED_RED 2
#define LED_GREEN 4

void setup() {
  Serial.begin(115200);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    digitalWrite(LED_RED, !digitalRead(LED_RED)); // Parpadeo indica intentando red
  }
  
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, HIGH); // Luz verde indica red estable
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // 1. Lectura del sensor de TDS
    int rawTds = analogRead(PIN_TDS);
    float voltageTds = rawTds * (3.3 / 4095.0);
    float tdsValue = (133.3 * voltageTds * voltageTds * voltageTds - 255.86 * voltageTds * voltageTds + 857.39 * voltageTds) * 0.5;

    // 2. Lectura del sensor de Turbidez
    int rawTurb = analogRead(PIN_TURB);
    float voltageTurb = rawTurb * (3.3 / 4095.0);
    float turbidityValue = -1120.4 * voltageTurb * voltageTurb + 5742.3 * voltageTurb - 4352.9;
    if (turbidityValue < 0) turbidityValue = 0.0;

    // 3. Medicion de Nivel del Tanque (Ultrasonico)
    digitalWrite(PIN_TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(PIN_TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(PIN_TRIG, LOW);
    long duration = pulseIn(PIN_ECHO, HIGH);
    float distanceCm = duration * 0.034 / 2;
    float levelPercent = 100.0 - ((distanceCm / 100.0) * 100.0);
    if (levelPercent < 0) levelPercent = 0.0;
    if (levelPercent > 100) levelPercent = 100.0;

    // 4. Envio HTTP POST seguro encapsulado en JSON
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\\"device_key\\":\\"" + deviceKey + "\\"," +
                         "\\"tds_ppm\\":" + String(tdsValue, 2) + "," +
                         "\\"turbidity_ntu\\":" + String(turbidityValue, 2) + "," +
                         "\\"water_level_pct\\":" + String(levelPercent, 2) + "}";

    int responseCode = http.POST(jsonPayload);
    http.end();

    // Alerta fisica local de calidad
    if (tdsValue > 400.0 || turbidityValue > 5.0) {
      digitalWrite(LED_RED, HIGH);
    } else {
      digitalWrite(LED_RED, LOW);
    }
  }
  delay(15000);
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

export default function OpenSourceDocs() {
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
        if (!error && data) {
          setCommunities(data);
          if (data.length > 0) setSelectedCommId(data[0].id);
        }
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
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const generatedKey = `DEV_ESP32_GUAF${randomDigits}`;
      const { error } = await supabase
        .from("devices")
        .insert({
          community_id: selectedCommId,
          device_key: generatedKey,
          active: false,
        });
      if (error) throw new Error(error.message);
      setRequestedKey(generatedKey);
      setRequesterName("");
      setRequesterEmail("");
    } catch (err) {
      console.error("Error requesting key:", err);
      setErrorMsg(
        "Ocurrio un error al registrar la clave del dispositivo. Posiblemente la comunidad seleccionada ya tenga demasiados sensores enlazados."
      );
    } finally {
      setLoading(false);
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

  const renderHardware = () => (
    <div>
      <h2 id="reqs" style={S.sectionTitle}>
        Requisitos del Filtro Inteligente
      </h2>
      <p style={S.bodyText}>
        El cerebro electronico esta disenado en base a hardware de bajo costo y
        facil adquisicion. Utiliza un microcontrolador{" "}
        <strong>ESP32 DevKit-C</strong> integrado con sensores analogicos
        robustos de grado industrial para soportar las condiciones climaticas
        extremas de La Guajira.
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
              [
                "ESP32 DevKit-C v4",
                "Microcontrolador con antena WiFi/Bluetooth y pines ADC de 12 bits.",
                "ESP32-WROOM-32D",
              ],
              [
                "Sensor de TDS Analogico",
                "Mide la pureza quimica del agua mediante conductividad (ppm).",
                "Gravity TDS Sensor V1.0",
              ],
              [
                "Sensor de Turbidez",
                "Mide la claridad fisica del agua mediante diodos opticos (NTU).",
                "TSW-30 / Gravity Turbidity",
              ],
              [
                "Sensor Ultrasonico",
                "Mide el volumen de agua disponible por rebote en la tapa del tanque.",
                "HC-SR04 / JSN-SR04T",
              ],
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

      <h3 id="pinout-section" style={S.sectionSubtitle}>
        Asignacion de Pines del Microcontrolador
      </h3>
      <ul style={S.pinList}>
        {[
          { label: "TDS Analog Output", pin: "GPIO36 (ADC1_CH0)", color: "hsl(var(--ocean))" },
          { label: "Turbidez Analog Output", pin: "GPIO39 (ADC1_CH3)", color: "hsl(var(--ocean))" },
          { label: "Trigger Ultrasonico", pin: "GPIO12", color: "hsl(var(--ocean))" },
          { label: "Echo Ultrasonico", pin: "GPIO13", color: "hsl(var(--ocean))" },
          { label: "LED Rojo (Error/Mantenimiento)", pin: "GPIO2", color: "hsl(var(--danger))" },
          { label: "LED Verde (En Linea)", pin: "GPIO4", color: "hsl(var(--teal-success))" },
        ].map((p, i) => (
          <li key={i} style={S.pinItem}>
            <span style={S.pinDot(p.color)} />
            <span>
              <strong>{p.label}:</strong> Conectar al pin{" "}
              <code style={S.inlineCode}>{p.pin}</code>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderCode = () => (
    <div>
      <h2 id="code-intro" style={S.sectionTitle}>
        Cargar Firmware del Dispositivo
      </h2>
      <p style={S.bodyText}>
        Abre el codigo a continuacion en tu <strong>Arduino IDE</strong> o
        proyecto de <strong>PlatformIO</strong>. Reemplaza la direccion IP/ngrok
        del servidor y escribe la clave unica obtenida del formulario de
        vinculacion.
      </p>

      <div id="code-block" style={S.codeWrap}>
        <div style={S.codeHeader}>
          <span style={S.codeFilename}>esp32-telemetry.ino</span>
          <button style={S.copyBtn(copied)} onClick={handleCopy}>
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <pre style={S.pre}>
          <code>{cppCode}</code>
        </pre>
      </div>
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

  // ── Map active tab → render function ───────────────
  const contentMap = {
    overview: renderOverview,
    "link-device": renderLinkDevice,
    hardware: renderHardware,
    code: renderCode,
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
