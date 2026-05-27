import React, { Suspense, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stage, Center } from "@react-three/drei";

// Procedural 3D model component for the AQUORA Filter
function AquoraProceduralFilter({ explode }) {
  const groupRef = useRef();

  // Baseline gentle rotation to make the 3D scene feel alive
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    }
  });

  // Vertical offsets based on the 'explode' factor (0 to 1)
  const yOffsetElectronics = explode * 2.8;
  const yOffsetBagasse = explode * 1.4;
  const yOffsetZeolite = explode * 0.0;
  const yOffsetSand = explode * -1.4;

  return (
    <group ref={groupRef}>
      {/* 1. TOP ELECTRONICS (ESP32 DevKit + LED) */}
      <group position={[0, 1.8 + yOffsetElectronics, 0]}>
        {/* PCB Board */}
        <mesh castShadow>
          <cylinderGeometry args={[0.9, 0.9, 0.18, 32]} />
          <meshStandardMaterial color="#065f46" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* ESP32 chip */}
        <mesh position={[0, 0.13, 0]} castShadow>
          <boxGeometry args={[0.4, 0.08, 0.5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Visual LED Status Glow Indicator */}
        <mesh position={[0.2, 0.13, 0.2]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
        <mesh position={[-0.2, 0.13, -0.2]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
      </group>

      {/* 2. FILTER LAYER 1: Sugarcane Bagasse (Bagazo de Caña de Azúcar) */}
      <mesh position={[0, 1.0 + yOffsetBagasse, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.5, 32]} />
        {/* Fibrous brownish/golden texture */}
        <meshStandardMaterial color="#b45309" roughness={0.95} metalness={0.05} bumpScale={0.1} />
      </mesh>

      {/* 3. FILTER LAYER 2: Activated Zeolite (Zeolita Activa) */}
      <mesh position={[0, 0.3 + yOffsetZeolite, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.5, 32]} />
        {/* Porous charcoal/dark gray texture */}
        <meshStandardMaterial color="#334155" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* 4. FILTER LAYER 3: Silica Sand (Arena Silícea de Alta Densidad) */}
      <mesh position={[0, -0.4 + yOffsetSand, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.5, 32]} />
        {/* Golden-yellow sandy texture */}
        <meshStandardMaterial color="#eab308" roughness={0.85} metalness={0.0} />
      </mesh>

      {/* 5. BASE & OUTLET CAP */}
      <mesh position={[0, -1.0, 0]} castShadow>
        <cylinderGeometry args={[0.85, 0.6, 0.3, 32]} />
        <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0, -1.3, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 32]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* 6. TRANSLUCENT OUTER CASING (Explodes outwards slightly or stays as reference) */}
      {/* High-quality thick glassy acrylic cylinder */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.95, 0.95, 3.1, 32, 1, true]} />
        <meshStandardMaterial 
          color="#38bdf8" 
          transparent={true} 
          opacity={0.18} 
          roughness={0.05} 
          metalness={0.95} 
          side={2} /* Double-sided rendering */
        />
      </mesh>
    </group>
  );
}

export default function FilterViewer3D() {
  const [explode, setExplode] = useState(0.0); // 0 (closed) to 1 (fully exploded)

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

  return (
    <div className="card" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", minHeight: "580px" }}>
      
      {/* Visual Header */}
      <div>
        <h2 style={{ fontFamily: "var(--font-title)", fontSize: "1.5rem", color: "hsl(var(--text-main))", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          🛸 Visor del Dispositivo en 3D
        </h2>
        <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem", marginTop: "0.25rem" }}>
          Desarma el filtro en tiempo real para entender sus capas de depuración ecológica
        </p>
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

      {/* 3D Canvas + Side info panel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
        
        {/* Canvas WebGL */}
        <div style={{ 
          height: "360px", 
          borderRadius: "12px", 
          overflow: "hidden", 
          border: "1px solid hsl(var(--border-light))", 
          background: "#020617",
          position: "relative"
        }}>
          
          <div style={{ position: "absolute", bottom: "10px", left: "10px", zIndex: 10, pointerEvents: "none" }}>
            <span style={{ fontSize: "0.75rem", background: "rgba(0,0,0,0.6)", padding: "0.25rem 0.5rem", borderRadius: "4px", color: "hsl(var(--text-muted))" }}>
              🖱️ Arrastra para rotar | Scroll para zoom
            </span>
          </div>

          <Canvas camera={{ position: [0, 0, 7.5], fov: 40 }} dpr={[1, 2]}>
            <color attach="background" args={["#020617"]} />
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
        </div>

      </div>

    </div>
  );
}
