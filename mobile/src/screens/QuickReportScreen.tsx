import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, Camera } from 'expo-camera';

type WaterStatus = 'OK' | 'TURBIO' | 'SECO' | 'ROTO';

interface QuickReportScreenProps {
  backendUrl: string;
}

// Componentes de iconos geométricos minimalistas de alta fidelidad (Glassmorphic Line-art)
const TeardropIcon = ({ color }: { color: string }) => (
  <View style={styles.iconWrapper}>
    <View style={[styles.dropletShape, { backgroundColor: color }]} />
    <View style={styles.dropletHighlight} />
  </View>
);

const TurbidIcon = ({ color, ringColor }: { color: string; ringColor: string }) => (
  <View style={styles.iconWrapper}>
    <View style={[styles.dropletShape, { backgroundColor: color }]} />
    <View style={[styles.turbidRing, { borderColor: ringColor }]} />
  </View>
);

const DryIcon = ({ color }: { color: string }) => (
  <View style={styles.iconWrapper}>
    <View style={[styles.circleOutline, { borderColor: color }]}>
      <View style={[styles.crossLine, { backgroundColor: color, transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.crossLine, { backgroundColor: color, transform: [{ rotate: '-45deg' }] }]} />
    </View>
  </View>
);

const MaintenanceIcon = ({ color }: { color: string }) => (
  <View style={styles.iconWrapper}>
    <View style={[styles.circleOutline, { borderColor: color, borderStyle: 'dashed' }]}>
      <View style={styles.gearCoreContainer}>
        <View style={[styles.gearTooth, { backgroundColor: color, transform: [{ rotate: '0deg' }] }]} />
        <View style={[styles.gearTooth, { backgroundColor: color, transform: [{ rotate: '45deg' }] }]} />
        <View style={[styles.gearTooth, { backgroundColor: color, transform: [{ rotate: '90deg' }] }]} />
        <View style={[styles.gearTooth, { backgroundColor: color, transform: [{ rotate: '135deg' }] }]} />
        <View style={styles.gearCenterHole} />
      </View>
    </View>
  </View>
);

export default function QuickReportScreen({ backendUrl }: QuickReportScreenProps) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [deviceKey, setDeviceKey] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(status === 'granted');
    if (status === 'granted') {
      setShowScanner(true);
    } else {
      Alert.alert('Permiso Denegado', 'Se requiere acceso a la cámara para escanear códigos QR en territorio.');
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    let cleanId = data.trim();
    if (cleanId.includes('/')) {
      cleanId = cleanId.split('/').pop() || cleanId;
    }
    setDeviceKey(cleanId);
    setShowScanner(false);
    Alert.alert('Filtro Enlazado', `Dispositivo identificado: ${cleanId}`);
  };

  const confirmReport = (status: WaterStatus) => {
    if (!deviceKey.trim()) {
      Alert.alert('Falta Identificación', 'Por favor, escribe o escanea el código del filtro antes de enviar el reporte hídrico.');
      return;
    }

    const statusNames: Record<WaterStatus, string> = {
      OK: 'Agua Limpia (OK)',
      TURBIO: 'Agua Turbia',
      SECO: 'Sin Agua (Seco)',
      ROTO: 'Filtro Averiado'
    };
    
    Alert.alert(
      'Confirmar Reporte',
      `¿Estás seguro de que deseas enviar un reporte de "${statusNames[status]}" para el dispositivo "${deviceKey}" con tu ubicación GPS actual?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar', onPress: () => handleReport(status) }
      ]
    );
  };

  const handleReport = async (status: WaterStatus) => {
    setLoading(true);
    setLocationStatus('Obteniendo ubicación GPS...');
    try {
      // 1. Solicitar permisos de ubicación en tiempo de ejecución
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (permissionStatus !== 'granted') {
        Alert.alert('Error de Permisos', 'Se requiere acceso al GPS para geolocalizar el reporte en La Guajira.');
        setLoading(false);
        setLocationStatus('');
        return;
      }

      // 2. Capturar coordenadas GPS del dispositivo
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const reportPayload = {
        device_id: deviceKey.trim(),
        status,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        description: description.trim() || undefined,
        timestamp: new Date().toISOString()
      };

      // 3. Guardar en la cola offline y sincronizar
      await queueReport(reportPayload);
      setDescription(''); // Limpiar campo de texto
      
    } catch (error) {
      console.error('Error generando reporte:', error);
      Alert.alert('Error de Conexión', 'No se pudo obtener la ubicación GPS a tiempo.');
    } finally {
      setLoading(false);
      setLocationStatus('');
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
      Alert.alert('Error Local', 'No se pudo guardar el reporte en la memoria interna.');
    }
  };

  const attemptSync = async (queue: any[]) => {
    try {
      const response = await fetch(`${backendUrl}/api/v1/manual-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: queue })
      });

      if (response.ok) {
        // Si el envío es exitoso, limpiar el storage local
        await AsyncStorage.removeItem('@pending_reports');
        Alert.alert(
          '¡Reporte Enviado!', 
          'Tu reporte hídrico fue transmitido con éxito y ya está visible en la consola de control de Ábaco.'
        );
      } else {
        throw new Error('Servidor respondió con código de error');
      }
    } catch (err) {
      // Si falla, se mantiene en caché para ser procesado más tarde sin interrumpir al usuario
      Alert.alert(
        'Modo Offline Activo',
        'Guardamos tu reporte localmente en la memoria del celular. Se sincronizará automáticamente cuando recuperes cobertura celular en territorio.'
      );
    }
  };

  if (showScanner && hasCameraPermission) {
    return (
      <View style={styles.fullscreenScanner}>
        <CameraView
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.overlayScanner}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>ESCÁNER DE FILTRO</Text>
            <Text style={styles.scannerSubtitle}>Alinea el código QR de AQUORA en el recuadro</Text>
          </View>
          
          <View style={styles.reticleContainer}>
            <View style={styles.reticle} />
            <View style={[styles.reticleCorner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[styles.reticleCorner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
            <View style={[styles.reticleCorner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[styles.reticleCorner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
          </View>

          <TouchableOpacity style={styles.btnCancelScanner} onPress={() => setShowScanner(false)}>
            <Text style={styles.btnCancelScannerText}>Cancelar Escaneo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isButtonsDisabled = !deviceKey.trim();

  return (
    <View style={styles.rootContainer}>
      {/* Soft glowing ambient orbs in background */}
      <View style={[styles.glowOrb, { top: '5%', left: '-15%', backgroundColor: 'rgba(14, 165, 233, 0.12)' }]} />
      <View style={[styles.glowOrb, { bottom: '15%', right: '-15%', backgroundColor: 'rgba(255, 205, 130, 0.08)' }]} />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>💧 Reporte Hídrico Rápido</Text>
        <Text style={styles.subtitle}>
          Línea de monitoreo territorial de La Guajira. Habilita y geolocaliza tu alerta:
        </Text>

        {/* Required Filter Identification Card */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>1. Identificación del Filtro (Requerido)</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              value={deviceKey}
              onChangeText={setDeviceKey}
              placeholder="Escribe el ID (Ej: DEV_ESP32_GUAF1)"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.btnScan} onPress={requestCameraPermission}>
              <Text style={styles.btnScanText}>📷 Escanear</Text>
            </TouchableOpacity>
          </View>
          {isButtonsDisabled && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                ⚠️ Ingresa o escanea el identificador del filtro para habilitar los reportes de calidad.
              </Text>
            </View>
          )}
        </View>

        {/* 2. Water Quality Status Cards (Swapped to be higher!) */}
        <Text style={styles.sectionHeader}>2. Reportar Estado de Calidad</Text>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#ffcd82" />
            <Text style={styles.loaderText}>{locationStatus}</Text>
          </View>
        ) : (
          <View style={[styles.grid, isButtonsDisabled && { opacity: 0.35 }]}>
            {/* Tarjeta OK */}
            <TouchableOpacity 
              style={[styles.card, styles.btnOk]} 
              onPress={() => confirmReport('OK')}
              disabled={isButtonsDisabled}
            >
              <View style={styles.cardHeaderGlow} />
              <TeardropIcon color="#2dd4bf" />
              <Text style={styles.cardText}>Agua Limpia</Text>
              <Text style={styles.cardSubtext}>Apta para consumo</Text>
            </TouchableOpacity>

            {/* Tarjeta TURBIO */}
            <TouchableOpacity 
              style={[styles.card, styles.btnTurbio]} 
              onPress={() => confirmReport('TURBIO')}
              disabled={isButtonsDisabled}
            >
              <View style={styles.cardHeaderGlow} />
              <TurbidIcon color="#fbbf24" ringColor="#78350f" />
              <Text style={styles.cardText}>Agua Turbia</Text>
              <Text style={styles.cardSubtext}>Presencia de lodo/óxido</Text>
            </TouchableOpacity>

            {/* Tarjeta SECO */}
            <TouchableOpacity 
              style={[styles.card, styles.btnSeco]} 
              onPress={() => confirmReport('SECO')}
              disabled={isButtonsDisabled}
            >
              <View style={styles.cardHeaderGlow} />
              <DryIcon color="#f43f5e" />
              <Text style={styles.cardText}>Sin Agua</Text>
              <Text style={styles.cardSubtext}>Tanque o pozo vacío</Text>
            </TouchableOpacity>

            {/* Tarjeta ROTO */}
            <TouchableOpacity 
              style={[styles.card, styles.btnRoto]} 
              onPress={() => confirmReport('ROTO')}
              disabled={isButtonsDisabled}
            >
              <View style={styles.cardHeaderGlow} />
              <MaintenanceIcon color="#94a3b8" />
              <Text style={styles.cardText}>Filtro Averiado</Text>
              <Text style={styles.cardSubtext}>Requiere mantenimiento</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input de descripción opcional (Moved below grid) */}
        <View style={[styles.inputCard, { marginTop: 16 }]}>
          <Text style={styles.inputLabel}>3. Detalles Adicionales (Opcional)</Text>
          <TextInput
            style={styles.inputArea}
            value={description}
            onChangeText={setDescription}
            placeholder="Ej: El agua sale con lodo fino..."
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Pie informativo de red resiliente */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📍 Se capturarán coordenadas GPS satelitales para geolocalizar el reporte en el mapa territorial de estrés hídrico.
          </Text>
        </View>
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
  inputCard: {
    backgroundColor: 'rgba(20, 41, 58, 0.55)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.12)',
    padding: 20,
    marginBottom: 16,
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
  inputArea: {
    backgroundColor: '#0a1822',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    height: 72,
  },
  btnScan: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 46,
  },
  btnScanText: {
    color: '#0ea5e9',
    fontSize: 13,
    fontWeight: 'bold',
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 205, 130, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 130, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  warningText: {
    color: '#ffcd82',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  card: {
    width: '47.5%',
    height: 140,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(20, 41, 58, 0.55)',
    borderColor: 'rgba(173, 219, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeaderGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  cardText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
    lineHeight: 13,
  },
  btnOk: {
    borderColor: 'rgba(45, 212, 191, 0.35)',
    backgroundColor: 'rgba(45, 212, 191, 0.05)',
  },
  btnTurbio: {
    borderColor: 'rgba(251, 191, 36, 0.35)',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  btnSeco: {
    borderColor: 'rgba(244, 63, 94, 0.35)',
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
  },
  btnRoto: {
    borderColor: 'rgba(148, 163, 184, 0.35)',
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
  },
  loaderContainer: {
    marginVertical: 30,
    alignItems: 'center',
  },
  loaderText: {
    color: '#ffcd82',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 12,
  },
  infoBox: {
    backgroundColor: 'rgba(173, 219, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.1)',
  },
  infoText: {
    color: '#8b9bb4',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  fullscreenScanner: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlayScanner: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 17, 26, 0.65)',
    paddingVertical: 50,
  },
  scannerHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  scannerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scannerSubtitle: {
    color: '#8b9bb4',
    fontSize: 12,
    textAlign: 'center',
  },
  reticleContainer: {
    width: 240,
    height: 240,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticle: {
    width: 220,
    height: 220,
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
  btnCancelScanner: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  btnCancelScannerText: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    color: '#ffcd82',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dropletShape: {
    width: 20,
    height: 20,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    transform: [{ rotate: '-45deg' }],
  },
  dropletHighlight: {
    position: 'absolute',
    top: 15,
    left: 15,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  turbidRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  circleOutline: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  crossLine: {
    position: 'absolute',
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  gearCoreContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gearTooth: {
    position: 'absolute',
    width: 14,
    height: 3,
    borderRadius: 1,
  },
  gearCenterHole: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#07111a',
    zIndex: 2,
  },
});
