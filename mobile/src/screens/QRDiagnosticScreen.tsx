import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

interface QRDiagnosticScreenProps {
  backendUrl: string;
  currentUserEmail?: string;
}

interface DeviceStatus {
  device_id: string;
  device_key: string;
  active: boolean;
  battery_pct: number;
  avg_tds: number;
  current_tds: number;
  current_turbidity: number;
  current_water_level: number;
  zeolita_life_pct: number;
  last_connection: string | null;
}

export default function QRDiagnosticScreen({ backendUrl }: QRDiagnosticScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualId, setManualId] = useState('');
  const [deviceData, setDeviceData] = useState<DeviceStatus | null>(null);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    // Extrae el device ID. Puede ser un UUID directo o una URL.
    let cleanId = data.trim();
    if (cleanId.includes('/')) {
      cleanId = cleanId.split('/').pop() || cleanId;
    }
    
    Alert.alert(
      'Filtro Escaneado',
      `Identificador: ${cleanId}\n\n¿Proceder al diagnóstico en tiempo real?`,
      [
        { text: 'Proceder al Diagnóstico', onPress: () => fetchDeviceDetails(cleanId) },
        { text: 'Cancelar', onPress: () => setScanned(false), style: 'cancel' }
      ]
    );
  };

  const fetchDeviceDetails = async (deviceId: string) => {
    if (!deviceId.trim()) return;
    setLoading(true);
    setDeviceData(null);
    try {
      const response = await fetch(`${backendUrl}/api/v1/devices/${deviceId}/status`);
      if (!response.ok) {
        throw new Error('Dispositivo no encontrado o error en servidor');
      }
      const data = await response.json();
      setDeviceData(data);
    } catch (e) {
      console.error(e);
      Alert.alert(
        'Falla de Conexión', 
        'No se pudo contactar con el backend de AQUORA o el dispositivo no está registrado. Cargando simulación de resiliencia local en territorio...',
        [
          { 
            text: 'Cargar Modo Demo', 
            onPress: () => setDeviceData({
              device_id: deviceId,
              device_key: "DEV_MOCK_DEMO",
              active: true,
              battery_pct: 85.0,
              avg_tds: 240.0,
              current_tds: 260.0,
              current_turbidity: 1.2,
              current_water_level: 68.0,
              zeolita_life_pct: 90.0,
              last_connection: new Date().toISOString()
            }) 
          },
          { text: 'Reintentar', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
      setScanned(false);
    }
  };

  const getTdsStatus = (val: number) => {
    if (val < 300) return { label: 'Excelente (Segura)', color: '#2dd4bf' };
    if (val <= 450) return { label: 'Aceptable (Monitorear)', color: '#ffcd82' };
    return { label: 'Riesgo Crítico (EDA)', color: '#f43f5e' };
  };

  const getTurbidityStatus = (val: number) => {
    if (val <= 5.0) return { label: 'Óptima (Limpia)', color: '#2dd4bf' };
    return { label: 'Contaminada (Turbia)', color: '#f43f5e' };
  };

  if (hasPermission === null) {
    return <View style={styles.fallback}><ActivityIndicator size="large" color="#0ea5e9" /><Text style={styles.text}>Solicitando acceso a la cámara...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.fallback}><Text style={styles.text}>Sin acceso a la cámara. Habilita permisos en configuración.</Text></View>;
  }

  return (
    <View style={styles.rootContainer}>
      {/* Soft glowing ambient orbs in background */}
      <View style={[styles.glowOrb, { top: '5%', left: '-15%', backgroundColor: 'rgba(14, 165, 233, 0.12)' }]} />
      <View style={[styles.glowOrb, { bottom: '15%', right: '-15%', backgroundColor: 'rgba(255, 205, 130, 0.08)' }]} />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>🔍 Mantenimiento y Diagnóstico QR</Text>
        <Text style={styles.subtitle}>
          Escanea el sticker del microcontrolador o introduce el ID manual para analizar el estado químico y de capas del filtro:
        </Text>

        {/* Manual Input Fallback */}
        {!deviceData && (
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Identificación Manual de Filtro</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.input}
                value={manualId}
                onChangeText={setManualId}
                placeholder="Ej: DEV_ESP32_GUAF1"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.btnSearch} onPress={() => fetchDeviceDetails(manualId)}>
                <Text style={styles.btnSearchText}>Analizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Camera View for QR code */}
        {hasPermission && !deviceData && !loading && (
          <View style={styles.cameraWrapper}>
            <CameraView
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.overlayScanner}>
              <View style={styles.reticleContainer}>
                <View style={styles.reticle} />
                <View style={[styles.reticleCorner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
                <View style={[styles.reticleCorner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
                <View style={[styles.reticleCorner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
                <View style={[styles.reticleCorner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
              </View>
              <Text style={styles.scannerGuideText}>Encuadra el código QR para conectar</Text>
            </View>
          </View>
        )}

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#ffcd82" />
            <Text style={styles.loaderText}>Consultando telemetría en Supabase...</Text>
          </View>
        )}

        {/* Device Details Dashboard */}
        {deviceData && (
          <View style={styles.dashboard}>
            {/* Header Card */}
            <View style={styles.dashHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dashTitle}>{deviceData.device_key}</Text>
                <Text style={styles.dashSubtitle}>UUID: {deviceData.device_id.substring(0, 18)}...</Text>
              </View>
              <View style={styles.badgeRow}>
                <View style={[styles.statusBadge, deviceData.active ? styles.badgeActive : styles.badgeInactive]}>
                  <Text style={styles.badgeText}>{deviceData.active ? '● EN LÍNEA' : '● INACTIVO'}</Text>
                </View>
              </View>
            </View>

            {/* Core Metrics Grid */}
            <View style={styles.metricRow}>
              {/* Metric TDS */}
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>🧪 SÓLIDOS (TDS)</Text>
                <Text style={styles.metricValue}>{deviceData.current_tds} <Text style={styles.metricUnit}>ppm</Text></Text>
                <View style={styles.alertTextContainer}>
                  <Text style={[styles.metricAlertText, { color: getTdsStatus(deviceData.current_tds).color }]}>
                    ● {getTdsStatus(deviceData.current_tds).label}
                  </Text>
                </View>
              </View>

              {/* Metric Turbidez */}
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>🟤 TURBIDEZ</Text>
                <Text style={styles.metricValue}>{deviceData.current_turbidity} <Text style={styles.metricUnit}>NTU</Text></Text>
                <View style={styles.alertTextContainer}>
                  <Text style={[styles.metricAlertText, { color: getTurbidityStatus(deviceData.current_turbidity).color }]}>
                    ● {getTurbidityStatus(deviceData.current_turbidity).label}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.metricRow}>
              {/* Metric Nivel de Agua */}
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>💧 NIVEL DE AGUA</Text>
                <Text style={styles.metricValue}>{deviceData.current_water_level}%</Text>
                <View style={styles.alertTextContainer}>
                  <Text style={[styles.metricAlertText, { color: deviceData.current_water_level < 20 ? '#f43f5e' : '#2dd4bf' }]}>
                    ● {deviceData.current_water_level < 20 ? 'Tanque Crítico' : 'Flujo Normal'}
                  </Text>
                </View>
              </View>

              {/* Metric Batería */}
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>🔋 BATERÍA INTERNA</Text>
                <Text style={styles.metricValue}>{deviceData.battery_pct}%</Text>
                <View style={styles.alertTextContainer}>
                  <Text style={[styles.metricAlertText, { color: deviceData.battery_pct < 20 ? '#f43f5e' : '#2dd4bf' }]}>
                    ● {deviceData.battery_pct < 20 ? 'Celda Baja' : 'Alimentación Segura'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Filter Layers Health Check */}
            <View style={styles.layersCard}>
              <Text style={styles.layersTitle}>🛠️ Vida Útil por Capas de Filtración</Text>
              
              {/* Zeolita Active Progress */}
              <View style={styles.progressGroup}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Zeolita Activa (Adsorción metales)</Text>
                  <Text style={styles.progressPct}>{deviceData.zeolita_life_pct}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${deviceData.zeolita_life_pct}%`, backgroundColor: '#ffcd82' }]} />
                </View>
              </View>

              {/* Arena Silicea Progress */}
              <View style={styles.progressGroup}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Arena de Sílice (Sedimentos finos)</Text>
                  <Text style={styles.progressPct}>85%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `85%`, backgroundColor: '#0ea5e9' }]} />
                </View>
              </View>

              <Text style={styles.maintAdvice}>
                💡 Reemplazo recomendado de Zeolita Activa cuando el porcentaje sea menor al 20%.
              </Text>
            </View>

            {/* Reset button */}
            <TouchableOpacity style={styles.btnReset} onPress={() => setDeviceData(null)}>
              <Text style={styles.btnResetText}>Escanear Otro Dispositivo</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#07111a',
  },
  glowOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.4,
  },
  scrollContainer: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#8b9bb4',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  fallback: {
    flex: 1,
    backgroundColor: '#07111a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
  },
  inputCard: {
    backgroundColor: 'rgba(20, 41, 58, 0.55)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.12)',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  inputLabel: {
    color: '#ffcd82',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#0a1822',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    height: 46,
  },
  btnSearch: {
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 20,
    height: 46,
    shadowColor: 'rgba(14, 165, 233, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 2,
  },
  btnSearchText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cameraWrapper: {
    width: '100%',
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(173, 219, 255, 0.25)',
    position: 'relative',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  overlayScanner: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 17, 26, 0.6)',
  },
  reticleContainer: {
    width: 220,
    height: 220,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  reticle: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
  },
  reticleCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#ffcd82',
  },
  scannerGuideText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(7, 17, 26, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.1)',
  },
  loaderContainer: {
    marginVertical: 40,
    alignItems: 'center',
  },
  loaderText: {
    color: '#ffcd82',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 12,
  },
  dashboard: {
    marginTop: 10,
    gap: 16,
  },
  dashHeader: {
    backgroundColor: 'rgba(20, 41, 58, 0.55)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.12)',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  dashTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dashSubtitle: {
    color: '#8b9bb4',
    fontSize: 11,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.4)',
  },
  badgeInactive: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(20, 41, 58, 0.55)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.12)',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  metricLabel: {
    color: '#ffcd82',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  metricUnit: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
  },
  alertTextContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  metricAlertText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  layersCard: {
    backgroundColor: 'rgba(20, 41, 58, 0.55)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.12)',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  layersTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressGroup: {
    marginBottom: 14,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
  },
  progressPct: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#0a1822',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  maintAdvice: {
    color: '#ffcd82',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 205, 130, 0.05)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 130, 0.15)',
  },
  btnReset: {
    backgroundColor: '#0ea5e9',
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: 'rgba(14, 165, 233, 0.4)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  btnResetText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
