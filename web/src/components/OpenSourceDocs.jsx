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
      // 1. Generate a random and unique device key
      const randomDigits = Math.floor(1000 + randomDigitsGenerator());
      const generatedKey = `DEV_ESP32_GUAF${randomDigits}`;

      function randomDigitsGenerator() {
        return Math.random() * 9000;
      }

      // 2. Insert into the devices table with active = false (Pending approval)
      const { data, error } = await supabase
        .from("devices")
        .insert({
          community_id: selectedCommId,
          device_key: generatedKey,
          active: false // Mark as INACTIVE / Pending approval
        })
        .select()
        .single();

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

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "2.5rem" }}>
      
      {/* Left side: Technical Documentation */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        <div className="card">
          <h2 style={{ fontFamily: "var(--font-title)", fontSize: "1.75rem", color: "hsl(var(--text-main))", marginBottom: "0.5rem" }}>
            🛠️ Guía de Ensamble de Hardware y Firmware Libre
          </h2>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.95rem", lineHeight: "1.6" }}>
            El ecosistema de purificación inteligente de AQUORA es completamente abierto. Aquí se detalla paso a paso cómo fabricar y flashear tu propio cerebro del filtro inteligente usando un microcontrolador <strong>ESP32 DevKit-C</strong>.
          </p>
        </div>

        {/* Step 1: Materials */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.3rem", color: "hsl(var(--primary))" }}>
            Paso 1: Lista de Materiales (BOM)
          </h3>
          <ul style={{ paddingLeft: "1.5rem", color: "hsl(var(--text-muted))", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li><strong>ESP32 DevKit-C v4:</strong> Microcontrolador integrado con conectividad WiFi y Bluetooth de bajo costo.</li>
            <li><strong>Sensor analógico de TDS (Sólidos Disueltos Totales):</strong> Para medir la pureza química del agua.</li>
            <li><strong>Módulo fotoeléctrico analógico de Turbidez:</strong> Para medir la turbidez física del agua en unidades NTU.</li>
            <li><strong>Sensor ultrasónico HC-SR04:</strong> Instalado en el tope del tanque de agua para medir el porcentaje de llenado por rebote.</li>
            <li><strong>LEDs rojo y verde:</strong> Indicadores luminosos de estado de red y alarmas hídricas locales.</li>
          </ul>
        </div>

        {/* Step 2: Code and Compiling */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.3rem", color: "hsl(var(--success))" }}>
            Paso 2: Compilación y Carga de Firmware
          </h3>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem", lineHeight: "1.6" }}>
            Descarga nuestro código fuente oficial en C++ (ubicado en <code>hardware/esp32-telemetry.ino</code>), ábrelo en VS Code con PlatformIO o en Arduino IDE, y sigue estas instrucciones de configuración:
          </p>
          <pre style={{ 
            background: "rgba(0,0,0,0.3)", 
            padding: "1rem", 
            borderRadius: "10px", 
            border: "1px solid hsl(var(--border-light))", 
            fontSize: "0.8rem", 
            color: "hsl(var(--text-main))",
            overflowX: "auto",
            lineHeight: "1.5"
          }}>
{`// --- CONFIGURACIÓN DE RED WIFI ---
const char* ssid     = "Tu_WiFi_Local"; // O "Wokwi-GUEST" en simulación
const char* password = "Tu_Contraseña";

// --- ENLACE A LA API DE AQUORA ---
// Reemplaza con la dirección IPv4 local o tu túnel público de ngrok
const char* serverURL = "http://127.0.0.1:8000/api/v1/readings";

// --- CLAVE ÚNICA DE TU FILTRO ---
// Ingresa aquí la clave generada en el panel de la derecha
const String deviceKey = "INGRESAR_TU_CLAVE_AQUÍ";`}
          </pre>
        </div>

      </div>

      {/* Right side: Device request form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        <div className="card" style={{ 
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.7) 100%)",
          border: "1px solid hsla(var(--primary) / 0.2)"
        }}>
          <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.3rem", color: "hsl(var(--text-main))", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            🔑 Vincular Filtro Inteligente
          </h3>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", marginBottom: "1.25rem", lineHeight: "1.4" }}>
            Solicita una clave única para tu filtro inteligente. Podrás ingresarla al firmware del ESP32 para inyectar datos reales y visualizarlos en tu propio panel privado de AQUORA.
          </p>

          {requestedKey ? (
            <div style={{ 
              background: "rgba(16, 185, 129, 0.1)", 
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
                Tu dispositivo ha sido registrado con éxito en la base de datos de Supabase.
              </p>
              <div style={{ 
                background: "rgba(0,0,0,0.25)", 
                padding: "0.75rem", 
                borderRadius: "8px", 
                border: "1px solid rgba(255,255,255,0.05)",
                fontSize: "1.05rem",
                fontWeight: "bold",
                color: "hsl(var(--primary))",
                fontFamily: "monospace",
                letterSpacing: "0.05em"
              }}>
                {requestedKey}
              </div>
              <small style={{ color: "hsl(var(--warning))", fontSize: "0.75rem", lineHeight: "1.3", marginTop: "0.25rem" }}>
                ⚠️ <strong>Nota:</strong> Esta clave está temporalmente inactiva. Un administrador de la Fundación Ábaco la activará en breve para habilitar la ingesta.
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
                  style={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid hsl(var(--border-light))", color: "hsl(var(--text-main))", cursor: "pointer" }}
                  value={selectedCommId}
                  onChange={(e) => setSelectedCommId(e.target.value)}
                  required
                >
                  {communities.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: "#0f172a", color: "#f8fafc" }}>
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
