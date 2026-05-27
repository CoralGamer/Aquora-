import React from "react";

export default function LandingPage({ onNavigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4rem", padding: "1rem 0" }}>
      
      {/* Hero Section */}
      <section style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        textAlign: "center", 
        gap: "1.5rem",
        padding: "3rem 1.5rem",
        borderRadius: "24px",
        background: "radial-gradient(circle at top, rgba(14, 165, 233, 0.15) 0%, rgba(2, 6, 23, 0) 70%)"
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", background: "rgba(14, 165, 233, 0.08)", padding: "0.5rem 1rem", borderRadius: "30px", border: "1px solid rgba(14, 165, 233, 0.2)" }}>
          <span className="pulse-indicator" style={{ background: "hsl(var(--primary))", boxShadow: "0 0 8px hsla(var(--primary) / 0.7)" }}></span>
          <span style={{ fontSize: "0.75rem", color: "hsl(var(--primary))", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            TECNOLOGÍA SOCIAL DE CÓDIGO ABIERTO
          </span>
        </div>
        
        <h1 style={{ 
          fontFamily: "var(--font-title)", 
          fontSize: "3.5rem", 
          lineHeight: "1.15", 
          maxWidth: "900px", 
          background: "linear-gradient(135deg, hsl(var(--text-main)) 30%, hsl(var(--text-muted)) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 800
        }}>
          Agua Segura, Nutrición Posible e Inteligencia de Datos
        </h1>
        
        <p style={{ 
          color: "hsl(var(--text-muted))", 
          fontSize: "1.25rem", 
          maxWidth: "750px", 
          lineHeight: "1.6",
          marginTop: "0.5rem"
        }}>
          AQUORA rompe el nexus de la mortalidad infantil en La Guajira conectando un filtro ecológico inteligente con telemetría en tiempo real y vigilancia epidemiológica activa.
        </p>
        
        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button className="btn btn-primary" onClick={() => onNavigate("docs")}>
            📖 Explorar Documentación Libre
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate("login")}>
            🔑 Acceso de Usuarios / Comunidad
          </button>
        </div>
      </section>

      {/* The Crucial Problem Section */}
      <section className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem", padding: "2.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.8rem", color: "hsl(var(--danger))", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}>EL DESAFÍO HUMANITARIO</span>
          <h2 style={{ fontFamily: "var(--font-title)", fontSize: "2rem", color: "hsl(var(--text-main))" }}>
            El Diagnóstico de la Desnutrición Infantil
          </h2>
          <p style={{ color: "hsl(var(--text-muted))", lineHeight: "1.6" }}>
            En las comunidades Wayúu, la desnutrición infantil crónica no solo ocurre por la falta de alimentos, sino porque el agua insalubre que consumen les causa <strong>Enfermedades Diarreicas Agudas (EDA)</strong> constantes.
          </p>
          <p style={{ color: "hsl(var(--text-muted))", lineHeight: "1.6" }}>
            Las infecciones continuas destruyen las vellosidades intestinales, <strong>impidiendo que los niños absorban los nutrientes</strong> de las ayudas humanitarias. Proveer agua segura es el paso indispensable antes de nutrir.
          </p>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", justifyContent: "center" }}>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(244, 63, 94, 0.15)", display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ fontSize: "2.25rem", color: "hsl(var(--danger))" }}>😷</span>
            <div>
              <h4 style={{ color: "hsl(var(--text-main))", marginBottom: "0.25rem" }}>Surge de la EDA</h4>
              <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem" }}>Causa inflamación e impide la absorción digestiva de macronutrientes.</p>
            </div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.15)", display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ fontSize: "2.25rem", color: "hsl(var(--success))" }}>💧</span>
            <div>
              <h4 style={{ color: "hsl(var(--text-main))", marginBottom: "0.25rem" }}>Agua de Jagüey</h4>
              <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem" }}>Alta turbidez física y cargas bacterianas letales para el colon infantil.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Multistage Filter Section */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3rem" }}>
        <div style={{ textAlign: "center", maxWidth: "600px" }}>
          <span style={{ fontSize: "0.8rem", color: "hsl(var(--primary))", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}>TECNOLOGÍA ABIERTA</span>
          <h2 style={{ fontFamily: "var(--font-title)", fontSize: "2rem", color: "hsl(var(--text-main))", marginTop: "0.5rem" }}>
            El Filtro Físico-Químico por Capas Orgánicas
          </h2>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.95rem", marginTop: "0.5rem" }}>
            Purificación eficiente usando recursos renovables abundantes y de fácil recambio.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", width: "100%" }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "3px solid hsl(var(--primary))" }}>
            <span style={{ fontSize: "2rem" }}>🍂</span>
            <h3 style={{ fontSize: "1.2rem", color: "hsl(var(--text-main))" }}>1. Bagazo de Caña</h3>
            <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", lineHeight: "1.5" }}>
              Adsorbente molecular orgánico. Retiene compuestos químicos, pesticidas, olores y metales pesados.
            </p>
          </div>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "3px solid hsl(var(--success))" }}>
            <span style={{ fontSize: "2rem" }}>🧪</span>
            <h3 style={{ fontSize: "1.2rem", color: "hsl(var(--text-main))" }}>2. Zeolita Activa</h3>
            <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", lineHeight: "1.5" }}>
              Intercambio iónico a nivel microscópico. Neutraliza gérmenes, amoníacos y ablanda la dureza del agua.
            </p>
          </div>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "3px solid hsl(var(--warning))" }}>
            <span style={{ fontSize: "2rem" }}>⏳</span>
            <h3 style={{ fontSize: "1.2rem", color: "hsl(var(--text-main))" }}>3. Arena Silícea</h3>
            <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", lineHeight: "1.5" }}>
              Filtración mecánica primaria. Retiene los sedimentos gruesos, tierra y lodo en suspensión.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
