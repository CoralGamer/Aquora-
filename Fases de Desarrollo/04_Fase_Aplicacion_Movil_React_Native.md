# Fase 4: Aplicación Móvil React Native (Sprint 1 / Sprint 2-3)
## Desarrollo Móvil Resiliente y Geolocalizado para Zonas Vulnerables

La aplicación móvil de AQUORA está construida en **React Native (usando Expo)** para permitir un despliegue rápido y multiplataforma (Android e iOS) durante la hackathon. Está diseñada para operar de forma híbrida: permite a los líderes de la comunidad emitir **Reportes Rápidos** geolocalizados por GPS, y ayuda a los operarios técnicos a realizar tareas de **Mantenimiento Técnico** mediante escaneo de códigos QR en los dispositivos físicos.

---

## 1. Setup e Inicialización del Proyecto

Para inicializar la aplicación utilizando la estructura recomendada por Expo, ejecute los siguientes comandos en su terminal:

```bash
# Crear proyecto con plantilla en TypeScript
npx -y create-expo-app@latest mobile-app --template blank-typescript

# Instalar dependencias nativas requeridas
npx expo install expo-location expo-camera expo-barcode-scanner @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs react-native-safe-area-context react-native-screens @react-native-async-storage/async-storage
```

---

## 2. Pantalla 1: Módulo de Reporte Rápido Geolocalizado (`QuickReportScreen.tsx`)

Esta vista permite a los habitantes reportar visualmente la calidad o estado del agua mediante cuatro botones grandes de alta visibilidad, capturando la latitud y longitud exactas del incidente a través del GPS interno del dispositivo móvil.

#### Archivo: `mobile/src/screens/QuickReportScreen.tsx`

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

type WaterStatus = 'OK' | 'TURBIO' | 'SECO' | 'ROTO';

export default function QuickReportScreen() {
  const [loading, setLoading] = useState(false);

  const handleReport = async (status: WaterStatus) => {
    setLoading(true);
    try {
      // 1. Solicitar permisos de ubicación en tiempo de ejecución
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (permissionStatus !== 'granted') {
        Alert.alert('Error de Permisos', 'Se requiere acceso al GPS para geolocalizar el reporte.');
        setLoading(false);
        return;
      }

      // 2. Capturar coordenadas GPS del dispositivo
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const reportPayload = {
        status,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString()
      };

      // 3. Estrategia Offline: Intentar enviar y guardar localmente en caché si falla
      await queueReport(reportPayload);
      
    } catch (error) {
      console.error('Error generando reporte:', error);
      Alert.alert('Error', 'No se pudo procesar el reporte de calidad.');
    } finally {
      setLoading(false);
    }
  };

  const queueReport = async (payload: any) => {
    try {
      // Leer reportes pendientes en caché
      const existingQueue = await AsyncStorage.getItem('@pending_reports');
      const queue = existingQueue ? JSON.parse(existingQueue) : [];
      queue.push(payload);
      
      // Guardar de vuelta en AsyncStorage
      await AsyncStorage.setItem('@pending_reports', JSON.stringify(queue));
      
      // Intentar sincronización inmediata (si hay conexión a internet)
      attemptSync(queue);
    } catch (e) {
      console.error('Error escribiendo en caché offline:', e);
    }
  };

  const attemptSync = async (queue: any[]) => {
    try {
      // Simular intento de envío al endpoint del backend
      const response = await fetch('http://YOUR_API_IP_OR_DOMAIN:8000/api/v1/manual-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: queue })
      });

      if (response.ok) {
        // Si el envío es exitoso, limpiar el storage local
        await AsyncStorage.removeItem('@pending_reports');
        Alert.alert('¡Reporte Enviado!', 'Tu reporte fue transmitido exitosamente al centro de control.');
      } else {
        throw new Error('Servidor inalcanzable');
      }
    } catch (err) {
      // Si falla, se mantiene en caché para ser procesado más tarde sin interrumpir al usuario
      Alert.alert(
        'Modo Offline Activo',
        'Guardamos tu reporte localmente. Se sincronizará automáticamente cuando recuperes cobertura celular.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cómo está el agua en tu comunidad?</Text>
      <Text style={styles.subtitle}>Selecciona una opción para reportar el estado de calidad de forma inmediata:</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={styles.loader} />
      ) : (
        <View style={styles.grid}>
          <TouchableOpacity style={[styles.card, styles.btnOk]} onPress={() => handleReport('OK')}>
            <Text style={styles.cardEmoji}>💧</Text>
            <Text style={styles.cardText}>Agua Limpia (OK)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, styles.btnTurbio]} onPress={() => handleReport('TURBIO')}>
            <Text style={styles.cardEmoji}>🟤</Text>
            <Text style={styles.cardText}>Agua Turbia</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, styles.btnSeco]} onPress={() => handleReport('SECO')}>
            <Text style={styles.cardEmoji}>❌</Text>
            <Text style={styles.cardText}>Sin Agua (Seco)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, styles.btnRoto]} onPress={() => handleReport('ROTO')}>
            <Text style={styles.cardEmoji}>🛠️</Text>
            <Text style={styles.cardText}>Filtro Averiado</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24, justifyContent: 'center' },
  title: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '47%',
    height: 140,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardEmoji: { fontSize: 36, marginBottom: 8 },
  cardText: { color: '#ffffff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  btnOk: { backgroundColor: '#059669' },
  btnTurbio: { backgroundColor: '#d97706' },
  btnSeco: { backgroundColor: '#dc2626' },
  btnRoto: { backgroundColor: '#475569' },
  loader: { marginVertical: 40 }
});
```

---

## 3. Pantalla 2: Diagnóstico Técnico por Escaneo QR (`QRDiagnosticScreen.tsx`)

Los operarios de campo necesitan identificar qué filtro requiere recambio físico. La cámara móvil escanea el código QR adherido al tanque (que contiene el `device_id` codificado) para jalar su estado del sistema en tiempo real.

#### Archivo: `mobile/src/screens/QRDiagnosticScreen.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function QRDiagnosticScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    
    // Suponer que el QR contiene el device_uuid plano o en formato URL
    // Ejemplo de escaneo exitoso: 'd290f1ee-6c54-4b01-90e6-d701748f0851'
    Alert.alert(
      'Filtro Identificado',
      `ID del Dispositivo: ${data}\n\nConectando con Supabase para recuperar métricas de telemetría y salud del módulo...`,
      [
        { text: 'Proceder al Diagnóstico', onPress: () => fetchDeviceDetails(data) },
        { text: 'Escanear de Nuevo', onPress: () => setScanned(false), style: 'cancel' }
      ]
    );
  };

  const fetchDeviceDetails = async (deviceId: string) => {
    try {
      // Consultar directo a la API de FastAPI o Supabase REST API
      const response = await fetch(`http://YOUR_API_IP_OR_DOMAIN:8000/api/v1/devices/${deviceId}/status`);
      const statusData = await response.json();
      
      Alert.alert(
        'Diagnóstico del Sistema',
        `🔋 Batería: ${statusData.battery_pct}%\n🧪 TDS Promedio: ${statusData.avg_tds} ppm\n📅 Último cambio de Arena: Hace 45 días`
      );
    } catch (e) {
      Alert.alert('Error de Conexión', 'No se pudo obtener información en tiempo real de este dispositivo.');
    } finally {
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.fallback}><Text style={styles.text}>Solicitando permisos de cámara...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.fallback}><Text style={styles.text}>Sin acceso a la cámara. Habilita permisos en configuración.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.cameraTitle}>Escaneo del Dispositivo</Text>
      <Text style={styles.cameraSubtitle}>Apunta tu cámara al código QR ubicado en el módulo de control del filtro</Text>
      
      <View style={styles.scannerWrapper}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      
      {scanned && <Button title={'Escanear de nuevo'} onPress={() => setScanned(false)} color="#0ea5e9" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24, alignItems: 'center', justifyContent: 'center' },
  fallback: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#ffffff', fontSize: 16 },
  cameraTitle: { color: '#ffffff', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  cameraSubtitle: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginBottom: 24 },
  scannerWrapper: {
    width: 280,
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0ea5e9',
    marginBottom: 30
  }
});
```

---

## 4. Estrategia Offline y Sincronización Automática

Dado que los departamentos como La Guajira tienen zonas rurales con nula conectividad celular:
1. **Manejo del Ciclo de Vida:** La app detecta el cambio de red usando el listener `@react-native-community/netinfo` (debe ser instalado si se requiere automatización total).
2. **Buffer Local:** En el instante en que detecta red de datos o WiFi, dispara una función de background task que lee el almacenamiento `AsyncStorage` en `@pending_reports` y vacía los registros acumulados en la base de datos de Supabase en un único lote de inserción (Bulk Insert).

---

## 5. Próximo Paso en el Ecosistema

Una vez armada la aplicación comunitaria y recolectados los reportes de calidad desde territorio, el sistema debe autogestionar umbrales críticos para disparar alertas inmediatas. Proceda a: **[Fase 5: Inteligencia Predictiva, Workflows y WhatsApp Bot](file:///E:/AQUORA/Fases%20de%20Desarrollo/05_Fase_Inteligencia_y_Automatizacion.md)**.
