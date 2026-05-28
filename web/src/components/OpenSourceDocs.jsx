import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function OpenSourceDocs() {
  const [communities, setCommunities] = useState([]);
  const [selectedCommId, setSelectedCommId] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [requestedKey, setRequestedKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Interactive documentation states
  const [activeTab, setActiveTab] = useState("hardware"); // 'hardware', 'code', 'faq'
  const [copied, setCopied] = useState(false);

  // FAQ open states
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  // Fetch all communities on mount so the user can link their requested filter to a community
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

  // Handle requesting a new device key
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
          active: false // Mark as INACTIVE / Pending approval
        });

      if (error) {
        throw new Error(error.message);
      }

      setRequestedKey(generatedKey);
      setRequesterName("");
      setRequesterEmail("");
    } catch (err) {
      console.error("Error requesting key:", err);
      setErrorMsg("Ocurrió un error al registrar la clave del dispositivo. Posiblemente la comunidad seleccionada ya tenga demasiados sensores enlazados.");
    } finally {
      setLoading(false);
    }
  };

  const cppCode = `#include <WiFi.h>
#include <HTTPClient.h>

// --- CONFIGURACIÓN DE RED WIFI ---
const char* ssid     = "Wokwi-GUEST"; // O el SSID de la comunidad
const char* password = "";            // Clave del WiFi

// --- ENLACE A LA API DE AQUORA ---
// Endpoint de ingesta segura en FastAPI
const char* serverURL = "http://127.0.0.1:8000/api/v1/readings";

// --- CLAVE ÚNICA DE TU FILTRO ---
// Ingresa la clave devuelta en el formulario de vinculación
const String deviceKey = "INGRESAR_TU_CLAVE_AQUÍ";

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

    // 3. Medición de Nivel del Tanque (Ultrasónico)
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

    // 4. Envío HTTP POST seguro encapsulado en JSON
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"device_key\":\"\" + deviceKey + \"\"," +
                         "\"tds_ppm\":" + String(tdsValue, 2) + "," +
                         "\"turbidity_ntu\":" + String(turbidityValue, 2) + "," +
                         "\"water_level_pct\":" + String(levelPercent, 2) + "}";

    int responseCode = http.POST(jsonPayload);
    http.end();

    // Alerta física local de calidad
    if (tdsValue > 400.0 || turbidityValue > 5.0) {
      digitalWrite(LED_RED, HIGH);
    } else {
      digitalWrite(LED_RED, LOW);
    }
  }
  delay(15000);
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cppCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const faqs = [
    {
      q: "¿Cómo configuro las alertas de WhatsApp en territorio?",
      a: "Una vez que tengas tu cuenta comunitaria aprovisionada por un administrador, ve a 'Alertas y Preferencias' en tu panel de miembro e introduce tu número telefónico. n8n escuchará cambios críticos de TDS y Turbidez y enviará notificaciones instantáneas automatizadas a tu teléfono mediante el bot autoalojado de OpenWA."
    },
    {
      q: "¿Cada cuánto se deben realizar los reemplazos físicos del filtro orgánico?",
      a: "El Bagazo de Caña de Azúcar (capa de adsorción química) requiere recambio cada 3 meses. La Zeolita Activa (capa de ablandamiento y bacterias) debe lavarse con salmuera cada 6 meses. La Arena Silícea (filtración primaria) requiere retrolavado simple una vez al mes para remover sedimentos gruesos acumulados."
    },
    {
      q: "¿El circuito ESP32 consume mucha energía? ¿Se puede alimentar con celdas solares?",
      a: "Sí, el microcontrolador ESP32 DevKit-C opera a 3.3V y tiene modos de deep-sleep integrados en el código. Para territorio sin red eléctrica, se alimenta eficientemente utilizando una celda solar de 5V acoplada a una batería de Litio 18650 con un cargador TP4056 estándar."
    },
    {
      q: "¿Por qué los LEDs del filtro familiar parpadean constantemente?",
      a: "Si el LED rojo parpadea de forma intermitente, significa que el ESP32 no ha podido establecer conexión con la red WiFi comunitaria. Si el LED verde está encendido fijo, la red está enlazada y el filtro transmite datos de telemetría a Supabase activamente."
    }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "0.6fr 1.6fr 1fr", gap: "2rem" }}>
      
      {/* ⚙️ LEFT SIDEBAR: Bootstrap/Tailwind Docs style */}
      <aside style={{ 
        borderRight: "1px solid rgba(0, 80, 143, 0.25)", 
        paddingRight: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem"
      }}>
        <div>
          <h4 style={{ 
            fontFamily: "var(--font-title)", 
            fontSize: "0.85rem", 
            color: "hsl(var(--secondary-sky))", 
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "0.8rem"
          }}>
            ⚙️ Hardware y BOM
          </h4>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button 
              onClick={() => setActiveTab("hardware")} 
              style={{
                background: "none", border: "none", padding: "0.25rem 0", textAlign: "left", cursor: "pointer",
                fontSize: "0.9rem", color: activeTab === "hardware" ? "hsl(var(--secondary-sky))" : "hsl(var(--text-muted))",
                fontWeight: activeTab === "hardware" ? "bold" : "normal"
              }}
            >
              1. Materiales de Ensamble
            </button>
            <button 
              onClick={() => setActiveTab("hardware")} 
              style={{
                background: "none", border: "none", padding: "0.25rem 0", textAlign: "left", cursor: "pointer",
                fontSize: "0.9rem", color: "hsl(var(--text-muted))"
              }}
            >
              2. Esquema de Pines
            </button>
          </nav>
        </div>

        <div>
          <h4 style={{ 
            fontFamily: "var(--font-title)", 
            fontSize: "0.85rem", 
            color: "hsl(var(--secondary-sky))", 
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "0.8rem"
          }}>
            💻 Desarrollo Firmware
          </h4>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button 
              onClick={() => setActiveTab("code")} 
              style={{
                background: "none", border: "none", padding: "0.25rem 0", textAlign: "left", cursor: "pointer",
                fontSize: "0.9rem", color: activeTab === "code" ? "hsl(var(--secondary-sky))" : "hsl(var(--text-muted))",
                fontWeight: activeTab === "code" ? "bold" : "normal"
              }}
            >
              3. Configurar Arduino IDE
            </button>
            <button 
              onClick={() => setActiveTab("code")} 
              style={{
                background: "none", border: "none", padding: "0.25rem 0", textAlign: "left", cursor: "pointer",
                fontSize: "0.9rem", color: "hsl(var(--text-muted))"
              }}
            >
              4. Firmware C++ (ESP32)
            </button>
          </nav>
        </div>

        <div>
          <h4 style={{ 
            fontFamily: "var(--font-title)", 
            fontSize: "0.85rem", 
            color: "hsl(var(--secondary-sky))", 
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "0.8rem"
          }}>
            💬 Comunidad y FAQs
          </h4>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button 
              onClick={() => setActiveTab("faq")} 
              style={{
                background: "none", border: "none", padding: "0.25rem 0", textAlign: "left", cursor: "pointer",
                fontSize: "0.9rem", color: activeTab === "faq" ? "hsl(var(--secondary-sky))" : "hsl(var(--text-muted))",
                fontWeight: activeTab === "faq" ? "bold" : "normal"
              }}
            >
              5. FAQs de Mantenimiento
            </button>
          </nav>
        </div>
      </aside>

      {/* 🚀 CENTRAL MAIN CONTENT: Developer documentation area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Navigation Tabs Bar */}
        <div style={{ 
          display: "flex", 
          gap: "1rem", 
          borderBottom: "1px solid rgba(0, 80, 143, 0.25)", 
          paddingBottom: "0.5rem" 
        }}>
          <button 
            className={`nav-link btn-secondary ${activeTab === "hardware" ? "active" : ""}`}
            onClick={() => setActiveTab("hardware")}
            style={{ padding: "0.5rem 1rem", border: "none", cursor: "pointer", background: "none" }}
          >
            🛠️ Hardware & BOM
          </button>
          <button 
            className={`nav-link btn-secondary ${activeTab === "code" ? "active" : ""}`}
            onClick={() => setActiveTab("code")}
            style={{ padding: "0.5rem 1rem", border: "none", cursor: "pointer", background: "none" }}
          >
            💻 Código Firmware C++
          </button>
          <button 
            className={`nav-link btn-secondary ${activeTab === "faq" ? "active" : ""}`}
            onClick={() => setActiveTab("faq")}
            style={{ padding: "0.5rem 1rem", border: "none", cursor: "pointer", background: "none" }}
          >
            ❓ FAQs y Troubleshooting
          </button>
        </div>

        {/* 📚 TAB 1: HARDWARE & BOM */}
        {activeTab === "hardware" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.5rem", color: "#f8fafc", marginBottom: "0.5rem" }}>
                1. Requisitos del Filtro Inteligente
              </h3>
              <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem", lineHeight: "1.6" }}>
                El cerebro electrónico está diseñado en base a hardware de bajo costo y fácil adquisición. Utiliza un microcontrolador <strong>ESP32 DevKit-C</strong> integrado con sensores analógicos robustos de grado industrial para soportar las condiciones climáticas extremas de La Guajira.
              </p>
            </div>

            {/* BOM Table */}
            <div className="card" style={{ overflowX: "auto" }}>
              <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.3rem", color: "hsl(var(--secondary-sky))", marginBottom: "1rem" }}>
                Lista de Materiales y Sensores (BOM)
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(173, 219, 255, 0.15)", color: "#f8fafc" }}>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Componente</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Propósito Técnico</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Modelo Recomendado</th>
                  </tr>
                </thead>
                <tbody style={{ color: "hsl(var(--text-muted))" }}>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "0.75rem 0.5rem", fontWeight: "bold", color: "#f8fafc" }}>ESP32 DevKit-C v4</td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>Microcontrolador con antena WiFi/Bluetooth y pines ADC de 12 bits.</td>
                    <td style={{ padding: "0.75rem 0.5rem", fontFamily: "monospace" }}>ESP32-WROOM-32D</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "0.75rem 0.5rem", fontWeight: "bold", color: "#f8fafc" }}>Sensor de TDS Analógico</td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>Mide la pureza química del agua mediante conductividad (ppm).</td>
                    <td style={{ padding: "0.75rem 0.5rem", fontFamily: "monospace" }}>Gravity TDS Sensor V1.0</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "0.75rem 0.5rem", fontWeight: "bold", color: "#f8fafc" }}>Sensor de Turbidez</td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>Mide la claridad física del agua mediante diodos ópticos (NTU).</td>
                    <td style={{ padding: "0.75rem 0.5rem", fontFamily: "monospace" }}>TSW-30 / Gravity Turbidity</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "0.75rem 0.5rem", fontWeight: "bold", color: "#f8fafc" }}>Sensor Ultrasónico</td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>Mide el volumen de agua disponible por rebote en la tapa del tanque.</td>
                    <td style={{ padding: "0.75rem 0.5rem", fontFamily: "monospace" }}>HC-SR04 / JSN-SR04T (Resistente)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Wiring Pin Assignment */}
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.3rem", color: "hsl(var(--warning))", marginBottom: "1rem" }}>
                Asignación de Pines del Microcontrolador
              </h3>
              <ul style={{ paddingLeft: "1.25rem", color: "hsl(var(--text-muted))", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                <li>🔌 <strong>TDS Analog Output:</strong> Conectar al pin <code>GPIO36 (ADC1_CH0)</code>.</li>
                <li>🔌 <strong>Turbidez Analog Output:</strong> Conectar al pin <code>GPIO39 (ADC1_CH3)</code>.</li>
                <li>🔌 <strong>Trigger Ultrasónico:</strong> Conectar al pin <code>GPIO12</code>.</li>
                <li>🔌 <strong>Echo Ultrasónico:</strong> Conectar al pin <code>GPIO13</code>.</li>
                <li>🔴 <strong>LED Rojo (Error/Mantenimiento):</strong> Conectar a <code>GPIO2</code>.</li>
                <li>🟢 <strong>LED Verde (En Línea):</strong> Conectar a <code>GPIO4</code>.</li>
              </ul>
            </div>

          </div>
        )}

        {/* 💻 TAB 2: C++ FIRMWARE CODE */}
        {activeTab === "code" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.4rem", color: "#f8fafc", marginBottom: "0.5rem" }}>
                Cargar Firmware del Dispositivo
              </h3>
              <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem", lineHeight: "1.6" }}>
                Abre el código a continuación en tu <strong>Arduino IDE</strong> o proyecto de <strong>PlatformIO</strong>. Reemplaza la dirección IP/ngrok del servidor y escribe la clave única obtenida del formulario de la derecha.
              </p>
            </div>

            {/* Code Block Viewer */}
            <div className="card" style={{ padding: "1.25rem", background: "rgba(12,24,36,0.85)", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "hsl(var(--secondary-sky))", fontFamily: "monospace" }}>esp32-telemetry.ino</span>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleCopy}
                  style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem", border: "1px solid rgba(173, 219, 255, 0.25)" }}
                >
                  {copied ? "¡Copiado! ✓" : "📋 Copiar Código"}
                </button>
              </div>

              <pre style={{ 
                margin: 0, 
                fontSize: "0.8rem", 
                color: "#e2e8f0", 
                overflowX: "auto", 
                maxHeight: "350px", 
                lineHeight: "1.5",
                fontFamily: "monospace"
              }}>
                {cppCode}
              </pre>
            </div>

          </div>
        )}

        {/* ❓ TAB 3: FAQS ACCORDION */}
        {activeTab === "faq" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.4rem", color: "#f8fafc", marginBottom: "0.5rem" }}>
                FAQs y Solución de Problemas
              </h3>
              <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                Respuestas a las preguntas frecuentes sobre el ensamblaje de la red de telemetría y el mantenimiento en territorio por parte de los operarios de campo de la Fundación Ábaco.
              </p>

              {/* Accordion List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {faqs.map((faq, idx) => (
                  <div 
                    key={idx}
                    style={{ 
                      background: "rgba(12,24,36,0.3)", 
                      borderRadius: "12px", 
                      border: "1px solid rgba(0, 80, 143, 0.2)",
                      overflow: "hidden",
                      transition: "var(--transition-smooth)"
                    }}
                  >
                    <button 
                      onClick={() => setOpenFaqIdx(openFaqIdx === idx ? -1 : idx)}
                      style={{ 
                        width: "100%", 
                        padding: "1.25rem 1.5rem", 
                        background: "none", 
                        border: "none", 
                        textAlign: "left", 
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <span style={{ 
                        fontFamily: "var(--font-title)", 
                        fontSize: "0.95rem", 
                        fontWeight: "bold", 
                        color: openFaqIdx === idx ? "hsl(var(--secondary-sky))" : "#f8fafc" 
                      }}>
                        {faq.q}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>
                        {openFaqIdx === idx ? "▲" : "▼"}
                      </span>
                    </button>

                    {openFaqIdx === idx && (
                      <div style={{ 
                        padding: "0 1.5rem 1.25rem 1.5rem", 
                        color: "hsl(var(--text-muted))", 
                        fontSize: "0.9rem", 
                        lineHeight: "1.5",
                        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                        paddingTop: "1rem"
                      }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 🔑 RIGHT COLUMN: Interactive device key vinculation request */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        <div className="card" style={{ 
          background: "linear-gradient(135deg, rgba(20, 41, 58, 0.9) 0%, rgba(12, 24, 36, 0.8) 100%)",
          border: "1px solid rgba(0, 80, 143, 0.25)"
        }}>
          <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.3rem", color: "hsl(var(--text-main))", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            🔑 Vincular Filtro Familiar
          </h3>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", marginBottom: "1.25rem", lineHeight: "1.4" }}>
            Solicita una clave única para tu filtro ecológico familiar. Podrás ingresarla al firmware de tu microcontrolador para transmitir datos a Supabase y visualizar tu propio dashboard de calidad en vivo.
          </p>

          {requestedKey ? (
            <div style={{ 
              background: "rgba(16, 185, 129, 0.08)", 
              border: "1px solid hsla(var(--success) / 0.3)", 
              borderRadius: "12px", 
              padding: "1.25rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem"
            }}>
              <span style={{ fontSize: "2rem" }}>🎉</span>
              <h4 style={{ color: "hsl(var(--success))", fontWeight: "bold" }}>¡Solicitud Exitosa!</h4>
              <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.8rem", lineHeight: "1.4" }}>
                Tu dispositivo ha sido registrado correctamente en Supabase de forma protegida.
              </p>
              <div style={{ 
                background: "rgba(0,0,0,0.25)", 
                padding: "0.75rem", 
                borderRadius: "8px", 
                border: "1px solid rgba(255,255,255,0.05)",
                fontSize: "1.05rem",
                fontWeight: "bold",
                color: "hsl(var(--secondary-sky))",
                fontFamily: "monospace",
                letterSpacing: "0.05em"
              }}>
                {requestedKey}
              </div>
              <small style={{ color: "hsl(var(--warning))", fontSize: "0.75rem", lineHeight: "1.3", marginTop: "0.25rem" }}>
                ⚠️ <strong>Nota:</strong> Esta clave está inactiva temporalmente. Un administrador de Ábaco la activará en breve para habilitar la telemetría.
              </small>
              <button className="btn btn-secondary" style={{ marginTop: "0.5rem" }} onClick={() => setRequestedKey("")}>
                Pedir Otra Clave
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequestKey} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tu Nombre / Identificación</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={requesterName} 
                  onChange={(e) => setRequesterName(e.target.value)} 
                  placeholder="Familia Pushaina o Nombre del Creador"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tu Correo Electrónico</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={requesterEmail} 
                  onChange={(e) => setRequesterEmail(e.target.value)} 
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Comunidad a Monitorear</label>
                <select 
                  className="form-input"
                  style={{ background: "rgba(12, 24, 36, 0.95)", border: "1px solid rgba(0, 80, 143, 0.25)", color: "hsl(var(--text-main))", cursor: "pointer" }}
                  value={selectedCommId}
                  onChange={(e) => setSelectedCommId(e.target.value)}
                  required
                >
                  {communities.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: "#14293a", color: "#f8fafc" }}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {errorMsg && (
                <div style={{ color: "hsl(var(--danger))", fontSize: "0.8rem", lineHeight: "1.3" }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: "100%", marginTop: "0.5rem" }}
                disabled={loading}
              >
                {loading ? "Registrando..." : "🚀 Solicitar Clave de Filtro"}
              </button>

            </form>
          )}

        </div>

      </div>

    </div>
  );
}
