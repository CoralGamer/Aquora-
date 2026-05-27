# Fase 2: Hardware Simulado y Telemetría IoT (Sprint 1)
## Especificación y Firmware de Simulación en Wokwi (ESP32 + C++)

Esta fase detalla el diseño, la simulación electrónica y el firmware en C++ para el microcontrolador central de AQUORA. El sistema utiliza un **ESP32** como gemelo digital en la plataforma Wokwi. Mide de forma continua tres variables cruciales (TDS, Turbidez y Nivel de agua), aplicando filtros lógicos para eliminar el ruido analógico de los sensores y transmitiendo la información vía HTTP con algun componente electronico sea de WIFI, Ethernet o Tarjeta SIM con datos de telefonia movil hacia la API de FastAPI.

---

## 1. Diseño del Circuito en Wokwi (diagram.json)

En Wokwi, los circuitos se definen mediante un archivo JSON. A continuación, se presenta la especificación de conexiones requeridas para ensamblar el gemelo digital en el entorno virtual.

### Componentes Utilizados:
1. **ESP32 DevKit v1** (Unidad de procesamiento y conectividad WiFi).
2. **Potenciómetro Analógico 1** (Simulación del Sensor TDS / Sólidos Totales Disueltos).
3. **Potenciómetro Analógico 2** (Simulación del Sensor de Turbidez).
4. **Sensor Ultrasónico HC-SR04** (Simulación de nivel de llenado del tanque de agua).

### Tabla de Conexión de Pines:

| Componente de Hardware | Pin del Sensor / Componente | Pin en ESP32 DevKit | Tipo de Señal |
| :--- | :--- | :--- | :--- |
| **Potenciómetro 1 (TDS)** | VCC / GND | 3V3 / GND | Alimentación |
| | Signal / Wiper | **GPIO 34 (ADC1_CH6)** | Entrada Analógica |
| **Potenciómetro 2 (Turbidez)**| VCC / GND | 3V3 / GND | Alimentación |
| | Signal / Wiper | **GPIO 35 (ADC1_CH7)** | Entrada Analógica |
| **Sensor Ultrasónico HC-SR04**| VCC / GND | 5V (o 3V3) / GND | Alimentación |
| | Trigger Pin | **GPIO 5** | Salida Digital |
| | Echo Pin | **GPIO 18** | Entrada Digital |

---

## 2. Firmware en C++ para ESP32 (`esp32-telemetry.ino`)

Guarde el siguiente firmware completo en el archivo `/hardware/esp32-telemetry/esp32-telemetry.ino`. Está programado para utilizar temporizadores no bloqueantes (`millis()`), aplicar un filtro de promedio móvil en lecturas analógicas y manejar la reconexión resiliente a WiFi.

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

// ==========================================
// CONFIGURACIÓN DE RED Y API
// ==========================================
const char* ssid = "Wokwi-GUEST"; // Red simulada nativa de Wokwi
const char* password = "";
const char* serverEndpoint = "http://YOUR_API_IP_OR_DOMAIN:8000/api/v1/readings"; 
const String deviceKey = "DEV_ESP32_GUAF1"; // Clave del dispositivo registrada en Supabase

// ==========================================
// ASIGNACIÓN DE PINES
// ==========================================
const int pinTDS = 34;       // GPIO 34 (ADC1)
const int pinTurbidity = 35; // GPIO 35 (ADC1)
const int pinTrigger = 5;    // GPIO 5 (HC-SR04 Trigger)
const int pinEcho = 18;      // GPIO 18 (HC-SR04 Echo)

// ==========================================
// PARÁMETROS DE MUESTREO Y TRANSMISIÓN
// ==========================================
const unsigned long sampleInterval = 100;     // Muestrear sensores cada 100 ms
const unsigned long sendInterval = 15000;     // Transmitir datos cada 15 segundos (15000 ms)
unsigned long lastSampleTime = 0;
unsigned long lastSendTime = 0;

// Variables para Filtro de Promedio Móvil (Moving Average)
const int numSamples = 20;
int samplesTDS[numSamples];
int samplesTurbidity[numSamples];
int sampleIndex = 0;

// Constantes físicas del tanque
const float tankHeightCm = 200.0; // Altura total del tanque de agua (vacío)
const float sensorOffsetCm = 10.0;  // Distancia del sensor HC-SR04 al agua cuando el tanque está 100% lleno

void setup() {
  Serial.begin(115200);
  
  // Inicialización de Pines
  pinMode(pinTDS, INPUT);
  pinMode(pinTurbidity, INPUT);
  pinMode(pinTrigger, OUTPUT);
  pinMode(pinEcho, INPUT);
  
  // Inicializar arreglos de filtro con ceros
  for (int i = 0; i < numSamples; i++) {
    samplesTDS[i] = 0;
    samplesTurbidity[i] = 0;
  }
  
  // Iniciar Conexión WiFi
  connectToWiFi();
}

void loop() {
  // Asegurar conectividad WiFi activa
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  unsigned long currentTime = millis();

  // 1. Muestreo periódico de sensores para filtrado de señales
  if (currentTime - lastSampleTime >= sampleInterval) {
    lastSampleTime = currentTime;
    
    samplesTDS[sampleIndex] = analogRead(pinTDS);
    samplesTurbidity[sampleIndex] = analogRead(pinTurbidity);
    sampleIndex = (sampleIndex + 1) % numSamples;
  }

  // 2. Transmisión periódica del reporte a la API
  if (currentTime - lastSendTime >= sendInterval) {
    lastSendTime = currentTime;
    
    // Obtener promedios analógicos suavizados (Filtro Moving Average)
    float avgRawTDS = getAverage(samplesTDS, numSamples);
    float avgRawTurbidity = getAverage(samplesTurbidity, numSamples);
    
    // Convertir lecturas analógicas a valores físicos reales
    float finalTDS = convertRawToTDS(avgRawTDS);
    float finalTurbidity = convertRawToTurbidity(avgRawTurbidity);
    float finalWaterLevel = readUltrasonicLevel();
    
    // Transmitir telemetría
    sendTelemetry(finalTDS, finalTurbidity, finalWaterLevel);
  }
}

// ==========================================
// FUNCIONES AUXILIARES Y DE FILTRADO
// ==========================================

void connectToWiFi() {
  Serial.print("Conectando a WiFi SSID: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Conectado Exitosamente!");
    Serial.print("Dirección IP local: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nError: No se pudo conectar al WiFi. Reintentando en el próximo ciclo.");
  }
}

float getAverage(int* array, int size) {
  long sum = 0;
  for (int i = 0; i < size; i++) {
    sum += array[i];
  }
  return (float)sum / size;
}

// Calibración Física de Sensores (Curvas matemáticas)
float convertRawToTDS(float rawADC) {
  // ESP32 tiene ADC de 12 bits (0-4095) y voltaje de referencia de 3.3V
  float voltage = rawADC * (3.3 / 4095.0);
  
  // Ecuación de conversión calibrada en laboratorio para sensor analógico TDS
  // A 25°C, TDS (ppm) = (133.42 * V^3 - 255.86 * V^2 + 857.39 * V) * 0.5
  // Para el simulador de Wokwi, una aproximación lineal mapeada es robusta:
  // Voltaje 0V -> 0 ppm | Voltaje 2.3V -> 1000 ppm (Límite agua potable)
  float tds = (voltage / 2.3) * 1000.0;
  if (tds < 0) tds = 0.0;
  return tds;
}

float convertRawToTurbidity(float rawADC) {
  float voltage = rawADC * (3.3 / 4095.0);
  
  // El sensor de turbidez comercial (TS-300B) tiene un comportamiento inverso:
  // Agua limpia -> Voltaje alto (~4.2V en físico, mapeado a ~3.0V en ESP32 con divisor) -> 0 NTU
  // Agua muy turbia -> Voltaje bajo (< 2.5V) -> ~100 NTU
  // Ecuación aproximada para el MVP:
  float turbidity = -112.04 * (voltage * voltage) + 574.25 * voltage - 435.38;
  
  // Mapeo lineal de seguridad para el simulador Wokwi (0V es 100 NTU y 3.3V es 0 NTU)
  float mappedTurbidity = (1.0 - (voltage / 3.3)) * 100.0;
  if (mappedTurbidity < 0) mappedTurbidity = 0.0;
  if (mappedTurbidity > 100) mappedTurbidity = 100.0;
  
  return mappedTurbidity;
}

float readUltrasonicLevel() {
  // Disparar pulso ultrasónico
  digitalWrite(pinTrigger, LOW);
  delayMicroseconds(2);
  digitalWrite(pinTrigger, HIGH);
  delayMicroseconds(10);
  digitalWrite(pinTrigger, LOW);
  
  // Leer duración del eco de retorno en microsegundos
  long duration = pulseIn(pinEcho, HIGH, 30000); // Timeout a 30ms (~5 metros max)
  
  if (duration == 0) {
    // Error de lectura física o sensor no responde
    return 0.0; 
  }
  
  // Velocidad del sonido es 343 m/s -> Distancia (cm) = Duración * 0.0343 / 2
  float distanceCm = duration * 0.01715;
  
  // Calcular el porcentaje de volumen de agua en el tanque
  // Si distanciaCm >= tankHeightCm el tanque está VACÍO (0%)
  // Si distanciaCm <= sensorOffsetCm el tanque está LLENO (100%)
  if (distanceCm > tankHeightCm) distanceCm = tankHeightCm;
  if (distanceCm < sensorOffsetCm) distanceCm = sensorOffsetCm;
  
  float waterVolumePct = ((tankHeightCm - distanceCm) / (tankHeightCm - sensorOffsetCm)) * 100.0;
  return waterVolumePct;
}

void sendTelemetry(float tds, float turbidity, float level) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Error: Desconectado de WiFi. Abortando transmisión HTTP.");
    return;
  }
  
  HTTPClient http;
  http.begin(serverEndpoint);
  http.addHeader("Content-Type", "application/json");
  
  // Construir JSON payload
  String jsonPayload = "{\"device_key\":\"" + deviceKey + "\",";
  jsonPayload += "\"tds_ppm\":" + String(tds, 2) + ",";
  jsonPayload += "\"turbidity_ntu\":" + String(turbidity, 2) + ",";
  jsonPayload += "\"water_level_pct\":" + String(level, 2) + "}";
  
  Serial.print("Enviando JSON a API: ");
  Serial.println(jsonPayload);
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("API respondió [Código HTTP ");
    Serial.print(httpResponseCode);
    Serial.print("]: ");
    Serial.println(response);
  } else {
    Serial.print("Error crítico en envío HTTP POST: ");
    Serial.println(http.errorToString(httpResponseCode).c_str());
  }
  
  http.end();
}
```

---

## 3. Plan de Verificación y Calibración en Wokwi

Para validar este gemelo digital sin hardware físico, realice las siguientes pruebas virtuales en Wokwi:

### 3.1 Simulación Interactiva
1. Conecte los componentes en el canvas de Wokwi siguiendo el diagrama de conexiones.
2. Inicie la simulación. El monitor Serial de Wokwi deberá imprimir: `WiFi Conectado Exitosamente!`.
3. **Prueba de Calidad de Agua (TDS y Turbidez):**
   * Desplace el deslizador del **Potenciómetro 1** hacia la izquierda (simulando agua pura, bajo voltaje). El monitor serial de la API de FastAPI deberá recibir registros con `tds_ppm` cercanos a 0.
   * Desplace el deslizador hacia la derecha (simulando agua de pozo no potable con altos sólidos). Compruebe que los valores escalen hasta `1000 ppm`.
   * Realice el mismo proceso con el **Potenciómetro 2** (Turbidez), comprobando que a menor voltaje en el GPIO 35, el valor de `turbidity_ntu` aumente de 0 a 100 NTU.
4. **Prueba de Estrés Hídrico (HC-SR04):**
   * Haga clic sobre el sensor HC-SR04 en Wokwi y manipule el control flotante de distancia.
   * Si la distancia se reduce a la mínima tolerada (`10 cm`), compruebe que el reporte de telemetría declare `water_level_pct: 100.0`.
   * Si la distancia aumenta al máximo, compruebe el valor `0.0`.

---

## 4. Próximo Paso en el Ecosistema

Con los datos de telemetría generados en tiempo real e impactando exitosamente la base de datos de Supabase a través del backend, podemos construir la capa de interacción visual: **[Fase 3: Ecosistema Web: Portal Open Source & Dashboard de Control](file:///E:/AQUORA/Fases%20de%20Desarrollo/03_Fase_Ecosistema_Web_y_Visor_3D.md)**.
