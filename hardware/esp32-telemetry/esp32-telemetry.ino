// ============================================================
// AQUORA - FIRMWARE DE TELEMETRÍA v2.2 (HTTP Plano)
// ============================================================
// Simulación en Wokwi con ESP32 DevKit-C v4
// Sensores: TDS (pot), Turbidez (pot), Nivel (HC-SR04)
// Conectividad: WiFi → HTTP POST a API REST via ngrok
// ============================================================

#include <WiFi.h>
#include <HTTPClient.h>

// --- CONFIGURACIÓN DE RED ---
const char* ssid     = "Wokwi-GUEST";
const char* password = "";

// --- ENDPOINT API (HTTP plano, sin HTTPS) ---
const char* serverURL = "http://crabmeat-blustery-kitty.ngrok-free.dev/api/v1/readings";
const String deviceKey = "DEV_ESP32_GUAF1";

// --- PINES DE SENSORES ---
const int pinTDS       = 34;   // Potenciómetro TDS → GPIO34 (ADC)
const int pinTurbidity = 35;   // Potenciómetro Turbidez → GPIO35 (ADC)
const int pinTrigger   = 5;    // HC-SR04 TRIG → GPIO5
const int pinEcho      = 18;   // HC-SR04 ECHO → GPIO18
const int pinLED       = 2;    // LED integrado ESP32

// --- TIEMPOS ---
const unsigned long sendInterval = 15000;  // Enviar cada 15 segundos
unsigned long lastSendTime = 0;

// --- PROMEDIO MÓVIL ---
const int N = 20;
int bufTDS[N], bufTurb[N];
int idx = 0;
bool bufferReady = false;

// --- TANQUE ---
const float tankH     = 200.0;  // Altura total del tanque (cm)
const float sensorOff = 10.0;   // Offset del sensor desde el tope (cm)

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("=============================================");
  Serial.println("   AQUORA SMART WATER MONITOR v2.2");
  Serial.println("   Firmware de Telemetria - ESP32");
  Serial.println("=============================================");
  Serial.println();

  // Configurar pines
  pinMode(pinLED, OUTPUT);
  pinMode(pinTDS, INPUT);
  pinMode(pinTurbidity, INPUT);
  pinMode(pinTrigger, OUTPUT);
  pinMode(pinEcho, INPUT);

  // Inicializar buffers
  memset(bufTDS, 0, sizeof(bufTDS));
  memset(bufTurb, 0, sizeof(bufTurb));

  // --- Conectar WiFi ---
  Serial.print("[WiFi] Conectando a: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 50) {
    delay(400);
    Serial.print(".");
    digitalWrite(pinLED, tries % 2);  // Parpadeo durante conexión
    tries++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] *** CONECTADO ***");
    Serial.print("[WiFi] IP asignada: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    digitalWrite(pinLED, HIGH);
  } else {
    Serial.println("[WiFi] ERROR: No se pudo conectar");
    digitalWrite(pinLED, LOW);
  }

  Serial.println();
  Serial.print("[API] Endpoint: ");
  Serial.println(serverURL);
  Serial.print("[API] Device Key: ");
  Serial.println(deviceKey);
  Serial.println();
  Serial.println("Iniciando ciclo de telemetria...");
  Serial.println("---------------------------------------------");
}

void loop() {
  // --- Muestreo continuo de sensores analógicos ---
  bufTDS[idx]  = analogRead(pinTDS);
  bufTurb[idx] = analogRead(pinTurbidity);
  idx++;

  if (idx >= N) {
    idx = 0;
    bufferReady = true;
  }

  // --- Envío periódico cada 15 segundos ---
  unsigned long now = millis();
  if (now - lastSendTime >= sendInterval) {
    lastSendTime = now;

    // Verificar WiFi
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] Desconectado! Reintentando...");
      WiFi.reconnect();
      delay(3000);
      if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WiFi] Reconexion fallida. Esperando...");
        return;
      }
      Serial.println("[WiFi] Reconectado!");
    }

    // Calcular valores
    float tds   = calcTDS();
    float turb  = calcTurb();
    float level = calcLevel();

    // Mostrar en Serial
    Serial.println();
    Serial.println("=== LECTURA DE SENSORES ===");
    Serial.print("  TDS:      ");
    Serial.print(tds, 1);
    Serial.println(" ppm");
    Serial.print("  Turbidez: ");
    Serial.print(turb, 1);
    Serial.println(" NTU");
    Serial.print("  Nivel:    ");
    Serial.print(level, 1);
    Serial.println(" %");

    // Indicar envío con LED
    digitalWrite(pinLED, LOW);
    delay(100);
    digitalWrite(pinLED, HIGH);

    // Enviar a la API
    sendTelemetry(tds, turb, level);
  }

  delay(100);  // 100ms entre muestras
}

// ==========================================
// FUNCIONES DE SENSORES
// ==========================================

float avg(int* buf) {
  long s = 0;
  int count = bufferReady ? N : (idx > 0 ? idx : 1);
  for (int i = 0; i < count; i++) s += buf[i];
  return (float)s / count;
}

float calcTDS() {
  float voltage = avg(bufTDS) * (3.3 / 4095.0);
  float tds = (voltage / 2.3) * 1000.0;
  return max(tds, 0.0f);
}

float calcTurb() {
  float voltage = avg(bufTurb) * (3.3 / 4095.0);
  float turb = (1.0 - voltage / 3.3) * 100.0;
  return constrain(turb, 0.0f, 100.0f);
}

float calcLevel() {
  digitalWrite(pinTrigger, LOW);
  delayMicroseconds(2);
  digitalWrite(pinTrigger, HIGH);
  delayMicroseconds(10);
  digitalWrite(pinTrigger, LOW);

  long dur = pulseIn(pinEcho, HIGH, 30000);
  if (dur == 0) return 0.0;

  float d = dur * 0.01715;
  d = constrain(d, sensorOff, tankH);
  return ((tankH - d) / (tankH - sensorOff)) * 100.0;
}

// ==========================================
// ENVÍO HTTP A LA API
// ==========================================

void sendTelemetry(float tds, float turb, float level) {
  HTTPClient http;

  Serial.print("[HTTP] POST → ");
  Serial.println(serverURL);

  http.begin(serverURL);
  http.setTimeout(10000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("ngrok-skip-browser-warning", "69420");

  // Construir JSON
  String json = "{";
  json += "\"device_key\":\"" + deviceKey + "\",";
  json += "\"tds_ppm\":" + String(tds, 2) + ",";
  json += "\"turbidity_ntu\":" + String(turb, 2) + ",";
  json += "\"water_level_pct\":" + String(level, 2);
  json += "}";

  Serial.print("[HTTP] Payload: ");
  Serial.println(json);

  int httpCode = http.POST(json);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("[HTTP] Respuesta ");
    Serial.print(httpCode);
    Serial.print(": ");
    Serial.println(response);

    if (httpCode == 201 || httpCode == 200) {
      Serial.println("[OK] Dato enviado exitosamente!");
      // Parpadeo rápido = éxito
      for (int i = 0; i < 6; i++) {
        digitalWrite(pinLED, i % 2);
        delay(80);
      }
      digitalWrite(pinLED, HIGH);
    }
  } else {
    Serial.print("[HTTP] ERROR: ");
    Serial.println(http.errorToString(httpCode));
    // LED apagado brevemente = error
    digitalWrite(pinLED, LOW);
    delay(500);
    digitalWrite(pinLED, HIGH);
  }

  http.end();
}
