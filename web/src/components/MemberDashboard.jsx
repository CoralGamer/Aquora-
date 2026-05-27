import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import TelemetryCharts from "./TelemetryCharts";

export default function MemberDashboard({ userProfile, getApiUrl }) {
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState(null);
  const [latestReading, setLatestReading] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  
  // Notification preference states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [tdsThreshold, setTdsThreshold] = useState(400);
  const [turbThreshold, setTurbThreshold] = useState(5.0);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState(false);

  // Fetch telemetry data for the user's specific filter device
  const fetchTelemetry = async () => {
    if (!userProfile.device_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 1. Fetch device key information
      const { data: devData, error: devErr } = await supabase
        .from("devices")
        .select("id, device_key, active")
        .eq("id", userProfile.device_id)
        .single();

      if (devErr) throw devErr;
      setDevice(devData);

      // 2. Fetch latest telemetry reading
      const { data: readData, error: readErr } = await supabase
        .from("sensor_readings")
        .select("tds_ppm, turbidity_ntu, water_level_pct, timestamp")
        .eq("device_id", userProfile.device_id)
        .order("timestamp", { ascending: false })
        .limit(1);

      if (!readErr && readData && readData.length > 0) {
        setLatestReading(readData[0]);
      }

      // 3. Fetch history for Recharts via the backend API securely
      const apiUrl = getApiUrl();
      const headers = {};
      if (apiUrl.includes("ngrok")) {
        headers["ngrok-skip-browser-warning"] = "true";
      }

      const res = await fetch(`${apiUrl}/api/v1/readings/history/${userProfile.device_id}`, { headers });
      if (res.ok) {
        const json = await res.json();
        setHistoryData(json);
      } else {
        // Fallback to local database query if backend is slow
        const { data: histData } = await supabase
          .from("sensor_readings")
          .select("tds_ppm, turbidity_ntu, water_level_pct, timestamp")
          .eq("device_id", userProfile.device_id)
          .order("timestamp", { ascending: false })
          .limit(20);
        
        if (histData) {
          const formatted = histData.map(row => ({
            timestamp: new Date(row.timestamp).toLocaleTimeString(),
            tds: row.tds_ppm,
            turbidity: row.turbidity_ntu,
            level: row.water_level_pct
          })).reverse();
          setHistoryData(formatted);
        }
      }

    } catch (err) {
      console.error("Error fetching member telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();

    // Populate notification preferences from user profile metadata
    if (userProfile.notification_preferences) {
      const prefs = userProfile.notification_preferences;
      setEmailAlerts(prefs.email !== false);
      setTdsThreshold(prefs.tds_threshold || 400);
      setTurbThreshold(prefs.turbidity_threshold || 5.0);
    }
  }, [userProfile]);

  // Handle saving user notification preferences in Supabase JSONB column
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefSuccess(false);

    try {
      const updatedPrefs = {
        email: emailAlerts,
        whatsapp: false,
        tds_threshold: parseFloat(tdsThreshold),
        turbidity_threshold: parseFloat(turbThreshold)
      };

      const { error } = await supabase
        .from("user_profiles")
        .update({ notification_preferences: updatedPrefs })
        .eq("id", userProfile.id);

      if (error) throw error;
      
      setPrefSuccess(true);
      setTimeout(() => setPrefSuccess(false), 4000);
    } catch (err) {
      console.error("Failed saving preferences:", err);
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: "4rem", textAlign: "center" }}>
        <p className="pulse-indicator" style={{ background: "hsl(var(--primary))", width: "12px", height: "12px" }}></p>
        <p style={{ marginTop: "1rem", color: "hsl(var(--text-muted))" }}>Sincronizando la señal de tu filtro familiar...</p>
      </div>
    );
  }

  // If the member has no filter device assigned to their account yet
  if (!userProfile.device_id) {
    return (
      <div className="card" style={{ padding: "3rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "600px", margin: "2rem auto" }}>
        <span style={{ fontSize: "3rem" }}>🪣</span>
        <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.5rem", color: "hsl(var(--text-main))" }}>
          Sin Filtro Vinculado
        </h3>
        <p style={{ color: "hsl(var(--text-muted))", lineHeight: "1.6", fontSize: "0.95rem" }}>
          Hola <strong>{userProfile.full_name || "Miembro de la Comunidad"}</strong>. Aún no tienes un filtro inteligente <strong>AQUORA</strong> asignado a tu cuenta.
        </p>
        <p style={{ color: "hsl(var(--text-muted))", lineHeight: "1.6", fontSize: "0.95rem" }}>
          Por favor, solicita una clave única en la sección de <strong>Documentación Open Source</strong> del portal público y contacta a un administrador de la Fundación Ábaco para que enlace tu dispositivo a este perfil.
        </p>
      </div>
    );
  }

  const isTdsUnsafe = latestReading && latestReading.tds_ppm > tdsThreshold;
  const isTurbUnsafe = latestReading && latestReading.turbidity_ntu > turbThreshold;
  const isLevelCritical = latestReading && latestReading.water_level_pct < 20;
  const needsMaintenance = isTdsUnsafe || isTurbUnsafe || isLevelCritical;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      
      {/* ⚠️ Critical Sanitary Alert Banner */}
      {needsMaintenance && (
        <div style={{ 
          background: "linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(244, 63, 94, 0.05) 100%)", 
          border: "1px solid hsla(var(--danger) / 0.4)", 
          borderRadius: "16px", 
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          boxShadow: "0 10px 35px -10px rgba(244, 63, 94, 0.15)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.75rem" }}>⚠️</span>
            <h4 style={{ color: "hsl(var(--danger))", fontFamily: "var(--font-title)", fontSize: "1.2rem", fontWeight: "bold", margin: 0 }}>
              ¡ALERTA HÍDRICA: TU FILTRO REQUIERE MANTENIMIENTO!
            </h4>
          </div>
          <p style={{ color: "hsl(var(--text-main))", fontSize: "0.95rem", lineHeight: "1.5", margin: 0 }}>
            Los sensores de tu filtro familiar han detectado parámetros fuera de los rangos seguros:
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", color: "hsl(var(--text-muted))", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {isTdsUnsafe && <li>El nivel de Sólidos Disueltos (<strong>{latestReading.tds_ppm} ppm</strong>) supera tu umbral saludable configurado de {tdsThreshold} ppm.</li>}
              {isTurbUnsafe && <li>La Turbidez del agua (<strong>{latestReading.turbidity_ntu} NTU</strong>) supera el umbral límite de {turbThreshold} NTU.</li>}
              {isLevelCritical && <li>El volumen del tanque de agua está críticamente bajo (<strong>{latestReading.water_level_pct}%</strong>).</li>}
            </ul>
          </p>
          <small style={{ color: "hsl(var(--warning))", fontSize: "0.8rem", marginTop: "0.25rem" }}>
            👉 **Recomendación:** Por favor, procede a lavar o reemplazar las capas filtrantes orgánicas de **Bagazo de Caña de Azúcar** o **Zeolita Activa** como se especifica en la guía de hardware.
          </small>
        </div>
      )}

      {/* Top Section: Quick Metrics & Settings */}
      <div style={{ display: "grid", gridTemplateColumns: "1.62fr 1fr", gap: "2.5rem" }}>
        
        {/* Left Card: Dynamic Gauges / Sensor Data */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid hsl(var(--border-light))", paddingBottom: "1rem" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.35rem", color: "hsl(var(--text-main))", margin: 0 }}>
                🪣 Telemetría Familiar en Vivo
              </h3>
              <p style={{ color: "hsl(var(--text-dark))", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                Identificador del Dispositivo: <code style={{ color: "hsl(var(--primary))", fontFamily: "monospace" }}>{device?.device_key}</code>
              </p>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(16, 185, 129, 0.08)", padding: "0.4rem 0.8rem", borderRadius: "30px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <span className="pulse-indicator"></span>
              <span style={{ fontSize: "0.75rem", color: "hsl(var(--success))", fontWeight: "bold" }}>EN LÍNEA</span>
            </div>
          </div>

          {latestReading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
              <div style={{ background: "rgba(0,0,0,0.18)", padding: "1.25rem", borderRadius: "12px", border: "1px solid hsl(var(--border-light))", textAlign: "center" }}>
                <span style={{ fontSize: "1.75rem" }}>🧪</span>
                <span style={{ display: "block", fontSize: "0.75rem", color: "hsl(var(--text-dark))", textTransform: "uppercase", fontWeight: "bold", marginTop: "0.5rem" }}>Pureza (TDS)</span>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: isTdsUnsafe ? "hsl(var(--danger))" : "hsl(var(--primary))", marginTop: "0.25rem" }}>
                  {latestReading.tds_ppm.toFixed(1)} <span style={{ fontSize: "0.8rem" }}>ppm</span>
                </div>
              </div>

              <div style={{ background: "rgba(0,0,0,0.18)", padding: "1.25rem", borderRadius: "12px", border: "1px solid hsl(var(--border-light))", textAlign: "center" }}>
                <span style={{ fontSize: "1.75rem" }}>🌫️</span>
                <span style={{ display: "block", fontSize: "0.75rem", color: "hsl(var(--text-dark))", textTransform: "uppercase", fontWeight: "bold", marginTop: "0.5rem" }}>Claridad (Turbidez)</span>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: isTurbUnsafe ? "hsl(var(--danger))" : "hsl(var(--warning))", marginTop: "0.25rem" }}>
                  {latestReading.turbidity_ntu.toFixed(2)} <span style={{ fontSize: "0.8rem" }}>NTU</span>
                </div>
              </div>

              <div style={{ background: "rgba(0,0,0,0.18)", padding: "1.25rem", borderRadius: "12px", border: "1px solid hsl(var(--border-light))", textAlign: "center" }}>
                <span style={{ fontSize: "1.75rem" }}>🪣</span>
                <span style={{ display: "block", fontSize: "0.75rem", color: "hsl(var(--text-dark))", textTransform: "uppercase", fontWeight: "bold", marginTop: "0.5rem" }}>Nivel Tanque</span>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: isLevelCritical ? "hsl(var(--danger))" : "hsl(var(--success))", marginTop: "0.25rem" }}>
                  {latestReading.water_level_pct.toFixed(1)}%
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "hsl(var(--text-muted))" }}>
              Aún no se han recibido lecturas de tu filtro inteligente en Supabase. Enciende tu simulación de Wokwi para transmitir datos.
            </div>
          )}

          <div style={{ fontSize: "0.75rem", color: "hsl(var(--text-dark))", textAlign: "right" }}>
            Última actualización: {latestReading ? new Date(latestReading.timestamp).toLocaleString() : "Sin registros"}
          </div>
        </div>

        {/* Right Card: Notification preferences */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.25rem", color: "hsl(var(--text-main))", margin: 0, borderBottom: "1px solid hsl(var(--border-light))", paddingBottom: "0.75rem" }}>
            ⚙️ Alertas y Preferencias
          </h3>
          
          <form onSubmit={handleSavePreferences} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.25rem 0" }}>
              <label className="form-label" style={{ margin: 0 }}>Alertas por Correo</label>
              <input 
                type="checkbox" 
                style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "hsl(var(--primary))" }}
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Alarma Sólidos TDS Máximo (ppm)</label>
              <input 
                type="number" 
                className="form-input" 
                value={tdsThreshold} 
                onChange={(e) => setTdsThreshold(e.target.value)} 
                min="50" 
                max="1000"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Alarma Turbidez Máxima (NTU)</label>
              <input 
                type="number" 
                step="0.1" 
                className="form-input" 
                value={turbThreshold} 
                onChange={(e) => setTurbThreshold(e.target.value)} 
                min="0.5" 
                max="20"
                required
              />
            </div>

            {prefSuccess && (
              <div style={{ color: "hsl(var(--success))", fontSize: "0.8rem", fontWeight: "bold" }}>
                ✓ ¡Preferencias guardadas exitosamente en Supabase!
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: "100%", marginTop: "0.5rem" }}
              disabled={savingPrefs}
            >
              {savingPrefs ? "Guardando..." : "Guardar Preferencias"}
            </button>

          </form>
        </div>

      </div>

      {/* Historical charts curves */}
      {historyData.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.35rem", color: "hsl(var(--text-main))", margin: 0 }}>
            📈 Curvas de Tendencia Histórica de tu Filtro
          </h3>
          <TelemetryCharts data={historyData} />
        </div>
      )}

    </div>
  );
}
