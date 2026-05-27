# Fase 3: Ecosistema Web: Portal Open Source & Dashboard de Control (Sprint 2)
## Desarrollo Frontend de Alto Impacto Visual con Visor 3D y Mapas de Calor

El ecosistema web de AQUORA se compone de dos portales interactivos desarrollados bajo **React 18 + Vite + Tailwind CSS**:
1. **Portal Open Source**: Un sitio de ultra-alto rendimiento visual para exhibir los planos del filtro físico, esquemas del hardware simulado, tutoriales de ensamble y un **Visor 3D interactivo** del hardware del filtro.
2. **Dashboard de Inteligencia Territorial (Fundación Ábaco)**: Un centro de control y visualización en tiempo real para análisis geoespacial, integrando **Leaflet.js** para mapeo de comunidades y **Recharts** para tendencias temporales de calidad de agua y predicciones.

---

## 1. Portal Open Source: Flujo y Visor 3D Interactivo (React Three Fiber)

El Visor 3D permite a comunidades y desarrolladores comprender la composición física del filtro (compuesto por capas purificadoras de arena silícea, zeolita activa, bagazo de caña de azúcar y la carcasa electrónica del ESP32).

### 1.1 El Flujo de Optimización 3D (CAD a Web)
Para garantizar tiempos de carga menores a 2 segundos en redes móviles vulnerables:
1. **Blender (Preparación de Malla):** Importar archivos CAD (STL o STEP) del filtro físico. Reducir la densidad poligonal aplicando un modificador *Decimate* (manteniendo menos de 50,000 polígonos totales). Crear costuras UV limpias y realizar un *Unwrap* eficiente en un único espacio UV (UDIM se evita a menos que sea estrictamente necesario; para la web, se prefiere un único mapa de textura *Atlas*).
2. **Substance Painter (Texturizado PBR):** Pintar materiales de alta fidelidad: plástico mate para la carcasa, textura granular para la arena, porosidad para la zeolita. Exportar mapas de textura en resolución compacta de `1024x1024` o `2048x2048` píxeles (BaseColor, Roughness, Metalness, Normal).
3. **Optimización en GLB/GLTF:** Combinar la malla y texturas en un único archivo binario `.glb`. Ejecutar la compresión en la terminal usando `gltf-pipeline` con compresión Draco:
   ```bash
   npx gltf-pipeline -i filter_raw.glb -o filter_optimized.glb -d
   ```

### 1.2 Implementación en React (`FilterViewer3D.jsx`)
Instalar dependencias clave:
```bash
npm install three @react-three/fiber @react-three/drei framer-motion
```

#### Archivo: `web/src/components/FilterViewer3D.jsx`
Componente interactivo con órbita y carga diferida (Lazy Loading) del modelo 3D.

```jsx
import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stage, Center } from "@react-three/drei";

// Sub-componente del Modelo 3D optimizado
function FilterModel({ url }) {
  // Carga automática del archivo GLTF / GLB optimizado con Draco
  const { scene } = useGLTF(url);
  const modelRef = useRef();

  // Micro-animación: Rotación suave continua antes de la interacción del usuario
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    modelRef.current.rotation.y = elapsed * 0.05;
  });

  return <primitive ref={modelRef} object={scene} scale={1.5} />;
}

export default function FilterViewer3D() {
  return (
    <div className="w-full h-[500px] bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 shadow-2xl">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-white font-bold text-lg">Explorador 3D del Filtro</h3>
        <p className="text-slate-400 text-xs">Mantén presionado para rotar | Scroll para zoom</p>
      </div>

      <Canvas dpr={[1, 2]} camera={{ fov: 45, position: [0, 0, 8] }} className="cursor-grab active:cursor-grabbing">
        <color attach="background" args={["#020617"]} />
        <ambientLight intensity={0.5} />
        
        {/* Iluminación de estudio optimizada */}
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        
        <Suspense fallback={<Loader3D />}>
          <Stage environment="city" intensity={0.6} contactShadow={{ opacity: 0.7, blur: 2 }}>
            <Center>
              {/* Ruta física al activo en la carpeta public de Vite */}
              <FilterModel url="/assets/models/filter_optimized.glb" />
            </Center>
          </Stage>
        </Suspense>

        <OrbitControls 
          enableZoom={true} 
          maxDistance={12} 
          minDistance={3}
          enablePan={false}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}

// Indicador visual de carga
function Loader3D() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#0ea5e9" wireframe />
    </mesh>
  );
}
```

---

## 2. Dashboard de Inteligencia Territorial (Fundación Ábaco)

Este dashboard consume el endpoint `/api/v1/stats/heatmap` de FastAPI para graficar la distribución territorial del riesgo sanitario y la evolución de los datos de los sensores.

### 2.1 Mapa Interactivos de Riesgo (`TerritorialMap.jsx`)
Instalar dependencias geoespaciales:
```bash
npm install leaflet react-leaflet
```

#### Archivo: `web/src/components/TerritorialMap.jsx`
Carga Leaflet, renderiza los mapas y colorea las comunidades dinámicamente según su nivel de riesgo epidemiológico e hídrico.

```jsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function TerritorialMap() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Consumir el endpoint unificado del Backend en FastAPI
    fetch("http://localhost:8000/api/v1/stats/heatmap")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando mapa territorial:", err);
        setLoading(false);
      });
  }, []);

  // Función para determinar color según el riesgo sanitario calculado
  const getRiskColor = (risk) => {
    switch (risk) {
      case "ALTO":
        return "#ef4444"; // Rojo (Peligro de brote EDA)
      case "MEDIO":
        return "#f59e0b"; // Amarillo/Naranja (Alerta preventiva)
      case "BAJO":
      default:
        return "#10b981"; // Verde (Agua segura)
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-slate-900 rounded-2xl border border-slate-800">
        <p className="text-sky-400 font-semibold animate-pulse">Cargando Mapa Territorial...</p>
      </div>
    );
  }

  // Coordenadas iniciales (Centro geográfico promedio para La Guajira)
  const defaultPosition = [11.544, -72.907];

  return (
    <div className="w-full bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl">
      <div className="mb-4">
        <h3 className="text-white font-bold text-xl">Mapa de Riesgo Sanitario e Hídrico</h3>
        <p className="text-slate-400 text-sm">Visualización en tiempo real basada en datos de SIVIGILA y telemetría IoT</p>
      </div>

      <div className="h-[500px] w-full rounded-xl overflow-hidden border border-slate-800">
        <MapContainer center={defaultPosition} zoom={9} style={{ height: "100%", width: "100%" }}>
          {/* Estilo de mapa oscuro premium */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {data.map((comm) => (
            <CircleMarker
              key={comm.community_id}
              center={[comm.latitude, comm.longitude]}
              radius={comm.sanitary_risk === "ALTO" ? 18 : 12}
              fillColor={getRiskColor(comm.sanitary_risk)}
              color="#ffffff"
              weight={1.5}
              fillOpacity={0.65}
            >
              <Popup>
                <div className="p-2 font-sans text-slate-800">
                  <h4 className="font-bold text-base border-b pb-1 mb-2">{comm.name}</h4>
                  <p className="text-xs mb-1">
                    🔴 <strong>Riesgo Sanitario:</strong>{" "}
                    <span className="font-bold" style={{ color: getRiskColor(comm.sanitary_risk) }}>
                      {comm.sanitary_risk}
                    </span>
                  </p>
                  <p className="text-xs mb-1">🧪 <strong>TDS:</strong> {comm.current_tds_ppm} ppm</p>
                  <p className="text-xs mb-1">💧 <strong>Turbidez:</strong> {comm.current_turbidity_ntu} NTU</p>
                  <p className="text-xs mb-1">🪣 <strong>Nivel de Tanque:</strong> {comm.current_water_level_pct}%</p>
                  <p className="text-xs mb-1">😷 <strong>Casos EDA Históricos:</strong> {comm.average_eda_cases.toFixed(1)} / sem</p>
                  <p className="text-[10px] text-slate-500 mt-2 border-t pt-1">
                    Último reporte: {new Date(comm.last_update).toLocaleTimeString()}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
```

### 2.2 Gráficos de Tendencias en Calidad de Agua (`TelemetryCharts.jsx`)
Instalar dependencias de visualización:
```bash
npm install recharts
```

#### Archivo: `web/src/components/TelemetryCharts.jsx`
Muestra el histórico de TDS, turbidez y nivel de llenado para la comunidad seleccionada.

```jsx
import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TelemetryCharts({ data }) {
  // Estructura esperada de 'data': [{ timestamp: '12:00', tds: 240, turbidity: 1.5, level: 85 }]
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-900">
      
      {/* Gráfico 1: Análisis de TDS (Calidad Química) */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
        <h4 className="text-slate-300 font-bold mb-4 text-sm uppercase tracking-wider">Histórico TDS (Sólidos Disueltos)</h4>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTds" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} unit="ppm" />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
              <Area type="monotone" dataKey="tds" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorTds)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 2: Turbidez (Calidad Física) */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
        <h4 className="text-slate-300 font-bold mb-4 text-sm uppercase tracking-wider">Histórico de Turbidez (NTU)</h4>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTurb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} unit="NTU" />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
              <Area type="monotone" dataKey="turbidity" stroke="#f59e0b" fillOpacity={1} fill="url(#colorTurb)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
```

---

## 3. Plan de Verificación y UI/UX Polish

1. **Alineación de Diseño Premium:**
   * Utilice Tailwind CSS para definir fondos en color pizarra oscuro (`bg-slate-950`).
   * Aplique efectos de desenfoque de fondo (*glassmorphism*) en menús flotantes: `bg-slate-900/80 backdrop-blur-md`.
2. **Validación de Datos:**
   * Encienda la simulación en Wokwi (Fase 2) y recargue el navegador.
   * Confirme que el marcador en `TerritorialMap.jsx` correspondiente a su comunidad de prueba parpadee en color **Rojo** si coloca valores altos de TDS en el potenciómetro virtual.
   * Haga clic sobre el marcador para verificar la actualización instantánea de la telemetría en el popup del mapa Leaflet.

---

## 4. Próximo Paso en el Ecosistema

Con el portal web y el centro de control geográfico funcionando, el siguiente paso es dotar al equipo técnico y comunitario de capacidad operativa en territorio mediante la app móvil en: **[Fase 4: Aplicación Móvil React Native](file:///E:/AQUORA/Fases%20de%20Desarrollo/04_Fase_Aplicacion_Movil_React_Native.md)**.
