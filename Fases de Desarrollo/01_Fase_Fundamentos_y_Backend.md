# Fase 1: Fundamentos, Base de Datos y Backend (Sprint 0)
## Guía de Desarrollo Técnica y Ejecutable para la Hackathon

Esta fase sienta las bases de datos y la capa de servicios del ecosistema AQUORA. Configura el esquema de datos en Supabase y levanta la API de alto rendimiento en FastAPI para recibir telemetría de los sensores de agua y proveer datos analíticos a los clientes web y móviles.

---

## 1. Configuración de Base de Datos (Supabase SQL)

Deberá ejecutar el siguiente script DDL completo dentro del editor SQL de Supabase. Este script define el esquema relacional centralizado, establece restricciones de integridad, crea índices de búsqueda rápida geográfica y configura políticas básicas de seguridad (RLS).

```sql
-- Habilitar la extensión UUID si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLA: Comunidades Registradas
-- ==========================================
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL, -- Ej: 'La Guajira', 'Chocó'
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    whatsapp_contact VARCHAR(20) NOT NULL, -- Formato internacional (Ej: +573001234567)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. TABLA: Dispositivos IoT (Físicos o Wokwi)
-- ==========================================
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
    device_key VARCHAR(100) UNIQUE NOT NULL, -- Código identificador único del ESP32
    active BOOLEAN DEFAULT TRUE,
    last_connection TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. TABLA: Lecturas de Sensores (Telemetría)
-- ==========================================
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    tds_ppm DOUBLE PRECISION NOT NULL, -- Sólidos Disueltos Totales (Calidad del agua)
    turbidity_ntu DOUBLE PRECISION NOT NULL, -- Turbidez
    water_level_pct DOUBLE PRECISION NOT NULL, -- Nivel del tanque (0 - 100)
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. TABLA: Histórico Epidemiológico SIVIGILA
-- ==========================================
CREATE TABLE IF NOT EXISTS sivigila_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    year INT NOT NULL,
    week INT NOT NULL CHECK (week BETWEEN 1 AND 53),
    eda_cases INT DEFAULT 0 NOT NULL, -- Casos de Enfermedades Diarreicas Agudas reportados
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. TABLA: Predicciones de Riesgo (Prophet Output)
-- ==========================================
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    prediction_date DATE NOT NULL,
    predicted_tds_ppm DOUBLE PRECISION NOT NULL,
    predicted_turbidity_ntu DOUBLE PRECISION NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('BAJO', 'MEDIO', 'ALTO')),
    confidence_score DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Índices para Optimización de Consultas
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_timestamp ON sensor_readings(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_communities_coords ON communities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_predictions_community_date ON predictions(community_id, prediction_date DESC);

-- ==========================================
-- Trigger para Actualización Automática de updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_communities_modtime BEFORE UPDATE ON communities FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_devices_modtime BEFORE UPDATE ON devices FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
```

> [!TIP]
> Por defecto en una hackathon rápida, puede desactivar temporalmente **Row Level Security (RLS)** en Supabase o crear una política permisiva para pruebas rápidas de telemetría sin pasar tokens de autenticación complejos desde el ESP32:
> ```sql
> ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
> CREATE POLICY "Permitir inserciones públicas de telemetría" ON sensor_readings FOR INSERT WITH CHECK (true);
> CREATE POLICY "Permitir lectura pública de lecturas" ON sensor_readings FOR SELECT USING (true);
> ```

---

## 2. Ingesta ETL de Datos Históricos (SIVIGILA)

Para entrenar los modelos de predicción de brotes de EDA, necesitamos cargar el histórico de datos del Observatorio Ábaco y SIVIGILA. El siguiente script en Python (`etl_sivigila.py`) simula la ingesta automatizada a Supabase cruzando nombres de comunidades.

```python
import os
import pandas as pd
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "your-service-role-key")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def load_and_ingest_data(csv_path: str):
    print("Iniciando ETL de Datos Históricos...")
    # Cargar CSV de datos SIVIGILA (Ejemplo: columnas community_name, year, week, eda_cases)
    df = pd.read_csv(csv_path)
    
    # Obtener el listado de comunidades registradas en base de datos para mapear UUIDs
    res = supabase.table("communities").select("id, name").execute()
    comm_map = {row["name"]: row["id"] for row in res.data}
    
    records = []
    for _, row in df.iterrows():
        comm_name = row["community_name"]
        if comm_name in comm_map:
            records.append({
                "community_id": comm_map[comm_name],
                "year": int(row["year"]),
                "week": int(row["week"]),
                "eda_cases": int(row["eda_cases"])
            })
        else:
            print(f"Advertencia: La comunidad '{comm_name}' no existe en DB. Saltando fila.")
            
    if records:
        chunk_size = 500
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i + chunk_size]
            supabase.table("sivigila_history").insert(chunk).execute()
        print(f"Éxito: Se ingresaron {len(records)} registros de SIVIGILA.")
    else:
        print("No se encontraron registros válidos para insertar.")

if __name__ == "__main__":
    # Supongamos un archivo csv base
    # load_and_ingest_data("sivigila_data.csv")
    pass
```

---

## 3. Servidor de API Backend (FastAPI)

### 3.1 Entorno y Dependencias
Cree la carpeta `/backend` y guarde el archivo `requirements.txt`:

```text
fastapi==0.110.0
uvicorn==0.28.0
supabase==2.3.1
pydantic==2.6.4
pydantic-settings==2.2.1
pandas==2.2.1
numpy==1.26.4
```

### 3.2 Estructura y Código Fuente

#### Archivo: `backend/app/core/config.py`
Maneja las variables de entorno de forma tipada con Pydantic.

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str  # Preferiblemente Service Role Key para operaciones seguras backend
    API_PORT: int = 8000
    PROJECT_NAME: str = "AQUORA Unified API"

    class Config:
        env_file = ".env"

settings = Settings()
```

#### Archivo: `backend/main.py`
El punto de entrada del backend que define los esquemas de datos Pydantic y los endpoints principales del sistema.

```python
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

# Inicializar cliente de Supabase
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# ==========================================
# Esquemas Pydantic
# ==========================================
class SensorReadingIn(BaseModel):
    device_key: str = Field(..., description="Clave única del dispositivo ESP32")
    tds_ppm: float = Field(..., ge=0, description="Sólidos Totales Disueltos (ppm)")
    turbidity_ntu: float = Field(..., ge=0, description="Turbidez (NTU)")
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

# ==========================================
# Endpoints de la API
# ==========================================

@app.get("/")
def read_root():
    return {"status": "AQUORA API running", "timestamp": datetime.now().isoformat()}

@app.post("/api/v1/readings", status_code=status.HTTP_201_CREATED)
async def receive_readings(payload: SensorReadingIn):
    """
    Recibe la telemetría en tiempo real enviada por los microcontroladores ESP32 (físicos o Wokwi).
    Mapea la 'device_key' al UUID de dispositivo correspondiente y registra la lectura en DB.
    """
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

@app.get("/api/v1/stats/heatmap", response_model=List[HeatmapItem])
async def get_heatmap_stats():
    """
    Sirve los datos geolocalizados de cada comunidad calculando su riesgo sanitario
    basado en las últimas lecturas físicas y los casos históricos de SIVIGILA.
    Diseñado para alimentar dinámicamente el visor Leaflet.js.
    """
    # 1. Obtener comunidades
    comm_res = supabase.table("communities").select("*").execute()
    communities = comm_res.data
    
    heatmap_data = []
    
    for comm in communities:
        comm_id = comm["id"]
        
        # 2. Obtener el dispositivo asociado a la comunidad
        dev_res = supabase.table("devices").select("id").eq("community_id", comm_id).execute()
        
        tds = 0.0
        turbidity = 0.0
        level = 100.0
        last_ts = "Sin datos"
        
        if dev_res.data:
            dev_id = dev_res.data[0]["id"]
            # Obtener última lectura de sensores
            read_res = supabase.table("sensor_readings")\
                .select("tds_ppm, turbidity_ntu, water_level_pct, timestamp")\
                .eq("device_id", dev_id)\
                .order("timestamp", desc=True)\
                .limit(1)\
                .execute()
                
            if read_res.data:
                latest = read_res.data[0]
                tds = latest["tds_ppm"]
                turbidity = latest["turbidity_ntu"]
                level = latest["water_level_pct"]
                last_ts = latest["timestamp"]
        
        # 3. Obtener casos promedio de SIVIGILA
        siv_res = supabase.table("sivigila_history").select("eda_cases").eq("community_id", comm_id).execute()
        cases = [row["eda_cases"] for row in siv_res.data]
        avg_cases = sum(cases) / len(cases) if cases else 0.0
        
        # 4. Algoritmo heurístico para clasificar Riesgo Sanitario (MVP)
        # El riesgo sube si el TDS es alto (> 500), la turbidez es alta (> 5) o hay histórico alto de EDA
        risk_score = 0
        if tds > 400: risk_score += 2
        if turbidity > 5: risk_score += 2
        if level < 20: risk_score += 1 # Estrés hídrico (tanque vacío)
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

if __name__ == "__main__":
    # Iniciar localmente: python main.py
    uvicorn.run("main:app", host="0.0.0.0", port=settings.API_PORT, reload=True)
```

---

## 4. Plan de Verificación y Pruebas

Para garantizar que esta base está completamente robusta e integrada antes de avanzar a la Fase 2, ejecute las siguientes validaciones:

### 4.1 Validar Endpoints con cURL (Terminal)
Levante el servidor en local (`python main.py` desde la carpeta `/backend` con las credenciales de Supabase en un archivo `.env`):

```bash
# 1. Comprobar salud del API
curl -X GET http://localhost:8000/

# 2. Simular inserción de lectura desde ESP32 (Prueba Fallida por dispositivo no registrado)
curl -X POST http://localhost:8000/api/v1/readings \
     -H "Content-Type: application/json" \
     -d '{"device_key": "DEV_ESP32_GUAF1", "tds_ppm": 240.5, "turbidity_ntu": 1.2, "water_level_pct": 85.0}'

# 3. Comprobar retorno de datos geográficos para Leaflet
curl -X GET http://localhost:8000/api/v1/stats/heatmap
```

### 4.2 Documentación Interactiva (Swagger UI)
Navegue con su navegador web a `http://localhost:8000/docs` para visualizar y probar de forma interactiva todos los esquemas Pydantic y endpoints auto-documentados.

---

## 5. Próximo Paso en el Ecosistema

Una vez configurada la Base de Datos relacional y levantada la API, proceda a la simulación física del microcontrolador en: **[Fase 2: Hardware Simulado y Telemetría IoT](file:///E:/AQUORA/Fases%20de%20Desarrollo/02_Fase_Hardware_y_Telemetria.md)**.
