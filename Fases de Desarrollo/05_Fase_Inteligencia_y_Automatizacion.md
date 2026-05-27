# Fase 5: Inteligencia Predictiva, Workflows y WhatsApp Bot (Sprint 2-3)
## Motor de IA con Prophet, Orquestación n8n y Notificaciones OpenWA

AQUORA pasa de ser un sistema de monitoreo reactivo a uno de prevención temprana. En esta fase, integramos:
1. **Modelo Inteligente (Facebook Prophet)**: Un script de machine learning en Python que proyecta la calidad del agua y el riesgo de brotes de Enfermedades Diarreicas Agudas (EDA) a 7 días.
2. **Workflows en n8n**: Un motor de automatización visual que escucha inserciones críticas en Supabase.
3. **Notificaciones de WhatsApp Abiertas (OpenWA)**: Un bot autoalojado que notifica instantáneamente a los contactos comunitarios registrados cuando se detecta agua insalubre.

---

## 1. Modelo Preventivo de Calidad de Agua (Facebook Prophet)

### 1.1 Preparación del Entorno
En la carpeta `/backend` o un microservicio de IA independiente, instale las librerías necesarias:
```bash
pip install prophet supabase pandas numpy pydantic
```

### 1.2 Módulo de Machine Learning (`prophet_predictor.py`)
Este script se ejecuta periódicamente (a través de un cron job) para leer las series temporales históricas de sensores y generar proyecciones de riesgo sanitario en Supabase.

```python
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from prophet import Prophet
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "your-service-role-key")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_historical_readings(community_id: str) -> pd.DataFrame:
    """Recupera el historial de lecturas asociadas a una comunidad a través de su dispositivo."""
    # 1. Obtener dispositivo
    dev_res = supabase.table("devices").select("id").eq("community_id", community_id).execute()
    if not dev_res.data:
        return pd.DataFrame()
    
    device_id = dev_res.data[0]["id"]
    
    # 2. Obtener todas las lecturas de telemetría registradas
    read_res = supabase.table("sensor_readings")\
        .select("tds_ppm, turbidity_ntu, timestamp")\
        .eq("device_id", device_id)\
        .order("timestamp", desc=False)\
        .execute()
        
    if not read_res.data:
        return pd.DataFrame()
        
    df = pd.DataFrame(read_res.data)
    # Renombrar columnas para Prophet: ds (date/time) y y (variable objetivo)
    df['ds'] = pd.to_datetime(df['timestamp'])
    return df

def generate_forecast(df: pd.DataFrame, target_col: str, periods_days: int = 7) -> pd.DataFrame:
    """Entrena un modelo Prophet rápido y predice el comportamiento a 7 días."""
    prophet_df = df[['ds', target_col]].rename(columns={target_col: 'y'})
    
    # Manejar zonas horarias para Prophet (deben estar en naive local/utc)
    prophet_df['ds'] = prophet_df['ds'].dt.tz_localize(None)
    
    # Inicializar y ajustar modelo Prophet
    model = Prophet(yearly_seasonality=True, daily_seasonality=False, weekly_seasonality=True)
    model.fit(prophet_df)
    
    # Crear dataframe futuro para predicciones
    future = model.make_future_dataframe(periods=periods_days, freq='D')
    forecast = model.predict(future)
    
    # Retornar las predicciones del periodo proyectado (últimos N días)
    return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods_days)

def run_predictions_pipeline():
    # Obtener todas las comunidades registradas
    comm_res = supabase.table("communities").select("id, name").execute()
    
    for comm in comm_res.data:
        comm_id = comm["id"]
        print(f"Procesando predicciones para: {comm['name']} ({comm_id})")
        
        df_readings = fetch_historical_readings(comm_id)
        
        # Se requiere un mínimo de 15 lecturas históricas para entrenar el predictor
        if df_readings.empty or len(df_readings) < 15:
            print(f"Data insuficiente para {comm['name']}. Saltando entrenamiento.")
            continue
        
        # Generar predicción a 7 días para TDS
        forecast_tds = generate_forecast(df_readings, 'tds_ppm', periods_days=7)
        # Generar predicción a 7 días para Turbidez
        forecast_turb = generate_forecast(df_readings, 'turbidity_ntu', periods_days=7)
        
        # Subir predicciones resultantes a la base de datos
        for idx in range(len(forecast_tds)):
            row_tds = forecast_tds.iloc[idx]
            row_turb = forecast_turb.iloc[idx]
            
            pred_date = row_tds['ds'].date()
            predicted_tds = max(0.0, float(row_tds['yhat']))
            predicted_turb = max(0.0, float(row_turb['yhat']))
            
            # Clasificación de riesgo basada en predicciones de calidad de agua
            risk_level = "BAJO"
            if predicted_tds > 500.0 or predicted_turb > 5.0:
                risk_level = "ALTO"
            elif predicted_tds > 300.0 or predicted_turb > 3.0:
                risk_level = "MEDIO"
                
            prediction_record = {
                "community_id": comm_id,
                "prediction_date": pred_date.isoformat(),
                "predicted_tds_ppm": predicted_tds,
                "predicted_turbidity_ntu": predicted_turb,
                "risk_level": risk_level,
                "confidence_score": float(np.clip(1.0 - (row_tds['yhat_upper'] - row_tds['yhat_lower']) / (predicted_tds + 1.0), 0.1, 0.99))
            }
            
            # Insertar en tabla de predicciones de Supabase
            supabase.table("predictions").insert(prediction_record).execute()
            
    print("Pipeline de Predicciones Finalizado con Éxito.")

if __name__ == "__main__":
    run_predictions_pipeline()
```

---

## 2. Automatización y Orquestación de Flujos (n8n Webhook)

Cuando el ESP32 en Wokwi (Fase 2) inserta una lectura anómala en Supabase, el flujo reactivo configurado en **n8n** detecta el cambio de forma automática.

### Configuración del Flujo de Trabajo en n8n:
El flujo de n8n se configura de forma modular mediante los siguientes nodos lógicos:

```mermaid
graph LR
    SubTrigger[1. Supabase Event Trigger<br>Nuevo registro en sensor_readings] --> NodeFilter{2. Filter Node<br>¿TDS > 500 ó Turbidez > 5?}
    NodeFilter -- Sí --> GetComm[3. Supabase Select<br>Obtener Datos Comunidad & Teléfono]
    GetComm --> APIWhatsApp[4. HTTP Request Node<br>POST a OpenWA Bot API]
    NodeFilter -- No --> LogSkip[5. No Action<br>Métrica Estable]
```

### JSON del HTTP Request Node en n8n para enviar Alerta a OpenWA:
El nodo HTTP de n8n envía el siguiente payload a nuestro microservicio OpenWA:

```json
{
  "method": "POST",
  "url": "http://localhost:8080/sendText",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer TOKEN_SEGURO_DE_HACKATHON"
  },
  "body": {
    "to": "={{$json.whatsapp_contact}}",
    "text": "⚠️ *ALERTA AQUORA - AGUA NO POTABLE* ⚠️\n\nEstimado Líder Comunitario, el sistema automatizado de AQUORA ha detectado un umbral crítico de salubridad en su tanque de agua.\n\n🧪 *Sólidos Disueltos (TDS):* {{$json.tds_ppm}} ppm (Límite: 500)\n💧 *Turbidez:* {{$json.turbidity_ntu}} NTU (Límite: 5.0)\n\n*Recomendación:* Se sugiere suspender la ingesta de agua directa del tanque y programar el mantenimiento o lavado de filtros a través de la App Comunitaria de inmediato."
  }
}
```

---

## 3. Despliegue del Bot de WhatsApp Open Source (OpenWA Gateway)

Para mantener la filosofía 100% open source y mitigar los costos de licencias oficiales (que son inviables para hackathons y ONGs rurales), se utiliza la biblioteca autoalojada **rmyndharis/OpenWA**.

### 3.1 Docker Compose de Despliegue (`docker-compose.yml`)
Debe ubicar este archivo en la carpeta `/automation` de su monorepo y levantar los servicios con un solo comando:

```yaml
version: '3.8'

services:
  openwa-bot:
    image: openwa/wa-automate:latest
    container_name: openwa_whatsapp_gateway
    ports:
      - "8080:8080"
    volumes:
      - ./wa-session:/app/session
    environment:
      - PORT=8080
      - AUTH_TOKEN=TOKEN_SEGURO_DE_HACKATHON
      - KEY_IN=API_KEY_SEGURA
    restart: always

  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: n8n_automation
    ports:
      - "5678:5678"
    volumes:
      - ./n8n-data:/home/node/.n8n
    environment:
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
    restart: always
```

### Para Iniciar la Infraestructura:
```bash
cd automation/
docker-compose up -d
```
1. Una vez desplegado, ingrese a la consola de docker de `openwa-bot`.
2. El sistema imprimirá un **Código QR** en la terminal. Escanee el código QR desde el celular del bot usando WhatsApp (Dispositivos Vinculados) para autorizar y sincronizar la pasarela.

---

## 4. Plan de Verificación de Alerta de Extremo a Extremo

### Prueba de simulación física del WhatsApp Bot:
Para certificar que el gateway de notificaciones responde, ejecute un cURL de simulación directamente hacia su contenedor local:

```bash
curl -X POST http://localhost:8080/sendText \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN_SEGURO_DE_HACKATHON" \
     -d '{"to": "+573001234567@c.us", "text": "🧪 Prueba de comunicación AQUORA: Bot activo y enlazado exitosamente."}'
```
Confirme que el teléfono objetivo reciba el mensaje de WhatsApp en menos de 2 segundos.

---

## 5. Próximo Paso en el Ecosistema

Con toda la inteligencia predictiva activa, los flujos estructurados y los canales de notificación alertando de anomalías, procedemos al ensamble final, pruebas generales e hitos de presentación en: **[Fase 6: Integración Final, Pruebas End-to-End y Pitch Deck](file:///E:/AQUORA/Fases%20de%20Desarrollo/06_Fase_Integracion_Pruebas_y_Pitch.md)**.
