import React, { useState } from "react";

export default function LandingPage({ onNavigate }) {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      num: "01",
      label: "El Jagüey",
      title: "La Crisis del Agua de Jagüey",
      desc: "Las comunidades Wayúu dependen de pozos de agua cruda expuestos (jagüeyes) compartidos con la fauna local, acumulando sedimentos gruesos, parásitos y bacterias letales para el organismo infantil."
    },
    {
      num: "02",
      label: "Brote de EDA",
      title: "El Nexo con las Enfermedades Diarreicas",
      desc: "Las constantes infecciones estomacales (EDA) causan inflamación e impiden la absorción de los nutrientes. Proveer agua segura es el paso indispensable antes de nutrir."
    },
    {
      num: "03",
      label: "Filtro Orgánico",
      title: "Purificación Ecológica por Capas",
      desc: "Un sistema pasivo descentralizado de filtración por gravedad que purifica el agua utilizando zeolita activa (intercambio iónico), bagazo de caña de azúcar (adsorción de metales) y arena silícea."
    },
    {
      num: "04",
      label: "Telemetría IoT",
      title: "Vigilancia Sanitaria Activa en Tiempo Real",
      desc: "Sensores de TDS, turbidez y volumen con un microcontrolador ESP32 transmiten datos en vivo a la nube para mapear el riesgo sanitario de forma predictiva mediante modelos de IA."
    }
  ];

  const cards = [
    {
      num: "1",
      title: "Bagazo de Caña",
      subtitle: "Adsorbente molecular orgánico",
      desc: "Retiene compuestos químicos, plaguicidas, olores y metales pesados de forma pasiva mediante microporosidades celulósicas renovables.",
      img: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=600&auto=format&fit=crop"
    },
    {
      num: "2",
      title: "Zeolita Activa",
      subtitle: "Intercambio iónico a escala micro",
      desc: "Atrapa selectivamente iones de metales pesados, neutraliza gérmenes, elimina el amoníaco y reduce significativamente la dureza del agua.",
      img: "https://images.unsplash.com/photo-1518152006812-cdab29b069a8?q=80&w=600&auto=format&fit=crop"
    },
    {
      num: "3",
      title: "Arena Silícea",
      subtitle: "Filtración mecánica primaria",
      desc: "Retiene los sedimentos gruesos, partículas suspendidas y lodo, garantizando la claridad física antes de las fases microbacterianas.",
      img: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=600&auto=format&fit=crop"
    },
    {
      num: "4",
      title: "Telemetría ESP32",
      subtitle: "Inteligencia y monitoreo continuo",
      desc: "Mide TDS, claridad y nivel en tiempo real. Envía alertas de mantenimiento y opera de forma offline en áreas remotas sin cobertura.",
      img: "https://images.unsplash.com/photo-1601524909162-be87252be298?q=80&w=600&auto=format&fit=crop"
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4.5rem", padding: "1rem 0" }}>
      
      {/* 🚀 Dynamic Hero Section (Visit Indonesia Mockup style!) */}
      <section className="hero-grid" style={{ 
        padding: "3.5rem 2.5rem",
        borderRadius: "24px",
        background: "linear-gradient(135deg, rgba(20, 41, 58, 0.95) 0%, rgba(12, 24, 36, 0.85) 100%)",
        border: "1px solid rgba(0, 80, 143, 0.35)",
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.6), var(--shadow-glow)",
        position: "relative",
        overflow: "hidden"
      }}>
        
        {/* Left Column: Title & Dynamic Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", textAlign: "left", alignSelf: "center", zIndex: 2 }}>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "0.6rem", 
            background: "rgba(173, 219, 255, 0.06)", 
            padding: "0.5rem 1rem", 
            borderRadius: "30px", 
            border: "1px solid rgba(173, 219, 255, 0.15)", 
            alignSelf: "flex-start" 
          }}>
            <span className="pulse-indicator" style={{ background: "hsl(var(--secondary-sky))", boxShadow: "0 0 8px hsla(var(--secondary-sky) / 0.7)" }}></span>
            <span style={{ fontSize: "0.75rem", color: "hsl(var(--secondary-sky))", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              TECNOLOGÍA SOCIAL DE CÓDIGO ABIERTO
            </span>
          </div>
          
          <h1 style={{ 
            fontFamily: "var(--font-title)", 
            fontSize: "3.25rem", 
            lineHeight: "1.15", 
            background: "linear-gradient(135deg, #f8fafc 40%, #ADDBFF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 800
          }}>
            Agua Segura, Nutrición Posible e Inteligencia de Datos
          </h1>

          {/* Dynamic Slider Details Panel */}
          <div style={{ 
            background: "rgba(12, 24, 36, 0.5)", 
            borderLeft: "3px solid hsl(var(--secondary-sky))", 
            padding: "1.25rem 1.5rem", 
            borderRadius: "0 12px 12px 0",
            marginTop: "0.5rem",
            backdropFilter: "blur(8px)"
          }}>
            <h3 style={{ fontFamily: "var(--font-title)", color: "hsl(var(--secondary-sky))", fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              {slides[activeSlide].title}
            </h3>
            <p style={{ color: "hsl(var(--text-muted))", fontSize: "1.05rem", lineHeight: "1.6" }}>
              {slides[activeSlide].desc}
            </p>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => onNavigate("docs")}>
              📖 Explorar Documentación Libre
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate("login")}>
              🔑 Acceso de Usuarios / Comunidad
            </button>
          </div>
        </div>

        {/* Right Column: Vertical Slide Selector */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center", 
          alignItems: "flex-end", 
          gap: "1.5rem",
          borderLeft: "1px solid rgba(255, 255, 255, 0.05)",
          paddingLeft: "2rem",
          zIndex: 2
        }}>
          {slides.map((slide, idx) => (
            <div 
              key={idx} 
              onClick={() => setActiveSlide(idx)}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "1rem", 
                cursor: "pointer", 
                transition: "var(--transition-smooth)",
                opacity: activeSlide === idx ? 1 : 0.45,
                transform: activeSlide === idx ? "translateX(-8px)" : "translateX(0)"
              }}
            >
              <div style={{ textAlign: "right" }}>
                <span style={{ 
                  display: "block", 
                  fontFamily: "var(--font-title)", 
                  fontSize: activeSlide === idx ? "1.5rem" : "1.1rem", 
                  fontWeight: "bold", 
                  color: activeSlide === idx ? "hsl(var(--secondary-sky))" : "hsl(var(--text-muted))"
                }}>
                  {slide.num}
                </span>
                <span style={{ 
                  fontSize: "0.75rem", 
                  color: "hsl(var(--text-muted))",
                  display: activeSlide === idx ? "inline-block" : "none" 
                }}>
                  {slide.label}
                </span>
              </div>
              <div style={{ 
                width: "12px", 
                height: "12px", 
                borderRadius: "50%", 
                border: "2px solid hsl(var(--secondary-sky))", 
                background: activeSlide === idx ? "hsl(var(--secondary-sky))" : "none",
                boxShadow: activeSlide === idx ? "0 0 10px hsl(var(--secondary-sky))" : "none",
                transition: "var(--transition-smooth)"
              }} />
            </div>
          ))}
        </div>

      </section>

      {/* 😷 The Crucial Problem Section */}
      <section className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem", padding: "2.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.8rem", color: "hsl(var(--warning))", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}>EL DESAFÍO HUMANITARIO</span>
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
          <div style={{ background: "rgba(12,24,36,0.4)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(255, 205, 130, 0.15)", display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ fontSize: "2.25rem", color: "hsl(var(--warning))" }}>😷</span>
            <div>
              <h4 style={{ color: "hsl(var(--text-main))", marginBottom: "0.25rem" }}>Surge de la EDA</h4>
              <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem" }}>Causa inflamación e impide la absorción digestiva de macronutrientes.</p>
            </div>
          </div>
          <div style={{ background: "rgba(12,24,36,0.4)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(173, 219, 255, 0.15)", display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ fontSize: "2.25rem", color: "hsl(var(--secondary-sky))" }}>💧</span>
            <div>
              <h4 style={{ color: "hsl(var(--text-main))", marginBottom: "0.25rem" }}>Agua de Jagüey</h4>
              <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem" }}>Alta turbidez física y cargas bacterianas letales para el colon infantil.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🛠️ The Multistage Filter Section (Visit Indonesia Cards Layout!) */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3rem" }}>
        <div style={{ textAlign: "center", maxWidth: "600px" }}>
          <span style={{ fontSize: "0.8rem", color: "hsl(var(--secondary-sky))", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}>TECNOLOGÍA ABIERTA</span>
          <h2 style={{ fontFamily: "var(--font-title)", fontSize: "2.25rem", color: "hsl(var(--text-main))", marginTop: "0.5rem" }}>
            El Filtro Físico-Químico por Capas Orgánicas
          </h2>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.95rem", marginTop: "0.5rem" }}>
            Purificación eficiente usando recursos renovables abundantes y de fácil recambio.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "2rem", width: "100%" }}>
          {cards.map((card, idx) => (
            <div 
              key={idx}
              className="card" 
              style={{ 
                position: "relative",
                minHeight: "280px",
                borderRadius: "16px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "1.75rem",
                backgroundImage: `url(${card.img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "1px solid rgba(0, 80, 143, 0.3)"
              }}
            >
              {/* Dark Gradient Overlay */}
              <div style={{ 
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(to top, rgba(12, 24, 36, 0.98) 0%, rgba(20, 41, 58, 0.75) 45%, rgba(0,0,0,0.1) 100%)",
                zIndex: 1
              }} />

              {/* Card Content */}
              <div style={{ zIndex: 2, position: "relative", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <span style={{ 
                  fontFamily: "var(--font-title)", 
                  fontSize: "0.75rem", 
                  color: "hsl(var(--secondary-sky))", 
                  fontWeight: "bold",
                  textTransform: "uppercase" 
                }}>
                  {card.num} | {card.subtitle}
                </span>
                <h3 style={{ 
                  fontFamily: "var(--font-title)", 
                  fontSize: "1.35rem", 
                  color: "#f8fafc",
                  fontWeight: "bold" 
                }}>
                  {card.title}
                </h3>
                <p style={{ 
                  color: "rgba(248, 250, 252, 0.8)", 
                  fontSize: "0.85rem", 
                  lineHeight: "1.4" 
                }}>
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
