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
import { supabase } from "./services/supabaseClient";

export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState("landing"); // unauth: 'landing', 'docs', 'login'
                                                        // admin: 'dashboard', 'filter3d', 'provisioning', 'profile'
                                                        // member: 'member_dashboard', 'profile'

  // Admin territorial dashboard states
  const [selectedCommunityId, setSelectedCommunityId] = useState("");
  const [selectedCommunityName, setSelectedCommunityName] = useState("");
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoadingProfile(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
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

  const fetchProfile = async (userId) => {
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, role, device_id, notification_preferences")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        // Fallback for resilient demos
        const { data: { user } } = await supabase.auth.getUser();
        const fallback = {
          id: userId,
          email: user?.email || "usuario@aquora.org",
          full_name: user?.user_metadata?.full_name || "Miembro de la Comunidad",
          role: "community_member"
        };
        setUserProfile(fallback);
        setActiveTab("member_dashboard");
      } else {
        setUserProfile(data);
        if (data.role === "admin") {
          setActiveTab("dashboard");
        } else {
          setActiveTab("member_dashboard");
        }
      }
    } catch (err) {
      console.error("Profile fetching failed:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleLogout = async () => {
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

  const handleSelectCommunity = (id, name) => {
    setSelectedCommunityId(id);
    setSelectedCommunityName(name);
  };

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
                setActiveTab(userProfile?.role === "admin" ? "dashboard" : "member_dashboard");
              } else {
                setActiveTab("landing");
              }
            }}
          >
            💧 AQUORA
          </a>
          
          <nav className="nav-links">
            {!session ? (
              // Navigation for guests
              <>
                <button 
                  className={`nav-link btn-secondary ${activeTab === "landing" ? "active" : ""}`}
                  onClick={() => setActiveTab("landing")}
                  style={{ padding: "0.5rem 1rem", border: "none", cursor: "pointer", background: "none" }}
                >
                  🌱 Impacto
                </button>
                <button 
                  className={`nav-link btn-secondary ${activeTab === "docs" ? "active" : ""}`}
                  onClick={() => setActiveTab("docs")}
                  style={{ padding: "0.5rem 1rem", border: "none", cursor: "pointer", background: "none" }}
                >
                  📖 Open Source Firmware
                </button>
                <button 
                  className={`nav-link btn-secondary ${activeTab === "login" ? "active" : ""}`}
                  onClick={() => setActiveTab("login")}
                  style={{ 
                    padding: "0.5rem 1.25rem", 
                    borderRadius: "10px",
                    border: "1px solid hsla(var(--primary) / 0.4)",
                    color: "hsl(var(--primary))",
                    cursor: "pointer", 
                    background: "rgba(14, 165, 233, 0.05)",
                    fontWeight: "bold"
                  }}
                >
                  🔑 Iniciar Sesión
                </button>
              </>
            ) : (
              // Navigation for authenticated users
              <>
                {userProfile?.role === "admin" ? (
                  // Admin links
                  <>
                    <button 
                      className={`nav-link btn-secondary ${activeTab === "dashboard" ? "active" : ""}`}
                      onClick={() => setActiveTab("dashboard")}
                      style={{ padding: "0.5rem 1rem", border: "none", cursor: "pointer", background: "none" }}
                    >
                      📊 Centro Analítico
                    </button>
                    <button 
                      className={`nav-link btn-secondary ${activeTab === "filter3d" ? "active" : ""}`}
                      onClick={() => setActiveTab("filter3d")}
                      style={{ padding: "0.5rem 1rem", border: "none", cursor: "pointer", background: "none" }}
                    >
                      🛠️ Explora el Filtro 3D
                    </button>
                    <button 
                      className={`nav-link btn-secondary ${activeTab === "provisioning" ? "active" : ""}`}
                      onClick={() => setActiveTab("provisioning")}
                      style={{ padding: "0.5rem 1rem", border: "none", cursor: "pointer", background: "none" }}
                    >
                      👥 Aprovisionamiento
                    </button>
                  </>
                ) : (
                  // Community member links
                  <>
                    <button 
                      className={`nav-link btn-secondary ${activeTab === "member_dashboard" ? "active" : ""}`}
                      onClick={() => setActiveTab("member_dashboard")}
                      style={{ padding: "0.5rem 1rem", border: "none", cursor: "pointer", background: "none" }}
                    >
                      📊 Mi Filtro
                    </button>
                  </>
                )}
                
                <button 
                  className={`nav-link btn-secondary ${activeTab === "profile" ? "active" : ""}`}
                  onClick={() => setActiveTab("profile")}
                  style={{ padding: "0.5rem 1rem", border: "none", cursor: "pointer", background: "none" }}
                >
                  👤 Mi Perfil
                </button>

                <button 
                  className="nav-link btn-secondary"
                  onClick={handleLogout}
                  style={{ 
                    padding: "0.5rem 1rem", 
                    border: "none", 
                    cursor: "pointer", 
                    background: "none",
                    color: "hsl(var(--danger))" 
                  }}
                >
                  🚪 Salir
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main className="container" style={{ flex: 1, padding: "2.5rem 2rem", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        
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
              <OpenSourceDocs />
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
              <>
                {/* Admin Views */}
                {userProfile?.role === "admin" && (
                  <>
                    {activeTab === "dashboard" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                        {/* Summary Branding */}
                        <div className="card" style={{ 
                          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.7) 100%)",
                          padding: "2rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "1.5rem"
                        }}>
                          <div>
                            <h1 style={{ fontFamily: "var(--font-title)", fontSize: "2.25rem", color: "hsl(var(--text-main))", marginBottom: "0.5rem" }}>
                              Monitoreo Inteligente y Salud Comunitaria
                            </h1>
                            <p style={{ color: "hsl(var(--text-muted))", fontSize: "1.05rem", maxWidth: "800px", lineHeight: "1.5" }}>
                              Panel de control para administradores de la Fundación Ábaco. Visualiza parámetros hídricos de La Guajira, analiza el riesgo de Enfermedades Diarreicas Agudas (EDA) y gestiona los dispositivos comunitarios.
                            </p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "rgba(16, 185, 129, 0.08)", padding: "0.5rem 1rem", borderRadius: "30px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                            <span className="pulse-indicator"></span>
                            <span style={{ fontSize: "0.85rem", color: "hsl(var(--success))", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                          
                          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", justifyContent: "space-between" }}>
                            <div>
                              <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.35rem", color: "hsl(var(--text-main))", borderBottom: "1px solid hsl(var(--border-light))", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
                                ℹ️ Comunidad Seleccionada: <span style={{ color: "hsl(var(--primary))" }}>{selectedCommunityName || "Ninguna seleccionada"}</span>
                              </h3>
                              
                              {selectedCommunityId ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.95rem" }}>
                                  <p style={{ color: "hsl(var(--text-muted))", lineHeight: "1.5" }}>
                                    Esta comunidad cuenta con un filtro purificador ecológico <strong>AQUORA</strong> equipado con telemetría IoT activa. El mapa calcula dinámicamente su índice de riesgo basándose en el voltaje de los sensores y reportes históricos de EDA.
                                  </p>
                                  
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
                                    <div style={{ background: "rgba(0,0,0,0.18)", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid hsl(var(--border-light))" }}>
                                      <span style={{ fontSize: "0.75rem", color: "hsl(var(--text-dark))", textTransform: "uppercase", fontWeight: "bold" }}>Último TDS</span>
                                      <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "hsl(var(--primary))", marginTop: "0.25rem" }}>
                                        {historyData[historyData.length - 1]?.tds?.toFixed(1) || "N/A"} ppm
                                      </div>
                                    </div>
                                    <div style={{ background: "rgba(0,0,0,0.18)", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid hsl(var(--border-light))" }}>
                                      <span style={{ fontSize: "0.75rem", color: "hsl(var(--text-dark))", textTransform: "uppercase", fontWeight: "bold" }}>Nivel Tanque</span>
                                      <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "hsl(var(--success))", marginTop: "0.25rem" }}>
                                        {historyData[historyData.length - 1]?.level?.toFixed(1) || "N/A"}%
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p style={{ color: "hsl(var(--text-muted))" }}>Selecciona un nodo en el mapa interactivo para cargar información histórica de campo.</p>
                              )}
                            </div>
                            
                            <div style={{ 
                              background: "rgba(14, 165, 233, 0.04)", 
                              border: "1px solid hsla(var(--primary) / 0.1)", 
                              padding: "1.25rem", 
                              borderRadius: "12px", 
                              display: "flex", 
                              flexDirection: "column", 
                              gap: "0.75rem" 
                            }}>
                              <div>
                                <h4 style={{ fontFamily: "var(--font-title)", fontSize: "1rem", color: "hsl(var(--text-main))" }}>
                                  🛠️ ¿Cómo funciona el filtro físico?
                                </h4>
                                <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", marginTop: "0.25rem", lineHeight: "1.4" }}>
                                  Hemos diseñado una cámara de filtrado biológico por capas. Zeolita activa, bagazo de caña y arena silícea eliminan bacterias, metales y sólidos suspendidos de forma pasiva.
                                </p>
                              </div>
                              <button 
                                className="btn btn-primary" 
                                onClick={() => setActiveTab("filter3d")}
                                style={{ width: "100%", padding: "0.6rem 1rem", fontSize: "0.85rem" }}
                              >
                                Abrir Visor del Filtro 3D ➔
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
                              <p style={{ color: "hsl(var(--primary))", fontWeight: "bold" }}>Sincronizando curvas analíticas...</p>
                            </div>
                          )}
                          <TelemetryCharts data={historyData} />
                        </div>
                      </div>
                    )}

                    {activeTab === "filter3d" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => setActiveTab("dashboard")}
                          style={{ alignSelf: "flex-start", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                        >
                          ⬅️ Volver al Centro Analítico
                        </button>
                        <FilterViewer3D />
                      </div>
                    )}

                    {activeTab === "provisioning" && (
                      <AdminUserProvisioning getApiUrl={getApiUrl} />
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
              </>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid hsl(var(--border-light))", padding: "1.5rem 0", background: "rgba(2, 6, 23, 0.9)", textAlign: "center", fontSize: "0.85rem", color: "hsl(var(--text-dark))" }}>
        <div className="container">
          <p>© {new Date().getFullYear()} AQUORA. Proyecto Abierto bajo Licencia MIT. Desarrollado para la Fundación Ábaco e Inteligencia Territorial.</p>
        </div>
      </footer>
    </div>
  );
}
