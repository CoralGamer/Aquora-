import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';

// Importar pantallas creadas
import QuickReportScreen from './src/screens/QuickReportScreen';
import QRDiagnosticScreen from './src/screens/QRDiagnosticScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { supabase } from './src/services/supabase';

const Tab = createBottomTabNavigator();

export default function App() {
  const [backendUrl, setBackendUrl] = useState<string>('http://10.0.2.2:8000');
  const [loading, setLoading] = useState<boolean>(true);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);

  useEffect(() => {
    // 1. Cargar URL, Estado de Sesión y verificar hardware biométrico al arrancar la app
    const initApp = async () => {
      try {
        const storedUrl = await AsyncStorage.getItem('@aquora_backend_url');
        if (storedUrl) {
          setBackendUrl(storedUrl);
        }
        
        const loggedInStatus = await AsyncStorage.getItem('@aquora_is_logged_in');
        if (loggedInStatus === 'true') {
          setIsLoggedIn(true);
        }

        // Verificar compatibilidad y registro de biometría en el dispositivo
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setHasBiometrics(compatible && enrolled);

        // Pre-cargar el correo guardado si existe para comodidad del usuario
        const savedEmail = await AsyncStorage.getItem('@aquora_saved_email');
        if (savedEmail) {
          setEmailInput(savedEmail);
        }
      } catch (e) {
        console.error('Error cargando inicializaciones:', e);
      } finally {
        setLoading(false);
      }
    };
    initApp();

    // 2. Temporizador automático de 2.5s para la Splash Screen
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleUrlChange = (newUrl: string) => {
    setBackendUrl(newUrl);
  };

  const handleLogin = async () => {
    if (!emailInput.trim()) {
      setLoginError('Por favor ingresa tu correo electrónico.');
      return;
    }
    if (!passwordInput.trim()) {
      setLoginError('Por favor ingresa tu contraseña.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      // Intentar autenticación directa en el servidor de Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput.trim(),
      });

      if (error) {
        setLoginError(error.message || 'Error de credenciales con Supabase Auth.');
        return;
      }

      if (data && data.session) {
        await AsyncStorage.setItem('@aquora_is_logged_in', 'true');
        await AsyncStorage.setItem('@aquora_saved_email', emailInput.trim()); // Guardar para biometría rápida
        setIsLoggedIn(true);
        setPasswordInput('');
      } else {
        setLoginError('No se pudo establecer una sesión activa en Supabase.');
      }
    } catch (e: any) {
      console.error('Error de autenticación con Supabase:', e);
      setLoginError('Falla de red. Verifica tu conexión de datos o de Supabase.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        setLoginError('Este dispositivo no cuenta con hardware biométrico.');
        return;
      }
      
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        setLoginError('No se han registrado datos biométricos (huellas/rostro) en este dispositivo.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticación Biométrica AQUORA',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setLoginLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        await AsyncStorage.setItem('@aquora_is_logged_in', 'true');
        setIsLoggedIn(true);
        // Cargar correo guardado si existe
        const savedEmail = await AsyncStorage.getItem('@aquora_saved_email');
        if (savedEmail) {
          setEmailInput(savedEmail);
        }
      }
    } catch (e) {
      console.error(e);
      setLoginError('Error en autenticación biométrica.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@aquora_is_logged_in');
      setIsLoggedIn(false);
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    }
  };

  // 1. Splash Screen
  if (showSplash || loading) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        {/* Glowing ripple to represent water ripple & intelligence */}
        <View style={styles.glowOuter}>
          <View style={styles.glowInner}>
            <Image 
              source={require('./assets/splash-icon.png')} 
              style={{ width: 70, height: 70, resizeMode: 'contain' }} 
            />
          </View>
        </View>
        <Text style={styles.splashTitle}>AQUORA</Text>
        <Text style={styles.splashSubtitle}>Monitoreo Hídrico de Alta Fidelidad</Text>
        
        <View style={styles.splashFooter}>
          <ActivityIndicator size="small" color="#ffcd82" style={{ marginBottom: 12 }} />
          <Text style={styles.splashFooterText}>Fundación Ábaco · Territorio La Guajira</Text>
        </View>
      </View>
    );
  }

  // 2. Login Screen
  if (!isLoggedIn) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.loginContainer}
      >
        <StatusBar style="light" />
        
        {/* Soft glowing ambient orbs in background */}
        <View style={[styles.glowOrb, { top: '10%', left: '-10%', backgroundColor: 'rgba(14, 165, 233, 0.1)' }]} />
        <View style={[styles.glowOrb, { bottom: '5%', right: '-10%', backgroundColor: 'rgba(255, 205, 130, 0.08)' }]} />

        <ScrollView contentContainerStyle={styles.loginScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.loginHeader}>
            <Image 
              source={require('./assets/icon.png')} 
              style={{ width: 70, height: 70, resizeMode: 'contain', alignSelf: 'center', marginBottom: 15 }} 
            />
            <Text style={styles.loginTitle}>Ecosistema AQUORA</Text>
            <Text style={styles.loginSubtitle}>Operación comunitaria protegida</Text>
          </View>

          <View style={styles.glassCard}>
            <Text style={styles.cardHeader}>Acceso Operador</Text>
            <Text style={styles.cardInfo}>Ingresa tus credenciales autorizadas del territorio piloto.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Identificación o Correo</Text>
              <TextInput
                style={styles.textInput}
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="ejemplo@correo.com"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña Universal del Piloto</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  placeholder="••••••••••••"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '🙈'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {loginError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {loginError}</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TouchableOpacity 
                style={[styles.loginBtn, { flex: 1 }, loginLoading && { opacity: 0.7 }]} 
                onPress={handleLogin}
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.loginBtnText}>🔓 Entrar</Text>
                )}
              </TouchableOpacity>

              {hasBiometrics && (
                <TouchableOpacity 
                  style={styles.biometricBtn} 
                  onPress={handleBiometricAuth}
                >
                  <Text style={styles.biometricBtnText}>👆</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.pilotFooter}>
            Pilot Program v2026 · Enlace Territorial
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // 3. Authenticated App Nav Shell
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0a1822',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(173, 219, 255, 0.1)',
          },
          headerTitleStyle: {
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: 16,
          },
          headerTitleAlign: 'center',
          tabBarStyle: {
            backgroundColor: '#0a1822',
            borderTopWidth: 1,
            borderTopColor: 'rgba(173, 219, 255, 0.1)',
            height: 80,
            paddingBottom: 22,
            paddingTop: 10,
          },
          tabBarActiveTintColor: '#ffcd82', // Oro cálido de Fase 3.5
          tabBarInactiveTintColor: '#8b9bb4', // Slate
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Reportar"
          options={{
            title: 'Reporte Rápido',
            tabBarLabel: 'Reportar',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>💧</Text>
            ),
          }}
        >
          {() => <QuickReportScreen backendUrl={backendUrl} />}
        </Tab.Screen>

        <Tab.Screen
          name="Tecnico"
          options={{
            title: 'Diagnóstico de Filtro',
            tabBarLabel: 'Técnico',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>🔍</Text>
            ),
          }}
        >
          {() => <QRDiagnosticScreen backendUrl={backendUrl} currentUserEmail={emailInput} />}
        </Tab.Screen>

        <Tab.Screen
          name="Ajustes"
          options={{
            title: 'Ajustes de Enlace',
            tabBarLabel: 'Ajustes',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>⚙️</Text>
            ),
          }}
        >
          {() => (
            <SettingsScreen
              backendUrl={backendUrl}
              onChangeBackendUrl={handleUrlChange}
              onLogout={handleLogout}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#07111a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: 'bold',
  },
  /* Splash Screen Styles */
  splashContainer: {
    flex: 1,
    backgroundColor: '#07111a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  glowOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(14, 165, 233, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  glowInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashIcon: {
    fontSize: 48,
  },
  splashTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 6,
    marginBottom: 8,
  },
  splashSubtitle: {
    color: '#8b9bb4',
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  splashFooter: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  splashFooterText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  /* Login Screen Styles */
  loginContainer: {
    flex: 1,
    backgroundColor: '#07111a',
  },
  loginScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  glowOrb: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.5,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loginLogo: {
    fontSize: 40,
    marginBottom: 12,
  },
  loginTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  loginSubtitle: {
    color: '#8b9bb4',
    fontSize: 13,
  },
  glassCard: {
    backgroundColor: 'rgba(20, 41, 58, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.12)',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardInfo: {
    color: '#8b9bb4',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#ffcd82',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#0a1822',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1822',
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.1)',
    borderRadius: 8,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
  },
  eyeBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricBtn: {
    width: 60,
    height: 46,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(173, 219, 255, 0.15)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  biometricBtnText: {
    fontSize: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  loginBtn: {
    backgroundColor: '#0ea5e9',
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pilotFooter: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '600',
  },
});
