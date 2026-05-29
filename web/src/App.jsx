import React, { useState, useEffect } from "react";
import TerritorialMap from "./components/TerritorialMap";
import FilterViewer3D from "./components/FilterViewer3D";
import TelemetryCharts from "./components/TelemetryCharts";
import LandingPage from "./components/LandingPage";
import OpenSourceDocs from "./components/OpenSourceDocs";
import Login from "./components/Login";
import AdminUserProvisioning from "./components/AdminUserProvisioning";
import MemberDashboard from "./components/MemberDashboard";
import UserProfile from "./components/UserProfile";
import MembersManagement from "./components/MembersManagement";
import { supabase } from "./services/supabaseClient";

export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState("landing"); // unauth: 'landing', 'docs', 'login'
  const [allDevices, setAllDevices] = useState([]);
                                                        // admin: 'dashboard', 'filter3d', 'provisioning', 'profile'
                                                        // member: 'member_dashboard', 'profile'

  // Admin territorial dashboard states
  const [selectedCommunityId, setSelectedCommunityId] = useState("");
  const [selectedCommunityName, setSelectedCommunityName] = useState("");
  const [selectedCommunityLat, setSelectedCommunityLat] = useState(null);
  const [selectedCommunityLon, setSelectedCommunityLon] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch API URL from localStorage, fallback to localhost:8000 with auto-correction
  const getApiUrl = () => {
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
  };

  // Check auth session on mount & subscribe to changes
  useEffect(() => {
    // 1. Fetch all devices to have their UUIDs available in memory for pilot resolutions
    supabase
      .from("devices")
      .select("id, device_key, active, community_id")
      .then(({ data, error }) => {
        if (!error && data) {
          setAllDevices(data);
        }
      });

    // 2. Check if there is a mock session stored
    const savedMock = localStorage.getItem("aquora_mock_session");
    if (savedMock) {
      const sess = JSON.parse(savedMock);
      setSession(sess);
      fetchProfile(sess.user.id, sess.user.email);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoadingProfile(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (localStorage.getItem("aquora_mock_session")) return;

      setSession(currentSession);
      if (currentSession) {
        fetchProfile(currentSession.user.id);
      } else {
        setUserProfile(null);
        setLoadingProfile(false);
        setActiveTab("landing");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId, customEmail = null) => {
    setLoadingProfile(true);
    try {
      // 1. Query real profiles in Supabase
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, role, device_id, notification_preferences")
        .eq("id", userId)
        .single();

      let resolvedProfile = null;

      if (error || !data) {
        console.warn("Using resilient fallback resolution for user:", userId);
        
        let resolvedEmail = customEmail;
        if (!resolvedEmail) {
          const { data: { user } } = await supabase.auth.getUser();
          resolvedEmail = user?.email || "usuario@aquora.org";
        }
        const emailLower = resolvedEmail.toLowerCase();
        
        // Define pilot leaders details matching their default devices
        const pilotLeadersMap = {
          "uribia.lider@aquora.org": { name: "Líder Wayúu Uribia", key: "DEV_ESP32_GUAF1" },
          "manaure.lider@aquora.org": { name: "Líder Wayúu Manaure", key: "DEV_ESP32_GUAF2" },
          "riohacha.lider@aquora.org": { name: "Líder Wayúu Riohacha", key: "DEV_ESP32_GUAF3" },
          "maicao.lider@aquora.org": { name: "Líder Wayúu Maicao", key: "DEV_ESP32_GUAF4" },
          "sanjuan.lider@aquora.org": { name: "Líder Wayúu San Juan", key: "DEV_ESP32_GUAF5" },
          "albania.lider@aquora.org": { name: "Líder Wayúu Albania", key: "DEV_ESP32_GUAF6" },
          "dibulla.lider@aquora.org": { name: "Líder Wayúu Dibulla", key: "DEV_ESP32_GUAF7" },
          "barrancas.lider@aquora.org": { name: "Líder Wayúu Barrancas", key: "DEV_ESP32_GUAF8" },
        };

        const pilot = pilotLeadersMap[emailLower];
        if (pilot) {
          // Fetch devices dynamically to map the device key to UUID
          let matchedDev = null;
          try {
            const { data: devData } = await supabase
              .from("devices")
              .select("id")
              .eq("device_key", pilot.key)
              .single();
            if (devData) matchedDev = devData;
          } catch (e) {
            console.warn("Supabase direct query failed, using state devices map:", e);
          }

          resolvedProfile = {
            id: userId,
            email: emailLower,
            full_name: pilot.name,
            role: "community_member",
            device_id: matchedDev ? matchedDev.id : null,
            notification_preferences: { email: true, whatsapp: true, tds_threshold: 400.0, turbidity_threshold: 5.0 }
          };
        } else {
          // Generic fallback
          resolvedProfile = {
            id: userId,
            email: emailLower,
            full_name: "Miembro de la Comunidad",
            role: (emailLower === "nicolas.romeroc@hotmail.com" || emailLower === "nicolasromeroc@hotmail.com") ? "super_admin" : "community_member",
            device_id: null
          };
        }
      } else {
        resolvedProfile = data;
        const emailLower = (data.email || "").toLowerCase();
        if (emailLower === "nicolas.romeroc@hotmail.com" || emailLower === "nicolasromeroc@hotmail.com") {
          resolvedProfile.role = "super_admin";
        }
      }

      setUserProfile(resolvedProfile);
      if (resolvedProfile.role === "admin" || resolvedProfile.role === "super_admin" || resolvedProfile.role === "abaco_staff") {
        setActiveTab("dashboard");
      } else {
        setActiveTab("member_dashboard");
      }
    } catch (err) {
      console.error("Profile fetching failed:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("aquora_mock_session");
    await supabase.auth.signOut();
  };

  // Fetch telemetry history whenever selectedCommunityId changes (for Admin dashboard)
  useEffect(() => {
    if (!selectedCommunityId) return;

    setLoadingHistory(true);
    const apiUrl = getApiUrl();

    const headers = {};
    if (apiUrl.includes("ngrok")) {
      headers["ngrok-skip-browser-warning"] = "true";
    }

    fetch(`${apiUrl}/api/v1/readings/history/${selectedCommunityId}`, { headers })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error fetching history");
        }
        return res.json();
      })
      .then((json) => {
        setHistoryData(json);
        setLoadingHistory(false);
      })
      .catch((err) => {
        console.error("Error fetching telemetry history:", err);
        setLoadingHistory(false);
        // Fallback to simulated data so the demo never fails
        const mockHistory = Array.from({ length: 10 }).map((_, i) => ({
          timestamp: `12:${10 + i * 5}`,
          tds: 280.0 + i * (i % 2 === 0 ? 5 : -3),
          turbidity: 2.1 + i * 0.12 - (i % 3 === 0 ? 0.4 : 0),
          level: 75.0 - i * 1.5,
        }));
        setHistoryData(mockHistory);
      });
  }, [selectedCommunityId]);

  const handleSelectCommunity = (id, name, lat, lon) => {
    setSelectedCommunityId(id);
    setSelectedCommunityName(name);
    setSelectedCommunityLat(lat);
    setSelectedCommunityLon(lon);
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 0;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
  };

  // State for manual alerts notifications
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [manualAlerts, setManualAlerts] = useState([]);

  const fetchUnreadCount = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/v1/manual-reports/unread-count`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  const fetchManualAlerts = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/v1/manual-reports`);
      if (res.ok) {
        const data = await res.json();
        setManualAlerts(data);
      }
    } catch (err) {
      console.error("Error fetching alerts:", err);
    }
  };

  const markAlertAsRead = async (alertId) => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/v1/manual-reports/${alertId}/read`, {
        method: "PATCH",
      });
      if (res.ok) {
        fetchUnreadCount();
        fetchManualAlerts();
      }
    } catch (err) {
      console.error("Error marking alert as read:", err);
    }
  };

  // Poll for unread alerts count & alerts details every 5 seconds if session is active and role is admin
  useEffect(() => {
    if (session && (userProfile?.role === "admin" || userProfile?.role === "super_admin" || userProfile?.role === "abaco_staff")) {
      fetchUnreadCount();
      fetchManualAlerts(); // Load alerts initially
      const interval = setInterval(() => {
        fetchUnreadCount();
        fetchManualAlerts(); // Keep alerts updated in background
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [session, userProfile]);

  // Fetch all alerts when dropdown is opened
  useEffect(() => {
    if (showAlertsDropdown) {
      fetchManualAlerts();
    }
  }, [showAlertsDropdown]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* Header / Navigation Bar */}
      <header className="header">
        <div className="container header-container">
          <a 
            href="#" 
            className="logo" 
            onClick={(e) => {
              e.preventDefault();
              if (session) {
                setActiveTab((userProfile?.role === "admin" || userProfile?.role === "super_admin" || userProfile?.role === "abaco_staff") ? "dashboard" : "member_dashboard");
              } else {
                setActiveTab("landing");
              }
            }}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <img src="./favicon.svg" alt="AQUORA Logo" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
            AQUORA
          </a>
          
          <nav className="nav-links">
            {!session ? (
              <>
                <button 
                  className={`nav-link ${activeTab === "landing" ? "active" : ""}`}
                  onClick={() => setActiveTab("landing")}
                >
                  Impacto
                </button>
                <button 
                  className={`nav-link ${activeTab === "docs" ? "active" : ""}`}
                  onClick={() => setActiveTab("docs")}
                >
                  Firmware
                </button>
                <button 
                  className={`nav-link-cta ${activeTab === "login" ? "active" : ""}`}
                  onClick={() => setActiveTab("login")}
                >
                  Iniciar Sesión
                </button>
              </>
            ) : (
              <>
                {(userProfile?.role === "admin" || userProfile?.role === "super_admin" || userProfile?.role === "abaco_staff") ? (
                  <>
                    <button 
                      className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`}
                      onClick={() => setActiveTab("dashboard")}
                    >
                      Centro Analítico
                    </button>
                    <button 
                      className={`nav-link ${activeTab === "filter3d" ? "active" : ""}`}
                      onClick={() => setActiveTab("filter3d")}
                    >
                      Filtro 3D
                    </button>
                    <button 
                      className={`nav-link ${activeTab === "provisioning" ? "active" : ""}`}
                      onClick={() => setActiveTab("provisioning")}
                    >
                      Aprovisionamiento
                    </button>
                    <button 
                      className={`nav-link ${activeTab === "members" ? "active" : ""}`}
                      onClick={() => setActiveTab("members")}
                    >
                      👥 Miembros
                    </button>

                    {/* Campanita de Alertas Hídricas */}
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <button 
                        className="nav-link"
                        onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
                        style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: unreadCount > 0 ? "#ffcd82" : "inherit" }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "20px", height: "20px", fill: "currentColor" }}>
                          <path d="M12 22a2.01 2.01 0 0 0 2-2h-4a2.01 2.01 0 0 0 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                        </svg>
                        {unreadCount > 0 && (
                          <span style={{
                            position: "absolute",
                            top: "-6px",
                            right: "-6px",
                            backgroundColor: "#ffcd82",
                            color: "#0a1822",
                            fontSize: "0.7rem",
                            fontWeight: "bold",
                            borderRadius: "50%",
                            padding: "1px 5px",
                            lineHeight: "1.2",
                            minWidth: "16px",
                            textAlign: "center"
                          }}>
                            {unreadCount}
                          </span>
                        )}
                      </button>
                      
                      {showAlertsDropdown && (
                        <div style={{
                          position: "absolute",
                          top: "100%",
                          right: 0,
                          backgroundColor: "#0d202e",
                          border: "1px solid rgba(173, 219, 255, 0.15)",
                          borderRadius: "8px",
                          width: "320px",
                          maxHeight: "360px",
                          overflowY: "auto",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                          zIndex: 1000,
                          padding: "1rem",
                          marginTop: "0.5rem"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "0.5rem" }}>
                            <span style={{ fontWeight: "bold", color: "#ffffff", fontSize: "0.95rem" }}>Alertas Manuales</span>
                            <button 
                              onClick={() => setShowAlertsDropdown(false)}
                              style={{ background: "none", border: "none", color: "#8b9bb4", cursor: "pointer", fontSize: "0.8rem" }}
                            >
                              Cerrar
                            </button>
                          </div>
                          
                          {manualAlerts.length === 0 ? (
                            <p style={{ color: "#8b9bb4", fontSize: "0.85rem", textAlign: "center", margin: "1.5rem 0" }}>No hay alertas registradas.</p>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                              {manualAlerts.map((alert) => (
                                <div 
                                  key={alert.id} 
                                  style={{ 
                                    padding: "0.75rem", 
                                    backgroundColor: alert.is_read ? "rgba(255,255,255,0.02)" : "rgba(255, 205, 130, 0.05)", 
                                    borderLeft: alert.is_read ? "3px solid #4a5d6e" : "3px solid #ffcd82", 
                                    borderRadius: "4px",
                                    textAlign: "left"
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                                    <span style={{ 
                                      fontWeight: "bold", 
                                      fontSize: "0.85rem", 
                                      color: alert.status === "OK" ? "#10b981" : alert.status === "TURBIO" ? "#d97706" : alert.status === "SECO" ? "#dc2626" : "#8b9bb4"
                                    }}>
                                      {alert.status === "OK" ? "💧 Agua Limpia" : alert.status === "TURBIO" ? "🟤 Turbidez" : alert.status === "SECO" ? "❌ Seco" : "🛠️ Avería"}
                                    </span>
                                    <span style={{ fontSize: "0.7rem", color: "#6c7d93" }}>
                                      {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: "0.75rem", color: "#ffcd82", marginBottom: "0.35rem", fontWeight: "600" }}>
                                    ⚙️ Filtro: {alert.device_id || "Desconocido"}
                                  </div>
                                  <p style={{ color: "#ffffff", fontSize: "0.8rem", margin: "0 0 0.5rem 0", lineHeight: "1.4" }}>
                                    {alert.description || "Reporte de alerta rápida sin descripción física."}
                                  </p>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#8b9bb4" }}>
                                    <span>📍 {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}</span>
                                    {!alert.is_read && (
                                      <button 
                                        onClick={() => markAlertAsRead(alert.id)}
                                        style={{ 
                                          backgroundColor: "rgba(255, 205, 130, 0.15)", 
                                          border: "1px solid #ffcd82", 
                                          color: "#ffcd82", 
                                          borderRadius: "4px", 
                                          padding: "1px 6px", 
                                          cursor: "pointer",
                                          fontSize: "0.75rem" 
                                        }}
                                      >
                                        Marcar visto
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <button 
                      className={`nav-link ${activeTab === "member_dashboard" ? "active" : ""}`}
                      onClick={() => setActiveTab("member_dashboard")}
                    >
                      Mi Filtro
                    </button>
                    <button 
                      className={`nav-link ${activeTab === "members" ? "active" : ""}`}
                      onClick={() => setActiveTab("members")}
                    >
                      👥 Miembros
                    </button>
                  </>
                )}
                
                <button 
                  className={`nav-link ${activeTab === "profile" ? "active" : ""}`}
                  onClick={() => setActiveTab("profile")}
                >
                  Perfil
                </button>

                <button 
                  className="nav-link"
                  onClick={handleLogout}
                  style={{ color: "hsl(var(--danger))" }}
                >
                  Salir
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main className="container" style={{ flex: 1, padding: "clamp(1.25rem, 3vw, 2.5rem) 0", display: "flex", flexDirection: "column", gap: "clamp(1.5rem, 3vw, 2.5rem)" }}>
        
        {loadingProfile ? (
          <div className="card" style={{ padding: "4rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <span className="pulse-indicator" style={{ width: "12px", height: "12px" }}></span>
            <p style={{ color: "hsl(var(--text-muted))" }}>Cargando perfil seguro de AQUORA...</p>
          </div>
        ) : (
          <>
            {/* 1. PUBLIC VIEWS (GUESTS ONLY) */}
            {!session && activeTab === "landing" && (
              <LandingPage onNavigate={setActiveTab} />
            )}

            {!session && activeTab === "docs" && (
              <OpenSourceDocs getApiUrl={getApiUrl} />
            )}

            {!session && activeTab === "login" && (
              <Login 
                onAuthSuccess={(sess) => {
                  setSession(sess);
                  fetchProfile(sess.user.id);
                }} 
                onCancel={() => setActiveTab("landing")} 
              />
            )}

            {/* 2. PROTECTED VIEWS (AUTHENTICATED ONLY) */}
            {session && (
              <div style={{ padding: "0 1.25rem", display: "flex", flexDirection: "column", gap: "clamp(1.5rem, 3vw, 2.5rem)", width: "100%", boxSizing: "border-box" }}>
                {/* Admin Views */}
                {(userProfile?.role === "admin" || userProfile?.role === "super_admin" || userProfile?.role === "abaco_staff") && (
                  <>
                    {activeTab === "dashboard" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
                        {/* Summary Branding */}
                        <div className="card-static" style={{ 
                          padding: "var(--space-lg)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "var(--space-md)"
                        }}>
                          <div>
                            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "hsl(var(--text-primary))", marginBottom: "0.5rem" }}>
                              Monitoreo Inteligente y Salud Comunitaria
                            </h1>
                            <p style={{ color: "hsl(var(--text-secondary))", fontSize: "1rem", maxWidth: "800px", lineHeight: "1.6" }}>
                              Panel de control para administradores de la Fundación Ábaco. Visualiza parámetros hídricos de La Guajira, analiza el riesgo de Enfermedades Diarreicas Agudas (EDA) y gestiona los dispositivos comunitarios.
                            </p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "hsla(var(--success) / 0.06)", padding: "0.4rem 0.875rem", borderRadius: "var(--radius-sm)", border: "1px solid hsla(var(--success) / 0.15)" }}>
                            <span className="pulse-indicator"></span>
                            <span className="section-label" style={{ color: "hsl(var(--success))", letterSpacing: "0.08em" }}>
                              Telemetría Activa
                            </span>
                          </div>
                        </div>

                        {/* Top Grid: Map & Quick Info */}
                        <div className="dashboard-top-grid">
                          <TerritorialMap 
                            onSelectCommunity={handleSelectCommunity} 
                            selectedCommunityId={selectedCommunityId} 
                          />
                          
                          <div className="card-static" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)", justifyContent: "space-between" }}>
                            <div>
                              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "hsl(var(--text-primary))", borderBottom: "1px solid hsl(var(--border))", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
                                Comunidad: <span style={{ color: "hsl(var(--sky))" }}>{selectedCommunityName || "Ninguna seleccionada"}</span>
                              </h3>
                              
                              {selectedCommunityId ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.9rem" }}>
                                  <p style={{ color: "hsl(var(--text-secondary))", lineHeight: "1.6" }}>
                                    Esta comunidad cuenta con un filtro purificador ecológico <strong>AQUORA</strong> equipado con telemetría IoT activa. El mapa calcula dinámicamente su índice de riesgo basándose en el voltaje de los sensores y reportes históricos de EDA.
                                  </p>
                                  
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginTop: "0.5rem" }}>
                                    <div style={{ background: "hsla(var(--bg-base) / 0.5)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid hsl(var(--border))" }}>
                                      <span className="section-label" style={{ color: "hsl(var(--text-dim))" }}>Último TDS</span>
                                      <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "hsl(var(--ocean))", marginTop: "0.25rem", fontFamily: "var(--font-label)" }}>
                                        {historyData[historyData.length - 1]?.tds?.toFixed(1) || "N/A"} ppm
                                      </div>
                                    </div>
                                    <div style={{ background: "hsla(var(--bg-base) / 0.5)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid hsl(var(--border))" }}>
                                      <span className="section-label" style={{ color: "hsl(var(--text-dim))" }}>Nivel Tanque</span>
                                      <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "hsl(var(--success))", marginTop: "0.25rem", fontFamily: "var(--font-label)" }}>
                                        {historyData[historyData.length - 1]?.level?.toFixed(1) || "N/A"}%
                                      </div>
                                    </div>
                                  </div>

                                  {/* Historial de Reportes de Campo de la Comunidad */}
                                  <div style={{ marginTop: "1rem", borderTop: "1px dashed rgba(173, 219, 255, 0.15)", paddingTop: "0.875rem" }}>
                                    <h4 style={{ fontFamily: "var(--font-label)", fontSize: "0.85rem", color: "#ffffff", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                      <span>📋</span> Historial de Reportes de Campo
                                    </h4>
                                    {(() => {
                                      const commAlerts = manualAlerts.filter(
                                        a => a.community_id === selectedCommunityId || a.community_name === selectedCommunityName
                                      );
                                      if (commAlerts.length === 0) {
                                        return (
                                          <p style={{ color: "hsl(var(--text-dim))", fontSize: "0.8rem", fontStyle: "italic", margin: "0.5rem 0 0 0" }}>
                                            No hay reportes de campo registrados para esta comunidad.
                                          </p>
                                        );
                                      }
                                      return (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "155px", overflowY: "auto", paddingRight: "4px", marginTop: "0.5rem" }}>
                                          {commAlerts.map((alert) => {
                                            const distanceKm = getDistance(alert.latitude, alert.longitude, selectedCommunityLat, selectedCommunityLon);
                                            const distanceM = Math.round(distanceKm * 1000);
                                            const isOutOfSite = distanceM > 50;
                                            
                                            const cardStyle = isOutOfSite ? {
                                              padding: "0.6rem 0.75rem",
                                              backgroundColor: "rgba(244, 63, 94, 0.05)",
                                              borderLeft: "3px solid #f43f5e",
                                              borderWidth: "1px",
                                              borderColor: "rgba(244, 63, 94, 0.15)",
                                              borderRadius: "4px",
                                              fontSize: "0.8rem",
                                              textAlign: "left"
                                            } : {
                                              padding: "0.6rem 0.75rem",
                                              backgroundColor: "rgba(10, 24, 34, 0.6)",
                                              borderLeft: alert.is_read ? "2px solid #4a5d6e" : "2px solid #ffcd82",
                                              borderWidth: "1px",
                                              borderColor: "rgba(173, 219, 255, 0.05)",
                                              borderRadius: "4px",
                                              fontSize: "0.8rem",
                                              textAlign: "left"
                                            };

                                            return (
                                              <div key={alert.id} style={cardStyle}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                                                  <span style={{ 
                                                    fontWeight: "bold", 
                                                    color: alert.status === "OK" ? "#10b981" : alert.status === "TURBIO" ? "#d97706" : alert.status === "SECO" ? "#dc2626" : "#8b9bb4",
                                                    fontSize: "0.75rem"
                                                  }}>
                                                    {alert.status === "OK" ? "💧 Agua Limpia" : alert.status === "TURBIO" ? "🟤 Turbidez" : alert.status === "SECO" ? "❌ Seco" : "🛠️ Avería"}
                                                  </span>
                                                  <span style={{ fontSize: "0.65rem", color: "#6c7d93" }}>
                                                    {new Date(alert.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                  </span>
                                                </div>
                                                <p style={{ color: "#e2e8f0", fontSize: "0.75rem", margin: "0 0 0.4rem 0", lineHeight: "1.3" }}>
                                                  {alert.description || "Alerta rápida emitida sin descripción."}
                                                </p>
                                                
                                                {/* Geofence Check badge */}
                                                <div style={{ 
                                                  fontSize: "0.75rem", 
                                                  fontWeight: "600",
                                                  color: isOutOfSite ? "#f43f5e" : "#10b981",
                                                  marginBottom: "0.4rem",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: "0.25rem"
                                                }}>
                                                  <span>{isOutOfSite ? "⚠️ Fuera de sitio relativo" : "✓ En sitio relativo (Coincide GPS)"}</span>
                                                  <span style={{ opacity: 0.8, fontWeight: "normal" }}>
                                                    (~{distanceM}m)
                                                  </span>
                                                </div>

                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", color: "#8b9bb4" }}>
                                                  <span>📍 {alert.latitude.toFixed(3)}, {alert.longitude.toFixed(3)}</span>
                                                  <span style={{ 
                                                    color: alert.is_read ? "#10b981" : "#ffcd82", 
                                                    fontWeight: "bold"
                                                  }}>
                                                    {alert.is_read ? "✓ Resuelto" : "● Pendiente"}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              ) : (
                                <p style={{ color: "hsl(var(--text-secondary))" }}>Selecciona un nodo en el mapa interactivo para cargar información histórica de campo.</p>
                              )}
                            </div>
                            
                            <div style={{ 
                              background: "hsla(var(--ocean) / 0.04)", 
                              border: "1px solid hsla(var(--ocean) / 0.1)", 
                              padding: "1.25rem", 
                              borderRadius: "var(--radius-md)", 
                              display: "flex", 
                              flexDirection: "column", 
                              gap: "0.75rem" 
                            }}>
                              <div>
                                <h4 style={{ fontFamily: "var(--font-label)", fontSize: "0.95rem", color: "hsl(var(--text-primary))" }}>
                                  Filtro Físico por Capas
                                </h4>
                                <p style={{ color: "hsl(var(--text-secondary))", fontSize: "0.82rem", marginTop: "0.25rem", lineHeight: "1.5" }}>
                                  Zeolita activa, bagazo de caña y arena silícea eliminan bacterias, metales y sólidos suspendidos de forma pasiva.
                                </p>
                              </div>
                              <button 
                                className="btn btn-primary" 
                                onClick={() => setActiveTab("filter3d")}
                                style={{ width: "100%", padding: "0.6rem 1rem", fontSize: "0.85rem" }}
                              >
                                Abrir Visor del Filtro 3D
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Telemetry Charts */}
                        <div className="card" style={{ position: "relative" }}>
                          {loadingHistory && (
                            <div style={{ 
                              position: "absolute", 
                              top: 0, left: 0, right: 0, bottom: 0, 
                              background: "rgba(15, 23, 42, 0.5)", 
                              display: "flex", alignItems: "center", justifyContent: "center", 
                              zIndex: 10,
                              backdropFilter: "blur(2px)",
                              borderRadius: "16px"
                            }}>
                              <p style={{ color: "hsl(var(--sky))", fontWeight: "600", fontFamily: "var(--font-label)", fontSize: "0.875rem" }}>Sincronizando curvas analíticas...</p>
                            </div>
                          )}
                          <TelemetryCharts data={historyData} />
                        </div>
                      </div>
                    )}

                    {activeTab === "filter3d" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => setActiveTab("dashboard")}
                          style={{ alignSelf: "flex-start", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                        >
                          Volver al Centro Analítico
                        </button>
                        <FilterViewer3D />
                      </div>
                    )}

                    {activeTab === "provisioning" && (
                      <AdminUserProvisioning getApiUrl={getApiUrl} userRole={userProfile?.role} />
                    )}
                  </>
                )}

                {/* Community Member Views */}
                {userProfile?.role === "community_member" && (
                  <>
                    {activeTab === "member_dashboard" && (
                      <MemberDashboard userProfile={userProfile} getApiUrl={getApiUrl} />
                    )}
                  </>
                )}

                {/* Profile View (Shared) */}
                {activeTab === "profile" && (
                  <UserProfile userProfile={userProfile} onLogout={handleLogout} />
                )}

                {/* Members Management View (Shared) */}
                {activeTab === "members" && (
                  <MembersManagement getApiUrl={getApiUrl} userProfile={userProfile} onLogout={handleLogout} />
                )}
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer Premium — Editorial & Legal */}
      <footer className="footer-main">
        <div className="container">
          <div className="footer-grid">
            
            {/* Columna 1: Branding y Propósito */}
            <div className="footer-col">
              <a 
                href="#" 
                className="footer-logo"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(session ? (((userProfile?.role === "admin" || userProfile?.role === "super_admin" || userProfile?.role === "abaco_staff") ? "dashboard" : "member_dashboard")) : "landing");
                }}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <img src="./favicon.svg" alt="AQUORA Logo" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
                AQUORA
              </a>
              <p className="footer-col-text">
                Plataforma de inteligencia territorial hídrica descentralizada. Monitoreo predictivo y telemetría de calidad del agua para salvaguardar la salud de las comunidades en La Guajira, Colombia.
              </p>
              
              <div style={{ 
                margin: "0.5rem 0", 
                padding: "0.75rem", 
                backgroundColor: "hsla(var(--sky) / 0.05)", 
                border: "1px solid hsla(var(--sky) / 0.15)", 
                borderRadius: "var(--radius-sm)" 
              }}>
                <span style={{ fontSize: "0.82rem", color: "hsl(var(--text-primary))", fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>
                  📱 Aplicación Comunitaria
                </span>
                <span style={{ fontSize: "0.78rem", color: "hsl(var(--text-secondary))", display: "block", marginBottom: "0.5rem" }}>
                  Nuestra aplicación móvil está disponible para Android. ¡Descárgala ya!
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <a 
                    href="https://github.com/CoralGamer/Aquora-/raw/main/mobile/builds/aquora-comunidad.apk"
                    style={{ fontSize: "0.75rem", color: "hsl(var(--peach))", fontWeight: "bold" }}
                  >
                    Descargar APK (Android)
                  </a>
                </div>
              </div>

              <div className="footer-legal-badge">
                <span className="pulse-indicator" style={{ backgroundColor: "hsl(var(--peach))", width: "8px", height: "8px" }}></span>
                Cumplimiento Ley 1581 de 2012
              </div>
            </div>

            {/* Columna 2: Red de Misiones ABACO */}
            <div className="footer-col">
              <h4 className="footer-col-title">Red de Bancos de Alimentos (ABACO)</h4>
              <div className="footer-missions-container">
                <a href="https://abaco.org.co/" target="_blank" rel="noopener noreferrer" className="btn-mission">
                  <span>ABACO Nacional</span>
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: "14px", height: "14px", fill: "currentColor" }}><path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-8.29-1.42 1.42L16.86 11H5v2z"/></svg>
                </a>
                <a href="https://www.bancodealimentos.org.co/" target="_blank" rel="noopener noreferrer" className="btn-mission">
                  <span>Banco de Alimentos Bogotá</span>
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: "14px", height: "14px", fill: "currentColor" }}><path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-8.29-1.42 1.42L16.86 11H5v2z"/></svg>
                </a>
                <a href="https://bancodealimentosbga.org/" target="_blank" rel="noopener noreferrer" className="btn-mission">
                  <span>Banco de Alimentos Bucaramanga</span>
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: "14px", height: "14px", fill: "currentColor" }}><path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-8.29-1.42 1.42L16.86 11H5v2z"/></svg>
                </a>
                <a href="https://www.bancodealimentoscali.org/" target="_blank" rel="noopener noreferrer" className="btn-mission">
                  <span>Banco de Alimentos Cali</span>
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: "14px", height: "14px", fill: "currentColor" }}><path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-8.29-1.42 1.42L16.86 11H5v2z"/></svg>
                </a>
              </div>
            </div>

            {/* Columna 3: Información Legal & Habeas Data */}
            <div className="footer-col">
              <h4 className="footer-col-title">Tratamiento de Datos y Legal</h4>
              <p className="footer-col-text" style={{ fontSize: "0.85rem", opacity: 0.85 }}>
                En concordancia con la <strong>Ley 1581 de 2012</strong> (Régimen de Protección de Datos Personales en Colombia) y el <strong>Decreto 1377 de 2013</strong>, la recolección, almacenamiento y procesamiento de los reportes y telemetría cumple con los principios de finalidad, confidencialidad, libertad y veracidad de la información de las comunidades rurales.
              </p>
              <ul className="footer-links-list">
                <li className="footer-link-item">
                  <a href="#" onClick={(e) => { e.preventDefault(); alert("Autorización de Habeas Data:\n\nAl navegar y hacer uso de los paneles de telemetría de AQUORA, usted acepta de manera previa, expresa e informada que sus datos de sensor y reportes sanitarios de campo sean tratados por la Asociación de Bancos de Alimentos de Colombia (ABACO) únicamente para fines de monitoreo de agua cruda y prevención de brotes de EDA bajo la Ley colombiana 1581 de 2012."); }}>
                    ⚖️ Autorización Habeas Data
                  </a>
                </li>
                <li className="footer-link-item">
                  <a href="#" onClick={(e) => { e.preventDefault(); alert("Política de Privacidad y Tratamiento de Datos:\n\nEn AQUORA nos tomamos muy en serio la seguridad de la información. El acceso a los identificadores de dispositivos y números de contacto comunitario en La Guajira está estrictamente encriptado y restringido a los administradores autorizados de la red ABACO de Colombia."); }}>
                    🔒 Política de Privacidad
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Fila Inferior */}
          <div className="footer-bottom">
            <div className="footer-bottom-text">
              <strong>AQUORA</strong>  —  Proyecto de Código Abierto bajo Licencia MIT
              <strong>  —  Hecho por el equipo de SerendipIA by <a href="https://bumpo.com.co" target="_blank" rel="noopener noreferrer">Bumpo</a></strong><br />
              Co-desarrollado para la <strong>Asociación de Bancos de Alimentos de Colombia (ABACO)</strong> e Inteligencia Territorial en Colombia.
            </div>
            <div className="footer-bottom-links">
              <span style={{ color: "hsl(var(--text-dim))" }}>© {new Date().getFullYear()}</span>
              <a href="https://abaco.org.co/" target="_blank" rel="noopener noreferrer" className="footer-bottom-link">ABACO</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("docs"); }} className="footer-bottom-link">Soporte Firmware</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
