import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function TerritorialMap({ onSelectCommunity, selectedCommunityId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load API base URL from localStorage, default to localhost:8000 with auto-correction
  const [apiUrl, setApiUrl] = useState(() => {
    let saved = localStorage.getItem("aquora_api_url");
    if (saved) {
      saved = saved.trim().replace(/\/$/, "");
      if (!/^https?:\/\//i.test(saved)) {
        saved = "http://" + saved;
      }
      if (/localhost/i.test(saved)) {
        saved = saved.replace(/localhost/i, "127.0.0.1");
      }
      if (/127\.0\.0\.1/i.test(saved)) {
        saved = saved.replace(/^https:\/\//i, "http://");
      }
      return saved;
    }
    return "http://127.0.0.1:8000";
  });
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [inputUrl, setInputUrl] = useState(apiUrl);

  // Fetch heatmap data from the active API URL
  const fetchHeatmapData = () => {
    setLoading(true);
    setError(null);
    const headers = {};
    if (apiUrl.includes("ngrok")) {
      headers["ngrok-skip-browser-warning"] = "true";
    }

    fetch(`${apiUrl}/api/v1/stats/heatmap`, { headers })
      .then((res) => {
        if (!res.ok) {
          throw new Error("La respuesta del servidor no fue satisfactoria.");
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
        // Proactively select the first community if none is selected
        if (json.length > 0 && !selectedCommunityId) {
          onSelectCommunity(json[0].community_id, json[0].name);
        }
      })
      .catch((err) => {
        console.error("Error fetching map telemetry:", err);
        setError(`No se pudo conectar a la API en: ${apiUrl}. Por favor verifica el servidor backend o actualiza la URL en los ajustes.`);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHeatmapData();
  }, [apiUrl]);

  // Handle saving the API URL with automatic protocol correction
  const handleSaveSettings = (e) => {
    e.preventDefault();
    let cleaned = inputUrl.trim().replace(/\/$/, "");
    
    // Auto-prepend http:// if no protocol is given
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = "http://" + cleaned;
    }
    
    // Convert localhost to 127.0.0.1 and convert https to http to prevent Windows loopback and SSL block
    if (/localhost/i.test(cleaned)) {
      cleaned = cleaned.replace(/localhost/i, "127.0.0.1");
    }
    if (/127\.0\.0\.1/i.test(cleaned)) {
      cleaned = cleaned.replace(/^https:\/\//i, "http://");
    }
    
    localStorage.setItem("aquora_api_url", cleaned);
    setApiUrl(cleaned);
    setShowSettingsModal(false);
  };

  // Coordonadas para centrar el mapa (Promedio de La Guajira)
  const defaultPosition = [11.378, -72.6]; 

  const getRiskColor = (risk) => {
    switch (risk) {
      case "ALTO":
        return "hsl(var(--danger))"; 
      case "MEDIO":
        return "hsl(var(--warning))"; 
      case "BAJO":
      default:
        return "hsl(var(--success))"; 
    }
  };

  return (
    <div className="card" style={{ padding: "1.5rem", position: "relative" }}>
      
      {/* Map Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-title)", fontSize: "1.5rem", color: "hsl(var(--text-main))", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            🔍 Mapa Territorial de Riesgo e Impacto
          </h2>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Vigilancia epidemiológica cruzada con telemetría IoT activa
          </p>
        </div>
        
        {/* Settings button */}
        <button 
          className="btn btn-secondary" 
          onClick={() => { setInputUrl(apiUrl); setShowSettingsModal(true); }}
          style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
        >
          ⚙️ Ajustes de API
        </button>
      </div>

      {/* API connection warning */}
      {error && (
        <div style={{ 
          background: "rgba(244, 63, 94, 0.1)", 
          border: "1px solid hsla(var(--danger) / 0.3)", 
          color: "hsl(var(--danger))", 
          borderRadius: "10px", 
          padding: "1rem", 
          marginBottom: "1.25rem", 
          fontSize: "0.85rem",
          lineHeight: "1.4"
        }}>
          ⚠️ <strong>Error de conexión:</strong> {error}
          <button 
            className="btn btn-primary" 
            onClick={() => { setInputUrl(apiUrl); setShowSettingsModal(true); }}
            style={{ display: "block", marginTop: "0.75rem", padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
          >
            Configurar URL del Servidor
          </button>
        </div>
      )}

      {/* Main Map Container */}
      <div style={{ height: "580px", width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid hsl(var(--border-light))", position: "relative" }}>
        
        {loading && (
          <div style={{ 
            position: "absolute", 
            top: 0, left: 0, right: 0, bottom: 0, 
            background: "rgba(15, 23, 42, 0.85)", 
            display: "flex", alignItems: "center", justifyContent: "center", 
            zIndex: 1000, 
            backdropFilter: "blur(4px)" 
          }}>
            <p style={{ color: "hsl(var(--primary))", fontWeight: "bold", animation: "pulse 1.5s infinite" }}>
              ⏳ Sincronizando datos de sensores...
            </p>
          </div>
        )}

        {/* Floating Real-Time Monitoring Overlay */}
        <div style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 1000,
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "8px",
          padding: "0.6rem 0.9rem",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          boxShadow: "var(--shadow-card)",
          pointerEvents: "none"
        }}>
          <span className="pulse-indicator" style={{ background: "hsl(var(--primary))", boxShadow: "0 0 8px hsla(var(--primary) / 0.7)" }}></span>
          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-title)", fontWeight: "bold", color: "hsl(var(--text-main))", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Vigilancia Activa SIVIGILA
          </span>
        </div>

        <MapContainer center={defaultPosition} zoom={9} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          {/* Custom Sleek Dark TileLayer from CartoDB */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {!loading && !error && data.map((comm) => {
            const isSelected = comm.community_id === selectedCommunityId;
            const riskColor = getRiskColor(comm.sanitary_risk);
            
            return (
              <CircleMarker
                key={comm.community_id}
                center={[comm.latitude, comm.longitude]}
                radius={isSelected ? 18 : 11}
                fillColor={riskColor}
                color={isSelected ? "hsl(var(--primary))" : "#ffffff"}
                weight={isSelected ? 3 : 1.5}
                fillOpacity={isSelected ? 0.85 : 0.65}
                className={isSelected ? "leaflet-marker-selected" : "leaflet-marker-normal"}
                style={{ transition: "all 0.3s ease" }}
              >
                <Popup minWidth={240}>
                  <div style={{ fontFamily: "var(--font-body)", color: "#1e293b", fontSize: "0.85rem", lineHeight: "1.5" }}>
                    <h4 style={{ fontFamily: "var(--font-title)", fontWeight: 800, fontSize: "1.1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem", marginBottom: "0.5rem", color: "#0f172a" }}>
                      📍 {comm.name}
                    </h4>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <strong style={{ color: "#475569" }}>Riesgo Sanitario:</strong>
                      <span style={{ 
                        display: "inline-block", 
                        padding: "0.15rem 0.5rem", 
                        borderRadius: "9999px", 
                        fontSize: "0.7rem", 
                        fontWeight: 800,
                        backgroundColor: comm.sanitary_risk === "ALTO" ? "rgba(244,63,94,0.15)" : comm.sanitary_risk === "MEDIO" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
                        color: comm.sanitary_risk === "ALTO" ? "hsl(var(--danger))" : comm.sanitary_risk === "MEDIO" ? "hsl(var(--warning))" : "hsl(var(--success))"
                      }}>
                        {comm.sanitary_risk}
                      </span>
                    </div>

                    <p style={{ margin: "0.25rem 0" }}>🧪 <strong>TDS:</strong> {comm.current_tds_ppm.toFixed(1)} ppm</p>
                    <p style={{ margin: "0.25rem 0" }}>💧 <strong>Turbidez:</strong> {comm.current_turbidity_ntu.toFixed(2)} NTU</p>
                    <p style={{ margin: "0.25rem 0" }}>🪣 <strong>Volumen Nivel:</strong> {comm.current_water_level_pct.toFixed(1)}%</p>
                    <p style={{ margin: "0.25rem 0" }}>😷 <strong>Casos EDA Históricos:</strong> {comm.average_eda_cases.toFixed(1)} / sem</p>
                    
                    <div style={{ fontSize: "0.7rem", color: "#64748b", borderTop: "1px solid #f1f5f9", marginTop: "0.5rem", paddingTop: "0.4rem" }}>
                      Última señal: {comm.last_update !== "Sin datos" ? new Date(comm.last_update).toLocaleTimeString() : "Nunca"}
                    </div>

                    <button 
                      onClick={() => onSelectCommunity(comm.community_id, comm.name)}
                      style={{ 
                        marginTop: "0.75rem", 
                        width: "100%", 
                        padding: "0.5rem", 
                        background: "#0ea5e9", 
                        color: "#ffffff", 
                        border: "none", 
                        borderRadius: "6px", 
                        fontSize: "0.8rem", 
                        fontWeight: "bold", 
                        cursor: "pointer",
                        transition: "background 0.2s"
                      }}
                      onMouseOver={(e) => e.target.style.background = "#0284c7"}
                      onMouseOut={(e) => e.target.style.background = "#0ea5e9"}
                    >
                      📊 Ver Análisis Histórico
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", fontSize: "0.8rem", flexWrap: "wrap", color: "hsl(var(--text-muted))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "hsl(var(--danger))", display: "inline-block" }}></span>
          Riesgo Alto (Brote Epidemiológico / Sequía)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "hsl(var(--warning))", display: "inline-block" }}></span>
          Riesgo Medio (Alerta Preventiva)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "hsl(var(--success))", display: "inline-block" }}></span>
          Riesgo Bajo (Agua Segura e Hidratación)
        </div>
      </div>

      {/* API Configuration Modal */}
      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.25rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              ⚙️ Ajustes de API (AQUORA Core)
            </h3>
            <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", marginBottom: "1.25rem", lineHeight: "1.4" }}>
              Configura el endpoint de FastAPI de forma dinámica. Útil para conectar Wokwi a través de túneles de <strong>ngrok</strong> en la hackathon.
            </p>
            
            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label className="form-label">URL del Servidor Backend</label>
                <input 
                  type="url" 
                  className="form-input" 
                  value={inputUrl} 
                  onChange={(e) => setInputUrl(e.target.value)} 
                  placeholder="https://xxxx.ngrok-free.app"
                  required
                />
                <small style={{ display: "block", color: "hsl(var(--text-dark))", marginTop: "0.4rem", fontSize: "0.75rem" }}>
                  Por defecto: <code>http://localhost:8000</code>. Asegúrate de incluir <code>http://</code> o <code>https://</code>.
                </small>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowSettingsModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
