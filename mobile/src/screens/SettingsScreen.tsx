import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsScreenProps {
  backendUrl: string;
  onChangeBackendUrl: (url: string) => void;
  onLogout?: () => void;
}

export default function SettingsScreen({ backendUrl, onChangeBackendUrl, onLogout }: SettingsScreenProps) {
  const [tempUrl, setTempUrl] = useState(backendUrl);
  const [testing, setTesting] = useState(false);
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setTempUrl(backendUrl);
    checkPendingReports();
  }, [backendUrl]);

  const checkPendingReports = async () => {
    try {
      const existingQueue = await AsyncStorage.getItem('@pending_reports');
      const queue = existingQueue ? JSON.parse(existingQueue) : [];
      setPendingCount(queue.length);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    let cleanUrl = tempUrl.trim().replace(/\/$/, "");
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "http://" + cleanUrl;
    }
    
    try {
      await AsyncStorage.setItem('@aquora_backend_url', cleanUrl);
      onChangeBackendUrl(cleanUrl);
      Alert.alert('Configuración Guardada', `URL de API actualizada a: ${cleanUrl}`);
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la configuración.');
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setApiStatus(null);
    try {
      const res = await fetch(tempUrl, { method: 'GET' });
      if (res.ok) {
        setApiStatus('connected');
        Alert.alert('¡Conexión Exitosa!', 'El servidor de AQUORA respondió correctamente.');
      } else {
        setApiStatus('disconnected');
        Alert.alert('Conexión Fallida', 'El servidor respondió con código de error.');
      }
    } catch (err) {
      setApiStatus('disconnected');
      Alert.alert('Conexión Fallida', 'No se pudo establecer conexión con el servidor. Revisa tu IP y red.');
    } finally {
      setTesting(false);
    }
  };

  const forceSync = async () => {
    if (pendingCount === 0) {
      Alert.alert('Cola Vacía', 'No hay reportes pendientes de sincronizar en este momento.');
      return;
    }

    setSyncing(true);
    try {
      const existingQueue = await AsyncStorage.getItem('@pending_reports');
      const queue = existingQueue ? JSON.parse(existingQueue) : [];
      
      const res = await fetch(`${backendUrl}/api/v1/manual-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: queue })
      });

      if (res.ok) {
        await AsyncStorage.removeItem('@pending_reports');
        setPendingCount(0);
        Alert.alert('¡Sincronización Exitosa!', `Se subieron ${queue.length} reportes acumulados a la base de datos.`);
      } else {
        throw new Error('Sync failed');
      }
    } catch (err) {
      Alert.alert('Error de Sincronización', 'El servidor sigue inalcanzable. Se mantienen en el caché local.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.rootContainer}>
      {/* Soft glowing ambient orbs in background */}
      <View style={[styles.glowOrb, { top: '5%', left: '-15%', backgroundColor: 'rgba(14, 165, 233, 0.12)' }]} />
      <View style={[styles.glowOrb, { bottom: '15%', right: '-15%', backgroundColor: 'rgba(255, 205, 130, 0.08)' }]} />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>⚙️ Ajustes del Sistema</Text>
        <Text style={styles.subtitle}>Configura el punto de enlace de red para el territorio de La Guajira</Text>

        {/* API Endpoint Panel */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>URL del Backend API</Text>
          <TextInput
            style={styles.input}
            value={tempUrl}
            onChangeText={setTempUrl}
            placeholder="ej: http://192.168.1.15:8000"
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.btnSecondary]} onPress={testConnection} disabled={testing}>
              {testing ? <ActivityIndicator size="small" color="#0ea5e9" /> : <Text style={styles.btnSecondaryText}>Probar Enlace</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, styles.btnPrimary]} onPress={handleSave}>
              <Text style={styles.btnText}>Guardar</Text>
            </TouchableOpacity>
          </View>

          {apiStatus === 'connected' && (
            <View style={[styles.statusBox, { borderColor: 'rgba(45, 212, 191, 0.3)', backgroundColor: 'rgba(45, 212, 191, 0.06)' }]}>
              <Text style={[styles.statusText, { color: '#2dd4bf' }]}>● Enlace Activo</Text>
            </View>
          )}
          {apiStatus === 'disconnected' && (
            <View style={[styles.statusBox, { borderColor: 'rgba(244, 63, 94, 0.3)', backgroundColor: 'rgba(244, 63, 94, 0.06)' }]}>
              <Text style={[styles.statusText, { color: '#f43f5e' }]}>● Desconectado</Text>
            </View>
          )}
        </View>

        {/* Offline Resiliency Panel */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resiliencia y Almacenamiento Offline</Text>
          <Text style={styles.bodyText}>
            En áreas rurales sin cobertura de datos (3G/4G), las alertas se encolan automáticamente en el caché encriptado del celular.
          </Text>
          
          <View style={styles.syncContainer}>
            <View>
              <Text style={styles.labelCount}>Reportes Offline:</Text>
              <Text style={styles.countText}>{pendingCount}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.button, styles.btnSync, pendingCount === 0 && { opacity: 0.4 }]} 
              onPress={forceSync} 
              disabled={syncing || pendingCount === 0}
            >
              {syncing ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.btnText}>Sincronizar</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Session Settings Panel */}
        {onLogout && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sesión Activa</Text>
            <Text style={styles.bodyText}>
              Estás conectado en la aplicación móvil AQUORA. Para cambiar de operario o desvincular el celular, cierra la sesión.
            </Text>
            
            <TouchableOpacity style={[styles.button, styles.btnDanger]} onPress={onLogout}>
              <Text style={styles.btnText}>🔒 Cerrar Sesión</Text>
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
    marginBottom: 32,
    lineHeight: 18,
  },
  card: {
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
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bodyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#0a1822',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    height: 46,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#0ea5e9',
    shadowColor: 'rgba(14, 165, 233, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 2,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.25)',
  },
  btnDanger: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    shadowColor: 'rgba(244, 63, 94, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 2,
  },
  btnSync: {
    backgroundColor: '#10b981',
    flex: 0,
    paddingHorizontal: 24,
    shadowColor: 'rgba(16, 185, 129, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 2,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  btnSecondaryText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  syncContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a1822',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.06)',
  },
  labelCount: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  countText: {
    color: '#ffcd82',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
});
