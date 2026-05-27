# Subfase 1.3: Integración Inicial y Prueba de Conexión Local
## Enlace y Consumo de Datos entre el Emulador Móvil y el Servidor FastAPI

Esta subfase guía la interconexión de tus componentes. Configura tu aplicación móvil en React Native para consumir la API de FastAPI que corre en tu máquina de desarrollo local, superando las restricciones de red típicas de los emuladores Android.

---

## 1. El Reto de la Conexión Local (Explicación Técnica)

Cuando ejecutas un servidor local en tu computadora en `http://localhost:8000`:
* Tu **Emulador de Android** actúa como un dispositivo independiente en una red virtual. Para el emulador, `localhost` (o `127.0.0.1`) es el propio emulador, **no tu computadora**.
* Para comunicarte con tu servidor de desarrollo en la computadora:
  * Desde el **Emulador Android Studio:** Debes apuntar a la IP puente especial: `http://10.0.2.2:8000`.
  * Desde un **Teléfono Físico (Expo Go):** Debes apuntar a la dirección IP de tu computadora en la red Wi-Fi local (ej: `http://192.168.1.15:8000`).

---

## 2. Código de Prueba de Conexión en `App.tsx`

Reemplaza temporalmente el contenido del archivo `E:\AQUORA\mobile\App.tsx` con el siguiente código para verificar que la aplicación móvil puede conectarse de forma bidireccional con tu backend de desarrollo local.

```tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

// DIRECCIÓN DE RED:
// Si usas EMULADOR: Reemplaza con 'http://10.0.2.2:8000'
// Si usas CELULAR REAL: Reemplaza con 'http://TU_IP_LOCAL:8000'
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
```

---

## 3. Protocolo de Validación en Vivo

1. Levanta tu servidor en local ejecutando `uvicorn main:app --reload --host 0.0.0.0 --port 8000` en la carpeta `/backend` (Fase 1.1).
2. Asegúrate de tener el emulador Android de Android Studio encendido.
3. Inicia la aplicación móvil ejecutando `npx expo start` y presionando `a` (Fase 1.2).
4. **Verificación Visual:** La app móvil se abrirá y deberá mostrar el indicador en color **Verde** con el mensaje `"AQUORA API running"`, confirmando que la conexión local está completamente activa.
