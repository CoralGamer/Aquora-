import React, { Suspense, useState, useRef, useEffect, Component } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stage, Center } from "@react-three/drei";

// Utility to test if WebGL context can actually be initialized in this browser
function checkWebGLSupport() {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return !!(window.WebGLRenderingContext && gl);
  } catch (e) {
    return false;
  }
}

// Resilient Error Boundary that catches any WebGL or Three.js crash
class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("WebGL Canvas failed to initialize safely. Falling back to 2D Schematic View:", error, errorInfo);
    if (this.props.onCatch) {
      this.props.onCatch(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Procedural 3D model component for the AQUORA Filter
function AquoraProceduralFilter({ explode }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    }
  });

  const yOffsetElectronics = explode * 2.8;
  const yOffsetBagasse = explode * 1.4;
  const yOffsetZeolite = explode * 0.0;
  const yOffsetSand = explode * -1.4;

  return (
    <group ref={groupRef}>
      {/* 1. TOP ELECTRONICS (ESP32 DevKit + LED) */}
      <group position={[0, 1.8 + yOffsetElectronics, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.9, 0.9, 0.18, 32]} />
          <meshStandardMaterial color="#00508F" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.13, 0]} castShadow>
          <boxGeometry args={[0.4, 0.08, 0.5]} />
          <meshStandardMaterial color="#14293A" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0.2, 0.13, 0.2]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshBasicMaterial color="#ADDBFF" />
        </mesh>
        <mesh position={[-0.2, 0.13, -0.2]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
      </group>

      {/* 2. FILTER LAYER 1: Sugarcane Bagasse */}
      <mesh position={[0, 1.0 + yOffsetBagasse, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.5, 32]} />
        <meshStandardMaterial color="#4F3815" roughness={0.95} metalness={0.05} bumpScale={0.1} />
      </mesh>

      {/* 3. FILTER LAYER 2: Activated Zeolite */}
      <mesh position={[0, 0.3 + yOffsetZeolite, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.5, 32]} />
        <meshStandardMaterial color="#8F5601" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* 4. FILTER LAYER 3: Silica Sand */}
      <mesh position={[0, -0.4 + yOffsetSand, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.5, 32]} />
        <meshStandardMaterial color="#FFCD82" roughness={0.85} metalness={0.0} />
      </mesh>

      {/* 5. BASE & OUTLET CAP */}
      <mesh position={[0, -1.0, 0]} castShadow>
        <cylinderGeometry args={[0.85, 0.6, 0.3, 32]} />
        <meshStandardMaterial color="#00508F" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0, -1.3, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 32]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* 6. TRANSLUCENT OUTER CASING */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.95, 0.95, 3.1, 32, 1, true]} />
        <meshStandardMaterial 
          color="#ADDBFF" 
          transparent={true} 
          opacity={0.18} 
          roughness={0.05} 
          metalness={0.95} 
          side={2}
        />
      </mesh>
    </group>
  );
}

// High-fidelity 2D Interactive Exploded Schematic View (100% crash-proof on any browser or GPU)
function AquoraSchematic2D({ explode, onSelectLayer }) {
  const yElectronics = -explode * 60;
  const yBagasse = -explode * 30;
  const yZeolite = 0;
  const ySand = explode * 30;
  const yBase = explode * 60;

  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      padding: "1rem",
      background: "radial-gradient(ellipse at center, #0f2438 0%, #08121c 100%)",
      userSelect: "none"
    }}>
      {/* Translucent cylinder background indicator */}
      <div style={{
        position: "absolute",
        width: "190px",
        height: "280px",
        border: "1.5px dashed rgba(56, 189, 248, 0.25)",
        borderRadius: "16px",
        pointerEvents: "none",
        zIndex: 0,
        boxShadow: "inset 0 0 20px rgba(14, 165, 233, 0.05)"
      }} />

      {/* Central Interactive Stack */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 2,
        width: "100%",
        maxWidth: "260px"
      }}>

        {/* 1. ESP32 Cerebro IoT */}
        <div 
          onClick={() => onSelectLayer(0.35)}
          style={{
            transform: `translateY(${yElectronics}px)`,
            transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            width: "170px",
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            color: "#ffffff",
            padding: "0.55rem 0.75rem",
            borderRadius: "8px",
            border: "1.5px solid #38bdf8",
            boxShadow: "0 4px 15px rgba(2, 132, 199, 0.4)",
            cursor: "pointer",
            marginBottom: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.8rem",
            fontWeight: 600
          }}
          title="Clic para ver detalles de telemetría"
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            🧠 <span>Cerebro ESP32 IoT</span>
          </span>
          <span style={{ 
            width: "8px", 
            height: "8px", 
            borderRadius: "50%", 
            background: "#22c55e", 
            boxShadow: "0 0 8px #22c55e" 
          }} />
        </div>

        {/* 2. Capa 1: Bagazo de Caña */}
        <div 
          onClick={() => onSelectLayer(0.65)}
          style={{
            transform: `translateY(${yBagasse}px)`,
            transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            width: "160px",
            background: "linear-gradient(135deg, #78350f 0%, #451a03 100%)",
            color: "#fef3c7",
            padding: "0.5rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid #d97706",
            boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
            cursor: "pointer",
            marginBottom: "6px",
            textAlign: "center",
            fontSize: "0.78rem",
            fontWeight: 600
          }}
          title="Clic para ver detalles de Capa 1"
        >
          🌾 Capa 1: Bagazo de Caña
        </div>

        {/* 3. Capa 2: Zeolita Activa */}
        <div 
          onClick={() => onSelectLayer(0.9)}
          style={{
            transform: `translateY(${yZeolite}px)`,
            transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            width: "160px",
            background: "linear-gradient(135deg, #b45309 0%, #78350f 100%)",
            color: "#fff7ed",
            padding: "0.5rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid #f59e0b",
            boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
            cursor: "pointer",
            marginBottom: "6px",
            textAlign: "center",
            fontSize: "0.78rem",
            fontWeight: 600
          }}
          title="Clic para ver detalles de Zeolita"
        >
          🪨 Capa 2: Zeolita Activa
        </div>

        {/* 4. Capa 3: Arena Silícea */}
        <div 
          onClick={() => onSelectLayer(0.9)}
          style={{
            transform: `translateY(${ySand}px)`,
            transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            width: "160px",
            background: "linear-gradient(135deg, #fcd34d 0%, #d97706 100%)",
            color: "#451a03",
            padding: "0.5rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid #fde68a",
            boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
            cursor: "pointer",
            marginBottom: "6px",
            textAlign: "center",
            fontSize: "0.78rem",
            fontWeight: 700
          }}
          title="Clic para ver detalles de Arena Silícea"
        >
          ⏳ Capa 3: Arena Silícea
        </div>

        {/* 5. Base & Grifo */}
        <div 
          onClick={() => onSelectLayer(0.0)}
          style={{
            transform: `translateY(${yBase}px)`,
            transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            width: "140px",
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "#38bdf8",
            padding: "0.45rem 0.75rem",
            borderRadius: "0 0 10px 10px",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            cursor: "pointer",
            textAlign: "center",
            fontSize: "0.75rem",
            fontWeight: 600
          }}
          title="Clic para ver vista completa"
        >
          💧 Salida de Agua Purificada
        </div>

      </div>

      {/* Bottom badge */}
      <div style={{ position: "absolute", bottom: "8px", left: "10px", zIndex: 10, pointerEvents: "none" }}>
        <span style={{ fontSize: "0.72rem", background: "rgba(0,0,0,0.65)", padding: "0.2rem 0.5rem", borderRadius: "4px", color: "hsl(var(--text-muted))" }}>
          📐 Diagrama Esquemático Interactivo 2D
        </span>
      </div>
    </div>
  );
}

export default function FilterViewer3D() {
  const [explode, setExplode] = useState(0.0);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [force2D, setForce2D] = useState(false);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    const supported = checkWebGLSupport();
    setWebGlSupported(supported);
    if (!supported) {
      setForce2D(true);
    }
  }, []);

  const getActiveLayerDescription = () => {
    if (explode < 0.2) {
      return {
        title: "AQUORA Filtro Unificado",
        description: "Un filtro ecológico diseñado para operar en territorio vulnerable. Combina tres camas biológicas con un cerebro electrónico ESP32 de bajo costo que transmite telemetría de calidad de agua en tiempo real."
      };
    } else if (explode < 0.5) {
      return {
        title: "🧠 Cerebro IoT (ESP32 DevKit v4)",
        description: "Mide y promedia las señales del sensor TDS, sensor de Turbidez y Ultrasonido. Conectividad híbrida auto-detectable (GSM, Ethernet y WiFi) con transmisión en tiempo real."
      };
    } else if (explode < 0.8) {
      return {
        title: "🌾 Capa 1: Bagazo de Caña de Azúcar",
        description: "Cama filtrante biológica altamente porosa. Actúa atrapando metales pesados en disolución y compuestos orgánicos mediante adsorción molecular, reduciendo el color y olor del agua."
      };
    } else {
      return {
        title: "🪨 Capa 2 y 3: Zeolita y Arena Silícea",
        description: "La zeolita activa atrapa toxinas químicas y micro-contaminantes por intercambio iónico, mientras que la arena de sílice retiene los sedimentos gruesos, logrando un agua transparente y potable."
      };
    }
  };

  const info = getActiveLayerDescription();
  const shouldUse2D = force2D || !webGlSupported || renderError;

  return (
    <div className="card" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", minHeight: "580px" }}>
      
      {/* Visual Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-title)", fontSize: "1.5rem", color: "hsl(var(--text-main))", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            🛸 Visor del Dispositivo en {shouldUse2D ? "Diagrama 2D" : "3D"}
          </h2>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Desarma el filtro en tiempo real para entender sus capas de depuración ecológica
          </p>
        </div>

        {/* View Mode Toggle Button */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {webGlSupported && !renderError && (
            <div style={{ display: "inline-flex", background: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "3px", border: "1px solid hsl(var(--border-light))" }}>
              <button
                type="button"
                onClick={() => setForce2D(false)}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: !shouldUse2D ? "hsl(var(--primary))" : "transparent",
                  color: !shouldUse2D ? "#ffffff" : "hsl(var(--text-muted))",
                  transition: "all 0.2s"
                }}
              >
                🛸 3D
              </button>
              <button
                type="button"
                onClick={() => setForce2D(true)}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: shouldUse2D ? "hsl(var(--primary))" : "transparent",
                  color: shouldUse2D ? "#ffffff" : "hsl(var(--text-muted))",
                  transition: "all 0.2s"
                }}
              >
                📐 2D Esquemático
              </button>
            </div>
          )}

          {renderError && (
            <button
              type="button"
              onClick={() => {
                setRenderError(false);
                setForce2D(false);
              }}
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.78rem",
                fontWeight: 600,
                borderRadius: "6px",
                border: "1px solid hsl(var(--primary))",
                background: "transparent",
                color: "hsl(var(--primary))",
                cursor: "pointer"
              }}
            >
              🔄 Reintentar 3D
            </button>
          )}
        </div>
      </div>

      {/* Explode View Slider */}
      <div style={{ 
        background: "rgba(0, 0, 0, 0.2)", 
        border: "1px solid hsl(var(--border-light))", 
        borderRadius: "12px", 
        padding: "1rem 1.25rem", 
        display: "flex", 
        flexDirection: "column", 
        gap: "0.5rem" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontFamily: "var(--font-title)", fontSize: "0.85rem", textTransform: "uppercase", color: "hsl(var(--primary))", letterSpacing: "0.05em" }}>
            Desarmar Filtro / Vista Explosionada
          </strong>
          <span style={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))", fontWeight: "bold" }}>
            {Math.round(explode * 100)}%
          </span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={explode} 
          onChange={(e) => setExplode(parseFloat(e.target.value))}
          style={{ 
            width: "100%", 
            height: "6px", 
            borderRadius: "3px", 
            background: "hsl(var(--bg-card-hover))", 
            outline: "none", 
            cursor: "pointer",
            accentColor: "hsl(var(--primary))"
          }}
        />
      </div>

      {/* 3D / 2D Canvas + Side info panel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
        
        {/* Canvas WebGL or 2D Schematic */}
        <div style={{ 
          height: "360px", 
          borderRadius: "12px", 
          overflow: "hidden", 
          border: "1px solid hsl(var(--border-light))", 
          background: "#0c1824",
          position: "relative"
        }}>
          {shouldUse2D ? (
            <AquoraSchematic2D explode={explode} onSelectLayer={(val) => setExplode(val)} />
          ) : (
            <WebGLErrorBoundary 
              fallback={<AquoraSchematic2D explode={explode} onSelectLayer={(val) => setExplode(val)} />}
              onCatch={() => setRenderError(true)}
            >
              <div style={{ position: "absolute", bottom: "10px", left: "10px", zIndex: 10, pointerEvents: "none" }}>
                <span style={{ fontSize: "0.75rem", background: "rgba(0,0,0,0.6)", padding: "0.25rem 0.5rem", borderRadius: "4px", color: "hsl(var(--text-muted))" }}>
                  🖱️ Arrastra para rotar | Scroll para zoom
                </span>
              </div>

              <Canvas camera={{ position: [0, 0, 7.5], fov: 40 }} dpr={[1, 2]}>
                <color attach="background" args={["#0c1824"]} />
                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
                <directionalLight position={[-5, -5, -5]} intensity={0.3} />
                
                <Suspense fallback={null}>
                  <Stage environment="city" intensity={0.5} contactShadow={{ opacity: 0.6, blur: 2.5 }}>
                    <Center>
                      <AquoraProceduralFilter explode={explode} />
                    </Center>
                  </Stage>
                </Suspense>

                <OrbitControls 
                  enableZoom={true} 
                  maxDistance={12} 
                  minDistance={4} 
                  enablePan={false}
                />
              </Canvas>
            </WebGLErrorBoundary>
          )}
        </div>

        {/* Side educational description board */}
        <div className="card" style={{ 
          background: "rgba(14, 165, 233, 0.03)", 
          borderColor: "hsla(var(--primary) / 0.1)", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center", 
          padding: "1.5rem",
          transition: "all 0.3s ease"
        }}>
          <h3 style={{ 
            fontFamily: "var(--font-title)", 
            color: explode > 0.1 ? "hsl(var(--primary))" : "hsl(var(--text-main))", 
            fontSize: "1.25rem", 
            marginBottom: "0.75rem",
            transition: "color 0.2s"
          }}>
            {info.title}
          </h3>
          <p style={{ 
            color: "hsl(var(--text-muted))", 
            fontSize: "0.95rem", 
            lineHeight: "1.6" 
          }}>
            {info.description}
          </p>

          {shouldUse2D && !renderError && !webGlSupported && (
            <div style={{ marginTop: "1rem", padding: "0.75rem", borderRadius: "8px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
              <span style={{ fontSize: "0.8rem", color: "#fbbf24", display: "block" }}>
                💡 <strong>Nota del navegador:</strong> WebGL o aceleración por hardware no está disponible en este equipo. Mostrando diagrama esquemático 2D interactivo.
              </span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

