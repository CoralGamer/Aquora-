import uvicorn
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from supabase import create_client, Client
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

# Habilitar CORS para integración con Web Portal, Web Dashboard y Apps móviles
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar cliente de Supabase de forma segura si la URL es válida
supabase: Optional[Client] = None
try:
    if settings.SUPABASE_URL and settings.SUPABASE_URL != "https://your-project.supabase.co":
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        print("-> Supabase Client initialized successfully.")
    else:
        print("-> WARNING: Supabase URL is placeholder. Database operations will be mocked or will fail.")
except Exception as e:
    print(f"-> WARNING: Failed to initialize Supabase Client: {e}")

# ==========================================
# Esquemas Pydantic
# ==========================================
class SensorReadingIn(BaseModel):
    device_key: str = Field(
        ..., 
        min_length=5, 
        max_length=50, 
        regex=r"^[a-zA-Z0-9_-]+$", 
        description="Clave única del dispositivo (Solo alfanuméricos, guiones y guiones bajos)"
    )
    tds_ppm: float = Field(..., ge=0, le=10000, description="Sólidos Totales Disueltos (ppm)")
    turbidity_ntu: float = Field(..., ge=0, le=1000, description="Turbidez (NTU)")
    water_level_pct: float = Field(..., ge=0, le=100, description="Nivel de agua del tanque (%)")

class HeatmapItem(BaseModel):
    community_id: str
    name: str
    latitude: float
    longitude: float
    current_tds_ppm: float
    current_turbidity_ntu: float
    current_water_level_pct: float
    average_eda_cases: float
    sanitary_risk: str # 'BAJO', 'MEDIO', 'ALTO'
    last_update: str

class TelemetryHistoryItem(BaseModel):
    timestamp: str
    tds: float
    turbidity: float
    level: float

# ==========================================
# Endpoints de la API
# ==========================================

@app.get("/")
def read_root():
    return {
        "status": "AQUORA API running", 
        "timestamp": datetime.now().isoformat(),
        "database_connected": supabase is not None
    }

@app.post("/api/v1/readings", status_code=status.HTTP_201_CREATED)
def receive_readings(payload: SensorReadingIn):
    """
    Recibe la telemetría en tiempo real enviada por los microcontroladores ESP32 (físicos o Wokwi).
    Mapea la 'device_key' al UUID de dispositivo correspondiente y registra la lectura en DB.
    """
    if not supabase:
        # Mock de respuesta para pruebas locales iniciales si no hay Supabase configurado
        return {
            "status": "mocked_success", 
            "note": "Supabase credentials not configured. Running in Mock Mode.",
            "data": payload.dict()
        }

    try:
        # 1. Validar existencia del dispositivo y mapear a UUID
        device_res = supabase.table("devices").select("id, active").eq("device_key", payload.device_key).execute()
        
        if not device_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dispositivo con device_key '{payload.device_key}' no registrado."
            )
        
        device = device_res.data[0]
        if not device["active"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El dispositivo está registrado pero se encuentra marcado como INACTIVO."
            )
        
        device_uuid = device["id"]
        
        # 2. Insertar la lectura en 'sensor_readings'
        reading_data = {
            "device_id": device_uuid,
            "tds_ppm": payload.tds_ppm,
            "turbidity_ntu": payload.turbidity_ntu,
            "water_level_pct": payload.water_level_pct,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        insert_res = supabase.table("sensor_readings").insert(reading_data).execute()
        
        # 3. Actualizar la última fecha de conexión en el dispositivo
        supabase.table("devices").update({"last_connection": datetime.utcnow().isoformat()}).eq("id", device_uuid).execute()
        
        return {"status": "success", "inserted_id": insert_res.data[0]["id"]}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno procesando telemetría: {e}"
        )

@app.get("/api/v1/stats/heatmap", response_model=List[HeatmapItem])
def get_heatmap_stats():
    """
    Sirve los datos geolocalizados de cada comunidad calculando su riesgo sanitario
    basado en las últimas lecturas físicas y los casos históricos de SIVIGILA.
    Optimizado mediante consultas bulk para un rendimiento menor a 500ms y evitar deadlocks de conexiones.
    """
    if not supabase:
        # Retornar datos mockeados si no hay base de datos conectada para no bloquear el desarrollo del mapa
        return [
            HeatmapItem(
                community_id="mock-uuid-1",
                name="Comunidad Uribia",
                latitude=11.713,
                longitude=-72.266,
                current_tds_ppm=340.5,
                current_turbidity_ntu=2.1,
                current_water_level_pct=82.0,
                average_eda_cases=12.4,
                sanitary_risk="MEDIO",
                last_update=datetime.now().isoformat()
            ),
            HeatmapItem(
                community_id="mock-uuid-2",
                name="Comunidad Manaure",
                latitude=11.775,
                longitude=-72.444,
                current_tds_ppm=620.0,
                current_turbidity_ntu=8.5,
                current_water_level_pct=15.0,
                average_eda_cases=28.7,
                sanitary_risk="ALTO",
                last_update=datetime.now().isoformat()
            ),
            HeatmapItem(
                community_id="mock-uuid-3",
                name="Comunidad Riohacha",
                latitude=11.544,
                longitude=-72.907,
                current_tds_ppm=180.0,
                current_turbidity_ntu=0.8,
                current_water_level_pct=95.0,
                average_eda_cases=4.2,
                sanitary_risk="BAJO",
                last_update=datetime.now().isoformat()
            )
        ]

    try:
        # 1. Bulk Query: Fetch all communities (1 call)
        comm_res = supabase.table("communities").select("*").execute()
        communities = comm_res.data
        if not communities:
            return []

        # 2. Bulk Query: Fetch all devices (1 call)
        dev_res = supabase.table("devices").select("id, community_id").execute()
        devices = dev_res.data
        
        # Map device_id to community_id, and vice versa
        comm_to_dev = {d["community_id"]: d["id"] for d in devices if d["community_id"]}

        # 3. Bulk Query: Fetch SIVIGILA cases for all communities (1 call)
        siv_res = supabase.table("sivigila_history").select("community_id, eda_cases").execute()
        siv_data = siv_res.data
        
        comm_to_cases = {}
        for row in siv_data:
            c_id = row["community_id"]
            comm_to_cases.setdefault(c_id, []).append(row["eda_cases"])

        # 4. Bulk Query: Fetch the last 100 sensor readings in total (1 call)
        # This covers the latest readings for all of our 8 active devices instantly
        read_res = supabase.table("sensor_readings")\
            .select("device_id, tds_ppm, turbidity_ntu, water_level_pct, timestamp")\
            .order("timestamp", desc=True)\
            .limit(100)\
            .execute()
        
        # Group by device_id and keep only the latest reading (since it is sorted desc)
        latest_readings = {}
        for row in read_res.data:
            d_id = row["device_id"]
            if d_id not in latest_readings:
                latest_readings[d_id] = row

        # Assemble everything in memory
        heatmap_data = []
        for comm in communities:
            comm_id = comm["id"]
            dev_id = comm_to_dev.get(comm_id)
            
            # Default values if no sensor readings are present
            tds = 0.0
            turbidity = 0.0
            level = 100.0
            last_ts = "Sin datos"
            
            if dev_id and dev_id in latest_readings:
                latest = latest_readings[dev_id]
                tds = latest["tds_ppm"]
                turbidity = latest["turbidity_ntu"]
                level = latest["water_level_pct"]
                last_ts = latest["timestamp"]
                
            # SIVIGILA average eda cases
            cases = comm_to_cases.get(comm_id, [])
            avg_cases = sum(cases) / len(cases) if cases else 0.0
            
            # Sanitary risk logic
            risk_score = 0
            if tds > 400: risk_score += 2
            if turbidity > 5: risk_score += 2
            if level < 20: risk_score += 1
            if avg_cases > 15: risk_score += 2
            
            sanitary_risk = "BAJO"
            if risk_score >= 5:
                sanitary_risk = "ALTO"
            elif risk_score >= 3:
                sanitary_risk = "MEDIO"
                
            heatmap_data.append(
                HeatmapItem(
                    community_id=str(comm_id),
                    name=comm["name"],
                    latitude=comm["latitude"],
                    longitude=comm["longitude"],
                    current_tds_ppm=tds,
                    current_turbidity_ntu=turbidity,
                    current_water_level_pct=level,
                    average_eda_cases=avg_cases,
                    sanitary_risk=sanitary_risk,
                    last_update=last_ts
                )
            )
            
        return heatmap_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo métricas geoespaciales: {e}"
        )

@app.get("/api/v1/readings/history/{community_id}", response_model=List[TelemetryHistoryItem])
def get_telemetry_history(community_id: str):
    """
    Retorna el historial de las últimas 20 lecturas de sensores de la comunidad especificada,
    ordenadas cronológicamente para alimentar gráficos de tendencias (Recharts).
    """
    if not supabase:
        # Retornar datos mockeados si no hay base de datos conectada para no bloquear el desarrollo
        return [
            TelemetryHistoryItem(
                timestamp=f"12:{10+i}",
                tds=250.0 + i * 2,
                turbidity=1.2 + i * 0.1,
                level=80.0 - i
            )
            for i in range(10)
        ]
        
    try:
        # 1. Buscar dispositivo asociado a la comunidad
        dev_res = supabase.table("devices").select("id").eq("community_id", community_id).execute()
        if not dev_res.data:
            return []
            
        dev_id = dev_res.data[0]["id"]
        
        # 2. Consultar las últimas 20 lecturas en orden descendente
        read_res = supabase.table("sensor_readings")\
            .select("tds_ppm, turbidity_ntu, water_level_pct, timestamp")\
            .eq("device_id", dev_id)\
            .order("timestamp", desc=True)\
            .limit(20)\
            .execute()
            
        # 3. Formatear y ordenar de forma ascendente (cronológica)
        history = []
        for row in reversed(read_res.data):
            ts_str = row["timestamp"]
            try:
                # Intenta formatear la hora
                dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                formatted_ts = dt.strftime("%H:%M:%S")
            except Exception:
                formatted_ts = ts_str[11:19] if len(ts_str) > 19 else ts_str
                
            history.append(
                TelemetryHistoryItem(
                    timestamp=formatted_ts,
                    tds=row["tds_ppm"],
                    turbidity=row["turbidity_ntu"],
                    level=row["water_level_pct"]
                )
            )
        return history
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo histórico de telemetría: {e}"
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.API_PORT, reload=True)
