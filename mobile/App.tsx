import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

// DIRECCIÓN DE RED:
// Si usas EMULADOR de Android Studio: Reemplaza con 'http://10.0.2.2:8000'
// Si usas CELULAR REAL (Expo Go): Reemplaza con la IP de tu computadora (ej: 'http://192.168.1.15:8000')
const BACKEND_URL = 'http://10.0.2.2:8000'; 

export default function App() {
  const [apiStatus, setApiStatus] = useState<string>('Desconectado');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Realizar petición de salud al API local al montar el componente
    fetch(BACKEND_URL)
      .then((response) => response.json())
      .then((data) => {
        if (data.status) {
          setApiStatus(data.status);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error de conexión API:', error);
        setApiStatus('Falla de Conexión al Servidor');
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌱 AQUORA MOBILE 🌱</Text>
      <Text style={styles.subtitle}>Enlace del Ecosistema Local</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Estado del Servidor API:</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#0ea5e9" />
        ) : (
          <Text style={[
            styles.status, 
            apiStatus === 'AQUORA API running' ? styles.statusConnected : styles.statusFailed
          ]}>
            {apiStatus}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 40,
  },
  card: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusConnected: {
    color: '#10b981', // Verde
  },
  statusFailed: {
    color: '#ef4444', // Rojo
  }
});
